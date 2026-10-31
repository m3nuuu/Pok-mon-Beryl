// Pure battle rules: no Phaser here, so everything is unit-testable.
import { MOVES, type MoveData, type StatKey, type Status } from '../data/moves';
import { SPECIES, type BaseStats } from '../data/species';
import { effectiveness } from '../data/types';

export type Rng = () => number;

export interface MoveSlot {
  id: string;
  pp: number;
}

export interface Pokemon {
  species: string;
  level: number;
  exp: number;
  hp: number;
  moves: MoveSlot[];
  /** Index of the move used last, so the move menu opens on it. */
  lastMove?: number;
  status?: Status;
  sleepTurns?: number;
  /** Held item id. */
  held?: string;
  /** Friendship from time spent together (0-255). High bond gives a small stat and EXP boost. */
  bond?: number;
}

export type Stats = BaseStats;

/** Fixed IVs and no EVs keep early balancing predictable. */
const IV = 15;

/** Stat multiplier from the bond bonus (design doc: Pokémon that stay on the team get a small boost). */
export function bondBoost(p: Pokemon): number {
  const b = p.bond ?? 0;
  return b >= 220 ? 1.1 : b >= 120 ? 1.05 : 1;
}

export function bondHearts(p: Pokemon): number {
  return Math.min(5, Math.floor((p.bond ?? 0) / 50));
}

export function calcStats(p: Pokemon): Stats {
  const b = SPECIES[p.species].base;
  const boost = bondBoost(p);
  const other = (base: number) => Math.floor((Math.floor(((2 * base + IV) * p.level) / 100) + 5) * boost);
  return {
    hp: Math.floor(((2 * b.hp + IV) * p.level) / 100) + p.level + 10,
    atk: other(b.atk),
    def: other(b.def),
    spa: other(b.spa),
    spd: other(b.spd),
    spe: other(b.spe),
  };
}

/** Medium-fast growth curve: total EXP needed to reach a level. */
export function expForLevel(level: number): number {
  return level <= 1 ? 0 : level ** 3;
}

export function movesKnownAt(species: string, level: number): string[] {
  const learned = SPECIES[species].learnset.filter(([lv]) => lv <= level).map(([, id]) => id);
  return learned.slice(-4);
}

export function createPokemon(species: string, level: number): Pokemon {
  const p: Pokemon = {
    species,
    level,
    exp: expForLevel(level),
    hp: 0,
    moves: movesKnownAt(species, level).map((id) => ({ id, pp: MOVES[id].pp })),
  };
  p.hp = calcStats(p).hp;
  return p;
}

export function heal(p: Pokemon): void {
  p.hp = calcStats(p).hp;
  for (const m of p.moves) m.pp = MOVES[m.id].pp;
  delete p.status;
  delete p.sleepTurns;
}

/** The form a trainer's Pokémon would have reached by this level. */
export function evolvedForm(species: string, level: number): string {
  let s = species;
  for (let i = 0; i < 3; i++) {
    const evo = SPECIES[s].evolvesTo;
    if (!evo || level < evo.level) break;
    s = evo.species;
  }
  return s;
}

/** A trainer's Pokémon: evolved for its level, with an optional fixed moveset. */
export function trainerMon(species: string, level: number, moves?: string[]): Pokemon {
  const p = createPokemon(evolvedForm(species, level), level);
  if (moves?.length) {
    p.moves = moves.slice(0, 4).map((id) => ({ id, pp: MOVES[id].pp }));
  }
  return p;
}

/** The species this Pokémon evolves into now, if its level is high enough. */
export function evolutionFor(p: Pokemon): string | null {
  const evo = SPECIES[p.species].evolvesTo;
  return evo && p.level >= evo.level ? evo.species : null;
}

/** Turns the Pokémon into its evolution, keeping its damage taken. Returns moves learned on the spot. */
export function evolve(p: Pokemon, into: string): string[] {
  const before = calcStats(p).hp;
  p.species = into;
  p.hp = Math.max(1, p.hp + calcStats(p).hp - before);
  const learned: string[] = [];
  for (const [lv, id] of SPECIES[into].learnset) {
    if (lv === p.level && !p.moves.some((m) => m.id === id)) learned.push(id);
  }
  return learned;
}

export function expYield(defeated: Pokemon, fromTrainer: boolean): number {
  const base = SPECIES[defeated.species].expYield;
  return Math.max(1, Math.floor(((base * defeated.level) / 7) * (fromTrainer ? 1.5 : 1)));
}

export interface LevelUp {
  level: number;
  learned: string[];
  /** Moves it could learn but has no free slot for; the caller asks which move to forget. */
  pending: string[];
}

/** EXP multiplier from the bond bonus. */
export function bondExp(p: Pokemon): number {
  const b = p.bond ?? 0;
  return b >= 220 ? 1.2 : b >= 120 ? 1.1 : 1;
}

export function addBond(p: Pokemon, n: number): void {
  p.bond = Math.min(255, (p.bond ?? 0) + n);
}

/** Adds EXP and returns one entry per level gained. HP rises by the max-HP increase. */
export function gainExp(p: Pokemon, amount: number, maxLevel = 100): LevelUp[] {
  const ups: LevelUp[] = [];
  p.exp += amount;
  while (p.level < maxLevel && p.exp >= expForLevel(p.level + 1)) {
    const before = calcStats(p).hp;
    p.level += 1;
    p.hp += calcStats(p).hp - before;
    const learned: string[] = [];
    const pending: string[] = [];
    for (const [lv, id] of SPECIES[p.species].learnset) {
      if (lv !== p.level || p.moves.some((m) => m.id === id)) continue;
      if (p.moves.length < 4) {
        p.moves.push({ id, pp: MOVES[id].pp });
        learned.push(id);
      } else {
        pending.push(id);
      }
    }
    addBond(p, 1);
    ups.push({ level: p.level, learned, pending });
  }
  return ups;
}

export type Stages = Record<StatKey, number>;

export interface Battler {
  mon: Pokemon;
  stages: Stages;
}

export function newBattler(mon: Pokemon): Battler {
  return { mon, stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } };
}

export function stageMultiplier(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

export function effectiveStat(b: Battler, stat: StatKey): number {
  const v = Math.floor(calcStats(b.mon)[stat] * stageMultiplier(b.stages[stat]));
  return stat === 'spe' && b.mon.status === 'par' ? Math.floor(v / 4) : v;
}

export interface DamageResult {
  missed: boolean;
  damage: number;
  effectiveness: number;
  crit: boolean;
}

export function calcDamage(attacker: Battler, defender: Battler, move: MoveData, rng: Rng): DamageResult {
  const result: DamageResult = { missed: false, damage: 0, effectiveness: 1, crit: false };
  if (move.accuracy > 0 && rng() * 100 >= move.accuracy) {
    result.missed = true;
    return result;
  }
  if (move.category === 'status') return result;

  const defTypes = SPECIES[defender.mon.species].types;
  result.effectiveness = effectiveness(move.type, defTypes);
  if (result.effectiveness === 0) return result;

  const physical = move.category === 'physical';
  const atk = effectiveStat(attacker, physical ? 'atk' : 'spa');
  const def = effectiveStat(defender, physical ? 'def' : 'spd');
  const level = attacker.mon.level;

  let dmg = Math.floor(Math.floor((Math.floor((2 * level) / 5) + 2) * move.power * atk / def) / 50) + 2;
  if (physical && attacker.mon.status === 'brn') dmg = Math.floor(dmg / 2);
  result.crit = rng() < (move.highCrit ? 1 / 8 : 1 / 16);
  if (result.crit) dmg *= 2;
  if (SPECIES[attacker.mon.species].types.includes(move.type)) dmg = Math.floor(dmg * 1.5);
  dmg = Math.floor(dmg * result.effectiveness);
  dmg = Math.floor((dmg * (85 + Math.floor(rng() * 16))) / 100);
  result.damage = Math.max(1, dmg);
  return result;
}

/** Applies a stat-stage move. Returns the actual change (0 if already at the limit). */
export function applyStage(target: Battler, stat: StatKey, stages: number): number {
  const before = target.stages[stat];
  target.stages[stat] = Math.max(-6, Math.min(6, before + stages));
  return target.stages[stat] - before;
}

/** True if `a` moves before `b` this turn. */
export function goesFirst(a: Battler, aMove: MoveData, b: Battler, bMove: MoveData, rng: Rng): boolean {
  const pa = aMove.priority ?? 0;
  const pb = bMove.priority ?? 0;
  if (pa !== pb) return pa > pb;
  const sa = effectiveStat(a, 'spe');
  const sb = effectiveStat(b, 'spe');
  if (sa !== sb) return sa > sb;
  return rng() < 0.5;
}

/** Gym level for the next badge; wild Pokémon stay 6–8 levels below it (design rule). */
export function gymLevel(badges: number): number {
  return 12 + badges * 6;
}

/** Base level of a trainer's team, by kind of trainer. */
export function trainerBase(badges: number, tier: 'route' | 'gym' | 'leader' | 'boss'): number {
  const off = { route: -5, gym: -3, leader: 0, boss: -1 }[tier];
  return Math.max(3, gymLevel(badges) + off);
}

export function wildLevel(badges: number, rng: Rng): number {
  const top = gymLevel(badges) - 6;
  return Math.max(2, top - Math.floor(rng() * 3));
}

/** Gen III wild escape formula, simplified. */
export function canEscape(player: Battler, wild: Battler, attempts: number, rng: Rng): boolean {
  const ps = effectiveStat(player, 'spe');
  const ws = Math.max(1, effectiveStat(wild, 'spe'));
  if (ps >= ws) return true;
  const odds = Math.floor((ps * 128) / ws) + 30 * attempts;
  return rng() * 256 < odds;
}

/** Rough value of a move against a target, for the trainer AI. */
export function moveScore(user: Battler, target: Battler, move: MoveData): number {
  if (move.category === 'status') {
    if (move.status) return target.mon.status || !canInflict(target.mon, move.status) ? 0 : 45;
    if (move.heal) return user.mon.hp < calcStats(user.mon).hp / 2 ? 60 : 0;
    if (move.selfStat) return user.stages[move.selfStat[0].stat] >= 2 ? 5 : 30;
    if (move.targetStat) return target.stages[move.targetStat.stat] <= -2 ? 5 : 20;
    return 1;
  }
  const eff = effectiveness(move.type, SPECIES[target.mon.species].types);
  const stab = SPECIES[user.mon.species].types.includes(move.type) ? 1.5 : 1;
  const acc = move.accuracy > 0 ? move.accuracy / 100 : 1;
  return move.power * eff * stab * acc;
}

/** Wild Pokémon pick at random; smart trainers usually pick their best move. */
export function pickEnemyMove(b: Battler, rng: Rng, target?: Battler, smart = false): MoveSlot {
  const usable = b.mon.moves.filter((m) => m.pp > 0);
  const pool = usable.length ? usable : b.mon.moves;
  if (target && smart && rng() < 0.8) {
    let best = pool[0], bestScore = -1;
    for (const m of pool) {
      const sc = moveScore(b, target, MOVES[m.id]) * (0.85 + rng() * 0.3);
      if (sc > bestScore) { best = m; bestScore = sc; }
    }
    return best;
  }
  return pool[Math.floor(rng() * pool.length)];
}

// --- status conditions -----------------------------------------------------------

export const STATUS_NAMES: Record<Status, string> = { psn: 'PSN', brn: 'BRN', par: 'PAR', slp: 'SLP', frz: 'FRZ' };

/** Types that are immune to a status (Fire can't burn, Poison and Steel can't be poisoned...). */
export function canInflict(p: Pokemon, status: Status): boolean {
  const t = SPECIES[p.species].types;
  if (p.status || p.hp <= 0) return false;
  if (status === 'brn') return !t.includes('Fire');
  if (status === 'psn') return !t.includes('Poison') && !t.includes('Steel');
  if (status === 'frz') return !t.includes('Ice');
  if (status === 'par') return !t.includes('Electric');
  return true;
}

export function inflict(p: Pokemon, status: Status, rng: Rng): boolean {
  if (!canInflict(p, status)) return false;
  p.status = status;
  if (status === 'slp') p.sleepTurns = 1 + Math.floor(rng() * 3);
  return true;
}

export type BeforeMove = { act: true; msg?: string } | { act: false; msg: string };

/** Checks sleep, freeze and paralysis before a Pokémon moves. */
export function beforeMove(p: Pokemon, rng: Rng): BeforeMove {
  if (p.status === 'slp') {
    p.sleepTurns = (p.sleepTurns ?? 1) - 1;
    if (p.sleepTurns <= 0) {
      delete p.status;
      delete p.sleepTurns;
      return { act: true, msg: 'woke up!' };
    }
    return { act: false, msg: 'is fast asleep.' };
  }
  if (p.status === 'frz') {
    if (rng() < 0.2) {
      delete p.status;
      return { act: true, msg: 'thawed out!' };
    }
    return { act: false, msg: 'is frozen solid!' };
  }
  if (p.status === 'par' && rng() < 0.25) return { act: false, msg: "is paralyzed! It can't move!" };
  return { act: true };
}

/** Poison and burn damage at the end of a turn (1/8 of max HP). */
export function statusDamage(p: Pokemon): number {
  if (p.hp <= 0 || (p.status !== 'psn' && p.status !== 'brn')) return 0;
  const d = Math.max(1, Math.floor(calcStats(p).hp / 8));
  p.hp = Math.max(0, p.hp - d);
  return d;
}

/**
 * Splits battle EXP between the Pokémon that fought and the EXP. Share holder.
 * `share` is the slider value in percent: how much of the EXP goes to the holder.
 */
export function splitExp(total: number, fighters: Pokemon[], holder: Pokemon | null, share: number): Map<Pokemon, number> {
  const out = new Map<Pokemon, number>();
  const add = (p: Pokemon, n: number) => out.set(p, (out.get(p) ?? 0) + n);
  const alive = fighters.filter((p) => p.hp > 0);
  let forFighters = total;
  if (holder && holder.hp > 0 && !(alive.length === 1 && alive[0] === holder)) {
    const h = Math.floor((total * share) / 100);
    add(holder, h);
    forFighters = total - h;
  }
  if (alive.length) {
    const each = Math.floor(forFighters / alive.length);
    for (const p of alive) add(p, each);
  }
  for (const [p, n] of out) out.set(p, Math.floor(n * bondExp(p)));
  for (const [p, n] of out) if (n <= 0) out.delete(p);
  return out;
}

/** Rival takes the starter with the type advantage over the player's pick. */
export function rivalStarterFor(playerStarter: string): string {
  return ({ mossfawn: 'cindaroo', newtide: 'mossfawn', cindaroo: 'newtide' } as Record<string, string>)[playerStarter];
}

/**
 * Gen III catch check. Returns how many times the ball shakes (0-3),
 * or 4 when the Pokémon is caught.
 */
export function catchShakes(wild: Pokemon, ballBonus: number, rng: Rng): number {
  const max = calcStats(wild).hp;
  const rate = SPECIES[wild.species].catchRate ?? 190;
  const statusBonus = wild.status === 'slp' || wild.status === 'frz' ? 2 : wild.status ? 1.5 : 1;
  const a = Math.floor((((3 * max - 2 * wild.hp) * rate * ballBonus) / (3 * max)) * statusBonus);
  if (a >= 255) return 4;
  const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a))));
  let shakes = 0;
  while (shakes < 4 && Math.floor(rng() * 65536) < b) shakes++;
  return shakes;
}

/** How much HP a healing item restores, capped at the missing HP. */
export function healBy(p: Pokemon, amount: number): number {
  const missing = calcStats(p).hp - p.hp;
  const healed = Math.min(missing, amount);
  p.hp += healed;
  return healed;
}

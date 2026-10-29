// Pure battle rules: no Phaser here, so everything is unit-testable.
import { MOVES, type MoveData, type StatKey } from '../data/moves';
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
}

export type Stats = BaseStats;

/** Fixed IVs and no EVs keep early balancing predictable. */
const IV = 15;

export function calcStats(p: Pokemon): Stats {
  const b = SPECIES[p.species].base;
  const other = (base: number) => Math.floor(((2 * base + IV) * p.level) / 100) + 5;
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
}

export function expYield(defeated: Pokemon, fromTrainer: boolean): number {
  const base = SPECIES[defeated.species].expYield;
  return Math.max(1, Math.floor(((base * defeated.level) / 7) * (fromTrainer ? 1.5 : 1)));
}

export interface LevelUp {
  level: number;
  learned: string[];
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
    for (const [lv, id] of SPECIES[p.species].learnset) {
      if (lv === p.level && p.moves.length < 4 && !p.moves.some((m) => m.id === id)) {
        p.moves.push({ id, pp: MOVES[id].pp });
        learned.push(id);
      }
    }
    ups.push({ level: p.level, learned });
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
  return Math.floor(calcStats(b.mon)[stat] * stageMultiplier(b.stages[stat]));
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
  result.crit = rng() < 1 / 16;
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
  return 12 + badges * 7;
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

export function pickEnemyMove(b: Battler, rng: Rng): MoveSlot {
  const usable = b.mon.moves.filter((m) => m.pp > 0);
  const pool = usable.length ? usable : b.mon.moves;
  return pool[Math.floor(rng() * pool.length)];
}

/** Rival takes the starter with the type advantage over the player's pick. */
export function rivalStarterFor(playerStarter: string): string {
  return ({ mossfawn: 'cindaroo', newtide: 'mossfawn', cindaroo: 'newtide' } as Record<string, string>)[playerStarter];
}

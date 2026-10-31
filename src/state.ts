import { calcStats, movesKnownAt, type Pokemon } from './battle/engine';
import { MOVES } from './data/moves';
import { SPECIES } from './data/species';
import type { MapId } from './data/mapkit';

export type Facing = 'down' | 'up' | 'left' | 'right';

export interface GameState {
  party: Pokemon[];
  /** Caught Pokémon that didn't fit in the party of six. */
  box: Pokemon[];
  /** Item id → count. */
  bag: Record<string, number>;
  badges: number;
  flags: Record<string, boolean>;
  player: { map: MapId; x: number; y: number; facing: Facing };
  money: number;
  /** Pokédex: species seen and caught. */
  seen: Record<string, boolean>;
  caught: Record<string, boolean>;
  playMs: number;
  /** Town of the last Pokémon Center used; whiting out returns there. */
  lastCenter?: string;
  /** EXP. Share slider: percent of battle EXP that goes to the holder. */
  expShare: number;
  /** An egg being carried: hatches after this many steps. */
  egg?: { species: string; steps: number };
  repel: number;
  /** Trainer ID shown on the trainer card. */
  trainerId: number;
  /** Which ending was chosen at the dam: 'break', 'seal' or 'gate'. */
  ending?: 'break' | 'seal' | 'gate';
}

const SAVE_KEY = 'pokemon-beryl-save-v2';

/** New game: Beryl wakes up next to his bed. */
export const START_POSITION = { map: 'home' as MapId, x: 2, y: 3, facing: 'down' as Facing };

/** Where Beryl ends up after whiting out: in front of his house. */
export const HOME_DOOR = { map: 'stillbrook' as MapId, x: 4, y: 8, facing: 'down' as Facing };

export function newGame(): GameState {
  return {
    party: [], box: [], bag: {}, badges: 0, flags: {}, player: { ...START_POSITION },
    money: 3000, seen: {}, caught: {}, playMs: 0, expShare: 50, repel: 0,
    trainerId: Math.floor(Math.random() * 65536),
  };
}

/** The single live game state shared by all scenes. */
export const game: { state: GameState } = { state: newGame() };

export function save(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game.state));
  } catch {
    // Storage can be unavailable (private mode); the game still runs.
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export function load(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    game.state = { ...newGame(), ...(JSON.parse(raw) as GameState) };
    const s = game.state;
    s.party = s.party.filter((p) => SPECIES[p.species]);
    s.box = s.box.filter((p) => SPECIES[p.species]);
    for (const p of [...s.party, ...s.box]) repair(p);
    for (const p of [...game.state.party, ...game.state.box]) register(p.species, true);
    return true;
  } catch {
    return false;
  }
}

/** Fixes Pokémon from old or hand-edited saves: unknown moves, no moves, HP above the maximum. */
function repair(p: Pokemon): void {
  p.moves = (p.moves ?? []).filter((m) => MOVES[m.id]);
  if (!p.moves.length) p.moves = movesKnownAt(p.species, p.level).map((id) => ({ id, pp: MOVES[id].pp }));
  p.hp = Math.max(0, Math.min(p.hp ?? 0, calcStats(p).hp));
}

/** Marks a species as caught (and seen) in the Pokédex. */
export function register(species: string, caught: boolean): void {
  game.state.seen[species] = true;
  if (caught) game.state.caught[species] = true;
}

/** Adds a Pokémon to the party, or to the PC box when the party is full. Returns 'party' or 'box'. */
export function receive(p: Pokemon): 'party' | 'box' {
  register(p.species, true);
  if (game.state.party.length < 6) {
    game.state.party.push(p);
    return 'party';
  }
  game.state.box.push(p);
  return 'box';
}

export function addItem(id: string, n = 1): void {
  const bag = game.state.bag;
  bag[id] = (bag[id] ?? 0) + n;
}

/** Uses up one of an item; false if there is none. */
export function takeItem(id: string): boolean {
  const bag = game.state.bag;
  if (!bag[id]) return false;
  bag[id] -= 1;
  if (bag[id] <= 0) delete bag[id];
  return true;
}

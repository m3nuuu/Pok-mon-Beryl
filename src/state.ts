import type { Pokemon } from './battle/engine';
import type { MapId } from './data/maps';

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
}

const SAVE_KEY = 'pokemon-beryl-save-v2';

/** New game: Beryl wakes up next to his bed. */
export const START_POSITION = { map: 'home' as MapId, x: 2, y: 3, facing: 'down' as Facing };

/** Where Beryl ends up after whiting out: in front of his house. */
export const HOME_DOOR = { map: 'stillbrook' as MapId, x: 4, y: 8, facing: 'down' as Facing };

export function newGame(): GameState {
  return { party: [], box: [], bag: {}, badges: 0, flags: {}, player: { ...START_POSITION } };
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
    return true;
  } catch {
    return false;
  }
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

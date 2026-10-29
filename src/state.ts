import type { Pokemon } from './battle/engine';

export type Facing = 'down' | 'up' | 'left' | 'right';

export interface GameState {
  party: Pokemon[];
  badges: number;
  flags: Record<string, boolean>;
  player: { x: number; y: number; facing: Facing };
}

const SAVE_KEY = 'pokemon-beryl-save-v1';

export const START_POSITION = { x: 4, y: 8, facing: 'down' as Facing };

export function newGame(): GameState {
  return { party: [], badges: 0, flags: {}, player: { ...START_POSITION } };
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

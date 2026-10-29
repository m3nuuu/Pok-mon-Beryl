import type { Pokemon } from '../battle/engine';
import type { MapId } from '../data/maps';
import type { BattleResult } from '../scenes/BattleScene';
import type { Facing } from '../state';

/** What story scripts can do. Implemented by the WorldScene; every call resolves when it has finished on screen. */
export interface ScriptApi {
  readonly mapId: MapId;
  say(...lines: string[]): Promise<void>;
  yesNo(question: string): Promise<boolean>;
  pickStarter(): Promise<string>;
  battle(cfg: { kind: 'wild' | 'trainer'; trainerName?: string; enemy: Pokemon; canLose?: boolean; bg?: 'plain' | 'water' | 'indoor' }): Promise<BattleResult>;
  /** Walks an NPC (or 'player') along a list of directions. */
  walk(who: string, dirs: Facing[]): Promise<void>;
  face(who: string, dir: Facing): void;
  /** Turns an NPC towards the player. */
  faceBeryl(who: string): void;
  emote(who: string, kind: 'heart' | 'exclaim'): Promise<void>;
  /** Re-checks which NPCs should be visible after flags changed. */
  refresh(): void;
  /** Fades to the new place; `whileDark` runs before it fades back in. */
  warp(map: MapId, x: number, y: number, facing: Facing, whileDark?: () => void): Promise<void>;
  fadeOut(ms?: number): Promise<void>;
  fadeIn(ms?: number): Promise<void>;
  setEvening(on: boolean): void;
  /** Lethys rises from the river at a tile, lingers, and sinks back. */
  lethysAppears(x: number, y: number): Promise<void>;
  wait(ms: number): Promise<void>;
  whiteOut(): Promise<void>;
}

import type { Pokemon } from '../battle/engine';
import type { BattleBg, MapId } from '../data/mapkit';
import type { BattleResult } from '../scenes/BattleScene';
import type { Facing } from '../state';

export interface BattleRequest {
  kind: 'wild' | 'trainer';
  trainerName?: string;
  enemy?: Pokemon;
  enemies?: Pokemon[];
  /** Losing doesn't white out (rival battles). */
  canLose?: boolean;
  bg?: BattleBg;
  /** Trainer uses its best moves. */
  smart?: boolean;
  /** Prize money per level of the last Pokémon. */
  prize?: number;
  /** A legendary encounter: shown with a special intro. */
  legendary?: boolean;
}

/** What story scripts can do. Implemented by the WorldScene; every call resolves when it has finished on screen. */
export interface ScriptApi {
  readonly mapId: MapId;
  playerPos(): { x: number; y: number; facing: Facing };
  say(...lines: string[]): Promise<void>;
  yesNo(question: string): Promise<boolean>;
  /** A menu of choices; resolves with the index (or -1 when cancelled). */
  choose(items: string[], cancel?: boolean): Promise<number>;
  pickStarter(): Promise<string>;
  battle(cfg: BattleRequest): Promise<BattleResult>;
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
  /** Lethys rises from the water at a tile, lingers, and sinks back. */
  lethysAppears(x: number, y: number, scale?: number): Promise<void>;
  wait(ms: number): Promise<void>;
  whiteOut(): Promise<void>;
  /** Screen shake, for rumbling dams and explosions. */
  shake(ms?: number): Promise<void>;
  /** Plays the end credits; resolves when they are done. */
  credits(lines: string[]): Promise<void>;
  /** Places a temporary NPC on the current map (removed on the next map change). */
  spawn(id: string, look: string, x: number, y: number, facing: Facing): void;
  despawn(id: string): void;
}

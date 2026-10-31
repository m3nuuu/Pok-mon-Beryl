// Shared map types and helpers. The maps themselves live in src/data/world/.
import type { Facing } from '../state';

export type Flags = Record<string, boolean>;
export type MapId = string;
export type Cond = (f: Flags) => boolean;

/** Ground style for outdoor maps; changes how grass, trees and paths are drawn. */
export type Theme = 'grass' | 'snow' | 'cave' | 'marsh' | 'city' | 'dam' | 'center' | 'home' | 'shrine' | 'dark'
  | `gym-${string}`;

export type BattleBg = 'plain' | 'water' | 'indoor' | 'cave' | 'snow' | 'marsh' | 'night';

/** Building kinds and their footprint; the door sits on the bottom row, `door` tiles from the left. */
export const KINDS = {
  home: { w: 5, h: 4, door: 2, label: "Beryl's house" },
  jasper: { w: 5, h: 4, door: 2, label: "Jasper's house" },
  neighbor: { w: 6, h: 4, door: 2, label: "Hazel's house" },
  gym: { w: 7, h: 5, door: 3, label: 'Gym' },
  center: { w: 6, h: 4, door: 2, label: 'Pokémon Center' },
  house: { w: 5, h: 4, door: 2, label: 'House (orange roof)' },
  house2: { w: 5, h: 4, door: 2, label: 'House (purple roof)' },
  house3: { w: 5, h: 4, door: 2, label: 'House (teal roof)' },
  pension: { w: 7, h: 4, door: 3, label: 'Pokémon Pension' },
  shrine: { w: 5, h: 5, door: 2, label: 'Lantern shrine' },
  office: { w: 8, h: 5, door: 3, label: 'Dam company office' },
  plant: { w: 8, h: 5, door: 3, label: 'Power plant' },
  pump: { w: 4, h: 3, door: 1, label: 'Pump station' },
  ruin: { w: 5, h: 4, door: 2, label: 'Ruined house' },
  cabin: { w: 5, h: 4, door: 2, label: 'Snowy cabin' },
  league: { w: 9, h: 6, door: 4, label: 'Pokémon League' },
} as const;

export type BuildingKind = keyof typeof KINDS;

export interface Building {
  id: BuildingKind;
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number };
}

export function bld(id: BuildingKind, x: number, y: number): Building {
  const k = KINDS[id];
  return { id, x, y, w: k.w, h: k.h, door: { x: x + k.door, y: y + k.h - 1 } };
}

export interface Warp {
  x: number;
  y: number;
  to: MapId;
  tx: number;
  ty: number;
  facing: Facing;
  /** Closed while this is false; `locked` is said instead. */
  when?: Cond;
  locked?: string[];
}

export type Side = 'north' | 'south' | 'east' | 'west';

/** Walking off an edge between `from` and `to` (inclusive) leads to `map`, at coordinate + offset. */
export interface Exit {
  side: Side;
  from: number;
  to: number;
  map: MapId;
  offset: number;
}

export interface TeamMon {
  species: string;
  /** Level relative to the trainer's base level (or absolute for `fixed` trainers). */
  lv: number;
  moves?: string[];
}

export type Tier = 'route' | 'gym' | 'leader' | 'boss' | 'fixed';

export interface TrainerDef {
  name: string;
  team: TeamMon[];
  tier?: Tier;
  /** Prize money per level of the last Pokémon. */
  prize?: number;
  intro: string[];
  /** Said by the trainer right after losing, back on the map. */
  defeat: string[];
  /** Said when talked to again later. */
  after?: string[];
  /** How many tiles it looks ahead; 0 means it only battles when talked to. */
  sight?: number;
  bg?: BattleBg;
  /** Leaders only bring 2 + badges/2 of their team (always including the last one, their ace). */
  scaleTeam?: boolean;
  /** Badge given on defeat. */
  badge?: { flag: string; name: string };
  /** Item given on defeat. */
  reward?: { id: string; n?: number };
  /** Uses its best moves (gym leaders, rivals, bosses). */
  smart?: boolean;
}

export interface NpcDef {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: Facing;
  /** Character look (see LOOKS), `mon-<species>` for a Pokémon, or `ball` for an item on the ground. */
  look: string;
  when?: Cond;
  /** Plain lines; story scripts can override by id. */
  text?: string[];
  trainer?: TrainerDef;
  item?: { id: string; n?: number };
}

export interface MapDef {
  id: MapId;
  name: string;
  kind: 'outdoor' | 'indoor';
  theme?: Theme;
  rows: string[];
  buildings: Building[];
  warps: Warp[];
  exits?: Exit[];
  npcs: NpcDef[];
  /** Text shown when the player faces a tile and presses A, keyed "x,y". */
  inspect: Record<string, string[]>;
  encounters?: [string, number][];
  /** Tile that triggers wild encounters (default tall grass). */
  encounterTile?: string;
  /** Areas with their own encounter table, like the lava pool in Emberdeep. */
  zones?: { x0: number; y0: number; x1: number; y1: number; encounters: [string, number][] }[];
  fishing?: [string, number][];
  battleBg?: BattleBg;
  /** Town this map belongs to, for FLY and the Pokémon Center respawn. */
  town?: string;
}

/*
 * Outdoor legend:
 *   T tree / rock wall (by theme)  R cliff rock   O boulder    W dam wall    V spillway   E dam door
 *   . ground       , tall grass     : path         P pavement   s sand        ~ water      = bridge
 *   d dock         F flowers        f fence        L lantern    l lava        B building   D door
 *   S sign         C cave mouth
 * Indoor legend:
 *   # dark wall top   W wall      w window       s shelf (soft toy)   _ floor   b bed
 *   T table           k kitchen   p plant        v TV                 B books   o pen fence
 *   X exit mat        c PC        r counter      m goods shelf        g statue  a mural
 *   z machine         ~ water     l lantern          H floor hatch (warp)
 */
const SOLID = new Set([
  'T', 'R', 'O', 'W', 'V', 'E', '~', 'f', 'L', 'l', 'B', 'S',
  '#', 'w', 's', 'b', 'k', 'p', 'v', 'o', 'c', 'r', 'm', 'g', 'a', 'z',
]);
const WARP_TILES = new Set(['D', 'X', 'C', 'H']);

export function isSolidTile(c: string): boolean {
  return SOLID.has(c);
}

export function isWarpTile(c: string): boolean {
  return WARP_TILES.has(c);
}

export function tileAt(map: MapDef, x: number, y: number): string {
  if (y < 0 || y >= map.rows.length || x < 0 || x >= map.rows[0].length) return map.kind === 'indoor' ? '#' : 'T';
  return map.rows[y][x];
}

export function width(map: MapDef): number {
  return map.rows[0].length;
}

/** The exit used when stepping from (x,y) off the map edge, if any. */
export function exitAt(map: MapDef, x: number, y: number): { exit: Exit; tx: number; ty: number } | null {
  const w = width(map), h = map.rows.length;
  const side: Side | null = y < 0 ? 'north' : y >= h ? 'south' : x < 0 ? 'west' : x >= w ? 'east' : null;
  if (!side) return null;
  const along = side === 'north' || side === 'south' ? x : y;
  const exit = map.exits?.find((e) => e.side === side && along >= e.from && along <= e.to);
  if (!exit) return null;
  return { exit, ...arrival(exit, along) };
}

/** Where the player lands on the other map after taking an exit. */
export function arrival(exit: Exit, along: number, maps: Record<MapId, MapDef> = registry): { tx: number; ty: number } {
  const target = maps[exit.map];
  const c = along + exit.offset;
  switch (exit.side) {
    case 'north': return { tx: c, ty: target.rows.length - 1 };
    case 'south': return { tx: c, ty: 0 };
    case 'west': return { tx: width(target) - 1, ty: c };
    case 'east': return { tx: 0, ty: c };
  }
}

/** Filled by maps.ts once every map is loaded. */
export const registry: Record<MapId, MapDef> = {};

// --- conditions ---------------------------------------------------------------------

export const has = (flag: string): Cond => (f) => !!f[flag];
export const before = (flag: string): Cond => (f) => !f[flag];
export const between = (from: string, until: string): Cond => (f) => !!f[from] && !f[until];
export const all = (...cs: Cond[]): Cond => (f) => cs.every((c) => c(f));

export function badgeCount(f: Flags): number {
  return Object.keys(f).filter((k) => k.startsWith('badge_') && f[k]).length;
}

export const badges = (n: number): Cond => (f) => badgeCount(f) >= n;

// --- builders -------------------------------------------------------------------------

/** A trainer standing on the map who battles on sight. */
export function trainer(
  id: string, x: number, y: number, facing: Facing, look: string, t: TrainerDef, when?: Cond,
): NpcDef {
  return { id, name: t.name, x, y, facing, look, trainer: { sight: 4, tier: 'route', prize: 20, ...t }, when };
}

export function person(id: string, name: string, x: number, y: number, facing: Facing, look: string, text: string[], when?: Cond): NpcDef {
  return { id, name, x, y, facing, look, text, when };
}

/** An item ball lying on the map; picked up once. */
export function ball(mapId: string, x: number, y: number, item: string, n = 1): NpcDef {
  const flag = `item_${mapId}_${x}_${y}`;
  return { id: flag, name: 'ITEM', x, y, facing: 'down', look: 'ball', item: { id: item, n }, when: before(flag) };
}

export const mons = (...pairs: [string, number][]): [string, number][] => pairs;

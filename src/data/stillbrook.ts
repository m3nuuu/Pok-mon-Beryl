import type { Facing } from '../state';

/**
 * Stillbrook, Beryl's home town just below the Mirrormere Dam.
 *
 * Legend:
 *   T tree        W dam wall      V spillway     E dam door
 *   . grass       , tall grass    : path         ~ river Lethys
 *   = bridge      F flowers       f fence        B building (drawn on top)
 *   S sign
 */
export const STILLBROOK_ROWS = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TWWWWWWWWWWWWWWWWWWWWVVVWWWWWWWT',
  'TWWWWWWWWWEWWWWWWWWWWVVVWWWWWWWT',
  'TT........:..........~~~,,,,,,.T',
  'TTBBBBB...:SBBBBB....~~~,,,,,,.T',
  'TTBBBBBFF.:.BBBBB.F..~~~,,,TT,.T',
  'TTBBBBBF..:.BBBBB.F..~~~,,,TT,.T',
  'TTBBBBB...:.BBBBB....~~~,,,,,,.T',
  'TT::::::::::::::::::.~~~,,,,,,.T',
  'TT.......:.S.........~~~,,,,,,.T',
  'TTfffff..:...........~~~.......T',
  'TT.......::::::::::::===::::::.T',
  'TT.......:...........~~~.......T',
  'TT.......:...F.F.....~~~.,,,,,.T',
  'TT.BBBBBBB....F.F....~~~.,,,,,.T',
  'TT.BBBBBBB...........~~~.,,,,,.T',
  'TT.BBBBBBB...........~~~.,,,,,.T',
  'TT.BBBBBBB...TTTT....~~~.,,,,,.T',
  'TT.BBBBBBBS..TTTT....~~~.,,,,,.T',
  'TT....::::...........~~~.,,,,,.T',
  'TTTTT....:.......FF..~~~.,,,,,.T',
  'TTTTT....:..F........~~~.......T',
  'TTTTT....:S..........~~~.......T',
  'TTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTT',
];

export const MAP_W = STILLBROOK_ROWS[0].length;
export const MAP_H = STILLBROOK_ROWS.length;

export function tileAt(x: number, y: number): string {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'T';
  return STILLBROOK_ROWS[y][x];
}

const SOLID = new Set(['T', 'W', 'V', 'E', '~', 'f', 'B', 'S']);

export function isSolidTile(c: string): boolean {
  return SOLID.has(c);
}

export interface Building {
  id: 'home' | 'jasper' | 'gym';
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number };
}

export const BUILDINGS: Building[] = [
  { id: 'home', x: 2, y: 4, w: 5, h: 4, door: { x: 4, y: 7 } },
  { id: 'jasper', x: 12, y: 4, w: 5, h: 4, door: { x: 14, y: 7 } },
  { id: 'gym', x: 3, y: 14, w: 7, h: 5, door: { x: 6, y: 18 } },
];

export const SIGNS: Record<string, string[]> = {
  '11,9': ['STILLBROOK', 'Where the Lethys leaves the dam.'],
  '11,4': ['MIRRORMERE DAM', 'Staff entrance ahead. No unauthorized visitors.'],
  '10,18': ['STILLBROOK GYM', 'Type: Fighting. The doors are locked today.'],
  '10,22': ['ROUTE 1', 'South to Lanterncross. Closed for now: this is the end of the prototype!'],
};

export type NpcId = 'spruce' | 'jasper' | 'guard' | 'fisher' | 'neighbor';

export interface NpcDef {
  id: NpcId;
  name: string;
  x: number;
  y: number;
  facing: Facing;
  look: string;
}

export const NPCS: NpcDef[] = [
  { id: 'spruce', name: 'PROF. SPRUCE', x: 8, y: 9, facing: 'left', look: 'spruce' },
  { id: 'jasper', name: 'JASPER', x: 7, y: 9, facing: 'up', look: 'jasper' },
  { id: 'guard', name: 'DAM GUARD', x: 10, y: 3, facing: 'down', look: 'guard' },
  { id: 'fisher', name: 'FISHERMAN', x: 20, y: 15, facing: 'right', look: 'fisher' },
  { id: 'neighbor', name: 'NEIGHBOR', x: 15, y: 15, facing: 'down', look: 'neighbor' },
];

/** Wild Pokémon in Stillbrook's tall grass: [species, weight]. */
export const ENCOUNTERS: [string, number][] = [
  ['pipwing', 100],
];

export const ENCOUNTER_RATE = 1 / 10;

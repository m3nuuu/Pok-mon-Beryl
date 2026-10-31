// Interiors that share one layout: Pokémon Centers, Gyms and small houses.
import type { Facing } from '../../state';
import { bld, type Building, type BuildingKind, type MapDef, type NpcDef, type Theme, type Warp } from '../mapkit';

/** A door warp from an outdoor map into an interior, and the matching warp back out. */
export function doorTo(b: Building, to: string, tx: number, ty: number, extra: Partial<Warp> = {}): Warp {
  return { x: b.door.x, y: b.door.y, to, tx, ty, facing: 'up', ...extra };
}

function exitTo(x: number, y: number, map: string, door: { x: number; y: number }): Warp {
  return { x, y, to: map, tx: door.x, ty: door.y + 1, facing: 'down' };
}

/** Center entry tile (one step in from the mat). */
export const CENTER_IN = { x: 6, y: 6 };

export function centerMap(town: string, townName: string, outside: string, b: Building): MapDef {
  return {
    id: `center_${town}`,
    name: `${townName} POKéMON CENTER`,
    kind: 'indoor',
    theme: 'center',
    town,
    rows: [
      '#############',
      '#WWWWWwWWWWW#',
      '#__________m#',
      '#rrrrrrrrrrr#',
      '#___________#',
      '#c_________p#',
      '#__TT___TT__#',
      '#p____X____p#',
      '#############',
    ],
    buildings: [],
    warps: [exitTo(6, 7, outside, b.door)],
    npcs: [
      { id: 'nurse', name: 'NURSE', x: 3, y: 2, facing: 'down', look: 'nurse' },
      { id: 'clerk', name: 'CLERK', x: 9, y: 2, facing: 'down', look: 'clerk' },
    ],
    inspect: {
      '1,5': ['PC'],
      '11,2': ['Shelves full of POTIONS and POKé BALLS.'],
    },
  };
}

export const GYM_IN = { x: 7, y: 11 };

export function gymMap(town: string, townName: string, type: string, outside: string, b: Building, npcs: NpcDef[]): MapDef {
  return {
    id: `gym_${town}`,
    name: `${townName} GYM`,
    kind: 'indoor',
    theme: `gym-${type}` as Theme,
    town,
    rows: [
      '###############',
      '#WWWWWWWWWWWWW#',
      '#_____________#',
      '#_g_________g_#',
      '#_____________#',
      '#_____________#',
      '#_____________#',
      '#_____________#',
      '#_____________#',
      '#_____________#',
      '#_g_________g_#',
      '#_____________#',
      '#______X______#',
      '###############',
    ],
    buildings: [],
    warps: [exitTo(7, 12, outside, b.door)],
    npcs,
    inspect: {
      '2,10': [`${townName} GYM`, `Type: ${type.toUpperCase()}`],
      '12,10': [`${townName} GYM`, `Type: ${type.toUpperCase()}`],
      '2,3': ['A statue of the GYM LEADER, polished to a shine.'],
      '12,3': ['A statue of the GYM LEADER, polished to a shine.'],
    },
  };
}

export const HOUSE_IN = { x: 4, y: 5 };

/** A small house; NPCs stand at the given spots. */
export function houseMap(id: string, name: string, outside: string, b: Building, npcs: NpcDef[], inspect: Record<string, string[]> = {}, theme: Theme = 'home'): MapDef {
  return {
    id,
    name,
    kind: 'indoor',
    theme,
    rows: [
      '##########',
      '#WwWWBWwW#',
      '#________#',
      '#__TT__b_#',
      '#__TT__b_#',
      '#p______p#',
      '#___X____#',
      '##########',
    ],
    buildings: [],
    warps: [exitTo(4, 6, outside, b.door)],
    npcs,
    inspect: { '5,1': ['A shelf of old books about the LETHYS.'], ...inspect },
  };
}

/** Builds a building plus its interior warp. */
export function entrance(kind: BuildingKind, x: number, y: number, to: string, inside: { x: number; y: number }, extra: Partial<Warp> = {}) {
  const b = bld(kind, x, y);
  return { b, warp: doorTo(b, to, inside.x, inside.y, extra) };
}

export type { Facing };

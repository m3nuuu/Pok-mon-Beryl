import type { Type } from './types';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface SpeciesData {
  id: string;
  dex: string;
  name: string;
  types: Type[];
  base: BaseStats;
  /** Base EXP yield when defeated. */
  expYield: number;
  /** [level, moveId] pairs, learned on reaching that level. */
  learnset: [number, string][];
  sprite: string;
  evolvesTo?: { species: string; level: number };
}

// Names and types follow the Pokédex doc. Base stats are first-pass numbers for the prototype.
const list: SpeciesData[] = [
  {
    id: 'mossfawn', dex: '001', name: 'Mossfawn', types: ['Grass'],
    base: { hp: 45, atk: 58, def: 50, spa: 42, spd: 52, spe: 55 }, expYield: 62,
    learnset: [[1, 'tackle'], [1, 'growl'], [5, 'leafage'], [9, 'rockthrow']],
    sprite: '001.png', evolvesTo: { species: 'mossbuck', level: 16 },
  },
  {
    id: 'mossbuck', dex: '002', name: 'Mossbuck', types: ['Grass'],
    base: { hp: 60, atk: 75, def: 65, spa: 55, spd: 65, spe: 65 }, expYield: 142,
    learnset: [[1, 'tackle'], [1, 'growl'], [1, 'leafage'], [1, 'rockthrow']],
    sprite: '002.png', evolvesTo: { species: 'mosshart', level: 36 },
  },
  {
    id: 'mosshart', dex: '003', name: 'Mosshart', types: ['Grass', 'Dark'],
    base: { hp: 80, atk: 105, def: 80, spa: 70, spd: 80, spe: 85 }, expYield: 236,
    learnset: [[1, 'tackle'], [1, 'leafage'], [1, 'rockthrow']], sprite: '003.png',
  },
  {
    id: 'newtide', dex: '004', name: 'Newtide', types: ['Water'],
    base: { hp: 50, atk: 48, def: 52, spa: 54, spd: 50, spe: 48 }, expYield: 62,
    learnset: [[1, 'tackle'], [1, 'tailwhip'], [5, 'watergun'], [9, 'quickattack']],
    sprite: '004.png', evolvesTo: { species: 'tidemander', level: 16 },
  },
  {
    id: 'tidemander', dex: '005', name: 'Tidemander', types: ['Water'],
    base: { hp: 65, atk: 62, def: 68, spa: 72, spd: 65, spe: 63 }, expYield: 142,
    learnset: [[1, 'tackle'], [1, 'tailwhip'], [1, 'watergun']],
    sprite: '005.png', evolvesTo: { species: 'tidrake', level: 36 },
  },
  {
    id: 'tidrake', dex: '006', name: 'Tidrake', types: ['Water', 'Flying'],
    base: { hp: 82, atk: 80, def: 80, spa: 98, spd: 85, spe: 95 }, expYield: 236,
    learnset: [[1, 'watergun'], [1, 'gust']], sprite: '006.png',
  },
  {
    id: 'cindaroo', dex: '007', name: 'Cindaroo', types: ['Fire'],
    base: { hp: 44, atk: 56, def: 43, spa: 56, spd: 46, spe: 60 }, expYield: 62,
    learnset: [[1, 'scratch'], [1, 'growl'], [5, 'ember'], [9, 'quickattack']],
    sprite: '007.png', evolvesTo: { species: 'marrowroo', level: 16 },
  },
  {
    id: 'marrowroo', dex: '008', name: 'Marrowroo', types: ['Fire'],
    base: { hp: 58, atk: 72, def: 58, spa: 72, spd: 60, spe: 78 }, expYield: 142,
    learnset: [[1, 'scratch'], [1, 'growl'], [1, 'ember']],
    sprite: '008.png', evolvesTo: { species: 'spectaroo', level: 36 },
  },
  {
    id: 'spectaroo', dex: '009', name: 'Spectaroo', types: ['Fire', 'Ghost'],
    base: { hp: 75, atk: 95, def: 72, spa: 95, spd: 80, spe: 100 }, expYield: 236,
    learnset: [[1, 'ember'], [1, 'astonish']], sprite: '009.png',
  },
  {
    id: 'murkfin', dex: '010', name: 'Murkfin', types: ['Water'],
    base: { hp: 30, atk: 20, def: 50, spa: 20, spd: 40, spe: 60 }, expYield: 40,
    learnset: [[1, 'splash'], [10, 'tackle']], sprite: '010.png',
  },
  {
    id: 'murkeel', dex: '011', name: 'Murkeel', types: ['Water', 'Electric'],
    base: { hp: 80, atk: 85, def: 75, spa: 100, spd: 85, spe: 90 }, expYield: 189,
    learnset: [[1, 'tackle'], [1, 'watergun'], [1, 'thundershock']], sprite: '011.png',
  },
  {
    id: 'pipwing', dex: '012', name: 'Pipwing', types: ['Flying'],
    base: { hp: 38, atk: 45, def: 38, spa: 32, spd: 36, spe: 58 }, expYield: 50,
    learnset: [[1, 'peck'], [1, 'growl'], [8, 'quickattack']],
    sprite: '012.png', evolvesTo: { species: 'rivetwing', level: 18 },
  },
  {
    id: 'rivetwing', dex: '013', name: 'Rivetwing', types: ['Flying', 'Steel'],
    base: { hp: 55, atk: 65, def: 70, spa: 40, spd: 50, spe: 75 }, expYield: 122,
    learnset: [[1, 'peck'], [1, 'growl'], [1, 'quickattack']],
    sprite: '013.png', evolvesTo: { species: 'jetwing', level: 34 },
  },
  {
    id: 'jetwing', dex: '014', name: 'Jetwing', types: ['Flying', 'Steel'],
    base: { hp: 70, atk: 95, def: 85, spa: 50, spd: 65, spe: 115 }, expYield: 218,
    learnset: [[1, 'peck'], [1, 'quickattack']], sprite: '014.png',
  },
  {
    id: 'lethys', dex: 'L01', name: 'Lethys', types: ['Water', 'Ghost'],
    base: { hp: 105, atk: 80, def: 95, spa: 120, spd: 110, spe: 90 }, expYield: 300,
    learnset: [[1, 'watergun'], [1, 'astonish']], sprite: 'lethys.png',
  },
];

export const SPECIES: Record<string, SpeciesData> = Object.fromEntries(list.map((s) => [s.id, s]));
export const SPECIES_LIST = list;
export const STARTERS = ['mossfawn', 'newtide', 'cindaroo'] as const;

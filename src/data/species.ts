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
  /** File in public/sprites. Species without one get a placeholder until Manuel draws it. */
  sprite?: string;
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
    id: 'caddibuzz', dex: '021', name: 'Caddibuzz', types: ['Bug'],
    base: { hp: 40, atk: 45, def: 35, spa: 30, spd: 35, spe: 65 }, expYield: 52,
    learnset: [[1, 'tackle'], [1, 'leer'], [6, 'bugbite'], [12, 'quickattack'], [17, 'rockthrow']],
    sprite: '021.png', evolvesTo: { species: 'caddicairn', level: 22 },
  },
  {
    id: 'caddicairn', dex: '022', name: 'Caddicairn', types: ['Bug', 'Rock'],
    base: { hp: 70, atk: 95, def: 110, spa: 45, spd: 65, spe: 55 }, expYield: 158,
    learnset: [[1, 'bugbite'], [1, 'rockthrow'], [27, 'silverwind'], [33, 'rockslide'], [40, 'xscissor']],
    sprite: '022.png',
  },
  {
    id: 'hivecub', dex: '023', name: 'Hivecub', types: ['Fairy'],
    base: { hp: 50, atk: 60, def: 45, spa: 40, spd: 45, spe: 30 }, expYield: 60,
    learnset: [[1, 'tackle'], [1, 'growl'], [6, 'fairywind'], [10, 'covet'], [14, 'faketears']],
    sprite: '023.png', evolvesTo: { species: 'hivebruin', level: 18 },
  },
  {
    id: 'hivebruin', dex: '024', name: 'Hivebruin', types: ['Fairy'],
    base: { hp: 75, atk: 85, def: 65, spa: 55, spd: 60, spe: 45 }, expYield: 138,
    learnset: [[1, 'covet'], [1, 'fairywind'], [22, 'swarmstrike'], [27, 'charm'], [32, 'slam']],
    sprite: '024.png', evolvesTo: { species: 'hivekeeper', level: 38 },
  },
  {
    id: 'hivekeeper', dex: '025', name: 'Hivekeeper', types: ['Fairy', 'Fighting'],
    base: { hp: 105, atk: 125, def: 90, spa: 65, spd: 85, spe: 55 }, expYield: 232,
    learnset: [[1, 'rocksmash'], [1, 'swarmstrike'], [1, 'slam'], [38, 'honeyhug'], [44, 'hammerarm'], [50, 'playrough']],
    sprite: '025.png',
  },
  {
    id: 'pixling', dex: '026', name: 'Pixling', types: ['Electric'],
    base: { hp: 40, atk: 30, def: 35, spa: 60, spd: 45, spe: 55 }, expYield: 58,
    learnset: [[1, 'peck'], [1, 'growl'], [5, 'thundershock'], [11, 'quickattack'], [16, 'shockwave']],
    sprite: '026.png', evolvesTo: { species: 'pixmallard', level: 20 },
  },
  {
    id: 'pixmallard', dex: '027', name: 'Pixmallard', types: ['Electric'],
    base: { hp: 60, atk: 45, def: 55, spa: 85, spd: 65, spe: 80 }, expYield: 140,
    learnset: [[1, 'thundershock'], [1, 'shockwave'], [24, 'wingattack'], [30, 'visorbeam']],
    sprite: '027.png', evolvesTo: { species: 'pixcygnus', level: 38 },
  },
  {
    id: 'pixcygnus', dex: '028', name: 'Pixcygnus', types: ['Electric', 'Flying'],
    base: { hp: 80, atk: 60, def: 70, spa: 115, spd: 85, spe: 110 }, expYield: 234,
    learnset: [[1, 'visorbeam'], [1, 'wingattack'], [38, 'airslash'], [46, 'thunderbolt']], sprite: '028.png',
  },
  {
    id: 'wispjel', dex: '029', name: 'Wispjel', types: ['Ghost', 'Electric'],
    base: { hp: 55, atk: 40, def: 50, spa: 85, spd: 70, spe: 70 }, expYield: 120,
    learnset: [[1, 'astonish'], [1, 'thundershock'], [12, 'shockwave'], [24, 'plasmagrasp'], [32, 'shadowball']],
    sprite: '029.png', evolvesTo: { species: 'wispedusa', level: 38 },
  },
  {
    id: 'wispedusa', dex: '030', name: 'Wispedusa', types: ['Ghost', 'Electric'],
    base: { hp: 80, atk: 60, def: 75, spa: 125, spd: 105, spe: 100 }, expYield: 240,
    learnset: [[1, 'plasmagrasp'], [1, 'shadowball'], [44, 'thunderbolt']], sprite: '030.png',
  },
  {
    id: 'lochlet', dex: '031', name: 'Lochlet', types: ['Water'],
    base: { hp: 75, atk: 55, def: 60, spa: 55, spd: 65, spe: 40 }, expYield: 110,
    learnset: [[1, 'watergun'], [1, 'growl'], [10, 'bite'], [20, 'ancientpower'], [30, 'reefsong']],
    sprite: '031.png', evolvesTo: { species: 'lochoral', level: 42 },
  },
  {
    id: 'lochoral', dex: '032', name: 'Lochoral', types: ['Water', 'Dragon'],
    base: { hp: 120, atk: 85, def: 95, spa: 95, spd: 100, spe: 60 }, expYield: 260,
    learnset: [[1, 'reefsong'], [1, 'bite'], [42, 'dragonbreath'], [48, 'bodyslam'], [55, 'surf']],
    sprite: '032.png',
  },
  {
    id: 'raptide', dex: '033', name: 'Raptide', types: ['Rock', 'Water'],
    base: { hp: 45, atk: 90, def: 65, spa: 40, spd: 45, spe: 70 }, expYield: 119,
    learnset: [[1, 'scratch'], [1, 'leer'], [7, 'watergun'], [13, 'rockthrow'], [19, 'quickattack'], [31, 'gemlash']],
    sprite: '033.png', evolvesTo: { species: 'raptorrent', level: 40 },
  },
  {
    id: 'raptorrent', dex: '034', name: 'Raptorrent', types: ['Rock', 'Water'],
    base: { hp: 65, atk: 125, def: 90, spa: 60, spd: 70, spe: 90 }, expYield: 201,
    learnset: [[1, 'gemlash'], [1, 'quickattack'], [40, 'slash'], [46, 'waterfall'], [52, 'rockslide']],
    sprite: '034.png',
  },
  {
    id: 'geodling', dex: '035', name: 'Geodling', types: ['Rock'],
    base: { hp: 60, atk: 50, def: 85, spa: 70, spd: 55, spe: 35 }, expYield: 119,
    learnset: [[1, 'tackle'], [1, 'leer'], [7, 'rockthrow'], [13, 'twister'], [19, 'ancientpower'], [31, 'powergem']],
    sprite: '035.png', evolvesTo: { species: 'geodragon', level: 40 },
  },
  {
    id: 'geodragon', dex: '036', name: 'Geodragon', types: ['Rock', 'Dragon'],
    base: { hp: 85, atk: 70, def: 105, spa: 115, spd: 75, spe: 45 }, expYield: 199,
    learnset: [[1, 'powergem'], [1, 'twister'], [40, 'dragonbreath'], [46, 'dragonclaw'], [52, 'geodeburst']],
    sprite: '036.png',
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

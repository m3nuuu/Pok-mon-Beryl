import type { Facing } from '../state';

export type Flags = Record<string, boolean>;
export type MapId = 'stillbrook' | 'home' | 'jasperHome' | 'pension';

export interface Building {
  id: 'home' | 'jasper' | 'gym' | 'pension';
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number };
}

export interface Warp {
  x: number;
  y: number;
  to: MapId;
  tx: number;
  ty: number;
  facing: Facing;
}

export interface NpcDef {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: Facing;
  /** Character look (see LOOKS) or `mon-<species>` for a Pokémon shown in the overworld. */
  look: string;
  /** Only present while this returns true. */
  when?: (f: Flags) => boolean;
}

export interface MapDef {
  id: MapId;
  name: string;
  kind: 'outdoor' | 'indoor';
  rows: string[];
  buildings: Building[];
  warps: Warp[];
  npcs: NpcDef[];
  /** Text shown when the player faces a tile and presses A, keyed "x,y". */
  inspect: Record<string, string[]>;
  encounters?: [string, number][];
}

/*
 * Outdoor legend:
 *   T tree        W dam wall      V spillway     E dam door
 *   . grass       , tall grass    : path         ~ river Lethys
 *   = bridge      d dock          F flowers      f fence
 *   B building    D door          S sign
 * Indoor legend:
 *   # dark wall top   W wall      w window       s shelf (soft toy)
 *   _ floor           b bed       T table        k kitchen counter
 *   p plant           v TV        B bookshelf    o pen fence
 *   X exit mat
 */
const SOLID = new Set(['T', 'W', 'V', 'E', '~', 'f', 'B', 'S', '#', 'w', 's', 'b', 'k', 'p', 'v', 'o']);

export function isSolidTile(c: string): boolean {
  return SOLID.has(c);
}

export function tileAt(map: MapDef, x: number, y: number): string {
  if (y < 0 || y >= map.rows.length || x < 0 || x >= map.rows[0].length) return map.kind === 'indoor' ? '#' : 'T';
  return map.rows[y][x];
}

const before = (flag: string) => (f: Flags) => !f[flag];
const between = (from: string, until: string) => (f: Flags) => !!f[from] && !f[until];

const stillbrook: MapDef = {
  id: 'stillbrook',
  name: 'STILLBROOK',
  kind: 'outdoor',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TWWWWWWWWWWWWWWWWWWWWVVVWWWWWWWT',
    'TWWWWWWWWWEWWWWWWWWWWVVVWWWWWWWT',
    'TT........:..........~~~,,,,,,.T',
    'TTBBBBB...:SBBBBB....~~~,,,,,,.T',
    'TTBBBBBFF.:.BBBBB.F..~~~,,,TT,.T',
    'TTBBBBBF..:.BBBBB.F..~~~,,,TT,.T',
    'TTBBDBB...:.BBDBB....~~~,,,,,,.T',
    'TT::::::::::::::::::.~~~,,,,,,.T',
    'TT.......:.S.........~~~,,,,,,.T',
    'TTfffff..:...........~~~.......T',
    'TT.......::::::::::::===::::::.T',
    'TT.......:..BBBBBB...~~~.......T',
    'TT.......:.FBBBBBBFF.~~~.,,,,,.T',
    'TT.BBBBBBB..BBBBBB...~~~.,,,,,.T',
    'TT.BBBBBBB..BBDBBBS..~~~.,,,,,.T',
    'TT.BBBBBBB....:::::::~~~.,,,,,.T',
    'TT.BBBBBBB..........:~~~.,,,,,.T',
    'TT.BBBDBBBS.........:~~~.,,,,,.T',
    'TT....::::...TTTT...:d~~.,,,,,.T',
    'TTTTT....:...TTTTF...d~~.,,,,,.T',
    'TTTTT....:..FTTTT.F..~~~.......T',
    'TTTTT....:S..........~~~.......T',
    'TTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTT',
  ],
  buildings: [
    { id: 'home', x: 2, y: 4, w: 5, h: 4, door: { x: 4, y: 7 } },
    { id: 'jasper', x: 12, y: 4, w: 5, h: 4, door: { x: 14, y: 7 } },
    { id: 'gym', x: 3, y: 14, w: 7, h: 5, door: { x: 6, y: 18 } },
    { id: 'pension', x: 12, y: 12, w: 6, h: 4, door: { x: 14, y: 15 } },
  ],
  warps: [
    { x: 4, y: 7, to: 'home', tx: 5, ty: 7, facing: 'up' },
    { x: 14, y: 7, to: 'jasperHome', tx: 4, ty: 5, facing: 'up' },
    { x: 14, y: 15, to: 'pension', tx: 5, ty: 7, facing: 'up' },
  ],
  npcs: [
    { id: 'jasper', name: 'JASPER', x: 4, y: 9, facing: 'up', look: 'jasper', when: between('gotStarter', 'taskGiven') },
    { id: 'spruce', name: 'PROF. SPRUCE', x: 6, y: 8, facing: 'left', look: 'spruce', when: between('gotStarter', 'taskGiven') },
    { id: 'grandma', name: 'GRANDMA', x: 2, y: 8, facing: 'right', look: 'grandma', when: between('gotStarter', 'taskGiven') },
    { id: 'jasper', name: 'JASPER', x: 15, y: 8, facing: 'down', look: 'jasper', when: (f) => !!f.prologueDone },
    { id: 'guard', name: 'DAM GUARD', x: 10, y: 3, facing: 'down', look: 'guard' },
    { id: 'fisher', name: 'FISHERMAN', x: 20, y: 13, facing: 'right', look: 'fisher' },
    { id: 'neighbor', name: 'NEIGHBOR', x: 8, y: 12, facing: 'down', look: 'neighbor' },
    { id: 'ferry', name: 'FERRY KEEPER', x: 20, y: 20, facing: 'right', look: 'ferry', when: (f) => !!f.taskGiven },
  ],
  inspect: {
    '11,9': ['STILLBROOK', 'Where the Lethys leaves the dam.'],
    '11,4': ['MIRRORMERE DAM', 'Staff entrance ahead. No unauthorized visitors.'],
    '10,18': ['STILLBROOK GYM', 'Type: Fighting. The doors are locked today.'],
    '18,15': ['STILLBROOK POKéMON PENSION', 'We look after your POKéMON with love!'],
    '10,22': ['ROUTE 1', 'South to Lanterncross. The road opens in the next chapter!'],
    '10,2': ["It's locked. A plate reads: MIRRORMERE DAM - STAFF ONLY."],
    '6,18': ["The GYM is locked. A note says: 'Training at the river. Back at dusk!'"],
  },
  encounters: [['pipwing', 100]],
};

const home: MapDef = {
  id: 'home',
  name: "BERYL'S HOUSE",
  kind: 'indoor',
  rows: [
    '############',
    '#WwWWsWWwWk#',
    '#b_______kk#',
    '#b_________#',
    '#____TT____#',
    '#____TT____#',
    '#__________#',
    '#p_______vB#',
    '#____X_____#',
    '############',
  ],
  buildings: [],
  warps: [{ x: 5, y: 8, to: 'stillbrook', tx: 4, ty: 8, facing: 'down' }],
  npcs: [
    { id: 'mum', name: 'MUM', x: 4, y: 4, facing: 'right', look: 'mum', when: before('parentsLeft') },
    { id: 'dad', name: 'DAD', x: 7, y: 5, facing: 'left', look: 'dad', when: before('parentsLeft') },
    { id: 'grandma', name: 'GRANDMA', x: 8, y: 3, facing: 'down', look: 'grandma', when: (f) => !(f.gotStarter && !f.taskGiven) },
    { id: 'homemon', name: 'FAMILY POKéMON', x: 3, y: 6, facing: 'down', look: 'homemon', when: (f) => !f.parentsLeft || !!f.gotStarter },
    { id: 'spruce', name: 'PROF. SPRUCE', x: 7, y: 4, facing: 'left', look: 'spruce', when: between('metJasperMom', 'gotStarter') },
    { id: 'jasper', name: 'JASPER', x: 4, y: 6, facing: 'right', look: 'jasper', when: between('metJasperMom', 'gotStarter') },
  ],
  inspect: {
    '5,1': ['A soft toy of LETHYS, the river serpent. You have had it since you were tiny.'],
    '9,7': ['The TV shows the weather: sunny over the whole LETHYS valley.'],
    '10,7': ['Old books about the river. One is called "Kaldria Before the Dam".'],
    '9,2': ['It smells like fresh bread.'],
    '10,2': ['It smells like fresh bread.'],
    '1,2': ['Your bed. Still warm.'],
    '1,3': ['Your bed. Still warm.'],
  },
};

const jasperHome: MapDef = {
  id: 'jasperHome',
  name: "JASPER'S HOUSE",
  kind: 'indoor',
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
  warps: [{ x: 4, y: 6, to: 'stillbrook', tx: 14, ty: 8, facing: 'down' }],
  npcs: [
    { id: 'jasperDad', name: "JASPER'S DAD", x: 2, y: 2, facing: 'down', look: 'jasperDad' },
    { id: 'jasper', name: 'JASPER', x: 6, y: 4, facing: 'left', look: 'jasper', when: before('metJasperDad') },
  ],
  inspect: {
    '5,1': ['A shelf full of FIGHTING-type training manuals.'],
    '7,3': ["Jasper's bed. It's a mess."],
    '7,4': ["Jasper's bed. It's a mess."],
  },
};

const pension: MapDef = {
  id: 'pension',
  name: 'POKéMON PENSION',
  kind: 'indoor',
  rows: [
    '############',
    '#WwWkkkkWwW#',
    '#__________#',
    '#oooo__oooo#',
    '#o__o__o__o#',
    '#o__o__o__o#',
    '#oooo__oooo#',
    '#p________p#',
    '#____X_____#',
    '############',
  ],
  buildings: [],
  warps: [{ x: 5, y: 8, to: 'stillbrook', tx: 14, ty: 16, facing: 'down' }],
  npcs: [
    { id: 'jasperMom', name: "JASPER'S MUM", x: 5, y: 2, facing: 'down', look: 'jasperMom' },
    { id: 'jasper', name: 'JASPER', x: 6, y: 3, facing: 'up', look: 'jasper', when: between('metJasperDad', 'metJasperMom') },
    { id: 'penPipwing', name: 'PIPWING', x: 2, y: 4, facing: 'down', look: 'mon-pipwing' },
    { id: 'penMurkfin', name: 'MURKFIN', x: 9, y: 5, facing: 'down', look: 'mon-murkfin' },
  ],
  inspect: {
    '2,3': ['PIPWING is dozing in the sun.'],
    '4,4': ['PIPWING is dozing in the sun.'],
    '9,3': ['MURKFIN splashes around in its water bowl.'],
    '7,5': ['MURKFIN splashes around in its water bowl.'],
  },
};

export const MAPS: Record<MapId, MapDef> = { stillbrook, home, jasperHome, pension };

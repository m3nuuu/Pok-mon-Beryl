// Placeholder pixel art drawn in code, so the prototype ships with no third-party assets.
// Every texture here is meant to be replaced by real tiles/sprites later.
import Phaser from 'phaser';
import { KINDS, bld, type Building, type BuildingKind } from '../data/mapkit';
import type { SpeciesData } from '../data/species';
import type { Type } from '../data/types';

type Ctx = CanvasRenderingContext2D;

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  if (scene.textures.exists(key)) return scene.textures.get(key) as Phaser.Textures.CanvasTexture;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  tex.refresh();
  return tex;
}

function r(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

const G = { base: '#88d070', dark: '#5aa848', light: '#b8e898' };

function grass(c: Ctx) {
  r(c, 0, 0, 16, 16, G.base);
  for (const [x, y] of [[2, 3], [10, 2], [6, 9], [12, 12], [1, 13]]) {
    r(c, x, y + 1, 1, 1, G.dark);
    r(c, x + 1, y, 1, 1, G.dark);
    r(c, x + 2, y + 1, 1, 1, G.dark);
    r(c, x + 1, y + 1, 1, 1, G.light);
  }
}

function tallGrass(c: Ctx) {
  r(c, 0, 0, 16, 16, '#4c9c40');
  for (const bx of [0, 8]) {
    for (const by of [0, 8]) {
      r(c, bx + 1, by + 2, 6, 5, '#3c8c38');
      r(c, bx + 1, by + 1, 1, 3, '#a0e078');
      r(c, bx + 3, by, 1, 4, '#a0e078');
      r(c, bx + 5, by + 1, 1, 3, '#a0e078');
      r(c, bx + 2, by + 3, 1, 3, '#68b858');
      r(c, bx + 4, by + 2, 1, 4, '#68b858');
      r(c, bx, by + 7, 8, 1, '#2c6c2c');
    }
  }
}

function path(c: Ctx) {
  r(c, 0, 0, 16, 16, '#e4cc94');
  for (const [x, y] of [[3, 2], [11, 5], [6, 11], [13, 13], [1, 8]]) r(c, x, y, 2, 1, '#c8ac70');
  for (const [x, y] of [[8, 3], [2, 13], [12, 9]]) r(c, x, y, 1, 1, '#f4e4bc');
}

function flowers(c: Ctx) {
  grass(c);
  const flower = (x: number, y: number, petal: string) => {
    r(c, x + 1, y, 1, 1, petal);
    r(c, x, y + 1, 3, 1, petal);
    r(c, x + 1, y + 2, 1, 1, petal);
    r(c, x + 1, y + 1, 1, 1, '#f8d838');
  };
  flower(2, 2, '#f05858');
  flower(10, 4, '#ffffff');
  flower(5, 10, '#ffffff');
  flower(12, 11, '#f05858');
}

function tree(c: Ctx) {
  grass(c);
  r(c, 6, 11, 4, 5, '#7a5030');
  r(c, 6, 11, 1, 5, '#5a3820');
  const dark = '#2c6c34', mid = '#44984a', light = '#78c860';
  r(c, 4, 0, 8, 1, dark);
  r(c, 2, 1, 12, 1, dark);
  r(c, 1, 2, 14, 8, dark);
  r(c, 2, 10, 12, 1, dark);
  r(c, 4, 11, 8, 1, dark);
  r(c, 4, 1, 8, 1, mid);
  r(c, 2, 2, 12, 7, mid);
  r(c, 3, 9, 10, 1, mid);
  r(c, 4, 2, 4, 2, light);
  r(c, 3, 4, 2, 2, light);
  r(c, 9, 3, 2, 1, light);
  r(c, 6, 7, 3, 1, dark);
  r(c, 10, 6, 2, 1, dark);
}

function water(c: Ctx, frame: number) {
  r(c, 0, 0, 16, 16, '#4c90e0');
  for (const [y, off] of [[3, 0], [8, 6], [13, 11]]) {
    const x = (off + frame * 3) % 16;
    r(c, x, y, 5, 1, '#80b8f8');
    if (x + 5 > 16) r(c, 0, y, x + 5 - 16, 1, '#80b8f8');
  }
  r(c, (5 + frame * 7) % 16, 10, 1, 1, '#d8f0ff');
}

function spillway(c: Ctx, frame: number) {
  r(c, 0, 0, 16, 16, '#90c8f0');
  for (const x of [1, 5, 9, 13]) {
    const y = (x * 3 + frame * 5) % 16;
    r(c, x, y, 2, 5, '#f0f8ff');
    if (y + 5 > 16) r(c, x, 0, 2, y + 5 - 16, '#f0f8ff');
  }
}

function damWall(c: Ctx, top: boolean) {
  r(c, 0, 0, 16, 16, '#b8b0a8');
  r(c, 0, 7, 16, 1, '#948c84');
  r(c, 0, 15, 16, 1, '#948c84');
  r(c, 4, 0, 1, 7, '#948c84');
  r(c, 12, 8, 1, 7, '#948c84');
  r(c, 0, 0, 16, 1, '#d0c8c0');
  if (top) {
    r(c, 0, 0, 16, 4, '#706868');
    r(c, 0, 1, 16, 1, '#a8a0a0');
    r(c, 2, 0, 2, 4, '#585050');
    r(c, 10, 0, 2, 4, '#585050');
  }
}

function damDoor(c: Ctx) {
  damWall(c, false);
  r(c, 3, 3, 10, 13, '#38404c');
  r(c, 4, 4, 8, 12, '#58687c');
  r(c, 4, 9, 8, 1, '#38404c');
  r(c, 10, 11, 1, 2, '#f0d050');
}

function bridge(c: Ctx) {
  r(c, 0, 0, 16, 16, '#c09058');
  for (let x = 3; x < 16; x += 4) r(c, x, 2, 1, 12, '#8a6038');
  r(c, 0, 0, 16, 2, '#6a4628');
  r(c, 0, 14, 16, 2, '#6a4628');
  r(c, 0, 2, 16, 1, '#d8b080');
}

function fence(c: Ctx) {
  grass(c);
  r(c, 0, 5, 16, 2, '#d0a060');
  r(c, 0, 10, 16, 2, '#d0a060');
  r(c, 0, 7, 16, 1, '#8a6038');
  r(c, 0, 12, 16, 1, '#8a6038');
  for (const x of [2, 11]) {
    r(c, x, 3, 3, 11, '#d0a060');
    r(c, x, 3, 3, 1, '#f0c890');
    r(c, x + 2, 3, 1, 11, '#8a6038');
  }
}

function sign(c: Ctx) {
  grass(c);
  r(c, 7, 10, 2, 6, '#6a4628');
  r(c, 1, 2, 14, 9, '#6a4628');
  r(c, 2, 3, 12, 7, '#d8a868');
  r(c, 4, 5, 8, 1, '#8a6038');
  r(c, 4, 7, 6, 1, '#8a6038');
}

const ROOFS: Record<BuildingKind, [string, string]> = {
  home: ['#d05848', '#983830'],
  jasper: ['#4878c8', '#30508c'],
  gym: ['#7c8898', '#505868'],
  neighbor: ['#58a858', '#387838'],
  center: ['#e05050', '#a03030'],
  house: ['#e08840', '#a85c20'],
  house2: ['#9068b8', '#604088'],
  house3: ['#40a0a0', '#287070'],
  pension: ['#78b850', '#508830'],
  shrine: ['#a83838', '#701c1c'],
  office: ['#8898a8', '#586878'],
  plant: ['#c8b040', '#887420'],
  pump: ['#7888a0', '#505870'],
  ruin: ['#8a7a68', '#5a4c40'],
  cabin: ['#8a5a38', '#5a3820'],
  league: ['#e0b840', '#a07c18'],
};

const BIG_ROOF = new Set<BuildingKind>(['gym', 'office', 'plant', 'league', 'shrine']);

function building(c: Ctx, b: Building) {
  const W = b.w * 16, H = b.h * 16;
  const roofH = BIG_ROOF.has(b.id) ? 40 : b.id === 'pump' ? 22 : 30;
  const [roof, roofDark] = ROOFS[b.id];
  // roof
  r(c, 0, 4, W, roofH - 4, roofDark);
  r(c, 1, 5, W - 2, roofH - 7, roof);
  for (let y = 9; y < roofH - 3; y += 5) r(c, 1, y, W - 2, 1, roofDark);
  r(c, 4, 0, W - 8, 5, roofDark);
  r(c, 5, 1, W - 10, 3, roof);
  // wall
  const wallTop = roofH;
  r(c, 1, wallTop, W - 2, H - wallTop, '#f4ecd4');
  r(c, 1, wallTop, W - 2, 2, '#c8bca0');
  r(c, 0, wallTop, 1, H - wallTop, '#a89880');
  r(c, W - 1, wallTop, 1, H - wallTop, '#a89880');
  r(c, 1, H - 2, W - 2, 2, '#a89880');
  // door
  const dx = (b.door.x - b.x) * 16 + 2;
  r(c, dx, H - 22, 12, 22, '#5a3820');
  r(c, dx + 1, H - 21, 10, 21, b.id === 'gym' ? '#7888a8' : '#9a6838');
  r(c, dx + 8, H - 11, 2, 2, '#f0d050');
  // windows
  for (let wx = 6; wx + 12 < W; wx += 22) {
    if (wx + 12 > dx - 2 && wx < dx + 14) continue;
    r(c, wx, wallTop + 6, 12, 10, '#5a4838');
    r(c, wx + 1, wallTop + 7, 10, 8, '#88b8e8');
    r(c, wx + 1, wallTop + 7, 4, 3, '#d0e8ff');
    r(c, wx + 6, wallTop + 7, 1, 8, '#5a4838');
  }
  if (b.id === 'gym' || b.id === 'league') {
    r(c, W / 2 - 22, 10, 44, 14, '#806020');
    r(c, W / 2 - 21, 11, 42, 12, '#f0c040');
    r(c, W / 2 - 4, 13, 8, 8, '#c03028');
    r(c, W / 2 - 2, 15, 4, 4, '#ffffff');
  }
  if (b.id === 'center') {
    // Poké Ball emblem on the roof
    const cx = W / 2, cy = 15;
    r(c, cx - 7, cy - 7, 14, 14, '#303030');
    r(c, cx - 6, cy - 6, 12, 6, '#f04848');
    r(c, cx - 6, cy, 12, 6, '#f8f8f8');
    r(c, cx - 6, cy - 1, 12, 2, '#303030');
    r(c, cx - 2, cy - 2, 4, 4, '#303030');
    r(c, cx - 1, cy - 1, 2, 2, '#f8f8f8');
  }
  if (b.id === 'shrine') {
    r(c, 0, 18, W, 3, '#701c1c');
    r(c, 6, 21, 3, H - 21, '#a83838');
    r(c, W - 9, 21, 3, H - 21, '#a83838');
    r(c, W / 2 - 3, 8, 6, 6, '#f8d860');
  }
  if (b.id === 'plant') {
    r(c, W - 20, 0, 10, 10, '#909098');
    r(c, W - 19, 0, 8, 2, '#c8c8d0');
    r(c, 8, 12, 30, 6, '#f8e060');
    r(c, 10, 13, 4, 4, '#303030');
  }
  if (b.id === 'office') {
    r(c, 8, 12, W - 16, 10, '#d8e0e8');
    r(c, 10, 14, W - 20, 6, '#5878a8');
  }
  if (b.id === 'cabin') {
    r(c, 2, 2, W - 4, 6, '#f8f8f8');
    r(c, 0, 8, W, 3, '#e8f0f8');
  }
  if (b.id === 'pension') {
    r(c, W / 2 - 4, 10, 8, 7, '#f8f8f8');
    r(c, W / 2 - 3, 11, 2, 2, '#f06080');
    r(c, W / 2 + 1, 11, 2, 2, '#f06080');
    r(c, W / 2 - 3, 13, 6, 2, '#f06080');
    r(c, W / 2 - 1, 15, 2, 1, '#f06080');
  }
  if (b.id === 'ruin') {
    // broken roof, cracks and ivy
    c.clearRect(W - 26, 0, 26, 14);
    r(c, W - 30, 10, 6, 4, '#5a4c40');
    r(c, 10, roofH + 4, 2, 12, '#5a4c40');
    for (const [x, y] of [[2, 34], [4, 38], [6, 42], [W - 6, 36], [W - 4, 44], [3, 50]]) r(c, x, y, 3, 3, '#4c8c3c');
  }
}

// --- characters -----------------------------------------------------------

const HEAD = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.khhhhhhhhk.', '.kHhhhhhhHk.'];
const DOWN_BODY = [
  '.kssssssssk.', '.ksessssesk.', '.kssssssssk.', '..kssssssk..',
  '..kcccccck..', '.kcccccccck.', 'ksccccccccsk', 'ksCccccccCsk', '.kCCCCCCCCk.', '.kppppppppk.',
];
const UP_BODY = [
  '.khhhhhhhhk.', '.khhhhhhhhk.', '.kHhhhhhhHk.', '..kHHHHHHk..',
  '..kcccccck..', '.kcccccccck.', 'ksccccccccsk', 'ksCccccccCsk', '.kCCCCCCCCk.', '.kppppppppk.',
];
const FRONT_LEGS = [
  ['.kpppkkpppk.', '.kppk..kppk.', '.kbbk..kbbk.'],
  ['.kpppkkpppk.', '.kppk..kbbk.', '.kbbk..kkk..'],
  ['.kpppkkpppk.', '.kbbk..kppk.', '..kkk..kbbk.'],
];
const SIDE_BODY = [
  '.ksssshhhhk.', '.kesssshhHk.', '.kssssshhHk.', '..ksssssk...',
  '..kcccccck..', '..kcccccck..', '..kccsccck..', '..kcCsCcck..', '..kCCCCCCk..', '..kppppppk..',
];
const SIDE_LEGS = [
  ['..kppppppk..', '...kppppk...', '...kbbbbk...'],
  ['..kppppppk..', '..kppk.kppk.', '.kbbk...kbbk'],
  ['..kppppppk..', '...kpppk....', '...kbbbk....'],
];

export interface Look {
  h: string; H: string; c: string; C: string; p: string; b: string;
}

export const LOOKS: Record<string, Look> = {
  mum: { h: '#6a4028', H: '#40241a', c: '#e8a050', C: '#b07030', p: '#405880', b: '#503828' },
  dad: { h: '#3a2a20', H: '#201410', c: '#5878a8', C: '#3a5480', p: '#4a4a52', b: '#2a2a2a' },
  grandma: { h: '#e8e8f0', H: '#b0b0c0', c: '#9868b0', C: '#6c4888', p: '#585068', b: '#403040' },
  jasperDad: { h: '#d86828', H: '#983c10', c: '#f4f4f4', C: '#c8c8d0', p: '#303030', b: '#202020' },
  jasperMom: { h: '#e88838', H: '#a85818', c: '#68b878', C: '#408850', p: '#f0e8d8', b: '#705030' },
  ferry: { h: '#a8a8a8', H: '#707070', c: '#304060', C: '#1c2840', p: '#705838', b: '#302018' },
  beryl: { h: '#4a3020', H: '#2a1810', c: '#30a898', C: '#1c7068', p: '#383848', b: '#e8e8f0' },
  jasper: { h: '#e07830', H: '#a04818', c: '#d84040', C: '#902828', p: '#3858a8', b: '#383838' },
  spruce: { h: '#d0d0d8', H: '#909098', c: '#f8f8f8', C: '#b8b8c8', p: '#806040', b: '#503020' },
  guard: { h: '#303038', H: '#181820', c: '#304880', C: '#203060', p: '#203060', b: '#181818' },
  fisher: { h: '#e8d070', H: '#a89040', c: '#58a050', C: '#386830', p: '#506888', b: '#403020' },
  neighbor: { h: '#a04060', H: '#702840', c: '#f0a0c0', C: '#c07090', p: '#6060a0', b: '#603040' },
  nurse: { h: '#f088a8', H: '#c05878', c: '#f8f8f8', C: '#f0c0d0', p: '#f8f8f8', b: '#f0a0b8' },
  clerk: { h: '#604020', H: '#402810', c: '#4890d8', C: '#3068a8', p: '#404858', b: '#303030' },
  youngster: { h: '#504030', H: '#302010', c: '#f0d040', C: '#c0a020', p: '#4060a0', b: '#c03030' },
  lass: { h: '#e8c050', H: '#b08828', c: '#f07890', C: '#c05068', p: '#4858a0', b: '#702838' },
  hiker: { h: '#6a4a28', H: '#402c18', c: '#c87838', C: '#985420', p: '#6a6040', b: '#402818' },
  bugcatcher: { h: '#403020', H: '#201810', c: '#88c858', C: '#58983a', p: '#c8b078', b: '#504030' },
  ranger: { h: '#5a3a20', H: '#3a2410', c: '#4c8c48', C: '#30602c', p: '#6a5838', b: '#302018' },
  medium: { h: '#d8d8e0', H: '#a0a0b0', c: '#8858a0', C: '#5c3878', p: '#5c3878', b: '#302038' },
  skier: { h: '#e8e8f0', H: '#b0b8c8', c: '#48a8e8', C: '#2878b8', p: '#384868', b: '#e8e8f0' },
  swimmer: { h: '#d8a040', H: '#a07020', c: '#f0d8c0', C: '#e8b898', p: '#3080d0', b: '#f0d8c0' },
  sailor: { h: '#303040', H: '#181820', c: '#f8f8f8', C: '#c8d0e0', p: '#283868', b: '#202020' },
  ace: { h: '#d03838', H: '#902020', c: '#303848', C: '#1c2030', p: '#e8e8f0', b: '#d03838' },
  blackbelt: { h: '#282020', H: '#100808', c: '#f0f0f0', C: '#c8c8c8', p: '#f0f0f0', b: '#202020' },
  worker: { h: '#f0c030', H: '#b08818', c: '#f08030', C: '#c05818', p: '#404858', b: '#302018' },
  miner: { h: '#f0d040', H: '#a08820', c: '#806040', C: '#584028', p: '#504838', b: '#302018' },
  police: { h: '#283058', H: '#141a38', c: '#384890', C: '#243068', p: '#243068', b: '#101010' },
  oldman: { h: '#d8d8d8', H: '#a0a0a0', c: '#8a6a48', C: '#604830', p: '#505050', b: '#302820' },
  oldwoman: { h: '#e0e0e8', H: '#a8a8b8', c: '#c87890', C: '#985068', p: '#605068', b: '#403040' },
  gentleman: { h: '#383028', H: '#201810', c: '#383848', C: '#202030', p: '#383848', b: '#101010' },
  guide: { h: '#504030', H: '#302010', c: '#f8f8f8', C: '#d0d0d8', p: '#d03838', b: '#303030' },
  grunt: { h: '#2a8888', H: '#185858', c: '#2c4c58', C: '#1c3038', p: '#2c4c58', b: '#101818' },
  vesper: { h: '#202028', H: '#08080c', c: '#20a0a0', C: '#107070', p: '#202028', b: '#08080c' },
  reeve: { h: '#e0e0e0', H: '#a8a8a8', c: '#407848', C: '#285030', p: '#6a5838', b: '#403020' },
  crest: { h: '#888890', H: '#585860', c: '#283040', C: '#181c28', p: '#283040', b: '#101010' },
  ingrid: { h: '#e8e8e8', H: '#b0b0b0', c: '#f08030', C: '#c05818', p: '#5068a0', b: '#303030' },
  isolde: { h: '#d8f0ff', H: '#90b8d8', c: '#68b8e8', C: '#3888c0', p: '#f8f8f8', b: '#68b8e8' },
  brannock: { h: '#7a4828', H: '#4a2810', c: '#a08060', C: '#706048', p: '#504030', b: '#302018' },
  maren: { h: '#5838a8', H: '#382078', c: '#284878', C: '#183058', p: '#283048', b: '#181820' },
  nerissa: { h: '#3878d0', H: '#2050a0', c: '#f8f8f8', C: '#a8d0f0', p: '#3878d0', b: '#f0d8c0' },
  oda: { h: '#302838', H: '#181020', c: '#c04848', C: '#882828', p: '#302838', b: '#181020' },
  cassian: { h: '#f0e048', H: '#b8a820', c: '#303038', C: '#1c1c24', p: '#f0e048', b: '#202028' },
  sedge: { h: '#5a8838', H: '#386020', c: '#c8a868', C: '#987840', p: '#5a7838', b: '#403020' },
  wren: { h: '#a8a8b8', H: '#787888', c: '#88a8d8', C: '#5878a8', p: '#e8e8f0', b: '#404048' },
  bramble: { h: '#806030', H: '#504018', c: '#d8a830', C: '#a87818', p: '#585030', b: '#302818' },
  kestrel: { h: '#a87848', H: '#785028', c: '#c8b898', C: '#988870', p: '#6a5a48', b: '#403020' },
  morgrave: { h: '#e8e8f0', H: '#9898a8', c: '#202028', C: '#101014', p: '#302838', b: '#101014' },
  solenne: { h: '#f8e8a0', H: '#d0b860', c: '#f8f8f8', C: '#d8d0b8', p: '#4890c8', b: '#f8f8f8' },
};

/** Frame order in each character sheet. Right-facing reuses left with flipX. */
export const DIR_FRAMES = { down: 0, up: 3, left: 6 } as const;

function drawArt(c: Ctx, art: string[], look: Look, ox: number, oy: number) {
  const pal: Record<string, string> = {
    k: '#202028', s: '#f8c8a0', e: '#202028', ...look,
  };
  art.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const col = pal[ch];
      if (col) r(c, ox + x, oy + y, 1, 1, col);
    });
  });
}

function characterSheet(scene: Phaser.Scene, key: string, look: Look) {
  const frames: string[][] = [];
  for (const legs of FRONT_LEGS) frames.push([...HEAD, ...DOWN_BODY, ...legs]);
  for (const legs of FRONT_LEGS) frames.push([...HEAD, ...UP_BODY, ...legs]);
  for (const legs of SIDE_LEGS) frames.push([...HEAD, ...SIDE_BODY, ...legs]);
  const tex = canvasTexture(scene, key, 16 * frames.length, 24, (c) => {
    frames.forEach((art, i) => drawArt(c, art, look, i * 16 + 2, 6));
  });
  frames.forEach((_, i) => tex.add(i, 0, i * 16, 0, 16, 24));
}

export function generateArt(scene: Phaser.Scene): void {
  canvasTexture(scene, 't-grass', 16, 16, grass);
  canvasTexture(scene, 't-tall', 16, 16, tallGrass);
  canvasTexture(scene, 't-path', 16, 16, path);
  canvasTexture(scene, 't-flowers', 16, 16, flowers);
  canvasTexture(scene, 't-tree', 16, 16, tree);
  canvasTexture(scene, 't-water0', 16, 16, (c) => water(c, 0));
  canvasTexture(scene, 't-water1', 16, 16, (c) => water(c, 1));
  canvasTexture(scene, 't-spill0', 16, 16, (c) => spillway(c, 0));
  canvasTexture(scene, 't-spill1', 16, 16, (c) => spillway(c, 1));
  canvasTexture(scene, 't-dam', 16, 16, (c) => damWall(c, false));
  canvasTexture(scene, 't-damtop', 16, 16, (c) => damWall(c, true));
  canvasTexture(scene, 't-damdoor', 16, 16, damDoor);
  canvasTexture(scene, 't-bridge', 16, 16, bridge);
  canvasTexture(scene, 't-fence', 16, 16, fence);
  canvasTexture(scene, 't-sign', 16, 16, sign);
  for (const kind of Object.keys(KINDS) as BuildingKind[]) {
    const b = bld(kind, 0, 0);
    canvasTexture(scene, `b-${kind}`, b.w * 16, b.h * 16, (c) => building(c, b));
  }
  generateWorldTiles(scene);
  canvasTexture(scene, 't-dock', 16, 16, dock);
  generateInterior(scene);
  homeMonSheet(scene);
  canvasTexture(scene, 'fx-heart', 16, 16, heartBubble);
  canvasTexture(scene, 'fx-exclaim', 16, 16, exclaimBubble);
  for (const [key, look] of Object.entries(LOOKS)) characterSheet(scene, `c-${key}`, look);
  // tall-grass overlay drawn over a walker's legs
  canvasTexture(scene, 't-tall-top', 16, 16, (c) => {
    tallGrass(c);
    c.clearRect(0, 0, 16, 8);
  });
}

function dock(c: Ctx) {
  water(c, 0);
  r(c, 1, 0, 14, 16, '#b88850');
  for (let y = 3; y < 16; y += 4) r(c, 1, y, 14, 1, '#7a5430');
  r(c, 1, 0, 1, 16, '#6a4628');
  r(c, 14, 0, 1, 16, '#6a4628');
}

// --- interiors --------------------------------------------------------------

function floor(c: Ctx) {
  r(c, 0, 0, 16, 16, '#d0a468');
  for (const y of [3, 7, 11, 15]) r(c, 0, y, 16, 1, '#b08048');
  for (const [x, y] of [[5, 0], [12, 4], [3, 8], [10, 12]]) r(c, x, y, 1, 3, '#b08048');
  r(c, 0, 0, 16, 1, '#dcb478');
}

function wall(c: Ctx) {
  r(c, 0, 0, 16, 16, '#efe0bc');
  for (const x of [2, 7, 12]) r(c, x, 0, 2, 12, '#e2cfa4');
  r(c, 0, 12, 16, 4, '#a87850');
  r(c, 0, 12, 16, 1, '#c89868');
}

function voidTile(c: Ctx) {
  r(c, 0, 0, 16, 16, '#302830');
  r(c, 0, 15, 16, 1, '#4a3e48');
}

function windowTile(c: Ctx) {
  wall(c);
  r(c, 3, 2, 10, 9, '#6a5040');
  r(c, 4, 3, 8, 7, '#a0d0f0');
  r(c, 4, 3, 3, 2, '#e0f4ff');
  r(c, 7, 3, 1, 7, '#6a5040');
}

function shelfToy(c: Ctx) {
  wall(c);
  r(c, 1, 9, 14, 2, '#8a5a30');
  // a little teal serpent plush (Lethys)
  const teal = '#2a8c8c', dark = '#1a5c60';
  r(c, 4, 4, 3, 2, teal);
  r(c, 6, 5, 2, 3, teal);
  r(c, 8, 6, 3, 2, teal);
  r(c, 10, 4, 2, 3, teal);
  r(c, 4, 6, 2, 3, dark);
  r(c, 5, 4, 1, 1, '#f8f8f8');
}

function bookshelf(c: Ctx) {
  r(c, 0, 0, 16, 16, '#7a4a28');
  r(c, 1, 1, 14, 14, '#5a3418');
  const colors = ['#c84848', '#4878c8', '#58a858', '#e0b040', '#9868b0'];
  for (const row of [2, 8]) {
    for (let x = 2, i = row; x < 14; x += 2, i++) r(c, x, row, 2, 5, colors[i % colors.length]);
    r(c, 1, row + 5, 14, 1, '#7a4a28');
  }
}

function bed(c: Ctx, head: boolean) {
  floor(c);
  r(c, 1, 0, 14, 16, '#7a4a28');
  r(c, 2, head ? 2 : 0, 12, head ? 14 : 13, '#4a90c8');
  if (head) {
    r(c, 3, 3, 10, 5, '#f8f8f8');
    r(c, 3, 7, 10, 1, '#c8c8d8');
  } else {
    r(c, 2, 0, 12, 1, '#68a8d8');
    r(c, 2, 12, 12, 1, '#30709c');
  }
}

function counter(c: Ctx) {
  floor(c);
  r(c, 0, 0, 16, 12, '#8890a0');
  r(c, 0, 0, 16, 5, '#d8d8e0');
  r(c, 0, 5, 16, 1, '#a8a8b8');
  r(c, 3, 7, 3, 3, '#606878');
  r(c, 10, 7, 3, 3, '#606878');
  r(c, 0, 12, 16, 1, '#606878');
}

function plant(c: Ctx) {
  floor(c);
  r(c, 5, 10, 6, 5, '#b86838');
  r(c, 5, 10, 6, 1, '#d88858');
  r(c, 4, 2, 8, 8, '#3c8c40');
  r(c, 6, 1, 4, 2, '#58b058');
  r(c, 3, 5, 2, 3, '#58b058');
  r(c, 11, 4, 2, 3, '#58b058');
}

function tv(c: Ctx) {
  floor(c);
  r(c, 2, 4, 12, 9, '#303038');
  r(c, 3, 5, 10, 6, '#70b8e8');
  r(c, 3, 5, 4, 2, '#b8e0f8');
  r(c, 4, 13, 8, 2, '#505058');
}

function penFence(c: Ctx) {
  floor(c);
  r(c, 0, 5, 16, 2, '#c09060');
  r(c, 0, 10, 16, 2, '#c09060');
  r(c, 2, 2, 2, 12, '#8a6038');
  r(c, 12, 2, 2, 12, '#8a6038');
}

function exitMat(c: Ctx) {
  floor(c);
  r(c, 1, 3, 14, 10, '#b84040');
  r(c, 2, 4, 12, 8, '#d86060');
  for (const y of [6, 9]) r(c, 2, y, 12, 1, '#b84040');
}

/** Table tiles join up: edges are drawn only where the neighbour isn't table. */
export function tableTexture(scene: Phaser.Scene, n: boolean, e: boolean, s: boolean, w: boolean): string {
  const key = `t-table-${+n}${+e}${+s}${+w}`;
  canvasTexture(scene, key, 16, 16, (c) => {
    floor(c);
    r(c, 0, 0, 16, 16, '#b07040');
    r(c, 0, 0, 16, 16, '#c88850');
    if (!n) r(c, 0, 0, 16, 2, '#e0a868');
    if (!s) r(c, 0, 12, 16, 4, '#8a5028');
    if (!w) r(c, 0, 0, 1, 16, '#8a5028');
    if (!e) r(c, 15, 0, 1, 16, '#8a5028');
  });
  return key;
}

function generateInterior(scene: Phaser.Scene) {
  canvasTexture(scene, 'i-floor', 16, 16, floor);
  canvasTexture(scene, 'i-wall', 16, 16, wall);
  canvasTexture(scene, 'i-void', 16, 16, voidTile);
  canvasTexture(scene, 'i-window', 16, 16, windowTile);
  canvasTexture(scene, 'i-shelf', 16, 16, shelfToy);
  canvasTexture(scene, 'i-books', 16, 16, bookshelf);
  canvasTexture(scene, 'i-bedtop', 16, 16, (c) => bed(c, true));
  canvasTexture(scene, 'i-bedbot', 16, 16, (c) => bed(c, false));
  canvasTexture(scene, 'i-counter', 16, 16, counter);
  canvasTexture(scene, 'i-plant', 16, 16, plant);
  canvasTexture(scene, 'i-tv', 16, 16, tv);
  canvasTexture(scene, 'i-pen', 16, 16, penFence);
  canvasTexture(scene, 'i-mat', 16, 16, exitMat);
}

// --- the family Pokémon (placeholder until it is designed) -----------------
// A small, round stone-shelled creature, drawn as a stand-in.

const MON_DOWN = [
  '................',
  '................',
  '.....kkkkkk.....',
  '....kggGGggk....',
  '...kgGmmmmGgk...',
  '...kgmmmmmmgk...',
  '..kfffffffffk...',
  '..kfwefffwefk...',
  '..kffffnffffk...',
  '..kfffffffffk...',
  '...kfffffffk....',
  '...kFk...kFk....',
  '....k.....k.....',
];
const MON_UP = [
  '................',
  '................',
  '.....kkkkkk.....',
  '....kggGGggk....',
  '...kgGmmmmGgk...',
  '...kgmmmmmmgk...',
  '..kgggmmmgggk...',
  '..kgGGgggGGgk...',
  '..kggggggggk....',
  '..kffffffffk....',
  '...kfffffffk....',
  '...kFk...kFk....',
  '....k.....k.....',
];
const MON_SIDE = [
  '................',
  '................',
  '......kkkkkk....',
  '.....kggGGggk...',
  '....kgGmmmmGgk..',
  '...kkgmmmmmmgk..',
  '..kffkggggggk...',
  '.kwefffgGGgk....',
  '.kfnffffgggk....',
  '..kfffffffk.....',
  '...kffffffk.....',
  '...kFk..kFk.....',
  '....k....k......',
];

function homeMonSheet(scene: Phaser.Scene) {
  const pal: Record<string, string> = {
    k: '#283028', g: '#8c8c98', G: '#6a6a78', m: '#5aa848', f: '#d8a868', F: '#a87840',
    w: '#f8f8f8', e: '#202028', n: '#704030',
  };
  const frames = [MON_DOWN, MON_DOWN, MON_DOWN, MON_UP, MON_UP, MON_UP, MON_SIDE, MON_SIDE, MON_SIDE];
  const tex = canvasTexture(scene, 'c-homemon', 16 * 9, 24, (c) => {
    frames.forEach((art, i) => {
      const bob = i % 3 === 0 ? 0 : 1;
      art.forEach((row, y) => [...row].forEach((ch, x) => {
        const col = pal[ch];
        if (col) r(c, i * 16 + x, 10 + y + bob, 1, 1, col);
      }));
    });
  });
  frames.forEach((_, i) => tex.add(i, 0, i * 16, 0, 16, 24));
}

function bubble(c: Ctx) {
  r(c, 2, 0, 12, 12, '#202028');
  r(c, 3, 1, 10, 10, '#f8f8f8');
  r(c, 6, 12, 4, 2, '#202028');
  r(c, 7, 12, 2, 1, '#f8f8f8');
}

function heartBubble(c: Ctx) {
  bubble(c);
  const red = '#e04858';
  r(c, 5, 3, 2, 2, red);
  r(c, 9, 3, 2, 2, red);
  r(c, 4, 4, 8, 3, red);
  r(c, 5, 7, 6, 1, red);
  r(c, 6, 8, 4, 1, red);
  r(c, 7, 9, 2, 1, red);
}

function exclaimBubble(c: Ctx) {
  bubble(c);
  r(c, 7, 2, 2, 6, '#e04858');
  r(c, 7, 9, 2, 1, '#e04858');
}

const TYPE_COLORS: Record<Type, string> = {
  Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Electric: '#f8d030', Grass: '#78c850',
  Ice: '#98d8d8', Fighting: '#c03028', Poison: '#a040a0', Ground: '#e0c068', Flying: '#a890f0',
  Psychic: '#f85888', Bug: '#a8b820', Rock: '#b8a038', Ghost: '#705898', Dragon: '#7038f8',
  Dark: '#705848', Steel: '#b8b8d0', Fairy: '#ee99ac',
};

/** 64x64 stand-in for species that have no drawn sprite yet: a type-colored blob with its dex number. */
export function monPlaceholders(scene: Phaser.Scene, species: SpeciesData[]): void {
  for (const s of species) {
    canvasTexture(scene, `mon-${s.id}`, 64, 64, (c) => {
      const [main, second = main] = s.types;
      c.fillStyle = TYPE_COLORS[main];
      c.beginPath();
      c.ellipse(32, 36, 24, 22, 0, 0, Math.PI * 2);
      c.fill();
      r(c, 20, 52, 24, 4, TYPE_COLORS[second]);
      c.fillStyle = '#202028';
      c.font = 'bold 14px monospace';
      c.textAlign = 'center';
      c.fillText(s.dex, 32, 41);
    });
  }
}

// --- more outdoor tiles and the ground themes ------------------------------------------------

function cliff(c: Ctx, base: string, dark: string, light: string) {
  r(c, 0, 0, 16, 16, base);
  r(c, 0, 12, 16, 4, dark);
  for (const [x, y, w] of [[1, 2, 6], [9, 5, 5], [3, 8, 7]]) {
    r(c, x, y, w, 1, light);
    r(c, x, y + 1, w, 1, dark);
  }
}

function boulder(c: Ctx, ground: (c: Ctx) => void) {
  ground(c);
  r(c, 3, 4, 10, 10, '#606068');
  r(c, 2, 6, 12, 7, '#606068');
  r(c, 4, 5, 8, 7, '#9898a0');
  r(c, 5, 5, 3, 2, '#c8c8d0');
  r(c, 2, 13, 12, 1, '#404048');
}

function lanternPost(c: Ctx, ground: (c: Ctx) => void) {
  ground(c);
  r(c, 7, 7, 2, 9, '#4a3020');
  r(c, 4, 1, 8, 7, '#702020');
  r(c, 5, 2, 6, 5, '#f8b040');
  r(c, 6, 3, 4, 3, '#f8e890');
}

function lava(c: Ctx, frame: number) {
  r(c, 0, 0, 16, 16, '#d84818');
  for (const [x, y] of [[2, 3], [9, 7], [5, 12]]) r(c, (x + frame * 4) % 14, y, 3, 2, '#f8a030');
  r(c, (7 + frame * 5) % 15, 2, 1, 1, '#f8e070');
}

function caveMouth(c: Ctx, ground: (c: Ctx) => void) {
  ground(c);
  r(c, 2, 2, 12, 14, '#201818');
  r(c, 3, 1, 10, 2, '#201818');
  r(c, 1, 2, 1, 14, '#4a3c34');
  r(c, 14, 2, 1, 14, '#4a3c34');
}

function sand(c: Ctx) {
  r(c, 0, 0, 16, 16, '#e8d8a0');
  for (const [x, y] of [[3, 3], [11, 6], [6, 12], [13, 13]]) r(c, x, y, 1, 1, '#c8b880');
}

function pavement(c: Ctx) {
  r(c, 0, 0, 16, 16, '#c8c8c0');
  r(c, 0, 0, 16, 1, '#e0e0d8');
  r(c, 0, 0, 1, 16, '#e0e0d8');
  r(c, 0, 15, 16, 1, '#a8a8a0');
  r(c, 15, 0, 1, 16, '#a8a8a0');
  r(c, 7, 0, 1, 16, '#b4b4ac');
  r(c, 0, 7, 16, 1, '#b4b4ac');
}

function road(c: Ctx) {
  r(c, 0, 0, 16, 16, '#707078');
  r(c, 0, 0, 16, 1, '#888890');
  for (const [x, y] of [[3, 4], [11, 9], [6, 13]]) r(c, x, y, 2, 1, '#606068');
}

function snow(c: Ctx) {
  r(c, 0, 0, 16, 16, '#f0f4f8');
  for (const [x, y] of [[2, 3], [10, 2], [6, 9], [12, 12], [1, 13]]) r(c, x, y, 2, 1, '#d0dce8');
}

function snowTall(c: Ctx) {
  snow(c);
  for (const bx of [0, 8]) for (const by of [0, 8]) {
    r(c, bx + 1, by + 2, 6, 5, '#88a8a0');
    r(c, bx + 1, by + 1, 1, 3, '#f8f8f8');
    r(c, bx + 3, by, 1, 4, '#f8f8f8');
    r(c, bx + 5, by + 1, 1, 3, '#f8f8f8');
    r(c, bx, by + 7, 8, 1, '#587870');
  }
}

function pine(c: Ctx, ground: (c: Ctx) => void, snowy: boolean) {
  ground(c);
  r(c, 7, 12, 2, 4, '#6a4028');
  const d = '#1c5038', m = '#2c7048';
  r(c, 6, 0, 4, 3, d);
  r(c, 4, 3, 8, 3, d);
  r(c, 2, 6, 12, 3, d);
  r(c, 1, 9, 14, 3, d);
  r(c, 7, 1, 2, 2, m);
  r(c, 5, 4, 6, 1, m);
  r(c, 3, 7, 10, 1, m);
  r(c, 2, 10, 12, 1, m);
  if (snowy) {
    r(c, 6, 0, 4, 1, '#f8f8f8');
    r(c, 4, 3, 3, 1, '#f8f8f8');
    r(c, 2, 6, 4, 1, '#f8f8f8');
    r(c, 10, 9, 4, 1, '#f8f8f8');
  }
}

function caveFloor(c: Ctx) {
  r(c, 0, 0, 16, 16, '#8a7058');
  for (const [x, y] of [[2, 3], [11, 5], [6, 11], [13, 13]]) r(c, x, y, 2, 1, '#6a5440');
  for (const [x, y] of [[8, 2], [3, 13]]) r(c, x, y, 1, 1, '#a88c70');
}

function caveRough(c: Ctx) {
  caveFloor(c);
  for (const [x, y] of [[1, 1], [8, 4], [3, 8], [11, 10], [6, 13]]) {
    r(c, x, y, 3, 2, '#5a4434');
    r(c, x, y, 2, 1, '#9a7e64');
  }
}

function caveWall(c: Ctx) {
  r(c, 0, 0, 16, 16, '#4a3c34');
  r(c, 0, 12, 16, 4, '#2c2420');
  for (const [x, y, w] of [[1, 2, 7], [8, 6, 6], [2, 9, 6]]) {
    r(c, x, y, w, 1, '#6a5848');
    r(c, x, y + 1, w, 1, '#2c2420');
  }
}

function marshGrass(c: Ctx) {
  r(c, 0, 0, 16, 16, '#98b060');
  for (const [x, y] of [[2, 3], [10, 2], [6, 9], [12, 12], [1, 13]]) r(c, x, y, 2, 1, '#788c48');
}

function reeds(c: Ctx) {
  marshGrass(c);
  for (const x of [1, 4, 7, 10, 13]) {
    r(c, x, 2, 1, 13, '#a08838');
    r(c, x + 1, 4, 1, 11, '#c8b050');
    r(c, x, 1, 2, 3, '#8a5a30');
  }
}

function concrete(c: Ctx) {
  r(c, 0, 0, 16, 16, '#c0bab0');
  r(c, 0, 0, 16, 1, '#d4cec4');
  r(c, 0, 15, 16, 1, '#a09a90');
  for (const [x, y] of [[4, 5], [11, 10]]) r(c, x, y, 2, 1, '#a8a298');
}

function hedge(c: Ctx) {
  pavement(c);
  r(c, 1, 3, 14, 12, '#2c6c34');
  r(c, 2, 2, 12, 11, '#44984a');
  r(c, 4, 4, 4, 2, '#78c860');
}

function ballSheet(scene: Phaser.Scene, key: string, draw: (c: Ctx, ox: number) => void) {
  const tex = canvasTexture(scene, key, 16 * 9, 24, (c) => {
    for (let i = 0; i < 9; i++) draw(c, i * 16);
  });
  for (let i = 0; i < 9; i++) tex.add(i, 0, i * 16, 0, 16, 24);
}

// --- more interior tiles ---------------------------------------------------------------------

function tileFloor(c: Ctx, a: string, b: string) {
  r(c, 0, 0, 16, 16, a);
  r(c, 0, 0, 8, 8, b);
  r(c, 8, 8, 8, 8, b);
}

function pc(c: Ctx) {
  floor(c);
  r(c, 2, 1, 12, 13, '#505868');
  r(c, 3, 2, 10, 7, '#68c0f0');
  r(c, 4, 3, 4, 2, '#b8e8ff');
  r(c, 3, 10, 10, 2, '#303840');
}

function centerCounter(c: Ctx) {
  r(c, 0, 0, 16, 16, '#f0e8e8');
  r(c, 0, 2, 16, 10, '#e05858');
  r(c, 0, 2, 16, 3, '#f8f8f8');
  r(c, 0, 11, 16, 1, '#a03030');
}

function goods(c: Ctx) {
  r(c, 0, 0, 16, 16, '#7a6a5a');
  r(c, 1, 1, 14, 14, '#a89070');
  const items = ['#f04848', '#4888e8', '#58c058', '#f0c040'];
  for (const [i, y] of [[0, 2], [1, 7], [2, 12]]) for (let x = 2; x < 14; x += 3) r(c, x, y, 2, 3, items[(x + i) % 4]);
}

function statue(c: Ctx) {
  floor(c);
  r(c, 3, 11, 10, 5, '#808088');
  r(c, 4, 10, 8, 1, '#a0a0a8');
  r(c, 5, 2, 6, 8, '#a8a8b0');
  r(c, 6, 0, 4, 3, '#c8c8d0');
}

function mural(c: Ctx) {
  r(c, 0, 0, 16, 16, '#6a5040');
  r(c, 1, 1, 14, 14, '#d8c098');
  // a river flowing through a wall
  r(c, 1, 7, 14, 3, '#4878c8');
  r(c, 7, 2, 3, 12, '#806048');
  r(c, 7, 7, 3, 3, '#88a8e0');
}

function machine(c: Ctx) {
  r(c, 0, 0, 16, 16, '#6a7280');
  r(c, 1, 1, 14, 14, '#8890a0');
  r(c, 3, 3, 4, 3, '#50e070');
  r(c, 9, 3, 4, 3, '#f0c040');
  r(c, 3, 9, 10, 4, '#404850');
  r(c, 4, 10, 2, 2, '#e05050');
}

function grate(c: Ctx) {
  r(c, 0, 0, 16, 16, '#505860');
  for (let x = 1; x < 16; x += 3) r(c, x, 0, 1, 16, '#303840');
  r(c, 0, 0, 16, 1, '#707880');
}

function hatch(c: Ctx) {
  tileFloor(c, '#9098a0', '#a0a8b0');
  r(c, 2, 2, 12, 12, '#404850');
  r(c, 3, 3, 10, 10, '#606870');
  for (let y = 4; y < 13; y += 3) r(c, 3, y, 10, 1, '#404850');
}

function indoorLantern(c: Ctx) {
  floor(c);
  r(c, 7, 9, 2, 6, '#4a3020');
  r(c, 4, 2, 8, 8, '#701c1c');
  r(c, 5, 3, 6, 6, '#f8b040');
  r(c, 6, 4, 4, 4, '#f8e890');
}

const GYM_FLOORS: Record<string, [string, string]> = {
  Ice: ['#c8e8f8', '#b0d8f0'], Rock: ['#b89c78', '#a88c68'], Dragon: ['#8878b8', '#7868a8'],
  Water: ['#88b8e8', '#78a8d8'], Ghost: ['#706080', '#605070'], Electric: ['#e8d870', '#d8c860'],
  Grass: ['#98c878', '#88b868'], Fighting: ['#d8a080', '#c89070'],
};

function generateWorldTiles(scene: Phaser.Scene) {
  const add = (key: string, draw: (c: Ctx) => void) => canvasTexture(scene, key, 16, 16, draw);
  add('t-cliff', (c) => cliff(c, '#a08868', '#685440', '#c8b090'));
  add('t-boulder', (c) => boulder(c, grass));
  add('t-lantern', (c) => lanternPost(c, grass));
  add('t-lava0', (c) => lava(c, 0));
  add('t-lava1', (c) => lava(c, 1));
  add('t-cave', (c) => caveMouth(c, grass));
  add('t-sand', sand);
  add('t-pave', pavement);
  // themed variants: key@theme
  add('t-grass@snow', snow);
  add('t-tall@snow', snowTall);
  add('t-tall-top@snow', (c) => { snowTall(c); c.clearRect(0, 0, 16, 8); });
  add('t-tree@snow', (c) => pine(c, snow, true));
  add('t-path@snow', (c) => { snow(c); r(c, 0, 0, 16, 16, '#dce4ec'); for (const [x, y] of [[3, 2], [11, 9]]) r(c, x, y, 2, 1, '#c0ccd8'); });
  add('t-cliff@snow', (c) => { cliff(c, '#a8b0b8', '#707880', '#f0f4f8'); r(c, 0, 0, 16, 2, '#f8f8f8'); });
  add('t-boulder@snow', (c) => boulder(c, snow));
  add('t-lantern@snow', (c) => lanternPost(c, snow));
  add('t-sign@snow', (c) => { sign(c); });
  add('t-flowers@snow', snow);
  add('t-grass@cave', caveFloor);
  add('t-tall@cave', caveRough);
  add('t-tall-top@cave', (c) => { caveRough(c); c.clearRect(0, 0, 16, 16); });
  add('t-tree@cave', caveWall);
  add('t-path@cave', caveFloor);
  add('t-cave@cave', (c) => caveMouth(c, caveFloor));
  add('t-boulder@cave', (c) => boulder(c, caveFloor));
  add('t-grass@marsh', marshGrass);
  add('t-tall@marsh', reeds);
  add('t-tall-top@marsh', (c) => { reeds(c); c.clearRect(0, 0, 16, 7); });
  add('t-tree@marsh', (c) => { tree(c); });
  add('t-grass@city', pavement);
  add('t-path@city', road);
  add('t-tree@city', hedge);
  add('t-lantern@city', (c) => { pavement(c); r(c, 7, 4, 2, 12, '#404048'); r(c, 4, 1, 8, 4, '#404048'); r(c, 5, 2, 6, 2, '#f8f0a0'); });
  add('t-grass@dam', concrete);
  add('t-lantern@dam', (c) => { concrete(c); r(c, 7, 4, 2, 12, '#585860'); r(c, 4, 1, 8, 4, '#585860'); r(c, 5, 2, 6, 2, '#f8f0a0'); });
  add('t-path@dam', (c) => { concrete(c); r(c, 0, 0, 16, 16, '#b0aaa0'); r(c, 0, 7, 16, 1, '#f0d040'); });
  // interiors
  add('i-pc', pc);
  add('i-ccounter', centerCounter);
  add('i-goods', goods);
  add('i-statue', statue);
  add('i-mural', mural);
  add('i-machine', machine);
  add('i-grate', grate);
  add('i-hatch', hatch);
  add('i-lantern', indoorLantern);
  add('i-floor@center', (c) => tileFloor(c, '#f0f0f0', '#e0e0e8'));
  add('i-floor@dam', (c) => tileFloor(c, '#9098a0', '#a0a8b0'));
  add('i-wall@dam', (c) => { r(c, 0, 0, 16, 16, '#b8c0c8'); r(c, 0, 12, 16, 4, '#606870'); for (const x of [3, 11]) r(c, x, 0, 1, 12, '#a0a8b0'); });
  add('i-floor@shrine', (c) => { r(c, 0, 0, 16, 16, '#7a4a30'); for (const y of [3, 7, 11, 15]) r(c, 0, y, 16, 1, '#5a3420'); });
  add('i-wall@shrine', (c) => { r(c, 0, 0, 16, 16, '#d8c8a8'); r(c, 0, 12, 16, 4, '#701c1c'); });
  add('i-floor@dark', (c) => { r(c, 0, 0, 16, 16, '#4a4448'); for (const [x, y] of [[3, 3], [10, 8], [5, 12]]) r(c, x, y, 3, 1, '#3a3438'); });
  add('i-wall@dark', (c) => { r(c, 0, 0, 16, 16, '#5a5458'); r(c, 0, 12, 16, 4, '#2a2428'); });
  for (const [type, [a, b]] of Object.entries(GYM_FLOORS)) add(`i-floor@gym-${type}`, (c) => tileFloor(c, a, b));
  // items lying on the ground, as one-frame "characters"
  ballSheet(scene, 'c-ball', (c, ox) => {
    r(c, ox + 4, 12, 8, 8, '#303030');
    r(c, ox + 5, 13, 6, 3, '#e83838');
    r(c, ox + 5, 16, 6, 3, '#f8f8f8');
    r(c, ox + 5, 16, 6, 1, '#303030');
    r(c, ox + 7, 15, 2, 2, '#f8f8f8');
  });
  ballSheet(scene, 'c-fossil', (c, ox) => {
    r(c, ox + 3, 12, 10, 9, '#8a7058');
    r(c, ox + 4, 13, 8, 7, '#c8b090');
    r(c, ox + 6, 14, 4, 1, '#8a7058');
    r(c, ox + 5, 16, 6, 1, '#8a7058');
    r(c, ox + 7, 18, 2, 1, '#8a7058');
  });
}

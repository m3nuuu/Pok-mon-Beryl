// Placeholder pixel art drawn in code, so the prototype ships with no third-party assets.
// Every texture here is meant to be replaced by real tiles/sprites later.
import Phaser from 'phaser';
import { MAPS, type Building } from '../data/maps';

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

const ROOFS: Record<Building['id'], [string, string]> = {
  home: ['#d05848', '#983830'],
  jasper: ['#4878c8', '#30508c'],
  gym: ['#7c8898', '#505868'],
  pension: ['#58a858', '#387838'],
};

function building(c: Ctx, b: Building) {
  const W = b.w * 16, H = b.h * 16;
  const roofH = b.id === 'gym' ? 40 : 30;
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
  if (b.id === 'gym') {
    r(c, W / 2 - 22, 10, 44, 14, '#806020');
    r(c, W / 2 - 21, 11, 42, 12, '#f0c040');
    r(c, W / 2 - 4, 13, 8, 8, '#c03028');
    r(c, W / 2 - 2, 15, 4, 4, '#ffffff');
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
  for (const b of MAPS.stillbrook.buildings) canvasTexture(scene, `b-${b.id}`, b.w * 16, b.h * 16, (c) => building(c, b));
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

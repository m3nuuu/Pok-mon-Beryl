// Full-screen menus: party, summary, bag, Pokédex, trainer card, Mart, PC, number picker.
// They work in any scene (the world UI overlay or the battle), drawn on top at a high depth.
import Phaser from 'phaser';
import { bondHearts, calcStats, expForLevel, STATUS_NAMES, type Pokemon } from '../battle/engine';
import { ITEMS, pocketOf, type Pocket } from '../data/items';
import { MOVES } from '../data/moves';
import { DEX_ENTRIES, SPECIES, SPECIES_LIST } from '../data/species';
import { BADGE_ORDER } from '../data/world/gyms';
import { justPressed } from '../input';
import { game } from '../state';
import { SCREEN_H, SCREEN_W, choose, drawBox, label, until } from './widgets';

const DEPTH = 2000;
const upper = (s: string) => s.toUpperCase();
export const monName = (p: Pokemon) => upper(SPECIES[p.species].name);

const TYPE_COLORS: Record<string, number> = {
  Normal: 0xa8a878, Fire: 0xf08030, Water: 0x6890f0, Electric: 0xf8d030, Grass: 0x78c850, Ice: 0x98d8d8,
  Fighting: 0xc03028, Poison: 0xa040a0, Ground: 0xe0c068, Flying: 0xa890f0, Psychic: 0xf85888, Bug: 0xa8b820,
  Rock: 0xb8a038, Ghost: 0x705898, Dragon: 0x7038f8, Dark: 0x705848, Steel: 0xb8b8d0, Fairy: 0xee99ac,
};

const STATUS_COLORS: Record<string, number> = { psn: 0xa040a0, brn: 0xf08030, par: 0xd8b020, slp: 0x8890a0, frz: 0x60b8e0 };

/** Collects everything a screen draws, so it can be torn down in one go. */
class Layer {
  objs: Phaser.GameObjects.GameObject[] = [];
  constructor(public scene: Phaser.Scene, public depth = DEPTH) {}
  add<T extends Phaser.GameObjects.GameObject>(o: T): T {
    (o as unknown as Phaser.GameObjects.Components.Depth).setDepth?.(this.depth);
    this.objs.push(o);
    return o;
  }
  text(x: number, y: number, s: string, size = 16, color?: string, shadow?: string) {
    return this.add(label(this.scene, x, y, s, { size, color, shadow }));
  }
  g() {
    return this.add(this.scene.add.graphics());
  }
  clear() {
    for (const o of this.objs) o.destroy();
    this.objs = [];
  }
}

function background(l: Layer, color = 0x285878) {
  const g = l.g();
  g.fillStyle(color, 1).fillRect(0, 0, SCREEN_W, SCREEN_H);
  g.fillStyle(0xffffff, 0.06);
  for (let y = 0; y < SCREEN_H; y += 24) g.fillRect(0, y, SCREEN_W, 12);
  return g;
}

function hpBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, hp: number, max: number) {
  g.fillStyle(0x404040, 1).fillRoundedRect(x - 4, y - 4, w + 8, 14, 4);
  g.fillStyle(0x505050, 1).fillRect(x, y, w, 6);
  const f = Math.max(0, hp / max);
  g.fillStyle(f > 0.5 ? 0x58d080 : f > 0.2 ? 0xf8c030 : 0xf05040, 1).fillRect(x, y, Math.ceil(w * f), 6);
}

function typeBadge(l: Layer, x: number, y: number, type: string) {
  const g = l.g();
  g.fillStyle(TYPE_COLORS[type] ?? 0x888888, 1).fillRoundedRect(x, y, 96, 22, 6);
  l.text(x + 48, y + 5, upper(type), 12, '#ffffff', '#00000060').setOrigin(0.5, 0);
}

function statusBadge(l: Layer, x: number, y: number, p: Pokemon) {
  const st = p.hp <= 0 ? 'FNT' : p.status ? STATUS_NAMES[p.status] : '';
  if (!st) return;
  const g = l.g();
  g.fillStyle(p.hp <= 0 ? 0xc03030 : STATUS_COLORS[p.status!], 1).fillRoundedRect(x, y, 52, 20, 5);
  l.text(x + 26, y + 4, st, 12, '#ffffff', '').setOrigin(0.5, 0);
}

function messageBox(l: Layer, msg: string) {
  const g = l.g();
  drawBox(g, 4, SCREEN_H - 64, SCREEN_W - 8, 60, 'world');
  return l.text(28, SCREEN_H - 42, msg, 16);
}

/** A scrolling list with a cursor. Resolves with the index, or -1 when cancelled. */
export async function scrollList(
  scene: Phaser.Scene, items: string[],
  o: { x: number; y: number; w: number; rows: number; start?: number; right?: string[]; onMove?: (i: number) => void; depth?: number; size?: number; cancel?: boolean; sides?: boolean },
): Promise<number> {
  const l = new Layer(scene, o.depth ?? DEPTH + 10);
  const rowH = 36;
  const g = l.g();
  drawBox(g, o.x, o.y, o.w, o.rows * rowH + 32, 'world');
  const size = o.size ?? 16;
  const texts = Array.from({ length: o.rows }, (_, i) => l.text(o.x + 46, o.y + 22 + i * rowH, '', size));
  const rights = Array.from({ length: o.rows }, (_, i) => l.text(o.x + o.w - 26, o.y + 22 + i * rowH, '', size).setOrigin(1, 0));
  const cursor = l.text(o.x + 18, 0, '▶', size);
  const up = l.text(o.x + o.w / 2, o.y + 4, '▲', 12).setOrigin(0.5, 0);
  const down = l.text(o.x + o.w / 2, o.y + o.rows * rowH + 14, '▼', 12).setOrigin(0.5, 0);
  let index = Math.min(o.start ?? 0, items.length - 1);
  let top = Math.max(0, Math.min(index - o.rows + 1, items.length - o.rows));
  const draw = () => {
    if (index < top) top = index;
    if (index >= top + o.rows) top = index - o.rows + 1;
    for (let i = 0; i < o.rows; i++) {
      texts[i].setText(items[top + i] ?? '');
      rights[i].setText(o.right?.[top + i] ?? '');
    }
    cursor.setY(o.y + 22 + (index - top) * rowH);
    up.setVisible(top > 0);
    down.setVisible(top + o.rows < items.length);
    o.onMove?.(index);
  };
  draw();
  let result = -1;
  await until(scene, () => {
    if (justPressed('up') && index > 0) { index--; draw(); }
    if (justPressed('down') && index < items.length - 1) { index++; draw(); }
    if (o.sides) {
      // Left/right leave the list (e.g. to switch bag pockets): -2 for left, -3 for right.
      if (justPressed('left')) { result = -2; return true; }
      if (justPressed('right')) { result = -3; return true; }
    } else {
      if (justPressed('left')) { index = Math.max(0, index - o.rows); draw(); }
      if (justPressed('right')) { index = Math.min(items.length - 1, index + o.rows); draw(); }
    }
    if (justPressed('a')) { result = index; return true; }
    if (o.cancel !== false && justPressed('b')) { result = -1; return true; }
    return false;
  });
  l.clear();
  return result;
}

/** Picks a number with up/down (±1) and left/right (±10). Resolves null when cancelled. */
export async function numberPicker(
  scene: Phaser.Scene, o: { min: number; max: number; value: number; step?: number; format: (n: number) => string; x?: number; y?: number; w?: number },
): Promise<number | null> {
  const l = new Layer(scene, DEPTH + 20);
  const w = o.w ?? 300, x = o.x ?? SCREEN_W - w - 8, y = o.y ?? SCREEN_H - 200;
  const g = l.g();
  drawBox(g, x, y, w, 70, 'world');
  const t = l.text(x + w / 2, y + 26, '', 16).setOrigin(0.5, 0);
  let v = o.value;
  const step = o.step ?? 1;
  const draw = () => t.setText(`◀ ${o.format(v)} ▶`);
  draw();
  let ok = false;
  await until(scene, () => {
    let n = v;
    if (justPressed('up')) n += step;
    if (justPressed('down')) n -= step;
    if (justPressed('right')) n += step * 10;
    if (justPressed('left')) n -= step * 10;
    n = Phaser.Math.Clamp(n, o.min, o.max);
    if (n !== v) { v = n; draw(); }
    if (justPressed('a')) { ok = true; return true; }
    return justPressed('b');
  });
  l.clear();
  return ok ? v : null;
}

// --- party -------------------------------------------------------------------------------------

export interface PartyOptions {
  prompt?: string;
  /** Index shown as already in battle. */
  active?: number;
  start?: number;
  /** Lets the player reorder with SELECT-like swapping: returns -2 - index when the user wants to move. */
}

function drawPartyRow(l: Layer, p: Pokemon, i: number, sel: boolean, active: boolean) {
  const y = 12 + i * 64, x = 12, w = SCREEN_W - 24, h = 58;
  const g = l.g();
  const fill = p.hp <= 0 ? 0xd89090 : active ? 0x88c8f0 : 0x78a8d8;
  g.fillStyle(sel ? 0xf8a040 : 0x203850, 1).fillRoundedRect(x, y, w, h, 10);
  g.fillStyle(sel ? 0xfff0d0 : fill, 1).fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 8);
  l.add(l.scene.add.image(x + 40, y + h / 2, `mon-${p.species}`).setScale(0.75));
  l.text(x + 86, y + 10, monName(p), 16);
  l.text(x + 86, y + 34, `Lv${p.level}`, 12);
  if (p.held) l.text(x + 150, y + 34, `✦${ITEMS[p.held]?.name ?? ''}`, 10, '#705020', '');
  const max = calcStats(p).hp;
  hpBar(g, x + 330, y + 22, 200, p.hp, max);
  l.text(x + 330 + 104, y + 36, `${p.hp}/${max}`, 12).setOrigin(0.5, 0);
  l.text(x + 300, y + 18, 'HP', 12, '#f8b030', '');
  statusBadge(l, x + 560, y + 18, p);
  if (bondHearts(p) > 0) l.text(x + 630, y + 20, '♥'.repeat(Math.min(3, bondHearts(p))), 12, '#e04868', '');
}

/** Shows the party and resolves with the chosen index, or -1. */
export async function partyScreen(scene: Phaser.Scene, o: PartyOptions = {}): Promise<number> {
  const party = game.state.party;
  const l = new Layer(scene);
  let index = o.start ?? 0;
  const draw = () => {
    l.clear();
    background(l);
    party.forEach((p, i) => drawPartyRow(l, p, i, i === index, i === o.active));
    if (game.state.egg && party.length < 6) {
      const y = 12 + party.length * 64;
      const g = l.g();
      g.fillStyle(0x203850, 1).fillRoundedRect(12, y, SCREEN_W - 24, 58, 10);
      g.fillStyle(0xe8e0c8, 1).fillRoundedRect(16, y + 4, SCREEN_W - 32, 50, 8);
      g.fillStyle(0xf8f0d8, 1).fillEllipse(52, y + 29, 30, 38);
      g.fillStyle(0x88b858, 1).fillCircle(46, y + 22, 4).fillCircle(58, y + 34, 5);
      l.text(98, y + 20, 'EGG  (it moves a little)', 16);
    }
    messageBox(l, o.prompt ?? 'Choose a POKéMON.');
  };
  draw();
  let result = -1;
  await until(scene, () => {
    if (justPressed('up') && index > 0) { index--; draw(); }
    if (justPressed('down') && index < party.length - 1) { index++; draw(); }
    if (justPressed('a')) { result = index; return true; }
    if (justPressed('b')) { result = -1; return true; }
    return false;
  });
  l.clear();
  return result;
}

/** Party screen plus a small action menu for the picked Pokémon. */
export async function partyAction(scene: Phaser.Scene, actions: (p: Pokemon, i: number) => string[], o: PartyOptions = {}): Promise<{ index: number; action: string } | null> {
  let start = o.start ?? 0;
  for (;;) {
    const l = new Layer(scene, DEPTH - 1);
    const i = await partyScreen(scene, { ...o, start });
    l.clear();
    if (i < 0) return null;
    start = i;
    const p = game.state.party[i];
    const list = [...actions(p, i), 'CANCEL'];
    // Keep the party visible underneath while choosing.
    const under = new Layer(scene, DEPTH);
    background(under);
    game.state.party.forEach((q, k) => drawPartyRow(under, q, k, k === i, k === o.active));
    messageBox(under, `Do what with ${monName(p)}?`);
    const a = await choose(scene, list, { x: SCREEN_W - 260, y: SCREEN_H - 80 - list.length * 40 - 36, w: 252, rowHeight: 40, size: 16, cancel: list.length - 1, depth: DEPTH + 10 });
    under.clear();
    if (a < list.length - 1) return { index: i, action: list[a] };
  }
}

// --- summary ---------------------------------------------------------------------------------

export async function summaryScreen(scene: Phaser.Scene, list: Pokemon[], start: number): Promise<void> {
  const l = new Layer(scene);
  let i = start, page = 0;
  const pages = ['INFO', 'SKILLS', 'MOVES'];
  const draw = () => {
    l.clear();
    const p = list[i];
    const sp = SPECIES[p.species];
    background(l, 0x386858);
    const g = l.g();
    g.fillStyle(0xf8f8f0, 1).fillRoundedRect(12, 12, 260, 300, 12);
    g.fillStyle(0xd8e8d0, 1).fillRoundedRect(20, 60, 244, 180, 10);
    l.add(scene.add.image(142, 150, `mon-${p.species}`).setScale(2.4));
    l.text(28, 24, monName(p), 16);
    l.text(28, 250, `No.${sp.dex}`, 12);
    l.text(28, 274, `Lv${p.level}`, 16);
    statusBadge(l, 190, 270, p);
    sp.types.forEach((t, k) => typeBadge(l, 160 - 100 * (sp.types.length - 1 - k) + (sp.types.length === 1 ? 0 : 0), 24 + 0, t));
    // tabs
    pages.forEach((name, k) => {
      const tg = l.g();
      tg.fillStyle(k === page ? 0xf8a040 : 0x284838, 1).fillRoundedRect(290 + k * 140, 12, 132, 36, 8);
      l.text(356 + k * 140, 22, name, 12, k === page ? '#403020' : '#e0f0e0', '').setOrigin(0.5, 0);
    });
    const pg = l.g();
    pg.fillStyle(0xf8f8f0, 1).fillRoundedRect(290, 56, 418, 352, 12);
    const st = calcStats(p);
    if (page === 0) {
      const lo = expForLevel(p.level), hi = expForLevel(p.level + 1);
      const rows: [string, string][] = [
        ['TYPE', sp.types.map(upper).join('/')],
        ['ITEM', p.held ? ITEMS[p.held].name : 'NONE'],
        ['EXP', `${p.exp}`],
        ['TO NEXT Lv', `${Math.max(0, hi - p.exp)}`],
        ['BOND', '♥'.repeat(bondHearts(p)) + '♡'.repeat(5 - bondHearts(p))],
      ];
      rows.forEach(([a, b], k) => {
        l.text(310, 76 + k * 40, a, 12, '#707070');
        l.text(690, 76 + k * 40, b, 14).setOrigin(1, 0);
      });
      const eg = l.g();
      eg.fillStyle(0x404040, 1).fillRect(310, 290, 380, 10);
      eg.fillStyle(0x48a0f8, 1).fillRect(312, 292, Math.floor(376 * Phaser.Math.Clamp((p.exp - lo) / (hi - lo), 0, 1)), 6);
      const entry = DEX_ENTRIES[p.species];
      if (entry) l.text(310, 316, entry.text, 10).setWordWrapWidth(380).setLineSpacing(8);
    } else if (page === 1) {
      const rows: [string, number | string][] = [
        ['HP', `${p.hp}/${st.hp}`], ['ATTACK', st.atk], ['DEFENSE', st.def], ['SP. ATK', st.spa], ['SP. DEF', st.spd], ['SPEED', st.spe],
      ];
      rows.forEach(([a, b], k) => {
        l.text(310, 80 + k * 44, a, 14, '#707070');
        l.text(690, 80 + k * 44, `${b}`, 16).setOrigin(1, 0);
      });
      const hg = l.g();
      hpBar(hg, 450, 104, 180, p.hp, st.hp);
      if (bondHearts(p) >= 3) l.text(310, 360, 'Bond bonus: stats and EXP are boosted!', 10, '#c04060');
    } else {
      p.moves.forEach((m, k) => {
        const mv = MOVES[m.id];
        typeBadge(l, 306, 72 + k * 76, mv.type);
        l.text(416, 74 + k * 76, upper(mv.name), 16);
        l.text(690, 102 + k * 76, `PP ${m.pp}/${mv.pp}`, 12).setOrigin(1, 0);
        l.text(416, 102 + k * 76, mv.category === 'status' ? 'STATUS' : `POW ${mv.power}  ACC ${mv.accuracy || '-'}`, 10, '#707070');
      });
    }
    messageBox(l, '◀▶ page  ▲▼ POKéMON  B back');
  };
  draw();
  await until(scene, () => {
    if (justPressed('left')) { page = (page + 2) % 3; draw(); }
    if (justPressed('right')) { page = (page + 1) % 3; draw(); }
    if (justPressed('up') && i > 0) { i--; draw(); }
    if (justPressed('down') && i < list.length - 1) { i++; draw(); }
    return justPressed('b') || justPressed('a');
  });
  l.clear();
}

// --- bag ---------------------------------------------------------------------------------------

const POCKETS: { id: Pocket; name: string }[] = [
  { id: 'items', name: 'ITEMS' }, { id: 'balls', name: 'POKé BALLS' }, { id: 'key', name: 'KEY ITEMS' },
];

/** Shows the bag. Resolves with the picked item id, or null. */
export async function bagScreen(scene: Phaser.Scene, o: { prompt?: string; pocket?: Pocket } = {}): Promise<string | null> {
  let pocket = Math.max(0, POCKETS.findIndex((p) => p.id === o.pocket));
  const memo: Record<number, number> = {};
  for (;;) {
    const l = new Layer(scene);
    background(l, 0xa86838);
    const g = l.g();
    g.fillStyle(0xf0c890, 1).fillRoundedRect(16, 16, 230, 300, 14);
    g.fillStyle(0x985428, 1).fillRoundedRect(48, 70, 166, 200, 20);
    g.fillStyle(0xc87840, 1).fillRoundedRect(56, 80, 150, 60, 14);
    l.text(131, 34, POCKETS[pocket].name, 14).setOrigin(0.5, 0);
    l.text(131, 290, '◀ ▶', 14).setOrigin(0.5, 0);
    const bag = game.state.bag;
    const ids = Object.keys(bag).filter((id) => ITEMS[id] && bag[id] > 0 && pocketOf(ITEMS[id]) === POCKETS[pocket].id);
    const descBox = l.g();
    drawBox(descBox, 4, SCREEN_H - 120, SCREEN_W - 8, 116, 'world');
    const desc = l.text(30, SCREEN_H - 96, '', 14).setWordWrapWidth(SCREEN_W - 60).setLineSpacing(12);
    const names = [...ids.map((id) => ITEMS[id].name), 'CLOSE BAG'];
    const counts = [...ids.map((id) => (ITEMS[id].kind === 'key' || ITEMS[id].kind === 'rod' || ITEMS[id].kind === 'held' && bag[id] === 1 ? '' : `x${bag[id]}`)), ''];
    const pick = await scrollList(scene, names, {
      x: 262, y: 16, w: 450, rows: 8, start: memo[pocket] ?? 0, right: counts, sides: true,
      onMove: (i) => {
        memo[pocket] = i;
        desc.setText(i < ids.length ? ITEMS[ids[i]].desc : (o.prompt ?? 'Close the bag.'));
      },
    });
    l.clear();
    if (pick === -2 || pick === -3) {
      pocket = (pocket + POCKETS.length + (pick === -2 ? -1 : 1)) % POCKETS.length;
      continue;
    }
    if (pick < 0 || pick >= ids.length) return null;
    return ids[pick];
  }
}


// --- Pokédex -----------------------------------------------------------------------------------

export async function dexScreen(scene: Phaser.Scene): Promise<void> {
  const s = game.state;
  const list = [...SPECIES_LIST].sort((a, b) => a.dex.localeCompare(b.dex));
  const seenCount = list.filter((sp) => s.seen[sp.id]).length;
  const caughtCount = list.filter((sp) => s.caught[sp.id]).length;
  let start = 0;
  for (;;) {
    const l = new Layer(scene);
    background(l, 0xc03838);
    const g = l.g();
    g.fillStyle(0xf8f8f0, 1).fillRoundedRect(16, 16, 250, 260, 14);
    const pic = l.add(scene.add.image(141, 140, 'mon-' + list[0].id).setScale(2));
    l.text(141, 290, `SEEN ${seenCount}`, 14, '#ffffff', '#702020').setOrigin(0.5, 0);
    l.text(141, 316, `OWN  ${caughtCount}`, 14, '#ffffff', '#702020').setOrigin(0.5, 0);
    l.text(141, 360, 'POKéDEX', 16, '#ffffff', '#702020').setOrigin(0.5, 0);
    const names = list.map((sp) => `${sp.dex} ${s.seen[sp.id] ? upper(sp.name) : '----------'}`);
    const marks = list.map((sp) => (s.caught[sp.id] ? '●' : ''));
    const i = await scrollList(scene, names, {
      x: 282, y: 16, w: 430, rows: 11, start, right: marks,
      onMove: (k) => {
        const sp = list[k];
        pic.setTexture(`mon-${sp.id}`).setTint(s.seen[sp.id] ? 0xffffff : 0x000000).setAlpha(s.seen[sp.id] ? 1 : 0.35);
      },
    });
    l.clear();
    if (i < 0) return;
    start = i;
    const sp = list[i];
    if (!s.seen[sp.id]) continue;
    await dexEntry(scene, sp.id);
  }
}

async function dexEntry(scene: Phaser.Scene, id: string) {
  const s = game.state;
  const sp = SPECIES[id];
  const l = new Layer(scene);
  background(l, 0xc03838);
  const g = l.g();
  g.fillStyle(0xf8f8f0, 1).fillRoundedRect(16, 16, SCREEN_W - 32, 300, 14);
  g.fillStyle(0xd8e8d0, 1).fillRoundedRect(32, 32, 220, 220, 12);
  l.add(scene.add.image(142, 142, `mon-${id}`).setScale(2.6));
  l.text(280, 40, `No.${sp.dex}  ${upper(sp.name)}`, 18);
  const e = DEX_ENTRIES[id];
  l.text(280, 76, `${e?.kind ?? '???'} POKéMON`, 12, '#707070');
  sp.types.forEach((t, k) => typeBadge(l, 280 + k * 104, 104, t));
  if (s.caught[id]) {
    l.text(280, 150, e?.text ?? 'No data yet.', 12).setWordWrapWidth(400).setLineSpacing(10);
  } else {
    l.text(280, 150, 'Catch it to learn more!', 12, '#909090');
  }
  if (sp.evolvesTo) l.text(280, 270, `Evolves at Lv${sp.evolvesTo.level}`, 10, '#707070');
  messageBox(l, 'B back');
  await until(scene, () => justPressed('b') || justPressed('a'));
  l.clear();
}

// --- trainer card -------------------------------------------------------------------------------

export function playTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export async function trainerCard(scene: Phaser.Scene): Promise<void> {
  const s = game.state;
  const l = new Layer(scene);
  background(l, 0x2c3c58);
  const g = l.g();
  g.fillStyle(0xd8a040, 1).fillRoundedRect(40, 30, SCREEN_W - 80, 400, 18);
  g.fillStyle(0xf8e8b8, 1).fillRoundedRect(52, 42, SCREEN_W - 104, 376, 12);
  l.text(76, 62, `IDNo.${String(s.trainerId).padStart(5, '0')}`, 14);
  l.text(76, 100, 'NAME: BERYL', 18);
  const caught = Object.keys(s.caught).filter((k) => s.caught[k]).length;
  const rows: [string, string][] = [
    ['MONEY', `$${s.money}`],
    ['POKéDEX', `${caught}`],
    ['TIME', playTime(s.playMs)],
  ];
  rows.forEach(([a, b], k) => {
    l.text(76, 150 + k * 40, a, 14);
    l.text(420, 150 + k * 40, b, 14).setOrigin(1, 0);
  });
  // Beryl's portrait
  const pg = l.g();
  pg.fillStyle(0xe8d098, 1).fillRoundedRect(470, 70, 180, 180, 12);
  l.add(scene.add.sprite(560, 230, 'c-beryl', 0).setOrigin(0.5, 1).setScale(6));
  l.text(76, 286, 'BADGES', 14);
  BADGE_ORDER.forEach((b, k) => {
    const x = 96 + k * 72, y = 350;
    const bg = l.g();
    const got = !!s.flags[`badge_${b.town}`];
    bg.fillStyle(0x806040, 1).fillCircle(x, y, 26);
    bg.fillStyle(got ? TYPE_COLORS[b.type] : 0xb8a078, 1).fillCircle(x, y, 22);
    if (got) {
      bg.fillStyle(0xffffff, 0.6).fillCircle(x - 7, y - 7, 6);
      l.text(x, y + 30, b.name.split(' ')[0], 8, '#403020', '').setOrigin(0.5, 0);
    }
  });
  if (s.flags.hallOfFame) l.text(SCREEN_W / 2, 400, '★ CHAMPION OF KALDRIA ★', 12, '#a04020', '').setOrigin(0.5, 0);
  await until(scene, () => justPressed('b') || justPressed('a'));
  l.clear();
}

// --- Mart ---------------------------------------------------------------------------------------

export async function martScreen(scene: Phaser.Scene, stock: string[], say: (s: string) => Promise<void>): Promise<void> {
  const s = game.state;
  for (;;) {
    const mode = await choose(scene, ['BUY', 'SELL', 'SEE YA!'], { x: 8, y: 8, w: 240, cancel: 2, depth: DEPTH });
    if (mode === 2) return;
    if (mode === 0) {
      for (;;) {
        const money = new Layer(scene, DEPTH);
        const mg = money.g();
        drawBox(mg, 8, 8, 240, 70, 'world');
        money.text(30, 34, `$${s.money}`, 16);
        const i = await scrollList(scene, stock.map((id) => ITEMS[id].name), {
          x: 262, y: 8, w: 450, rows: 7, right: stock.map((id) => `$${ITEMS[id].price}`),
        });
        money.clear();
        if (i < 0) break;
        const it = ITEMS[stock[i]];
        const max = Math.min(99, Math.floor(s.money / it.price!));
        if (max <= 0) { await say("You don't have enough money."); continue; }
        const n = await numberPicker(scene, { min: 1, max, value: 1, format: (n) => `x${String(n).padStart(2, '0')}  $${n * it.price!}` });
        if (!n) continue;
        s.money -= n * it.price!;
        s.bag[it.id] = (s.bag[it.id] ?? 0) + n;
        await say(`Here you go! Thank you! (${it.name} x${n})`);
        if (it.id === 'pokeball' && n >= 10) {
          s.bag.greatball = (s.bag.greatball ?? 0) + 1;
          await say('Oh, and here is a GREAT BALL as a bonus!');
        }
      }
    } else {
      for (;;) {
        const ids = Object.keys(s.bag).filter((id) => ITEMS[id]?.price && s.bag[id] > 0);
        if (!ids.length) { await say('You have nothing I can buy.'); break; }
        const i = await scrollList(scene, ids.map((id) => ITEMS[id].name), {
          x: 262, y: 8, w: 450, rows: 7, right: ids.map((id) => `x${s.bag[id]}`),
        });
        if (i < 0) break;
        const it = ITEMS[ids[i]];
        const price = Math.floor(it.price! / 2);
        const n = await numberPicker(scene, { min: 1, max: s.bag[it.id], value: 1, format: (n) => `x${String(n).padStart(2, '0')}  $${n * price}` });
        if (!n) continue;
        s.bag[it.id] -= n;
        if (s.bag[it.id] <= 0) delete s.bag[it.id];
        s.money += n * price;
        await say(`Sold for $${n * price}.`);
      }
    }
  }
}

// --- PC box ------------------------------------------------------------------------------------

export async function pcScreen(scene: Phaser.Scene, say: (s: string) => Promise<void>): Promise<void> {
  const s = game.state;
  for (;;) {
    const mode = await choose(scene, ['WITHDRAW', 'DEPOSIT', 'SEE BOX', 'LOG OFF'], { x: 8, y: 8, w: 300, cancel: 3, depth: DEPTH });
    if (mode === 3) return;
    if (mode === 0 || mode === 2) {
      if (!s.box.length) { await say('The BOX is empty.'); continue; }
      const i = await scrollList(scene, s.box.map(monName), { x: 320, y: 8, w: 392, rows: 9, right: s.box.map((p) => `Lv${p.level}`) });
      if (i < 0) continue;
      if (mode === 2) { await summaryScreen(scene, s.box, i); continue; }
      if (s.party.length >= 6) { await say('Your party is full!'); continue; }
      const [p] = s.box.splice(i, 1);
      s.party.push(p);
      await say(`${monName(p)} joined your party.`);
    } else {
      if (s.party.length <= 1) { await say("You can't deposit your last POKéMON!"); continue; }
      const i = await partyScreen(scene, { prompt: 'Deposit which POKéMON?' });
      if (i < 0) continue;
      const left = s.party.filter((p, k) => k !== i && p.hp > 0);
      if (!left.length) { await say('You need at least one healthy POKéMON with you!'); continue; }
      const [p] = s.party.splice(i, 1);
      s.box.push(p);
      await say(`${monName(p)} was stored in the BOX.`);
    }
  }
}

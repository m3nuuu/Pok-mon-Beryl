import Phaser from 'phaser';
import { DIR_FRAMES, tableTexture } from '../art/procedural';
import { calcStats, createPokemon, heal, healBy, wildLevel, type Pokemon } from '../battle/engine';
import { buildTeam } from '../battle/teams';
import { ITEMS, martStock } from '../data/items';
import {
  MAPS, badgeCount, exitAt, isSolidTile, tileAt, type BattleBg, type MapDef, type MapId, type NpcDef, type TrainerDef,
} from '../data/maps';
import { SPECIES } from '../data/species';
import { heldDirection, isHeld, justPressed } from '../input';
import { addItem, game, receive, register, save, takeItem, HOME_DOOR, type Facing } from '../state';
import type { BattleRequest, ScriptApi } from '../story/api';
import { afterTrainer, mapTint, onEnterMap, onInspect, onStep, onStepGrassWithoutPokemon, onTalk } from '../story/story';
import {
  bagScreen, dexScreen, martScreen, monName, numberPicker, partyAction, partyScreen, pcScreen, scrollList, summaryScreen, trainerCard,
} from '../ui/screens';
import { delay, tweenP } from '../ui/widgets';
import type { BattleConfig, BattleResult } from './BattleScene';
import type { UIScene } from './UIScene';

const T = 16;
const WALK_MS = 200;
const RUN_MS = 110;
const ENCOUNTER_RATE = 1 / 10;
const DELTA: Record<Facing, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE: Record<Facing, Facing> = { up: 'down', down: 'up', left: 'right', right: 'left' };

const OUTDOOR_TEXTURES: Record<string, string> = {
  '.': 't-grass', ',': 't-tall', ':': 't-path', F: 't-flowers', T: 't-tree', '~': 't-water0',
  V: 't-spill0', W: 't-dam', E: 't-damdoor', '=': 't-bridge', f: 't-fence', S: 't-sign',
  B: 't-grass', D: 't-path', d: 't-dock', R: 't-cliff', O: 't-boulder', L: 't-lantern', l: 't-lava0',
  C: 't-cave', s: 't-sand', P: 't-pave',
};

const INDOOR_TEXTURES: Record<string, string> = {
  '#': 'i-void', W: 'i-wall', w: 'i-window', s: 'i-shelf', _: 'i-floor', k: 'i-counter',
  p: 'i-plant', v: 'i-tv', B: 'i-books', o: 'i-pen', X: 'i-mat', c: 'i-pc', r: 'i-ccounter',
  m: 'i-goods', g: 'i-statue', a: 'i-mural', z: 'i-machine', '~': 't-water0', '=': 'i-grate', H: 'i-hatch', l: 'i-lantern',
};

class Walker {
  sprite: Phaser.GameObjects.Sprite;
  moving = false;
  private stepParity = 0;
  private readonly isMon: boolean;

  constructor(scene: Phaser.Scene, look: string, public x: number, public y: number, public facing: Facing, public def?: NpcDef) {
    this.isMon = look.startsWith('mon-');
    this.sprite = this.isMon
      ? scene.add.sprite(0, 0, look).setScale(0.42).setOrigin(0.5, 0.95)
      : scene.add.sprite(0, 0, scene.textures.exists(`c-${look}`) ? `c-${look}` : 'c-neighbor', 0).setOrigin(0.5, 1);
    if (this.isMon) scene.tweens.add({ targets: this.sprite, scaleY: 0.4, duration: 600, yoyo: true, repeat: -1 });
    this.place();
    this.face(facing);
  }

  place() {
    this.sprite.setPosition(this.x * T + T / 2, this.y * T + T);
    this.sprite.setDepth(this.y * 10 + 5);
  }

  private frame(offset: number) {
    if (this.isMon) return;
    const base = DIR_FRAMES[this.facing === 'right' ? 'left' : this.facing];
    this.sprite.setFrame(base + offset).setFlipX(this.facing === 'right');
  }

  face(dir: Facing) {
    this.facing = dir;
    this.frame(0);
  }

  async step(scene: Phaser.Scene, dir: Facing, running = false) {
    const ms = running ? RUN_MS : WALK_MS;
    this.face(dir);
    this.moving = true;
    const [dx, dy] = DELTA[dir];
    this.x += dx;
    this.y += dy;
    this.stepParity ^= 1;
    this.frame(1 + this.stepParity);
    this.sprite.setDepth(Math.max(this.y, this.y - dy) * 10 + 5);
    scene.time.delayedCall(ms / 2, () => this.frame(0));
    await tweenP(scene, { targets: this.sprite, x: this.x * T + T / 2, y: this.y * T + T, duration: ms });
    this.place();
    this.moving = false;
  }

  destroy() {
    this.sprite.destroy();
  }
}

/** Where FLY and the ferry land in a town: in front of its Pokémon Center (or Beryl's house). */
export function flyPoint(town: string): { map: MapId; x: number; y: number } | null {
  const m = MAPS[town];
  if (!m) return null;
  const b = m.buildings.find((x) => x.id === 'center') ?? m.buildings.find((x) => x.id === 'home');
  return b ? { map: town, x: b.door.x, y: b.door.y + 1 } : null;
}

export class WorldScene extends Phaser.Scene implements ScriptApi {
  private map!: MapDef;
  private player!: Walker;
  private follower: Walker | null = null;
  private npcs = new Map<string, Walker>();
  private temp = new Set<string>();
  private mapObjects: Phaser.GameObjects.GameObject[] = [];
  private grassOverlay!: Phaser.GameObjects.Image;
  private tint!: Phaser.GameObjects.Rectangle;
  private animated: { img: Phaser.GameObjects.Image; base: string }[] = [];
  private busy = false;
  private turnUntil = 0;
  private ui!: UIScene;

  constructor() {
    super('world');
  }

  get mapId(): MapId {
    return this.map.id;
  }

  create() {
    this.busy = false;
    this.scene.launch('ui');
    this.ui = this.scene.get('ui') as UIScene;
    this.cameras.main.setBackgroundColor('#000000');

    let frame = 0;
    this.time.addEvent({
      delay: 450, loop: true, callback: () => {
        frame ^= 1;
        for (const a of this.animated) a.img.setTexture(`${a.base}${frame}`);
      },
    });

    const p = game.state.player;
    if (MAPS[p.map]) this.buildMap(p.map, p.x, p.y, p.facing);
    else this.buildMap(HOME_DOOR.map, HOME_DOOR.x, HOME_DOOR.y, HOME_DOOR.facing);
    this.cameras.main.fadeIn(300);
    // The UI scene finishes starting on the next frame; story scripts talk through it.
    void this.script(async () => {
      await delay(this, 50);
      await this.entered();
    });
  }

  // --- map building -----------------------------------------------------------

  private themed(key: string): string {
    const th = this.map.theme;
    if (th && this.textures.exists(`${key}@${th}`)) return `${key}@${th}`;
    return key;
  }

  private buildMap(id: MapId, x: number, y: number, facing: Facing) {
    for (const o of this.mapObjects) o.destroy();
    this.mapObjects = [];
    this.animated = [];
    for (const w of this.npcs.values()) w.destroy();
    this.npcs.clear();
    this.temp.clear();
    this.player?.destroy();
    this.follower?.destroy();
    this.follower = null;

    this.map = MAPS[id];
    game.state.player = { map: id, x, y, facing };
    const add = <G extends Phaser.GameObjects.GameObject>(o: G) => {
      this.mapObjects.push(o);
      return o;
    };

    const rows = this.map.rows;
    for (let ty = 0; ty < rows.length; ty++) {
      for (let tx = 0; tx < rows[0].length; tx++) {
        const img = add(this.add.image(tx * T, ty * T, this.textureFor(tx, ty)).setOrigin(0));
        const c = rows[ty][tx];
        if (c === '~') this.animated.push({ img, base: 't-water' });
        if (this.map.kind === 'outdoor' && c === 'V') this.animated.push({ img, base: 't-spill' });
        if (this.map.kind === 'outdoor' && c === 'l') this.animated.push({ img, base: 't-lava' });
      }
    }
    for (const b of this.map.buildings) {
      add(this.add.image(b.x * T, b.y * T, `b-${b.id}`).setOrigin(0).setDepth((b.y + b.h - 1) * 10 + 1));
    }

    this.player = new Walker(this, 'beryl', x, y, facing);
    this.grassOverlay = add(this.add.image(0, 0, this.themed('t-tall-top')).setOrigin(0).setVisible(false));
    this.tint = add(this.add.rectangle(-T * 20, -T * 20, (this.map.rows[0].length + 40) * T, (this.map.rows.length + 40) * T, 0x000000, 0).setOrigin(0).setDepth(90000));
    this.refresh();
    this.updateGrassOverlay();

    const cam = this.cameras.main;
    const mw = rows[0].length * T, mh = rows.length * T;
    const vw = cam.width / 3, vh = cam.height / 3;
    cam.setZoom(3).setRoundPixels(true);
    cam.setBounds(mw < vw ? (mw - vw) / 2 : 0, mh < vh ? (mh - vh) / 2 : 0, Math.max(mw, vw), Math.max(mh, vh));
    cam.startFollow(this.player.sprite, true);
    cam.setFollowOffset(0, 8);
  }

  private textureFor(x: number, y: number): string {
    const m = this.map;
    const c = tileAt(m, x, y);
    if (m.kind === 'outdoor') {
      if (c === 'W' && tileAt(m, x, y - 1) !== 'W') return 't-damtop';
      return this.themed(OUTDOOR_TEXTURES[c] ?? 't-grass');
    }
    if (c === 'b') return tileAt(m, x, y - 1) === 'b' ? 'i-bedbot' : 'i-bedtop';
    if (c === 'T') {
      if (this.textures.exists('i-table')) return 'i-table';
      const t = (dx: number, dy: number) => tileAt(m, x + dx, y + dy) === 'T';
      return tableTexture(this, t(0, -1), t(1, 0), t(0, 1), t(-1, 0));
    }
    return this.themed(INDOOR_TEXTURES[c] ?? 'i-floor');
  }

  private activeDef(id: string): NpcDef | undefined {
    const f = game.state.flags;
    return this.map.npcs.find((n) => n.id === id && (!n.when || n.when(f)));
  }

  /** Shows exactly the NPCs whose conditions hold now. */
  refresh() {
    const f = game.state.flags;
    const wanted = new Map<string, NpcDef>();
    for (const n of this.map.npcs) if ((!n.when || n.when(f)) && !wanted.has(n.id)) wanted.set(n.id, n);
    for (const [id, w] of this.npcs) {
      if (this.temp.has(id)) continue;
      if (wanted.get(id) !== w.def) {
        w.destroy();
        this.npcs.delete(id);
      }
    }
    for (const [id, n] of wanted) {
      if (!this.npcs.has(id)) this.npcs.set(id, new Walker(this, n.look, n.x, n.y, n.facing, n));
    }
    // The family Pokémon follows Beryl around town in the morning.
    const follow = !!f.parentsLeft && !f.gotStarter && !this.npcs.has('homemon');
    if (follow && !this.follower) {
      const [dx, dy] = DELTA[OPPOSITE[this.player.facing]];
      const fx = this.player.x + dx, fy = this.player.y + dy;
      const free = !this.blocked(fx, fy);
      this.follower = new Walker(this, 'homemon', free ? fx : this.player.x, free ? fy : this.player.y, this.player.facing);
      if (!free) this.follower.sprite.setVisible(false);
    } else if (!follow && this.follower) {
      this.follower.destroy();
      this.follower = null;
    }
    const tint = mapTint(this.map.id);
    this.tint?.setFillStyle(tint?.color ?? 0, tint?.alpha ?? 0);
  }

  spawn(id: string, look: string, x: number, y: number, facing: Facing) {
    this.npcs.get(id)?.destroy();
    this.npcs.set(id, new Walker(this, look, x, y, facing));
    this.temp.add(id);
  }

  despawn(id: string) {
    this.npcs.get(id)?.destroy();
    this.npcs.delete(id);
    this.temp.delete(id);
  }

  private npcAt(x: number, y: number): string | undefined {
    for (const [id, w] of this.npcs) if (w.x === x && w.y === y) return id;
    return undefined;
  }

  private blocked(x: number, y: number) {
    return isSolidTile(tileAt(this.map, x, y)) || this.npcAt(x, y) !== undefined;
  }

  private updateGrassOverlay() {
    const onGrass = this.map.kind === 'outdoor' && tileAt(this.map, this.player.x, this.player.y) === ',';
    this.grassOverlay.setVisible(onGrass);
    if (onGrass) this.grassOverlay.setPosition(this.player.x * T, this.player.y * T).setDepth(this.player.y * 10 + 6);
  }

  private async script(fn: () => Promise<unknown>) {
    this.busy = true;
    try {
      await fn();
    } catch (e) {
      console.error(e);
    } finally {
      this.busy = false;
    }
  }

  /** Runs after arriving on a map: visited towns, map name banner, story scenes, trainers in sight. */
  private async entered() {
    const f = game.state.flags;
    if (this.map.town && this.map.kind === 'outdoor') f[`visited_${this.map.town}`] = true;
    if (this.map.kind === 'outdoor') void this.ui.banner(this.map.name);
    await onEnterMap(this);
    this.refresh();
    await this.checkTrainers();
  }

  // --- player control -----------------------------------------------------------

  update(time: number, dt: number) {
    game.state.playMs += dt;
    if (this.busy || this.player.moving) return;

    if (justPressed('a')) {
      const [dx, dy] = DELTA[this.player.facing];
      void this.script(() => this.interact(this.player.x + dx, this.player.y + dy));
      return;
    }
    if (justPressed('start')) {
      void this.script(() => this.startMenu());
      return;
    }

    const dir = heldDirection();
    if (!dir) return;
    if (dir !== this.player.facing) {
      this.player.face(dir);
      this.turnUntil = time + 90;
      return;
    }
    if (time < this.turnUntil) return;
    void this.tryStep(dir);
  }

  private async tryStep(dir: Facing) {
    const [dx, dy] = DELTA[dir];
    const nx = this.player.x + dx, ny = this.player.y + dy;

    const exit = exitAt(this.map, nx, ny);
    if (exit) {
      await this.script(async () => {
        await this.warp(exit.exit.map, exit.tx, exit.ty, dir, undefined, 150);
        await this.entered();
      });
      return;
    }
    if (this.blocked(nx, ny)) return;
    const closed = this.map.warps.find((w) => w.x === nx && w.y === ny && w.when && !w.when(game.state.flags));
    if (closed) {
      await this.script(() => this.say(...(closed.locked ?? ["It's locked."])));
      return;
    }
    if (tileAt(this.map, nx, ny) === ',' && game.state.party.length === 0) {
      await this.script(() => onStepGrassWithoutPokemon(this));
      return;
    }
    const from = { x: this.player.x, y: this.player.y };
    const running = isHeld('b');
    const steps = [this.player.step(this, dir, running)];
    if (this.follower) {
      const f = this.follower;
      const fdx = from.x - f.x, fdy = from.y - f.y;
      const fdir: Facing = fdx > 0 ? 'right' : fdx < 0 ? 'left' : fdy > 0 ? 'down' : 'up';
      if (fdx || fdy) steps.push(f.step(this, fdir, running));
      f.sprite.setVisible(true);
    }
    await Promise.all(steps);
    game.state.player = { map: this.map.id, x: this.player.x, y: this.player.y, facing: this.player.facing };
    this.updateGrassOverlay();

    const warp = this.map.warps.find((w) => w.x === this.player.x && w.y === this.player.y);
    if (warp) {
      await this.script(async () => {
        await this.warp(warp.to, warp.tx, warp.ty, warp.facing);
        await this.entered();
      });
      return;
    }
    let scene = false;
    await this.script(async () => {
      await this.stepCounters();
      scene = await onStep(this);
      if (!scene) scene = await this.checkTrainers();
    });
    if (scene) return;
    const tile = this.map.encounterTile ?? ',';
    if (tileAt(this.map, this.player.x, this.player.y) === tile && this.encounterTable() && Math.random() < ENCOUNTER_RATE) {
      await this.script(() => this.wildEncounter());
    }
  }

  /** Egg hatching and Repel, counted per step. */
  private async stepCounters() {
    const s = game.state;
    if (s.repel > 0) {
      s.repel -= 1;
      if (s.repel === 0) await this.say("REPEL's effect wore off...");
    }
    if (s.egg) {
      s.egg.steps -= 1;
      if (s.egg.steps <= 0) {
        const species = s.egg.species;
        delete s.egg;
        await this.say('Oh?');
        await this.ui.hatch(species);
        const mon = createPokemon(species, 5);
        mon.bond = 120;
        const where = receive(mon);
        await this.say(`${monName(mon)} hatched from the EGG!`, ...(where === 'box' ? [`${monName(mon)} was sent to the PC BOX.`] : []));
        save();
      }
    }
  }

  private encounterTable(): [string, number][] | undefined {
    const p = this.player;
    const zone = this.map.zones?.find((z) => p.x >= z.x0 && p.x <= z.x1 && p.y >= z.y0 && p.y <= z.y1);
    return zone?.encounters ?? this.map.encounters;
  }

  private battleBg(): BattleBg {
    if (this.map.battleBg) return this.map.battleBg;
    if (this.map.kind === 'indoor') return 'indoor';
    if (this.map.theme === 'snow') return 'snow';
    if (this.map.theme === 'cave') return 'cave';
    if (this.map.theme === 'marsh') return 'marsh';
    return 'plain';
  }

  private async interact(x: number, y: number) {
    let npc = this.npcAt(x, y);
    // Nurses and clerks stand behind their counter.
    if (!npc && tileAt(this.map, x, y) === 'r') {
      const [dx, dy] = DELTA[this.player.facing];
      npc = this.npcAt(x + dx, y + dy);
    }
    if (npc) {
      const def = this.npcs.get(npc)?.def ?? this.activeDef(npc);
      if (def?.item) return this.pickUp(npc, def);
      if (!def?.look.startsWith('mon-')) this.faceBeryl(npc);
      if (await onTalk(this, npc)) return;
      if (def?.trainer) return this.trainerTalk(npc, def);
      if (npc === 'nurse') return this.nurse();
      if (npc === 'clerk') return this.mart();
      if (def?.text?.length) return this.say(...def.text);
      return this.say(`${def?.name ?? '...'}: ...`);
    }
    if (await onInspect(this, x, y)) return;
    const c = tileAt(this.map, x, y);
    if (c === 'c') return this.pc();
    const text = this.map.inspect[`${x},${y}`];
    if (text) return this.say(text.join('\n'));
    if (c === '~') {
      if (await this.tryFish()) return;
      if (this.map.kind === 'outdoor') return this.say('The LETHYS flows past, cold and clear.');
    }
  }

  private async pickUp(id: string, def: NpcDef) {
    const it = ITEMS[def.item!.id];
    const n = def.item!.n ?? 1;
    addItem(it.id, n);
    game.state.flags[id] = true;
    this.refresh();
    await this.say(`BERYL found ${n > 1 ? `${n}x ` : ''}${it.name}!`, 'BERYL put it in the BAG.');
  }

  // --- trainers ---------------------------------------------------------------------

  private trainerFlag(id: string) {
    return `tr_${this.map.id}_${id}`;
  }

  /** Looks for an undefeated trainer that can see Beryl. Returns true if a battle started. */
  private async checkTrainers(): Promise<boolean> {
    const f = game.state.flags;
    if (game.state.party.every((p) => p.hp <= 0)) return false;
    for (const [id, w] of this.npcs) {
      const t = w.def?.trainer;
      if (!t || !t.sight || f[this.trainerFlag(id)]) continue;
      const [dx, dy] = DELTA[w.facing];
      let seen = 0;
      for (let k = 1; k <= t.sight; k++) {
        const tx = w.x + dx * k, ty = w.y + dy * k;
        if (tx === this.player.x && ty === this.player.y) { seen = k; break; }
        if (isSolidTile(tileAt(this.map, tx, ty)) || this.npcAt(tx, ty)) break;
      }
      if (!seen) continue;
      await this.emote(id, 'exclaim');
      await this.walk(id, Array<Facing>(seen - 1).fill(w.facing));
      this.player.face(OPPOSITE[w.facing]);
      await this.trainerTalk(id, w.def!);
      return true;
    }
    return false;
  }

  private named(t: TrainerDef, lines: string[]) {
    return lines.map((s) => (/^[A-Z .']+:/.test(s) ? s : `${t.name}: ${s}`));
  }

  private async trainerTalk(id: string, def: NpcDef) {
    const t = def.trainer!;
    const flag = this.trainerFlag(id);
    const f = game.state.flags;
    if (f[flag]) return this.say(...this.named(t, t.after ?? t.defeat));
    await this.say(...this.named(t, t.intro));
    const result = await this.fightTrainer(t);
    if (result === 'lose') return this.whiteOut();
    f[flag] = true;
    await this.say(...this.named(t, t.defeat));
    if (t.badge && !f[t.badge.flag]) {
      f[t.badge.flag] = true;
      game.state.badges = badgeCount(f);
      await this.say(`BERYL received the ${t.badge.name}!`);
      if (t.after) await this.say(...this.named(t, t.after));
    }
    if (t.reward) {
      addItem(t.reward.id, t.reward.n ?? 1);
      await this.say(`BERYL received ${ITEMS[t.reward.id].name}!`);
    }
    await afterTrainer(this, id);
    save();
  }

  fightTrainer(t: TrainerDef, canLose = false): Promise<BattleResult> {
    const enemies = buildTeam(t.team, t.tier ?? 'route', badgeCount(game.state.flags), t.scaleTeam);
    return this.battle({
      kind: 'trainer', trainerName: t.name, enemies, smart: t.smart ?? t.tier !== 'route', prize: t.prize ?? 20,
      bg: t.bg, canLose,
    });
  }

  // --- wild Pokémon and fishing ---------------------------------------------------------

  private roll(list: [string, number][]): string {
    const total = list.reduce((a, [, w]) => a + w, 0);
    let roll = Math.random() * total;
    return list.find(([, w]) => (roll -= w) < 0)?.[0] ?? list[0][0];
  }

  private async wildEncounter(list = this.encounterTable()!, bg = this.battleBg(), bonus = 0) {
    const species = this.roll(list);
    const enemy = createPokemon(species, Math.max(2, wildLevel(badgeCount(game.state.flags), Math.random) + bonus));
    const lead = game.state.party.find((p) => p.hp > 0);
    if (game.state.repel > 0 && lead && enemy.level < lead.level) return;
    const result = await this.battle({ kind: 'wild', enemy, bg });
    if (result === 'lose') await this.whiteOut();
    save();
  }

  private async tryFish(): Promise<boolean> {
    const rod = ['goodrod', 'oldrod'].find((r) => game.state.bag[r]);
    if (!rod || !this.map.fishing) return false;
    if (!(await this.yesNo(`Use the ${ITEMS[rod].name}?`))) return true;
    return this.fish(rod);
  }

  private async fish(rod: string): Promise<boolean> {
    await this.say('BERYL cast the line...', '. . .');
    if (Math.random() >= (rod === 'goodrod' ? 0.85 : 0.6)) {
      await this.say('Not even a nibble...');
      return true;
    }
    await this.say('Oh! A bite!');
    await this.wildEncounter(this.map.fishing!, 'water', rod === 'goodrod' ? 2 : -1);
    return true;
  }

  // --- Pokémon Center, Mart, PC ------------------------------------------------------------

  private async nurse() {
    await this.say('NURSE: Welcome to the POKéMON CENTER! We heal your POKéMON back to perfect health.');
    if (!(await this.yesNo('NURSE: Shall we heal your POKéMON?'))) return this.say('NURSE: We hope to see you again!');
    await this.say("NURSE: Okay, I'll take your POKéMON for a few seconds.");
    await this.fadeOut(250);
    for (const p of game.state.party) heal(p);
    await this.wait(400);
    await this.fadeIn(250);
    if (this.map.town) game.state.lastCenter = this.map.town;
    save();
    await this.say('NURSE: Thank you for waiting. Your POKéMON are fighting fit!', 'NURSE: We hope to see you again!');
  }

  private async mart() {
    await this.say('CLERK: Hi there! May I help you?');
    await martScreen(this.ui, martStock(badgeCount(game.state.flags)), (s) => this.ui.say(`CLERK: ${s}`));
    await this.say('CLERK: Please come again!');
  }

  private async pc() {
    await this.say('BERYL booted up the PC.', "Accessed PROF. SPRUCE's POKéMON STORAGE SYSTEM.");
    await pcScreen(this.ui, (s) => this.ui.say(s));
  }

  // --- start menu ------------------------------------------------------------------------

  private async startMenu() {
    const f = game.state.flags;
    for (;;) {
      const items = [...(f.hasDex ? ['POKéDEX'] : []), 'POKéMON', 'BAG', 'BERYL', 'SAVE', 'EXIT'];
      const i = await this.ui.menu(items, 236);
      const pick = items[i];
      if (!pick || pick === 'EXIT') return;
      if (pick === 'POKéDEX') await dexScreen(this.ui);
      if (pick === 'POKéMON') {
        if (game.state.party.length === 0) await this.say("You don't have any POKéMON yet.");
        else if (await this.partyMenu()) return;
      }
      if (pick === 'BAG' && (await this.bag())) return;
      if (pick === 'BERYL') await trainerCard(this.ui);
      if (pick === 'SAVE') {
        if (await this.yesNo('Would you like to save the game?')) {
          save();
          await this.say('BERYL saved the game.');
        }
        return;
      }
    }
  }

  /** Returns true when the menu should close (e.g. after FLY). */
  private async partyMenu(): Promise<boolean> {
    const party = game.state.party;
    let start = 0;
    for (;;) {
      const r = await partyAction(this.ui, (p) => {
        const a = ['SUMMARY', 'SWITCH', 'ITEM'];
        if (SPECIES[p.species].types.includes('Flying') && this.map.kind === 'outdoor' && badgeCount(game.state.flags) >= 1) a.unshift('FLY');
        return a;
      }, { start });
      if (!r) return false;
      start = r.index;
      const p = party[r.index];
      if (r.action === 'SUMMARY') await summaryScreen(this.ui, party, r.index);
      if (r.action === 'SWITCH') {
        const j = await partyScreen(this.ui, { prompt: `Move ${monName(p)} where?`, start: r.index });
        if (j >= 0 && j !== r.index) [party[r.index], party[j]] = [party[j], party[r.index]];
      }
      if (r.action === 'ITEM') await this.heldItem(p);
      if (r.action === 'FLY' && (await this.fly(p))) return true;
    }
  }

  private async heldItem(p: Pokemon) {
    const c = await this.ui.menu(['GIVE', 'TAKE', 'CANCEL'], 200);
    if (c === 0) {
      const id = await bagScreen(this.ui, { prompt: `Give an item to ${monName(p)}.`, pocket: 'items' });
      if (!id) return;
      if (ITEMS[id].kind !== 'held') return this.say(`${ITEMS[id].name} can't be held.`);
      if (p.held) addItem(p.held);
      takeItem(id);
      p.held = id;
      await this.say(`${monName(p)} is now holding the ${ITEMS[id].name}.`);
    } else if (c === 1) {
      if (!p.held) return this.say(`${monName(p)} isn't holding anything.`);
      addItem(p.held);
      await this.say(`Took the ${ITEMS[p.held].name} from ${monName(p)}.`);
      delete p.held;
    }
  }

  private async fly(p: Pokemon): Promise<boolean> {
    const f = game.state.flags;
    const towns = Object.values(MAPS).filter((m) => m.town && m.kind === 'outdoor' && m.id === m.town && f[`visited_${m.town}`]);
    if (!towns.length) return false;
    const i = await scrollList(this.ui, towns.map((m) => m.name), { x: 200, y: 20, w: 400, rows: Math.min(9, towns.length) });
    if (i < 0) return false;
    const pt = flyPoint(towns[i].id);
    if (!pt) return false;
    await this.say(`${monName(p)} used FLY!`);
    await this.warp(pt.map, pt.x, pt.y, 'down');
    await this.entered();
    return true;
  }

  /** Field use of the bag. Returns true when the menu should close. */
  private async bag(): Promise<boolean> {
    for (;;) {
      const id = await bagScreen(this.ui);
      if (!id) return false;
      const it = ITEMS[id];
      const party = game.state.party;
      if (it.kind === 'rod') {
        const [dx, dy] = DELTA[this.player.facing];
        if (tileAt(this.map, this.player.x + dx, this.player.y + dy) !== '~' || !this.map.fishing) {
          await this.say("There's no water to fish in here.");
          continue;
        }
        await this.fish(id);
        return true;
      }
      if (it.kind === 'repel') {
        takeItem(id);
        game.state.repel = it.power;
        await this.say('BERYL used the REPEL. Weak wild POKéMON will stay away.');
        return true;
      }
      if (id === 'expshare') {
        const v = await numberPicker(this.ui, { min: 0, max: 100, step: 5, value: game.state.expShare, format: (n) => `HOLDER GETS ${n}%` });
        if (v !== null) {
          game.state.expShare = v;
          await this.say(v === 0 ? 'The EXP. SHARE is switched off.' : `The holder will get ${v}% of battle EXP. Give it to a POKéMON via POKéMON > ITEM.`);
        }
        continue;
      }
      if (it.kind === 'key' || it.kind === 'ball' || it.kind === 'held') {
        await this.say(it.desc);
        continue;
      }
      if (party.length === 0) {
        await this.say("You don't have any POKéMON yet.");
        continue;
      }
      const who = await partyScreen(this.ui, { prompt: `Use ${it.name} on which POKéMON?` });
      if (who < 0) continue;
      await this.useOn(id, party[who]);
    }
  }

  private async useOn(id: string, mon: Pokemon) {
    const it = ITEMS[id];
    const max = calcStats(mon).hp;
    if (it.kind === 'revive') {
      if (mon.hp > 0) return this.say("It won't have any effect.");
      takeItem(id);
      mon.hp = Math.max(1, Math.floor((max * it.power) / 100));
      return this.say(`${monName(mon)} was revived!`);
    }
    if (mon.hp <= 0) return this.say("It won't have any effect.");
    const cures = !!it.cures && !!mon.status && (it.cures === 'all' || it.cures === mon.status);
    if (it.kind === 'cure') {
      if (!cures) return this.say("It won't have any effect.");
      takeItem(id);
      delete mon.status;
      return this.say(`${monName(mon)} was cured!`);
    }
    if (mon.hp >= max && !cures) return this.say("It won't have any effect.");
    takeItem(id);
    if (cures) delete mon.status;
    const healed = healBy(mon, it.power);
    await this.say(healed ? `${monName(mon)}'s HP was restored by ${healed} points.` : `${monName(mon)} was cured!`);
  }

  // --- ScriptApi --------------------------------------------------------------------

  say(...lines: string[]) {
    return this.ui.say(...lines);
  }

  yesNo(q: string) {
    return this.ui.yesNo(q);
  }

  choose(items: string[], cancel = true) {
    return this.ui.choice(items, cancel);
  }

  pickStarter() {
    return this.ui.pickStarter();
  }

  battle(req: BattleRequest): Promise<BattleResult> {
    const enemies = req.enemies ?? (req.enemy ? [req.enemy] : []);
    for (const e of enemies) register(e.species, false);
    return new Promise((resolve) => {
      const cam = this.cameras.main;
      cam.flash(250, 255, 255, 255);
      this.time.delayedCall(280, () => {
        cam.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(260, () => {
          this.scene.sleep('ui');
          this.scene.sleep();
          this.scene.launch('battle', {
            kind: req.kind, trainerName: req.trainerName, enemies, canLose: req.canLose, smart: req.smart,
            prize: req.prize, legendary: req.legendary,
            bg: req.bg ?? this.battleBg(),
            onEnd: (result: BattleResult) => {
              this.scene.wake();
              this.scene.wake('ui');
              cam.fadeIn(300);
              resolve(result);
            },
          } satisfies BattleConfig);
        });
      });
    });
  }

  private walker(who: string): Walker | undefined {
    if (who === 'player') return this.player;
    if (who === 'follower') return this.follower ?? undefined;
    return this.npcs.get(who);
  }

  async walk(who: string, dirs: Facing[]) {
    const w = this.walker(who);
    if (!w) return;
    for (const d of dirs) await w.step(this, d);
    if (w === this.player) {
      game.state.player = { map: this.map.id, x: w.x, y: w.y, facing: w.facing };
      this.updateGrassOverlay();
    }
  }

  face(who: string, dir: Facing) {
    this.walker(who)?.face(dir);
  }

  faceBeryl(who: string) {
    const w = this.walker(who);
    if (!w) return;
    const dx = this.player.x - w.x, dy = this.player.y - w.y;
    w.face(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  }

  async emote(who: string, kind: 'heart' | 'exclaim') {
    const w = this.walker(who);
    if (!w) return;
    const icon = this.add.image(w.sprite.x, w.sprite.y - 26, kind === 'heart' ? 'fx-heart' : 'fx-exclaim')
      .setDepth(99999).setScale(0.2);
    await tweenP(this, { targets: icon, scale: 1, duration: 160, ease: 'Back.easeOut' });
    await delay(this, 700);
    icon.destroy();
  }

  async warp(map: MapId, x: number, y: number, facing: Facing, whileDark?: () => void, ms = 200) {
    await this.fadeOut(ms);
    this.buildMap(map, x, y, facing);
    whileDark?.();
    await this.fadeIn(ms);
  }

  fadeOut(ms = 300): Promise<void> {
    return new Promise((resolve) => {
      this.cameras.main.fadeOut(ms, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => resolve());
    });
  }

  fadeIn(ms = 300): Promise<void> {
    return new Promise((resolve) => {
      this.cameras.main.fadeIn(ms, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => resolve());
    });
  }

  async shake(ms = 600) {
    this.cameras.main.shake(ms, 0.006);
    await delay(this, ms);
  }

  credits(lines: string[]) {
    return this.ui.credits(lines);
  }

  playerPos() {
    return { x: this.player.x, y: this.player.y, facing: this.player.facing };
  }

  async lethysAppears(x: number, y: number, scale = 0.75) {
    const cx = x * T + T / 2, cy = y * T + T;
    const ripples = [0, 1, 2].map((i) =>
      this.add.ellipse(cx, cy - 2, 8, 3).setStrokeStyle(1, 0xd8f0ff, 0.9).setDepth(y * 10 + 2).setAlpha(0).setData('i', i));
    for (const rp of ripples) {
      this.tweens.add({
        targets: rp, scaleX: 4, scaleY: 3, alpha: { from: 0.9, to: 0 }, duration: 1200,
        delay: (rp.getData('i') as number) * 350, repeat: 2,
      });
    }
    const mon = this.add.image(cx, cy + 24, 'mon-lethys').setOrigin(0.5, 1).setScale(scale).setAlpha(0)
      .setDepth(y * 10 + 3);
    const mask = this.add.graphics().fillRect(cx - 80, cy - 160, 160, 160).setVisible(false);
    mon.setMask(mask.createGeometryMask());
    await tweenP(this, { targets: mon, y: cy, alpha: 0.95, duration: 1400, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: mon, y: cy - 3, duration: 700, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    await delay(this, 2200);
    await tweenP(this, { targets: mon, y: cy + 48, alpha: 0, duration: 1100, ease: 'Sine.easeIn' });
    mon.destroy();
    mask.destroy();
    for (const rp of ripples) rp.destroy();
  }

  wait(ms: number) {
    return delay(this, ms);
  }

  async whiteOut() {
    const s = game.state;
    for (const p of s.party) heal(p);
    const lost = Math.floor(s.money / 2);
    s.money -= lost;
    const center = s.lastCenter ? MAPS[`center_${s.lastCenter}`] : undefined;
    if (center) {
      await this.warp(center.id, 6, 4, 'up');
      await this.say(`BERYL dropped $${lost} in panic...`, 'NURSE: Your POKéMON have been healed. Please be more careful out there!');
    } else {
      await this.warp(HOME_DOOR.map, HOME_DOOR.x, HOME_DOOR.y, HOME_DOOR.facing);
      await this.say(`BERYL dropped $${lost} in panic...`, 'GRANDMA: Oh my, BERYL! You look exhausted.', 'Your POKéMON have had a good rest now. Be careful out there!');
    }
    save();
  }
}

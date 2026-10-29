import Phaser from 'phaser';
import { DIR_FRAMES, tableTexture } from '../art/procedural';
import { calcStats, createPokemon, heal, wildLevel } from '../battle/engine';
import { MAPS, isSolidTile, tileAt, type MapDef, type MapId, type NpcDef } from '../data/maps';
import { MOVES } from '../data/moves';
import { SPECIES } from '../data/species';
import { heldDirection, isHeld, justPressed } from '../input';
import { game, save, HOME_DOOR, type Facing } from '../state';
import type { ScriptApi } from '../story/api';
import { onEnterMap, onStepGrassWithoutPokemon, onTalk } from '../story/story';
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
  B: 't-grass', D: 't-path', d: 't-dock',
};

const INDOOR_TEXTURES: Record<string, string> = {
  '#': 'i-void', W: 'i-wall', w: 'i-window', s: 'i-shelf', _: 'i-floor', k: 'i-counter',
  p: 'i-plant', v: 'i-tv', B: 'i-books', o: 'i-pen', X: 'i-mat',
};

class Walker {
  sprite: Phaser.GameObjects.Sprite;
  moving = false;
  private stepParity = 0;
  private readonly isMon: boolean;

  constructor(scene: Phaser.Scene, look: string, public x: number, public y: number, public facing: Facing) {
    this.isMon = look.startsWith('mon-');
    this.sprite = this.isMon
      ? scene.add.sprite(0, 0, look).setScale(0.42).setOrigin(0.5, 0.95)
      : scene.add.sprite(0, 0, `c-${look}`, 0).setOrigin(0.5, 1);
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

export class WorldScene extends Phaser.Scene implements ScriptApi {
  private map!: MapDef;
  private player!: Walker;
  private follower: Walker | null = null;
  private npcs = new Map<string, Walker>();
  private mapObjects: Phaser.GameObjects.GameObject[] = [];
  private grassOverlay!: Phaser.GameObjects.Image;
  private animated: { img: Phaser.GameObjects.Image; base: string }[] = [];
  private evening!: Phaser.GameObjects.Rectangle;
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
    this.evening = this.add.rectangle(0, 0, 4000, 4000, 0x1c2860, 0.42).setOrigin(0).setDepth(100000);
    this.evening.setBlendMode(Phaser.BlendModes.MULTIPLY).setVisible(false);

    let frame = 0;
    this.time.addEvent({
      delay: 450, loop: true, callback: () => {
        frame ^= 1;
        for (const a of this.animated) a.img.setTexture(`${a.base}${frame}`);
      },
    });

    const p = game.state.player;
    this.buildMap(p.map, p.x, p.y, p.facing);
    this.cameras.main.fadeIn(300);
    // The UI scene finishes starting on the next frame; story scripts talk through it.
    void this.script(async () => {
      await delay(this, 50);
      await onEnterMap(this);
    });
  }

  // --- map building -----------------------------------------------------------

  private buildMap(id: MapId, x: number, y: number, facing: Facing) {
    for (const o of this.mapObjects) o.destroy();
    this.mapObjects = [];
    this.animated = [];
    for (const w of this.npcs.values()) w.destroy();
    this.npcs.clear();
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
        if (this.map.kind === 'outdoor' && c === '~') this.animated.push({ img, base: 't-water' });
        if (this.map.kind === 'outdoor' && c === 'V') this.animated.push({ img, base: 't-spill' });
      }
    }
    for (const b of this.map.buildings) {
      add(this.add.image(b.x * T, b.y * T, `b-${b.id}`).setOrigin(0).setDepth((b.y + b.h - 1) * 10 + 1));
    }

    this.player = new Walker(this, 'beryl', x, y, facing);
    this.grassOverlay = add(this.add.image(0, 0, 't-tall-top').setOrigin(0).setVisible(false));
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
      return OUTDOOR_TEXTURES[c] ?? 't-grass';
    }
    if (c === 'b') return tileAt(m, x, y - 1) === 'b' ? 'i-bedbot' : 'i-bedtop';
    if (c === 'T') {
      const t = (dx: number, dy: number) => tileAt(m, x + dx, y + dy) === 'T';
      return tableTexture(this, t(0, -1), t(1, 0), t(0, 1), t(-1, 0));
    }
    return INDOOR_TEXTURES[c] ?? 'i-floor';
  }

  /** Shows exactly the NPCs whose conditions hold now. */
  refresh() {
    const f = game.state.flags;
    const wanted = new Map<string, NpcDef>();
    for (const n of this.map.npcs) if (!n.when || n.when(f)) wanted.set(n.id, n);
    for (const [id, w] of this.npcs) {
      if (!wanted.has(id)) {
        w.destroy();
        this.npcs.delete(id);
      }
    }
    for (const [id, n] of wanted) {
      if (!this.npcs.has(id)) this.npcs.set(id, new Walker(this, n.look, n.x, n.y, n.facing));
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
    } finally {
      this.busy = false;
    }
  }

  // --- player control -----------------------------------------------------------

  update(time: number) {
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
    if (this.blocked(nx, ny)) return;
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
        await onEnterMap(this);
      });
      return;
    }
    if (this.map.encounters && tileAt(this.map, this.player.x, this.player.y) === ',' && Math.random() < ENCOUNTER_RATE) {
      await this.script(() => this.wildEncounter());
    }
  }

  private async interact(x: number, y: number) {
    const npc = this.npcAt(x, y);
    if (npc) {
      this.faceBeryl(npc);
      if (await onTalk(this, npc)) return;
      const def = this.map.npcs.find((n) => n.id === npc);
      return this.say(`${def?.name ?? '...'}: ...`);
    }
    const text = this.map.inspect[`${x},${y}`];
    if (text) return this.say(text.join('\n'));
    const c = tileAt(this.map, x, y);
    if (this.map.kind === 'outdoor' && c === '~') return this.say('The LETHYS flows past, cold and clear.');
  }

  private async wildEncounter() {
    const list = this.map.encounters!;
    const total = list.reduce((a, [, w]) => a + w, 0);
    let roll = Math.random() * total;
    const species = list.find(([, w]) => (roll -= w) < 0)?.[0] ?? list[0][0];
    const enemy = createPokemon(species, wildLevel(game.state.badges, Math.random));
    const result = await this.battle({ kind: 'wild', enemy });
    if (result === 'lose') await this.whiteOut();
    save();
  }

  private async startMenu() {
    const choice = await this.ui.menu(['POKéMON', 'SAVE', 'EXIT']);
    if (choice === 0) {
      if (game.state.party.length === 0) return this.say("You don't have any POKéMON yet.");
      for (const p of game.state.party) {
        const st = calcStats(p);
        const sp = SPECIES[p.species];
        await this.say(
          `${sp.name.toUpperCase()}  Lv${p.level}  ${sp.types.join('/').toUpperCase()}\nHP ${p.hp}/${st.hp}`,
          `Moves: ${p.moves.map((m) => MOVES[m.id].name.toUpperCase()).join(', ')}`,
        );
      }
    } else if (choice === 1) {
      save();
      await this.say('BERYL saved the game.');
    }
  }

  // --- ScriptApi --------------------------------------------------------------------

  say(...lines: string[]) {
    return this.ui.say(...lines);
  }

  yesNo(q: string) {
    return this.ui.yesNo(q);
  }

  pickStarter() {
    return this.ui.pickStarter();
  }

  battle(cfg: Omit<BattleConfig, 'onEnd'>): Promise<BattleResult> {
    return new Promise((resolve) => {
      const cam = this.cameras.main;
      cam.flash(250, 255, 255, 255);
      this.time.delayedCall(280, () => {
        cam.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(260, () => {
          this.scene.sleep('ui');
          this.scene.sleep();
          this.scene.launch('battle', {
            bg: this.map.kind === 'indoor' ? 'indoor' : 'plain',
            ...cfg,
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

  async warp(map: MapId, x: number, y: number, facing: Facing, whileDark?: () => void) {
    await this.fadeOut(200);
    this.buildMap(map, x, y, facing);
    whileDark?.();
    await this.fadeIn(200);
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

  setEvening(on: boolean) {
    this.evening.setVisible(on);
  }

  async lethysAppears(x: number, y: number) {
    const cx = x * T + T / 2, cy = y * T + T;
    const ripples = [0, 1, 2].map((i) =>
      this.add.ellipse(cx, cy - 2, 8, 3).setStrokeStyle(1, 0xd8f0ff, 0.9).setDepth(y * 10 + 2).setAlpha(0).setData('i', i));
    for (const rp of ripples) {
      this.tweens.add({
        targets: rp, scaleX: 4, scaleY: 3, alpha: { from: 0.9, to: 0 }, duration: 1200,
        delay: (rp.getData('i') as number) * 350, repeat: 2,
      });
    }
    const mon = this.add.image(cx, cy + 24, 'mon-lethys').setOrigin(0.5, 1).setScale(0.75).setAlpha(0)
      .setDepth(y * 10 + 3);
    const mask = this.add.graphics().fillRect(cx - 40, cy - 80, 80, 80).setVisible(false);
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
    for (const p of game.state.party) heal(p);
    await this.warp(HOME_DOOR.map, HOME_DOOR.x, HOME_DOOR.y, HOME_DOOR.facing);
    await this.say('GRANDMA: Oh my, BERYL! You look exhausted.', 'Your POKéMON have had a good rest now. Be careful out there!');
  }
}

import Phaser from 'phaser';
import {
  addBond, applyStage, beforeMove, calcDamage, calcStats, canEscape, catchShakes, evolutionFor, evolve, expForLevel,
  expYield, gainExp, goesFirst, heal, healBy, inflict, newBattler, pickEnemyMove, splitExp, statusDamage, STATUS_NAMES,
  type Battler, type MoveSlot, type Pokemon,
} from '../battle/engine';
import { ITEMS } from '../data/items';
import type { BattleBg } from '../data/mapkit';
import { MOVES, type MoveData, type StatKey, type Status } from '../data/moves';
import { SPECIES } from '../data/species';
import { justPressed } from '../input';
import { game, receive, register, takeItem } from '../state';
import { bagScreen, partyAction, partyScreen, summaryScreen } from '../ui/screens';
import { DialogBox, choose, delay, label, tweenP, until, SCREEN_H, SCREEN_W } from '../ui/widgets';

export type BattleResult = 'win' | 'lose' | 'run' | 'caught';

export interface BattleConfig {
  kind: 'wild' | 'trainer';
  trainerName?: string;
  /** The opposing team, in order. A wild battle has one. */
  enemies: Pokemon[];
  /** Losing doesn't white out (rival battles); the party is healed afterwards. */
  canLose?: boolean;
  bg?: BattleBg;
  /** The trainer picks its best moves. */
  smart?: boolean;
  /** Prize money per level of the trainer's last Pokémon. */
  prize?: number;
  /** A legendary encounter: dramatic intro, no running. */
  legendary?: boolean;
  onEnd: (result: BattleResult) => void;
}

const STAT_NAMES: Record<StatKey, string> = {
  atk: 'ATTACK', def: 'DEFENSE', spa: 'SP. ATK', spd: 'SP. DEF', spe: 'SPEED',
};

const INFLICT_MSG: Record<Status, string> = {
  psn: 'was poisoned!', brn: 'was burned!', par: 'is paralyzed! It may be unable to move!',
  slp: 'fell asleep!', frz: 'was frozen solid!',
};

const STATUS_COLOR: Record<Status, number> = { psn: 0xa040a0, brn: 0xf08030, par: 0xd8b020, slp: 0x8890a0, frz: 0x60b8e0 };

/** Used when every move is out of PP. */
const STRUGGLE: MoveData = { id: 'struggle', name: 'Struggle', type: 'Normal', category: 'physical', power: 50, accuracy: 0, pp: 1, recoil: 0.25 };

const rng = Math.random;
const upper = (s: string) => s.toUpperCase();
const monName = (p: Pokemon) => upper(SPECIES[p.species].name);
const moveOf = (slot: MoveSlot) => (slot.id === 'struggle' ? STRUGGLE : MOVES[slot.id]);

/** The Gen III style status box with name, level, status, HP bar and (for the player) EXP bar. */
class StatusBox {
  private g: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;
  private level: Phaser.GameObjects.Text;
  private hpText?: Phaser.GameObjects.Text;
  private hpLabel: Phaser.GameObjects.Text;
  private status: Phaser.GameObjects.Text;
  private caught?: Phaser.GameObjects.Text;
  shownHp = 0;
  shownExp = 0;

  constructor(private scene: Phaser.Scene, private x: number, private y: number, public mon: Pokemon, private isPlayer: boolean) {
    this.g = scene.add.graphics();
    const style = { color: '#404040', shadow: '#d8d0b0', size: 16 };
    this.name = label(scene, x + 24, y + 20, monName(mon), style);
    this.level = label(scene, x + 276, y + 20, '', style).setOrigin(1, 0);
    this.hpLabel = label(scene, x + 54, y + 50, 'HP', { size: 12, color: '#f8b030', shadow: '' });
    this.status = label(scene, x + 18, y + 50, '', { size: 10, color: '#ffffff', shadow: '' });
    if (isPlayer) this.hpText = label(scene, x + 276, y + 74, '', style).setOrigin(1, 0);
    else if (game.state.caught[mon.species]) this.caught = label(scene, x + 10, y + 22, '●', { size: 10, color: '#e83838', shadow: '' });
    this.shownHp = mon.hp;
    this.shownExp = mon.exp;
    this.draw();
  }

  get objects(): Phaser.GameObjects.GameObject[] {
    return [this.g, this.name, this.level, this.hpLabel, this.status, ...(this.hpText ? [this.hpText] : []), ...(this.caught ? [this.caught] : [])];
  }

  setVisible(v: boolean) {
    for (const o of this.objects) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(v);
  }

  destroy() {
    for (const o of this.objects) o.destroy();
  }

  draw() {
    const { g, x, y, mon } = this;
    const w = 300, h = this.isPlayer ? 118 : 84;
    const max = calcStats(mon).hp;
    g.clear();
    g.fillStyle(0x404040, 1).fillRoundedRect(x, y, w, h, 10);
    g.fillStyle(0xf8f8d8, 1).fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 8);
    const bx = x + 90, by = y + 52, bw = 186;
    g.fillStyle(0x404040, 1).fillRoundedRect(bx - 44, by - 4, bw + 48, 16, 4);
    g.fillStyle(0x505050, 1).fillRect(bx, by, bw, 8);
    const frac = Math.max(0, this.shownHp / max);
    const color = frac > 0.5 ? 0x58d080 : frac > 0.2 ? 0xf8c030 : 0xf05040;
    g.fillStyle(color, 1).fillRect(bx, by, Math.ceil(bw * frac), 8);
    if (mon.status) {
      g.fillStyle(STATUS_COLOR[mon.status], 1).fillRoundedRect(x + 12, y + 46, 34, 20, 4);
      this.status.setText(STATUS_NAMES[mon.status]).setPosition(x + 15, y + 51);
    } else {
      this.status.setText('');
    }
    this.name.setText(monName(mon));
    this.level.setText(`Lv${mon.level}`);
    if (this.isPlayer) {
      this.hpText!.setText(`${Math.ceil(this.shownHp)}/ ${max}`);
      const lo = expForLevel(mon.level), hi = expForLevel(mon.level + 1);
      const ef = Phaser.Math.Clamp((this.shownExp - lo) / (hi - lo), 0, 1);
      g.fillStyle(0x404040, 1).fillRect(x + 40, y + 98, 238, 8);
      g.fillStyle(0x48a0f8, 1).fillRect(x + 42, y + 100, Math.floor(234 * ef), 4);
    }
  }

  async animateHp(to: number) {
    const state = { v: this.shownHp };
    await tweenP(this.scene, {
      targets: state, v: to, duration: Math.min(900, 40 * Math.abs(this.shownHp - to) + 200),
      onUpdate: () => { this.shownHp = state.v; this.draw(); },
    });
    this.shownHp = to;
    this.draw();
  }

  async animateExp(to: number) {
    const state = { v: this.shownExp };
    await tweenP(this.scene, {
      targets: state, v: to, duration: 600,
      onUpdate: () => { this.shownExp = state.v; this.draw(); },
    });
    this.shownExp = to;
    this.draw();
  }
}

const PLAYER_X = 190, PLAYER_Y = 384, ENEMY_X = 520, ENEMY_Y = 214;

export class BattleScene extends Phaser.Scene {
  private cfg!: BattleConfig;
  private dialog!: DialogBox;
  private player!: Battler;
  private enemy!: Battler;
  private enemyIndex = 0;
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private playerBox!: StatusBox;
  private enemyBox!: StatusBox;
  private runAttempts = 0;
  /** Party Pokémon that fought the current enemy (they share its EXP). */
  private fighters = new Set<Pokemon>();
  /** Party Pokémon that levelled up in this battle (they may evolve afterwards). */
  private grew = new Set<Pokemon>();

  constructor() {
    super('battle');
  }

  init(cfg: BattleConfig) {
    this.cfg = cfg;
    this.runAttempts = 0;
    this.enemyIndex = 0;
    this.fighters = new Set();
    this.grew = new Set();
  }

  create() {
    const lead = game.state.party.find((p) => p.hp > 0) ?? game.state.party[0];
    this.player = newBattler(lead);
    this.enemy = newBattler(this.cfg.enemies[0]);
    this.fighters.add(lead);
    this.drawBackground();

    this.enemySprite = this.add.image(SCREEN_W + 200, ENEMY_Y, `mon-${this.enemy.mon.species}`)
      .setOrigin(0.5, 0.9).setScale(3);
    this.playerSprite = this.add.image(-200, PLAYER_Y, `mon-${this.player.mon.species}`)
      .setOrigin(0.5, 1).setScale(3).setFlipX(true);

    this.enemyBox = new StatusBox(this, 24, 28, this.enemy.mon, false);
    this.playerBox = new StatusBox(this, 400, 226, this.player.mon, true);
    this.enemyBox.setVisible(false);
    this.playerBox.setVisible(false);

    this.dialog = new DialogBox(this, 'battle');
    this.cameras.main.fadeIn(250);
    void this.run().catch((e) => {
      console.error(e);
      void this.finish('run');
    });
  }

  // --- backdrop -------------------------------------------------------------------------------

  private drawBackground() {
    const g = this.add.graphics();
    const bg = this.cfg.bg ?? 'plain';
    const grad = (top: number, bottom: number) => g.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(0, 0, SCREEN_W, SCREEN_H);
    let rim = 0x6c9848, top = 0xa8d088;
    if (bg === 'plain' || bg === 'water') {
      g.fillStyle(bg === 'water' ? 0x1c3c78 : 0x4c8c3c, 1).fillRect(0, 0, SCREEN_W, SCREEN_H);
      if (this.textures.exists(`battle-${bg}`)) this.add.image(0, 0, `battle-${bg}`).setOrigin(0).setScale(3);
      if (bg === 'water') [rim, top] = [0x5878a8, 0x88a8d0];
    } else if (bg === 'indoor') {
      grad(0xf0e4d0, 0xd8c4a8);
      g.fillStyle(0xc8b090, 1).fillRect(0, 150, SCREEN_W, 210);
      [rim, top] = [0xa08868, 0xc0a888];
    } else if (bg === 'cave') {
      grad(0x302018, 0x584030);
      g.fillStyle(0x201410, 1);
      for (let x = 0; x < SCREEN_W; x += 60) g.fillTriangle(x, 0, x + 40, 0, x + 20, 40 + ((x * 7) % 50));
      g.fillStyle(0x684c38, 1).fillRect(0, 300, SCREEN_W, 180);
      [rim, top] = [0x5a4030, 0x7a6048];
    } else if (bg === 'snow') {
      grad(0xc8e0f0, 0xf0f8ff);
      g.fillStyle(0xe8f0f8, 1).fillTriangle(0, 200, 180, 60, 360, 200).fillTriangle(260, 200, 470, 40, 720, 200);
      g.fillStyle(0xffffff, 1).fillTriangle(140, 96, 180, 60, 220, 96).fillTriangle(420, 80, 470, 40, 520, 80);
      g.fillStyle(0xf8fcff, 1).fillRect(0, 200, SCREEN_W, 280);
      [rim, top] = [0xa8c0d8, 0xe0ecf8];
    } else if (bg === 'marsh') {
      grad(0x98b890, 0x587848);
      g.fillStyle(0x486838, 1).fillRect(0, 170, SCREEN_W, 310);
      g.fillStyle(0x386080, 0.8).fillEllipse(110, 260, 220, 40).fillEllipse(620, 420, 200, 36);
      g.fillStyle(0x6a8848, 1);
      for (let x = 10; x < SCREEN_W; x += 46) g.fillRect(x, 160 - ((x * 3) % 30), 4, 30 + ((x * 3) % 30));
      [rim, top] = [0x587038, 0x88a060];
    } else if (bg === 'night') {
      grad(0x101838, 0x283058);
      g.fillStyle(0xffffff, 0.8);
      for (let i = 0; i < 40; i++) g.fillRect((i * 97) % SCREEN_W, (i * 53) % 160, 2, 2);
      g.fillStyle(0xf0f0d0, 1).fillCircle(620, 60, 24);
      g.fillStyle(0x203048, 1).fillRect(0, 220, SCREEN_W, 260);
      [rim, top] = [0x304060, 0x485878];
    }
    if (this.cfg.legendary) g.fillStyle(0x88c8f8, 0.12).fillRect(0, 0, SCREEN_W, SCREEN_H);
    const p = this.add.graphics();
    p.fillStyle(rim, 1).fillEllipse(ENEMY_X, ENEMY_Y, 290, 56);
    p.fillStyle(top, 1).fillEllipse(ENEMY_X, ENEMY_Y - 4, 270, 44);
    p.fillStyle(rim, 1).fillEllipse(PLAYER_X, 362, 330, 70);
    p.fillStyle(top, 1).fillEllipse(PLAYER_X, 356, 310, 56);
  }

  // --- helpers ---------------------------------------------------------------------------------

  private say(s: string, wait = true) {
    return this.dialog.say(s, wait);
  }

  private enemyLabel() {
    return `${this.cfg.kind === 'wild' ? 'Wild' : 'Foe'} ${monName(this.enemy.mon)}`;
  }

  private nameOf(b: Battler) {
    return b === this.player ? monName(b.mon) : this.enemyLabel();
  }

  private spriteOf(b: Battler) {
    return b === this.player ? this.playerSprite : this.enemySprite;
  }

  private boxOf(b: Battler) {
    return b === this.player ? this.playerBox : this.enemyBox;
  }

  private async yesNo(q: string): Promise<boolean> {
    await this.dialog.say(q, false);
    const i = await choose(this, ['YES', 'NO'], { x: 540, y: SCREEN_H - 128 - 124, w: 176, cancel: 1, size: 16, rowHeight: 42 });
    return i === 0;
  }

  // --- main loop -----------------------------------------------------------------------------

  private async run() {
    const c = this.cfg;
    if (c.legendary) {
      this.cameras.main.shake(700, 0.01);
      await delay(this, 400);
    }
    await Promise.all([
      tweenP(this, { targets: this.enemySprite, x: ENEMY_X, duration: c.legendary ? 1400 : 700, ease: 'Quad.easeOut' }),
      tweenP(this, { targets: this.playerSprite, x: PLAYER_X, duration: 700, ease: 'Quad.easeOut' }),
    ]);
    this.enemyBox.setVisible(true);
    if (c.kind === 'wild') {
      await this.say(c.legendary ? `The river answered! ${monName(this.enemy.mon)} appeared!` : `A wild ${monName(this.enemy.mon)} appeared!`);
    } else {
      await this.say(`${c.trainerName} would like to battle!`);
      await this.say(`${c.trainerName} sent out ${monName(this.enemy.mon)}!`, false);
    }
    await this.say(`Go! ${monName(this.player.mon)}!`, false);
    this.playerBox.setVisible(true);

    for (;;) {
      const action = await this.chooseAction();
      let playerMove: MoveSlot | null = null;
      if (action === 0) {
        playerMove = await this.chooseMove();
        if (!playerMove) continue;
      } else if (action === 1) {
        const used = await this.openBag();
        if (used === 'cancel') continue;
        if (used === 'caught') return this.finish('caught');
      } else if (action === 2) {
        if (!(await this.switchMenu(false))) continue;
      } else if (action === 3) {
        if (c.kind === 'trainer') {
          await this.say("No! There's no running from a TRAINER battle!");
          continue;
        }
        if (c.legendary) {
          await this.say("The current is too strong! Can't escape!");
          continue;
        }
        this.runAttempts += 1;
        if (canEscape(this.player, this.enemy, this.runAttempts, rng)) {
          await this.say('Got away safely!');
          return this.finish('run');
        }
        await this.say("Can't escape!");
      }

      const enemyMove = pickEnemyMove(this.enemy, rng, this.player, c.smart);
      const order: [Battler, MoveSlot, Battler][] = [];
      if (playerMove && goesFirst(this.player, moveOf(playerMove), this.enemy, MOVES[enemyMove.id], rng)) {
        order.push([this.player, playerMove, this.enemy], [this.enemy, enemyMove, this.player]);
      } else {
        order.push([this.enemy, enemyMove, this.player]);
        if (playerMove) order.push([this.player, playerMove, this.enemy]);
      }

      for (const [user, slot, target] of order) {
        if (user.mon.hp <= 0 || target.mon.hp <= 0) continue;
        await this.useMove(user, slot, target);
        if (this.player.mon.hp <= 0 || this.enemy.mon.hp <= 0) break;
      }

      // Poison and burn at the end of the turn.
      for (const b of [this.player, this.enemy]) {
        if (b.mon.hp <= 0) continue;
        const d = statusDamage(b.mon);
        if (!d) continue;
        await this.say(`${this.nameOf(b)} is hurt by ${b.mon.status === 'psn' ? 'poison' : 'its burn'}!`, false);
        await this.boxOf(b).animateHp(b.mon.hp);
      }

      if (this.enemy.mon.hp <= 0) {
        const more = await this.enemyFainted();
        if (!more) return;
      }
      if (this.player.mon.hp <= 0 && !(await this.playerFainted())) return;
    }
  }

  private async chooseAction(): Promise<number> {
    this.dialog.set(`What will\n${monName(this.player.mon)} do?`);
    return choose(this, ['FIGHT', 'BAG', 'POKéMON', 'RUN'], {
      x: 364, y: SCREEN_H - 124, w: 352, cols: 2, colWidth: 150, rowHeight: 42, size: 16,
    });
  }

  private async chooseMove(): Promise<MoveSlot | null> {
    const moves = this.player.mon.moves;
    if (moves.every((m) => m.pp <= 0)) {
      await this.say(`${monName(this.player.mon)} has no moves left!`, false);
      return { id: 'struggle', pp: 1 };
    }
    const info = this.add.graphics().setDepth(1050);
    const pp = label(this, 504, SCREEN_H - 96, '', { size: 16 }).setDepth(1060);
    const type = label(this, 504, SCREEN_H - 56, '', { size: 16 }).setDepth(1060);
    info.fillStyle(0x4868a8, 1).fillRoundedRect(476, SCREEN_H - 124, 240, 120, 12);
    info.fillStyle(0xf8f8f8, 1).fillRoundedRect(485, SCREEN_H - 115, 222, 102, 6);
    const idx = await choose(this, moves.map((m) => upper(MOVES[m.id].name)), {
      x: 4, y: SCREEN_H - 124, w: 472, cols: 2, colWidth: 220, rowHeight: 42, size: 16, cancel: -1,
      start: Math.min(this.player.mon.lastMove ?? 0, moves.length - 1),
      onMove: (i) => {
        const m = MOVES[moves[i].id];
        pp.setText(`PP ${moves[i].pp}/${m.pp}`);
        type.setText(`TYPE/${upper(m.type)}`);
      },
    });
    info.destroy();
    pp.destroy();
    type.destroy();
    if (idx < 0) return null;
    if (moves[idx].pp <= 0) {
      await this.say("There's no PP left for this move!");
      return null;
    }
    this.player.mon.lastMove = idx;
    return moves[idx];
  }

  // --- moves ---------------------------------------------------------------------------------

  private async statChange(b: Battler, stat: StatKey, stages: number) {
    const changed = applyStage(b, stat, stages);
    const name = `${this.nameOf(b)}'s ${STAT_NAMES[stat]}`;
    if (changed === 0) return this.say(`${name} won't go any ${stages > 0 ? 'higher' : 'lower'}!`);
    if (stages < 0) await this.shake(this.spriteOf(b));
    const big = Math.abs(changed) >= 2;
    await this.say(stages > 0 ? `${name} ${big ? 'sharply ' : ''}rose!` : `${name} ${big ? 'harshly ' : ''}fell!`);
  }

  private async tryInflict(target: Battler, status: Status, announceFail: boolean) {
    if (inflict(target.mon, status, rng)) {
      this.boxOf(target).draw();
      await this.say(`${this.nameOf(target)} ${INFLICT_MSG[status]}`);
    } else if (announceFail) {
      await this.say(target.mon.status === status ? `${this.nameOf(target)} is already ${STATUS_NAMES[status]}!` : 'But it failed!');
    }
  }

  private async useMove(user: Battler, slot: MoveSlot, target: Battler) {
    const check = beforeMove(user.mon, rng);
    if (check.msg) {
      this.boxOf(user).draw();
      await this.say(`${this.nameOf(user)} ${check.msg}`);
    }
    if (!check.act) return;

    const move = moveOf(slot);
    if (slot.id !== 'struggle') slot.pp = Math.max(0, slot.pp - 1);
    await this.say(`${this.nameOf(user)} used ${upper(move.name)}!`, false);

    const res = calcDamage(user, target, move, rng);
    if (res.missed) {
      await this.say(`${this.nameOf(user)}'s attack missed!`);
      return;
    }

    if (move.category === 'status') {
      let did = false;
      if (move.heal) {
        did = true;
        const max = calcStats(user.mon).hp;
        if (user.mon.hp >= max) await this.say(`${this.nameOf(user)}'s HP is full!`);
        else {
          healBy(user.mon, Math.floor(max * move.heal));
          await this.boxOf(user).animateHp(user.mon.hp);
          await this.say(`${this.nameOf(user)} regained health!`);
        }
      }
      for (const s of move.selfStat ?? []) { did = true; await this.statChange(user, s.stat, s.stages); }
      if (move.targetStat) { did = true; await this.statChange(target, move.targetStat.stat, move.targetStat.stages); }
      if (move.status) { did = true; await this.tryInflict(target, move.status, true); }
      if (!did) await this.say('But nothing happened!');
      return;
    }

    if (res.effectiveness === 0) {
      await this.say(`It doesn't affect ${this.nameOf(target)}...`);
      return;
    }

    await this.lunge(user);
    await this.blink(this.spriteOf(target));
    const dealt = Math.min(target.mon.hp, res.damage);
    target.mon.hp -= dealt;
    await this.boxOf(target).animateHp(target.mon.hp);
    if (res.crit) await this.say('A critical hit!');
    if (res.effectiveness > 1) await this.say("It's super effective!");
    else if (res.effectiveness < 1) await this.say("It's not very effective...");

    if (move.type === 'Fire' && target.mon.status === 'frz' && target.mon.hp > 0) {
      delete target.mon.status;
      this.boxOf(target).draw();
      await this.say(`${this.nameOf(target)} thawed out!`);
    }
    if (move.drain && user.mon.hp > 0) {
      const h = healBy(user.mon, Math.max(1, Math.floor(dealt * move.drain)));
      if (h) {
        await this.boxOf(user).animateHp(user.mon.hp);
        await this.say(`${this.nameOf(target)} had its energy drained!`);
      }
    }
    if (move.recoil && user.mon.hp > 0) {
      user.mon.hp = Math.max(0, user.mon.hp - Math.max(1, Math.floor(dealt * move.recoil)));
      await this.boxOf(user).animateHp(user.mon.hp);
      await this.say(`${this.nameOf(user)} is hit with recoil!`);
    }
    const lucky = () => rng() * 100 < (move.chance ?? 100);
    if (target.mon.hp > 0) {
      if (move.status && lucky()) await this.tryInflict(target, move.status, false);
      if (move.targetStat && lucky()) await this.statChange(target, move.targetStat.stat, move.targetStat.stages);
    }
    if (user.mon.hp > 0 && move.selfStat && lucky()) {
      for (const s of move.selfStat) await this.statChange(user, s.stat, s.stages);
    }
  }

  private async lunge(user: Battler) {
    const s = this.spriteOf(user);
    const dx = user === this.player ? 24 : -24;
    await tweenP(this, { targets: s, x: s.x + dx, duration: 90, yoyo: true });
  }

  private async blink(s: Phaser.GameObjects.Image) {
    await tweenP(this, { targets: s, alpha: 0, duration: 70, yoyo: true, repeat: 2 });
    s.setAlpha(1);
  }

  private async shake(s: Phaser.GameObjects.Image) {
    await tweenP(this, { targets: s, x: s.x + 8, duration: 50, yoyo: true, repeat: 2 });
  }

  private async faint(s: Phaser.GameObjects.Image) {
    await tweenP(this, { targets: s, y: s.y + 120, alpha: 0, duration: 400, ease: 'Quad.easeIn' });
  }

  // --- fainting, EXP, switching ----------------------------------------------------------------

  /** Returns true when the trainer has another Pokémon and the battle goes on. */
  private async enemyFainted(): Promise<boolean> {
    await this.faint(this.enemySprite);
    await this.say(`${this.enemyLabel()} fainted!`);
    await this.giveExp(this.enemy.mon);

    const c = this.cfg;
    const next = c.enemies[this.enemyIndex + 1];
    if (c.kind === 'trainer' && next) {
      this.enemyIndex += 1;
      this.enemy = newBattler(next);
      register(next.species, false);
      this.enemyBox.destroy();
      this.enemyBox = new StatusBox(this, 24, 28, next, false);
      this.enemySprite.setTexture(`mon-${next.species}`).setAlpha(1).setPosition(SCREEN_W + 200, ENEMY_Y);
      await this.say(`${c.trainerName} sent out ${monName(next)}!`, false);
      await tweenP(this, { targets: this.enemySprite, x: ENEMY_X, duration: 450, ease: 'Quad.easeOut' });
      this.fighters = new Set(this.player.mon.hp > 0 ? [this.player.mon] : []);
      return true;
    }

    for (const p of game.state.party) if (p.hp > 0) addBond(p, 1);
    for (const p of this.fighters) addBond(p, 2);
    if (c.kind === 'trainer') {
      await this.say(`BERYL defeated ${c.trainerName}!`);
      const prize = (c.prize ?? 0) * this.enemy.mon.level;
      if (prize > 0) {
        game.state.money += prize;
        await this.say(`BERYL got $${prize} for winning!`);
      }
    }
    await this.evolutions();
    await this.finish('win');
    return false;
  }

  private async giveExp(defeated: Pokemon) {
    const party = game.state.party;
    const total = expYield(defeated, this.cfg.kind === 'trainer');
    const holder = party.find((p) => p.held === 'expshare' && p.hp > 0) ?? null;
    const fighters = [...this.fighters].filter((p) => party.includes(p));
    const split = splitExp(total, fighters, holder, game.state.expShare);
    for (const p of party) {
      const gained = split.get(p);
      if (!gained) continue;
      await this.say(`${monName(p)} gained ${gained} EXP. Points!`, false);
      const active = p === this.player.mon;
      const startLevel = p.level;
      const ups = gainExp(p, gained);
      if (ups.length) this.grew.add(p);
      if (!active) {
        for (const up of ups) {
          await this.say(`${monName(p)} grew to Lv. ${up.level}!`);
          for (const id of up.learned) await this.say(`${monName(p)} learned ${upper(MOVES[id].name)}!`);
          for (const id of up.pending) await this.learnMove(p, id);
        }
        continue;
      }
      if (ups.length === 0) {
        await this.playerBox.animateExp(p.exp);
        continue;
      }
      let lv = startLevel;
      for (const up of ups) {
        const savedLevel = p.level;
        p.level = lv;
        await this.playerBox.animateExp(expForLevel(lv + 1));
        p.level = savedLevel;
        lv = up.level;
        this.playerBox.shownExp = expForLevel(lv);
        this.playerBox.shownHp = p.hp;
        this.playerBox.draw();
        await this.say(`${monName(p)} grew to Lv. ${up.level}!`);
        for (const id of up.learned) await this.say(`${monName(p)} learned ${upper(MOVES[id].name)}!`);
        for (const id of up.pending) await this.learnMove(p, id);
      }
      await this.playerBox.animateExp(p.exp);
    }
  }

  /** Asks which move to forget so a new one fits. */
  private async learnMove(p: Pokemon, id: string) {
    const name = monName(p), move = upper(MOVES[id].name);
    for (;;) {
      await this.say(`${name} wants to learn the move ${move}.`);
      await this.say(`But ${name} can't learn more than four moves.`);
      if (await this.yesNo(`Delete a move to make room for ${move}?`)) {
        await this.say('Which move should be forgotten?', false);
        const items = [...p.moves.map((m) => upper(MOVES[m.id].name)), `(${move})`];
        const i = await choose(this, items, { x: 364, y: SCREEN_H - 128 - (items.length * 42 + 36), w: 352, rowHeight: 42, size: 16, cancel: items.length - 1 });
        if (i >= 0 && i < p.moves.length) {
          const old = upper(MOVES[p.moves[i].id].name);
          p.moves[i] = { id, pp: MOVES[id].pp };
          if (p.lastMove === i) p.lastMove = 0;
          await this.say('1, 2, and... ... Poof!');
          await this.say(`${name} forgot ${old}. And... ${name} learned ${move}!`);
          return;
        }
      }
      if (await this.yesNo(`Stop learning ${move}?`)) {
        await this.say(`${name} did not learn ${move}.`);
        return;
      }
    }
  }

  /** Evolution scenes for Pokémon that grew in this battle. B cancels. */
  private async evolutions() {
    for (const p of game.state.party) {
      if (!this.grew.has(p) || p.hp <= 0) continue;
      const into = evolutionFor(p);
      if (!into) continue;
      const from = monName(p);
      this.dialog.hide();
      const bg = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, 0x101820, 1).setOrigin(0).setDepth(1200);
      const img = this.add.image(SCREEN_W / 2, 220, `mon-${p.species}`).setScale(3).setDepth(1201);
      this.dialog.show();
      await this.say(`What? ${from} is evolving!`, false);
      let cancelled = false;
      for (let k = 0; k < 12 && !cancelled; k++) {
        img.setTexture(`mon-${k % 2 ? into : p.species}`).setTintFill(0xffffff);
        let t = 0;
        const ms = Math.max(90, 380 - k * 26);
        await until(this, () => {
          if (justPressed('b')) cancelled = true;
          t += this.game.loop.delta;
          return cancelled || t >= ms;
        });
      }
      img.clearTint();
      if (cancelled) {
        img.setTexture(`mon-${p.species}`);
        await this.say(`Huh? ${from} stopped evolving!`);
      } else {
        const flash = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, 0xffffff, 1).setOrigin(0).setDepth(1202);
        img.setTexture(`mon-${into}`);
        const learned = evolve(p, into);
        register(into, true);
        await tweenP(this, { targets: flash, alpha: 0, duration: 600 });
        flash.destroy();
        await this.say(`Congratulations! Your ${from} evolved into ${monName(p)}!`);
        for (const id of learned) {
          if (p.moves.length < 4) {
            p.moves.push({ id, pp: MOVES[id].pp });
            await this.say(`${monName(p)} learned ${upper(MOVES[id].name)}!`);
          } else {
            await this.learnMove(p, id);
          }
        }
      }
      bg.destroy();
      img.destroy();
    }
  }

  /** Returns true when another Pokémon was sent out and the battle goes on. */
  private async playerFainted(): Promise<boolean> {
    await this.faint(this.playerSprite);
    await this.say(`${monName(this.player.mon)} fainted!`);
    this.fighters.delete(this.player.mon);
    if (game.state.party.some((p) => p.hp > 0)) {
      await this.switchMenu(true);
      return true;
    }
    const c = this.cfg;
    if (c.kind === 'trainer' && c.canLose) {
      await this.say(`BERYL lost to ${c.trainerName}...`);
      for (const p of game.state.party) heal(p);
    } else {
      await this.say('BERYL is out of usable POKéMON!');
      await this.say('BERYL whited out!');
    }
    await this.finish('lose');
    return false;
  }

  private async sendOut(mon: Pokemon) {
    this.player = newBattler(mon);
    this.fighters.add(mon);
    this.playerBox.destroy();
    this.playerBox = new StatusBox(this, 400, 226, mon, true);
    this.playerSprite.setTexture(`mon-${mon.species}`).setAlpha(1).setPosition(-200, PLAYER_Y);
    await tweenP(this, { targets: this.playerSprite, x: PLAYER_X, duration: 400, ease: 'Quad.easeOut' });
    await this.say(`Go! ${monName(mon)}!`, false);
  }

  /** The party screen in battle. `forced` after a faint: no cancelling. Returns true if a switch happened. */
  private async switchMenu(forced: boolean): Promise<boolean> {
    const party = game.state.party;
    let start = Math.max(0, party.indexOf(this.player.mon));
    for (;;) {
      const r = await partyAction(this, () => ['SHIFT', 'SUMMARY'], {
        active: party.indexOf(this.player.mon), start,
        prompt: forced ? 'Bring out which POKéMON?' : 'Choose a POKéMON.',
      });
      if (!r) {
        if (forced) continue;
        return false;
      }
      start = r.index;
      const mon = party[r.index];
      if (r.action === 'SUMMARY') {
        await summaryScreen(this, party, r.index);
        continue;
      }
      if (mon === this.player.mon && this.player.mon.hp > 0) {
        await this.say(`${monName(mon)} is already in battle!`);
        continue;
      }
      if (mon.hp <= 0) {
        await this.say(`${monName(mon)} has no energy left to battle!`);
        continue;
      }
      if (!forced) {
        await this.say(`${monName(this.player.mon)}, come back!`, false);
        await tweenP(this, { targets: this.playerSprite, x: -200, duration: 300, ease: 'Quad.easeIn' });
      }
      await this.sendOut(mon);
      return true;
    }
  }

  // --- bag -----------------------------------------------------------------------------------

  private async openBag(): Promise<'cancel' | 'used' | 'caught'> {
    for (;;) {
      const id = await bagScreen(this, { prompt: 'Close the BAG.' });
      if (!id) return 'cancel';
      const item = ITEMS[id];
      if (item.kind === 'ball') return this.throwItem(id);
      if (item.kind === 'heal' || item.kind === 'cure' || item.kind === 'revive') {
        const r = await this.useMedicine(id);
        if (r === 'used') return r;
        continue;
      }
      await this.say("BERYL can't use that here!");
    }
  }

  private async useMedicine(id: string): Promise<'cancel' | 'used'> {
    const it = ITEMS[id];
    const party = game.state.party;
    const who = await partyScreen(this, { prompt: `Use ${it.name} on which POKéMON?`, active: party.indexOf(this.player.mon) });
    if (who < 0) return 'cancel';
    const mon = party[who];
    const max = calcStats(mon).hp;
    const isActive = mon === this.player.mon;
    const noEffect = async () => { await this.say("It won't have any effect."); return 'cancel' as const; };
    if (it.kind === 'revive') {
      if (mon.hp > 0) return noEffect();
      takeItem(id);
      mon.hp = Math.max(1, Math.floor((max * it.power) / 100));
      await this.say(`${monName(mon)} was revived!`);
      return 'used';
    }
    if (mon.hp <= 0) return noEffect();
    const cures = !!it.cures && !!mon.status && (it.cures === 'all' || it.cures === mon.status);
    if (it.kind === 'cure' && !cures) return noEffect();
    if (it.kind === 'heal' && mon.hp >= max && !cures) return noEffect();
    takeItem(id);
    await this.say(`BERYL used ${it.name}!`, false);
    if (cures) {
      delete mon.status;
      delete mon.sleepTurns;
    }
    const healed = it.kind === 'heal' ? healBy(mon, it.power) : 0;
    if (isActive) {
      this.playerBox.draw();
      if (healed) await this.playerBox.animateHp(mon.hp);
    }
    await this.say(healed ? `${monName(mon)}'s HP was restored by ${healed} points.` : `${monName(mon)} was cured!`);
    return 'used';
  }

  private async throwItem(id: string): Promise<'cancel' | 'used' | 'caught'> {
    const item = ITEMS[id];
    if (this.cfg.kind === 'trainer') {
      await this.say("The TRAINER blocked the BALL! Don't be a thief!");
      return 'cancel';
    }
    takeItem(item.id);
    await this.say(`BERYL used ${item.name}!`, false);
    const shakes = catchShakes(this.enemy.mon, item.power, rng);
    if (await this.throwBall(Math.min(shakes, 3), shakes === 4)) {
      const caught = this.enemy.mon;
      await this.say(`Gotcha! ${monName(caught)} was caught!`);
      const fresh = !game.state.caught[caught.species];
      delete caught.lastMove;
      caught.bond = 70;
      const where = receive(caught);
      if (fresh) await this.say(`${monName(caught)}'s data was added to the POKéDEX.`);
      if (where === 'box') await this.say(`${monName(caught)} was sent to the PC BOX.`);
      await this.giveExp(caught);
      await this.evolutions();
      return 'caught';
    }
    await this.say([
      'Oh no! It broke free!',
      'Aww! It appeared to be caught!',
      'Argh! So close!',
      'Shoot! It was so close, too!',
    ][Math.min(shakes, 3)]);
    return 'used';
  }

  /** Throws a ball at the wild Pokémon. Resolves true if it stays shut. */
  private async throwBall(shakes: number, caught: boolean): Promise<boolean> {
    const ball = this.add.container(150, 330).setDepth(900);
    const g = this.add.graphics();
    g.fillStyle(0x303030, 1).fillCircle(0, 0, 14);
    g.fillStyle(0xf8f8f8, 1).fillCircle(0, 0, 12);
    g.fillStyle(0xe83838, 1).slice(0, 0, 12, Math.PI, 2 * Math.PI, false).fillPath();
    g.fillStyle(0x303030, 1).fillRect(-12, -1, 24, 3).fillCircle(0, 0, 5);
    g.fillStyle(0xf8f8f8, 1).fillCircle(0, 0, 3);
    ball.add(g);
    const tx = ENEMY_X, ty = 130;
    const arc = { t: 0 };
    await tweenP(this, {
      targets: arc, t: 1, duration: 600,
      onUpdate: () => {
        ball.setPosition(150 + (tx - 150) * arc.t, 330 + (ty - 330) * arc.t - Math.sin(arc.t * Math.PI) * 120);
        ball.setRotation(arc.t * 12);
      },
    });
    ball.setRotation(0);
    await tweenP(this, { targets: this.enemySprite, scale: 0, alpha: 0, y: ty, duration: 300 });
    await tweenP(this, { targets: ball, y: 200, duration: 350, ease: 'Bounce.easeOut' });
    for (let i = 0; i < shakes; i++) {
      await delay(this, 350);
      await tweenP(this, { targets: ball, rotation: 0.4, duration: 120, yoyo: true });
      await tweenP(this, { targets: ball, rotation: -0.4, duration: 120, yoyo: true });
    }
    await delay(this, 400);
    if (caught) {
      ball.each((o: Phaser.GameObjects.GameObject) => (o as Phaser.GameObjects.Graphics).setAlpha(0.7));
      return true;
    }
    ball.destroy();
    this.enemySprite.setY(ENEMY_Y);
    await tweenP(this, { targets: this.enemySprite, scale: 3, alpha: 1, duration: 250 });
    return false;
  }

  private async finish(result: BattleResult) {
    // Stat stages and confusion-like effects end with the battle; sleep counters stay.
    this.cameras.main.fadeOut(300);
    await delay(this, 320);
    const { onEnd } = this.cfg;
    this.scene.stop();
    onEnd(result);
  }
}


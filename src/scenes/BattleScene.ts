import Phaser from 'phaser';
import {
  applyStage, calcDamage, calcStats, canEscape, expForLevel, expYield, gainExp, goesFirst,
  newBattler, pickEnemyMove, type Battler, type MoveSlot, type Pokemon,
} from '../battle/engine';
import { MOVES, type StatKey } from '../data/moves';
import { SPECIES } from '../data/species';
import { game } from '../state';
import { DialogBox, choose, delay, label, tweenP, SCREEN_H, SCREEN_W } from '../ui/widgets';

export type BattleResult = 'win' | 'lose' | 'run';

export interface BattleConfig {
  kind: 'wild' | 'trainer';
  trainerName?: string;
  enemy: Pokemon;
  /** Losing doesn't white out (first rival battle). */
  canLose?: boolean;
  onEnd: (result: BattleResult) => void;
}

const STAT_NAMES: Record<StatKey, string> = {
  atk: 'ATTACK', def: 'DEFENSE', spa: 'SP. ATK', spd: 'SP. DEF', spe: 'SPEED',
};

const rng = Math.random;
const upper = (s: string) => s.toUpperCase();
const monName = (p: Pokemon) => upper(SPECIES[p.species].name);

/** The Gen III style status box with name, level, HP bar and (for the player) EXP bar. */
class StatusBox {
  private g: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;
  private level: Phaser.GameObjects.Text;
  private hpText?: Phaser.GameObjects.Text;
  private hpLabel: Phaser.GameObjects.Text;
  shownHp = 0;
  shownExp = 0;

  constructor(private scene: Phaser.Scene, private x: number, private y: number, private mon: Pokemon, private isPlayer: boolean) {
    this.g = scene.add.graphics();
    const style = { color: '#404040', shadow: '#d8d0b0', size: 16 };
    this.name = label(scene, x + 24, y + 20, monName(mon), style);
    this.level = label(scene, x + 276, y + 20, '', style).setOrigin(1, 0);
    this.hpLabel = label(scene, x + 54, y + 50, 'HP', { size: 12, color: '#f8b030', shadow: '' });
    if (isPlayer) this.hpText = label(scene, x + 276, y + 74, '', style).setOrigin(1, 0);
    this.shownHp = mon.hp;
    this.shownExp = mon.exp;
    this.draw();
  }

  get objects(): Phaser.GameObjects.GameObject[] {
    return [this.g, this.name, this.level, this.hpLabel, ...(this.hpText ? [this.hpText] : [])];
  }

  draw() {
    const { g, x, y, mon } = this;
    const w = 300, h = this.isPlayer ? 118 : 84;
    const max = calcStats(mon).hp;
    g.clear();
    g.fillStyle(0x404040, 1).fillRoundedRect(x, y, w, h, 10);
    g.fillStyle(0xf8f8d8, 1).fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 8);
    // HP bar
    const bx = x + 90, by = y + 52, bw = 186;
    g.fillStyle(0x404040, 1).fillRoundedRect(bx - 44, by - 4, bw + 48, 16, 4);
    g.fillStyle(0x505050, 1).fillRect(bx, by, bw, 8);
    const frac = Math.max(0, this.shownHp / max);
    const color = frac > 0.5 ? 0x58d080 : frac > 0.2 ? 0xf8c030 : 0xf05040;
    g.fillStyle(color, 1).fillRect(bx, by, Math.ceil(bw * frac), 8);
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

export class BattleScene extends Phaser.Scene {
  private cfg!: BattleConfig;
  private dialog!: DialogBox;
  private player!: Battler;
  private enemy!: Battler;
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private playerBox!: StatusBox;
  private enemyBox!: StatusBox;
  private runAttempts = 0;

  constructor() {
    super('battle');
  }

  init(cfg: BattleConfig) {
    this.cfg = cfg;
    this.runAttempts = 0;
  }

  create() {
    const lead = game.state.party.find((p) => p.hp > 0) ?? game.state.party[0];
    this.player = newBattler(lead);
    this.enemy = newBattler(this.cfg.enemy);
    this.drawBackground();

    this.enemySprite = this.add.image(SCREEN_W + 200, 214, `mon-${this.enemy.mon.species}`)
      .setOrigin(0.5, 0.9).setScale(3);
    this.playerSprite = this.add.image(-200, 384, `mon-${this.player.mon.species}`)
      .setOrigin(0.5, 1).setScale(3).setFlipX(true);

    this.enemyBox = new StatusBox(this, 24, 28, this.enemy.mon, false);
    this.playerBox = new StatusBox(this, 400, 226, this.player.mon, true);
    for (const o of [...this.enemyBox.objects, ...this.playerBox.objects]) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);

    this.dialog = new DialogBox(this, 'battle');
    this.cameras.main.fadeIn(250);
    void this.run();
  }

  private drawBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0xf8f8e8, 0xf8f8e8, 0xd8ecc0, 0xd8ecc0, 1).fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle(0xc0e0a0, 1).fillRect(0, 150, SCREEN_W, 210);
    g.fillStyle(0x88b868, 1).fillEllipse(520, 214, 290, 56);
    g.fillStyle(0xa8d088, 1).fillEllipse(520, 210, 270, 44);
    g.fillStyle(0x88b868, 1).fillEllipse(190, 362, 330, 70);
    g.fillStyle(0xa8d088, 1).fillEllipse(190, 356, 310, 56);
  }

  private enemyLabel() {
    return `${this.cfg.kind === 'wild' ? 'Wild' : 'Foe'} ${monName(this.enemy.mon)}`;
  }

  private async run() {
    const say = (s: string, wait = true) => this.dialog.say(s, wait);
    await Promise.all([
      tweenP(this, { targets: this.enemySprite, x: 520, duration: 700, ease: 'Quad.easeOut' }),
      tweenP(this, { targets: this.playerSprite, x: 190, duration: 700, ease: 'Quad.easeOut' }),
    ]);
    this.setBoxVisible(this.enemyBox, true);
    if (this.cfg.kind === 'wild') {
      await say(`A wild ${monName(this.enemy.mon)} appeared!`);
    } else {
      await say(`${this.cfg.trainerName} would like to battle!`);
      await say(`${this.cfg.trainerName} sent out ${monName(this.enemy.mon)}!`, false);
    }
    await say(`Go! ${monName(this.player.mon)}!`, false);
    this.setBoxVisible(this.playerBox, true);

    for (;;) {
      const action = await this.chooseAction();
      let playerMove: MoveSlot | null = null;
      if (action === 0) {
        playerMove = await this.chooseMove();
        if (!playerMove) continue;
      } else if (action === 1 || action === 2) {
        await say(`${action === 1 ? 'The BAG' : 'Switching POKéMON'} isn't in this prototype yet!`);
        continue;
      } else if (action === 3) {
        if (this.cfg.kind === 'trainer') {
          await say("No! There's no running from a TRAINER battle!");
          continue;
        }
        this.runAttempts += 1;
        if (canEscape(this.player, this.enemy, this.runAttempts, rng)) {
          await say('Got away safely!');
          return this.finish('run');
        }
        await say("Can't escape!");
      }

      const enemyMove = pickEnemyMove(this.enemy, rng);
      const order: [Battler, MoveSlot, Battler][] = [];
      if (playerMove && goesFirst(this.player, MOVES[playerMove.id], this.enemy, MOVES[enemyMove.id], rng)) {
        order.push([this.player, playerMove, this.enemy], [this.enemy, enemyMove, this.player]);
      } else {
        order.push([this.enemy, enemyMove, this.player]);
        if (playerMove) order.push([this.player, playerMove, this.enemy]);
      }

      for (const [user, slot, target] of order) {
        if (user.mon.hp <= 0) continue;
        await this.useMove(user, slot, target);
        if (target.mon.hp <= 0) break;
      }

      if (this.enemy.mon.hp <= 0) return this.enemyFainted();
      if (this.player.mon.hp <= 0) return this.playerFainted();
    }
  }

  private setBoxVisible(box: StatusBox, v: boolean) {
    for (const o of box.objects) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(v);
  }

  private async chooseAction(): Promise<number> {
    this.dialog.set(`What will\n${monName(this.player.mon)} do?`);
    return choose(this, ['FIGHT', 'BAG', 'POKéMON', 'RUN'], {
      x: 364, y: SCREEN_H - 124, w: 352, cols: 2, colWidth: 150, rowHeight: 42, size: 16,
    });
  }

  private async chooseMove(): Promise<MoveSlot | null> {
    const moves = this.player.mon.moves;
    const info = this.add.graphics().setDepth(1050);
    const pp = label(this, 0, 0, '', { size: 16 }).setDepth(1060);
    const type = label(this, 0, 0, '', { size: 16 }).setDepth(1060);
    info.fillStyle(0x4868a8, 1).fillRoundedRect(476, SCREEN_H - 124, 240, 120, 12);
    info.fillStyle(0xf8f8f8, 1).fillRoundedRect(485, SCREEN_H - 115, 222, 102, 6);
    pp.setPosition(504, SCREEN_H - 96);
    type.setPosition(504, SCREEN_H - 56);
    const idx = await choose(this, moves.map((m) => upper(MOVES[m.id].name)), {
      x: 4, y: SCREEN_H - 124, w: 472, cols: 2, colWidth: 220, rowHeight: 42, size: 16, cancel: -1,
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
      await this.dialog.say("There's no PP left for this move!");
      return null;
    }
    return moves[idx];
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

  private async useMove(user: Battler, slot: MoveSlot, target: Battler) {
    const move = MOVES[slot.id];
    slot.pp = Math.max(0, slot.pp - 1);
    await this.dialog.say(`${this.nameOf(user)} used ${upper(move.name)}!`, false);

    const res = calcDamage(user, target, move, rng);
    if (res.missed) {
      await this.dialog.say(`${this.nameOf(user)}'s attack missed!`);
      return;
    }
    if (move.category === 'status') {
      if (move.targetStat) {
        const changed = applyStage(target, move.targetStat.stat, move.targetStat.stages);
        const stat = STAT_NAMES[move.targetStat.stat];
        await this.shake(this.spriteOf(target));
        await this.dialog.say(changed === 0
          ? `${this.nameOf(target)}'s ${stat} won't go any lower!`
          : `${this.nameOf(target)}'s ${stat} fell!`);
      } else {
        await this.dialog.say('But nothing happened!');
      }
      return;
    }
    if (res.effectiveness === 0) {
      await this.dialog.say(`It doesn't affect ${this.nameOf(target)}...`);
      return;
    }

    await this.lunge(user);
    await this.blink(this.spriteOf(target));
    target.mon.hp = Math.max(0, target.mon.hp - res.damage);
    await this.boxOf(target).animateHp(target.mon.hp);
    if (res.crit) await this.dialog.say('A critical hit!');
    if (res.effectiveness > 1) await this.dialog.say("It's super effective!");
    else if (res.effectiveness < 1) await this.dialog.say("It's not very effective...");
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

  private async enemyFainted() {
    await this.faint(this.enemySprite);
    await this.dialog.say(`${this.enemyLabel()} fainted!`);
    const p = this.player.mon;
    const gained = expYield(this.enemy.mon, this.cfg.kind === 'trainer');
    await this.dialog.say(`${monName(p)} gained ${gained} EXP. Points!`, false);
    const startLevel = p.level;
    const ups = gainExp(p, gained);
    if (ups.length === 0) {
      await this.playerBox.animateExp(p.exp);
    } else {
      // Fill the bar for each level, then show the leftover.
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
        await this.dialog.say(`${monName(p)} grew to Lv. ${up.level}!`);
        for (const id of up.learned) await this.dialog.say(`${monName(p)} learned ${upper(MOVES[id].name)}!`);
      }
      await this.playerBox.animateExp(p.exp);
    }
    if (this.cfg.kind === 'trainer') await this.dialog.say(`BERYL defeated ${this.cfg.trainerName}!`);
    await this.finish('win');
  }

  private async playerFainted() {
    await this.faint(this.playerSprite);
    await this.dialog.say(`${monName(this.player.mon)} fainted!`);
    if (this.cfg.kind === 'trainer' && this.cfg.canLose) {
      await this.dialog.say(`BERYL lost to ${this.cfg.trainerName}...`);
    } else {
      await this.dialog.say('BERYL is out of usable POKéMON!');
      await this.dialog.say('BERYL whited out!');
    }
    await this.finish('lose');
  }

  private async finish(result: BattleResult) {
    this.cameras.main.fadeOut(300);
    await delay(this, 320);
    const { onEnd } = this.cfg;
    this.scene.stop();
    onEnd(result);
  }
}

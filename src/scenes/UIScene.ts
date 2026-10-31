import Phaser from 'phaser';
import { isHeld, justPressed } from '../input';
import { SPECIES, STARTERS } from '../data/species';
import { DialogBox, SCREEN_H, SCREEN_W, choose, delay, drawBox, label, tweenP, until } from '../ui/widgets';

/** Unzoomed overlay above the world: dialog, menus and the starter picker. */
export class UIScene extends Phaser.Scene {
  dialog!: DialogBox;

  constructor() {
    super('ui');
  }

  create() {
    this.dialog = new DialogBox(this, 'world');
  }

  async say(...lines: string[]): Promise<void> {
    for (const l of lines) await this.dialog.say(l);
    this.dialog.hide();
  }

  /** Asks a yes/no question; the question stays visible while choosing. */
  async yesNo(question: string): Promise<boolean> {
    await this.dialog.say(question, false);
    const i = await choose(this, ['YES', 'NO'], { x: 540, y: 220, w: 176, cancel: 1 });
    this.dialog.hide();
    return i === 0;
  }

  async menu(items: string[], w = 272): Promise<number> {
    return choose(this, items, { x: SCREEN_W - 4 - w, y: 8, w, cancel: -1 });
  }

  /** A menu of story choices above the dialog box. Resolves with the index, or -1 when cancelled. */
  async choice(items: string[], cancel = true): Promise<number> {
    const w = Math.min(SCREEN_W - 8, Math.max(220, ...items.map((s) => s.length * 18 + 80)));
    const h = items.length * 44 + 36;
    return choose(this, items, {
      x: SCREEN_W - 4 - w, y: Math.max(4, SCREEN_H - 128 - h), w, rowHeight: 44, size: 18, cancel: cancel ? -1 : undefined,
    });
  }

  private bannerObj?: Phaser.GameObjects.Container;

  /** The map name sign that slides in at the top left when entering a new area. */
  async banner(name: string): Promise<void> {
    this.bannerObj?.destroy();
    const g = this.add.graphics();
    const w = Math.max(220, name.length * 20 + 60);
    g.fillStyle(0x705030, 1).fillRoundedRect(0, 0, w, 56, 8);
    g.fillStyle(0xf8e8c0, 1).fillRoundedRect(5, 5, w - 10, 46, 6);
    const t = label(this, w / 2, 16, name.toUpperCase(), { size: 18 }).setOrigin(0.5, 0);
    const c = this.add.container(8, -70, [g, t]).setDepth(900);
    this.bannerObj = c;
    await tweenP(this, { targets: c, y: 8, duration: 300, ease: 'Quad.easeOut' });
    await delay(this, 1800);
    if (!c.active) return;
    await tweenP(this, { targets: c, y: -70, duration: 300, ease: 'Quad.easeIn' });
    c.destroy();
    if (this.bannerObj === c) this.bannerObj = undefined;
  }

  /** The egg wobbles, cracks and bursts into the new Pokémon. */
  async hatch(species: string): Promise<void> {
    const bg = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, 0x182838, 1).setOrigin(0).setDepth(1500).setAlpha(0);
    await tweenP(this, { targets: bg, alpha: 1, duration: 300 });
    const egg = this.add.graphics().setDepth(1501).setPosition(SCREEN_W / 2, 200);
    egg.fillStyle(0xf8f0d8, 1).fillEllipse(0, 0, 90, 116);
    egg.fillStyle(0x88b858, 1).fillCircle(-18, -20, 10).fillCircle(20, 14, 12).fillCircle(-6, 34, 7);
    for (const amp of [0.15, 0.25, 0.35]) {
      await tweenP(this, { targets: egg, rotation: amp, duration: 110, yoyo: true, repeat: 1 });
      await tweenP(this, { targets: egg, rotation: -amp, duration: 110, yoyo: true, repeat: 1 });
      await delay(this, 350);
    }
    const flash = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, 0xffffff, 1).setOrigin(0).setDepth(1503).setAlpha(0);
    await tweenP(this, { targets: flash, alpha: 1, duration: 250 });
    egg.destroy();
    const mon = this.add.image(SCREEN_W / 2, 230, `mon-${species}`).setScale(2).setDepth(1502);
    await tweenP(this, { targets: flash, alpha: 0, duration: 500 });
    await tweenP(this, { targets: mon, y: 210, duration: 200, yoyo: true });
    await delay(this, 600);
    await tweenP(this, { targets: [bg, mon], alpha: 0, duration: 300 });
    bg.destroy(); flash.destroy(); mon.destroy();
  }

  /** Scrolls the credits over a dark screen. A or B speeds them up. */
  async credits(lines: string[]): Promise<void> {
    const bg = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, 0x081018, 1).setOrigin(0).setDepth(1500).setAlpha(0);
    await tweenP(this, { targets: bg, alpha: 1, duration: 800 });
    const texts = lines.map((s, i) => {
      const head = s.startsWith('# ');
      return label(this, SCREEN_W / 2, SCREEN_H + 20 + i * 44, head ? s.slice(2) : s, {
        size: head ? 20 : 16, color: head ? '#f8d878' : '#e8f0f8', shadow: '#000000',
      }).setOrigin(0.5, 0).setDepth(1501);
    });
    const total = SCREEN_H + 40 + lines.length * 44;
    let moved = 0;
    await until(this, () => {
      const fast = isHeld('a') || isHeld('b') ? 5 : 0;
      const dy = 0.9 + fast;
      moved += dy;
      for (const t of texts) t.y -= dy;
      return moved >= total;
    });
    texts.forEach((t) => t.destroy());
    const end = label(this, SCREEN_W / 2, SCREEN_H / 2 - 12, 'THE END', { size: 28, color: '#f8f8f8', shadow: '#000000' })
      .setOrigin(0.5, 0).setDepth(1501).setAlpha(0);
    await tweenP(this, { targets: end, alpha: 1, duration: 1200 });
    await until(this, () => justPressed('a'));
    await tweenP(this, { targets: [end, bg], alpha: 0, duration: 800 });
    end.destroy(); bg.destroy();
  }

  async pickStarter(): Promise<string> {
    const g = this.add.graphics();
    drawBox(g, 40, 24, SCREEN_W - 80, 300, 'world');
    const xs = [180, 360, 540];
    const sel = this.add.graphics();
    const sprites = STARTERS.map((id, i) => this.add.image(xs[i], 150, `mon-${id}`).setScale(2));
    const info = label(this, SCREEN_W / 2, 270, '', { size: 24 }).setOrigin(0.5, 0);
    const objects = [g, sel, ...sprites, info];
    let index = 0;
    const refresh = () => {
      sel.clear();
      sel.fillStyle(0xd8e8f8, 1).fillRoundedRect(xs[index] - 76, 70, 152, 160, 10);
      sel.lineStyle(4, 0x4868a8, 1).strokeRoundedRect(xs[index] - 76, 70, 152, 160, 10);
      sprites.forEach((s, i) => s.setAlpha(i === index ? 1 : 0.55));
      const sp = SPECIES[STARTERS[index]];
      info.setText(`${sp.name.toUpperCase()} · ${sp.types[0].toUpperCase()}`);
    };
    refresh();
    this.dialog.set('Which POKéMON will you choose?');

    for (;;) {
      await until(this, () => {
        if (justPressed('left') && index > 0) { index -= 1; refresh(); }
        if (justPressed('right') && index < STARTERS.length - 1) { index += 1; refresh(); }
        return justPressed('a');
      });
      const sp = SPECIES[STARTERS[index]];
      if (await this.yesNo(`So you want ${sp.name.toUpperCase()}, the ${sp.types[0].toUpperCase()} POKéMON?`)) break;
      this.dialog.set('Which POKéMON will you choose?');
    }
    objects.forEach((o) => o.destroy());
    return STARTERS[index];
  }
}

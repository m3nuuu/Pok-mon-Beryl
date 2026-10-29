import Phaser from 'phaser';
import { justPressed } from '../input';
import { SPECIES, STARTERS } from '../data/species';
import { DialogBox, SCREEN_W, choose, drawBox, label, until } from '../ui/widgets';

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

  async menu(items: string[]): Promise<number> {
    return choose(this, items, { x: 444, y: 8, w: 272, cancel: -1 });
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

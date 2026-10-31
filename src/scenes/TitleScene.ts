import Phaser from 'phaser';
import { justPressed } from '../input';
import { game, hasSave, load, newGame } from '../state';
import { SCREEN_H, SCREEN_W, choose, label, until } from '../ui/widgets';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0c2a3c, 0x0c2a3c, 0x2a7088, 0x2a7088, 1).fillRect(0, 0, SCREEN_W, SCREEN_H);
    // river ripples
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0x6ab8d0, 0.25).fillEllipse(SCREEN_W / 2, 330 + i * 26, 520 - i * 40, 10);
    }
    const lethys = this.add.image(SCREEN_W / 2, 250, 'mon-lethys').setScale(3).setAlpha(0.9);
    this.tweens.add({ targets: lethys, y: 240, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    label(this, SCREEN_W / 2, 36, 'POKéMON', { size: 32, color: '#f8f8f8', shadow: '#183048' }).setOrigin(0.5, 0);
    label(this, SCREEN_W / 2, 84, 'BERYL', { size: 64, color: '#7fe0c8', shadow: '#1c5a58' }).setOrigin(0.5, 0);
    label(this, SCREEN_W / 2, 160, 'Version 1.0', { size: 16, color: '#b8d8e8', shadow: '#183048' }).setOrigin(0.5, 0);
    label(this, SCREEN_W / 2, SCREEN_H - 34, 'Free fan game. Pokémon © Nintendo/Game Freak.', {
      size: 12, color: '#90b0c0', shadow: '',
    }).setOrigin(0.5, 0);
    const press = label(this, SCREEN_W / 2, SCREEN_H - 92, 'PRESS START', { size: 24, color: '#f8f8f8', shadow: '#183048' })
      .setOrigin(0.5, 0);
    this.tweens.add({ targets: press, alpha: 0, duration: 500, yoyo: true, repeat: -1, hold: 300 });

    void this.run(press);
  }

  private async run(press: Phaser.GameObjects.Text) {
    await until(this, () => justPressed('a') || justPressed('start'));
    press.destroy();
    const items = [...(hasSave() ? ['CONTINUE'] : []), 'NEW GAME', 'GRAPHICS'];
    const pick = items[await choose(this, items, { x: SCREEN_W / 2 - 150, y: SCREEN_H - 60 - items.length * 48, w: 300 })];
    if (pick === 'GRAPHICS') {
      location.hash = 'graphics';
      location.reload();
      return;
    }
    if (pick === 'NEW GAME' || !load()) game.state = newGame();
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start('world'));
  }
}

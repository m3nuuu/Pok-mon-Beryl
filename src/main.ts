import '@fontsource/press-start-2p';
import Phaser from 'phaser';
import { endFrame, initInput } from './input';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { UIScene } from './scenes/UIScene';
import { WorldScene } from './scenes/WorldScene';
import { FONT, SCREEN_H, SCREEN_W } from './ui/widgets';

async function start() {
  // Text is drawn to canvas, so the pixel font must be ready before the first frame.
  await document.fonts.load(`24px ${FONT}`).catch(() => undefined);
  initInput();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000000',
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, TitleScene, WorldScene, UIScene, BattleScene],
  });
  game.events.on(Phaser.Core.Events.POST_STEP, endFrame);
  (window as unknown as { game: Phaser.Game }).game = game;
}

void start();

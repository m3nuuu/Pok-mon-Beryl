import Phaser from 'phaser';
import { generateArt, monPlaceholders } from '../art/procedural';
import { applyCustomGraphics } from '../custom/apply';
import { SPECIES_LIST } from '../data/species';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    for (const bg of ['plain', 'water']) this.load.image(`battle-${bg}`, `battle/${bg}.png`);
    for (const s of SPECIES_LIST) if (s.sprite) this.load.image(`mon-${s.id}`, `sprites/${s.sprite}`);
  }

  async create() {
    generateArt(this);
    monPlaceholders(this, SPECIES_LIST.filter((s) => !s.sprite));
    await applyCustomGraphics(this);
    this.scene.start('title');
  }
}

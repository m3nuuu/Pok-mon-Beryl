import Phaser from 'phaser';
import { generateArt } from '../art/procedural';
import { SPECIES_LIST } from '../data/species';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    for (const bg of ['plain', 'water']) this.load.image(`battle-${bg}`, `battle/${bg}.png`);
    for (const s of SPECIES_LIST) this.load.image(`mon-${s.id}`, `sprites/${s.sprite}`);
  }

  create() {
    generateArt(this);
    this.scene.start('title');
  }
}

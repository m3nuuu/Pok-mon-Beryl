import Phaser from 'phaser';
import { generateArt, monPlaceholders } from '../art/procedural';
import { SPECIES_LIST } from '../data/species';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    for (const s of SPECIES_LIST) if (s.sprite) this.load.image(`mon-${s.id}`, `sprites/${s.sprite}`);
  }

  create() {
    generateArt(this);
    monPlaceholders(this, SPECIES_LIST.filter((s) => !s.sprite));
    this.scene.start('title');
  }
}

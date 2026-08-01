import { Scene } from 'phaser';

export class BootScene extends Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.setPath('./assets/');
  }

  create() {
    this.scene.start('MenuScene');
  }
}

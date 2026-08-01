import { Game as PhaserGame, Scale, AUTO } from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';

const config = {
  type: AUTO,
  parent: 'game-container',
  width: 640,
  height: 360,
  backgroundColor: '#0d0d1a',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene]
};

new PhaserGame(config);

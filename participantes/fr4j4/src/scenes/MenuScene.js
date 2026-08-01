import { Scene } from 'phaser';

export class MenuScene extends Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add
      .text(cx, cy - 24, 'KodingVibes GameJam', {
        fontFamily: '"Press Start 2P"',
        fontSize: '20px',
        color: '#faba72'
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 16, 'Phaser 4 listo — tu idea aquí', {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: '#9fcafd'
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 64, 'fr4j4', {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#8892a0'
      })
      .setOrigin(0.5);
  }
}

import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
  }

  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'listo', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222244',
  parent: 'game',
  scene: [MainScene],
});

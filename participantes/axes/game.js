class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    this.cameras.main.setBackgroundColor('#090b14');
    this.add.text(32, 32, 'PHASER 4 · AXES', {
      color: '#a5b4fc',
      fontFamily: 'monospace',
      fontSize: '24px',
    });
    this.add.text(32, 76, 'Base lista. Flechas o WASD para mover el cuadrado.', {
      color: '#cbd5e1',
      fontFamily: 'monospace',
      fontSize: '16px',
    });

    this.player = this.add.rectangle(480, 320, 40, 40, 0x22d3ee);
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.arrows = this.input.keyboard.createCursorKeys();
  }

  update(_, delta) {
    const speed = 0.25 * delta;
    if (this.arrows.left.isDown || this.keys.A.isDown) this.player.x -= speed;
    if (this.arrows.right.isDown || this.keys.D.isDown) this.player.x += speed;
    if (this.arrows.up.isDown || this.keys.W.isDown) this.player.y -= speed;
    if (this.arrows.down.isDown || this.keys.S.isDown) this.player.y += speed;
    this.player.x = Phaser.Math.Clamp(this.player.x, 20, this.scale.width - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, 20, this.scale.height - 20);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 640,
  backgroundColor: '#090b14',
  scene: BootScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});

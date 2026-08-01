// ============================================================
// GameJam 2026 — kodingvibes
// Participante: gabogabucho
// Phaser 4.2.1 — scaffold inicial (corte 0: se mueve)
// ============================================================

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // Input: flechas
    this.cursors = this.input.keyboard.createCursorKeys();

    // Jugador: un cubo
    this.player = this.add.rectangle(400, 300, 32, 32, 0xd8ff3e);

    // HUD
    this.add.text(16, 16, 'CORTE 0 — muévete con las flechas', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color: '#f4f1e8'
    });
  }

  update() {
    const speed = 4;

    if (this.cursors.left.isDown) this.player.x -= speed;
    if (this.cursors.right.isDown) this.player.x += speed;
    if (this.cursors.up.isDown) this.player.y -= speed;
    if (this.cursors.down.isDown) this.player.y += speed;
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#0d0d0d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene]
};

new Phaser.Game(config);

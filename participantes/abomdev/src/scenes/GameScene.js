import Phaser from 'phaser';

const WORLD_SIZE = 2000;
const PLAYER_SPEED = 220;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Fondo simple para poder ver el movimiento dentro del mundo.
    const grid = this.add.grid(
      WORLD_SIZE / 2,
      WORLD_SIZE / 2,
      WORLD_SIZE,
      WORLD_SIZE,
      64,
      64,
      0x1a1a2e,
      1,
      0x2a2a4e,
      1
    );
    grid.setDepth(-1);

    const playerGfx = this.add.graphics();
    playerGfx.fillStyle(0x66ffcc, 1);
    playerGfx.fillCircle(16, 16, 16);
    playerGfx.generateTexture('player', 32, 32);
    playerGfx.destroy();

    this.player = this.physics.add.sprite(WORLD_SIZE / 2, WORLD_SIZE / 2, 'player');
    this.player.setCollideWorldBounds(true);

    this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
  }

  update() {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    const dir = new Phaser.Math.Vector2(
      (right ? 1 : 0) - (left ? 1 : 0),
      (down ? 1 : 0) - (up ? 1 : 0)
    );

    if (dir.lengthSq() > 0) {
      dir.normalize().scale(PLAYER_SPEED);
      this.player.setVelocity(dir.x, dir.y);
    } else {
      this.player.setVelocity(0, 0);
    }
  }
}

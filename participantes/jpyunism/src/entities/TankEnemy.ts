import Phaser from "phaser";
import { Enemy } from "./Enemy";

/**
 * Slow, beefy enemy with high HP and damage. Bigger hitbox to match its
 * larger sprite.
 */
export class TankEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "enemy-tank", 80, 40, 20, 0xff00ff);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(32, 32);
  }

  public update(
    _time: number,
    _delta: number,
    playerX: number,
    playerY: number,
  ): void {
    if (!this.isAlive) {
      return;
    }

    this.scene.physics.moveTo(this, playerX, playerY, this.speed);

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    this.rotation = Math.atan2(dy, dx);
  }
}
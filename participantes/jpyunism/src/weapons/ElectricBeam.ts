import Phaser from "phaser";
import { Weapon } from "./Weapon";
import { Enemy } from "../entities/Enemy";

/**
 * ElectricBeam — instant beam that lives one frame. Continuously damages any
 * enemy inside the beam cone (range radius and ±10° from aim) while firing.
 * Uses a single persistent Graphics object stored on the scene to avoid
 * garbage every frame.
 */
export class ElectricBeam extends Weapon {
  private readonly coneRad: number = 0.1745; // 10 degrees
  private static readonly GRAPHICS_KEY = "electricBeamGraphics";

  constructor() {
    super("Electric", 5, 50, 300);
  }

  public fire(scene: Phaser.Scene, x: number, y: number, angle: number): void {
    // Reuse one persistent Graphics object across frames.
    let gfx = scene.data.get(ElectricBeam.GRAPHICS_KEY) as
      | Phaser.GameObjects.Graphics
      | undefined;
    if (!gfx) {
      gfx = scene.add.graphics();
      scene.data.set(ElectricBeam.GRAPHICS_KEY, gfx);
    }
    gfx.clear();

    // Draw the beam line and a soft halo for legibility
    const endX = x + Math.cos(angle) * this.range;
    const endY = y + Math.sin(angle) * this.range;
    gfx.lineStyle(6, 0x00ffff, 0.25);
    gfx.beginPath();
    gfx.moveTo(x, y);
    gfx.lineTo(endX, endY);
    gfx.strokePath();
    gfx.lineStyle(2, 0xffffff, 0.95);
    gfx.beginPath();
    gfx.moveTo(x, y);
    gfx.lineTo(endX, endY);
    gfx.strokePath();

    // Damage every enemy inside the cone
    const enemyGroup = scene.data.get("enemyGroup") as Phaser.Physics.Arcade.Group | undefined;
    const children = (enemyGroup?.getChildren() ?? []) as Enemy[];
    for (const enemy of children) {
      if (!enemy.isAlive) {
        continue;
      }
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.range) {
        continue;
      }
      if (dist < 0.0001) {
        enemy.takeDamage(this.damage);
        continue;
      }
      const enemyAngle = Math.atan2(dy, dx);
      let diff = Math.abs(Phaser.Math.Angle.Wrap(angle - enemyAngle));
      // Wrap-safe absolute angle difference
      if (diff > Math.PI) {
        diff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
      }
      if (diff <= this.coneRad) {
        enemy.takeDamage(this.damage);
      }
    }
  }
}
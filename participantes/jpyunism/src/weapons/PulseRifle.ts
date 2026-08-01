import Phaser from "phaser";
import { Weapon } from "./Weapon";

/**
 * PulseRifle — fires 3 cyan projectiles in a tight ±5° spread. Fast, low
 * damage per pellet, low cooldown.
 */
export class PulseRifle extends Weapon {
  private readonly projectileSpeed: number = 600;
  private readonly spreadRad: number = 0.087; // 5 degrees

  constructor() {
    super("Pulse", 8, 100, 350);
  }

  public fire(scene: Phaser.Scene, x: number, y: number, angle: number): void {
    const projectiles = scene.data.get("projectileGroup") as Phaser.Physics.Arcade.Group | undefined;
    if (!projectiles) return;

    const angles = [angle - this.spreadRad, angle, angle + this.spreadRad];
    for (const a of angles) {
      const proj = projectiles.get(x, y, "projectile-pulse") as
        | Phaser.Physics.Arcade.Image
        | undefined;

      if (!proj) {
        continue;
      }

      proj.setActive(true);
      proj.setVisible(true);
      proj.setTexture("projectile-pulse");
      proj.setPosition(x, y);
      proj.setData("damage", this.damage);
      proj.setData("source", "weapon");
      proj.setData("originX", x);
      proj.setData("originY", y);
      proj.setData("range", this.range);

      const body = proj.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(a) * this.projectileSpeed,
        Math.sin(a) * this.projectileSpeed,
      );
      body.setCollideWorldBounds(true);

      // Faint trail per pulse pellet — small alpha to avoid clutter across 3 shots.
      const trail = scene.add.circle(x, y, 3, 0x00ffff, 0.35);
      scene.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 1.8,
        duration: 140,
        onComplete: () => {
          if (trail.active) {
            trail.destroy();
          }
        },
      });
    }
  }
}
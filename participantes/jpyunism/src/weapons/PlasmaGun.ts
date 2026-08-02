import Phaser from "phaser";
import { Weapon } from "./Weapon";

/**
 * PlasmaGun — single cyan projectile, mid cooldown, mid damage, mid range.
 * Travels in a straight line and damages the first enemy it hits.
 */
export class PlasmaGun extends Weapon {
  private readonly projectileSpeed: number = 500;

  constructor() {
    super("Plasma", 15, 300, 400);
  }

  public fire(scene: Phaser.Scene, x: number, y: number, angle: number): void {
    const projectiles = scene.data.get("projectileGroup") as Phaser.Physics.Arcade.Group | undefined;
    if (!projectiles) return;

    const proj = projectiles.get(x, y, "projectile-plasma") as
      | Phaser.Physics.Arcade.Image
      | undefined;

    if (!proj) {
      return;
    }

    proj.setActive(true);
    proj.setVisible(true);
    proj.setTexture("projectile-plasma");
    proj.setPosition(x, y);
    proj.setData("damage", this.damage);
    proj.setData("source", "weapon");
    proj.setData("originX", x);
    proj.setData("originY", y);
    proj.setData("range", this.range);

    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * this.projectileSpeed,
      Math.sin(angle) * this.projectileSpeed,
    );
    body.setCollideWorldBounds(true);

    // Cheap trail: a single fading circle spawned at the projectile origin.
    // The ship is already cyan so we keep the trail in the same hue.
    const trail = scene.add.circle(x, y, 4, 0x00ffff, 0.5);
    scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 2,
      duration: 180,
      onComplete: () => {
        if (trail.active) {
          trail.destroy();
        }
      },
    });
  }
}
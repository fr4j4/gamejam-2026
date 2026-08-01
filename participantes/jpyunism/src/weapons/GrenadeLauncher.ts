import Phaser from "phaser";
import { Weapon } from "./Weapon";
import { Enemy } from "../entities/Enemy";

const EXPLOSION_RADIUS = 60;
const FUSE_MS = 500;

/**
 * GrenadeLauncher — slow magenta projectile that explodes on contact (or on
 * a 500ms fuse if it never hits anything), dealing AoE damage to every
 * enemy in a 60px radius.
 */
export class GrenadeLauncher extends Weapon {
  private readonly projectileSpeed: number = 350;

  constructor() {
    super("Grenade", 40, 1500, 300);
  }

  public fire(scene: Phaser.Scene, x: number, y: number, angle: number): void {
    const projectiles = (scene as unknown as {
      projectiles: Phaser.Physics.Arcade.Group;
    }).projectiles;

    const proj = projectiles.get(x, y, "projectile-grenade") as
      | Phaser.Physics.Arcade.Image
      | undefined;

    if (!proj) {
      return;
    }

    proj.setActive(true);
    proj.setVisible(true);
    proj.setTexture("projectile-grenade");
    proj.setPosition(x, y);
    proj.setData("damage", this.damage);
    proj.setData("source", "weapon");
    proj.setData("originX", x);
    proj.setData("originY", y);
    proj.setData("range", this.range);
    proj.setData("kind", "grenade");
    proj.setData("exploded", false);

    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * this.projectileSpeed,
      Math.sin(angle) * this.projectileSpeed,
    );
    body.setCollideWorldBounds(true);

    // Glow trail in the projectile's own hue.
    const trail = scene.add.circle(x, y, 6, 0xff00ff, 0.5);
    scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 2.2,
      duration: 220,
      onComplete: () => {
        if (trail.active) {
          trail.destroy();
        }
      },
    });

    // Fuse: explode after 500ms only if no contact has happened first.
    scene.time.delayedCall(FUSE_MS, () => {
      GrenadeLauncher.explode(scene, proj);
    });
  }

  /**
   * Triggers the AoE explosion at the projectile's current position. Safe to
   * call multiple times (first call wins, subsequent calls are no-ops).
   */
  public static explode(
    scene: Phaser.Scene,
    proj: Phaser.Physics.Arcade.Image,
  ): void {
    if (!proj.active || proj.getData("exploded") === true) {
      return;
    }
    proj.setData("exploded", true);

    const ex = proj.x;
    const ey = proj.y;

    // Visual: expanding orange/red circle that fades out
    const fx = scene.add.circle(ex, ey, EXPLOSION_RADIUS, 0xff5522, 0.7);
    fx.setStrokeStyle(3, 0xffaa00, 1);
    scene.tweens.add({
      targets: fx,
      radius: EXPLOSION_RADIUS * 1.4,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        if (fx.active) {
          fx.destroy();
        }
      },
    });

    // Deal damage to every enemy inside the explosion radius
    const gameScene = scene as unknown as {
      enemies: Phaser.Physics.Arcade.Group;
    };
    const children = gameScene.enemies.getChildren() as Enemy[];
    for (const enemy of children) {
      if (!enemy.isAlive) {
        continue;
      }
      const dx = enemy.x - ex;
      const dy = enemy.y - ey;
      if (dx * dx + dy * dy <= EXPLOSION_RADIUS * EXPLOSION_RADIUS) {
        enemy.takeDamage((proj.getData("damage") as number | undefined) ?? 0);
      }
    }

    // Destroy the projectile
    if (proj.active) {
      proj.disableBody(true, false);
      proj.setActive(false);
      proj.setVisible(false);
      proj.destroy();
    }
  }
}
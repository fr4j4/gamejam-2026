import Phaser from "phaser";
import { Weapon } from "./Weapon";
import { Enemy } from "../entities/Enemy";

const ZONE_RADIUS = 40;
const ZONE_DURATION_MS = 2000;
const TICK_INTERVAL_MS = 500;
const TICK_DAMAGE = 5;

/**
 * Flamethrower — short-range orange projectile that leaves a 2-second fire
 * zone on landing. Enemies inside the zone take 5 damage every 500ms.
 */
export class Flamethrower extends Weapon {
  private readonly projectileSpeed: number = 300;

  constructor() {
    super("Flamethrower", 12, 800, 250);
  }

  public fire(scene: Phaser.Scene, x: number, y: number, angle: number): void {
    const projectiles = (scene as unknown as {
      projectiles: Phaser.Physics.Arcade.Group;
    }).projectiles;

    const proj = projectiles.get(x, y, "projectile-fire") as
      | Phaser.Physics.Arcade.Image
      | undefined;

    if (!proj) {
      return;
    }

    proj.setActive(true);
    proj.setVisible(true);
    proj.setTexture("projectile-fire");
    proj.setPosition(x, y);
    proj.setData("damage", TICK_DAMAGE);
    proj.setData("source", "weapon");
    proj.setData("originX", x);
    proj.setData("originY", y);
    proj.setData("range", this.range);
    proj.setData("kind", "fire");

    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * this.projectileSpeed,
      Math.sin(angle) * this.projectileSpeed,
    );
    body.setCollideWorldBounds(true);

    // Orange fire trail.
    const trail = scene.add.circle(x, y, 6, 0xff5500, 0.5);
    scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 2.2,
      duration: 200,
      onComplete: () => {
        if (trail.active) {
          trail.destroy();
        }
      },
    });
  }

  /**
   * Spawns the persistent fire zone visual + damage loop at the given
   * world position. Called by GameScene when the projectile settles.
   */
  public static spawnFireZone(
    scene: Phaser.Scene,
    ex: number,
    ey: number,
  ): void {
    const gameScene = scene as unknown as {
      enemies: Phaser.Physics.Arcade.Group;
    };

    const fx = scene.add.circle(ex, ey, ZONE_RADIUS, 0xff5522, 0.45);
    fx.setStrokeStyle(2, 0xffaa00, 0.85);

    // Pulsing tween
    scene.tweens.add({
      targets: fx,
      radius: ZONE_RADIUS * 1.15,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Fade out at the end of the zone's lifetime
    scene.tweens.add({
      targets: fx,
      alpha: 0,
      duration: ZONE_DURATION_MS,
      onComplete: () => {
        if (fx.active) {
          fx.destroy();
        }
      },
    });

    // Damage tick loop
    scene.time.addEvent({
      delay: TICK_INTERVAL_MS,
      callback: () => {
        if (!fx.active) {
          return;
        }
        const children = gameScene.enemies.getChildren() as Enemy[];
        for (const enemy of children) {
          if (!enemy.isAlive) {
            continue;
          }
          const dx = enemy.x - ex;
          const dy = enemy.y - ey;
          if (dx * dx + dy * dy <= ZONE_RADIUS * ZONE_RADIUS) {
            enemy.takeDamage(TICK_DAMAGE);
          }
        }
      },
      callbackScope: scene,
      loop: true,
    });
  }
}
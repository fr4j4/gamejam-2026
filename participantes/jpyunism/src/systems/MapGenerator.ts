import Phaser from "phaser";

/**
 * Builds the neon arena: a solid border wall plus a scatter of pillar
 * obstacles. Returns a StaticGroup the rest of the game uses for collision
 * (player, enemies, projectiles).
 *
 * Visual contract:
 * - border walls: thin neon rectangle along each edge
 * - pillars: dark square with a bright neon border, so they read as
 *   "tech blocks" against the arena floor.
 *
 * Generation rules:
 * - arena `width x height` (defaults to 1280x960, matches GameScene bounds)
 * - 15-25 pillars, sized 24x24 or 32x32
 * - pillars keep a 60px gap from each other
 * - center 400x400 is kept clear so the player has a safe spawn area
 */
export class MapGenerator {
  public static readonly WALL_THICKNESS = 8;
  public static readonly PILLAR_MIN_SIZE = 24;
  public static readonly PILLAR_MAX_SIZE = 32;
  public static readonly PILLAR_MIN_SEPARATION = 60;
  public static readonly PILLAR_COUNT_MIN = 15;
  public static readonly PILLAR_COUNT_MAX = 25;
  public static readonly SAFE_CENTER_HALF = 200; // 400x400 safe square

  private static readonly WALL_TEXTURE_KEY = "wall";
  private static readonly PILLAR_TEXTURE_KEY = "pillar";

  /**
   * Builds the map and returns the StaticGroup containing every static body
   * (border walls + pillars). Safe to call once during scene `create()`.
   */
  public static generate(
    scene: Phaser.Scene,
    width: number,
    height: number,
  ): Phaser.Physics.Arcade.StaticGroup {
    const obstacles = scene.physics.add.staticGroup();

    MapGenerator.generateTextures(scene);

    // ---- Border walls (top, bottom, left, right) ----
    const t = MapGenerator.WALL_THICKNESS;
    const wallTop = scene.add.image(width / 2, t / 2, MapGenerator.WALL_TEXTURE_KEY);
    wallTop.setDisplaySize(width, t);
    obstacles.add(wallTop);

    const wallBottom = scene.add.image(
      width / 2,
      height - t / 2,
      MapGenerator.WALL_TEXTURE_KEY,
    );
    wallBottom.setDisplaySize(width, t);
    obstacles.add(wallBottom);

    const wallLeft = scene.add.image(t / 2, height / 2, MapGenerator.WALL_TEXTURE_KEY);
    wallLeft.setDisplaySize(t, height);
    obstacles.add(wallLeft);

    const wallRight = scene.add.image(
      width - t / 2,
      height / 2,
      MapGenerator.WALL_TEXTURE_KEY,
    );
    wallRight.setDisplaySize(t, height);
    obstacles.add(wallRight);

    // ---- Pillars ----
    const cx = width / 2;
    const cy = height / 2;
    const safeHalf = MapGenerator.SAFE_CENTER_HALF;
    const pillarCount = Phaser.Math.Between(
      MapGenerator.PILLAR_COUNT_MIN,
      MapGenerator.PILLAR_COUNT_MAX,
    );

    const placed: Array<{ x: number; y: number; half: number }> = [];
    let attempts = 0;
    const maxAttempts = pillarCount * 30;

    while (placed.length < pillarCount && attempts < maxAttempts) {
      attempts++;
      const size = Phaser.Math.Between(
        MapGenerator.PILLAR_MIN_SIZE,
        MapGenerator.PILLAR_MAX_SIZE,
      );
      const half = size / 2;

      // Keep a margin off the border walls and safe center.
      const x = Phaser.Math.Between(
        half + t + 4,
        width - half - t - 4,
      );
      const y = Phaser.Math.Between(
        half + t + 4,
        height - half - t - 4,
      );

      // Reject if inside the safe center square.
      if (
        x > cx - safeHalf - half &&
        x < cx + safeHalf + half &&
        y > cy - safeHalf - half &&
        y < cy + safeHalf + half
      ) {
        continue;
      }

      // Reject if too close to a previously placed pillar.
      let ok = true;
      for (const p of placed) {
        const dx = p.x - x;
        const dy = p.y - y;
        const minDist = p.half + half + MapGenerator.PILLAR_MIN_SEPARATION;
        if (dx * dx + dy * dy < minDist * minDist) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        continue;
      }

      const pillar = scene.add.image(x, y, MapGenerator.PILLAR_TEXTURE_KEY);
      pillar.setDisplaySize(size, size);
      obstacles.add(pillar);

      // Subtle ambient glow behind the pillar in the same cyan hue as its
      // border. Sized just larger than the pillar so it reads as bloom
      // rather than a halo. Per-pillar alpha tween is staggered so the
      // arena doesn't pulse in unison (would feel mechanical).
      const glow = scene.add.circle(x, y, half + 6, 0x00ffff, 0.08);
      glow.setDepth(pillar.depth - 1);
      scene.tweens.add({
        targets: glow,
        alpha: 0.18,
        duration: 1500 + Math.floor(Math.random() * 800),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      placed.push({ x, y, half });
    }

    return obstacles;
  }

  /**
   * Generates the shared textures used by border walls and pillars. Idempotent
   * — if the texture keys already exist we skip generation so re-calling
   * generate() during scene restarts doesn't double-register.
   */
  private static generateTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists(MapGenerator.WALL_TEXTURE_KEY)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x1a0033, 1);
      g.fillRect(0, 0, 4, 4);
      g.lineStyle(1, 0xff00ff, 1);
      g.strokeRect(0.5, 0.5, 3, 3);
      g.generateTexture(MapGenerator.WALL_TEXTURE_KEY, 4, 4);
      g.destroy();
    }

    if (!scene.textures.exists(MapGenerator.PILLAR_TEXTURE_KEY)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x0a0a18, 1);
      g.fillRect(0, 0, 32, 32);
      g.lineStyle(2, 0x00ffff, 1);
      g.strokeRect(1, 1, 30, 30);
      // Inner accent — small diamond so the pillar reads as "tech block"
      g.lineStyle(1, 0xff00ff, 1);
      g.strokeRect(8, 8, 16, 16);
      g.generateTexture(MapGenerator.PILLAR_TEXTURE_KEY, 32, 32);
      g.destroy();
    }
  }
}

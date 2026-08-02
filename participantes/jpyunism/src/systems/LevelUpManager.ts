import Phaser from "phaser";
import { Player } from "../entities/Player";
import { PowerUpSelect } from "../ui/PowerUpSelect";

// Augment Player with power-up-only fields. The base Player class doesn't
// know about power-ups — the manager is the source of truth for these.
declare module "../entities/Player" {
  interface Player {
    bouncingShots?: boolean;
    tempShieldActive?: boolean;
  }
}

/**
 * One row in the power-up catalogue. `apply` runs when the player picks the
 * option; `remove` (optional) runs when a timed buff expires.
 */
export interface PowerUpOption {
  id: string;
  name: string;
  description: string;
  /** Duration in ms, or -1 for "rest of run" (permanent-run). */
  duration: number;
  apply: (player: Player, scene: Phaser.Scene) => void;
  remove?: (player: Player, scene: Phaser.Scene) => void;
}

/**
 * Drives the level-up loop: every N kills, pause the scene, let the player
 * pick one of three random power-ups, then resume. The pick UI is now
 * `PowerUpSelect` (Phase 7).
 */
export class LevelUpManager {
  public level: number = 1;
  public killsThisLevel: number = 0;
  public killsRequired: number = 8;

  /** Active timed power-ups: id → expiry timestamp in ms (scene time). */
  private readonly activePowerUps: Map<string, number> = new Map();
  /** Permanent-run power-ups currently applied. */
  private readonly permanentPowerUps: Set<string> = new Set();
  /** Cache of the catalog so we don't rebuild it on every offer. */
  private powerUpPool: PowerUpOption[] | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
  ) {}

  /**
   * Bumps the kill counter and triggers the level-up prompt when the
   * threshold is reached.
   */
  public onEnemyKilled(): void {
    this.killsThisLevel += 1;
    if (this.killsThisLevel >= this.killsRequired) {
      this.offerPowerUp();
    }
  }

  /**
   * Pause the scene, present 3 random options via `PowerUpSelect`, and
   * apply the chosen one when the promise resolves. Scene pause/resume
   * happens here so the caller (GameScene) doesn't have to think about it.
   */
  public offerPowerUp(): void {
    this.scene.scene.pause();

    const pool = this.getPowerUpPool();
    const choices = this.pickRandom(pool, 3);

    PowerUpSelect.show(this.scene, choices, this.level).then((selected) => {
      if (selected) {
        this.applyPowerUp(selected.id);
      }
      this.scene.scene.resume();

      this.level += 1;
      this.killsThisLevel = 0;
      this.killsRequired += 4;
    });
  }

  /**
   * Returns the full catalog. Built lazily and cached.
   */
  public getPowerUpPool(): PowerUpOption[] {
    if (this.powerUpPool) {
      return this.powerUpPool;
    }
    const sceneRef = this.scene;

    this.powerUpPool = [
      {
        id: "speed-boost",
        name: "Overclock",
        description: "+15% move speed (30s)",
        duration: 30_000,
        apply: (p) => {
          p.speed = Math.round(p.speed * 1.15);
        },
        remove: (p) => {
          p.speed = Math.round(p.speed / 1.15);
        },
      },
      {
        id: "damage-boost",
        name: "Damage Amp",
        description: "+20% damage to all weapons (30s)",
        duration: 30_000,
        apply: (p) => {
          for (const w of p.weapons) {
            w.damage = Math.round(w.damage * 1.2);
          }
        },
        remove: (p) => {
          for (const w of p.weapons) {
            w.damage = Math.round(w.damage / 1.2);
          }
        },
      },
      {
        id: "cadence-boost",
        name: "Cadence Boost",
        description: "+30% fire rate (30s)",
        duration: 30_000,
        apply: (p) => {
          for (const w of p.weapons) {
            w.cooldown = Math.round(w.cooldown * 0.7);
          }
        },
        remove: (p) => {
          for (const w of p.weapons) {
            w.cooldown = Math.round(w.cooldown / 0.7);
          }
        },
      },
      {
        id: "shield-boost",
        name: "Shield Surge",
        description: "+50 max shield (filled) for 30s",
        duration: 30_000,
        apply: (p) => {
          p.maxShield += 50;
          p.shield = p.maxShield;
        },
        remove: (p) => {
          p.maxShield = Math.max(0, p.maxShield - 50);
          p.shield = Math.min(p.shield, p.maxShield);
        },
      },
      {
        id: "bouncing-shots",
        name: "Bouncing Rounds",
        description: "Projectiles bounce once on enemy hit",
        duration: -1,
        apply: (p) => {
          p.bouncingShots = true;
        },
      },
      {
        id: "triple-shot",
        name: "Triple Shot",
        description: "Fire 3 projectiles in spread (15s)",
        duration: 15_000,
        apply: (_p, scene) => {
          scene.data.set("triple-shot-active", true);
        },
        remove: (_p, scene) => {
          scene.data.set("triple-shot-active", false);
        },
      },
      {
        id: "temp-shield",
        name: "Temp Shield",
        description: "Absorbs 1 hit, then breaks",
        duration: 30_000,
        apply: (p) => {
          p.tempShieldActive = true;
        },
        remove: (p) => {
          p.tempShieldActive = false;
        },
      },
      {
        id: "explosion-on-kill",
        name: "Chain Reaction",
        description: "Enemies explode on death (40px, 10dmg)",
        duration: 30_000,
        apply: (_p, scene) => {
          scene.data.set("explosion-on-kill-active", true);
        },
        remove: (_p, scene) => {
          scene.data.set("explosion-on-kill-active", false);
        },
      },
      {
        id: "piercing-shots",
        name: "Piercing Rounds",
        description: "Bullets pass through enemies (15s)",
        duration: 15_000,
        apply: (_p, scene) => {
          scene.data.set("piercing-shots-active", true);
        },
        remove: (_p, scene) => {
          scene.data.set("piercing-shots-active", false);
        },
      },
    ];

    // Suppress unused-warning on the sceneRef alias — kept for future
    // power-ups that need direct scene access during apply().
    void sceneRef;
    return this.powerUpPool;
  }

  /**
   * Look up a power-up by id, apply it, and register its expiry if timed.
   */
  public applyPowerUp(id: string): void {
    const pool = this.getPowerUpPool();
    const opt = pool.find((p) => p.id === id);
    if (!opt) {
      return;
    }

    opt.apply(this.player, this.scene);

    if (opt.duration === -1) {
      this.permanentPowerUps.add(id);
    } else {
      const expiry = this.scene.time.now + opt.duration;
      this.activePowerUps.set(id, expiry);
    }
  }

  /**
   * Per-frame check for expired timed buffs. Call from GameScene.update().
   */
  public update(time: number): void {
    if (this.activePowerUps.size === 0) {
      return;
    }
    for (const [id, expiry] of this.activePowerUps) {
      if (time >= expiry) {
        const opt = this.getPowerUpPool().find((p) => p.id === id);
        if (opt?.remove) {
          opt.remove(this.player, this.scene);
        }
        this.activePowerUps.delete(id);
      }
    }
  }

  /**
   * Helper: returns `count` random unique entries from `pool`.
   */
  private pickRandom(pool: PowerUpOption[], count: number): PowerUpOption[] {
    const copy = pool.slice();
    Phaser.Utils.Array.Shuffle(copy);
    return copy.slice(0, Math.min(count, copy.length));
  }
}

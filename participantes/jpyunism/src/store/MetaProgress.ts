import { Player } from "../entities/Player";

export interface MetaData {
  coins: number;
  upgrades: {
    damage: number; // 0-5
    speed: number; // 0-3
    shield: number; // 0-5
    regen: number; // 0-3
    cadence: number; // 0-5
  };
}

const STORAGE_KEY = "neon-drift:meta";

const DEFAULT_META: MetaData = {
  coins: 0,
  upgrades: {
    damage: 0,
    speed: 0,
    shield: 0,
    regen: 0,
    cadence: 0,
  },
};

export class MetaProgress {
  public static load(): MetaData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneMeta(DEFAULT_META);
      }
      const parsed = JSON.parse(raw) as Partial<MetaData>;
      return mergeWithDefaults(parsed);
    } catch {
      return cloneMeta(DEFAULT_META);
    }
  }

  public static save(data: MetaData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable (private mode, quota, etc.) — fail silently.
    }
  }

  public static addCoins(amount: number): void {
    if (amount <= 0) {
      return;
    }
    const data = MetaProgress.load();
    data.coins += amount;
    MetaProgress.save(data);
  }

  public static getMaxLevel(upgrade: keyof MetaData["upgrades"]): number {
    switch (upgrade) {
      case "damage":
        return 5;
      case "speed":
        return 3;
      case "shield":
        return 5;
      case "regen":
        return 3;
      case "cadence":
        return 5;
    }
  }

  public static getUpgradeCost(
    upgrade: keyof MetaData["upgrades"],
    level: number,
  ): number {
    const max = MetaProgress.getMaxLevel(upgrade);
    if (level >= max) {
      return -1;
    }
    // Costs: level 1 = 100, 2 = 200, 3 = 400, 4 = 800, 5 = 1600
    return 100 * Math.pow(2, level);
  }

  public static purchaseUpgrade(
    upgrade: keyof MetaData["upgrades"],
  ): boolean {
    const data = MetaProgress.load();
    const currentLevel = data.upgrades[upgrade];
    const cost = MetaProgress.getUpgradeCost(upgrade, currentLevel);
    if (cost < 0) {
      return false;
    }
    if (data.coins < cost) {
      return false;
    }
    data.coins -= cost;
    data.upgrades[upgrade] = currentLevel + 1;
    MetaProgress.save(data);
    return true;
  }

  public static getUpgradeEffect(
    upgrade: keyof MetaData["upgrades"],
    level: number,
  ): string {
    switch (upgrade) {
      case "damage":
        return `+${level * 10}% damage`;
      case "speed":
        return `+${level * 8}% move speed`;
      case "shield":
        return `+${level * 20} max shield`;
      case "regen":
        return `-${level * 15}% shield regen delay`;
      case "cadence":
        return `-${level * 8}% weapon cooldown`;
    }
  }
}

function cloneMeta(src: MetaData): MetaData {
  return {
    coins: src.coins,
    upgrades: { ...src.upgrades },
  };
}

function mergeWithDefaults(parsed: Partial<MetaData>): MetaData {
  const merged: MetaData = cloneMeta(DEFAULT_META);
  if (typeof parsed.coins === "number" && Number.isFinite(parsed.coins)) {
    merged.coins = Math.max(0, Math.floor(parsed.coins));
  }
  if (parsed.upgrades && typeof parsed.upgrades === "object") {
    const u = parsed.upgrades;
    const keys: Array<keyof MetaData["upgrades"]> = [
      "damage",
      "speed",
      "shield",
      "regen",
      "cadence",
    ];
    for (const key of keys) {
      const value = (u as Record<string, unknown>)[key];
      const max = MetaProgress.getMaxLevel(key);
      if (typeof value === "number" && Number.isFinite(value)) {
        merged.upgrades[key] = Math.min(max, Math.max(0, Math.floor(value)));
      }
    }
  }
  return merged;
}

/**
 * Apply all meta-progression upgrades to the player and their equipped weapons.
 * Bonuses are cumulative: each level multiplies the base value further.
 *
 * NOTE: This mutates the player and weapon instances currently held by the
 * player. If weapons are re-equipped later (e.g. level-up power-ups), call
 * this again so the new weapons pick up the bonuses.
 */
export function applyMetaBonuses(player: Player, meta: MetaData): void {
  const u = meta.upgrades;

  // Damage: stack +10% per level
  const damageMult = 1 + u.damage * 0.1;
  for (const weapon of player.weapons) {
    weapon.damage = weapon.damage * damageMult;
  }

  // Speed: stack +8% per level
  if (u.speed > 0) {
    player.speed = player.speed * (1 + u.speed * 0.08);
  }

  // Shield: +20 max shield per level (additive to current values too)
  if (u.shield > 0) {
    const bonus = u.shield * 20;
    player.maxShield += bonus;
    player.shield += bonus;
  }

  // Regen: -15% shield regen delay per level (minimum 1000ms)
  if (u.regen > 0) {
    player.shieldRechargeDelay = Math.max(
      1000,
      player.shieldRechargeDelay * (1 - u.regen * 0.15),
    );
  }

  // Cadence: -8% weapon cooldown per level (minimum 50ms per weapon)
  if (u.cadence > 0) {
    for (const weapon of player.weapons) {
      weapon.cooldown = Math.max(50, weapon.cooldown * (1 - u.cadence * 0.08));
    }
  }
}

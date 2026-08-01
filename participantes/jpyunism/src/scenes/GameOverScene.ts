import Phaser from "phaser";
import { MetaProgress } from "../store/MetaProgress";

interface GameOverData {
  runCoins?: number;
  waveReached?: number;
  levelReached?: number;
}

interface ShopLineRefs {
  damage: Phaser.GameObjects.Text;
  speed: Phaser.GameObjects.Text;
  shield: Phaser.GameObjects.Text;
  regen: Phaser.GameObjects.Text;
  cadence: Phaser.GameObjects.Text;
}

type UpgradeKey = keyof ReturnType<typeof MetaProgress.load>["upgrades"];
const UPGRADE_KEYS: UpgradeKey[] = [
  "damage",
  "speed",
  "shield",
  "regen",
  "cadence",
];

export class GameOverScene extends Phaser.Scene {
  private runCoins: number = 0;
  private waveReached: number = 0;
  private levelReached: number = 0;

  private shopPanel: Phaser.GameObjects.Container | null = null;
  private shopLines: ShopLineRefs | null = null;
  private shopStatus: Phaser.GameObjects.Text | null = null;
  private coinsLabel: Phaser.GameObjects.Text | null = null;
  private isShopOpen: boolean = false;
  private shopHandlers: Array<{ event: string; fn: () => void }> = [];

  constructor() {
    super("GameOverScene");
  }

  init(data: GameOverData): void {
    this.runCoins = data.runCoins ?? 0;
    this.waveReached = data.waveReached ?? 0;
    this.levelReached = data.levelReached ?? 0;
  }

  create(): void {
    const { width, height } = this.scale;

    // Title
    const title = this.add
      .text(width / 2, 100, "GAME OVER", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: "#ff00ff",
      })
      .setOrigin(0.5);
    title.setShadow(0, 0, "#ff00ff", 18, true, true);

    // Run summary
    this.add
      .text(width / 2, 200, `Wave reached: ${this.waveReached}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 232, `Level reached: ${this.levelReached}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 264, `Coins this run: ${this.runCoins}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    // Total coins (persisted meta)
    this.coinsLabel = this.add
      .text(
        width / 2,
        296,
        `Total coins: ${MetaProgress.load().coins}`,
        {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#ffd700",
        },
      )
      .setOrigin(0.5);

    // Instructions
    const hintStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#00ffff",
      align: "center",
    };

    this.add
      .text(width / 2, 360, "[R] Restart", hintStyle)
      .setOrigin(0.5);
    this.add
      .text(width / 2, 388, "[M] Menu", hintStyle)
      .setOrigin(0.5);
    this.add
      .text(width / 2, 416, "[S] Shop", hintStyle)
      .setOrigin(0.5);

    // Bottom hint
    this.add
      .text(
        width / 2,
        height - 40,
        "Tip: spend coins in the shop to make future runs easier.",
        {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#888888",
          align: "center",
        },
      )
      .setOrigin(0.5);

    // Input — main menu
    this.input.keyboard?.on("keydown-R", () => {
      this.scene.start("GameScene");
    });
    this.input.keyboard?.on("keydown-M", () => {
      this.scene.start("MenuScene");
    });

    // Shop toggle
    this.input.keyboard?.on("keydown-S", () => {
      this.toggleShop();
    });
  }

  private toggleShop(): void {
    if (this.isShopOpen) {
      this.closeShop();
    } else {
      this.openShop();
    }
  }

  private openShop(): void {
    if (this.isShopOpen) {
      return;
    }
    this.isShopOpen = true;

    const { width, height } = this.scale;

    const panel = this.add.container(width / 2, height / 2 + 20);
    const bg = this.add.rectangle(0, 0, 520, 360, 0x10102a, 0.92);
    bg.setStrokeStyle(2, 0x00ffff, 1);
    panel.add(bg);

    const header = this.add
      .text(0, -150, "SHOP — spend coins on permanent upgrades", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#00ffff",
        align: "center",
      })
      .setOrigin(0.5);
    panel.add(header);

    const data = MetaProgress.load();
    const lineStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
    };

    const labels: UpgradeKey[] = ["damage", "speed", "shield", "regen", "cadence"];
    const yStart = -110;
    const yStep = 38;
    const lines: Partial<ShopLineRefs> = {};

    for (let i = 0; i < labels.length; i++) {
      const key = labels[i];
      const lvl = data.upgrades[key];
      const max = MetaProgress.getMaxLevel(key);
      const cost = MetaProgress.getUpgradeCost(key, lvl);
      const effect = MetaProgress.getUpgradeEffect(key, lvl);
      const hotkey = i + 1;

      let line: string;
      if (lvl >= max) {
        line = `[${hotkey}] ${capitalize(key)} Lv MAX/${max} — ${effect}`;
      } else {
        line = `[${hotkey}] ${capitalize(key)} Lv ${lvl}/${max} — ${effect} — Cost: ${cost}`;
      }

      const txt = this.add.text(0, yStart + i * yStep, line, lineStyle);
      txt.setOrigin(0.5);
      panel.add(txt);
      lines[key] = txt;
    }

    const status = this.add
      .text(0, 110, "Press 1-5 to buy — ESC to close", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#888888",
      })
      .setOrigin(0.5);
    panel.add(status);

    this.shopPanel = panel;
    this.shopLines = lines as ShopLineRefs;
    this.shopStatus = status;

    // Bind purchase hotkeys 1-5
    for (let i = 0; i < UPGRADE_KEYS.length; i++) {
      const key = UPGRADE_KEYS[i];
      const hotkeyDigit = i + 1;
      const hotkeyCode = `keydown-${hotkeyDigit}`;
      const fn = (): void => {
        this.tryPurchase(key);
      };
      this.input.keyboard?.on(hotkeyCode, fn);
      this.shopHandlers.push({ event: hotkeyCode, fn });
    }

    // ESC closes the shop
    const escFn = (): void => {
      if (this.isShopOpen) {
        this.closeShop();
      }
    };
    this.input.keyboard?.on("keydown-ESC", escFn);
    this.shopHandlers.push({ event: "keydown-ESC", fn: escFn });
  }

  private tryPurchase(key: UpgradeKey): void {
    if (!this.isShopOpen) {
      return;
    }
    const before = MetaProgress.load();
    const lvl = before.upgrades[key];
    const max = MetaProgress.getMaxLevel(key);
    if (lvl >= max) {
      this.flashStatus(`${capitalize(key)} already MAXED`, "#888888");
      return;
    }
    const cost = MetaProgress.getUpgradeCost(key, lvl);
    if (before.coins < cost) {
      this.flashStatus("Not enough coins", "#ff4444");
      return;
    }
    const ok = MetaProgress.purchaseUpgrade(key);
    if (!ok) {
      this.flashStatus("Purchase failed", "#ff4444");
      return;
    }
    this.flashStatus(`Bought ${capitalize(key)} Lv ${lvl + 1}!`, "#00ff00");
    this.refreshShop();
  }

  private refreshShop(): void {
    if (!this.shopLines) {
      return;
    }
    const data = MetaProgress.load();
    const labels: UpgradeKey[] = ["damage", "speed", "shield", "regen", "cadence"];
    for (let i = 0; i < labels.length; i++) {
      const key = labels[i];
      const lvl = data.upgrades[key];
      const max = MetaProgress.getMaxLevel(key);
      const cost = MetaProgress.getUpgradeCost(key, lvl);
      const effect = MetaProgress.getUpgradeEffect(key, lvl);
      const hotkey = i + 1;

      let line: string;
      if (lvl >= max) {
        line = `[${hotkey}] ${capitalize(key)} Lv MAX/${max} — ${effect}`;
      } else {
        line = `[${hotkey}] ${capitalize(key)} Lv ${lvl}/${max} — ${effect} — Cost: ${cost}`;
      }

      const txt = this.shopLines[key];
      txt.setText(line);
      txt.setColor(canAfford(data.coins, cost, lvl, max) ? "#ffffff" : "#666666");
    }

    if (this.coinsLabel) {
      this.coinsLabel.setText(`Total coins: ${data.coins}`);
    }
  }

  private closeShop(): void {
    if (!this.isShopOpen) {
      return;
    }
    this.isShopOpen = false;

    if (this.shopPanel) {
      this.shopPanel.destroy(true);
      this.shopPanel = null;
    }
    this.shopLines = null;
    this.shopStatus = null;

    // Unbind every shop-scoped keyboard listener we registered.
    for (const { event, fn } of this.shopHandlers) {
      this.input.keyboard?.off(event, fn);
    }
    this.shopHandlers = [];

    // Refresh total coins in the main view (in case purchases happened)
    if (this.coinsLabel) {
      this.coinsLabel.setText(`Total coins: ${MetaProgress.load().coins}`);
    }
  }

  private flashStatus(msg: string, color: string): void {
    if (!this.shopStatus) {
      return;
    }
    this.shopStatus.setText(msg);
    this.shopStatus.setColor(color);
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function canAfford(
  coins: number,
  cost: number,
  level: number,
  max: number,
): boolean {
  if (level >= max) {
    return false;
  }
  return coins >= cost;
}
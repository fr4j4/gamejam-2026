import Phaser from "phaser";
import { MetaProgress } from "../store/MetaProgress";

/**
 * Catalog of weapons the player can pick from in the menu. Keep the IDs in
 * sync with the class names — GameScene's factory keys off these strings.
 */
interface WeaponCardData {
  id: string;
  name: string;
  damage: number;
  description: string;
}

const WEAPON_CATALOG: WeaponCardData[] = [
  {
    id: "PlasmaGun",
    name: "Plasma",
    damage: 15,
    description: "Single mid-range cyan shot",
  },
  {
    id: "GrenadeLauncher",
    name: "Grenade",
    damage: 40,
    description: "Slow AoE magenta burst",
  },
  {
    id: "PulseRifle",
    name: "Pulse",
    damage: 8,
    description: "Fast 3-pellet spread",
  },
  {
    id: "ElectricBeam",
    name: "Electric",
    damage: 5,
    description: "Continuous beam, 10° cone",
  },
  {
    id: "Flamethrower",
    name: "Flamethrower",
    damage: 12,
    description: "Short-range fire zones",
  },
];

const REQUIRED_PICKS = 2;
const CARD_WIDTH = 180;
const CARD_HEIGHT = 160;
const CARD_GAP = 18;
const CARD_BORDER_COLOR_DEFAULT = 0x00ffff;
const CARD_BORDER_COLOR_SELECTED = 0x00ff66;
const CARD_BG_COLOR = 0x101830;
const CARD_TEXT_NAME = "#00ffff";
const CARD_TEXT_DAMAGE = "#ffffff";
const CARD_TEXT_DESC = "#888888";
const CARD_TEXT_NAME_SELECTED = "#00ff66";
const CARD_TEXT_DIM = "#446688";

export class MenuScene extends Phaser.Scene {
  /** Cards currently flipped to "selected" — grows up to REQUIRED_PICKS. */
  private selectedIds: string[] = [];

  /** UI labels that need to be redrawn when the selection changes. */
  private instructionText!: Phaser.GameObjects.Text;
  private startHint!: Phaser.GameObjects.Text;
  private cardsByWeaponId: Map<string, WeaponCardRefs> = new Map();

  constructor() {
    super("MenuScene");
  }

  create(): void {
    const { width, height } = this.scale;

    this.drawTitle(width, height);
    this.drawWeaponRow(width, height);
    this.drawInstruction(width, height);
    this.drawStartHint(width, height);
    this.drawTotalCoins(width, height);
    this.bindInput();
  }

  private drawTitle(width: number, height: number): void {
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "44px",
      color: "#00ffff",
      align: "center",
    };

    const title = this.add
      .text(width / 2, height * 0.18, "NEON DRIFT", titleStyle)
      .setOrigin(0.5);

    title.setShadow(0, 0, "#00ffff", 16, true, true);

    this.add
      .text(
        width / 2,
        height * 0.18 + 32,
        "SELECT 2 WEAPONS",
        {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#ff00ff",
          align: "center",
        },
      )
      .setOrigin(0.5);
  }

  private drawWeaponRow(width: number, height: number): void {
    // Total span of the row so we can center the cards as a group.
    const totalWidth =
      WEAPON_CATALOG.length * CARD_WIDTH +
      (WEAPON_CATALOG.length - 1) * CARD_GAP;
    const startX = width / 2 - totalWidth / 2 + CARD_WIDTH / 2;
    const rowY = height * 0.55;

    for (let i = 0; i < WEAPON_CATALOG.length; i++) {
      const data = WEAPON_CATALOG[i];
      const x = startX + i * (CARD_WIDTH + CARD_GAP);
      const refs = this.createWeaponCard(x, rowY, data);
      this.cardsByWeaponId.set(data.id, refs);
    }
  }

  private createWeaponCard(
    x: number,
    y: number,
    data: WeaponCardData,
  ): WeaponCardRefs {
    // Hit area is the full card — clicking anywhere inside toggles the card.
    const hit = this.add
      .rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, CARD_BG_COLOR, 0.9)
      .setStrokeStyle(2, CARD_BORDER_COLOR_DEFAULT, 1)
      .setInteractive({ useHandCursor: true });

    // Keep DOM-stable position so the hit zone doesn't drift.
    hit.setOrigin(0.5);

    const nameText = this.add
      .text(x, y - 50, data.name, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: CARD_TEXT_NAME,
        align: "center",
      })
      .setOrigin(0.5);

    const damageText = this.add
      .text(x, y - 20, `DMG ${data.damage}`, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: CARD_TEXT_DAMAGE,
        align: "center",
      })
      .setOrigin(0.5);

    const descText = this.add
      .text(x, y + 18, data.description, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: CARD_TEXT_DESC,
        align: "center",
        wordWrap: { width: CARD_WIDTH - 16 },
      })
      .setOrigin(0.5);

    const idLabel = this.add
      .text(x, y + 56, data.id, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: CARD_TEXT_DIM,
        align: "center",
      })
      .setOrigin(0.5);

    hit.on("pointerdown", () => {
      this.toggleWeapon(data.id);
    });

    // Hover affordance — brightens the border so the player knows it's clickable.
    hit.on("pointerover", () => {
      if (!this.selectedIds.includes(data.id)) {
        hit.setStrokeStyle(2, 0x66ddff, 1);
      }
    });
    hit.on("pointerout", () => {
      this.applyCardVisual(data.id);
    });

    return { hit, nameText, damageText, descText, idLabel };
  }

  private drawInstruction(width: number, height: number): void {
    this.instructionText = this.add
      .text(width / 2, height * 0.78, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffaa00",
        align: "center",
      })
      .setOrigin(0.5);

    this.refreshInstruction();
  }

  private drawStartHint(width: number, height: number): void {
    this.startHint = this.add
      .text(width / 2, height * 0.85, "", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ff00ff",
        align: "center",
      })
      .setOrigin(0.5);

    this.startHint.setShadow(0, 0, "#ff00ff", 8, true, true);
    this.refreshStartHint();
  }

  private drawTotalCoins(width: number, height: number): void {
    const totalCoins = MetaProgress.load().coins;
    this.add
      .text(width / 2, height - 40, `Total coins: ${totalCoins}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffd700",
        align: "center",
      })
      .setOrigin(0.5);
  }

  private bindInput(): void {
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.tryStartRun();
    });
  }

  private toggleWeapon(id: string): void {
    const idx = this.selectedIds.indexOf(id);
    if (idx >= 0) {
      // Already selected — deselect.
      this.selectedIds.splice(idx, 1);
    } else {
      // Not selected — only allow up to REQUIRED_PICKS selections.
      if (this.selectedIds.length >= REQUIRED_PICKS) {
        // Silently ignore extra clicks; the instruction text already warns.
        return;
      }
      this.selectedIds.push(id);
    }

    this.applyCardVisual(id);
    this.refreshInstruction();
    this.refreshStartHint();
  }

  /**
   * Applies the visual style for a single card based on whether its ID is
   * currently in `selectedIds`.
   */
  private applyCardVisual(id: string): void {
    const refs = this.cardsByWeaponId.get(id);
    if (!refs) {
      return;
    }
    const isSelected = this.selectedIds.includes(id);
    const borderColor = isSelected
      ? CARD_BORDER_COLOR_SELECTED
      : CARD_BORDER_COLOR_DEFAULT;
    refs.hit.setStrokeStyle(2, borderColor, 1);

    if (isSelected) {
      refs.hit.setFillStyle(CARD_BG_COLOR, 1);
      refs.nameText.setColor(CARD_TEXT_NAME_SELECTED);
    } else {
      refs.hit.setFillStyle(CARD_BG_COLOR, 0.9);
      refs.nameText.setColor(CARD_TEXT_NAME);
    }
  }

  private refreshInstruction(): void {
    const remaining = REQUIRED_PICKS - this.selectedIds.length;
    if (remaining === 0) {
      this.instructionText.setText("Locked in: " + this.selectedIds.join(" + "));
      this.instructionText.setColor("#00ff66");
    } else if (remaining === 1) {
      this.instructionText.setText("Pick 1 more weapon");
      this.instructionText.setColor("#ffaa00");
    } else {
      this.instructionText.setText(`Pick ${remaining} weapons`);
      this.instructionText.setColor("#ffaa00");
    }
  }

  private refreshStartHint(): void {
    if (this.selectedIds.length === REQUIRED_PICKS) {
      this.startHint.setText("Press ENTER to start");
      this.startHint.setAlpha(1);
      this.startHint.setVisible(true);
    } else {
      this.startHint.setText("");
      this.startHint.setVisible(false);
    }
  }

  private tryStartRun(): void {
    if (this.selectedIds.length !== REQUIRED_PICKS) {
      return;
    }
    this.scene.start("GameScene", { weaponIds: [...this.selectedIds] });
  }
}

/**
 * Group of GameObjects that make up a single selectable weapon card. Kept
 * in a typed bag so we don't depend on Phaser's getByName magic.
 */
interface WeaponCardRefs {
  hit: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  damageText: Phaser.GameObjects.Text;
  descText: Phaser.GameObjects.Text;
  idLabel: Phaser.GameObjects.Text;
}

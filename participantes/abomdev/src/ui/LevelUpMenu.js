// Menú de subida de nivel: 4 cards en grilla 2x2, con borde de color según rareza.
// Se elige con clic sobre la card o con las teclas 1-4.

import { FONT_SIZE, RARITY_COLOR, RARITY_COLOR_NUM, RARITY_LABEL, TEXT, UI } from '../config/theme.js';
import { UPGRADE_ICONS } from '../config/upgrades.js';
import { icon, panel, setVisible, text } from './widgets.js';

const DEPTH = 100;
const CARD_W = 320;
const CARD_H = 150;
const GAP_X = 24;
const GAP_Y = 20;
const GRID_TOP = 150;
const ICON_SIZE = 34;

export default class LevelUpMenu {
  // onChoose(index) lo provee la escena: aplica la mejora y cierra el menú.
  constructor(scene, onChoose) {
    this.scene = scene;
    this.onChoose = onChoose;

    this.title = text(scene, 'SUBISTE DE NIVEL', {
      size: FONT_SIZE.subheading, color: TEXT.primary, depth: DEPTH, origin: 0.5,
    }).setVisible(false);

    this.cards = [0, 1, 2, 3].map((i) => {
      const bg = panel(scene, { width: CARD_W, height: CARD_H, depth: DEPTH, border: UI.panelBorder })
        .setVisible(false)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.onChoose(i));
      bg.on('pointerover', () => bg.setStrokeStyle(4, bg.getData('rarityColor') || UI.panelBorder));
      bg.on('pointerout', () => bg.setStrokeStyle(3, bg.getData('rarityColor') || UI.panelBorder));

      const keyText = text(scene, `[${i + 1}]`, { size: '13px', color: TEXT.dim, depth: DEPTH + 1 }).setVisible(false);
      const rarityText = text(scene, '', { size: FONT_SIZE.tiny, color: TEXT.primary, depth: DEPTH + 1, origin: [1, 0] }).setVisible(false);
      const cardIcon = icon(scene, 'icon-swords', { size: ICON_SIZE, color: 0xffffff, depth: DEPTH + 1 }).setVisible(false);
      const label = text(scene, '', {
        size: FONT_SIZE.body, color: TEXT.accent, depth: DEPTH + 1, origin: 0.5,
        align: 'center', wordWrapWidth: CARD_W - 36,
      }).setVisible(false);

      return { bg, keyText, rarityText, cardIcon, label };
    });

    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((keyName, i) => {
      scene.input.keyboard.on(`keydown-${keyName}`, () => this.onChoose(i));
    });
  }

  layout(w) {
    const cx = w / 2;
    this.title.setPosition(cx, 100);

    const gridStartX = cx - (CARD_W * 2 + GAP_X) / 2;
    this.cards.forEach((card, i) => {
      const x = gridStartX + (i % 2) * (CARD_W + GAP_X);
      const y = GRID_TOP + Math.floor(i / 2) * (CARD_H + GAP_Y);
      card.bg.setPosition(x, y);
      card.keyText.setPosition(x + 10, y + 8);
      card.rarityText.setPosition(x + CARD_W - 10, y + 8);
      card.cardIcon.setPosition(x + CARD_W / 2, y + 52);
      card.label.setPosition(x + CARD_W / 2, y + CARD_H - 42);
    });
  }

  // choices: las 4 mejoras sorteadas. stats: las stats actuales, para que cada card
  // pueda mostrar el antes→después sin que la escena arme los textos.
  show(choices, stats) {
    choices.forEach((choice, i) => {
      const after = { ...stats };
      choice.apply(after);

      const rarity = choice.rarity || 'common';
      const card = this.cards[i];
      card.bg.setData('rarityColor', RARITY_COLOR_NUM[rarity]).setStrokeStyle(3, RARITY_COLOR_NUM[rarity]).setVisible(true);
      card.keyText.setVisible(true);
      card.rarityText.setText(RARITY_LABEL[rarity]).setColor(RARITY_COLOR[rarity]).setVisible(true);
      // setTexture puede reajustar el tamaño al de la textura nueva, así que lo re-fijamos.
      card.cardIcon.setTexture(UPGRADE_ICONS[choice.key] || 'icon-swords')
        .setDisplaySize(ICON_SIZE, ICON_SIZE)
        .setTint(RARITY_COLOR_NUM[rarity])
        .setVisible(true);
      card.label.setText(choice.describe(stats, after)).setColor(RARITY_COLOR[rarity]).setVisible(true);
    });
    this.title.setVisible(true);
  }

  hide() {
    this.title.setVisible(false);
    this.cards.forEach((card) => setVisible([card.bg, card.keyText, card.rarityText, card.cardIcon, card.label], false));
  }
}

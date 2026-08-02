// Menú de subida de nivel: en desktop, grilla 2x2 con borde de color segun rareza.
// En mobile (portrait o viewport chico), carrusel 1-card con flechas, dots y
// swipe horizontal. Se elige con clic/tap sobre la card visible o con las teclas 1-4.

import { FONT_SIZE, RARITY_COLOR, RARITY_COLOR_NUM, RARITY_LABEL, TEXT, UI } from '../config/theme.js';
import { UPGRADE_ICONS } from '../config/upgrades.js';
import { edgePadding, getSafeInsets, shouldUseCompactLevelUp } from './layout.js';
import { icon, panel, setVisible, text } from './widgets.js';

const DEPTH = 100;
const CARD_W = 320;
const CARD_H = 150;
const CARD_W_COMPACT = 0; // calculado en layout()
const CARD_H_COMPACT = 78;
const CAROUSEL_H = 170;
const GAP_X = 24;
const GAP_Y = 20;
const GAP_Y_COMPACT = 10;
const GRID_TOP = 150;
const GRID_TOP_COMPACT = 80;
const ICON_SIZE = 34;
const ICON_SIZE_COMPACT = 22;
const ARROW_SIZE = 44;
const SWIPE_THRESHOLD = 60;

export default class LevelUpMenu {
  // onChoose(index) lo provee la escena: aplica la mejora y cierra el menú.
  constructor(scene, onChoose) {
    this.scene = scene;
    this.onChoose = onChoose;
    this.mode = 'grid';
    this.activeIndex = 0;
    this._isOpen = false;
    this._swipeStartX = null;

    this.title = text(scene, 'SUBISTE DE NIVEL', {
      size: FONT_SIZE.subheading, color: TEXT.primary, depth: DEPTH, origin: 0.5,
    }).setVisible(false);

    this.counterText = text(scene, '', {
      size: FONT_SIZE.small, color: TEXT.dim, depth: DEPTH, origin: 0.5,
    }).setVisible(false);

    this.cards = [0, 1, 2, 3].map((i) => {
      const bg = panel(scene, { width: CARD_W, height: CARD_H, depth: DEPTH, border: UI.panelBorder })
        .setVisible(false)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this._handleCardTap(i));
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

    this._buildCarouselChrome();

    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((keyName, i) => {
      scene.input.keyboard.on(`keydown-${keyName}`, () => this._handleKeyboardPick(i));
    });

    scene.input.on('pointerdown', this._onSwipeStart, this);
    scene.input.on('pointermove', this._onSwipeMove, this);
    scene.input.on('pointerup', this._onSwipeEnd, this);
    scene.input.on('pointerupoutside', this._onSwipeEnd, this);

    scene.events.once('shutdown', () => {
      scene.input.off('pointerdown', this._onSwipeStart, this);
      scene.input.off('pointermove', this._onSwipeMove, this);
      scene.input.off('pointerup', this._onSwipeEnd, this);
      scene.input.off('pointerupoutside', this._onSwipeEnd, this);
    });
  }

  _buildCarouselChrome() {
    const scene = this.scene;
    const arrowOpts = { size: ARROW_SIZE, color: 0x66ffcc, depth: DEPTH + 1 };
    this.leftArrow = icon(scene, 'icon-arrow-left', arrowOpts)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.rightArrow = icon(scene, 'icon-arrow-right', arrowOpts)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.leftArrow.on('pointerdown', () => this._step(-1));
    this.rightArrow.on('pointerdown', () => this._step(1));

    this.dots = [0, 1, 2, 3].map(() =>
      scene.add.circle(0, 0, 4, 0xffffff, 0.3)
        .setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false)
    );

    this.chrome = [this.leftArrow, this.rightArrow, ...this.dots, this.counterText];
  }

  _handleCardTap(i) {
    if (this.mode === 'carousel' && i !== this.activeIndex) {
      this.activeIndex = i;
      this._renderCarousel();
      return;
    }
    this.onChoose(i);
  }

  _handleKeyboardPick(i) {
    if (this.mode === 'carousel') {
      this.activeIndex = i;
      this.onChoose(i);
    } else {
      this.onChoose(i);
    }
  }

  _step(delta) {
    this.activeIndex = (this.activeIndex + delta + 4) % 4;
    this._renderCarousel();
  }

  _onSwipeStart(pointer) {
    if (this.mode !== 'carousel' || !this._isOpen) return;
    this._swipeStartX = pointer.x;
  }

  _onSwipeMove() {
    // Solo tracking de fin -> ver _onSwipeEnd.
  }

  _onSwipeEnd(pointer) {
    if (this.mode !== 'carousel' || !this._isOpen || this._swipeStartX === null) return;
    const dx = pointer.x - this._swipeStartX;
    this._swipeStartX = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    this._step(dx < 0 ? 1 : -1);
  }

  layout(w, h) {
    const compact = shouldUseCompactLevelUp(w, h);
    const newMode = compact ? 'carousel' : 'grid';
    if (newMode !== this.mode) {
      this.mode = newMode;
      this.activeIndex = 0;
    }

    const cx = w / 2;
    const topInset = edgePadding('top', 0, getSafeInsets());
    const titleY = topInset + 50;
    this.title.setPosition(cx, titleY);

    if (this.mode === 'carousel') {
      const cardW = w - 24;
      const cardH = Math.min(CAROUSEL_H, Math.max(120, h * 0.22));
      const cardX = cx - cardW / 2;
      const cardY = topInset + 110;
      this.cards.forEach((card) => {
        card.bg.setSize(cardW, cardH).setPosition(cardX, cardY);
      });
      this._positionCardChrome();
      this.counterText.setPosition(cx, cardY - cardH / 2 - 14);

      const arrowY = cardY;
      const arrowPad = Math.max(8, (cardW - ARROW_SIZE) / 2 - 70);
      this.leftArrow.setPosition(cardX + arrowPad, arrowY);
      this.rightArrow.setPosition(cardX + cardW - arrowPad, arrowY);

      const dotSpacing = 16;
      const dotY = cardY + cardH / 2 + 18;
      const dotsStartX = cx - ((this.dots.length - 1) * dotSpacing) / 2;
      this.dots.forEach((dot, i) => dot.setPosition(dotsStartX + i * dotSpacing, dotY));
    } else {
      const gridStartX = cx - (CARD_W * 2 + GAP_X) / 2;
      this.cards.forEach((card, i) => {
        const x = gridStartX + (i % 2) * (CARD_W + GAP_X);
        const y = GRID_TOP + Math.floor(i / 2) * (CARD_H + GAP_Y);
        card.bg.setSize(CARD_W, CARD_H).setPosition(x, y);
      });
      this._positionCardChrome();
    }
  }

  // Posiciona textos/iconos dentro de cada card. Las cards usan origin 0
  // (top-left), asi que los hijos se anclan a las esquinas internas.
  _positionCardChrome() {
    this.cards.forEach((card) => {
      const { bg } = card;
      const x = bg.x;
      const y = bg.y;
      const cardW = bg.width;
      const cardH = bg.height;
      const compact = this.mode === 'carousel';

      card.keyText.setPosition(x + 10, y + 8);
      card.rarityText.setPosition(x + cardW - 10, y + 8);
      if (compact) {
        const iconSize = ICON_SIZE_COMPACT;
        card.cardIcon.setDisplaySize(iconSize, iconSize);
        card.cardIcon.setPosition(x + 28, y + cardH / 2);
        card.label.setOrigin(0, 0.5).setPosition(x + 28 + iconSize + 12, y + cardH / 2);
      } else {
        card.cardIcon.setDisplaySize(ICON_SIZE, ICON_SIZE);
        card.cardIcon.setPosition(x + cardW / 2, y + 52);
        card.label.setOrigin(0.5).setPosition(x + cardW / 2, y + cardH - 42);
      }
    });
  }

  // choices: las 4 mejoras sorteadas. stats: las stats actuales, para que cada card
  // pueda mostrar el antes→después sin que la escena arme los textos.
  show(choices, stats) {
    this._isOpen = true;
    this.activeIndex = 0;
    choices.forEach((choice, i) => {
      const after = { ...stats };
      choice.apply(after);

      const rarity = choice.rarity || 'common';
      const card = this.cards[i];
      card.bg.setData('rarityColor', RARITY_COLOR_NUM[rarity]).setStrokeStyle(3, RARITY_COLOR_NUM[rarity]);
      card.rarityText.setText(RARITY_LABEL[rarity]).setColor(RARITY_COLOR[rarity]);
      card.cardIcon.setTexture(UPGRADE_ICONS[choice.key] || 'icon-swords')
        .setTint(RARITY_COLOR_NUM[rarity]);
      card.label.setText(choice.describe(stats, after)).setColor(RARITY_COLOR[rarity]);
    });

    if (this.mode === 'carousel') {
      this._renderCarousel();
      this.title.setVisible(true);
    } else {
      this._renderGrid();
      this.title.setVisible(true);
    }
  }

  _renderGrid() {
    this.cards.forEach((card) => {
      card.bg.setVisible(true);
      card.keyText.setVisible(true);
      card.rarityText.setVisible(true);
      card.cardIcon.setVisible(true);
      card.label.setVisible(true);
      card.label.setWordWrapWidth(CARD_W - 36);
    });
    this._positionCardChrome();
    setVisible(this.chrome, false);
  }

  _renderCarousel() {
    this.cards.forEach((card, i) => {
      const isActive = i === this.activeIndex;
      setVisible([card.bg, card.keyText, card.rarityText, card.cardIcon, card.label], isActive);
      if (isActive) {
        card.label.setWordWrapWidth(card.bg.width - 80);
      }
    });
    this._positionCardChrome();
    this.counterText.setText(`${this.activeIndex + 1} / 4`).setVisible(true);
    this.leftArrow.setVisible(true);
    this.rightArrow.setVisible(true);
    this.dots.forEach((dot, i) => {
      const active = i === this.activeIndex;
      dot.setFillStyle(0xffffff, active ? 0.95 : 0.3).setVisible(true);
    });
  }

  hide() {
    this._isOpen = false;
    this.title.setVisible(false);
    this.cards.forEach((card) => setVisible([card.bg, card.keyText, card.rarityText, card.cardIcon, card.label], false));
    setVisible(this.chrome, false);
  }
}
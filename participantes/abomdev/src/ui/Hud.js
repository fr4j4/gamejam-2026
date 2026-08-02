// HUD permanente: barras de escudo/vida/XP arriba a la izquierda, tiempo y cuenta
// regresiva del jefe arriba a la derecha, y la barra del jefe abajo al centro.
// Cada dato lleva su icono para que se lea de un vistazo sin depender del color solo.

import Phaser from 'phaser';
import { BAR, FONT_SIZE, TEXT } from '../config/theme.js';
import { edgePadding, getSafeInsets, isCompactMode } from './layout.js';
import { bar, formatTime, icon, text } from './widgets.js';

const DEPTH = 150;
const BAR_W_DESKTOP = 200;
const BOSS_BAR_W_DESKTOP = 300;
const BOSS_BAR_H = 16;

// Las barras arrancan después del icono, que va pegado al borde izquierdo.
const ICON_SIZE = 16;
const ICON_X = 20;
const ICON_X_COMPACT = 12;
// En compact reservamos la esquina superior izquierda para el botón de pausa
// mobile (TouchControls). El HUD arranca a la derecha del botón + un margen.
const PAUSE_RESERVED_W = 90;
const BAR_X = ICON_X + ICON_SIZE + 8;
const TEXT_X = BAR_X + BAR_W_DESKTOP + 8;
const HEADER_PAD = 18;
const HEADER_PAD_COMPACT = 12;

export default class Hud {
  constructor(scene) {
    this.scene = scene;

    this.shieldIcon = icon(scene, 'icon-shield', { size: ICON_SIZE, color: BAR.shield, depth: DEPTH + 1 });
    this.shieldBar = bar(scene, { width: BAR_W_DESKTOP, height: 8, color: BAR.shield, depth: DEPTH });
    this.shieldText = text(scene, '', { size: FONT_SIZE.tiny, color: TEXT.shield, depth: DEPTH + 1 });

    this.hpIcon = icon(scene, 'icon-heart', { size: ICON_SIZE + 2, color: BAR.hp, depth: DEPTH + 1 });
    this.hpBar = bar(scene, { width: BAR_W_DESKTOP, height: 18, color: BAR.hp, depth: DEPTH, inset: 2 });
    this.hpText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.primary, depth: DEPTH + 1 });

    this.xpIcon = icon(scene, 'icon-zap', { size: ICON_SIZE, color: BAR.xp, depth: DEPTH + 1 });
    this.xpBar = bar(scene, { width: BAR_W_DESKTOP, height: 10, color: BAR.xp, depth: DEPTH });

    this.levelText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.primary, depth: DEPTH + 1 });
    this.stageIcon = icon(scene, 'icon-layers', { size: ICON_SIZE - 2, color: 0xaa88ff, depth: DEPTH + 1 });
    this.stageText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.stage, depth: DEPTH + 1 });

    this.timerIcon = icon(scene, 'icon-timer', { size: ICON_SIZE + 2, color: 0xffffff, depth: DEPTH + 1 });
    this.timerText = text(scene, '', { size: '18px', color: TEXT.primary, depth: DEPTH + 1, origin: [1, 0] });

    this.bossCountIcon = icon(scene, 'icon-skull', { size: ICON_SIZE, color: 0xff88cc, depth: DEPTH + 1 });
    this.nextBossText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.boss, depth: DEPTH + 1, origin: [1, 0] });

    this.bossBarMaxWidth = BOSS_BAR_W_DESKTOP - 4;
    this.bossLabel = text(scene, 'JEFE', { size: FONT_SIZE.small, color: TEXT.boss, depth: DEPTH + 1, origin: 0.5 })
      .setVisible(false);
    this.bossBar = bar(scene, { width: BOSS_BAR_W_DESKTOP, height: BOSS_BAR_H, color: BAR.boss, depth: DEPTH, inset: 2 });
    this.bossBar.track.setVisible(false);
    this.bossBar.fill.setVisible(false);
  }

  layout(w, h) {
    const compact = isCompactMode();
    const insets = getSafeInsets();
    const leftInset = edgePadding('left', 0, insets);
    const topInset = edgePadding('top', 0, insets);
    const rightInset = edgePadding('right', 0, insets);

    // En compact, el bloque izquierdo arranca a la derecha del botón de pausa
    // (TouchControls reserva la esquina superior izquierda). En desktop no hay
    // botón de pausa mobile, asi que arrancamos pegado al borde.
    const leftReserved = compact ? Math.max(PAUSE_RESERVED_W, leftInset + 60) : ICON_X + leftInset;

    // Ancho de barras: en compact, la barra ocupa una fraccion del ancho total
    // (no mas del 40% del viewport) para que el bloque derecho tenga lugar.
    const barW = compact ? Math.min(BAR_W_DESKTOP, w * 0.4) : BAR_W_DESKTOP;
    const iconX = (compact ? ICON_X_COMPACT : ICON_X) + leftInset;
    // En compact usamos la reserva maxima para que el bloque izquierdo no se
    // superponga con el boton de pausa.
    const effectiveIconX = compact ? Math.max(iconX, leftReserved) : iconX;
    const barX = effectiveIconX + ICON_SIZE + 8;
    const textX = barX + barW + 8;
    const headerPad = (compact ? HEADER_PAD_COMPACT : HEADER_PAD) + topInset;

    this.shieldBar.track.width = barW;
    this.shieldBar.fill.width = barW - 2;
    this.shieldBar.maxWidth = barW - 2;
    this.hpBar.track.width = barW;
    this.hpBar.fill.width = barW - 4;
    this.hpBar.maxWidth = barW - 4;
    this.xpBar.track.width = barW;
    this.xpBar.fill.width = barW - 2;
    this.xpBar.maxWidth = barW - 2;

    this.shieldIcon.setPosition(effectiveIconX + ICON_SIZE / 2, headerPad + 6);
    this.shieldBar.track.setPosition(barX, headerPad + 2);
    this.shieldBar.fill.setPosition(barX + 1, headerPad + 3);
    this.shieldText.setPosition(textX, headerPad);

    this.hpIcon.setPosition(effectiveIconX + ICON_SIZE / 2, headerPad + 23);
    this.hpBar.track.setPosition(barX, headerPad + 14);
    this.hpBar.fill.setPosition(barX + 2, headerPad + 16);
    this.hpText.setPosition(textX, headerPad + 14);

    this.xpIcon.setPosition(effectiveIconX + ICON_SIZE / 2, headerPad + 41);
    this.xpBar.track.setPosition(barX, headerPad + 36);
    this.xpBar.fill.setPosition(barX + 1, headerPad + 37);

    if (compact) {
      // En compact, nivel y etapa van inline al lado de la barra de XP para
      // no desperdiciar 2 filas mas (la pantalla ya esta apretada).
      this.levelText.setPosition(barX, headerPad + 50);
      this.stageIcon.setPosition(barX + 78, headerPad + 57);
      this.stageText.setPosition(barX + 92, headerPad + 50);
    } else {
      this.levelText.setPosition(barX, headerPad + 50);
      this.stageIcon.setPosition(barX + 92, headerPad + 57);
      this.stageText.setPosition(barX + 104, headerPad + 50);
    }

    const timerX = w - 20 - rightInset;
    this.timerText.setPosition(timerX, headerPad);
    // El ícono se coloca a la izquierda del texto real para no superponerse,
    // midiendo desde el borde derecho del timerText.
    this.timerIcon.setPosition(this.timerText.x - this.timerText.width - 8, headerPad + 9);
    this.nextBossText.setPosition(timerX, headerPad + 24);
    this.positionBossCountIcon();

    // Boss bar: en compact ocupa 70% del ancho centrado, en desktop 300px.
    // Se sube para no chocar con el minimap (que vive a h - 20 - SIZE).
    const bossBarW = compact ? Math.min(w * 0.7, BOSS_BAR_W_DESKTOP) : BOSS_BAR_W_DESKTOP;
    this.bossBarMaxWidth = bossBarW - 4;
    this.bossBar.track.width = bossBarW;
    const barY = compact ? h - 28 : h - 48;
    const bossBarX = w / 2 - bossBarW / 2;
    this.bossBar.track.setPosition(bossBarX, barY);
    this.bossBar.fill.setPosition(bossBarX + 2, barY + 2);
    this.bossLabel.setPosition(w / 2, barY - 18);
  }

  update({ stats, xp, xpToNext, level, stage, elapsed }) {
    const hpRatio = Phaser.Math.Clamp(stats.hp / stats.maxHp, 0, 1);
    this.hpBar.fill.width = this.hpBar.maxWidth * hpRatio;
    this.hpText.setText(`${Math.ceil(stats.hp)}/${Math.round(stats.maxHp)}`);

    const shieldRatio = stats.shieldMax > 0 ? Phaser.Math.Clamp(stats.shield / stats.shieldMax, 0, 1) : 0;
    this.shieldBar.fill.width = this.shieldBar.maxWidth * shieldRatio;
    this.shieldText.setText(`${Math.ceil(stats.shield)}/${Math.round(stats.shieldMax)}`);

    const xpRatio = Phaser.Math.Clamp(xp / xpToNext, 0, 1);
    this.xpBar.fill.width = this.xpBar.maxWidth * xpRatio;
    this.levelText.setText(`Nivel ${level}`);
    this.stageText.setText(`Etapa ${stage}`);

    this.timerText.setText(formatTime(elapsed));
  }

  // El texto está anclado a la derecha y su ancho cambia, así que el icono se
  // recoloca a partir del borde izquierdo real del texto.
  positionBossCountIcon() {
    const topInset = edgePadding('top', 0, getSafeInsets());
    const y = topInset + HEADER_PAD + 24;
    this.bossCountIcon.setPosition(this.nextBossText.x - this.nextBossText.width - 12, y + 8);
  }

  // ms restantes hasta el próximo jefe, o null si ya hay uno en curso.
  setNextBossCountdown(ms) {
    const visible = ms !== null;
    this.nextBossText.setVisible(visible);
    this.bossCountIcon.setVisible(visible);
    if (!visible) return;
    this.nextBossText.setText(`Próximo jefe: ${formatTime(ms)}`);
    this.positionBossCountIcon();
  }

  showBossBar() {
    this.bossLabel.setVisible(true);
    this.bossBar.track.setVisible(true);
    this.bossBar.fill.setVisible(true);
  }

  hideBossBar() {
    this.bossLabel.setText('JEFE').setVisible(false);
    this.bossBar.track.setVisible(false);
    this.bossBar.fill.setVisible(false);
  }

  // Tiempo que le queda al jugador antes de que suba la presión de dificultad.
  setBossFightCountdown(ms) {
    this.bossLabel.setText(`JEFE - ${formatTime(ms)}`);
  }

  setBossHealthRatio(ratio) {
    this.bossBar.fill.width = this.bossBarMaxWidth * ratio;
  }
}

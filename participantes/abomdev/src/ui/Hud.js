// HUD permanente: barras de escudo/vida/XP arriba a la izquierda, tiempo y cuenta
// regresiva del jefe arriba a la derecha, y la barra del jefe abajo al centro.
// Cada dato lleva su icono para que se lea de un vistazo sin depender del color solo.

import Phaser from 'phaser';
import { BAR, FONT_SIZE, TEXT } from '../config/theme.js';
import { bar, formatTime, icon, text } from './widgets.js';

const DEPTH = 150;
const BAR_W = 200;
const BOSS_BAR_W = 300;
const BOSS_BAR_H = 16;

// Las barras arrancan después del icono, que va pegado al borde izquierdo.
const ICON_SIZE = 16;
const ICON_X = 20;
const BAR_X = ICON_X + ICON_SIZE + 8;
const TEXT_X = BAR_X + BAR_W + 8;

export default class Hud {
  constructor(scene) {
    this.scene = scene;

    this.shieldIcon = icon(scene, 'icon-shield', { size: ICON_SIZE, color: BAR.shield, depth: DEPTH + 1 });
    this.shieldBar = bar(scene, { width: BAR_W, height: 8, color: BAR.shield, depth: DEPTH });
    this.shieldText = text(scene, '', { size: FONT_SIZE.tiny, color: TEXT.shield, depth: DEPTH + 1 });

    this.hpIcon = icon(scene, 'icon-heart', { size: ICON_SIZE + 2, color: BAR.hp, depth: DEPTH + 1 });
    this.hpBar = bar(scene, { width: BAR_W, height: 18, color: BAR.hp, depth: DEPTH, inset: 2 });
    this.hpText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.primary, depth: DEPTH + 1 });

    this.xpIcon = icon(scene, 'icon-zap', { size: ICON_SIZE, color: BAR.xp, depth: DEPTH + 1 });
    this.xpBar = bar(scene, { width: BAR_W, height: 10, color: BAR.xp, depth: DEPTH });

    this.levelText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.primary, depth: DEPTH + 1 });
    this.stageIcon = icon(scene, 'icon-layers', { size: ICON_SIZE - 2, color: 0xaa88ff, depth: DEPTH + 1 });
    this.stageText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.stage, depth: DEPTH + 1 });

    this.timerIcon = icon(scene, 'icon-timer', { size: ICON_SIZE + 2, color: 0xffffff, depth: DEPTH + 1 });
    this.timerText = text(scene, '', { size: '18px', color: TEXT.primary, depth: DEPTH + 1, origin: [1, 0] });

    this.bossCountIcon = icon(scene, 'icon-skull', { size: ICON_SIZE, color: 0xff88cc, depth: DEPTH + 1 });
    this.nextBossText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.boss, depth: DEPTH + 1, origin: [1, 0] });

    this.bossBarMaxWidth = BOSS_BAR_W - 4;
    this.bossLabel = text(scene, 'JEFE', { size: FONT_SIZE.small, color: TEXT.boss, depth: DEPTH + 1, origin: 0.5 })
      .setVisible(false);
    this.bossBar = bar(scene, { width: BOSS_BAR_W, height: BOSS_BAR_H, color: BAR.boss, depth: DEPTH, inset: 2 });
    this.bossBar.track.setVisible(false);
    this.bossBar.fill.setVisible(false);
  }

  layout(w, h) {
    this.shieldIcon.setPosition(ICON_X + ICON_SIZE / 2, 24);
    this.shieldBar.track.setPosition(BAR_X, 20);
    this.shieldBar.fill.setPosition(BAR_X + 1, 21);
    this.shieldText.setPosition(TEXT_X, 18);

    this.hpIcon.setPosition(ICON_X + ICON_SIZE / 2, 41);
    this.hpBar.track.setPosition(BAR_X, 32);
    this.hpBar.fill.setPosition(BAR_X + 2, 34);
    this.hpText.setPosition(TEXT_X, 32);

    this.xpIcon.setPosition(ICON_X + ICON_SIZE / 2, 59);
    this.xpBar.track.setPosition(BAR_X, 54);
    this.xpBar.fill.setPosition(BAR_X + 1, 55);

    this.levelText.setPosition(BAR_X, 68);
    this.stageIcon.setPosition(BAR_X + 92, 75);
    this.stageText.setPosition(BAR_X + 104, 68);

    this.timerIcon.setPosition(w - 96, 29);
    this.timerText.setPosition(w - 20, 20);
    this.nextBossText.setPosition(w - 20, 44);
    this.positionBossCountIcon();

    const barY = h - 48;
    const bossBarX = w / 2 - BOSS_BAR_W / 2;
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
    this.bossCountIcon.setPosition(this.nextBossText.x - this.nextBossText.width - 12, 52);
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

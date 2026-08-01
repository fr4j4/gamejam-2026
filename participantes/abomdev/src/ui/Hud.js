// HUD permanente: barras de escudo/vida/XP arriba a la izquierda, tiempo y cuenta
// regresiva del jefe arriba a la derecha, y la barra del jefe abajo al centro.

import Phaser from 'phaser';
import { BAR, FONT_SIZE, TEXT } from '../config/theme.js';
import { bar, formatTime, text } from './widgets.js';

const DEPTH = 150;
const BAR_W = 200;
const BOSS_BAR_W = 300;
const BOSS_BAR_H = 16;

export default class Hud {
  constructor(scene) {
    this.scene = scene;

    this.shieldBar = bar(scene, { width: BAR_W, height: 8, color: BAR.shield, depth: DEPTH });
    this.shieldText = text(scene, '', { size: FONT_SIZE.tiny, color: TEXT.shield, depth: DEPTH + 1 });

    this.hpBar = bar(scene, { width: BAR_W, height: 18, color: BAR.hp, depth: DEPTH, inset: 2 });
    this.hpText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.primary, depth: DEPTH + 1 });

    this.xpBar = bar(scene, { width: BAR_W, height: 10, color: BAR.xp, depth: DEPTH });

    this.levelText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.primary, depth: DEPTH + 1 });
    this.timerText = text(scene, '', { size: '18px', color: TEXT.primary, depth: DEPTH + 1, origin: [1, 0] });
    this.nextBossText = text(scene, '', { size: FONT_SIZE.small, color: TEXT.boss, depth: DEPTH + 1, origin: [1, 0] });

    this.bossBarMaxWidth = BOSS_BAR_W - 4;
    this.bossLabel = text(scene, 'JEFE', { size: FONT_SIZE.small, color: TEXT.boss, depth: DEPTH + 1, origin: 0.5 })
      .setVisible(false);
    this.bossBar = bar(scene, { width: BOSS_BAR_W, height: BOSS_BAR_H, color: BAR.boss, depth: DEPTH, inset: 2 });
    this.bossBar.track.setVisible(false);
    this.bossBar.fill.setVisible(false);
  }

  layout(w, h) {
    this.shieldBar.track.setPosition(20, 20);
    this.shieldBar.fill.setPosition(21, 21);
    this.shieldText.setPosition(226, 18);

    this.hpBar.track.setPosition(20, 32);
    this.hpBar.fill.setPosition(22, 34);
    this.hpText.setPosition(226, 32);

    this.xpBar.track.setPosition(20, 54);
    this.xpBar.fill.setPosition(21, 55);

    this.levelText.setPosition(20, 68);
    this.timerText.setPosition(w - 20, 20);
    this.nextBossText.setPosition(w - 20, 44);

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
    this.levelText.setText(`Nivel ${level}   Etapa ${stage}`);

    this.timerText.setText(formatTime(elapsed));
  }

  // ms restantes hasta el próximo jefe, o null si ya hay uno en curso.
  setNextBossCountdown(ms) {
    if (ms === null) {
      this.nextBossText.setVisible(false);
      return;
    }
    this.nextBossText.setText(`Próximo jefe: ${formatTime(ms)}`).setVisible(true);
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

// Menú principal. Es una escena propia (no un panel dentro del juego) para que
// "Salir al menú" desde la pausa sea simplemente volver acá con el estado limpio.

import Phaser from 'phaser';

import { FONT_SIZE, TEXT } from '../config/theme.js';
import { getBestTime } from '../ui/EndScreen.js';
import SettingsPanel from '../ui/SettingsPanel.js';
import { button, formatTime, panel, setVisible, text } from '../ui/widgets.js';
import { unlockAudio } from '../audio/synth.js';

const DEPTH = 10;
const PANEL_W = 520;
const PANEL_H = 380;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    this.cameras.main.setBackgroundColor('#111122');

    // Fondo con la misma grilla que el juego, para que el menú no se sienta ajeno.
    this.add.grid(0, 0, 4000, 4000, 64, 64, 0x1a1a2e, 1, 0x2a2a4e, 1).setDepth(-1);

    this.panel = panel(this, { width: PANEL_W, height: PANEL_H, depth: DEPTH, border: 0x66ffcc, origin: 0.5 });
    this.title = text(this, 'BUGSURVIVOR', { size: '46px', color: TEXT.accent, depth: DEPTH + 1, origin: 0.5 });
    this.subtitle = text(this, 'Sobrevive, sube de nivel y cruza los portales', {
      size: FONT_SIZE.small, color: TEXT.secondary, depth: DEPTH + 1, origin: 0.5,
    });

    const bestTime = getBestTime();
    this.bestText = text(this, bestTime > 0 ? `Mejor tiempo: ${formatTime(bestTime)}` : '', {
      size: FONT_SIZE.small, color: TEXT.gold, depth: DEPTH + 1, origin: 0.5,
    });

    this.playButton = button(this, {
      label: 'JUGAR', width: 220, height: 52, depth: DEPTH + 1,
      onClick: () => this.startGame(),
    });
    this.settingsButton = button(this, {
      label: 'CONFIGURACIÓN', width: 220, height: 44, depth: DEPTH + 1, color: TEXT.info,
      onClick: () => this.openSettings(),
    });

    this.hint = text(this, 'WASD / Flechas para moverte · ESC: pausa · F: pantalla completa', {
      size: FONT_SIZE.tiny, color: TEXT.muted, depth: DEPTH + 1, origin: 0.5,
    });

    this.mainParts = [
      this.panel, this.title, this.subtitle, this.bestText, this.hint,
      ...this.playButton.parts, ...this.settingsButton.parts,
    ];

    this.settingsPanel = new SettingsPanel(this, () => setVisible(this.mainParts, true));

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    // Cualquier interacción sirve para desbloquear el audio: el navegador lo mantiene
    // bloqueado hasta que el usuario toca algo, y este menú es lo primero que ve.
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard.once('keydown', unlockAudio);
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());
  }

  layout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    this.cameras.main.centerOn(0, 0);

    this.panel.setPosition(cx, cy);
    this.title.setPosition(cx, cy - PANEL_H / 2 + 62);
    this.subtitle.setPosition(cx, cy - PANEL_H / 2 + 104);
    this.bestText.setPosition(cx, cy - PANEL_H / 2 + 134);
    this.playButton.setPosition(cx, cy + 10);
    this.settingsButton.setPosition(cx, cy + 76);
    this.hint.setPosition(cx, cy + PANEL_H / 2 - 28);

    this.settingsPanel.layout(w, h);
  }

  openSettings() {
    setVisible(this.mainParts, false);
    this.settingsPanel.show();
  }

  startGame() {
    if (this.settingsPanel.isOpen) return;
    unlockAudio();
    this.scene.start('game');
  }
}

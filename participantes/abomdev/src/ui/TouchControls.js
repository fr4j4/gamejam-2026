// Overlay táctil para mobile: joystick virtual (estilo hot zone, aparece al
// tocar la mitad izquierda) y botón de pausa dedicado en la esquina superior
// derecha. El ataque es automático y no necesita botón. En portrait el overlay
// entero se oculta — el juego está pensado para landscape.
//
// Estilo: la base es un Graphics con anillos concéntricos (no un rectángulo)
// y el thumb es un Arc con un highlight blanco para dar volumen sin gradiente.
// Botón pausa con el mismo accent cyan que el joystick para matchear el theme.

import Phaser from 'phaser';
import { icon, panel } from './widgets.js';

const DEPTH = 140;
const BASE_R = 60;
const THUMB_R = 24;
const HIGHLIGHT_R = 7;
const HIGHLIGHT_OFFSET = 7;
const PAUSE_R = 28;
const PAUSE_X_OFFSET = 50;
const PAUSE_Y = 50;
const ACCENT = 0x66ffcc;

export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.pointerId = null;
    this.inputVector = new Phaser.Math.Vector2(0, 0);

    this.hotZone = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(DEPTH)
      .setInteractive();

    this.joystickBase = scene.add.graphics()
      .setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false);
    this._drawBase();

    this.joystickThumb = scene.add.circle(0, 0, THUMB_R, ACCENT, 0.35)
      .setScrollFactor(0).setDepth(DEPTH + 2).setStrokeStyle(2, ACCENT, 0.95).setVisible(false);

    this.thumbHighlight = scene.add.circle(-HIGHLIGHT_OFFSET, -HIGHLIGHT_OFFSET, HIGHLIGHT_R, 0xffffff, 0.25)
      .setScrollFactor(0).setDepth(DEPTH + 3).setVisible(false);

    this.pauseButton = panel(scene, {
      width: PAUSE_R * 2, height: PAUSE_R * 2,
      depth: DEPTH + 1, border: ACCENT, origin: 0.5, alpha: 0.85,
    }).setVisible(false).setInteractive({ useHandCursor: true });

    this.pauseIcon = icon(scene, 'icon-pause', { size: 20, color: 0xffffff, depth: DEPTH + 2 })
      .setVisible(false);

    this.parts = [this.hotZone, this.pauseButton, this.pauseIcon];

    this.hotZone.on('pointerdown', (p) => this._showJoystick(p));
    this.pauseButton.on('pointerdown', () => scene.togglePause());

    scene.input.on('pointermove', this._onPointerMove, this);
    scene.input.on('pointerup', this._onPointerUp, this);
    scene.input.on('pointerupoutside', this._onPointerUp, this);

    scene.events.once('shutdown', () => {
      scene.input.off('pointermove', this._onPointerMove, this);
      scene.input.off('pointerup', this._onPointerUp, this);
      scene.input.off('pointerupoutside', this._onPointerUp, this);
    });
  }

  _drawBase() {
    const g = this.joystickBase;
    g.clear();
    g.lineStyle(2, ACCENT, 0.55);
    g.strokeCircle(0, 0, BASE_R);
    g.lineStyle(1, ACCENT, 0.25);
    g.strokeCircle(0, 0, BASE_R * 0.55);
    g.fillStyle(ACCENT, 0.5);
    g.fillCircle(0, 0, 4);
  }

  layout(w, h) {
    this.hotZone.setPosition(0, h / 3);
    this.hotZone.setSize(w / 2, (2 * h) / 3);
    this.pauseButton.setPosition(w - PAUSE_X_OFFSET, PAUSE_Y);
    this.pauseIcon.setPosition(w - PAUSE_X_OFFSET, PAUSE_Y);
  }

  setVisible(v) {
    this.parts.forEach((p) => p.setVisible(v));
    if (!v) this._hideJoystick();
    else {
      const active = this.pointerId !== null;
      this.joystickBase.setVisible(active);
      this.joystickThumb.setVisible(active);
      this.thumbHighlight.setVisible(active);
    }
  }

  // Devuelve la referencia al vector unitario interno. NO mutar — el caller
  // debe copiar los componentes y trabajar sobre un vector propio.
  getVector() {
    return this.inputVector.lengthSq() > 0 ? this.inputVector : null;
  }

  _showJoystick(pointer) {
    if (this.pointerId !== null) return;
    this.pointerId = pointer.id;
    this.joystickBase.setPosition(pointer.x, pointer.y).setVisible(true);
    this.joystickThumb.setPosition(pointer.x, pointer.y).setVisible(true);
    this.thumbHighlight.setPosition(pointer.x - HIGHLIGHT_OFFSET, pointer.y - HIGHLIGHT_OFFSET).setVisible(true);
  }

  _onPointerMove(pointer) {
    if (pointer.id !== this.pointerId) return;
    const dx = pointer.x - this.joystickBase.x;
    const dy = pointer.y - this.joystickBase.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, BASE_R);
    const angle = Math.atan2(dy, dx);
    const thumbX = this.joystickBase.x + Math.cos(angle) * clampedDist;
    const thumbY = this.joystickBase.y + Math.sin(angle) * clampedDist;
    this.joystickThumb.setPosition(thumbX, thumbY);
    this.thumbHighlight.setPosition(thumbX - HIGHLIGHT_OFFSET, thumbY - HIGHLIGHT_OFFSET);
    this.inputVector.set(dist > 0 ? dx / dist : 0, dist > 0 ? dy / dist : 0);
  }

  _onPointerUp(pointer) {
    if (pointer.id !== this.pointerId) return;
    this._hideJoystick();
  }

  _hideJoystick() {
    this.pointerId = null;
    this.inputVector.set(0, 0);
    this.joystickBase.setVisible(false);
    this.joystickThumb.setVisible(false);
    this.thumbHighlight.setVisible(false);
  }
}

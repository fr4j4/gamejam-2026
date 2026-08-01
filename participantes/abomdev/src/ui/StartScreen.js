// Panel de inicio. Vive solo hasta la primera tecla/clic: al empezar la partida
// se destruye entero en vez de ocultarse, porque no vuelve a mostrarse.

import { FONT_SIZE, TEXT } from '../config/theme.js';
import { formatTime, panel, text } from './widgets.js';

const DEPTH = 300;
const PANEL_W = 480;
const PANEL_H = 280;

export default class StartScreen {
  constructor(scene, bestTime) {
    this.scene = scene;
    this.panelH = PANEL_H;

    this.bg = panel(scene, { width: PANEL_W, height: PANEL_H, depth: DEPTH, border: 0x66ffcc, origin: 0.5 });

    this.title = text(scene, 'SURVIVORS', {
      size: FONT_SIZE.title, color: TEXT.accent, depth: DEPTH + 1, origin: 0.5,
    });

    const bestLine = bestTime > 0 ? `\n\nMejor tiempo: ${formatTime(bestTime)}` : '';
    this.body = text(scene,
      `WASD / Flechas para moverte\nAtaque automático al enemigo más cercano\nF: pantalla completa · ESC: pausa · M: silenciar${bestLine}`,
      { size: FONT_SIZE.label, color: TEXT.secondary, depth: DEPTH + 1, origin: 0.5, align: 'center', lineSpacing: 6 });

    this.prompt = text(scene, 'Presiona una tecla para empezar', {
      size: FONT_SIZE.label, color: TEXT.gold, depth: DEPTH + 1, origin: 0.5,
    });
    scene.tweens.add({ targets: this.prompt, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
  }

  layout(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    this.bg.setPosition(cx, cy);
    this.title.setPosition(cx, cy - this.panelH / 2 + 44);
    this.body.setPosition(cx, cy - 6);
    this.prompt.setPosition(cx, cy + this.panelH / 2 - 30);
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.prompt);
    [this.bg, this.title, this.body, this.prompt].forEach((o) => o.destroy());
  }
}

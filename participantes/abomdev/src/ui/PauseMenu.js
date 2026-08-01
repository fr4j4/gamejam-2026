// Menú de pausa: overlay que atenúa el juego, título centrado arriba y el panel de
// estadísticas anclado a la derecha (centrado era ilegible con muchas stats).

import { FONT_SIZE, TEXT, UI } from '../config/theme.js';
import { divider, panel, setVisible, text } from './widgets.js';

const DEPTH_OVERLAY = 290;
const DEPTH = 300;
const BOX_W = 340;
const BOX_H = 440;
const TITLE_BOX_W = 260;
const TITLE_BOX_H = 60;
const PADDING = 16;

export default class PauseMenu {
  constructor(scene) {
    this.scene = scene;

    this.overlay = scene.add.rectangle(0, 0, 10, 10, UI.overlay, UI.overlayAlpha)
      .setOrigin(0).setScrollFactor(0).setDepth(DEPTH_OVERLAY).setVisible(false);

    this.titleBox = panel(scene, { width: TITLE_BOX_W, height: TITLE_BOX_H, depth: DEPTH, border: 0x66ffcc, origin: 0.5, alpha: 0.95 })
      .setVisible(false);
    this.title = text(scene, 'PAUSADO', { size: FONT_SIZE.heading, color: TEXT.primary, depth: DEPTH + 1, origin: 0.5 })
      .setVisible(false);

    this.box = panel(scene, { width: BOX_W, height: BOX_H, depth: DEPTH, border: 0x66aaff }).setVisible(false);
    this.boxTitle = text(scene, 'ESTADÍSTICAS', { size: '17px', color: TEXT.info, depth: DEPTH + 1 }).setVisible(false);
    this.boxDivider = divider(scene, { width: BOX_W - PADDING * 2, depth: DEPTH + 1 }).setVisible(false);
    this.stats = text(scene, '', { size: FONT_SIZE.label, color: TEXT.secondary, depth: DEPTH + 1, lineSpacing: 11 })
      .setVisible(false);

    this.hint = text(scene, 'Presiona ESC para continuar', { size: FONT_SIZE.small, color: TEXT.muted, depth: DEPTH, origin: 0.5 })
      .setVisible(false);

    this.parts = [this.overlay, this.titleBox, this.title, this.box, this.boxTitle, this.boxDivider, this.stats, this.hint];
  }

  layout(w, h) {
    const cx = w / 2;
    this.overlay.width = w;
    this.overlay.height = h;

    this.titleBox.setPosition(cx, 55);
    this.title.setPosition(cx, 55);

    const boxX = w - BOX_W - 40;
    const boxY = 130;
    this.box.setPosition(boxX, boxY);
    this.boxTitle.setPosition(boxX + PADDING, boxY + PADDING);
    this.boxDivider.setPosition(boxX + PADDING, boxY + 42);
    this.stats.setPosition(boxX + PADDING, boxY + 54);
    this.hint.setPosition(cx, h - 40);
  }

  show(lines) {
    this.stats.setText(lines.join('\n'));
    setVisible(this.parts, true);
  }

  hide() {
    setVisible(this.parts, false);
  }
}

// Arma las líneas de estadísticas a mostrar. Las que arrancan en cero (o dependen de
// un arma no desbloqueada) se omiten para no llenar el panel de ruido.
export function buildStatLines(stats, stage, stageMultiplier) {
  const s = stats;
  const lines = [
    `Daño: ${Math.round(s.damage)}`,
    `Cadencia: ${(1000 / s.fireRate).toFixed(1)}/s`,
    `Velocidad: ${Math.round(s.moveSpeed)}`,
    `HP máximo: ${Math.round(s.maxHp)}`,
    `Radio de imán: ${Math.round(s.magnetRadius)}`,
    `Etapa: ${stage} (x${stageMultiplier.toFixed(2)})`,
  ];
  if (s.hpRegen > 0) lines.push(`Regeneración: ${s.hpRegen.toFixed(1)}/s`);
  if (s.lifesteal > 0) lines.push(`Robo de vida: ${(s.lifesteal * 100).toFixed(0)}%`);
  if (s.dodge > 0) lines.push(`Esquivar: ${(s.dodge * 100).toFixed(0)}%`);
  if (s.shieldMax > 0) lines.push(`Escudo: ${Math.ceil(s.shield)}/${Math.round(s.shieldMax)}`);
  if (s.hasAura) lines.push(`Aura — daño ${Math.round(s.auraDamage)}, radio ${Math.round(s.auraRadius)}`);
  if (s.hasOrbit) lines.push(`Orbe — daño ${Math.round(s.orbitDamage)}, cantidad ${s.orbitCount}, velocidad ${s.orbitSpeed.toFixed(2)}`);
  if (s.hasPierce) lines.push(`Perforante — daño ${Math.round(s.pierceDamage)}, cadencia ${(1000 / s.pierceRate).toFixed(1)}/s`);
  if (s.hasBurst) lines.push(`Ráfaga — daño ${Math.round(s.burstDamage)}, disparos ${s.burstCount}, cadencia ${(1000 / s.burstRate).toFixed(1)}/s`);
  if (s.hasNova) lines.push(`Onda — daño ${Math.round(s.novaDamage)}, radio ${Math.round(s.novaRadius)}`);
  return lines;
}

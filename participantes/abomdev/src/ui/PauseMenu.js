// Menú de pausa: overlay que atenúa el juego, título centrado arriba y el panel de
// estadísticas anclado a la derecha (centrado era ilegible con muchas stats).
// Cada stat lleva su icono, con el mismo mapeo que usan las cards de level-up.

import { FONT_SIZE, TEXT, UI } from '../config/theme.js';
import { divider, icon, panel, setVisible, text } from './widgets.js';

const DEPTH_OVERLAY = 290;
const DEPTH = 300;
const BOX_W = 360;
const BOX_H = 470;
const TITLE_BOX_W = 260;
const TITLE_BOX_H = 60;
const PADDING = 16;
const ROW_H = 26;
const ROW_ICON = 17;
const MAX_ROWS = 15;

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

    // Filas reutilizables: se crean una vez y se rellenan al pausar, así no
    // generamos y destruimos objetos cada vez que se abre el menú.
    this.rows = Array.from({ length: MAX_ROWS }, () => ({
      icon: icon(scene, 'icon-swords', { size: ROW_ICON, color: 0xffffff, depth: DEPTH + 1 }).setVisible(false),
      label: text(scene, '', { size: FONT_SIZE.small, color: TEXT.secondary, depth: DEPTH + 1 }).setVisible(false),
    }));

    this.hint = text(scene, 'Presiona ESC para continuar', { size: FONT_SIZE.small, color: TEXT.muted, depth: DEPTH, origin: 0.5 })
      .setVisible(false);

    this.chrome = [this.overlay, this.titleBox, this.title, this.box, this.boxTitle, this.boxDivider, this.hint];
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

    const firstRowY = boxY + 56;
    this.rows.forEach((row, i) => {
      const y = firstRowY + i * ROW_H;
      row.icon.setPosition(boxX + PADDING + ROW_ICON / 2, y + 8);
      row.label.setPosition(boxX + PADDING + ROW_ICON + 10, y);
    });

    this.hint.setPosition(cx, h - 40);
  }

  // stats: lista de { icon, label, color } que arma buildStatRows().
  show(stats) {
    this.rows.forEach((row, i) => {
      const data = stats[i];
      if (!data) {
        setVisible([row.icon, row.label], false);
        return;
      }
      row.icon.setTexture(data.icon).setDisplaySize(ROW_ICON, ROW_ICON).setTint(data.color).setVisible(true);
      row.label.setText(data.label).setVisible(true);
    });
    setVisible(this.chrome, true);
  }

  hide() {
    setVisible(this.chrome, false);
    this.rows.forEach((row) => setVisible([row.icon, row.label], false));
  }
}

// Arma las filas de estadísticas a mostrar. Las que arrancan en cero (o dependen de
// un arma no desbloqueada) se omiten para no llenar el panel de ruido.
export function buildStatRows(stats, stage, stageMultiplier) {
  const s = stats;
  const rows = [
    { icon: 'icon-swords', color: 0xff8866, label: `Daño: ${Math.round(s.damage)}` },
    { icon: 'icon-gauge', color: 0xffcc44, label: `Cadencia: ${(1000 / s.fireRate).toFixed(1)}/s` },
    { icon: 'icon-footprints', color: 0x66ffcc, label: `Velocidad: ${Math.round(s.moveSpeed)}` },
    { icon: 'icon-heart', color: 0xff5566, label: `HP máximo: ${Math.round(s.maxHp)}` },
    { icon: 'icon-magnet', color: 0xaa88ff, label: `Radio de imán: ${Math.round(s.magnetRadius)}` },
    { icon: 'icon-layers', color: 0xaa88ff, label: `Etapa ${stage} (x${stageMultiplier.toFixed(2)})` },
  ];

  if (s.hpRegen > 0) rows.push({ icon: 'icon-heart-pulse', color: 0xff88aa, label: `Regeneración: ${s.hpRegen.toFixed(1)}/s` });
  if (s.lifesteal > 0) rows.push({ icon: 'icon-droplet', color: 0xff5566, label: `Robo de vida: ${(s.lifesteal * 100).toFixed(0)}%` });
  if (s.dodge > 0) rows.push({ icon: 'icon-wind', color: 0x88ddff, label: `Esquivar: ${(s.dodge * 100).toFixed(0)}%` });
  if (s.shieldMax > 0) rows.push({ icon: 'icon-shield', color: 0x66ddff, label: `Escudo: ${Math.ceil(s.shield)}/${Math.round(s.shieldMax)}` });

  if (s.hasAura) rows.push({ icon: 'icon-circle-dot', color: 0x66ffcc, label: `Aura: ${Math.round(s.auraDamage)} dmg, r${Math.round(s.auraRadius)}` });
  if (s.hasOrbit) rows.push({ icon: 'icon-orbit', color: 0x55ddff, label: `Orbe: ${Math.round(s.orbitDamage)} dmg, x${s.orbitCount}` });
  if (s.hasPierce) rows.push({ icon: 'icon-crosshair', color: 0x66ddff, label: `Perforante: ${Math.round(s.pierceDamage)} dmg, ${(1000 / s.pierceRate).toFixed(1)}/s` });
  if (s.hasBurst) rows.push({ icon: 'icon-swords', color: 0xffee66, label: `Ráfaga: ${Math.round(s.burstDamage)} dmg, x${s.burstCount}` });
  if (s.hasNova) rows.push({ icon: 'icon-waves', color: 0xffaa00, label: `Onda: ${Math.round(s.novaDamage)} dmg, r${Math.round(s.novaRadius)}` });

  return rows;
}

// Helpers de UI: piezas que se repiten en varios paneles (fondo con borde, barras,
// textos, separadores). Todas fijan scrollFactor 0 porque la UI no se mueve con la cámara.

import { FONT, UI } from '../config/theme.js';

// mm:ss a partir de milisegundos.
export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// Caja de panel con borde. `origin` 0 para anclar arriba-izquierda, 0.5 para centrar.
export function panel(scene, { width, height, depth, border, origin = 0, alpha = UI.panelAlpha }) {
  return scene.add.rectangle(0, 0, width, height, UI.panelBg, alpha)
    .setOrigin(origin)
    .setStrokeStyle(3, border)
    .setScrollFactor(0)
    .setDepth(depth);
}

export function text(scene, content, { size, color, depth, origin = 0, align, lineSpacing, wordWrapWidth }) {
  const style = { fontFamily: FONT, fontSize: size, color };
  if (align) style.align = align;
  if (lineSpacing) style.lineSpacing = lineSpacing;
  if (wordWrapWidth) style.wordWrap = { width: wordWrapWidth };

  const obj = scene.add.text(0, 0, content, style).setScrollFactor(0).setDepth(depth);
  return Array.isArray(origin) ? obj.setOrigin(origin[0], origin[1]) : obj.setOrigin(origin);
}

// Barra de progreso: devuelve { track, fill, maxWidth }. El ancho del fill se ajusta
// después con `fill.width = maxWidth * ratio`.
export function bar(scene, { width, height, color, depth, inset = 1 }) {
  const track = scene.add.rectangle(0, 0, width, height, UI.barTrack)
    .setOrigin(0).setScrollFactor(0).setDepth(depth);
  const maxWidth = width - inset * 2;
  const fill = scene.add.rectangle(0, 0, maxWidth, height - inset * 2, color)
    .setOrigin(0).setScrollFactor(0).setDepth(depth + 1);
  return { track, fill, maxWidth, inset };
}

export function divider(scene, { width, depth }) {
  return scene.add.rectangle(0, 0, width, 2, UI.divider)
    .setOrigin(0).setScrollFactor(0).setDepth(depth);
}

// Muestra/oculta varios objetos de una, que es el patrón de todos los paneles.
export function setVisible(objects, visible) {
  objects.forEach((o) => o.setVisible(visible));
}

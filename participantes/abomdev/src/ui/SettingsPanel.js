// Panel de configuración: volumen de audio (3 sliders) y lado del joystick en
// mobile. La misma clase la usan el menú principal y la pausa, para que no
// existan dos versiones que se desincronicen.
//
// Las categorías separadas existen porque el combate suena muchas veces por segundo
// y los hitos (level-up, jefe, victoria) son puntuales: poder bajar uno sin perder
// el otro es la diferencia entre "ruidoso" y "molesto".

import { FONT_SIZE, TEXT, UI } from '../config/theme.js';
import { getAudioSettings, setVolume } from '../audio/synth.js';
import { getTouchLayout, setTouchLayout } from '../utils/touchLayout.js';
import { edgePadding, getSafeInsets, isCompactMode } from './layout.js';
import { button, divider, panel, setVisible, slider, text } from './widgets.js';

const DEPTH_OVERLAY = 400;
const DEPTH = 410;
const BOX_W = 460;
const BOX_H = 460;
const PADDING = 28;
const PADDING_COMPACT = 16;
const SLIDER_W = 260;
const SLIDER_W_COMPACT = 220;
const TOGGLE_W = 90;
const TOGGLE_H = 40;
const TOGGLE_GAP = 8;

export default class SettingsPanel {
  // onClose: lo provee quien lo abre. onLayoutChange: callback para invertir
  // joystick/minimap/PauseMenu en vivo (live update).
  constructor(scene, onClose, onLayoutChange = null) {
    this.scene = scene;
    this.onClose = onClose;
    this.onLayoutChange = onLayoutChange;

    this.overlay = scene.add.rectangle(0, 0, 10, 10, UI.overlay, 0.75)
      .setOrigin(0).setScrollFactor(0).setDepth(DEPTH_OVERLAY).setVisible(false);

    this.box = panel(scene, { width: BOX_W, height: BOX_H, depth: DEPTH, border: 0x66aaff, origin: 0.5 })
      .setVisible(false);
    this.title = text(scene, 'CONFIGURACIÓN', { size: '22px', color: TEXT.info, depth: DEPTH + 1, origin: 0.5 })
      .setVisible(false);
    this.divider = divider(scene, { width: BOX_W - PADDING * 2, depth: DEPTH + 1 }).setVisible(false);

    const settings = getAudioSettings();
    this.sliders = [
      { key: 'master', ui: slider(scene, { label: 'Volumen general', width: SLIDER_W, depth: DEPTH + 1, onChange: (v) => setVolume('master', v) }) },
      { key: 'combat', ui: slider(scene, { label: 'Combate (disparos, impactos)', width: SLIDER_W, depth: DEPTH + 1, onChange: (v) => setVolume('combat', v) }) },
      { key: 'events', ui: slider(scene, { label: 'Hitos (nivel, jefe, victoria)', width: SLIDER_W, depth: DEPTH + 1, onChange: (v) => setVolume('events', v) }) },
    ];
    this.sliders.forEach(({ key, ui }) => ui.setValue(settings[key]));

    this.layoutToggle = this._buildLayoutToggle(scene);

    this.closeButton = button(scene, {
      label: 'Volver', width: 160, height: 40, depth: DEPTH + 1,
      onClick: () => this.hide(),
    });

    this.parts = [
      this.overlay, this.box, this.title, this.divider,
      ...this.sliders.flatMap(({ ui }) => ui.parts),
      this.layoutToggle.label,
      ...this.layoutToggle.options.flatMap((o) => o.parts),
      ...this.closeButton.parts,
    ];
    setVisible(this.parts, false);
  }

  _buildLayoutToggle(scene) {
    const label = text(scene, 'Lado del joystick', {
      size: FONT_SIZE.small, color: TEXT.secondary, depth: DEPTH + 1,
    });
    const makeOption = (value, caption) => {
      const btn = button(scene, {
        label: caption, width: TOGGLE_W, height: TOGGLE_H, depth: DEPTH + 1,
        onClick: () => this._selectLayout(value),
      });
      return { value, btn, parts: btn.parts };
    };
    return {
      label,
      left: makeOption('left', 'IZQ'),
      right: makeOption('right', 'DER'),
      get options() { return [this.left, this.right]; },
    };
  }

  _selectLayout(value) {
    setTouchLayout(value);
    this._refreshLayoutHighlight();
    if (this.onLayoutChange) this.onLayoutChange(value);
  }

  _refreshLayoutHighlight() {
    const current = getTouchLayout();
    [this.layoutToggle.left, this.layoutToggle.right].forEach((opt) => {
      const active = opt.value === current;
      opt.btn.parts[0].setStrokeStyle(2, active ? 0x66ffcc : 0x444466);
      opt.btn.parts[1].setColor(active ? '#66ffcc' : '#cceeff');
    });
  }

  layout(w, h) {
    const compact = isCompactMode();
    const cx = w / 2;
    const cy = h / 2;
    this.overlay.width = w;
    this.overlay.height = h;

    const padding = compact ? PADDING_COMPACT : PADDING;
    const sliderW = compact ? Math.min(SLIDER_W_COMPACT, w - 2 * padding - 20) : SLIDER_W;
    const boxW = compact ? Math.min(BOX_W, w - 2 * padding) : BOX_W;
    const boxH = compact ? Math.min(BOX_H, h - 2 * padding) : BOX_H;

    this.box.setSize(boxW, boxH).setPosition(cx, cy);
    this.title.setPosition(cx, cy - boxH / 2 + 32);
    this.divider.setSize(boxW - padding * 2, 2).setPosition(cx - (boxW - padding * 2) / 2, cy - boxH / 2 + 56);

    // Los sliders se apilan dejando lugar arriba para su etiqueta.
    const sliderGap = compact ? 64 : 62;
    const firstY = cy - boxH / 2 + 108;
    this.sliders.forEach(({ ui }, i) => {
      ui.setPosition(cx - sliderW / 2, firstY + i * sliderGap);
    });

    // Toggle de lado: debajo del último slider. El label va centrado arriba del
    // par IZQ/DER, no en el borde del slider.
    const toggleY = firstY + this.sliders.length * sliderGap + 48;
    this.layoutToggle.label.setOrigin(0.5, 0);
    this.layoutToggle.label.setPosition(cx, toggleY - 26);
    const toggleTotalW = TOGGLE_W * 2 + TOGGLE_GAP;
    this.layoutToggle.left.btn.setPosition(cx - toggleTotalW / 2 + TOGGLE_W / 2, toggleY);
    this.layoutToggle.right.btn.setPosition(cx + toggleTotalW / 2 - TOGGLE_W / 2, toggleY);

    this.closeButton.setPosition(cx, cy + boxH / 2 - 36);
  }

  get isOpen() {
    return this.box.visible;
  }

  show() {
    // Releemos por si el mute con M cambió algo desde la última vez.
    const settings = getAudioSettings();
    this.sliders.forEach(({ key, ui }) => ui.setValue(settings[key]));
    this._refreshLayoutHighlight();
    setVisible(this.parts, true);
  }

  hide() {
    setVisible(this.parts, false);
    if (this.onClose) this.onClose();
  }
}

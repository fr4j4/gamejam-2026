// Panel de configuración de audio. La misma clase la usan el menú principal y la
// pausa, para que no existan dos versiones que se desincronicen.
//
// Las categorías separadas existen porque el combate suena muchas veces por segundo
// y los hitos (level-up, jefe, victoria) son puntuales: poder bajar uno sin perder
// el otro es la diferencia entre "ruidoso" y "molesto".

import { FONT_SIZE, TEXT, UI } from '../config/theme.js';
import { getAudioSettings, setVolume } from '../audio/synth.js';
import { button, divider, panel, setVisible, slider, text } from './widgets.js';

const DEPTH_OVERLAY = 400;
const DEPTH = 410;
const BOX_W = 460;
const BOX_H = 340;
const PADDING = 28;
const SLIDER_W = 260;

export default class SettingsPanel {
  // onClose lo provee quien lo abre: el menú vuelve a su pantalla, la pausa a la suya.
  constructor(scene, onClose) {
    this.scene = scene;
    this.onClose = onClose;

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

    this.closeButton = button(scene, {
      label: 'Volver', width: 160, height: 40, depth: DEPTH + 1,
      onClick: () => this.hide(),
    });

    this.parts = [
      this.overlay, this.box, this.title, this.divider,
      ...this.sliders.flatMap(({ ui }) => ui.parts),
      ...this.closeButton.parts,
    ];
    setVisible(this.parts, false);
  }

  layout(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    this.overlay.width = w;
    this.overlay.height = h;

    this.box.setPosition(cx, cy);
    this.title.setPosition(cx, cy - BOX_H / 2 + 32);
    this.divider.setPosition(cx - (BOX_W - PADDING * 2) / 2, cy - BOX_H / 2 + 56);

    // Los sliders se apilan dejando lugar arriba para su etiqueta.
    const firstY = cy - BOX_H / 2 + 108;
    this.sliders.forEach(({ ui }, i) => {
      ui.setPosition(cx - SLIDER_W / 2, firstY + i * 62);
    });

    this.closeButton.setPosition(cx, cy + BOX_H / 2 - 36);
  }

  get isOpen() {
    return this.box.visible;
  }

  show() {
    // Releemos por si el mute con M cambió algo desde la última vez.
    const settings = getAudioSettings();
    this.sliders.forEach(({ key, ui }) => ui.setValue(settings[key]));
    setVisible(this.parts, true);
  }

  hide() {
    setVisible(this.parts, false);
    if (this.onClose) this.onClose();
  }
}

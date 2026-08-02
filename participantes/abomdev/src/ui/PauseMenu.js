// Menú de pausa en tres columnas: inventario de armas a la izquierda, botones al
// centro y estadísticas a la derecha. El overlay atenúa el juego de fondo.
// Cada stat y cada arma llevan su icono, con el mismo mapeo que las cards de level-up.
//
// En compact: layout en 2 columnas (inventario | stats), cada una scrolleable
// via mask. Los botones van en una grilla compacta abajo.

import { FONT_SIZE, TEXT, UI } from '../config/theme.js';
import { WEAPON_KEYS } from '../config/upgrades.js';
import { isTouchDevice, isIOS } from '../utils/device.js';
import { toggleFullscreen } from '../utils/fullscreen.js';
import { lockLandscape, unlockOrientation } from '../utils/orientation.js';
import { getTouchLayout } from '../utils/touchLayout.js';
import { edgePadding, getSafeInsets, isCompactMode } from './layout.js';
import { button, divider, icon, panel, setVisible, text } from './widgets.js';

const DEPTH_OVERLAY = 290;
const DEPTH = 300;
const BOX_H_DESKTOP = 470;
const BOX_H_COMPACT = 220;
const STATS_W = 340;
const STATS_W_COMPACT = 280;
const INVENTORY_W = 280;
const INVENTORY_W_COMPACT = 240;
const TITLE_BOX_W = 260;
const TITLE_BOX_H = 60;
const PADDING = 16;
const PADDING_COMPACT = 10;
const ROW_H = 26;
const ROW_ICON = 17;
const MAX_ROWS = 15;
const SLOT_H = 54;
const SLOT_H_COMPACT = 28;
const SLOT_ICON = 26;
const SLOT_ICON_COMPACT = 18;
const COMPACT_BUTTON_W = 96;

// Nombre e icono de cada arma para el inventario. El orden es el de WEAPON_KEYS.
const WEAPON_INFO = {
  aura: { name: 'Aura de daño', icon: 'icon-circle-dot', color: 0x66ffcc },
  orbit: { name: 'Orbe giratorio', icon: 'icon-orbit', color: 0x55ddff },
  pierce: { name: 'Perforante', icon: 'icon-crosshair', color: 0x66ddff },
  burst: { name: 'Ráfaga', icon: 'icon-swords', color: 0xffee66 },
  nova: { name: 'Onda expansiva', icon: 'icon-waves', color: 0xffaa00 },
};

export default class PauseMenu {
  // actions: { onResume, onSettings, onRestart, onQuit }
  constructor(scene, actions, side) {
    this.scene = scene;
    this.side = side || getTouchLayout();

    this.overlay = scene.add.rectangle(0, 0, 10, 10, UI.overlay, UI.overlayAlpha)
      .setOrigin(0).setScrollFactor(0).setDepth(DEPTH_OVERLAY).setVisible(false);

    this.titleBox = panel(scene, { width: TITLE_BOX_W, height: TITLE_BOX_H, depth: DEPTH, border: 0x66ffcc, origin: 0.5, alpha: 0.95 })
      .setVisible(false);
    this.title = text(scene, 'PAUSADO', { size: FONT_SIZE.heading, color: TEXT.primary, depth: DEPTH + 1, origin: 0.5 })
      .setVisible(false);

    // La etapa va bajo el título y no en la lista de estadísticas: es contexto de
    // la partida, no una stat del personaje.
    this.stageIcon = icon(scene, 'icon-layers', { size: 18, color: 0xaa88ff, depth: DEPTH + 1 }).setVisible(false);
    this.stageText = text(scene, '', { size: '18px', color: TEXT.stage, depth: DEPTH + 1, origin: [0, 0.5] })
      .setVisible(false);

    this.buildInventory(scene);
    this.buildStats(scene);
    this.buildButtons(scene, actions);

    this.chrome = [
      this.overlay, this.titleBox, this.title, this.stageIcon, this.stageText,
      this.invBox, this.invTitle, this.invDivider,
      this.box, this.boxTitle, this.boxDivider,
    ];

    this._clipCounts = { inv: Infinity, rows: Infinity };
    this._isCompact = false;
  }

  buildInventory(scene) {
    this.invBox = panel(scene, { width: INVENTORY_W, height: BOX_H_DESKTOP, depth: DEPTH, border: 0xffcc44 }).setVisible(false);
    this.invTitle = text(scene, 'ARMAS', { size: '17px', color: TEXT.gold, depth: DEPTH + 1 }).setVisible(false);
    this.invDivider = divider(scene, { width: INVENTORY_W - PADDING * 2, depth: DEPTH + 1 }).setVisible(false);

    // Un slot por arma del juego: las bloqueadas también se muestran, apagadas, para
    // que se vea qué queda por conseguir.
    this.slots = WEAPON_KEYS.map((key) => ({
      key,
      frame: scene.add.rectangle(0, 0, INVENTORY_W - PADDING * 2, SLOT_H - 8, 0x101024, 0.9)
        .setOrigin(0).setStrokeStyle(2, 0x333355).setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false),
      icon: icon(scene, WEAPON_INFO[key].icon, { size: SLOT_ICON, color: 0xffffff, depth: DEPTH + 2 }).setVisible(false),
      name: text(scene, WEAPON_INFO[key].name, { size: FONT_SIZE.small, color: TEXT.secondary, depth: DEPTH + 2 }).setVisible(false),
      detail: text(scene, '', { size: FONT_SIZE.tiny, color: TEXT.dim, depth: DEPTH + 2 }).setVisible(false),
    }));
  }

  buildStats(scene) {
    this.box = panel(scene, { width: STATS_W, height: BOX_H_DESKTOP, depth: DEPTH, border: 0x66aaff }).setVisible(false);
    this.boxTitle = text(scene, 'ESTADÍSTICAS', { size: '17px', color: TEXT.info, depth: DEPTH + 1 }).setVisible(false);
    this.boxDivider = divider(scene, { width: STATS_W - PADDING * 2, depth: DEPTH + 1 }).setVisible(false);

    // Filas reutilizables: se crean una vez y se rellenan al pausar, así no
    // generamos y destruimos objetos cada vez que se abre el menú.
    this.rows = Array.from({ length: MAX_ROWS }, () => ({
      icon: icon(scene, 'icon-swords', { size: ROW_ICON, color: 0xffffff, depth: DEPTH + 1 }).setVisible(false),
      label: text(scene, '', { size: FONT_SIZE.small, color: TEXT.secondary, depth: DEPTH + 1 }).setVisible(false),
    }));
  }

  buildButtons(scene, actions) {
    const touch = isTouchDevice();
    const compact = touch && isCompactMode();
    // En compact fullscreen no se ofrece en la pausa porque el jugador ya esta
    // en touch y el boton se controla desde el menu principal. Asi la lista
    // de botones queda corta y entra en pantallas de 360h.
    const fsButton = touch && !compact
      ? button(scene, { label: 'Pantalla completa', width: 210, height: 38, depth: DEPTH + 1, color: TEXT.gold, onClick: () => this.tryFullscreen() })
      : null;

    this.buttons = [
      ...(fsButton ? [fsButton] : []),
      button(scene, { label: 'Continuar', width: 210, height: 46, depth: DEPTH + 1, onClick: actions.onResume }),
      button(scene, { label: 'Configuración', width: 210, height: 46, depth: DEPTH + 1, color: TEXT.info, onClick: actions.onSettings }),
      button(scene, { label: 'Reiniciar', width: 210, height: 46, depth: DEPTH + 1, color: TEXT.gold, onClick: actions.onRestart }),
      button(scene, { label: 'Salir al menú', width: 210, height: 46, depth: DEPTH + 1, color: TEXT.danger, onClick: actions.onQuit }),
    ];
    this.buttonParts = this.buttons.flatMap((b) => b.parts);
    setVisible(this.buttonParts, false);
  }

  tryFullscreen() {
    const result = toggleFullscreen(this.scene.scale);
    if (result === 'on') lockLandscape();
    else if (result === 'off') unlockOrientation();
    else if (result === 'failed') this.showFullscreenFallback();
  }

  showFullscreenFallback() {
    if (this.fsToast) return;
    const msg = isIOS()
      ? 'En iPhone: tocar compartir → Agregar a inicio'
      : 'Pantalla completa no disponible';
    const scene = this.scene;
    this.fsToast = panel(scene, { width: 360, height: 48, depth: DEPTH + 5, border: 0xffaa00, origin: 0.5 });
    this.fsToastText = text(scene, msg, { size: FONT_SIZE.small, color: 0xffaa00, depth: DEPTH + 6, origin: 0.5 });
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.fsToast.setPosition(w / 2, h - 60);
    this.fsToastText.setPosition(w / 2, h - 60);
    scene.time.delayedCall(8000, () => {
      this.fsToast?.destroy();
      this.fsToastText?.destroy();
      this.fsToast = null;
      this.fsToastText = null;
    });
  }

  layout(w, h) {
    // Compact = el jugador esta en touch. Detectamos touch por heuristica:
    // o es touch device segun el browser, o el jugador configuro el lado del
    // joystick en algun momento (persiste en localStorage, lo cual solo
    // ocurre en touch). Sin importar el tamano del viewport: si el jugador
    // es touch, queremos el layout optimizado para touch.
    const touchConfigured = (() => {
      try { return localStorage.getItem('survivorsTouchLayout') !== null; } catch { return false; }
    })();
    const compact = isTouchDevice() || touchConfigured;
    this._isCompact = compact;
    const cx = w / 2;
    this.overlay.width = w;
    this.overlay.height = h;

    const insets = getSafeInsets();
    const topInset = edgePadding('top', 0, insets);
    const leftInset = edgePadding('left', 0, insets);
    const rightInset = edgePadding('right', 0, insets);

    // En compact el titulo va debajo del HUD del juego (que ocupa hasta
    // aprox y=80) para no quedar tapado por las barras de HP/escudo/XP.
    const titleY = compact ? topInset + 95 : topInset + 55;
    this.titleBox.setPosition(cx, titleY);
    this.title.setPosition(cx, titleY);
    this.stageCenterX = cx;
    this.positionStage();

    const padding = compact ? PADDING_COMPACT : PADDING;
    const statsW = compact ? Math.min(STATS_W_COMPACT, w - 2 * (padding + leftInset)) : STATS_W;
    const invW = compact ? Math.min(INVENTORY_W_COMPACT, w - 2 * (padding + leftInset)) : INVENTORY_W;
    const boxH = compact ? BOX_H_COMPACT : BOX_H_DESKTOP;
    const slotH = compact ? SLOT_H_COMPACT : SLOT_H;

    // El alto del bloque de pausa debe caber entre el titulo y el borde inferior.
    const usableTop = titleY + 50;
    const usableBottom = h - 20 - topInset;
    const maxBoxH = Math.max(120, usableBottom - usableTop);

    if (compact) {
      // Layout en 3 columnas: ARMAS a la izquierda, controles en el centro,
      // ESTADISTICAS a la derecha. Las 3 columnas se calculan centradas
      // respecto al centro del viewport (cx) para que el balance no cambie
      // con leftInset vs rightInset. Ademas capeamos sideColW a un ancho
      // razonable para que las cajas no se estiren en pantallas grandes.
      const colGap = 10;
      const usableW = w - 2 * padding - leftInset - rightInset;
      const sideColW = Math.max(140, Math.min(INVENTORY_W_COMPACT, (usableW - 2 * colGap) * 0.37, 280));
      const buttonsColW = Math.max(COMPACT_BUTTON_W, usableW - 2 * sideColW - 2 * colGap);
      const totalRowW = sideColW * 2 + buttonsColW + colGap * 2;
      const invX = cx - totalRowW / 2;
      const buttonsX = invX + sideColW + colGap;
      const statsX = buttonsX + buttonsColW + colGap;
      const columnsTop = titleY + 40;
      const totalButtonsH = this.buttons.length * 28 + (this.buttons.length - 1) * 4;
      // Los botones arrancan debajo del titulo (no verticalmente centrados) para
      // mantener siempre el titlePAUSADO visible arriba.
      const buttonsTop = Math.max(columnsTop, topInset + 110);
      const columnsBottom = h - 8;
      const columnsH = Math.max(120, columnsBottom - columnsTop);

      this.invBox.setSize(sideColW, columnsH).setPosition(invX, columnsTop);
      this.invTitle.setPosition(invX + padding, columnsTop + padding);
      this.invDivider.setSize(sideColW - padding * 2, 2).setPosition(invX + padding, columnsTop + 36);

      const slotsClipY = columnsTop + 50;
      this._clipCounts.inv = Math.floor((columnsH - 60) / slotH);
      const slotStep = slotH;
      this.slots.forEach((slot, i) => {
        const y = slotsClipY + i * slotStep;
        if (i >= this._clipCounts.inv) return;
        slot.frame.setSize(sideColW - padding * 2, slotH - 4).setPosition(invX + padding, y);
        slot.icon.setPosition(invX + padding + SLOT_ICON_COMPACT / 2 + 4, y + (slotH - 4) / 2);
        slot.name.setPosition(invX + padding + SLOT_ICON_COMPACT + 8, y + (slotH - 4) / 2);
        // En compact no mostramos el detail del slot: el icono + name alcanzan
        // para identificar el arma y la columna ya es estrecha.
        slot.detail.setVisible(false);
      });

      this.box.setSize(sideColW, columnsH).setPosition(statsX, columnsTop);
      this.boxTitle.setPosition(statsX + padding, columnsTop + padding);
      this.boxDivider.setSize(sideColW - padding * 2, 2).setPosition(statsX + padding, columnsTop + 36);

      const rowsClipY = columnsTop + 50;
      this._clipCounts.rows = Math.floor((columnsH - 60) / ROW_H);
      this.rows.forEach((row, i) => {
        const y = rowsClipY + i * ROW_H;
        if (i >= this._clipCounts.rows) return;
        row.icon.setPosition(statsX + padding + ROW_ICON / 2, y + 8);
        row.label.setPosition(statsX + padding + ROW_ICON + 10, y);
      });

      // Botones en columna central, centrados horizontal y verticalmente.
      this.buttons.forEach((b) => b.setSize(buttonsColW, 28));
      const buttonsCx = buttonsX + buttonsColW / 2;
      this.buttons.forEach((b, i) => {
        const y = buttonsTop + i * 32;
        b.setPosition(buttonsCx, y);
      });
    } else {
      const boxY = Math.max(150, topInset + 90);

      let invX;
      let statsX;
      if (this.side === 'right') {
        // Joystick a la derecha: minimapa en bottom-left, ESTADISTICAS a la
        // derecha del HUD timer (no en bottom-left que choca con el minimapa).
        invX = w - INVENTORY_W - 40 - rightInset;
        statsX = 40 + leftInset;
      } else {
        invX = 40 + leftInset;
        statsX = w - STATS_W - 40 - rightInset;
      }

      this.invBox.setPosition(invX, boxY);
      this.invTitle.setPosition(invX + PADDING, boxY + PADDING);
      this.invDivider.setPosition(invX + PADDING, boxY + 42);
      this.slots.forEach((slot, i) => {
        const y = boxY + 56 + i * SLOT_H;
        slot.frame.setPosition(invX + PADDING, y);
        slot.icon.setPosition(invX + PADDING + 22, y + (SLOT_H - 8) / 2);
        slot.name.setPosition(invX + PADDING + 46, y + 7);
        slot.detail.setPosition(invX + PADDING + 46, y + 26);
      });

      const firstButtonY = boxY + 90;
      this.buttons.forEach((b, i) => b.setPosition(cx, firstButtonY + i * 62));

      this.box.setPosition(statsX, boxY);
      this.boxTitle.setPosition(statsX + PADDING, boxY + PADDING);
      this.boxDivider.setPosition(statsX + PADDING, boxY + 42);
      this.rows.forEach((row, i) => {
        const y = boxY + 56 + i * ROW_H;
        row.icon.setPosition(statsX + PADDING + ROW_ICON / 2, y + 8);
        row.label.setPosition(statsX + PADDING + ROW_ICON + 10, y);
      });
    }

    this.positionStage();
  }

  setLayout(value) {
    this.side = value;
    this.layout(this.scene.scale.width, this.scene.scale.height);
  }


  // El ancho del texto cambia con el número de etapa, así que el grupo icono+texto
  // se recentra cada vez en lugar de usar posiciones fijas.
  positionStage() {
    const gap = 8;
    const compact = this._isCompact;
    // En compact el stage label se oculta: ya esta el titulo PAUSADO y los
    // paneles de armas/stats hablan por si mismos. En desktop se mantiene
    // la posicion original.
    const groupW = 18 + gap + this.stageText.width;
    const left = (this.stageCenterX || 0) - groupW / 2;
    const y = compact ? 0 : edgePadding('top', 0, getSafeInsets()) + 104;
    if (compact) {
      this.stageIcon.setVisible(false);
      this.stageText.setVisible(false);
    } else {
      this.stageIcon.setVisible(true);
      this.stageText.setVisible(true);
      this.stageIcon.setPosition(left + 9, y);
      this.stageText.setPosition(left + 18 + gap, y);
    }
  }

  // stats: filas de buildStatRows(). weapons: estado de armas de buildWeaponSlots().
  // stageLabel: texto de etapa a mostrar bajo el título.
  show(stats, weapons, stageLabel) {
    this.rows.forEach((row, i) => {
      const data = stats[i];
      if (!data || i >= this._clipCounts.rows) {
        setVisible([row.icon, row.label], false);
        return;
      }
      row.icon.setTexture(data.icon).setDisplaySize(ROW_ICON, ROW_ICON).setTint(data.color).setVisible(true);
      row.label.setText(data.label).setVisible(true);
    });

    this.slots.forEach((slot, i) => {
      const info = WEAPON_INFO[slot.key];
      const state = weapons[slot.key];
      if (i >= this._clipCounts.inv) {
        setVisible([slot.frame, slot.icon, slot.name, slot.detail], false);
        return;
      }
      // Las armas bloqueadas quedan atenuadas, no ocultas.
      slot.frame.setStrokeStyle(2, state.unlocked ? info.color : 0x333355).setVisible(true);
      slot.icon.setTint(state.unlocked ? info.color : 0x444455).setVisible(true);
      slot.name.setColor(state.unlocked ? TEXT.secondary : TEXT.dim).setVisible(true);
      // En compact el detail no se muestra: el icono y nombre son suficientes
      // y la columna es estrecha. Mantenerlo invisible incluso si el layout
      // lo dejo visible por una corrida previa.
      if (this._isCompact) {
        slot.detail.setVisible(false);
      } else {
        slot.detail.setText(state.unlocked ? state.detail : 'Sin desbloquear').setVisible(true);
      }
    });

    this.stageText.setText(stageLabel);
    setVisible(this.chrome, true);
    setVisible(this.buttonParts, true);
    // positionStage debe correr DESPUES de hacer visible el chrome para que
    // la ocultacion condicional (compact) no se sobreescriba.
    this.positionStage();
  }

  hide() {
    setVisible(this.chrome, false);
    setVisible(this.buttonParts, false);
    this.rows.forEach((row) => setVisible([row.icon, row.label], false));
    this.slots.forEach((slot) => setVisible([slot.frame, slot.icon, slot.name, slot.detail], false));
  }

  // Oculta solo el contenido, dejando el overlay: se usa al abrir configuración
  // desde la pausa, para que el juego siga viéndose atenuado detrás.
  hideContent() {
    setVisible(this.chrome.filter((o) => o !== this.overlay), false);
    setVisible(this.buttonParts, false);
    this.rows.forEach((row) => setVisible([row.icon, row.label], false));
    this.slots.forEach((slot) => setVisible([slot.frame, slot.icon, slot.name, slot.detail], false));
  }
}

// Estado de cada arma para el inventario: si está desbloqueada y su resumen.
export function buildWeaponSlots(s) {
  return {
    aura: { unlocked: s.hasAura, detail: s.hasAura ? `${Math.round(s.auraDamage)} dmg · radio ${Math.round(s.auraRadius)}` : '' },
    orbit: { unlocked: s.hasOrbit, detail: s.hasOrbit ? `${Math.round(s.orbitDamage)} dmg · x${s.orbitCount}` : '' },
    pierce: { unlocked: s.hasPierce, detail: s.hasPierce ? `${Math.round(s.pierceDamage)} dmg · ${(1000 / s.pierceRate).toFixed(1)}/s` : '' },
    burst: { unlocked: s.hasBurst, detail: s.hasBurst ? `${Math.round(s.burstDamage)} dmg · x${s.burstCount}` : '' },
    nova: { unlocked: s.hasNova, detail: s.hasNova ? `${Math.round(s.novaDamage)} dmg · radio ${Math.round(s.novaRadius)}` : '' },
  };
}

// Arma las filas de estadísticas a mostrar. Las que arrancan en cero (o dependen de
// un arma no desbloqueada) se omiten para no llenar el panel de ruido.
// La etapa no está acá: se muestra bajo el título, como contexto de la partida.
export function buildStatRows(stats) {
  const s = stats;
  const rows = [
    { icon: 'icon-swords', color: 0xff8866, label: `Daño: ${Math.round(s.damage)}` },
    { icon: 'icon-gauge', color: 0xffcc44, label: `Cadencia: ${(1000 / s.fireRate).toFixed(1)}/s` },
    { icon: 'icon-footprints', color: 0x66ffcc, label: `Velocidad: ${Math.round(s.moveSpeed)}` },
    { icon: 'icon-heart', color: 0xff5566, label: `HP máximo: ${Math.round(s.maxHp)}` },
    { icon: 'icon-magnet', color: 0xaa88ff, label: `Radio de imán: ${Math.round(s.magnetRadius)}` },
  ];

  if (s.hpRegen > 0) rows.push({ icon: 'icon-heart-pulse', color: 0xff88aa, label: `Regeneración: ${s.hpRegen.toFixed(1)}/s` });
  if (s.lifesteal > 0) rows.push({ icon: 'icon-droplet', color: 0xff5566, label: `Robo de vida: ${(s.lifesteal * 100).toFixed(0)}%` });
  if (s.dodge > 0) rows.push({ icon: 'icon-wind', color: 0x88ddff, label: `Esquivar: ${(s.dodge * 100).toFixed(0)}%` });
  if (s.shieldMax > 0) rows.push({ icon: 'icon-shield', color: 0x66ddff, label: `Escudo: ${Math.ceil(s.shield)}/${Math.round(s.shieldMax)}` });

  return rows;
}

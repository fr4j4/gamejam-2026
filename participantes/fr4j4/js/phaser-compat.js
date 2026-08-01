// js/phaser-compat.js — Compatibilidad entre Phaser 3 y Phaser 4
// =================================================================
// El proyecto comenzó con Phaser 3.80.1 y se migró a Phaser 4.2.1.
// Phaser 4 mantiene la mayoría de APIs, pero algunos nombres de
// espacio o funciones auxiliares no se exponen en la build minificada
// de jsDelivr. Este archivo polyfilla solo lo imprescindible para que
// las escenas antiguas sigan funcionando sin reescribirlas.
//
// APIs cubiertas:
//   - Phaser.Display.Color.HexStringToColor (conversión #hex -> int)
//   - Phaser.Math.Between / FloatBetween (utilidades de rango)
//   - Phaser.BlendModes (modos de mezcla para efectos glow)
//
// Nota: GeometryMask no se usa en producción; el scroll del deckbuilder
// se implementa con clipping manual de containers.

(function () {
  if (!window.Phaser) {
    console.error('[phaser-compat] Phaser not loaded');
    return;
  }

  // --- Phaser.Display.Color.HexStringToColor ---
  // Phaser 3 la exponía como Phaser.Display.Color.HexStringToColor.
  // Phaser 4 sigue teniendo la clase Color, pero la build minificada de
  // CDN no siempre expone el namespace Display. Buscamos candidatos y,
  // si no hay ninguno, devolvemos una implementación mínima equivalente.
  function ensureDisplayColor() {
    if (window.Phaser.Display && window.Phaser.Display.Color) return window.Phaser.Display.Color;
    const candidates = ['Color', 'DisplayColor', 'Colors'];
    for (const c of candidates) {
      if (window.Phaser[c] && window.Phaser[c].HexStringToColor) return window.Phaser[c];
    }
    if (!window.Phaser.__CompatColor) {
      window.Phaser.__CompatColor = function () {};
      window.Phaser.__CompatColor.HexStringToColor = function (hex) {
        const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
        if (!m) return { color: 0 };
        const n = parseInt(m[1], 16);
        return {
          color: n,
          red: (n >> 16) & 0xff,
          green: (n >> 8) & 0xff,
          blue: n & 0xff
        };
      };
    }
    return window.Phaser.__CompatColor;
  }

  const ColorMod = ensureDisplayColor();
  if (!window.Phaser.Display) window.Phaser.Display = {};
  if (!window.Phaser.Display.Color) window.Phaser.Display.Color = ColorMod;

  // --- Phaser.Math.Between / FloatBetween ---
  // Phaser 4 todavía exporta estas funciones; este guard las recrea
  // si alguna build futura no las incluyera.
  if (!window.Phaser.Math) window.Phaser.Math = {};
  if (typeof window.Phaser.Math.Between !== 'function') {
    window.Phaser.Math.Between = function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
  }
  if (typeof window.Phaser.Math.FloatBetween !== 'function') {
    window.Phaser.Math.FloatBetween = function (min, max) {
      return Math.random() * (max - min) + min;
    };
  }

  // --- Phaser.BlendModes ---
  // Usado por VFX.lcdPanel y glows. Phaser 4 usa los mismos valores
  // internos, pero no siempre expone la constante global.
  if (!window.Phaser.BlendModes) {
    window.Phaser.BlendModes = {
      NORMAL: 0,
      ADD: 1,
      MULTIPLY: 2,
      SCREEN: 3,
      ERASE: 4
    };
  }
})();

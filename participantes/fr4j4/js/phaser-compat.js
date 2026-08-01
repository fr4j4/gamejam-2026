// js/phaser-compat.js — Compat layer for Phaser 3 → 4 migration
// Re-exposes Phaser 3 APIs that Phaser 4 moved or renamed.
// Use this in scenes and UI modules instead of touching every file.

(function () {
  if (!window.Phaser) {
    console.error('[phaser-compat] Phaser not loaded');
    return;
  }

  // HexStringToColor: Phaser 3 used Phaser.Display.Color.HexStringToColor.
  // Phaser 4: Color class is still exposed under Phaser.Display, but namespace
  // may not be. Try to find it; fall back to a direct hex parser.
  function ensureDisplayColor() {
    if (window.Phaser.Display && window.Phaser.Display.Color) return window.Phaser.Display.Color;
    // In v4 the Color class may be exported under a different path. Search.
    const candidates = ['Color', 'DisplayColor', 'Colors'];
    for (const c of candidates) {
      if (window.Phaser[c] && window.Phaser[c].HexStringToColor) return window.Phaser[c];
    }
    // Last resort: provide a minimal implementation
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

  // Phaser.Math.Between / FloatBetween — Phaser 4 still exports these.
  // Wrap in case they were tree-shaken.
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

  // Phaser.BlendModes — Phaser 4 still exports these (ADD, MULTIPLY, etc.)
  if (!window.Phaser.BlendModes) {
    window.Phaser.BlendModes = {
      NORMAL: 0,
      ADD: 1,
      MULTIPLY: 2,
      SCREEN: 3,
      ERASE: 4
    };
  }

  // GeometryMask support — Phaser 4 only supports this in Canvas renderer.
  // If we're using WebGL, we need to fall back to clipping via Container.setSize
  // or using scrollFactor. For now, expose a no-op helper that throws if used
  // on WebGL.
  // (The DeckScene scrollable card grid uses createGeometryMask; we'll fix that
  // in the next step by switching to a different approach.)
})();
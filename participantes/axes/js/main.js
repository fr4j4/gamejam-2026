const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
  // El canvas transparente queda sobre el SVG, sin ocultarlo en la partida.
  transparent: true,
  scene: [BootScene, MenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const root = document.documentElement;
const cssTheme = {
  '--bg-base': SVG_COLORS.bgBase,
  '--gray-border': SVG_COLORS.grayBorder,
  '--gray-text': SVG_COLORS.textMuted,
  '--gray-text-dim': SVG_COLORS.textDim,
  '--grid-border': SVG_COLORS.boardGridBorder,
  '--player-one': SVG_COLORS.playerOne,
  '--player-two': SVG_COLORS.playerTwo,
  '--panel-bg': SVG_COLORS.boardCellA,
  '--button-base': SVG_COLORS.buttonBase,
  '--button-hover': SVG_COLORS.buttonHover,
  '--button-active': SVG_COLORS.playerOne,
  '--text-primary': SVG_COLORS.textPrimary,
  '--font-title': FONTS.TITLE,
  '--font-game': FONTS.GAME,
  '--font-body': FONTS.BODY,
  '--layer-board': DEPTH.board,
  '--layer-board-interactive': DEPTH.boardInteractive,
  '--layer-canvas': DEPTH.canvas,
  '--layer-footer': DEPTH.footer,
  '--layer-background': DEPTH.background,
  '--layer-app': DEPTH.app,
};
Object.entries(cssTheme).forEach(([name, value]) => root.style.setProperty(name, value));

const footerLink = document.querySelector('#site-footer-link');
if (footerLink) {
  footerLink.href = FOOTER_URL;
  footerLink.textContent = FOOTER_TEXT;
}

const loadingElement = document.getElementById('game-loading');
const MENU_READY_EVENT = 'timbiriche:menu-ready';

/** Elimina el loader HTML después del create real de MenuScene. */
function removeInitialLoader() {
  window.removeEventListener(MENU_READY_EVENT, removeInitialLoader);
  loadingElement?.remove();
}

// Se registra antes de crear Phaser: MenuScene emitirá este evento al terminar create().
window.addEventListener(MENU_READY_EVENT, removeInitialLoader, { once: true });

const FONT_LOAD_TIMEOUT = 4500;

/**
 * Solicita explícitamente las variantes usadas antes de crear Phaser.Text.
 * La espera no bloquea indefinidamente si el proveedor externo falla.
 */
async function loadGameFonts() {
  if (!document.fonts?.load) return { supported: false, timedOut: false };

  const fontsReady = Promise.all(FONT_LOAD_REQUESTS.map((request) => document.fonts.load(request)))
    .then(() => document.fonts.ready)
    .then(() => ({ supported: true, timedOut: false }));
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => resolve({ supported: true, timedOut: true }), FONT_LOAD_TIMEOUT);
  });

  const result = await Promise.race([fontsReady, timeout]);
  window.clearTimeout(timeoutId);
  return result;
}

async function bootstrapGame() {
  try {
    const fontResult = await loadGameFonts();
    if (fontResult.timedOut) {
      console.warn('La carga de fuentes tardó demasiado; Phaser iniciará con fallback seguro.');
    }
  } catch (error) {
    console.warn('No fue posible confirmar la carga de fuentes; Phaser iniciará con fallback seguro.', error);
  }

  new Phaser.Game(config);
}

bootstrapGame();

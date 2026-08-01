// Dimensiones base del lienzo Phaser. El layout responsive escala este espacio.
const GAME_WIDTH = 800;
const GAME_HEIGHT = 800;

// Jerarquía visual compartida por Phaser y las capas DOM/SVG del juego.
const DEPTH = Object.freeze({
  background: 0,
  app: 1,
  board: 20,
  boardInteractive: 60,
  canvas: 50,
  hud: 60,
  controls: 70,
  overlay: 100,
  modal: 110,
  modalContent: 120,
  tooltip: 130,
  footer: 10,
});

// Tipografías cargadas en index.html y compartidas por Phaser y el branding.
const FONTS = Object.freeze({
  TITLE: 'Orbitron, sans-serif',
  GAME: 'Rajdhani, sans-serif',
  BODY: '"Plus Jakarta Sans", sans-serif',
});

// Variantes que deben estar listas antes de crear cualquier Phaser.Text.
const FONT_LOAD_REQUESTS = Object.freeze([
  '400 48px Orbitron',
  '600 48px Orbitron',
  '700 48px Orbitron',
  '400 24px Rajdhani',
  '500 24px Rajdhani',
  '600 24px Rajdhani',
  '700 24px Rajdhani',
  '400 16px "Plus Jakarta Sans"',
  '500 16px "Plus Jakarta Sans"',
  '600 16px "Plus Jakarta Sans"',
  '700 16px "Plus Jakarta Sans"',
]);

const FOOTER_URL = 'https://kodingvibes.github.io/gamejam-2026/';
const FOOTER_TEXT = 'KODINGVIBES GAMEJAM-2026 ···  VIBECODED BY AXES';

// Colores numéricos para Phaser. Los estados activos son los únicos que usan neón.
const COLORS = Object.freeze({
  background: 0x0a0b10,
  panelBg: 0x2a2d38,
  panelBorder: 0x000000,
  buttonBase: 0x1a1f2c,
  buttonHover: 0x252d40,
  buttonActive: 0x00e5ff,
  buttonPrimaryHover: 0x62f7ff,
  buttonPrimaryPressed: 0x00b8cc,
  confirmDangerHover: 0xff4f8a,
  confirmDangerPressed: 0xc91d50,
  buttonDisabled: 0x0e1117,
  playerOne: 0x00e5ff,
  playerTwo: 0xf626a8,
  textPrimary: 0xe6edf3,
  textMuted: 0x8b949e,
  textDim: 0x5c6270,
  black: 0x000000,

  // Alias antiguos: se conservan para no romper escenas o prototipos existentes.
  text: 0xe6edf3,
  muted: 0x8b949e,
  accent: 0x00e5ff,
  button: 0x1a1f2c,
});

// Colores CSS para SVG, DOM y estilos string.
const SVG_COLORS = Object.freeze({
  bgBase: '#0a0b10',
  grayBorder: '#2a2d38',
  buttonBase: '#1a1f2c',
  buttonHover: '#252d40',
  dot: '#000000',
  emptyLine: '#000000',
  hoverLine: '#00f5ff',
  playerOne: '#00e5ff',
  playerTwo: '#f626a8',
  boardCellA: '#12141d',
  boardCellB: '#171a26',
  boardGridBorder: 'rgba(0, 245, 255, 0.08)',
  hoverFill: '#00f5ff40',
  panelBorder: 'rgba(0, 245, 255, 0.20)',
  textPrimary: '#e6edf3',
  textMuted: '#8b949e',
  textDim: '#5c6270',
  glitchCyan: '#00f5ff',
  glitchMagenta: '#f626a8',
  glitchGreen: '#55ff99',
  buttonActiveText: '#0a0b10',
});

// Medidas visuales del tablero. Mantiene el mismo espacio jugable entre fases.
const BOARD_STYLE = Object.freeze({
  width: 520,
  top: 130,
  framePadding: 24,
  dotRadius: 7,
  lineWidth: 6,
  lineHoverWidth: 8,
  hitboxWidth: 28,
  cellRadius: 0,
  cellOpacity: 0.92,
  ownerOpacity: 0.28,
  lineRevealDuration: 240,
  boxRevealDuration: 220,
  boxRevealInitialScale: 0.02,
});

// Tiempos breves de presentación que no alteran las reglas del juego.
const GAME_TIMING = Object.freeze({
  gameOverDelay: 650,
});

const AI_DIFFICULTY = Object.freeze({
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
});

const AI_CONFIG = Object.freeze({
  turnDelay: 550,
  defaultDifficulty: AI_DIFFICULTY.EASY,
  thinkingText: 'IA PENSANDO...',
});

// Glitch experimental de cajas. enabled es la única bandera de activación.
const BOX_CLAIM_GLITCH = Object.freeze({
  enabled: true,
  duration: 320,
  channelOffset: 6,
  flickerSteps: 5,
  cloneAlpha: 0.65,
  jitter: 4,
  scaleX: 1.08,
  scaleY: 0.97,
  cyan: SVG_COLORS.glitchCyan,
  magenta: SVG_COLORS.glitchMagenta,
});

// Medidas y opacidades comunes de la interfaz Phaser.
const UI_STYLE = Object.freeze({
  panelRadius: 0,
  panelAlpha: 0.96,
  borderWidth: 2,
  titleSize: '56px',
  subtitleSize: '20px',
  bodySize: '16px',
  hudLabelSize: '13px',
  scoreSize: '28px',
  buttonSize: '20px',
  glitchOffset: 2,
  activePlayerBorderWidth: 2,
  inactivePlayerAlpha: 0.58,
  turnTransitionDuration: 160,
});

// Sistema visual compartido por todos los botones Phaser.
const BUTTON_STYLE = Object.freeze({
  background: COLORS.buttonBase,
  backgroundHover: COLORS.buttonHover,
  backgroundPressed: 0x101521,
  backgroundDisabled: COLORS.buttonDisabled,
  border: COLORS.panelBorder,
  borderActive: COLORS.buttonActive,
  text: SVG_COLORS.textPrimary,
  textDisabled: SVG_COLORS.textDim,
  glitchCyan: 0x00f5ff,
  glitchMagenta: 0xf626a8,
  glitchGreen: 0x55ff99,
  cornerLength: 10,
  cornerInset: 3,
  cornerThickness: 2,
  channelOffset: 1,
  pressScale: 0.98,
  hoverDuration: 120,
  pressDuration: 80,
  glitchDuration: 180,
  hoverAlpha: 0.85,
  pressedAlpha: 1,
  channelDelay: 16,
  selectedAlpha: 0.58,
  disabledAlpha: 0.58,
  actionCooldown: 180,
  borderWidth: 1,
  activeBorderWidth: 2,
  fontFamily: FONTS.GAME,
  fontSize: UI_STYLE.buttonSize,
});

// Layout del panel final: una fila centrada y simétrica.
const GAME_OVER_STYLE = Object.freeze({
  panelWidth: 620,
  panelHeight: 390,
  centerX: GAME_WIDTH / 2,
  centerY: GAME_HEIGHT / 2,
  titleY: 265,
  resultY: 335,
  scoreY: 395,
  buttonsY: 500,
  buttonWidth: 220,
  buttonHeight: 52,
  buttonGap: 30,
  // Ajusta aquí la posición horizontal de los botones del panel final.
  // Ambos valores son el centro de cada botón; usa el mismo criterio para mantenerlos simétricos.
  leftButtonX: GAME_WIDTH / 2 - (220 / 2 + 30 / 2),
  rightButtonX: GAME_WIDTH / 2 + (220 / 2 + 30 / 2),
});

// Layout compartido del modal de confirmación de acciones.
const CONFIRM_MODAL_STYLE = Object.freeze({
  panelWidth: 560,
  panelHeight: 320,
  centerX: GAME_WIDTH / 2,
  centerY: GAME_HEIGHT / 2,
  titleY: 300,
  messageY: 350,
  buttonsY: 425,
  menuButtonY: 505,
  buttonWidth: 150,
  buttonHeight: 48,
  menuButtonWidth: 324,
  menuButtonHeight: 44,
  buttonGap: 24,
  overlayAlpha: 0.78,
  panelAlpha: 0.99,
});

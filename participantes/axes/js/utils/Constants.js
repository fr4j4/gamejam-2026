// Valores compartidos por las escenas. Mantenerlos aquí evita números mágicos.
const GAME_WIDTH = 800;
const GAME_HEIGHT = 800;

const COLORS = Object.freeze({
  background: 0x1a1a2e,
  text: '#f2f2f2',
  muted: '#a8a8bd',
  accent: 0xe94560,
  playerTwo: 0x0f8edb,
  button: 0x25254a,
  buttonHover: 0x38386a,
});

// Colores en formato CSS para los elementos SVG del tablero.
const SVG_COLORS = Object.freeze({
  dot: '#f2f2f2',
  emptyLine: '#77778f',
  hoverLine: '#e94560',
  playerOne: '#e94560',
  playerTwo: '#0f8edb',
});

const BOARD_STYLE = Object.freeze({
  width: 520,
  top: 130,
  dotRadius: 7,
  lineWidth: 6,
  hitboxWidth: 28,
});

// js/constants.js — Valores de juego compartidos.
// Cargar antes que las escenas (p.ej. justo después de phaser-compat.js).

const GAME_W = 640;
const GAME_H = 360;

const MAX_MANA = 10;
const MAX_HAND = 8;
const MAX_BOARD = 4;
const MIN_DECK = 5;
const STARTING_HAND_SIZE = 4;
const OPPONENT_STARTING_HAND_SIZE = 4;
const TURN_SECONDS = 60;

// Utilidades compartidas
function safeJSONParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}

window.GAME_W = GAME_W;
window.GAME_H = GAME_H;
window.MAX_MANA = MAX_MANA;
window.MAX_HAND = MAX_HAND;
window.MAX_BOARD = MAX_BOARD;
window.MIN_DECK = MIN_DECK;
window.STARTING_HAND_SIZE = STARTING_HAND_SIZE;
window.OPPONENT_STARTING_HAND_SIZE = OPPONENT_STARTING_HAND_SIZE;
window.TURN_SECONDS = TURN_SECONDS;
window.safeJSONParse = safeJSONParse;

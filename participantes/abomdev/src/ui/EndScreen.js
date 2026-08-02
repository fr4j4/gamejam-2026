// Pantalla final (game over o victoria) y persistencia del mejor tiempo.
// Se crea recién cuando la partida termina, así que no necesita layout ni hide.

import { BEST_TIME_KEY } from '../config/constants.js';
import { TEXT } from '../config/theme.js';
import { edgePadding, getSafeInsets, isCompactMode } from './layout.js';
import { formatTime, text } from './widgets.js';

const DEPTH = 200;

export function getBestTime() {
  try {
    return Number(localStorage.getItem(BEST_TIME_KEY)) || 0;
  } catch {
    // localStorage puede no estar disponible (ej. modo privado).
    return 0;
  }
}

// Devuelve true si este tiempo fue un récord nuevo.
export function saveBestTime(ms) {
  try {
    if (ms > getBestTime()) {
      localStorage.setItem(BEST_TIME_KEY, String(Math.floor(ms)));
      return true;
    }
  } catch {
    // Sin localStorage seguimos jugando, solo no se guarda el récord.
  }
  return false;
}

export function showEndScreen(scene, { title, color, elapsed, level }) {
  const isNewBest = saveBestTime(elapsed);
  const bestTime = getBestTime();

  const cx = scene.scale.width / 2;
  const cy = scene.scale.height / 2;
  const compact = isCompactMode();
  const topInset = edgePadding('top', 0, getSafeInsets());

  text(scene, title, {
    size: compact ? '28px' : '40px', color, depth: DEPTH, origin: 0.5,
  }).setPosition(cx, cy - (compact ? 30 : 40) + topInset);

  text(scene, `Sobreviviste ${formatTime(elapsed)} - Nivel ${level}`, {
    size: compact ? '15px' : '18px', color: TEXT.primary, depth: DEPTH, origin: 0.5,
  }).setPosition(cx, cy + (compact ? 8 : 10));

  const bestLabel = isNewBest ? `¡Nuevo mejor tiempo! ${formatTime(bestTime)}` : `Mejor tiempo: ${formatTime(bestTime)}`;
  text(scene, bestLabel, {
    size: compact ? '14px' : '16px', color: TEXT.gold, depth: DEPTH, origin: 0.5,
  }).setPosition(cx, cy + (compact ? 32 : 40)).setWordWrapWidth(scene.scale.width - 40);

  text(scene, 'Presiona R para reiniciar', {
    size: compact ? '14px' : '16px', color: TEXT.muted, depth: DEPTH, origin: 0.5,
  }).setPosition(cx, cy + (compact ? 60 : 75));

  scene.input.keyboard.once('keydown-R', () => scene.scene.restart());
}

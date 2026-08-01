/**
 * Decisiones puras de la IA. No conoce Phaser, SVG ni Board.
 * EASY es aleatoria; las estrategias futuras pueden sustituirla sin tocar la UI.
 */
function chooseMove(state, difficulty = AI_DIFFICULTY.EASY, options = {}) {
  const availableMoves = getAvailableMoves(state);
  if (availableMoves.length === 0) return null;

  const random = options.random ?? Math.random;
  const randomValue = Number(random());
  const normalized = Number.isFinite(randomValue)
    ? Math.min(0.999999, Math.max(0, randomValue))
    : 0;

  // MEDIUM y HARD quedan preparados para estrategias propias en próximos cortes.
  switch (difficulty) {
    case AI_DIFFICULTY.MEDIUM:
    case AI_DIFFICULTY.HARD:
    case AI_DIFFICULTY.EASY:
    default:
      return availableMoves[Math.floor(normalized * availableMoves.length)];
  }
}

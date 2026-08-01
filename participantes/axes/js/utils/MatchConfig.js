/** Modos de partida disponibles sin mezclar sus reglas. */
const GAME_MODES = Object.freeze({
  LOCAL: 'local',
  VS_AI: 'vs-ai',
});

/** @param {number} gridSize @param {string} mode @returns {{gridSize: number, mode: string, players: Array}} */
function createMatchConfig(gridSize, mode = GAME_MODES.LOCAL) {
  const selectedMode = mode === GAME_MODES.VS_AI ? GAME_MODES.VS_AI : GAME_MODES.LOCAL;
  return {
    gridSize,
    mode: selectedMode,
    players: [
      { id: 0, type: 'human' },
      selectedMode === GAME_MODES.VS_AI
        ? { id: 1, type: 'ai', difficulty: AI_CONFIG.defaultDifficulty }
        : { id: 1, type: 'human' },
    ],
  };
}

/** Clona la configuración completa para reiniciar sin compartir referencias. */
function cloneMatchConfig(matchConfig) {
  return {
    ...matchConfig,
    players: matchConfig.players.map((player) => ({ ...player })),
  };
}

/** @param {unknown} matchConfig @returns {boolean} */
function validateMatchConfig(matchConfig) {
  return Boolean(matchConfig
    && Number.isInteger(matchConfig.gridSize)
    && Array.isArray(matchConfig.players)
    && matchConfig.players.length === 2
    && matchConfig.players.every((player) => player && Number.isInteger(player.id)));
}

/** @param {{players: Array}} matchConfig @param {{currentPlayer: number}} state */
function getCurrentPlayerConfig(matchConfig, state) {
  return matchConfig.players.find((player) => player.id === state.currentPlayer) ?? null;
}

/** @param {{players: Array}} matchConfig @param {{currentPlayer: number}} state */
function isAITurn(matchConfig, state) {
  return getCurrentPlayerConfig(matchConfig, state)?.type === 'ai';
}

/** @param {{players: Array}} matchConfig @param {{currentPlayer: number}} state */
function isHumanTurn(matchConfig, state) {
  return !isAITurn(matchConfig, state);
}

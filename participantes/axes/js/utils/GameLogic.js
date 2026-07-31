/**
 * Crea un estado nuevo de Timbiriche sin depender de Phaser ni del DOM.
 * @param {number} size cantidad de puntos por lado
 * @returns {{size: number, lines: Array, boxes: Array, currentPlayer: number, scores: number[], gameOver: boolean}}
 */
function initBoard(size) {
  const lines = [];
  const boxes = [];

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size - 1; column += 1) {
      lines.push({ id: `h-${row}-${column}`, type: 'h', owner: null, position: [row, column] });
    }
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let column = 0; column < size; column += 1) {
      lines.push({ id: `v-${row}-${column}`, type: 'v', owner: null, position: [row, column] });
    }
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let column = 0; column < size - 1; column += 1) {
      boxes.push({
        id: `box-${row}-${column}`,
        position: [row, column],
        owner: null,
        edges: [`h-${row}-${column}`, `h-${row + 1}-${column}`, `v-${row}-${column}`, `v-${row}-${column + 1}`],
      });
    }
  }

  return { size, lines, boxes, currentPlayer: 0, scores: [0, 0], gameOver: false };
}

/** @param {{lines: Array, boxes: Array}} state @param {string} lineId @returns {string[]} */
function checkCompletedBoxes(state, lineId) {
  return state.boxes
    .filter((box) => box.owner === null && box.edges.includes(lineId))
    .filter((box) => box.edges.every((edgeId) => state.lines.find((line) => line.id === edgeId)?.owner !== null))
    .map((box) => box.id);
}

/**
 * Traza una línea de forma inmutable y devuelve el resultado de la jugada.
 * @param {ReturnType<typeof initBoard>} state
 * @param {string} lineId
 * @param {number} player
 * @returns {{state: ReturnType<typeof initBoard>, accepted: boolean, completedBoxIds: string[]}}
 */
function drawLine(state, lineId, player) {
  const target = state.lines.find((line) => line.id === lineId);
  if (!target || target.owner !== null || state.gameOver || player !== state.currentPlayer) {
    return { state, accepted: false, completedBoxIds: [] };
  }

  const nextState = {
    ...state,
    lines: state.lines.map((line) => (line.id === lineId ? { ...line, owner: player } : { ...line })),
    boxes: state.boxes.map((box) => ({ ...box })),
    scores: [...state.scores],
  };
  const completedBoxIds = checkCompletedBoxes(nextState, lineId);
  nextState.boxes = nextState.boxes.map((box) => (
    completedBoxIds.includes(box.id) ? { ...box, owner: player } : box
  ));
  nextState.scores[player] += completedBoxIds.length;
  nextState.gameOver = isGameOver(nextState);

  // Completar un cuadro conserva el turno; si no, pasa al otro jugador.
  if (completedBoxIds.length === 0 && !nextState.gameOver) {
    nextState.currentPlayer = player === 0 ? 1 : 0;
  }

  return { state: nextState, accepted: true, completedBoxIds };
}

/** @param {{lines: Array}} state @returns {boolean} */
function isGameOver(state) {
  return state.lines.every((line) => line.owner !== null);
}

/** @param {{scores: number[]}} state @returns {number|null} */
function getWinner(state) {
  if (state.scores[0] === state.scores[1]) return null;
  return state.scores[0] > state.scores[1] ? 0 : 1;
}

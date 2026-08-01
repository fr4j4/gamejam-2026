/**
 * Estrategia HARD: tácticas, evaluación y minimax limitado.
 * Este archivo solo trabaja con estados serializables y GameLogic.
 */

function hardNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function hardCountOccupiedEdges(state, box) {
  return box.edges.filter((edgeId) => state.lines.find((line) => line.id === edgeId)?.owner !== null).length;
}

function hardThreatenedBoxes(state, lineId) {
  const result = applyMove(state, lineId);
  if (!result.accepted) return { result: null, completed: 0, threatened: 0 };
  const threatened = result.state.boxes.filter((box) => (
    box.owner === null && hardCountOccupiedEdges(result.state, box) === 3
  )).length;
  return { result, completed: result.completedBoxIds.length, threatened };
}

function countCompletedBoxes(state, lineId) {
  return getCompletedBoxesForMove(state, lineId).length;
}

function countBoxesGivenToOpponent(state, lineId) {
  return hardThreatenedBoxes(state, lineId).threatened;
}

function countSafeMoves(state) {
  return getAvailableMoves(state).filter((lineId) => {
    const move = hardThreatenedBoxes(state, lineId);
    return move.completed === 0 && move.threatened === 0;
  }).length;
}

/** Aproxima la cadena más larga conectada a las cajas expuestas tras una jugada. */
function estimateChainRisk(state, lineId) {
  const move = hardThreatenedBoxes(state, lineId);
  if (!move.result) return Number.POSITIVE_INFINITY;

  const nextState = move.result.state;
  const boxes = nextState.boxes.filter((box) => box.owner === null);
  const exposed = new Set(boxes
    .filter((box) => hardCountOccupiedEdges(nextState, box) >= 3)
    .map((box) => box.id));
  let largestChain = 0;

  while (exposed.size > 0) {
    const queue = [exposed.values().next().value];
    const visited = new Set(queue);
    exposed.delete(queue[0]);
    while (queue.length > 0) {
      const current = nextState.boxes.find((box) => box.id === queue.shift());
      if (!current) continue;
      const connected = boxes.filter((candidate) => (
        candidate.id !== current.id
        && candidate.edges.some((edgeId) => current.edges.includes(edgeId))
        && exposed.has(candidate.id)
      ));
      connected.forEach((candidate) => {
        if (visited.has(candidate.id)) return;
        visited.add(candidate.id);
        exposed.delete(candidate.id);
        queue.push(candidate.id);
      });
    }
    largestChain = Math.max(largestChain, visited.size);
  }

  return largestChain;
}

function hardEvaluateBoard(state, aiPlayerId) {
  const opponentId = aiPlayerId === 0 ? 1 : 0;
  const scoreDifference = state.scores[aiPlayerId] - state.scores[opponentId];
  if (state.gameOver || isGameOver(state)) {
    return scoreDifference * HARD_AI_WEIGHTS.scoreDifference * 10;
  }

  const availableMoves = getAvailableMoves(state);
  const safeMoves = countSafeMoves(state);
  const currentPlayerFactor = state.currentPlayer === aiPlayerId ? 1 : -1;
  const threatened = availableMoves.reduce((total, lineId) => (
    total + countBoxesGivenToOpponent(state, lineId)
  ), 0);

  return (scoreDifference * HARD_AI_WEIGHTS.scoreDifference)
    + (safeMoves * HARD_AI_WEIGHTS.safeMove)
    + (availableMoves.length * HARD_AI_WEIGHTS.futureMobility)
    + (currentPlayerFactor * HARD_AI_WEIGHTS.turnControl)
    + (threatened * HARD_AI_WEIGHTS.givesBox);
}

function hardMovePriority(state, lineId) {
  const move = hardThreatenedBoxes(state, lineId);
  if (!move.result) return Number.NEGATIVE_INFINITY;
  const chainRisk = estimateChainRisk(state, lineId);
  const safe = move.completed === 0 && move.threatened === 0 ? 1 : 0;
  return (move.completed * HARD_AI_WEIGHTS.completedBox)
    + (safe * HARD_AI_WEIGHTS.safeMove)
    + (move.threatened * HARD_AI_WEIGHTS.givesBox)
    + (chainRisk * HARD_AI_WEIGHTS.chainRisk);
}

/** Ordena para mejorar la poda: cajas, seguros, riesgo y cadenas. */
function orderMoves(state, moves) {
  return [...moves].sort((left, right) => {
    const difference = hardMovePriority(state, right) - hardMovePriority(state, left);
    return difference || String(left).localeCompare(String(right));
  });
}

function hardTimedOut(context) {
  return context.now() >= context.deadline;
}

function hardMinimax(state, depth, alpha, beta, aiPlayerId, context) {
  context.nodes += 1;
  if (hardTimedOut(context) || depth <= 0 || state.gameOver || isGameOver(state)) {
    return { score: hardEvaluateBoard(state, aiPlayerId), move: null, complete: !hardTimedOut(context) };
  }

  const candidateMoves = state === context.rootState && context.rootMoves
    ? context.rootMoves
    : getAvailableMoves(state);
  const moves = orderMoves(state, candidateMoves);
  if (moves.length === 0) return { score: hardEvaluateBoard(state, aiPlayerId), move: null, complete: true };

  const maximizing = state.currentPlayer === aiPlayerId;
  let bestScore = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  let bestMove = moves[0];
  const rootScores = state === context.rootState ? [] : null;

  for (const lineId of moves) {
    const result = applyMove(state, lineId);
    if (!result.accepted) continue;
    const child = hardMinimax(result.state, depth - 1, alpha, beta, aiPlayerId, context);
    if (!child.complete) return { score: hardEvaluateBoard(state, aiPlayerId), move: bestMove, complete: false };
    rootScores?.push({ move: lineId, score: child.score });

    if ((maximizing && child.score > bestScore) || (!maximizing && child.score < bestScore)) {
      bestScore = child.score;
      bestMove = lineId;
    }
    if (maximizing) alpha = Math.max(alpha, bestScore);
    else beta = Math.min(beta, bestScore);
    if (beta <= alpha) {
      context.prunes += 1;
      break;
    }
  }

  return { score: bestScore, move: bestMove, complete: true, rootScores };
}

function hardFallbackMove(state, options) {
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return null;
  const scored = moves
    .map((lineId) => ({ lineId, count: countCompletedBoxes(state, lineId) }))
    .sort((left, right) => right.count - left.count);
  const bestScore = scored[0].count;
  const bestScoring = scored.filter((entry) => entry.count === bestScore).map((entry) => entry.lineId);
  if (bestScore > 0) return hardChooseVariant(bestScoring, options);

  const safe = moves.filter((lineId) => {
    const move = hardThreatenedBoxes(state, lineId);
    return move.threatened === 0;
  });
  return hardChooseVariant(safe.length > 0 ? safe : orderMoves(state, moves).slice(0, 1), options);
}

function hardChooseVariant(moves, options = {}) {
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];
  const randomValue = normalizeRandom(options.random);
  if (randomValue >= HARD_AI_CONFIG.topMoveRandomness) return moves[0];
  const scaledValue = randomValue / HARD_AI_CONFIG.topMoveRandomness;
  return moves[Math.min(moves.length - 1, Math.floor(scaledValue * moves.length))];
}

function chooseNearBestRootMove(rootScores, options) {
  if (!rootScores || rootScores.length === 0) return null;
  const bestScore = Math.max(...rootScores.map((entry) => entry.score));
  const nearBest = rootScores
    .filter((entry) => entry.score >= bestScore - HARD_AI_CONFIG.scoreTolerance)
    .map((entry) => entry.move);
  return hardChooseVariant(nearBest, options);
}

/** Ejecuta HARD con tácticas e iterative deepening limitado por tiempo. */
function chooseHardMove(state, options = {}) {
  const availableMoves = getAvailableMoves(state);
  if (availableMoves.length === 0 || state.gameOver) return null;

  const scoringMoves = availableMoves.filter((lineId) => countCompletedBoxes(state, lineId) > 0);
  if (scoringMoves.length > 0) {
    const maxCompleted = Math.max(...scoringMoves.map((lineId) => countCompletedBoxes(state, lineId)));
    return hardChooseVariant(
      scoringMoves.filter((lineId) => countCompletedBoxes(state, lineId) === maxCompleted),
      options,
    );
  }

  const orderedFallback = orderMoves(state, availableMoves);
  let bestMove = hardFallbackMove(state, options) ?? orderedFallback[0];
  const safeMoves = availableMoves.filter((lineId) => {
    const move = hardThreatenedBoxes(state, lineId);
    return move.completed === 0 && move.threatened === 0;
  });
  const now = options.now ?? hardNow;
  const maxThinkTimeMs = options.maxThinkTimeMs ?? HARD_AI_CONFIG.maxThinkTimeMs;
  const context = {
    now,
    deadline: now() + Math.max(0, maxThinkTimeMs),
    nodes: 0,
    prunes: 0,
    rootState: state,
    rootMoves: safeMoves.length > 0 ? safeMoves : availableMoves,
  };
  const remainingMoves = availableMoves.length;
  const baseDepth = HARD_AI_CONFIG.depthsByBoardSize[state.size] ?? 2;
  const maxDepth = remainingMoves <= 6 ? Math.min(remainingMoves, baseDepth + 3) : baseDepth;

  for (let depth = 1; depth <= maxDepth && !hardTimedOut(context); depth += 1) {
    const result = hardMinimax(state, depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, state.currentPlayer, context);
    if (!result.complete) break;
    const variedMove = chooseNearBestRootMove(result.rootScores, options);
    if (variedMove) bestMove = variedMove;
    else if (result.move) bestMove = result.move;
  }

  return bestMove;
}

/*
 * Pruebas mínimas sin navegador para GameLogic y AIStrategy.
 * Ejecutar desde la raíz: node participantes/axes/js/ai/AIStrategy.test.js
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ console, Math });
const files = [
  '../utils/Constants.js',
  '../utils/GameLogic.js',
  '../utils/MatchConfig.js',
  './AIStrategy.js',
];
files.forEach((relativePath) => {
  const filePath = path.join(__dirname, relativePath);
  vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
});

const state = context.initBoard(3);
const moves = context.getAvailableMoves(state);
assert.equal(moves.length, 12);
assert.deepEqual(context.chooseMove(state, 'easy', { random: () => 0 }), moves[0]);
assert.deepEqual(context.chooseMove(state, 'easy', { random: () => 0.99999 }), moves.at(-1));

const snapshot = JSON.stringify(state);
const result = context.applyMove(state, moves[0]);
assert.equal(result.accepted, true);
assert.notEqual(result.state, state);
assert.equal(JSON.stringify(state), snapshot);
assert.equal(context.getAvailableMoves(result.state).includes(moves[0]), false);

const finishedState = {
  ...state,
  lines: state.lines.map((line) => ({ ...line, owner: 0 })),
  gameOver: true,
};
assert.equal(context.getAvailableMoves(finishedState).length, 0);
assert.equal(context.chooseMove(finishedState), null);

const localConfig = context.createMatchConfig(3, 'local');
const aiConfig = context.createMatchConfig(3, 'vs-ai');
const clonedAiConfig = context.cloneMatchConfig(aiConfig);
assert.notEqual(clonedAiConfig, aiConfig);
assert.deepEqual(JSON.parse(JSON.stringify(clonedAiConfig)), JSON.parse(JSON.stringify(aiConfig)));
assert.notEqual(clonedAiConfig.players, aiConfig.players);
assert.equal(context.isHumanTurn(localConfig, state), true);
assert.equal(context.isAITurn(aiConfig, state), false);
assert.equal(context.isAITurn(aiConfig, { ...state, currentPlayer: 1 }), true);

console.log('AIStrategy tests: OK');

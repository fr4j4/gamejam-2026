const test = require('node:test');
const assert = require('node:assert/strict');

const { beamGeometry, miracleOutcome } = require('./gameplay.js');

test('el cono termina exactamente en la línea del suelo', () => {
  assert.deepEqual(beamGeometry(400, 480), {
    outer: [[340, 0], [460, 0], [530, 480], [270, 480]],
    inner: [[374, 0], [426, 0], [462, 480], [338, 480]],
    impact: { x: 400, y: 480, radius: 130 }
  });
});

test('hambre, miedo y duda se convierten sin azar', () => {
  assert.deepEqual(miracleOutcome('hambre'), { next: 'fe', feedback: 'HAMBRE → FE', converted: true });
  assert.deepEqual(miracleOutcome('miedo'), { next: 'fe', feedback: 'MIEDO → FE', converted: true });
  assert.deepEqual(miracleOutcome('duda'), { next: 'fe', feedback: 'DUDA → FE', converted: true });
});

test('la ciencia resiste y la fe permanece', () => {
  assert.deepEqual(miracleOutcome('ciencia'), { next: 'ciencia', feedback: 'CIENCIA: RESISTE', converted: false });
  assert.deepEqual(miracleOutcome('fe'), { next: 'fe', feedback: 'FE: YA CREÍA', converted: false });
});

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  beamGeometry,
  interpretPower,
  shiftPendulum,
  attentionRegen,
  prosperityRate,
  ambientTransition
} = require('./gameplay.js');

test('el cono termina exactamente en la línea del suelo', () => {
  assert.deepEqual(beamGeometry(400, 480), {
    outer: [[340, 0], [460, 0], [530, 480], [270, 480]],
    inner: [[374, 0], [426, 0], [462, 480], [338, 480]],
    impact: { x: 400, y: 480, radius: 130 }
  });
});

test('asombro convierte crisis y duda, pero no ciencia', () => {
  assert.deepEqual(interpretPower('asombro', 'hambre'), { next: 'fe', feedback: 'HAMBRE → FE', converted: true });
  assert.deepEqual(interpretPower('asombro', 'duda'), { next: 'fe', feedback: 'DUDA → FE', converted: true });
  assert.deepEqual(interpretPower('asombro', 'ciencia'), { next: 'ciencia', feedback: 'CIENCIA: RESISTE', converted: false });
});

test('los otros poderes preparan estados con tradeoffs distintos', () => {
  assert.equal(interpretPower('miedo', 'fe').next, 'miedo');
  assert.equal(interpretPower('humillacion', 'ciencia').next, 'duda');
  assert.equal(interpretPower('humillacion', 'fe').next, 'duda');
  assert.equal(interpretPower('consuelo', 'hambre').next, 'fe');
  assert.equal(interpretPower('consuelo', 'duda').next, 'ciencia');
});

test('cada poder empuja el péndulo y lo limita a sus extremos', () => {
  assert.equal(shiftPendulum(0, 'miedo'), -28);
  assert.equal(shiftPendulum(-90, 'humillacion'), -100);
  assert.equal(shiftPendulum(80, 'consuelo'), 100);
});

test('la crisis genera atención y el confort genera prosperidad', () => {
  assert.ok(attentionRegen(-80, 2) > attentionRegen(0, 2));
  assert.equal(prosperityRate(0), 0);
  assert.ok(prosperityRate(80) > 0);
  assert.ok(prosperityRate(-80) < 0);
});

test('el ambiente deriva hacia fervor en crisis y ciencia en confort', () => {
  assert.equal(ambientTransition('duda', -70, 0.2), 'fe');
  assert.equal(ambientTransition('duda', 70, 0.2), 'ciencia');
  assert.equal(ambientTransition('ciencia', 70, 0.9), 'ciencia');
});

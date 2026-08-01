const test = require('node:test');
const assert = require('node:assert/strict');

const { advanceWalker, villagerAppearance } = require('./movement.js');

test('avanza de forma independiente del framerate', () => {
  const walker = { x: 100, direction: 1, speed: 8 };

  assert.deepEqual(advanceWalker(walker, 500, 88, 112), {
    x: 104,
    direction: 1,
    speed: 8
  });
});

test('rebota dentro de su carril sin invadir al aldeano vecino', () => {
  const walker = { x: 111, direction: 1, speed: 8 };

  assert.deepEqual(advanceWalker(walker, 500, 88, 112), {
    x: 109,
    direction: -1,
    speed: 8
  });
});

test('conserva el exceso de recorrido al rebotar', () => {
  const walker = { x: 110, direction: 1, speed: 20 };

  assert.deepEqual(advanceWalker(walker, 500, 88, 112), {
    x: 104,
    direction: -1,
    speed: 20
  });
});

test('distribuye oficios legibles entre los nueve habitantes', () => {
  const appearances = Array.from({ length: 9 }, (_, index) => villagerAppearance(index));

  assert.deepEqual(appearances.map(({ role }) => role), [
    'aldeano', 'trabajador', 'soldado', 'sacerdote', 'erudito',
    'aldeano', 'trabajador', 'soldado', 'sacerdote'
  ]);
  assert.ok(appearances.every(({ scale }) => scale >= 1.05 && scale <= 1.3));
});

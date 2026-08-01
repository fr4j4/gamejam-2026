const test = require('node:test');
const assert = require('node:assert/strict');

const { advanceWalker } = require('./movement.js');

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

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  cameraSpeed,
  screenX,
  isCaughtByCamera,
  torqueForInput,
  choosePartToShed,
  jumpForceForMass,
  canHop
} = require('./mass-model.js');

test('la cámara acelera suavemente y tiene un límite', () => {
  assert.equal(cameraSpeed(0), 72);
  assert.equal(cameraSpeed(30), 84);
  assert.equal(cameraSpeed(999), 108);
});

test('la derrota depende de la posición relativa a cámara', () => {
  assert.equal(screenX(250, 100), 150);
  assert.equal(isCaughtByCamera(145, 100, 40), false);
  assert.equal(isCaughtByCamera(139, 100, 40), true);
});

test('dos teclas producen torque opuesto y se cancelan juntas', () => {
  assert.equal(torqueForInput(true, false, 0.04), -0.04);
  assert.equal(torqueForInput(false, true, 0.04), 0.04);
  assert.equal(torqueForInput(true, true, 0.04), 0);
});

test('el raspado desprende la parte externa del lado golpeado', () => {
  const parts = [
    { id: 'core', x: 100, isCore: true },
    { id: 'leftNear', x: 85 },
    { id: 'leftFar', x: 60 },
    { id: 'right', x: 140 }
  ];

  assert.equal(choosePartToShed(parts, 100, 70), 'leftFar');
  assert.equal(choosePartToShed(parts, 100, 150), 'right');
  assert.equal(choosePartToShed([parts[0]], 100, 150), null);
});

test('el pulso aumenta sublinealmente: más masa recibe menos aceleración', () => {
  const lightForce = jumpForceForMass(2, 2, 0.04);
  const heavyForce = jumpForceForMass(8, 2, 0.04);

  assert.equal(lightForce, 0.04);
  assert.equal(heavyForce, 0.08);
  assert.ok(heavyForce / 8 < lightForce / 2);
});

test('solo puede pulsar apoyado y fuera del cooldown', () => {
  assert.equal(canHop(378, 380, 0), true);
  assert.equal(canHop(350, 380, 0), false);
  assert.equal(canHop(378, 380, 10), false);
});

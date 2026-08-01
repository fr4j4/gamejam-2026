const test = require('node:test');
const assert = require('node:assert/strict');

const {
  cameraSpeed,
  screenX,
  isCaughtByCamera,
  torqueForInput,
  choosePartToShed,
  jumpForceForMass,
  canHop,
  scrapSpecForIndex,
  routeMessage,
  scrapValue,
  scoreDelivery,
  belongsToCompound
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

test('la chatarra alterna formas cuya medida define el collider', () => {
  assert.deepEqual(scrapSpecForIndex(0), { kind: 'gear', radius: 7 });
  assert.deepEqual(scrapSpecForIndex(1), { kind: 'plate', width: 18, height: 8 });
  assert.deepEqual(scrapSpecForIndex(2), { kind: 'nut', radius: 9, sides: 6 });
  assert.deepEqual(scrapSpecForIndex(3), { kind: 'gear', radius: 10 });
});

test('la ruta comunica el basurero sin interrumpir el juego', () => {
  assert.equal(routeMessage(0, 12000), 'BASURERO MUNICIPAL 1200 m');
  assert.equal(routeMessage(11850, 12000), 'YA SE VE EL BASURERO');
  assert.equal(routeMessage(12000, 12000), 'DESTINO ALCANZADO');
});

test('cada forma y tamano de chatarra tiene un valor determinista', () => {
  assert.equal(scrapValue({ kind: 'gear', radius: 7 }), 10);
  assert.equal(scrapValue({ kind: 'gear', radius: 13 }), 30);
  assert.equal(scrapValue({ kind: 'plate', width: 18, height: 8 }), 15);
  assert.equal(scrapValue({ kind: 'plate', width: 26, height: 12 }), 35);
  assert.equal(scrapValue({ kind: 'nut', radius: 9 }), 20);
  assert.equal(scrapValue({ kind: 'nut', radius: 13 }), 40);
});

test('la puntuacion suma solo valor entregado y un bonus de tiempo no negativo', () => {
  assert.deepEqual(scoreDelivery(125, 150), {
    deliveredValue: 125,
    elapsedSeconds: 150,
    timeBonus: 300,
    total: 425
  });
  assert.deepEqual(scoreDelivery(0, 181), {
    deliveredValue: 0,
    elapsedSeconds: 181,
    timeBonus: 0,
    total: 0
  });
  assert.equal(scoreDelivery(80, -5).timeBonus, 1800);
});

test('el nucleo, el root y cualquier child pertenecen al mismo compuesto', () => {
  const compound = { id: 'blob' };
  const child = { id: 'scrap', parent: compound };
  const stranger = { id: 'soft', parent: { id: 'soft-root' } };
  assert.equal(belongsToCompound(compound, compound), true);
  assert.equal(belongsToCompound(child, compound), true);
  assert.equal(belongsToCompound(stranger, compound), false);
  assert.equal(belongsToCompound(null, compound), false);
});

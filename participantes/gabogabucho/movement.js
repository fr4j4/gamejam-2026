(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ApocryphaMovement = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const APPEARANCES = [
    { role: 'aldeano', key: 'aldeano0', file: 'aldeano_00_25x46.png', scale: 1.15 },
    { role: 'trabajador', key: 'trabajador0', file: 'trabajador_00_31x45.png', scale: 1.18 },
    { role: 'soldado', key: 'soldado2', file: 'soldado_02_40x50.png', scale: 1.06 },
    { role: 'sacerdote', key: 'sacerdote0', file: 'sacerdote_00_40x46.png', scale: 1.15 },
    { role: 'erudito', key: 'erudito1', file: 'erudito_01_36x42.png', scale: 1.26 },
    { role: 'aldeano', key: 'aldeano3', file: 'aldeano_03_24x43.png', scale: 1.23 },
    { role: 'trabajador', key: 'trabajador3', file: 'trabajador_03_34x45.png', scale: 1.18 },
    { role: 'soldado', key: 'soldado4', file: 'soldado_04_33x42.png', scale: 1.26 },
    { role: 'sacerdote', key: 'sacerdote1', file: 'sacerdote_01_35x44.png', scale: 1.2 }
  ];

  function villagerAppearance(index) {
    return { ...APPEARANCES[index % APPEARANCES.length] };
  }

  function advanceWalker(walker, deltaMs, minX, maxX) {
    let x = walker.x + walker.direction * walker.speed * deltaMs / 1000;
    let direction = walker.direction;

    while (x < minX || x > maxX) {
      if (x > maxX) {
        x = maxX - (x - maxX);
        direction = -1;
      } else if (x < minX) {
        x = minX + (minX - x);
        direction = 1;
      }
    }

    return { x, direction, speed: walker.speed };
  }

  return { advanceWalker, villagerAppearance };
});

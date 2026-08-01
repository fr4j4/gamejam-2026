(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ApocryphaMovement = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
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

  return { advanceWalker };
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LastreModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function cameraSpeed(elapsedSeconds) {
    return Math.min(108, 72 + elapsedSeconds * 0.4);
  }

  function screenX(worldX, cameraX) {
    return worldX - cameraX;
  }

  function isCaughtByCamera(worldX, cameraX, leftMargin) {
    return screenX(worldX, cameraX) < leftMargin;
  }

  function torqueForInput(left, right, strength) {
    if (left === right) return 0;
    return left ? -strength : strength;
  }

  function choosePartToShed(parts, centerX, impactX) {
    const candidates = parts.filter(part => !part.isCore && (impactX < centerX ? part.x < centerX : part.x >= centerX));
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => Math.abs(b.x - centerX) - Math.abs(a.x - centerX));
    return candidates[0].id;
  }

  function jumpForceForMass(mass, coreMass, baseForce) {
    return baseForce * Math.sqrt(Math.max(1, mass / coreMass));
  }

  function canHop(boundsMaxY, groundY, cooldownMs) {
    return cooldownMs <= 0 && boundsMaxY >= groundY - 5;
  }

  function scrapSpecForIndex(index) {
    const sizeStep = Math.floor(index / 3) % 3;
    if (index % 3 === 0) return { kind: 'gear', radius: 7 + sizeStep * 3 };
    if (index % 3 === 1) return { kind: 'plate', width: 18 + sizeStep * 4, height: 8 + sizeStep * 2 };
    return { kind: 'nut', radius: 9 + sizeStep * 2, sides: 6 };
  }

  function routeMessage(distance, destination) {
    const remaining = Math.max(0, destination - distance);
    if (remaining === 0) return 'DESTINO ALCANZADO';
    if (remaining <= 150) return 'YA SE VE EL BASURERO';
    return `BASURERO MUNICIPAL ${Math.ceil(remaining / 10)} m`;
  }

  return {
    cameraSpeed,
    screenX,
    isCaughtByCamera,
    torqueForInput,
    choosePartToShed,
    jumpForceForMass,
    canHop,
    scrapSpecForIndex,
    routeMessage
  };
});

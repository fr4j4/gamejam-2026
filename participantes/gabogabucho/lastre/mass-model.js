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

  function scrapValue(spec) {
    if (spec.kind === 'gear') return 10 + Math.max(0, Math.round((spec.radius - 7) / 3)) * 10;
    if (spec.kind === 'plate') return 15 + Math.max(0, Math.round((spec.width - 18) / 4)) * 10;
    if (spec.kind === 'nut') return 20 + Math.max(0, Math.round((spec.radius - 9) / 2)) * 10;
    return 0;
  }

  function scoreDelivery(deliveredValue, elapsedSeconds) {
    const seconds = Math.max(0, Math.floor(elapsedSeconds));
    const value = Math.max(0, Math.floor(deliveredValue));
    const timeBonus = Math.max(0, 180 - seconds) * 10;
    return {
      deliveredValue: value,
      elapsedSeconds: seconds,
      timeBonus,
      total: value + timeBonus
    };
  }

  function belongsToCompound(body, compound) {
    return Boolean(body && compound && (body === compound || body.parent === compound));
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
    routeMessage,
    scrapValue,
    scoreDelivery,
    belongsToCompound
  };
});

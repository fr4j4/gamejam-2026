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

  return {
    cameraSpeed,
    screenX,
    isCaughtByCamera,
    torqueForInput,
    choosePartToShed,
    jumpForceForMass,
    canHop
  };
});

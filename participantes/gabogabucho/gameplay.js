(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ApocryphaGameplay = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function beamGeometry(x, groundY) {
    return {
      outer: [[x - 60, 0], [x + 60, 0], [x + 130, groundY], [x - 130, groundY]],
      inner: [[x - 26, 0], [x + 26, 0], [x + 62, groundY], [x - 62, groundY]],
      impact: { x, y: groundY, radius: 130 }
    };
  }

  function miracleOutcome(state) {
    const outcomes = {
      hambre: { next: 'fe', feedback: 'HAMBRE → FE', converted: true },
      miedo: { next: 'fe', feedback: 'MIEDO → FE', converted: true },
      duda: { next: 'fe', feedback: 'DUDA → FE', converted: true },
      ciencia: { next: 'ciencia', feedback: 'CIENCIA: RESISTE', converted: false },
      fe: { next: 'fe', feedback: 'FE: YA CREÍA', converted: false }
    };
    return { ...(outcomes[state] || outcomes.hambre) };
  }

  return { beamGeometry, miracleOutcome };
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ApocryphaGameplay = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const POWERS = {
    asombro: { label: 'ASOMBRO', cost: 30, swing: -12, radius: 130, effect: 'beam' },
    miedo: { label: 'MIEDO', cost: 22, swing: -28, radius: 150, effect: 'fear' },
    humillacion: { label: 'HUMILLACIÓN', cost: 18, swing: -16, radius: 105, effect: 'fall' },
    consuelo: { label: 'CONSUELO', cost: 24, swing: 28, radius: 125, effect: 'warmth' }
  };

  function beamGeometry(x, groundY) {
    return {
      outer: [[x - 60, 0], [x + 60, 0], [x + 130, groundY], [x - 130, groundY]],
      inner: [[x - 26, 0], [x + 26, 0], [x + 62, groundY], [x - 62, groundY]],
      impact: { x, y: groundY, radius: 130 }
    };
  }

  function interpretPower(power, state) {
    const readings = {
      asombro: { hambre: 'fe', miedo: 'fe', duda: 'fe', ciencia: 'ciencia', fe: 'fe' },
      miedo: { hambre: 'miedo', miedo: 'miedo', duda: 'miedo', ciencia: 'ciencia', fe: 'miedo' },
      humillacion: { hambre: 'duda', miedo: 'duda', duda: 'duda', ciencia: 'duda', fe: 'duda' },
      consuelo: { hambre: 'fe', miedo: 'duda', duda: 'ciencia', ciencia: 'ciencia', fe: 'fe' }
    };
    const next = (readings[power] || readings.asombro)[state] || 'hambre';
    let feedback = `${state.toUpperCase()} → ${next.toUpperCase()}`;
    if (power === 'asombro' && state === 'ciencia') feedback = 'CIENCIA: RESISTE';
    if (power === 'asombro' && state === 'fe') feedback = 'FE: YA CREÍA';
    if (state === next && power !== 'asombro') feedback = `${next.toUpperCase()}: PERSISTE`;
    return { next, feedback, converted: state !== 'fe' && next === 'fe' };
  }

  function shiftPendulum(value, power) {
    const swing = (POWERS[power] || POWERS.asombro).swing;
    return Math.max(-100, Math.min(100, value + swing));
  }

  function relaxPendulum(value, deltaMs) {
    const step = 1.2 * deltaMs / 1000;
    if (Math.abs(value) <= step) return 0;
    return value - Math.sign(value) * step;
  }

  function attentionRegen(pendulum, faithful) {
    const fervor = Math.max(0, -pendulum) / 100;
    return 0.12 + faithful * 0.22 + fervor * 1.25;
  }

  function prosperityRate(pendulum) {
    if (pendulum > 35) return (pendulum - 35) / 65 * 1.8;
    if (pendulum < -35) return -(Math.abs(pendulum) - 35) / 65 * 0.45;
    return 0;
  }

  function ambientTransition(state, pendulum, roll) {
    if (pendulum > 35) {
      const comfort = {
        hambre: roll < 0.6 ? 'duda' : 'fe',
        miedo: roll < 0.55 ? 'duda' : 'fe',
        fe: roll < 0.55 ? 'duda' : 'fe',
        duda: roll < 0.65 ? 'ciencia' : 'duda',
        ciencia: 'ciencia'
      };
      return comfort[state] || 'duda';
    }
    if (pendulum < -35) {
      const crisis = {
        hambre: roll < 0.6 ? 'miedo' : 'hambre',
        miedo: roll < 0.45 ? 'fe' : 'miedo',
        fe: roll < 0.7 ? 'fe' : 'miedo',
        duda: roll < 0.5 ? 'fe' : 'miedo',
        ciencia: roll < 0.2 ? 'duda' : 'ciencia'
      };
      return crisis[state] || 'miedo';
    }
    const middle = {
      hambre: roll < 0.45 ? 'miedo' : (roll < 0.8 ? 'hambre' : 'duda'),
      miedo: roll < 0.35 ? 'fe' : (roll < 0.7 ? 'miedo' : 'hambre'),
      fe: roll < 0.45 ? 'fe' : (roll < 0.8 ? 'duda' : 'miedo'),
      duda: roll < 0.35 ? 'ciencia' : (roll < 0.65 ? 'duda' : (roll < 0.85 ? 'hambre' : 'fe')),
      ciencia: roll < 0.45 ? 'ciencia' : (roll < 0.85 ? 'duda' : 'fe')
    };
    return middle[state] || 'hambre';
  }

  return {
    POWERS,
    beamGeometry,
    interpretPower,
    shiftPendulum,
    relaxPendulum,
    attentionRegen,
    prosperityRate,
    ambientTransition
  };
});

import { DODGE_CAP } from './constants.js';

// Cada mejora tiene:
//   describe(before, after) -> texto de la card, mostrando el antes→después
//   apply(stats)            -> muta las stats (única fuente de verdad de la fórmula)
//   isMaxed(stats)          -> opcional; si devuelve true la mejora deja de ofrecerse
// Las stats viven como float internamente y se redondean solo al mostrarse, porque
// el escalado pasivo del +1% por nivel se perdería si redondeáramos en cada paso.

export const STAT_UPGRADES = [
  {
    key: 'damage', rarity: 'common',
    describe: (b, a) => `Daño (todas las armas): ${Math.round(b.damage)} → ${Math.round(a.damage)}`,
    apply: (s) => {
      s.damage += 8;
      if (s.hasAura) s.auraDamage += 8;
      if (s.hasOrbit) s.orbitDamage += 8;
      if (s.hasPierce) s.pierceDamage += 8;
      if (s.hasBurst) s.burstDamage += 8;
      if (s.hasNova) s.novaDamage += 8;
    },
  },
  {
    key: 'fireRate', rarity: 'common',
    describe: (b, a) => `Cadencia: ${(1000 / b.fireRate).toFixed(1)}/s → ${(1000 / a.fireRate).toFixed(1)}/s`,
    apply: (s) => { s.fireRate = Math.max(130, Math.round(s.fireRate * 0.8)); },
    isMaxed: (s) => s.fireRate <= 130,
  },
  {
    key: 'moveSpeed', rarity: 'common', describe: (b, a) => `Velocidad: ${Math.round(b.moveSpeed)} → ${Math.round(a.moveSpeed)}`,
    apply: (s) => { s.moveSpeed = Math.min(480, Math.round(s.moveSpeed * 1.15)); },
    isMaxed: (s) => s.moveSpeed >= 480,
  },
  { key: 'maxHp', rarity: 'common', describe: (b, a) => `HP máximo: ${Math.round(b.maxHp)} → ${Math.round(a.maxHp)}`, apply: (s) => { s.maxHp += 30; s.hp += 30; } },
  {
    key: 'magnet', rarity: 'common', describe: (b, a) => `Radio de imán: ${Math.round(b.magnetRadius)} → ${Math.round(a.magnetRadius)}`,
    apply: (s) => { s.magnetRadius = Math.min(550, Math.round(s.magnetRadius * 1.5)); },
    isMaxed: (s) => s.magnetRadius >= 550,
  },
  {
    key: 'hpRegen', rarity: 'common',
    describe: (b, a) => `Regeneración: ${b.hpRegen.toFixed(1)}/s → ${a.hpRegen.toFixed(1)}/s`,
    apply: (s) => { s.hpRegen += 1.2; },
  },
  {
    key: 'lifesteal', rarity: 'rare',
    describe: (b, a) => `Robo de vida: ${(b.lifesteal * 100).toFixed(0)}% → ${(a.lifesteal * 100).toFixed(0)}%`,
    apply: (s) => { s.lifesteal += 0.05; },
  },
  {
    key: 'dodge', rarity: 'rare',
    describe: (b, a) => `Esquivar: ${(b.dodge * 100).toFixed(0)}% → ${(a.dodge * 100).toFixed(0)}%`,
    apply: (s) => { s.dodge = Math.min(DODGE_CAP, s.dodge + 0.07); },
    isMaxed: (s) => s.dodge >= DODGE_CAP,
  },
  {
    key: 'shield', rarity: 'epic',
    describe: (b, a) => `Escudo: ${Math.round(b.shieldMax)} → ${Math.round(a.shieldMax)}`,
    apply: (s) => { s.shieldMax += 35; s.shield = s.shieldMax; },
  },
];

// Cada arma tiene un `unlock` (se ofrece mientras no la tengas) y sus `upgrades`
// (se ofrece una al azar entre las no maxeadas, una vez desbloqueada).
export const WEAPON_UPGRADES = {
  aura: {
    unlock: {
      key: 'auraUnlock', rarity: 'epic',
      describe: (b, a) => `Nueva arma: Aura de daño (${a.auraDamage} dmg, radio ${a.auraRadius})`,
      apply: (s) => { s.hasAura = true; s.auraDamage = 10; s.auraRadius = 100; s.auraTickMs = 600; },
    },
    upgrades: [
      { key: 'auraDamage', rarity: 'common', describe: (b, a) => `Aura daño: ${Math.round(b.auraDamage)} → ${Math.round(a.auraDamage)}`, apply: (s) => { s.auraDamage += 8; } },
      {
        key: 'auraRadius', rarity: 'common', describe: (b, a) => `Aura radio: ${Math.round(b.auraRadius)} → ${Math.round(a.auraRadius)}`,
        apply: (s) => { s.auraRadius = Math.min(420, Math.round(s.auraRadius * 1.3)); },
        isMaxed: (s) => s.auraRadius >= 420,
      },
    ],
  },
  orbit: {
    unlock: {
      key: 'orbitUnlock', rarity: 'epic',
      describe: (b, a) => `Nueva arma: Orbe giratorio (${a.orbitCount} orbes, ${a.orbitDamage} dmg)`,
      apply: (s) => { s.hasOrbit = true; s.orbitDamage = 10; s.orbitRadius = 70; s.orbitSpeed = 2.2; s.orbitCount = 2; },
    },
    upgrades: [
      { key: 'orbitDamage', rarity: 'common', describe: (b, a) => `Orbe daño: ${Math.round(b.orbitDamage)} → ${Math.round(a.orbitDamage)}`, apply: (s) => { s.orbitDamage += 8; } },
      {
        key: 'orbitCount', rarity: 'rare', describe: (b, a) => `Orbe cantidad: ${b.orbitCount} → ${a.orbitCount}`,
        apply: (s) => { s.orbitCount = Math.min(8, s.orbitCount + 1); },
        isMaxed: (s) => s.orbitCount >= 8,
      },
      {
        key: 'orbitSpeed', rarity: 'common', describe: (b, a) => `Orbe velocidad: ${b.orbitSpeed.toFixed(2)} → ${a.orbitSpeed.toFixed(2)}`,
        apply: (s) => { s.orbitSpeed = Math.min(6.5, s.orbitSpeed * 1.3); },
        isMaxed: (s) => s.orbitSpeed >= 6.5,
      },
    ],
  },
  pierce: {
    unlock: {
      key: 'pierceUnlock', rarity: 'epic',
      describe: (b, a) => `Nueva arma: Perforante (${a.pierceDamage} dmg, atraviesa todo)`,
      apply: (s) => { s.hasPierce = true; s.pierceDamage = 18; s.pierceRate = 1200; s.pierceSpeed = 600; },
    },
    upgrades: [
      { key: 'pierceDamage', rarity: 'common', describe: (b, a) => `Perforante daño: ${Math.round(b.pierceDamage)} → ${Math.round(a.pierceDamage)}`, apply: (s) => { s.pierceDamage += 12; } },
      {
        key: 'pierceRate', rarity: 'common',
        describe: (b, a) => `Perforante cadencia: ${(1000 / b.pierceRate).toFixed(1)}/s → ${(1000 / a.pierceRate).toFixed(1)}/s`,
        apply: (s) => { s.pierceRate = Math.max(220, Math.round(s.pierceRate * 0.8)); },
        isMaxed: (s) => s.pierceRate <= 220,
      },
    ],
  },
  burst: {
    unlock: {
      key: 'burstUnlock', rarity: 'epic',
      describe: (b, a) => `Nueva arma: Ráfaga (${a.burstCount} disparos, ${a.burstDamage} dmg)`,
      apply: (s) => { s.hasBurst = true; s.burstDamage = 12; s.burstCount = 3; s.burstRate = 1500; },
    },
    upgrades: [
      { key: 'burstDamage', rarity: 'common', describe: (b, a) => `Ráfaga daño: ${Math.round(b.burstDamage)} → ${Math.round(a.burstDamage)}`, apply: (s) => { s.burstDamage += 8; } },
      {
        key: 'burstCount', rarity: 'rare', describe: (b, a) => `Ráfaga disparos: ${b.burstCount} → ${a.burstCount}`,
        apply: (s) => { s.burstCount = Math.min(10, s.burstCount + 1); },
        isMaxed: (s) => s.burstCount >= 10,
      },
      {
        key: 'burstRate', rarity: 'common',
        describe: (b, a) => `Ráfaga cadencia: ${(1000 / b.burstRate).toFixed(1)}/s → ${(1000 / a.burstRate).toFixed(1)}/s`,
        apply: (s) => { s.burstRate = Math.max(350, Math.round(s.burstRate * 0.8)); },
        isMaxed: (s) => s.burstRate <= 350,
      },
    ],
  },
  nova: {
    unlock: {
      key: 'novaUnlock', rarity: 'epic',
      describe: (b, a) => `Nueva arma: Onda expansiva (${a.novaDamage} dmg, radio ${a.novaRadius})`,
      apply: (s) => { s.hasNova = true; s.novaDamage = 25; s.novaRadius = 140; s.novaRate = 2500; },
    },
    upgrades: [
      { key: 'novaDamage', rarity: 'common', describe: (b, a) => `Onda daño: ${Math.round(b.novaDamage)} → ${Math.round(a.novaDamage)}`, apply: (s) => { s.novaDamage += 15; } },
      {
        key: 'novaRadius', rarity: 'common', describe: (b, a) => `Onda radio: ${Math.round(b.novaRadius)} → ${Math.round(a.novaRadius)}`,
        apply: (s) => { s.novaRadius = Math.min(480, Math.round(s.novaRadius * 1.25)); },
        isMaxed: (s) => s.novaRadius >= 480,
      },
    ],
  },
};

export const WEAPON_KEYS = ['aura', 'orbit', 'pierce', 'burst', 'nova'];

// Escalado pasivo: +1% (o -1% en cadencias) en cada level-up, ademas de la mejora elegida.
export const LEVEL_SCALE_UP = 1.01;
export const LEVEL_SCALE_DOWN = 0.99;

// stat que sube, con su mismo tope que ya usan las mejoras manuales. `requires` es opcional
// (solo se aplica si esa arma ya esta desbloqueada). orbitCount/burstCount quedan afuera: un
// 1% de un numero como 3 no significa nada, esas solo crecen por eleccion explicita.
export const GROWTH_STATS = [
  { key: 'damage', cap: null },
  { key: 'moveSpeed', cap: 480 },
  { key: 'magnetRadius', cap: 550 },
  { key: 'hpRegen', cap: null },
  { key: 'lifesteal', cap: null },
  { key: 'dodge', cap: DODGE_CAP },
  { key: 'shieldMax', cap: null },
  { key: 'auraDamage', cap: null, requires: 'hasAura' },
  { key: 'auraRadius', cap: 420, requires: 'hasAura' },
  { key: 'orbitDamage', cap: null, requires: 'hasOrbit' },
  { key: 'orbitSpeed', cap: 6.5, requires: 'hasOrbit' },
  { key: 'pierceDamage', cap: null, requires: 'hasPierce' },
  { key: 'burstDamage', cap: null, requires: 'hasBurst' },
  { key: 'novaDamage', cap: null, requires: 'hasNova' },
  { key: 'novaRadius', cap: 480, requires: 'hasNova' },
];

// cadencias: "mejor" es un delay mas bajo, asi que bajan multiplicando, con piso.
export const COOLDOWN_STATS = [
  { key: 'fireRate', floor: 130 },
  { key: 'pierceRate', floor: 220, requires: 'hasPierce' },
  { key: 'burstRate', floor: 350, requires: 'hasBurst' },
  { key: 'novaRate', floor: 800, requires: 'hasNova' },
];

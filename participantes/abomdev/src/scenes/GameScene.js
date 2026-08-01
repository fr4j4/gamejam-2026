import Phaser from 'phaser';

const WORLD_SIZE = 6000;
const PLAYER_MAX_HP = 100;
const SPAWN_RADIUS_MARGIN = 150;
const XP_PICKUP_SPEED = 320;
const PROJECTILE_SPEED = 520;
const PROJECTILE_LIFETIME = 2000;
const HIT_INVULN_MS = 500;
const SPAWN_DELAY_MIN = 300;
const DIFFICULTY_RAMP_MS = 12000;
const BOSS_COUNTDOWN_MS = 300000;
const BOSS_FIGHT_LIMIT_MS = 60000;
const BOSS_OVERSTAY_MULTIPLIER = 1.5;
const BOSS_WARNING_MS = 2500;
const ORBIT_HIT_RADIUS = 22;
const ORBIT_HIT_COOLDOWN_MS = 300;
const ENEMY_KNOCKBACK_SPEED = 220;
const ENEMY_KNOCKBACK_MS = 150;
const PLAYER_KNOCKBACK_SPEED = 260;
const PLAYER_KNOCKBACK_MS = 150;
const PORTAL_TRIGGER_RADIUS = 40;
const STAGE_BOSS_MULTIPLIER = 1.15;
const STAGE_PORTAL_MULTIPLIER = 1.5;
const PIERCE_LIFETIME = 1200;
const BOSS_PROJECTILE_SPEED = 220;
const BOSS_PROJECTILE_LIFETIME = 3000;
const BOSS_RANGED_PREFERRED_DIST = 260;
const BOSS_SHOT_COOLDOWN_MS = 1800;
const BOSS_TELEGRAPH_MS = 400;
const CHEST_DELAY_MS = 25000;
const CHEST_TRIGGER_RADIUS = 36;
const SHIELD_REGEN_DELAY_MS = 4000;
const DODGE_CAP = 0.6;
const VICTORY_STAGE = 3;
const BEST_TIME_KEY = 'survivorsBestTimeMs';
const MAX_ENEMIES = 150;
const MAX_SPAWN_PER_TICK = 6;

const STAGE_THEMES = {
  1: { fill: 0x1a1a2e, line: 0x2a2a4e, bg: '#111122' },
  2: { fill: 0x2a1414, line: 0x4e2424, bg: '#1a0e0e' },
  3: { fill: 0x1a0e2a, line: 0x36204e, bg: '#120a1a' },
};

const ENEMY_TYPES = {
  normal: { texture: 'enemy', color: 0xff5566, baseHp: 20, hpPerMin: 10, baseSpeed: 80, speedPerMin: 8, damage: 10, xpValue: 1 },
  fast: { texture: 'enemyFast', color: 0xffaa33, baseHp: 8, hpPerMin: 4, baseSpeed: 160, speedPerMin: 12, damage: 6, xpValue: 1 },
  tank: { texture: 'enemyTank', color: 0x88cc44, baseHp: 60, hpPerMin: 22, baseSpeed: 45, speedPerMin: 3, damage: 18, xpValue: 3 },
  boss: { texture: 'boss', color: 0xff33aa, baseHp: 250, hpPerMin: 50, baseSpeed: 50, speedPerMin: 4, damage: 20, xpValue: 0 },
  bossRanged: { texture: 'bossRanged', color: 0x33ccff, baseHp: 200, hpPerMin: 45, baseSpeed: 70, speedPerMin: 4, damage: 15, xpValue: 0 },
};

const STAT_UPGRADES = [
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

const WEAPON_UPGRADES = {
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

const WEAPON_KEYS = ['aura', 'orbit', 'pierce', 'burst', 'nova'];

const RARITY_WEIGHT = { common: 3, rare: 2, epic: 1 };
const RARITY_COLOR = { common: '#66ffcc', rare: '#66aaff', epic: '#ffcc44' };
const RARITY_COLOR_NUM = { common: 0x66ffcc, rare: 0x66aaff, epic: 0xffcc44 };
const RARITY_LABEL = { common: 'COMÚN', rare: 'RARA', epic: 'ÉPICA' };

// Escalado pasivo: +1% (o -1% en cadencias) en cada level-up, ademas de la mejora elegida.
const LEVEL_SCALE_UP = 1.01;
const LEVEL_SCALE_DOWN = 0.99;

// stat que sube, con su mismo tope que ya usan las mejoras manuales. `requires` es opcional
// (solo se aplica si esa arma ya esta desbloqueada). orbitCount/burstCount quedan afuera: un
// 1% de un numero como 3 no significa nada, esas solo crecen por eleccion explicita.
const GROWTH_STATS = [
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
const COOLDOWN_STATS = [
  { key: 'fireRate', floor: 130 },
  { key: 'pierceRate', floor: 220, requires: 'hasPierce' },
  { key: 'burstRate', floor: 350, requires: 'hasBurst' },
  { key: 'novaRate', floor: 800, requires: 'hasNova' },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    this.stats = {
      damage: 20,
      fireRate: 600,
      moveSpeed: 220,
      maxHp: PLAYER_MAX_HP,
      hp: PLAYER_MAX_HP,
      magnetRadius: 90,
      hasAura: false,
      hasOrbit: false,
      hasPierce: false,
      hasBurst: false,
      hasNova: false,
      hpRegen: 0,
      lifesteal: 0,
      dodge: 0,
      shieldMax: 0,
      shield: 0,
    };
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 10;
    this.elapsed = 0;
    this.isLevelingUp = false;
    this.isGameOver = false;
    this.hasWon = false;
    this.hasStarted = false;
    this.lastHitAt = -Infinity;
    this.lastDamageTakenAt = -Infinity;
    this.chest = null;
    this.auraGfx = null;
    this.auraTickAt = 0;
    this.orbitOrbs = [];
    this.isBossAlive = false;
    this.currentBoss = null;
    this.bossCountdown = BOSS_COUNTDOWN_MS;
    this.bossFightCountdown = null;
    this.playerKnockbackUntil = 0;
    this.stage = 1;
    this.stageMultiplier = 1;
    this.portal = null;
    this.isPaused = false;
    this.computeSpawnRadius();

    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

    this.worldGrid = this.add.grid(WORLD_SIZE / 2, WORLD_SIZE / 2, WORLD_SIZE, WORLD_SIZE, 64, 64, 0x1a1a2e, 1, 0x2a2a4e, 1);
    this.worldGrid.setDepth(-1);

    this.generateTextures();

    this.player = this.physics.add.sprite(WORLD_SIZE / 2, WORLD_SIZE / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.pierceProjectiles = this.physics.add.group();
    this.bossProjectiles = this.physics.add.group();
    this.xpOrbs = this.physics.add.group();

    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHitEnemy, null, this);
    this.physics.add.overlap(this.pierceProjectiles, this.enemies, this.onPierceHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.bossProjectiles, this.onBossProjectileHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this.onPlayerPickupXp, null, this);

    this.spawnTimer = this.time.addEvent({ delay: 1000, loop: true, callback: this.spawnEnemy, callbackScope: this });
    this.attackTimer = this.time.addEvent({ delay: this.stats.fireRate, loop: true, callback: this.fireAtNearest, callbackScope: this });
    this.pierceTimer = this.time.addEvent({ delay: 1200, loop: true, callback: this.firePierce, callbackScope: this });
    this.burstTimer = this.time.addEvent({ delay: 1500, loop: true, callback: this.fireBurst, callbackScope: this });
    this.novaTimer = this.time.addEvent({ delay: 2500, loop: true, callback: this.fireNova, callbackScope: this });
    this.difficultyTimer = this.time.addEvent({ delay: DIFFICULTY_RAMP_MS, loop: true, callback: this.rampDifficulty, callbackScope: this });
    this.chestTimer = this.time.addEvent({ delay: CHEST_DELAY_MS, loop: true, callback: this.spawnChest, callbackScope: this });

    this.gameplayTimers = [
      this.spawnTimer, this.attackTimer, this.pierceTimer, this.burstTimer,
      this.novaTimer, this.difficultyTimer, this.chestTimer,
    ];
    this.setTimersPaused(true);

    this.deathEmitter = this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 220 },
      lifespan: 350,
      scale: { start: 1.4, end: 0 },
      quantity: 0,
      emitting: false,
    });
    this.deathEmitter.setDepth(20);

    this.buildLevelUpUI();
    this.buildHud();
    this.buildBossBar();
    this.buildMinimap();
    this.buildPauseMenu();
    this.buildStartScreen();
    this.layoutUI();
    this.updateHud();

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-F', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    this.onResize = () => {
      this.cameras.main.setSize(this.scale.width, this.scale.height);
      this.computeSpawnRadius();
      this.layoutUI();
    };
    this.scale.on('resize', this.onResize);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize));
  }

  computeSpawnRadius() {
    this.spawnRadius = Math.hypot(this.scale.width, this.scale.height) / 2 + SPAWN_RADIUS_MARGIN;
    this.portalSpawnRadius = this.spawnRadius * 0.7;
    this.chestSpawnRadius = this.spawnRadius * 0.5;
  }

  generateTextures() {
    if (this.textures.exists('player')) return;

    const player = this.add.graphics();
    player.fillStyle(0x66ffcc, 1);
    player.fillCircle(16, 16, 16);
    player.generateTexture('player', 32, 32);
    player.destroy();

    const enemy = this.add.graphics();
    enemy.fillStyle(0xff5566, 1);
    enemy.fillRect(0, 0, 24, 24);
    enemy.generateTexture('enemy', 24, 24);
    enemy.destroy();

    const projectile = this.add.graphics();
    projectile.fillStyle(0xffee66, 1);
    projectile.fillCircle(5, 5, 5);
    projectile.generateTexture('projectile', 10, 10);
    projectile.destroy();

    const xp = this.add.graphics();
    xp.fillStyle(0xaa88ff, 1);
    xp.fillCircle(6, 6, 6);
    xp.generateTexture('xp', 12, 12);
    xp.destroy();

    const enemyFast = this.add.graphics();
    enemyFast.fillStyle(0xffaa33, 1);
    enemyFast.fillTriangle(8, 0, 16, 16, 0, 16);
    enemyFast.generateTexture('enemyFast', 16, 16);
    enemyFast.destroy();

    const spark = this.add.graphics();
    spark.fillStyle(0xffffff, 1);
    spark.fillCircle(3, 3, 3);
    spark.generateTexture('spark', 6, 6);
    spark.destroy();

    const boss = this.add.graphics();
    boss.fillStyle(0x220022, 1);
    boss.fillRect(0, 0, 44, 44);
    boss.lineStyle(3, 0xff33aa, 1);
    boss.strokeRect(1.5, 1.5, 41, 41);
    boss.generateTexture('boss', 44, 44);
    boss.destroy();

    const orbit = this.add.graphics();
    orbit.fillStyle(0x55ddff, 1);
    orbit.fillCircle(6, 6, 6);
    orbit.generateTexture('orbit', 12, 12);
    orbit.destroy();

    const enemyTank = this.add.graphics();
    enemyTank.fillStyle(0x335522, 1);
    enemyTank.fillRect(0, 0, 28, 28);
    enemyTank.lineStyle(2, 0x88cc44, 1);
    enemyTank.strokeRect(1, 1, 26, 26);
    enemyTank.generateTexture('enemyTank', 28, 28);
    enemyTank.destroy();

    const bossRanged = this.add.graphics();
    bossRanged.fillStyle(0x002233, 1);
    bossRanged.fillRect(0, 0, 44, 44);
    bossRanged.lineStyle(3, 0x33ccff, 1);
    bossRanged.strokeRect(1.5, 1.5, 41, 41);
    bossRanged.generateTexture('bossRanged', 44, 44);
    bossRanged.destroy();

    const pierce = this.add.graphics();
    pierce.fillStyle(0x66ddff, 1);
    pierce.fillRect(0, 3, 20, 4);
    pierce.generateTexture('pierce', 20, 10);
    pierce.destroy();

    const bossBolt = this.add.graphics();
    bossBolt.fillStyle(0xff3333, 1);
    bossBolt.fillCircle(7, 7, 7);
    bossBolt.generateTexture('bossBolt', 14, 14);
    bossBolt.destroy();

    const portal = this.add.graphics();
    portal.fillStyle(0x8855ff, 0.35);
    portal.fillCircle(32, 32, 32);
    portal.fillStyle(0xaa88ff, 0.7);
    portal.fillCircle(32, 32, 20);
    portal.fillStyle(0xffffff, 0.9);
    portal.fillCircle(32, 32, 8);
    portal.generateTexture('portal', 64, 64);
    portal.destroy();

    const chest = this.add.graphics();
    chest.fillStyle(0x8b5a2b, 1);
    chest.fillRect(0, 8, 28, 20);
    chest.fillStyle(0xffcc44, 1);
    chest.fillRect(0, 8, 28, 6);
    chest.lineStyle(2, 0x442200, 1);
    chest.strokeRect(0, 8, 28, 20);
    chest.generateTexture('chest', 28, 28);
    chest.destroy();
  }

  buildStartScreen() {
    this.startPanelW = 480;
    this.startPanelH = 280;

    this.startPanelBg = this.add.rectangle(0, 0, this.startPanelW, this.startPanelH, 0x181830, 0.97)
      .setOrigin(0.5).setStrokeStyle(3, 0x66ffcc).setScrollFactor(0).setDepth(300);

    this.startTitle = this.add.text(0, 0, 'SURVIVORS', {
      fontFamily: 'monospace', fontSize: '42px', color: '#66ffcc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    const bestTime = this.getBestTime();
    const bestLine = bestTime > 0 ? `\n\nMejor tiempo: ${this.formatTime(bestTime)}` : '';
    this.startBody = this.add.text(0, 0,
      `WASD / Flechas para moverte\nAtaque automático al enemigo más cercano\nF: pantalla completa · ESC: pausa${bestLine}`,
      { fontFamily: 'monospace', fontSize: '15px', color: '#cceeff', align: 'center', lineSpacing: 6 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    this.startPrompt = this.add.text(0, 0, 'Presiona una tecla para empezar', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffcc44',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.tweens.add({ targets: this.startPrompt, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  layoutUI() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    this.timerText.setPosition(w - 20, 20);
    this.nextBossText.setPosition(w - 20, 44);

    const barY = h - 48;
    this.bossBarX = cx - this.bossBarW / 2;
    this.bossBarBg.setPosition(this.bossBarX, barY);
    this.bossBarFill.setPosition(this.bossBarX + 2, barY + 2);
    this.bossLabel.setPosition(cx, barY - 18);

    this.minimapX = w - 20 - this.minimapSize;
    this.minimapY = h - 20 - this.minimapSize;

    this.startPanelBg.setPosition(cx, cy);
    this.startTitle.setPosition(cx, cy - this.startPanelH / 2 + 44);
    this.startBody.setPosition(cx, cy - 6);
    this.startPrompt.setPosition(cx, cy + this.startPanelH / 2 - 30);

    this.levelUpTitle.setPosition(cx, 100);
    const cardGapX = 24;
    const cardGapY = 20;
    const gridW = this.levelUpCardW * 2 + cardGapX;
    const gridStartX = cx - gridW / 2;
    const gridStartY = 160;
    this.levelUpCards.forEach((card, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gridStartX + col * (this.levelUpCardW + cardGapX);
      const y = gridStartY + row * (this.levelUpCardH + cardGapY);
      card.bg.setPosition(x, y);
      card.keyText.setPosition(x + 10, y + 8);
      card.rarityText.setPosition(x + this.levelUpCardW - 10, y + 8);
      card.text.setPosition(x + this.levelUpCardW / 2, y + this.levelUpCardH / 2 + 6);
    });

    this.pauseOverlay.width = w;
    this.pauseOverlay.height = h;

    this.pauseTitleBoxBg.setPosition(cx, 55);
    this.pauseTitle.setPosition(cx, 55);

    this.pauseBoxX = w - this.pauseBoxW - 40;
    this.pauseBoxY = 130;
    this.pauseBoxBg.setPosition(this.pauseBoxX, this.pauseBoxY);
    this.pauseBoxTitle.setPosition(this.pauseBoxX + 16, this.pauseBoxY + 16);
    this.pauseBoxDivider.setPosition(this.pauseBoxX + 16, this.pauseBoxY + 42);
    this.pauseStats.setPosition(this.pauseBoxX + 16, this.pauseBoxY + 54);
    this.pauseHint.setPosition(cx, h - 40);
  }

  setTimersPaused(paused) {
    this.gameplayTimers.forEach((t) => { t.paused = paused; });
  }

  startGame() {
    if (this.hasStarted) return;
    this.hasStarted = true;
    this.tweens.killTweensOf(this.startPrompt);
    this.startPanelBg.destroy();
    this.startTitle.destroy();
    this.startBody.destroy();
    this.startPrompt.destroy();
    this.setTimersPaused(false);
  }

  buildHud() {
    this.add.rectangle(20, 20, 200, 8, 0x222244).setOrigin(0, 0).setScrollFactor(0).setDepth(150);
    this.shieldBarFill = this.add.rectangle(21, 21, 0, 6, 0x66ddff).setOrigin(0, 0).setScrollFactor(0).setDepth(151);
    this.shieldText = this.add.text(226, 18, '', { fontFamily: 'monospace', fontSize: '12px', color: '#66ddff' }).setScrollFactor(0).setDepth(151);

    this.add.rectangle(20, 32, 200, 18, 0x222244).setOrigin(0, 0).setScrollFactor(0).setDepth(150);
    this.hpBarFill = this.add.rectangle(22, 34, 196, 14, 0xff5566).setOrigin(0, 0).setScrollFactor(0).setDepth(151);
    this.hpText = this.add.text(226, 32, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setScrollFactor(0).setDepth(151);

    this.add.rectangle(20, 54, 200, 10, 0x222244).setOrigin(0, 0).setScrollFactor(0).setDepth(150);
    this.xpBarFill = this.add.rectangle(21, 55, 198, 8, 0xaa88ff).setOrigin(0, 0).setScrollFactor(0).setDepth(151);

    this.levelText = this.add.text(20, 68, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setScrollFactor(0).setDepth(151);
    this.timerText = this.add.text(0, 20, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(151);
    this.nextBossText = this.add.text(0, 44, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ff88cc' }).setOrigin(1, 0).setScrollFactor(0).setDepth(151);
  }

  buildBossBar() {
    this.bossBarW = 300;
    const barH = 16;
    this.bossBarMaxWidth = this.bossBarW - 4;

    this.bossLabel = this.add.text(0, 0, 'JEFE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff88cc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setVisible(false);
    this.bossBarBg = this.add.rectangle(0, 0, this.bossBarW, barH, 0x222244).setOrigin(0, 0).setScrollFactor(0).setDepth(150).setVisible(false);
    this.bossBarFill = this.add.rectangle(0, 0, this.bossBarMaxWidth, barH - 4, 0xff33aa).setOrigin(0, 0).setScrollFactor(0).setDepth(151).setVisible(false);
  }

  buildMinimap() {
    this.minimapSize = 150;
    this.minimapX = 0;
    this.minimapY = 0;
    this.minimapGfx = this.add.graphics().setScrollFactor(0).setDepth(150);
  }

  updateMinimap() {
    const gfx = this.minimapGfx;
    gfx.clear();
    gfx.fillStyle(0x111122, 0.7);
    gfx.fillRect(this.minimapX, this.minimapY, this.minimapSize, this.minimapSize);
    gfx.lineStyle(2, 0x444466, 1);
    gfx.strokeRect(this.minimapX, this.minimapY, this.minimapSize, this.minimapSize);

    const toMinimap = (wx, wy) => ({
      x: this.minimapX + (wx / WORLD_SIZE) * this.minimapSize,
      y: this.minimapY + (wy / WORLD_SIZE) * this.minimapSize,
    });

    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      const p = toMinimap(e.x, e.y);
      const isBoss = e.getData('isBoss');
      const color = ENEMY_TYPES[e.getData('type')].color;
      gfx.fillStyle(color, 1);
      gfx.fillCircle(p.x, p.y, isBoss ? 4 : 2);
    });

    if (this.chest) {
      const cp = toMinimap(this.chest.x, this.chest.y);
      gfx.fillStyle(0xffcc44, 1);
      gfx.fillCircle(cp.x, cp.y, 3);
    }

    const pp = toMinimap(this.player.x, this.player.y);
    gfx.fillStyle(0x66ffcc, 1);
    gfx.fillCircle(pp.x, pp.y, 3);
  }

  buildPauseMenu() {
    this.pauseBoxW = 340;
    this.pauseBoxH = 440;
    this.pauseTitleBoxW = 260;
    this.pauseTitleBoxH = 60;

    this.pauseOverlay = this.add.rectangle(0, 0, 10, 10, 0x05050a, 0.6)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(290).setVisible(false);

    this.pauseTitleBoxBg = this.add.rectangle(0, 0, this.pauseTitleBoxW, this.pauseTitleBoxH, 0x181830, 0.95)
      .setOrigin(0.5).setStrokeStyle(3, 0x66ffcc).setScrollFactor(0).setDepth(300).setVisible(false);

    this.pauseTitle = this.add.text(0, 0, 'PAUSADO', {
      fontFamily: 'monospace', fontSize: '30px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);

    this.pauseBoxBg = this.add.rectangle(0, 0, this.pauseBoxW, this.pauseBoxH, 0x181830, 0.97)
      .setOrigin(0, 0).setStrokeStyle(3, 0x66aaff).setScrollFactor(0).setDepth(300).setVisible(false);

    this.pauseBoxTitle = this.add.text(0, 0, 'ESTADÍSTICAS', {
      fontFamily: 'monospace', fontSize: '17px', color: '#66aaff',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(301).setVisible(false);

    this.pauseBoxDivider = this.add.rectangle(0, 0, this.pauseBoxW - 32, 2, 0x444466)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(301).setVisible(false);

    this.pauseStats = this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#cceeff', lineSpacing: 11,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(301).setVisible(false);

    this.pauseHint = this.add.text(0, 0, 'Presiona ESC para continuar', {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setVisible(false);
  }

  togglePause() {
    if (!this.hasStarted || this.isGameOver || this.hasWon || this.isLevelingUp) return;
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  pauseGame() {
    this.isPaused = true;
    this.player.setVelocity(0, 0);
    this.physics.world.pause();
    this.setTimersPaused(true);

    const s = this.stats;
    const lines = [
      `Daño: ${Math.round(s.damage)}`,
      `Cadencia: ${(1000 / s.fireRate).toFixed(1)}/s`,
      `Velocidad: ${Math.round(s.moveSpeed)}`,
      `HP máximo: ${Math.round(s.maxHp)}`,
      `Radio de imán: ${Math.round(s.magnetRadius)}`,
      `Etapa: ${this.stage} (x${this.stageMultiplier.toFixed(2)})`,
    ];
    if (s.hpRegen > 0) lines.push(`Regeneración: ${s.hpRegen.toFixed(1)}/s`);
    if (s.lifesteal > 0) lines.push(`Robo de vida: ${(s.lifesteal * 100).toFixed(0)}%`);
    if (s.dodge > 0) lines.push(`Esquivar: ${(s.dodge * 100).toFixed(0)}%`);
    if (s.shieldMax > 0) lines.push(`Escudo: ${Math.ceil(s.shield)}/${Math.round(s.shieldMax)}`);
    if (s.hasAura) lines.push(`Aura — daño ${Math.round(s.auraDamage)}, radio ${Math.round(s.auraRadius)}`);
    if (s.hasOrbit) lines.push(`Orbe — daño ${Math.round(s.orbitDamage)}, cantidad ${s.orbitCount}, velocidad ${s.orbitSpeed.toFixed(2)}`);
    if (s.hasPierce) lines.push(`Perforante — daño ${Math.round(s.pierceDamage)}, cadencia ${(1000 / s.pierceRate).toFixed(1)}/s`);
    if (s.hasBurst) lines.push(`Ráfaga — daño ${Math.round(s.burstDamage)}, disparos ${s.burstCount}, cadencia ${(1000 / s.burstRate).toFixed(1)}/s`);
    if (s.hasNova) lines.push(`Onda — daño ${Math.round(s.novaDamage)}, radio ${Math.round(s.novaRadius)}`);

    this.pauseStats.setText(lines.join('\n'));
    this.pauseOverlay.setVisible(true);
    this.pauseTitleBoxBg.setVisible(true);
    this.pauseTitle.setVisible(true);
    this.pauseBoxBg.setVisible(true);
    this.pauseBoxTitle.setVisible(true);
    this.pauseBoxDivider.setVisible(true);
    this.pauseStats.setVisible(true);
    this.pauseHint.setVisible(true);
  }

  resumeGame() {
    this.isPaused = false;
    this.physics.world.resume();
    this.setTimersPaused(false);

    this.pauseOverlay.setVisible(false);
    this.pauseTitleBoxBg.setVisible(false);
    this.pauseTitle.setVisible(false);
    this.pauseBoxBg.setVisible(false);
    this.pauseBoxTitle.setVisible(false);
    this.pauseBoxDivider.setVisible(false);
    this.pauseStats.setVisible(false);
    this.pauseHint.setVisible(false);
  }

  updateHud() {
    const hpRatio = Phaser.Math.Clamp(this.stats.hp / this.stats.maxHp, 0, 1);
    this.hpBarFill.width = 196 * hpRatio;
    this.hpText.setText(`${Math.ceil(this.stats.hp)}/${Math.round(this.stats.maxHp)}`);

    const shieldRatio = this.stats.shieldMax > 0 ? Phaser.Math.Clamp(this.stats.shield / this.stats.shieldMax, 0, 1) : 0;
    this.shieldBarFill.width = 196 * shieldRatio;
    this.shieldText.setText(`${Math.ceil(this.stats.shield)}/${Math.round(this.stats.shieldMax)}`);

    const xpRatio = Phaser.Math.Clamp(this.xp / this.xpToNext, 0, 1);
    this.xpBarFill.width = 198 * xpRatio;
    this.levelText.setText(`Nivel ${this.level}   Etapa ${this.stage}`);

    this.timerText.setText(this.formatTime(this.elapsed));
  }

  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  update(time, delta) {
    if (!this.hasStarted || this.isGameOver || this.hasWon || this.isLevelingUp || this.isPaused) {
      this.player.setVelocity(0, 0);
      return;
    }

    this.elapsed += delta;
    this.updateHud();

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (time >= this.playerKnockbackUntil) {
      const dir = new Phaser.Math.Vector2((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
      if (dir.lengthSq() > 0) {
        dir.normalize().scale(this.stats.moveSpeed);
        this.player.setVelocity(dir.x, dir.y);
      } else {
        this.player.setVelocity(0, 0);
      }
    }

    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      if (time < (e.getData('knockbackUntil') || 0)) return;
      if (e.getData('type') === 'bossRanged') {
        this.updateRangedBoss(e, time);
      } else {
        this.physics.moveToObject(e, this.player, e.getData('speed'));
      }
    });

    this.xpOrbs.getChildren().forEach((orb) => {
      if (!orb.active) return;
      const d = Phaser.Math.Distance.Between(orb.x, orb.y, this.player.x, this.player.y);
      if (d < this.stats.magnetRadius) {
        this.physics.moveToObject(orb, this.player, XP_PICKUP_SPEED);
      } else {
        orb.setVelocity(0, 0);
      }
    });

    this.projectiles.getChildren().forEach((p) => {
      if (!p.active) return;
      if (time - p.getData('bornAt') > PROJECTILE_LIFETIME) {
        p.destroy();
      }
    });

    this.pierceProjectiles.getChildren().forEach((p) => {
      if (!p.active) return;
      if (time - p.getData('bornAt') > PIERCE_LIFETIME) {
        p.destroy();
      }
    });

    this.bossProjectiles.getChildren().forEach((p) => {
      if (!p.active) return;
      if (time - p.getData('bornAt') > BOSS_PROJECTILE_LIFETIME) {
        p.destroy();
      }
    });

    this.updateWeapons(time);
    this.updateMinimap();

    if (this.portal) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.portal.x, this.portal.y);
      if (d < PORTAL_TRIGGER_RADIUS) {
        this.enterPortal();
      }
    }

    if (this.chest) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chest.x, this.chest.y);
      if (d < CHEST_TRIGGER_RADIUS) {
        this.openChest();
      }
    }

    if (this.stats.hpRegen > 0 && this.stats.hp < this.stats.maxHp) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.hpRegen * (delta / 1000));
    }

    if (this.stats.shieldMax > 0 && this.stats.shield < this.stats.shieldMax
      && time - this.lastDamageTakenAt > SHIELD_REGEN_DELAY_MS) {
      this.stats.shield = this.stats.shieldMax;
    }

    if (this.bossCountdown !== null) {
      this.bossCountdown = Math.max(0, this.bossCountdown - delta);
      this.nextBossText.setText(`Próximo jefe: ${this.formatTime(this.bossCountdown)}`).setVisible(true);
      if (this.bossCountdown <= 0) {
        this.bossCountdown = null;
        this.nextBossText.setVisible(false);
        this.warnBoss();
      }
    } else {
      this.nextBossText.setVisible(false);
    }

    if (this.bossFightCountdown !== null) {
      this.bossFightCountdown -= delta;
      if (this.bossFightCountdown <= 0) {
        this.bossFightCountdown = BOSS_FIGHT_LIMIT_MS;
        this.applyBossOverstayPenalty();
      }
      this.bossLabel.setText(`JEFE - ${this.formatTime(Math.max(0, this.bossFightCountdown))}`);
    }

    if (this.isBossAlive && this.currentBoss && this.currentBoss.active) {
      const ratio = Phaser.Math.Clamp(this.currentBoss.getData('hp') / this.currentBoss.getData('maxHp'), 0, 1);
      this.bossBarFill.width = this.bossBarMaxWidth * ratio;
    }
  }

  updateWeapons(time) {
    if (this.stats.hasAura && this.auraGfx) {
      this.auraGfx.setPosition(this.player.x, this.player.y);
      this.auraGfx.setRadius(this.stats.auraRadius);

      if (time >= this.auraTickAt) {
        this.auraTickAt = time + this.stats.auraTickMs;
        this.enemies.getChildren().forEach((e) => {
          if (!e.active) return;
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
          if (d <= this.stats.auraRadius) {
            this.damageEnemy(e, this.stats.auraDamage);
          }
        });
      }
    }

    if (this.stats.hasOrbit && this.orbitOrbs.length > 0) {
      this.orbitOrbs.forEach((orb, i) => {
        const angle = (time / 1000) * this.stats.orbitSpeed + (i * (Math.PI * 2 / this.orbitOrbs.length));
        orb.x = this.player.x + Math.cos(angle) * this.stats.orbitRadius;
        orb.y = this.player.y + Math.sin(angle) * this.stats.orbitRadius;

        this.enemies.getChildren().forEach((e) => {
          if (!e.active) return;
          const d = Phaser.Math.Distance.Between(orb.x, orb.y, e.x, e.y);
          if (d > ORBIT_HIT_RADIUS) return;
          const lastHit = e.getData('lastOrbitHit') || 0;
          if (time - lastHit < ORBIT_HIT_COOLDOWN_MS) return;
          e.setData('lastOrbitHit', time);
          this.damageEnemy(e, this.stats.orbitDamage);
        });
      });
    }
  }

  randomPointNear(radius) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    return {
      x: Phaser.Math.Clamp(this.player.x + Math.cos(angle) * radius, 20, WORLD_SIZE - 20),
      y: Phaser.Math.Clamp(this.player.y + Math.sin(angle) * radius, 20, WORLD_SIZE - 20),
    };
  }

  spawnEnemy() {
    if (this.isGameOver || this.hasWon || this.isLevelingUp) return;
    if (this.enemies.countActive(true) >= MAX_ENEMIES) return;

    const minutes = this.elapsed / 60000;
    const spawnCount = Math.min(MAX_SPAWN_PER_TICK, 1 + Math.floor(minutes / 1.5) + (this.stage - 1));
    for (let i = 0; i < spawnCount && this.enemies.countActive(true) < MAX_ENEMIES; i++) {
      this.spawnOneEnemy(minutes);
    }
  }

  spawnOneEnemy(minutes) {
    const { x, y } = this.randomPointNear(this.spawnRadius);
    const fastChance = Math.min(0.4, minutes * 0.12);
    const tankChance = Math.min(0.2, minutes * 0.05);
    const roll = Math.random();
    const typeKey = roll < tankChance ? 'tank' : (roll < tankChance + fastChance ? 'fast' : 'normal');
    const type = ENEMY_TYPES[typeKey];

    const enemy = this.enemies.create(x, y, type.texture);
    enemy.setData('type', typeKey);
    enemy.setData('hp', Math.round((type.baseHp + minutes * type.hpPerMin) * this.stageMultiplier));
    enemy.setData('speed', Math.round(type.baseSpeed + minutes * type.speedPerMin));
    enemy.setData('damage', Math.round(type.damage * this.stageMultiplier));
  }

  warnBoss() {
    if (this.isGameOver || this.isLevelingUp || this.isBossAlive) return;

    const warning = this.add.text(this.scale.width / 2, this.scale.height / 2, '¡EL JEFE SE ACERCA!', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ff33aa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250);

    this.tweens.add({
      targets: warning,
      alpha: 0.2,
      duration: 300,
      yoyo: true,
      repeat: 3,
      onComplete: () => warning.destroy(),
    });

    this.time.delayedCall(BOSS_WARNING_MS, () => this.spawnBoss());
  }

  spawnBoss() {
    if (this.isGameOver || this.isLevelingUp || this.isBossAlive) return;

    const { x, y } = this.randomPointNear(this.spawnRadius);
    const minutes = this.elapsed / 60000;
    const bossTypeKey = Math.random() < 0.5 ? 'boss' : 'bossRanged';
    const type = ENEMY_TYPES[bossTypeKey];
    const maxHp = Math.round((type.baseHp + minutes * type.hpPerMin) * this.stageMultiplier);

    const boss = this.enemies.create(x, y, type.texture);
    boss.setData('type', bossTypeKey);
    boss.setData('isBoss', true);
    boss.setData('hp', maxHp);
    boss.setData('maxHp', maxHp);
    boss.setData('speed', Math.round(type.baseSpeed + minutes * type.speedPerMin));
    boss.setData('damage', Math.round(type.damage * this.stageMultiplier));
    boss.setData('nextShotAt', this.time.now + 1000);
    boss.setDepth(11);

    this.isBossAlive = true;
    this.currentBoss = boss;
    this.bossFightCountdown = BOSS_FIGHT_LIMIT_MS;
    this.bossLabel.setVisible(true);
    this.bossBarBg.setVisible(true);
    this.bossBarFill.setVisible(true);
  }

  applyBossOverstayPenalty() {
    this.stageMultiplier *= BOSS_OVERSTAY_MULTIPLIER;
    this.showFloatingText(this.scale.width / 2, this.scale.height / 2 - 80, '¡Los enemigos se hacen más fuertes!', '#ff5566');
  }

  updateRangedBoss(boss, time) {
    const d = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
    const speed = boss.getData('speed');

    if (d > BOSS_RANGED_PREFERRED_DIST + 40) {
      this.physics.moveToObject(boss, this.player, speed);
    } else if (d < BOSS_RANGED_PREFERRED_DIST - 40) {
      this.physics.moveToObject(boss, this.player, -speed);
    } else {
      boss.setVelocity(0, 0);
    }

    if (time >= (boss.getData('nextShotAt') || 0)) {
      boss.setData('nextShotAt', time + BOSS_SHOT_COOLDOWN_MS);
      this.fireBossProjectile(boss);
    }
  }

  fireBossProjectile(boss) {
    const marker = this.add.circle(boss.x, boss.y, 10, 0xff3333, 0.6).setDepth(9);
    this.tweens.add({
      targets: marker,
      scale: 2,
      alpha: 0,
      duration: BOSS_TELEGRAPH_MS,
      onComplete: () => marker.destroy(),
    });

    this.time.delayedCall(BOSS_TELEGRAPH_MS, () => {
      if (!boss.active || this.isGameOver) return;
      const proj = this.bossProjectiles.create(boss.x, boss.y, 'bossBolt');
      proj.setData('damage', boss.getData('damage'));
      proj.setData('bornAt', this.time.now);
      this.physics.moveToObject(proj, this.player, BOSS_PROJECTILE_SPEED);
    });
  }

  rampDifficulty() {
    this.spawnTimer.delay = Math.max(SPAWN_DELAY_MIN, Math.round(this.spawnTimer.delay * 0.85));
  }

  getNearestEnemy() {
    return this.getNearestEnemies(1)[0] || null;
  }

  getNearestEnemies(n) {
    return this.enemies.getChildren()
      .filter((e) => e.active)
      .map((e) => ({ e, d: Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, n)
      .map((item) => item.e);
  }

  fireAtNearest() {
    if (this.isGameOver || this.isLevelingUp) return;
    const target = this.getNearestEnemy();
    if (!target) return;

    const proj = this.projectiles.create(this.player.x, this.player.y, 'projectile');
    proj.setData('damage', this.stats.damage);
    proj.setData('bornAt', this.time.now);
    this.physics.moveToObject(proj, target, PROJECTILE_SPEED);
  }

  onProjectileHitEnemy(proj, enemy) {
    const damage = proj.getData('damage');
    proj.destroy();
    this.damageEnemy(enemy, damage);
  }

  firePierce() {
    if (this.isGameOver || this.isLevelingUp || !this.stats.hasPierce) return;
    const target = this.getNearestEnemy();
    if (!target) return;

    const proj = this.pierceProjectiles.create(this.player.x, this.player.y, 'pierce');
    proj.setData('damage', this.stats.pierceDamage);
    proj.setData('bornAt', this.time.now);
    proj.setData('hitSet', new Set());
    proj.setRotation(Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y));
    this.physics.moveToObject(proj, target, this.stats.pierceSpeed);
  }

  onPierceHitEnemy(proj, enemy) {
    if (!proj.active || !enemy.active) return;
    const hitSet = proj.getData('hitSet');
    if (hitSet.has(enemy)) return;
    hitSet.add(enemy);
    this.damageEnemy(enemy, proj.getData('damage'));
  }

  fireBurst() {
    if (this.isGameOver || this.isLevelingUp || !this.stats.hasBurst) return;
    const targets = this.getNearestEnemies(this.stats.burstCount);
    targets.forEach((target) => {
      const proj = this.projectiles.create(this.player.x, this.player.y, 'projectile');
      proj.setData('damage', this.stats.burstDamage);
      proj.setData('bornAt', this.time.now);
      this.physics.moveToObject(proj, target, PROJECTILE_SPEED);
    });
  }

  fireNova() {
    if (this.isGameOver || this.isLevelingUp || !this.stats.hasNova) return;

    const ring = this.add.circle(this.player.x, this.player.y, this.stats.novaRadius, 0xffaa00, 0.3)
      .setDepth(4).setScale(0.1);
    this.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 300, onComplete: () => ring.destroy() });

    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d <= this.stats.novaRadius) {
        this.damageEnemy(e, this.stats.novaDamage);
      }
    });
  }

  damageEnemy(enemy, rawDamage) {
    if (!enemy.active) return;
    const damage = Math.max(1, Math.round(rawDamage));

    this.showDamageNumber(enemy.x, enemy.y, damage);

    if (this.stats.lifesteal > 0) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + damage * this.stats.lifesteal);
    }

    const hp = enemy.getData('hp') - damage;
    if (hp <= 0) {
      const isBoss = enemy.getData('isBoss');
      const color = ENEMY_TYPES[enemy.getData('type')].color;
      this.deathEmitter.setParticleTint(color);
      this.deathEmitter.emitParticleAt(enemy.x, enemy.y, isBoss ? 30 : 10);

      if (isBoss) {
        this.isBossAlive = false;
        this.currentBoss = null;
        this.bossFightCountdown = null;
        this.bossCountdown = BOSS_COUNTDOWN_MS;
        this.bossLabel.setText('JEFE').setVisible(false);
        this.bossBarBg.setVisible(false);
        this.bossBarFill.setVisible(false);

        this.stageMultiplier *= STAGE_BOSS_MULTIPLIER;
        this.spawnPortal();
        this.levelUp();
      } else {
        const type = ENEMY_TYPES[enemy.getData('type')];
        this.spawnXpOrb(enemy.x, enemy.y, type.xpValue);
      }
      enemy.destroy();
    } else {
      enemy.setData('hp', hp);
      enemy.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.time.delayedCall(60, () => enemy.active && enemy.clearTint());

      const push = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y);
      if (push.lengthSq() > 0) {
        push.normalize().scale(ENEMY_KNOCKBACK_SPEED);
        enemy.setVelocity(push.x, push.y);
        enemy.setData('knockbackUntil', this.time.now + ENEMY_KNOCKBACK_MS);
      }
    }
  }

  showDamageNumber(x, y, amount) {
    this.showFloatingText(x, y, String(amount), '#ffffff');
  }

  showFloatingText(x, y, message, color) {
    const text = this.add.text(x, y - 10, message, {
      fontFamily: 'monospace', fontSize: '14px', color,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy(),
    });
  }

  spawnXpOrb(x, y, value = 1) {
    const orb = this.xpOrbs.create(x, y, 'xp');
    orb.setData('value', value);
  }

  spawnPortal() {
    if (this.portal) this.portal.destroy();

    const { x, y } = this.randomPointNear(this.portalSpawnRadius);
    this.portal = this.add.image(x, y, 'portal').setDepth(6);
    this.tweens.add({ targets: this.portal, angle: 360, duration: 3000, repeat: -1 });
  }

  spawnChest() {
    if (this.isGameOver || this.isLevelingUp || this.chest) return;

    const { x, y } = this.randomPointNear(this.chestSpawnRadius);
    this.chest = this.add.image(x, y, 'chest').setDepth(6);
    this.tweens.add({ targets: this.chest, y: y - 6, duration: 500, yoyo: true, repeat: -1 });
  }

  openChest() {
    const { x, y } = this.chest;
    this.chest.destroy();
    this.chest = null;

    this.deathEmitter.setParticleTint(0xffcc44);
    this.deathEmitter.emitParticleAt(x, y, 15);

    this.levelUp();
  }

  applyStageTheme() {
    const theme = STAGE_THEMES[this.stage] || STAGE_THEMES[1];
    this.worldGrid.setFillStyle(theme.fill, 1);
    this.worldGrid.setStrokeStyle(1, theme.line, 1);
    this.cameras.main.setBackgroundColor(theme.bg);
  }

  enterPortal() {
    this.stage += 1;
    this.stageMultiplier *= STAGE_PORTAL_MULTIPLIER;
    this.portal.destroy();
    this.portal = null;

    if (this.stage >= VICTORY_STAGE) {
      this.onVictory();
      return;
    }

    this.player.setPosition(WORLD_SIZE / 2, WORLD_SIZE / 2);
    this.player.setVelocity(0, 0);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.applyStageTheme();
    // No destruyo un jefe si justo hay uno vivo (pudo aparecer otro por el cronometro
    // mientras este portal seguia sin cruzarse) - solo despejo la oleada comun.
    this.enemies.getChildren().slice().forEach((e) => {
      if (!e.getData('isBoss')) e.destroy();
    });

    const cy = this.scale.height / 2;
    const text = this.add.text(this.scale.width / 2, cy, `ETAPA ${this.stage}`, {
      fontFamily: 'monospace', fontSize: '32px', color: '#aa88ff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: cy - 40,
      duration: 1200,
      delay: 400,
      onComplete: () => text.destroy(),
    });
  }

  onPlayerPickupXp(player, orb) {
    const value = orb.getData('value') || 1;
    orb.destroy();
    this.xp += value;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.xpToNext = Math.round(this.xpToNext * 1.25);
      this.levelUp();
    }
  }

  onPlayerHitEnemy(player, enemy) {
    if (this.isGameOver || this.isLevelingUp) return;
    this.damagePlayer(enemy.getData('damage'), enemy.x, enemy.y);
  }

  onBossProjectileHitPlayer(player, proj) {
    if (this.isGameOver || this.isLevelingUp) return;
    const damage = proj.getData('damage');
    const sx = proj.x;
    const sy = proj.y;
    proj.destroy();
    this.damagePlayer(damage, sx, sy);
  }

  damagePlayer(amount, sourceX, sourceY) {
    const now = this.time.now;
    if (now - this.lastHitAt < HIT_INVULN_MS) return;
    this.lastHitAt = now;

    if (Math.random() < this.stats.dodge) {
      this.showFloatingText(this.player.x, this.player.y, '¡ESQUIVÉ!', '#88ddff');
      return;
    }

    this.lastDamageTakenAt = now;
    let remaining = amount;
    if (this.stats.shield > 0) {
      const absorbed = Math.min(this.stats.shield, remaining);
      this.stats.shield -= absorbed;
      remaining -= absorbed;
    }
    this.stats.hp -= remaining;
    this.cameras.main.shake(150, 0.008);
    this.player.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(80, () => this.player.active && this.player.clearTint());

    const push = new Phaser.Math.Vector2(this.player.x - sourceX, this.player.y - sourceY);
    if (push.lengthSq() > 0) {
      push.normalize().scale(PLAYER_KNOCKBACK_SPEED);
      this.player.setVelocity(push.x, push.y);
      this.playerKnockbackUntil = now + PLAYER_KNOCKBACK_MS;
    }

    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.onGameOver();
    }
  }

  onGameOver() {
    this.isGameOver = true;
    this.setTimersPaused(true);
    this.showEndScreen('GAME OVER', '#ff5566');
  }

  onVictory() {
    this.hasWon = true;
    this.setTimersPaused(true);
    this.showEndScreen('¡VICTORIA!', '#ffcc44');
  }

  getBestTime() {
    try {
      return Number(localStorage.getItem(BEST_TIME_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  saveBestTime(ms) {
    try {
      if (ms > this.getBestTime()) {
        localStorage.setItem(BEST_TIME_KEY, String(Math.floor(ms)));
        return true;
      }
    } catch {
      // localStorage no disponible (ej. modo privado) - seguimos sin guardar
    }
    return false;
  }

  showEndScreen(title, color) {
    const isNewBest = this.saveBestTime(this.elapsed);
    const bestTime = this.getBestTime();

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.add.text(cx, cy - 40, title, { fontFamily: 'monospace', fontSize: '40px', color })
      .setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.add.text(cx, cy + 10, `Sobreviviste ${this.formatTime(this.elapsed)} - Nivel ${this.level}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.add.text(cx, cy + 40, isNewBest ? `¡Nuevo mejor tiempo! ${this.formatTime(bestTime)}` : `Mejor tiempo: ${this.formatTime(bestTime)}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffcc44',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.add.text(cx, cy + 75, 'Presiona R para reiniciar', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.input.keyboard.once('keydown-R', () => this.scene.restart());
  }

  buildLevelUpUI() {
    this.levelUpCardW = 320;
    this.levelUpCardH = 130;

    this.levelUpTitle = this.add.text(0, 100, 'SUBISTE DE NIVEL', {
      fontFamily: 'monospace', fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    this.levelUpCards = [0, 1, 2, 3].map((i) => {
      const bg = this.add.rectangle(0, 0, this.levelUpCardW, this.levelUpCardH, 0x181830, 0.97)
        .setOrigin(0, 0).setStrokeStyle(3, 0x444466)
        .setScrollFactor(0).setDepth(100).setVisible(false)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.chooseUpgrade(i));
      bg.on('pointerover', () => bg.setStrokeStyle(4, bg.getData('rarityColor') || 0x444466));
      bg.on('pointerout', () => bg.setStrokeStyle(3, bg.getData('rarityColor') || 0x444466));

      const keyText = this.add.text(0, 0, `[${i + 1}]`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#888899',
      }).setScrollFactor(0).setDepth(101).setVisible(false);

      const rarityText = this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(101).setVisible(false);

      const text = this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '17px', color: '#66ffcc', align: 'center',
        wordWrap: { width: this.levelUpCardW - 36 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setVisible(false);

      return { bg, keyText, rarityText, text };
    });

    this.input.keyboard.on('keydown-ONE', () => this.chooseUpgrade(0));
    this.input.keyboard.on('keydown-TWO', () => this.chooseUpgrade(1));
    this.input.keyboard.on('keydown-THREE', () => this.chooseUpgrade(2));
    this.input.keyboard.on('keydown-FOUR', () => this.chooseUpgrade(3));
  }

  getAvailableUpgrades() {
    const notMaxed = (u) => !u.isMaxed || !u.isMaxed(this.stats);
    const pool = STAT_UPGRADES.filter(notMaxed);

    WEAPON_KEYS.forEach((key) => {
      const flag = `has${key[0].toUpperCase()}${key.slice(1)}`;
      const weapon = WEAPON_UPGRADES[key];
      if (!this.stats[flag]) {
        pool.push(weapon.unlock);
        return;
      }
      const available = weapon.upgrades.filter(notMaxed);
      if (available.length > 0) pool.push(Phaser.Utils.Array.GetRandom(available));
    });

    return pool;
  }

  pickWeighted(pool, count) {
    const remaining = [...pool];
    const picked = [];
    while (picked.length < count && remaining.length > 0) {
      const totalWeight = remaining.reduce((sum, c) => sum + RARITY_WEIGHT[c.rarity || 'common'], 0);
      let roll = Math.random() * totalWeight;
      let idx = 0;
      for (; idx < remaining.length - 1; idx++) {
        roll -= RARITY_WEIGHT[remaining[idx].rarity || 'common'];
        if (roll <= 0) break;
      }
      picked.push(remaining.splice(idx, 1)[0]);
    }
    return picked;
  }

  syncTimerDelays() {
    this.attackTimer.delay = this.stats.fireRate;
    if (this.stats.hasPierce) this.pierceTimer.delay = this.stats.pierceRate;
    if (this.stats.hasBurst) this.burstTimer.delay = this.stats.burstRate;
    if (this.stats.hasNova) this.novaTimer.delay = this.stats.novaRate;
  }

  applyLevelScaling() {
    const s = this.stats;

    GROWTH_STATS.forEach(({ key, cap, requires }) => {
      if (requires && !s[requires]) return;
      const value = s[key] * LEVEL_SCALE_UP;
      s[key] = cap != null ? Math.min(cap, value) : value;
    });

    COOLDOWN_STATS.forEach(({ key, floor, requires }) => {
      if (requires && !s[requires]) return;
      s[key] = Math.max(floor, s[key] * LEVEL_SCALE_DOWN);
    });

    const hpGain = s.maxHp * (LEVEL_SCALE_UP - 1);
    s.maxHp += hpGain;
    s.hp += hpGain;

    this.syncTimerDelays();
  }

  levelUp() {
    this.level += 1;
    this.applyLevelScaling();
    this.startLevelUp();
  }

  startLevelUp() {
    this.isLevelingUp = true;
    this.player.setVelocity(0, 0);
    this.physics.world.pause();

    this.levelUpChoices = this.pickWeighted(this.getAvailableUpgrades(), 4);
    this.levelUpChoices.forEach((choice, i) => {
      const after = { ...this.stats };
      choice.apply(after);
      const rarity = choice.rarity || 'common';
      const color = RARITY_COLOR_NUM[rarity];
      const card = this.levelUpCards[i];

      card.bg.setData('rarityColor', color).setStrokeStyle(3, color).setVisible(true);
      card.keyText.setVisible(true);
      card.rarityText.setText(RARITY_LABEL[rarity]).setColor(RARITY_COLOR[rarity]).setVisible(true);
      card.text.setText(choice.describe(this.stats, after)).setColor(RARITY_COLOR[rarity]).setVisible(true);
    });
    this.levelUpTitle.setVisible(true);
  }

  chooseUpgrade(i) {
    if (!this.isLevelingUp) return;
    const choice = this.levelUpChoices[i];
    if (!choice) return;

    choice.apply(this.stats);
    this.syncTimerDelays();
    this.syncWeapons();

    this.levelUpTitle.setVisible(false);
    this.levelUpCards.forEach((card) => {
      card.bg.setVisible(false);
      card.keyText.setVisible(false);
      card.rarityText.setVisible(false);
      card.text.setVisible(false);
    });
    this.isLevelingUp = false;
    this.physics.world.resume();
    this.lastHitAt = this.time.now;
  }

  syncWeapons() {
    if (this.stats.hasAura && !this.auraGfx) {
      this.auraGfx = this.add.circle(this.player.x, this.player.y, this.stats.auraRadius, 0x66ffcc, 0.15);
      this.auraGfx.setDepth(5);
      this.auraTickAt = 0;
    }

    if (this.stats.hasOrbit) {
      while (this.orbitOrbs.length < this.stats.orbitCount) {
        const orb = this.add.image(this.player.x, this.player.y, 'orbit');
        orb.setDepth(12);
        this.orbitOrbs.push(orb);
      }
    }
  }
}

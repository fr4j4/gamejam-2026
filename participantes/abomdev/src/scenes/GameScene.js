import Phaser from 'phaser';

const WORLD_SIZE = 2000;
const PLAYER_MAX_HP = 100;
const SPAWN_RADIUS = 500;
const XP_PICKUP_SPEED = 320;
const PROJECTILE_SPEED = 520;
const PROJECTILE_LIFETIME = 2000;
const HIT_INVULN_MS = 500;
const SPAWN_DELAY_MIN = 300;
const DIFFICULTY_RAMP_MS = 12000;
const BOSS_DELAY_MS = 150000;
const BOSS_WARNING_MS = 2500;
const ORBIT_HIT_RADIUS = 22;
const ORBIT_HIT_COOLDOWN_MS = 300;
const ENEMY_KNOCKBACK_SPEED = 220;
const ENEMY_KNOCKBACK_MS = 150;
const PLAYER_KNOCKBACK_SPEED = 260;
const PLAYER_KNOCKBACK_MS = 150;
const PORTAL_SPAWN_RADIUS = 350;
const PORTAL_TRIGGER_RADIUS = 40;
const STAGE_BOSS_MULTIPLIER = 1.15;
const STAGE_PORTAL_MULTIPLIER = 1.5;
const PIERCE_LIFETIME = 1200;
const BOSS_PROJECTILE_SPEED = 220;
const BOSS_PROJECTILE_LIFETIME = 3000;
const BOSS_RANGED_PREFERRED_DIST = 260;
const BOSS_SHOT_COOLDOWN_MS = 1800;
const BOSS_TELEGRAPH_MS = 400;

const ENEMY_TYPES = {
  normal: { texture: 'enemy', color: 0xff5566, baseHp: 20, hpPerMin: 10, baseSpeed: 80, speedPerMin: 8, damage: 10 },
  fast: { texture: 'enemyFast', color: 0xffaa33, baseHp: 8, hpPerMin: 4, baseSpeed: 160, speedPerMin: 12, damage: 6 },
  tank: { texture: 'enemyTank', color: 0x88cc44, baseHp: 60, hpPerMin: 22, baseSpeed: 45, speedPerMin: 3, damage: 18 },
  boss: { texture: 'boss', color: 0xff33aa, baseHp: 250, hpPerMin: 50, baseSpeed: 50, speedPerMin: 4, damage: 20 },
  bossRanged: { texture: 'bossRanged', color: 0x33ccff, baseHp: 200, hpPerMin: 45, baseSpeed: 70, speedPerMin: 4, damage: 15 },
};

const STAT_UPGRADES = [
  { key: 'damage', describe: (b, a) => `Daño: ${b.damage} → ${a.damage}`, apply: (s) => { s.damage += 5; } },
  {
    key: 'fireRate',
    describe: (b, a) => `Cadencia: ${(1000 / b.fireRate).toFixed(1)}/s → ${(1000 / a.fireRate).toFixed(1)}/s`,
    apply: (s) => { s.fireRate = Math.round(s.fireRate * 0.85); },
  },
  { key: 'moveSpeed', describe: (b, a) => `Velocidad: ${b.moveSpeed} → ${a.moveSpeed}`, apply: (s) => { s.moveSpeed = Math.round(s.moveSpeed * 1.1); } },
  { key: 'maxHp', describe: (b, a) => `HP máximo: ${b.maxHp} → ${a.maxHp}`, apply: (s) => { s.maxHp += 20; s.hp += 20; } },
  { key: 'magnet', describe: (b, a) => `Radio de imán: ${b.magnetRadius} → ${a.magnetRadius}`, apply: (s) => { s.magnetRadius = Math.round(s.magnetRadius * 1.4); } },
];

const WEAPON_UPGRADES = {
  aura: {
    unlock: {
      key: 'auraUnlock',
      describe: (b, a) => `Nueva arma: Aura de daño (${a.auraDamage} dmg, radio ${a.auraRadius})`,
      apply: (s) => { s.hasAura = true; s.auraDamage = 8; s.auraRadius = 90; s.auraTickMs = 600; },
    },
    upgrades: [
      { key: 'auraDamage', describe: (b, a) => `Aura daño: ${b.auraDamage} → ${a.auraDamage}`, apply: (s) => { s.auraDamage += 5; } },
      { key: 'auraRadius', describe: (b, a) => `Aura radio: ${b.auraRadius} → ${a.auraRadius}`, apply: (s) => { s.auraRadius = Math.round(s.auraRadius * 1.25); } },
    ],
  },
  orbit: {
    unlock: {
      key: 'orbitUnlock',
      describe: (b, a) => `Nueva arma: Orbe giratorio (${a.orbitCount} orbes, ${a.orbitDamage} dmg)`,
      apply: (s) => { s.hasOrbit = true; s.orbitDamage = 8; s.orbitRadius = 70; s.orbitSpeed = 2.2; s.orbitCount = 2; },
    },
    upgrades: [
      { key: 'orbitDamage', describe: (b, a) => `Orbe daño: ${b.orbitDamage} → ${a.orbitDamage}`, apply: (s) => { s.orbitDamage += 5; } },
      { key: 'orbitCount', describe: (b, a) => `Orbe cantidad: ${b.orbitCount} → ${a.orbitCount}`, apply: (s) => { s.orbitCount += 1; } },
      { key: 'orbitSpeed', describe: (b, a) => `Orbe velocidad: ${b.orbitSpeed.toFixed(2)} → ${a.orbitSpeed.toFixed(2)}`, apply: (s) => { s.orbitSpeed *= 1.25; } },
    ],
  },
  pierce: {
    unlock: {
      key: 'pierceUnlock',
      describe: (b, a) => `Nueva arma: Perforante (${a.pierceDamage} dmg, atraviesa todo)`,
      apply: (s) => { s.hasPierce = true; s.pierceDamage = 15; s.pierceRate = 1200; s.pierceSpeed = 600; },
    },
    upgrades: [
      { key: 'pierceDamage', describe: (b, a) => `Perforante daño: ${b.pierceDamage} → ${a.pierceDamage}`, apply: (s) => { s.pierceDamage += 8; } },
      {
        key: 'pierceRate',
        describe: (b, a) => `Perforante cadencia: ${(1000 / b.pierceRate).toFixed(1)}/s → ${(1000 / a.pierceRate).toFixed(1)}/s`,
        apply: (s) => { s.pierceRate = Math.round(s.pierceRate * 0.85); },
      },
    ],
  },
};

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
    };
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 10;
    this.elapsed = 0;
    this.isLevelingUp = false;
    this.isGameOver = false;
    this.hasStarted = false;
    this.lastHitAt = -Infinity;
    this.auraGfx = null;
    this.auraTickAt = 0;
    this.orbitOrbs = [];
    this.isBossAlive = false;
    this.currentBoss = null;
    this.playerKnockbackUntil = 0;
    this.stage = 1;
    this.stageMultiplier = 1;
    this.portal = null;
    this.isPaused = false;

    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

    const grid = this.add.grid(WORLD_SIZE / 2, WORLD_SIZE / 2, WORLD_SIZE, WORLD_SIZE, 64, 64, 0x1a1a2e, 1, 0x2a2a4e, 1);
    grid.setDepth(-1);

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
    this.difficultyTimer = this.time.addEvent({ delay: DIFFICULTY_RAMP_MS, loop: true, callback: this.rampDifficulty, callbackScope: this });
    this.bossTimer = this.time.addEvent({ delay: BOSS_DELAY_MS, loop: true, callback: this.warnBoss, callbackScope: this });
    this.spawnTimer.paused = true;
    this.attackTimer.paused = true;
    this.pierceTimer.paused = true;
    this.difficultyTimer.paused = true;
    this.bossTimer.paused = true;

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
    this.updateHud();

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
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
  }

  buildStartScreen() {
    this.startText = this.add.text(400, 300,
      'SURVIVORS\n\nWASD / Flechas para moverte\nAtaque automático al enemigo más cercano\n\nPresioná una tecla para empezar',
      { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(300);

    this.input.keyboard.once('keydown', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  startGame() {
    if (this.hasStarted) return;
    this.hasStarted = true;
    this.startText.destroy();
    this.spawnTimer.paused = false;
    this.attackTimer.paused = false;
    this.pierceTimer.paused = false;
    this.difficultyTimer.paused = false;
    this.bossTimer.paused = false;
  }

  buildHud() {
    this.add.rectangle(20, 20, 200, 18, 0x222244).setOrigin(0, 0).setScrollFactor(0).setDepth(150);
    this.hpBarFill = this.add.rectangle(22, 22, 196, 14, 0xff5566).setOrigin(0, 0).setScrollFactor(0).setDepth(151);
    this.hpText = this.add.text(226, 20, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setScrollFactor(0).setDepth(151);

    this.add.rectangle(20, 44, 200, 10, 0x222244).setOrigin(0, 0).setScrollFactor(0).setDepth(150);
    this.xpBarFill = this.add.rectangle(21, 45, 198, 8, 0xaa88ff).setOrigin(0, 0).setScrollFactor(0).setDepth(151);

    this.levelText = this.add.text(20, 58, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setScrollFactor(0).setDepth(151);
    this.timerText = this.add.text(780, 20, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(151);
  }

  buildBossBar() {
    const barX = 250;
    const barY = 552;
    const barW = 300;
    const barH = 16;
    this.bossBarMaxWidth = barW - 4;

    this.bossLabel = this.add.text(400, barY - 18, 'JEFE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff88cc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setVisible(false);
    this.bossBarBg = this.add.rectangle(barX, barY, barW, barH, 0x222244).setOrigin(0, 0).setScrollFactor(0).setDepth(150).setVisible(false);
    this.bossBarFill = this.add.rectangle(barX + 2, barY + 2, this.bossBarMaxWidth, barH - 4, 0xff33aa).setOrigin(0, 0).setScrollFactor(0).setDepth(151).setVisible(false);
  }

  buildMinimap() {
    this.minimapX = 630;
    this.minimapY = 430;
    this.minimapSize = 150;
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

    const pp = toMinimap(this.player.x, this.player.y);
    gfx.fillStyle(0x66ffcc, 1);
    gfx.fillCircle(pp.x, pp.y, 3);
  }

  buildPauseMenu() {
    this.pauseTitle = this.add.text(400, 130, 'PAUSADO', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setVisible(false);

    this.pauseStats = this.add.text(400, 320, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#66ffcc', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setVisible(false);

    this.pauseHint = this.add.text(400, 520, 'Presioná ESC para continuar', {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setVisible(false);
  }

  togglePause() {
    if (!this.hasStarted || this.isGameOver || this.isLevelingUp) return;
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
    this.spawnTimer.paused = true;
    this.attackTimer.paused = true;
    this.pierceTimer.paused = true;
    this.difficultyTimer.paused = true;
    this.bossTimer.paused = true;

    const s = this.stats;
    const lines = [
      `Daño: ${s.damage}`,
      `Cadencia: ${(1000 / s.fireRate).toFixed(1)}/s`,
      `Velocidad: ${s.moveSpeed}`,
      `HP máximo: ${s.maxHp}`,
      `Radio de imán: ${s.magnetRadius}`,
      `Etapa: ${this.stage} (x${this.stageMultiplier.toFixed(2)})`,
    ];
    if (s.hasAura) lines.push(`Aura — daño ${s.auraDamage}, radio ${s.auraRadius}`);
    if (s.hasOrbit) lines.push(`Orbe — daño ${s.orbitDamage}, cantidad ${s.orbitCount}, velocidad ${s.orbitSpeed.toFixed(2)}`);
    if (s.hasPierce) lines.push(`Perforante — daño ${s.pierceDamage}, cadencia ${(1000 / s.pierceRate).toFixed(1)}/s`);

    this.pauseStats.setText(lines.join('\n'));
    this.pauseTitle.setVisible(true);
    this.pauseStats.setVisible(true);
    this.pauseHint.setVisible(true);
  }

  resumeGame() {
    this.isPaused = false;
    this.physics.world.resume();
    this.spawnTimer.paused = false;
    this.attackTimer.paused = false;
    this.pierceTimer.paused = false;
    this.difficultyTimer.paused = false;
    this.bossTimer.paused = false;

    this.pauseTitle.setVisible(false);
    this.pauseStats.setVisible(false);
    this.pauseHint.setVisible(false);
  }

  updateHud() {
    const hpRatio = Phaser.Math.Clamp(this.stats.hp / this.stats.maxHp, 0, 1);
    this.hpBarFill.width = 196 * hpRatio;
    this.hpText.setText(`${Math.ceil(this.stats.hp)}/${this.stats.maxHp}`);

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
    if (!this.hasStarted || this.isGameOver || this.isLevelingUp || this.isPaused) {
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

  spawnEnemy() {
    if (this.isGameOver || this.isLevelingUp) return;

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * SPAWN_RADIUS, 20, WORLD_SIZE - 20);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * SPAWN_RADIUS, 20, WORLD_SIZE - 20);

    const minutes = this.elapsed / 60000;
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

    const warning = this.add.text(400, 300, '¡EL JEFE SE ACERCA!', {
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

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * SPAWN_RADIUS, 20, WORLD_SIZE - 20);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * SPAWN_RADIUS, 20, WORLD_SIZE - 20);

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
    this.bossLabel.setVisible(true);
    this.bossBarBg.setVisible(true);
    this.bossBarFill.setVisible(true);
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
    let nearest = null;
    let nearestDist = Infinity;
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    });
    return nearest;
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

  damageEnemy(enemy, damage) {
    if (!enemy.active) return;

    this.showDamageNumber(enemy.x, enemy.y, damage);

    const hp = enemy.getData('hp') - damage;
    if (hp <= 0) {
      const isBoss = enemy.getData('isBoss');
      const color = ENEMY_TYPES[enemy.getData('type')].color;
      this.deathEmitter.setParticleTint(color);
      this.deathEmitter.emitParticleAt(enemy.x, enemy.y, isBoss ? 30 : 10);

      if (isBoss) {
        this.isBossAlive = false;
        this.currentBoss = null;
        this.bossLabel.setVisible(false);
        this.bossBarBg.setVisible(false);
        this.bossBarFill.setVisible(false);

        this.stageMultiplier *= STAGE_BOSS_MULTIPLIER;
        this.spawnPortal();
        this.level += 1;
        this.startLevelUp();
      } else {
        this.spawnXpOrb(enemy.x, enemy.y);
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
    const text = this.add.text(x, y - 10, String(amount), {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
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

  spawnXpOrb(x, y) {
    this.xpOrbs.create(x, y, 'xp');
  }

  spawnPortal() {
    if (this.portal) this.portal.destroy();

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * PORTAL_SPAWN_RADIUS, 20, WORLD_SIZE - 20);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * PORTAL_SPAWN_RADIUS, 20, WORLD_SIZE - 20);

    this.portal = this.add.image(x, y, 'portal').setDepth(6);
    this.tweens.add({ targets: this.portal, angle: 360, duration: 3000, repeat: -1 });
  }

  enterPortal() {
    this.stage += 1;
    this.stageMultiplier *= STAGE_PORTAL_MULTIPLIER;
    this.portal.destroy();
    this.portal = null;

    const text = this.add.text(400, 300, `ETAPA ${this.stage}`, {
      fontFamily: 'monospace', fontSize: '32px', color: '#aa88ff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: 260,
      duration: 1200,
      delay: 400,
      onComplete: () => text.destroy(),
    });
  }

  onPlayerPickupXp(player, orb) {
    orb.destroy();
    this.xp += 1;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.xpToNext = Math.round(this.xpToNext * 1.25);
      this.level += 1;
      this.startLevelUp();
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

    this.stats.hp -= amount;
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
    this.spawnTimer.paused = true;
    this.attackTimer.paused = true;
    this.pierceTimer.paused = true;
    this.difficultyTimer.paused = true;
    this.bossTimer.paused = true;

    this.add.text(400, 280, 'GAME OVER', { fontFamily: 'monospace', fontSize: '40px', color: '#ff5566' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.add.text(400, 330, `Sobreviviste ${this.formatTime(this.elapsed)} - Nivel ${this.level}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.add.text(400, 365, 'Presioná R para reiniciar', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.input.keyboard.once('keydown-R', () => this.scene.restart());
  }

  buildLevelUpUI() {
    this.levelUpTitle = this.add.text(400, 190, 'SUBISTE DE NIVEL', {
      fontFamily: 'monospace', fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    this.levelUpTexts = [0, 1, 2, 3].map((i) => {
      const t = this.add.text(400, 240 + i * 50, '', {
        fontFamily: 'monospace', fontSize: '20px', color: '#66ffcc',
        backgroundColor: '#222244', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.chooseUpgrade(i));
      return t;
    });

    this.input.keyboard.on('keydown-ONE', () => this.chooseUpgrade(0));
    this.input.keyboard.on('keydown-TWO', () => this.chooseUpgrade(1));
    this.input.keyboard.on('keydown-THREE', () => this.chooseUpgrade(2));
    this.input.keyboard.on('keydown-FOUR', () => this.chooseUpgrade(3));
  }

  getAvailableUpgrades() {
    const pool = [...STAT_UPGRADES];
    pool.push(this.stats.hasAura ? Phaser.Utils.Array.GetRandom(WEAPON_UPGRADES.aura.upgrades) : WEAPON_UPGRADES.aura.unlock);
    pool.push(this.stats.hasOrbit ? Phaser.Utils.Array.GetRandom(WEAPON_UPGRADES.orbit.upgrades) : WEAPON_UPGRADES.orbit.unlock);
    pool.push(this.stats.hasPierce ? Phaser.Utils.Array.GetRandom(WEAPON_UPGRADES.pierce.upgrades) : WEAPON_UPGRADES.pierce.unlock);
    return pool;
  }

  startLevelUp() {
    this.isLevelingUp = true;
    this.player.setVelocity(0, 0);
    this.physics.world.pause();

    this.levelUpChoices = Phaser.Utils.Array.Shuffle(this.getAvailableUpgrades()).slice(0, 4);
    this.levelUpChoices.forEach((choice, i) => {
      const after = { ...this.stats };
      choice.apply(after);
      this.levelUpTexts[i].setText(`${i + 1}. ${choice.describe(this.stats, after)}`).setVisible(true);
    });
    this.levelUpTitle.setVisible(true);
  }

  chooseUpgrade(i) {
    if (!this.isLevelingUp) return;
    const choice = this.levelUpChoices[i];
    if (!choice) return;

    choice.apply(this.stats);
    this.attackTimer.delay = this.stats.fireRate;
    if (this.stats.hasPierce) this.pierceTimer.delay = this.stats.pierceRate;
    this.syncWeapons();

    this.levelUpTitle.setVisible(false);
    this.levelUpTexts.forEach((t) => t.setVisible(false));
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

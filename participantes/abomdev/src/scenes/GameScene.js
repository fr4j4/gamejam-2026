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

const UPGRADE_POOL = [
  { key: 'damage', label: '+5 Daño', apply: (s) => { s.damage += 5; } },
  { key: 'fireRate', label: '+15% Cadencia de ataque', apply: (s) => { s.fireRate = Math.round(s.fireRate * 0.85); } },
  { key: 'moveSpeed', label: '+10% Velocidad', apply: (s) => { s.moveSpeed = Math.round(s.moveSpeed * 1.1); } },
  { key: 'maxHp', label: '+20 HP máximo', apply: (s) => { s.maxHp += 20; s.hp += 20; } },
  { key: 'magnet', label: '+40% Radio de imán', apply: (s) => { s.magnetRadius = Math.round(s.magnetRadius * 1.4); } },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    this.stats = {
      damage: 10,
      fireRate: 700,
      moveSpeed: 220,
      maxHp: PLAYER_MAX_HP,
      hp: PLAYER_MAX_HP,
      magnetRadius: 90,
    };
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 10;
    this.elapsed = 0;
    this.isLevelingUp = false;
    this.isGameOver = false;
    this.lastHitAt = -Infinity;

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
    this.xpOrbs = this.physics.add.group();

    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this.onPlayerPickupXp, null, this);

    this.spawnTimer = this.time.addEvent({ delay: 1000, loop: true, callback: this.spawnEnemy, callbackScope: this });
    this.attackTimer = this.time.addEvent({ delay: this.stats.fireRate, loop: true, callback: this.fireAtNearest, callbackScope: this });
    this.difficultyTimer = this.time.addEvent({ delay: DIFFICULTY_RAMP_MS, loop: true, callback: this.rampDifficulty, callbackScope: this });

    this.buildLevelUpUI();
  }

  generateTextures() {
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
  }

  update(time, delta) {
    if (this.isGameOver || this.isLevelingUp) {
      this.player.setVelocity(0, 0);
      return;
    }

    this.elapsed += delta;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    const dir = new Phaser.Math.Vector2((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
    if (dir.lengthSq() > 0) {
      dir.normalize().scale(this.stats.moveSpeed);
      this.player.setVelocity(dir.x, dir.y);
    } else {
      this.player.setVelocity(0, 0);
    }

    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      this.physics.moveToObject(e, this.player, e.getData('speed'));
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
  }

  spawnEnemy() {
    if (this.isGameOver || this.isLevelingUp) return;

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * SPAWN_RADIUS, 20, WORLD_SIZE - 20);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * SPAWN_RADIUS, 20, WORLD_SIZE - 20);

    const minutes = this.elapsed / 60000;
    const enemy = this.enemies.create(x, y, 'enemy');
    enemy.setData('hp', Math.round(20 + minutes * 10));
    enemy.setData('speed', Math.round(80 + minutes * 8));
    enemy.setData('damage', 10);
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

    const hp = enemy.getData('hp') - damage;
    if (hp <= 0) {
      this.spawnXpOrb(enemy.x, enemy.y);
      enemy.destroy();
    } else {
      enemy.setData('hp', hp);
    }
  }

  spawnXpOrb(x, y) {
    this.xpOrbs.create(x, y, 'xp');
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
    const now = this.time.now;
    if (now - this.lastHitAt < HIT_INVULN_MS) return;
    this.lastHitAt = now;

    this.stats.hp -= enemy.getData('damage');
    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.onGameOver();
    }
  }

  onGameOver() {
    this.isGameOver = true;
    this.spawnTimer.paused = true;
    this.attackTimer.paused = true;
    this.difficultyTimer.paused = true;
    this.add.text(400, 300, 'GAME OVER', { fontFamily: 'monospace', fontSize: '40px', color: '#ff5566' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200);
  }

  buildLevelUpUI() {
    this.levelUpTitle = this.add.text(400, 190, 'SUBISTE DE NIVEL', {
      fontFamily: 'monospace', fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    this.levelUpTexts = [0, 1, 2].map((i) => {
      const t = this.add.text(400, 250 + i * 50, '', {
        fontFamily: 'monospace', fontSize: '20px', color: '#66ffcc',
        backgroundColor: '#222244', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.chooseUpgrade(i));
      return t;
    });

    this.input.keyboard.on('keydown-ONE', () => this.chooseUpgrade(0));
    this.input.keyboard.on('keydown-TWO', () => this.chooseUpgrade(1));
    this.input.keyboard.on('keydown-THREE', () => this.chooseUpgrade(2));
  }

  startLevelUp() {
    this.isLevelingUp = true;
    this.player.setVelocity(0, 0);

    this.levelUpChoices = Phaser.Utils.Array.Shuffle([...UPGRADE_POOL]).slice(0, 3);
    this.levelUpChoices.forEach((choice, i) => {
      this.levelUpTexts[i].setText(`${i + 1}. ${choice.label}`).setVisible(true);
    });
    this.levelUpTitle.setVisible(true);
  }

  chooseUpgrade(i) {
    if (!this.isLevelingUp) return;
    const choice = this.levelUpChoices[i];
    if (!choice) return;

    choice.apply(this.stats);
    this.attackTimer.delay = this.stats.fireRate;

    this.levelUpTitle.setVisible(false);
    this.levelUpTexts.forEach((t) => t.setVisible(false));
    this.isLevelingUp = false;
  }
}

const { cameraSpeed, isCaughtByCamera, torqueForInput, choosePartToShed } = LastreModel;

const COLORS = {
  sky: 0x0b1320,
  horizon: 0x172534,
  ground: 0x18232b,
  stone: 0x34424a,
  stoneEdge: 0x65727a,
  core: 0xf7fbff,
  glow: 0x6fe7ff,
  soft: 0x7be4c4,
  danger: 0xff5263
};

class LastreScene extends Phaser.Scene {
  constructor() {
    super('LastreScene');
  }

  create() {
    this.W = 800;
    this.H = 450;
    this.startedAt = this.time.now;
    this.dead = false;
    this.shedCooldown = 0;
    this.collected = new Set();

    this.makeBackdrop();
    this.dangerLine = this.add.rectangle(20, this.H / 2, 4, this.H, COLORS.danger, 0.72)
      .setScrollFactor(0).setDepth(90);
    this.makeTrack();
    this.makeBlob();
    this.makeSoftMatter();
    this.makeStoneGates();

    this.keys = this.input.keyboard.addKeys({
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT
    });
    this.input.keyboard.on('keydown-R', () => this.scene.restart());

    this.matter.world.on('collisionstart', event => this.onCollision(event));

    this.blobPaint = this.add.graphics().setDepth(20);
    this.hud = this.add.text(18, 16, '', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#dbe8ed'
    }).setScrollFactor(0).setDepth(100);
    this.warning = this.add.text(18, 39, '', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#ff5263'
    }).setScrollFactor(0).setDepth(100);

    const qs = new URLSearchParams(location.search);
    this.debugMode = qs.has('debug');
    const forcedGrowth = Math.min(12, Math.max(0, Number(qs.get('grow')) || 0));
    for (let i = 0; i < forcedGrowth; i++) {
      const angle = -1.15 + i * 0.63;
      const distance = 20 + (i % 3) * 5;
      this.addBlobPart(
        this.blob.position.x + Math.cos(angle) * distance,
        this.blob.position.y + Math.sin(angle) * distance,
        7 + i % 3
      );
    }
    if (qs.has('shed')) {
      const side = qs.get('shed') === 'left' ? -1 : 1;
      this.shedAt(this.blob.position.x + side * 100);
    }
  }

  makeBackdrop() {
    this.add.rectangle(400, 225, 800, 450, COLORS.sky).setScrollFactor(0);
    this.add.rectangle(400, 330, 800, 240, COLORS.horizon).setScrollFactor(0).setAlpha(0.72);
    const skyline = this.add.graphics().setScrollFactor(0);
    skyline.fillStyle(0x22323d, 0.8);
    for (let x = -40; x < 900; x += 70) {
      const h = 35 + ((x * 17) % 55 + 55) % 55;
      skyline.fillTriangle(x, 350, x + 42, 350 - h, x + 88, 350);
    }
    const stars = this.add.graphics().setScrollFactor(0);
    stars.fillStyle(0xa6c5d2, 0.35);
    for (let i = 0; i < 36; i++) stars.fillCircle((i * 83) % 790, 20 + (i * 47) % 230, i % 7 === 0 ? 1.5 : 1);
  }

  makeTrack() {
    this.trackLength = 14000;
    this.add.rectangle(this.trackLength / 2, 420, this.trackLength, 80, COLORS.ground).setDepth(2);
    const groundBody = this.matter.bodies.rectangle(this.trackLength / 2, 420, this.trackLength, 80, {
      isStatic: true, label: 'ground', friction: 0.95
    });
    groundBody.plugin.isGround = true;
    this.matter.world.add(groundBody);

    const edge = this.add.graphics().setDepth(3);
    edge.lineStyle(2, 0x52636c, 0.9);
    edge.lineBetween(0, 380, this.trackLength, 380);
  }

  makeBlob() {
    const core = this.matter.bodies.rectangle(190, 330, 22, 22, {
      label: 'blobPart', density: 0.0028, friction: 0.92, restitution: 0.05
    });
    core.plugin.isBlobPart = true;
    core.plugin.isCore = true;
    core.plugin.radius = 15;
    core.plugin.shape = 'pixel';

    this.blob = this.matter.body.create({
      label: 'blob',
      parts: [core],
      friction: 0.92,
      frictionAir: 0.018,
      restitution: 0.04
    });
    this.matter.world.add(this.blob);
    this.matter.body.setVelocity(this.blob, { x: 2.05, y: 0 });
  }

  makeSoftMatter() {
    this.soft = [];
    let id = 0;
    for (let x = 480; x < this.trackLength - 500; x += 145) {
      if (x % 870 < 120) continue;
      const y = 352 - ((id * 29) % 48);
      const radius = 6 + (id % 3) * 2;
      const body = this.matter.bodies.circle(x, y, radius, {
        isStatic: true, isSensor: true, label: 'soft'
      });
      body.plugin.softId = id;
      body.plugin.radius = radius;
      this.matter.world.add(body);
      const view = this.add.circle(x, y, radius, COLORS.soft, 0.82).setDepth(8);
      view.setStrokeStyle(2, 0xbaffee, 0.75);
      this.soft.push({ id, body, view, radius });
      id++;
    }
  }

  makeStoneGates() {
    this.stones = [];
    const gates = [1250, 2250, 3350, 4550, 5900, 7400, 9050, 10800, 12700];
    gates.forEach((x, i) => {
      const gap = Math.max(52, 105 - i * 5);
      const height = 380 - gap;
      this.add.rectangle(x, height / 2, 70, height, COLORS.stone).setDepth(7)
        .setStrokeStyle(3, COLORS.stoneEdge, 0.9);
      const body = this.matter.bodies.rectangle(x, height / 2, 70, height, {
        isStatic: true, label: 'stone', friction: 0.85
      });
      body.plugin.isStone = true;
      this.matter.world.add(body);
      this.stones.push(body);

      if (i % 2 === 1) {
        this.add.rectangle(x + 260, 358, 130, 44, COLORS.stone).setDepth(7)
          .setStrokeStyle(3, COLORS.stoneEdge, 0.9);
        const low = this.matter.bodies.rectangle(x + 260, 358, 130, 44, {
          isStatic: true, label: 'stone', friction: 0.9
        });
        low.plugin.isStone = true;
        this.matter.world.add(low);
        this.stones.push(low);
      }
    });
  }

  onCollision(event) {
    for (const pair of event.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      const aRoot = a.parent || a;
      const bRoot = b.parent || b;
      const aIsBlob = aRoot === this.blob;
      const bIsBlob = bRoot === this.blob;
      if (!aIsBlob && !bIsBlob) continue;
      const other = aIsBlob ? bRoot : aRoot;

      if (other.plugin && other.plugin.softId !== undefined) this.collectSoft(other.plugin.softId);
      if (other.plugin && other.plugin.isStone && this.shedCooldown <= 0) {
        const impactX = pair.collision && pair.collision.supports && pair.collision.supports[0]
          ? pair.collision.supports[0].x
          : other.position.x;
        this.shedAt(impactX);
      }
    }
  }

  collectSoft(id) {
    if (this.collected.has(id)) return;
    const item = this.soft.find(entry => entry.id === id);
    if (!item) return;
    this.collected.add(id);
    const point = { x: item.body.position.x, y: item.body.position.y };
    this.matter.world.remove(item.body);
    item.view.destroy();
    this.addBlobPart(point.x, point.y, item.radius);
  }

  rebuildBlob(parts) {
    const velocity = { x: this.blob.velocity.x, y: this.blob.velocity.y };
    const angularVelocity = this.blob.angularVelocity;
    this.matter.body.setParts(this.blob, parts, false);
    this.matter.body.setVelocity(this.blob, velocity);
    this.matter.body.setAngularVelocity(this.blob, angularVelocity);
  }

  addBlobPart(x, y, radius) {
    const part = this.matter.bodies.circle(x, y, radius, {
      label: 'blobPart', density: 0.0028, friction: 0.92, restitution: 0.03
    });
    part.plugin.isBlobPart = true;
    part.plugin.radius = radius;
    this.rebuildBlob([...this.blob.parts.slice(1), part]);
  }

  shedAt(impactX) {
    const children = this.blob.parts.slice(1);
    const candidates = children.map(part => ({
      id: part.id,
      x: part.position.x,
      isCore: Boolean(part.plugin && part.plugin.isCore)
    }));
    const shedId = choosePartToShed(candidates, this.blob.position.x, impactX);
    if (shedId === null) return;
    const shed = children.find(part => part.id === shedId);
    this.rebuildBlob(children.filter(part => part.id !== shedId));
    this.shedCooldown = 320;
    this.matter.body.setVelocity(this.blob, {
      x: Math.max(0.35, this.blob.velocity.x * 0.68),
      y: this.blob.velocity.y
    });
    const fragment = this.add.circle(shed.position.x, shed.position.y, shed.plugin.radius, COLORS.soft, 0.9).setDepth(24);
    this.tweens.add({ targets: fragment, y: fragment.y - 24, alpha: 0, scale: 0.45, duration: 650, onComplete: () => fragment.destroy() });
  }

  drawBlob(time) {
    this.blobPaint.clear();
    const pulse = 0.82 + Math.sin(time / 90) * 0.12;
    for (const part of this.blob.parts.slice(1)) {
      const radius = part.plugin.radius;
      this.blobPaint.fillStyle(part.plugin.isCore ? COLORS.core : COLORS.glow, part.plugin.isCore ? 1 : 0.88);
      this.blobPaint.lineStyle(2, 0xc8f7ff, pulse);
      if (part.plugin.shape === 'pixel') {
        this.blobPaint.fillRect(part.position.x - 11, part.position.y - 11, 22, 22);
        this.blobPaint.strokeRect(part.position.x - 12, part.position.y - 12, 24, 24);
      } else {
        this.blobPaint.fillCircle(part.position.x, part.position.y, radius);
        this.blobPaint.strokeCircle(part.position.x, part.position.y, radius + 1);
      }
    }
  }

  lose() {
    if (this.dead) return;
    this.dead = true;
    this.matter.body.setStatic(this.blob, true);
    this.add.rectangle(400, 225, 800, 450, 0x05070b, 0.72).setScrollFactor(0).setDepth(200);
    this.add.text(400, 200, 'TE ALCANZÓ EL BORDE', {
      fontFamily: 'Courier New', fontSize: '28px', color: '#ff5263'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.add.text(400, 242, `${Math.floor(this.cameras.main.scrollX / 10)} m · ${this.blob.parts.length - 1} piezas · R para volver`, {
      fontFamily: 'Courier New', fontSize: '14px', color: '#dbe8ed'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
  }

  update(time, delta) {
    if (this.dead) return;
    this.shedCooldown = Math.max(0, this.shedCooldown - delta);

    const left = this.keys.leftA.isDown || this.keys.leftArrow.isDown;
    const right = this.keys.rightD.isDown || this.keys.rightArrow.isDown;
    this.blob.torque += torqueForInput(left, right, 0.018) * this.blob.mass;

    this.blob.force.x += 0.00042;
    if (this.blob.velocity.x > 4.2) this.matter.body.setVelocity(this.blob, { x: 4.2, y: this.blob.velocity.y });

    const elapsed = (time - this.startedAt) / 1000;
    this.cameras.main.scrollX += cameraSpeed(elapsed) * delta / 1000;
    this.dangerLine.setAlpha(0.45 + Math.abs(Math.sin(time / 180)) * 0.45);
    this.drawBlob(time);

    const rightEdge = this.blob.bounds.max.x;
    const relative = rightEdge - this.cameras.main.scrollX;
    if (isCaughtByCamera(rightEdge, this.cameras.main.scrollX, 24)) this.lose();

    const pieces = this.blob.parts.length - 1;
    const distance = Math.floor(this.cameras.main.scrollX / 10);
    this.hud.setText(`LASTRE  ·  ${distance} m  ·  masa ${pieces}  ·  velocidad ${Math.max(0, this.blob.velocity.x).toFixed(1)}`);
    this.warning.setText(relative < 130 ? '◀ EL BORDE TE ESTÁ ALCANZANDO' : '');
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 450,
  backgroundColor: '#070b12',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1.05 },
      enableSleeping: false,
      debug: false
    }
  },
  scene: [LastreScene]
});

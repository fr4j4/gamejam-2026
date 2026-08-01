const {
  cameraSpeed,
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
} = LastreModel;

const COLORS = {
  sky: 0x111820,
  horizon: 0x253039,
  ground: 0x252b2d,
  asphalt: 0x31383a,
  stone: 0x535a59,
  stoneEdge: 0x8c9691,
  core: 0xf7fbff,
  glow: 0x6fe7ff,
  copper: 0xb86f43,
  steel: 0x87918f,
  rust: 0x8f4e32,
  danger: 0xff5263,
  sign: 0xf1c75b
};

class LastreScene extends Phaser.Scene {
  constructor() {
    super('LastreScene');
  }

  create() {
    this.W = 800;
    this.H = 450;
    this.startedAt = null;
    this.started = false;
    this.ignoreJumpUntilRelease = false;
    this.dead = false;
    this.shedCooldown = 0;
    this.jumpCooldown = 0;
    this.collected = new Set();
    this.finished = false;
    this.trackLength = 14000;

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
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE
    });
    this.input.keyboard.on('keydown-R', () => this.scene.restart());

    this.matter.world.on('collisionstart', event => this.onCollision(event, true));
    this.matter.world.on('collisionactive', event => this.onCollision(event, false));

    this.blobPaint = this.add.graphics().setDepth(20);
    this.hud = this.add.text(18, 16, '', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#dbe8ed'
    }).setScrollFactor(0).setDepth(100);
    this.warning = this.add.text(18, 39, '', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#ff5263'
    }).setScrollFactor(0).setDepth(100);
    this.routeHud = this.add.text(782, 18, '', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#f1c75b', align: 'right'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.showIntro();
    this.matter.world.pause();
    this.input.keyboard.on('keydown-ENTER', () => this.startGame(false));
    this.input.keyboard.on('keydown-SPACE', () => this.startGame(true));
    this.input.on('pointerdown', () => this.startGame(false));

    const qs = new URLSearchParams(location.search);
    this.debugMode = qs.has('debug');
    const forcedGrowth = Math.min(12, Math.max(0, Number(qs.get('grow')) || 0));
    for (let i = 0; i < forcedGrowth; i++) {
      const angle = -1.15 + i * 0.63;
      const distance = 20 + (i % 3) * 5;
      this.addBlobPart(
        this.blob.position.x + Math.cos(angle) * distance,
        this.blob.position.y + Math.sin(angle) * distance,
        scrapSpecForIndex(i)
      );
    }
    if (qs.has('shed')) {
      const side = qs.get('shed') === 'left' ? -1 : 1;
      this.shedAt(this.blob.position.x + side * 100);
    }
    if (qs.has('autostart')) this.startGame(false);
  }

  showIntro() {
    const panel = this.add.rectangle(400, 225, 800, 450, 0x05090d, 0.9)
      .setScrollFactor(0).setDepth(200);
    const title = this.add.text(400, 88, 'MR. LASTRE', {
      fontFamily: 'Courier New', fontSize: '34px', color: '#f7fbff', fontStyle: 'bold',
      stroke: '#17323b', strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    const story = this.add.text(400, 147,
      'SOS UN IMÁN PERDIDO EN LA CIUDAD\nLLEVA LA CHATARRA AL BASURERO', {
        fontFamily: 'Courier New', fontSize: '17px', color: '#f1c75b', align: 'center',
        lineSpacing: 7
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    const rules = this.add.text(400, 250,
      'A / D   INCLINARTE\nESPACIO   PULSO\n\nEL METAL SE PEGA  ·  LA PIEDRA TE ALIGERA\nNO DEJES QUE EL BORDE ROJO TE ALCANCE', {
        fontFamily: 'Courier New', fontSize: '14px', color: '#dbe8ed', align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    const start = this.add.text(400, 377, 'ESPACIO / ENTER / CLICK PARA EMPEZAR', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#6fe7ff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.tweens.add({ targets: start, alpha: 0.35, yoyo: true, repeat: -1, duration: 620 });
    this.introLayer = [panel, title, story, rules, start];
  }

  startGame(startedWithSpace) {
    if (this.started) return;
    this.started = true;
    this.startedAt = this.time.now;
    this.ignoreJumpUntilRelease = startedWithSpace;
    this.matter.world.resume();
    for (const item of this.introLayer) item.destroy();
    this.introLayer = [];
  }

  makeBackdrop() {
    this.add.rectangle(400, 225, 800, 450, COLORS.sky).setScrollFactor(0);
    this.add.circle(650, 92, 54, 0xe8c787, 0.16).setScrollFactor(0);

    const far = this.add.graphics().setScrollFactor(0.12).setDepth(0);
    far.fillStyle(0x1a252d, 1);
    for (let x = -400; x < this.trackLength + 800; x += 180) {
      const h = 80 + ((x / 180) % 4) * 20;
      far.fillRect(x, 315 - h, 145, h);
      far.fillRect(x + 28, 195 - h, 12, 36);
      far.fillStyle(0x8ba29e, 0.16);
      for (let wy = 252 - h; wy < 300; wy += 22) far.fillRect(x + 16, wy, 12, 7);
      far.fillStyle(0x1a252d, 1);
    }

    const near = this.add.graphics().setScrollFactor(0.38).setDepth(1);
    near.fillStyle(0x202b30, 1);
    for (let x = -250; x < this.trackLength + 900; x += 430) {
      near.fillRect(x, 270, 260, 110);
      near.fillRect(x + 35, 235, 26, 35);
      near.fillStyle(0xc18249, 0.22);
      near.fillRect(x + 28, 292, 45, 28);
      near.fillRect(x + 96, 292, 45, 28);
      near.fillStyle(0x202b30, 1);
    }
  }

  makeTrack() {
    this.destinationX = this.trackLength - 650;
    this.add.rectangle(this.trackLength / 2, 420, this.trackLength, 80, COLORS.ground).setDepth(2);
    this.add.rectangle(this.trackLength / 2, 395, this.trackLength, 30, COLORS.asphalt).setDepth(2);
    const groundBody = this.matter.bodies.rectangle(this.trackLength / 2, 420, this.trackLength, 80, {
      isStatic: true, label: 'ground', friction: 0.95
    });
    groundBody.plugin.isGround = true;
    this.matter.world.add(groundBody);

    const edge = this.add.graphics().setDepth(3);
    edge.lineStyle(2, 0x52636c, 0.9);
    edge.lineBetween(0, 380, this.trackLength, 380);
    edge.lineStyle(3, 0xd9b957, 0.28);
    for (let x = 80; x < this.trackLength; x += 140) edge.lineBetween(x, 402, x + 62, 402);

    for (let x = 700; x < this.destinationX; x += 1180) this.makeStreetSign(x);
    this.makeLandfill(this.destinationX);
  }

  makeStreetSign(x) {
    const sign = this.add.graphics().setDepth(5);
    sign.fillStyle(0x55605e, 1);
    sign.fillRect(x, 284, 7, 96);
    sign.fillStyle(COLORS.sign, 1);
    sign.fillRoundedRect(x - 42, 278, 92, 38, 4);
    sign.lineStyle(3, 0x3e3c32, 1);
    sign.strokeRoundedRect(x - 42, 278, 92, 38, 4);
    sign.fillStyle(0x3e3c32, 1);
    sign.fillTriangle(x + 34, 287, x + 44, 297, x + 34, 307);
    this.add.text(x - 31, 288, 'BASURA', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#34352f', fontStyle: 'bold'
    }).setDepth(6);
  }

  makeLandfill(x) {
    const plant = this.add.graphics().setDepth(4);
    plant.fillStyle(0x35413e, 1);
    plant.fillRect(x - 120, 220, 430, 160);
    plant.fillStyle(0x232c2b, 1);
    plant.fillTriangle(x - 150, 220, x + 95, 132, x + 340, 220);
    plant.fillStyle(0x111817, 1);
    plant.fillRect(x + 25, 286, 140, 94);
    plant.lineStyle(8, COLORS.sign, 0.9);
    for (let sx = x + 35; sx < x + 165; sx += 34) plant.lineBetween(sx, 291, sx + 55, 365);
    this.add.text(x + 95, 190, 'BASURERO\nMUNICIPAL', {
      fontFamily: 'Courier New', fontSize: '20px', color: '#f1c75b', align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    this.add.circle(x - 55, 345, 30, COLORS.rust).setDepth(6);
    this.add.circle(x - 18, 353, 23, COLORS.steel).setDepth(6);
    this.add.circle(x - 92, 357, 19, 0x6c4938).setDepth(6);
  }

  makeBlob() {
    const core = this.matter.bodies.rectangle(190, 330, 22, 22, {
      label: 'blobPart', density: 0.0028, friction: 0.92, restitution: 0.05
    });
    core.plugin.isBlobPart = true;
    core.plugin.isCore = true;
    core.plugin.radius = 15;
    core.plugin.shape = 'magnet';

    this.blob = this.matter.body.create({
      label: 'blob',
      parts: [core],
      friction: 0.92,
      frictionAir: 0.018,
      restitution: 0.04
    });
    this.matter.world.add(this.blob);
    this.coreMass = this.blob.mass;
    this.matter.body.setVelocity(this.blob, { x: 2.05, y: 0 });
  }

  makeSoftMatter() {
    this.soft = [];
    let id = 0;
    for (let x = 480; x < this.trackLength - 500; x += 145) {
      if (x % 870 < 120) continue;
      const y = 352 - ((id * 29) % 48);
      const spec = scrapSpecForIndex(id);
      const body = this.createScrapBody(x, y, spec, true);
      body.plugin.softId = id;
      this.matter.world.add(body);
      const view = this.add.graphics().setDepth(8);
      this.paintScrap(view, body, 0.92);
      const value = scrapValue(spec);
      const valueView = this.add.text(x, y - (body.plugin.radius + 10), `$${value}`, {
        fontFamily: 'Courier New', fontSize: '10px', color: '#f1c75b', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(9);
      this.soft.push({ id, body, view, valueView, spec, value });
      id++;
    }
  }

  createScrapBody(x, y, spec, sensor = false) {
    const options = {
      isStatic: sensor,
      isSensor: sensor,
      label: sensor ? 'soft' : 'blobPart',
      density: 0.0028,
      friction: 0.92,
      restitution: 0.03,
      angle: spec.kind === 'plate' ? (x % 11) * 0.11 : 0
    };
    let body;
    if (spec.kind === 'plate') body = this.matter.bodies.rectangle(x, y, spec.width, spec.height, options);
    else if (spec.kind === 'nut') body = this.matter.bodies.polygon(x, y, spec.sides, spec.radius, options);
    else body = this.matter.bodies.circle(x, y, spec.radius, options);
    body.plugin.isBlobPart = !sensor;
    body.plugin.scrap = spec;
    body.plugin.radius = spec.radius || Math.max(spec.width, spec.height) / 2;
    body.plugin.value = scrapValue(spec);
    return body;
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

  onCollision(event, allowStone) {
    for (const pair of event.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      const aIsBlob = belongsToCompound(a, this.blob);
      const bIsBlob = belongsToCompound(b, this.blob);
      if (!aIsBlob && !bIsBlob) continue;
      const otherBody = aIsBlob ? b : a;
      const other = otherBody.parent || otherBody;
      const contact = pair.collision && pair.collision.supports && pair.collision.supports[0]
        ? pair.collision.supports[0]
        : other.position;

      if (other.plugin && other.plugin.softId !== undefined) this.collectSoft(other.plugin.softId, contact);
      if (allowStone && other.plugin && other.plugin.isStone && this.shedCooldown <= 0) {
        this.shedAt(contact.x);
      }
    }
  }

  collectSoft(id, contact) {
    if (this.collected.has(id)) return;
    const item = this.soft.find(entry => entry.id === id);
    if (!item) return;
    this.collected.add(id);
    const point = { x: item.body.position.x, y: item.body.position.y };
    this.matter.world.remove(item.body);
    item.view.destroy();
    item.valueView.destroy();
    this.addBlobPart(point.x, point.y, item.spec);
    const spark = this.add.circle(point.x, point.y, 5, COLORS.glow, 0.85).setDepth(25);
    this.tweens.add({ targets: spark, scale: 2.6, alpha: 0, duration: 260, onComplete: () => spark.destroy() });
    const arc = this.add.graphics().setDepth(24);
    arc.lineStyle(3, COLORS.glow, 0.9);
    arc.lineBetween(this.blob.position.x, this.blob.position.y, contact.x, contact.y);
    arc.strokeCircle(contact.x, contact.y, 10);
    this.tweens.add({ targets: arc, alpha: 0, duration: 320, onComplete: () => arc.destroy() });
    const points = this.add.text(point.x, point.y - 24, `+$${item.value}`, {
      fontFamily: 'Courier New', fontSize: '14px', color: '#f1c75b', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(26);
    this.tweens.add({
      targets: points, y: points.y - 22, alpha: 0, duration: 700,
      ease: 'Cubic.easeOut', onComplete: () => points.destroy()
    });
  }

  rebuildBlob(parts) {
    const velocity = { x: this.blob.velocity.x, y: this.blob.velocity.y };
    const angularVelocity = this.blob.angularVelocity;
    this.matter.body.setParts(this.blob, parts, false);
    this.matter.body.setVelocity(this.blob, velocity);
    this.matter.body.setAngularVelocity(this.blob, angularVelocity);
  }

  addBlobPart(x, y, spec) {
    const part = this.createScrapBody(x, y, spec, false);
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
    const fragment = this.add.graphics().setDepth(24);
    this.paintScrap(fragment, shed, 0.95);
    this.tweens.add({ targets: fragment, y: fragment.y - 24, alpha: 0, scale: 0.45, duration: 650, onComplete: () => fragment.destroy() });
  }

  polygonPath(graphics, vertices) {
    graphics.beginPath();
    graphics.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) graphics.lineTo(vertices[i].x, vertices[i].y);
    graphics.closePath();
  }

  localPoint(part, x, y) {
    const cosine = Math.cos(part.angle);
    const sine = Math.sin(part.angle);
    return {
      x: part.position.x + x * cosine - y * sine,
      y: part.position.y + x * sine + y * cosine
    };
  }

  paintScrap(graphics, part, alpha = 1) {
    const spec = part.plugin.scrap;
    const fill = spec.kind === 'gear' ? COLORS.rust : spec.kind === 'plate' ? COLORS.steel : COLORS.copper;
    graphics.fillStyle(fill, alpha);
    graphics.lineStyle(2, 0xd5d9d4, alpha * 0.62);
    if (spec.kind === 'gear') {
      graphics.fillCircle(part.position.x, part.position.y, spec.radius);
      graphics.strokeCircle(part.position.x, part.position.y, spec.radius);
      graphics.lineStyle(2, 0x54352b, alpha);
      graphics.strokeCircle(part.position.x, part.position.y, Math.max(2, spec.radius * 0.32));
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        graphics.lineBetween(
          part.position.x + Math.cos(a) * spec.radius * 0.48,
          part.position.y + Math.sin(a) * spec.radius * 0.48,
          part.position.x + Math.cos(a) * spec.radius * 0.82,
          part.position.y + Math.sin(a) * spec.radius * 0.82
        );
      }
    } else {
      this.polygonPath(graphics, part.vertices);
      graphics.fillPath();
      graphics.strokePath();
      if (spec.kind === 'nut') {
        graphics.fillStyle(0x273034, 0.9);
        graphics.fillCircle(part.position.x, part.position.y, spec.radius * 0.34);
      } else {
        const left = this.localPoint(part, -spec.width * 0.3, 0);
        const right = this.localPoint(part, spec.width * 0.3, 0);
        graphics.fillStyle(0x46504f, 0.9);
        graphics.fillCircle(left.x, left.y, Math.max(1.5, spec.height * 0.16));
        graphics.fillCircle(right.x, right.y, Math.max(1.5, spec.height * 0.16));
      }
    }
  }

  paintCore(graphics, part, pulse) {
    graphics.fillStyle(COLORS.core, 1);
    graphics.lineStyle(3, COLORS.glow, pulse);
    this.polygonPath(graphics, part.vertices);
    graphics.fillPath();
    graphics.strokePath();

    const leftTop = this.localPoint(part, -9, -8);
    const leftBottom = this.localPoint(part, -9, 8);
    const rightTop = this.localPoint(part, 9, -8);
    const rightBottom = this.localPoint(part, 9, 8);
    graphics.lineStyle(4, 0xe45b56, 1);
    graphics.lineBetween(leftTop.x, leftTop.y, leftBottom.x, leftBottom.y);
    graphics.lineStyle(4, 0x4dbbd4, 1);
    graphics.lineBetween(rightTop.x, rightTop.y, rightBottom.x, rightBottom.y);
    const eyeA = this.localPoint(part, -4, -2);
    const eyeB = this.localPoint(part, 4, -2);
    graphics.fillStyle(0x16262d, 1);
    graphics.fillCircle(eyeA.x, eyeA.y, 1.8);
    graphics.fillCircle(eyeB.x, eyeB.y, 1.8);
    const mouthA = this.localPoint(part, -4, 5);
    const mouthB = this.localPoint(part, 4, 5);
    graphics.lineStyle(1.5, 0x52666c, 1);
    graphics.lineBetween(mouthA.x, mouthA.y, mouthB.x, mouthB.y);
  }

  drawBlob(time) {
    this.blobPaint.clear();
    const pulse = 0.82 + Math.sin(time / 90) * 0.12;
    for (const part of this.blob.parts.slice(1)) {
      if (part.plugin.isCore) this.paintCore(this.blobPaint, part, pulse);
      else this.paintScrap(this.blobPaint, part, 0.96);
    }
  }

  deliveredValue() {
    return this.blob.parts.slice(1).reduce((total, part) => {
      if (part.plugin && part.plugin.isCore) return total;
      return total + ((part.plugin && part.plugin.value) || 0);
    }, 0);
  }

  hop() {
    if (!canHop(this.blob.bounds.max.y, 380, this.jumpCooldown)) return;
    const force = jumpForceForMass(this.blob.mass, this.coreMass, 0.038);
    this.matter.body.applyForce(this.blob, this.blob.position, { x: 0, y: -force });
    this.jumpCooldown = 520;
    const pulse = this.add.circle(this.blob.position.x, this.blob.bounds.max.y, 12, 0x000000, 0)
      .setStrokeStyle(3, COLORS.glow, 0.9).setDepth(19);
    this.tweens.add({
      targets: pulse,
      scaleX: 3.2,
      scaleY: 0.65,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => pulse.destroy()
    });
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

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.matter.body.setStatic(this.blob, true);
    this.add.rectangle(400, 225, 800, 450, 0x071012, 0.7).setScrollFactor(0).setDepth(200);
    this.add.text(400, 190, 'LLEGASTE AL BASURERO', {
      fontFamily: 'Courier New', fontSize: '28px', color: '#f1c75b', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    const result = scoreDelivery(this.deliveredValue(), (this.time.now - this.startedAt) / 1000);
    this.add.text(400, 260,
      `TIEMPO              ${result.elapsedSeconds} s\n` +
      `BONUS DE TIEMPO    $${result.timeBonus}\n` +
      `CHATARRA ENTREGADA $${result.deliveredValue}\n` +
      `-------------------------\n` +
      `PUNTUACIÓN TOTAL   $${result.total}\n\n` +
      'R para volver a la ciudad', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#dbe8ed', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
  }

  update(time, delta) {
    if (!this.started) return;
    if (this.dead || this.finished) return;
    this.shedCooldown = Math.max(0, this.shedCooldown - delta);
    this.jumpCooldown = Math.max(0, this.jumpCooldown - delta);

    const left = this.keys.leftA.isDown || this.keys.leftArrow.isDown;
    const right = this.keys.rightD.isDown || this.keys.rightArrow.isDown;
    this.blob.torque += torqueForInput(left, right, 0.018) * this.blob.mass;
    if (this.ignoreJumpUntilRelease) {
      if (!this.keys.jump.isDown) this.ignoreJumpUntilRelease = false;
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) {
      this.hop();
    }

    this.blob.force.x += 0.00042;
    if (this.blob.velocity.x > 4.2) this.matter.body.setVelocity(this.blob, { x: 4.2, y: this.blob.velocity.y });

    const elapsed = (time - this.startedAt) / 1000;
    this.cameras.main.scrollX += cameraSpeed(elapsed) * delta / 1000;
    this.dangerLine.setAlpha(0.45 + Math.abs(Math.sin(time / 180)) * 0.45);
    this.drawBlob(time);

    const rightEdge = this.blob.bounds.max.x;
    const relative = rightEdge - this.cameras.main.scrollX;
    if (isCaughtByCamera(rightEdge, this.cameras.main.scrollX, 24)) this.lose();
    if (rightEdge >= this.destinationX) this.finish();

    const pieces = this.blob.parts.length - 1;
    const value = this.deliveredValue();
    const distance = Math.floor(this.cameras.main.scrollX / 10);
    const hopState = this.jumpCooldown > 0 ? 'RECARGA' : 'LISTO';
    this.hud.setText(`LASTRE  ·  ${distance} m  ·  piezas ${pieces}  ·  chatarra $${value}  ·  pulso ${hopState}`);
    this.routeHud.setText(routeMessage(Math.floor(this.blob.position.x), this.destinationX));
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

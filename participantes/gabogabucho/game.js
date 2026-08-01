// ============================================================
// APÓCRIFO — GameJam 2026, participante: gabogabucho
// Phaser 4.2.1
// Corte 4 (§5-6 del concepto): PODERES + PÉNDULO.
// Observar -> esperar -> intervenir -> ver cómo lo leen -> vivir con eso.
// - Atención: recurso que regenera con los fieles. El milagro la gasta.
// - Cuatro intervenciones emocionales: asombro, miedo, humillación, consuelo.
// - Crisis produce fervor/Atención; confort produce prosperidad/ciencia.
// - La Catedral es un hito, no una victoria: los dioses no ganan, duran.
// - Pierdes: todos caen en ciencia y te olvidan.
// Arte real del usuario en assets/ (127 piezas individualizadas).
// ============================================================

// ---- Paleta (del documento de concepto) ----
const PAL = {
  skyHighN: 0x16222e, // noche
  skyMidN:  0x23364a,
  horizonN: 0x5e5346,
  mtnN:     0x35434f,
  groveN:   0x232e37,
  groundN:  0x141c22,
  frontN:   0x0a0f13,
  skyHighD: 0x54708a, // día (desaturado, mismo tono azul-gris)
  skyMidD:  0x7a8e9f,
  horizonD: 0x6e5a48,
  mtnD:     0x4e5a66,
  groveD:   0x35402f,
  groundD:  0x1e262c,
  frontD:   0x141a1e,
  silhouette: 0x080c0f,
  divine:   0xf5b85c,
  core:     0xffe9b0,
  sun:      0xe8a94a
};

// ---- estados emocionales: colores del tablero ----
// Ámbar/dorado = lo divino (lo que hace el jugador).
// Azul frío = la ciencia (otro idioma entrando en escena).
// Marrón/gris = hambre, miedo, duda (el mundo feo).
const STATES = {
  miedo:   { label: 'M', color: 0x9a8fa6, tone: 'El miedo reza o huye.' },
  fe:      { label: 'F', color: PAL.divine, tone: 'Te cree. Aún.' },
  hambre:  { label: 'H', color: 0x9a7a4a, tone: 'Necesita pan, no milagros.' },
  duda:    { label: 'D', color: 0x7d8478, tone: 'Cree a medias. El peor lugar.' },
  ciencia: { label: 'C', color: 0x7fb8d8, tone: 'Ya no te necesita. O nunca.' }
};
// burbujas reales del usuario (assets/estado_XX). CONFIRMADO por el usuario:
// estado_02 = miedo, estado_00 = fe, estado_03 = hambre, estado_04 = duda, estado_01 = ciencia
const BUBBLE_IMG = {
  miedo:   'estado_02_18x22',
  fe:      'estado_00_17x23',
  hambre:  'estado_03_15x21',
  duda:    'estado_04_16x21',
  ciencia: 'estado_01_16x23'
};

const { advanceWalker, villagerAppearance } = ApocryphaMovement;
const {
  POWERS, beamGeometry, interpretPower, shiftPendulum, relaxPendulum,
  attentionRegen, prosperityRate, ambientTransition
} = ApocryphaGameplay;

// ---- utilidades ----
function lerp(a, b, t) { return a + (b - a) * t; }

// interpola un color hex entero entre dos
function mixColor(c1, c2, t) {
  const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t));
  const g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t));
  const b = Math.round(lerp(c1 & 255, c2 & 255, t));
  return (r << 16) | (g << 8) | b;
}

class ApocryphaScene extends Phaser.Scene {
  constructor() {
    super('ApocryphaScene');
  }

  preload() {
    // arte real del usuario (assets/)
    const img = (key, file) => this.load.image(key, 'assets/' + file);
    // pueblo variado: aldeanos, trabajadores, soldados, sacerdotes y un erudito
    for (let i = 0; i < 9; i++) {
      const appearance = villagerAppearance(i);
      img(appearance.key, appearance.file);
    }
    // Estructuras 1 (CONFIRMADO por el usuario):
    // estructura_03 = choza, estructura_02 = casa, estructura_01 = templo, estructura_00 = catedral
    img('choza', 'estructura_03_101x91.png');
    img('casa', 'estructura_02_130x111.png');
    img('templo', 'estructura_01_120x116.png');
    img('catedral', 'estructura_00_96x146.png');
    // fondo: montañas, arboleda, árboles, terreno
    img('montanas', 'montanas_00_369x63.png');
    img('arbolada', 'arbolada_00_395x98.png');
    img('arbol0', 'arbol_00_65x68.png');
    img('arbol1', 'arbol_01_55x93.png');
    img('terreno', 'terreno_02_208x24.png');
    img('powerFear', 'poder_efecto_01_59x49.png');
    img('powerFall', 'poder_humilla_02_53x30.png');
    img('powerWarmth', 'poder_consuelo_00_46x46.png');
    // burbujas de estado
    for (const k of ['miedo', 'fe', 'hambre', 'duda', 'ciencia']) {
      img(BUBBLE_IMG[k], BUBBLE_IMG[k] + '.png');
    }
  }

  create() {
    const W = 800, H = 600;
    this.W = W; this.H = H;

    // línea del suelo donde apoyan las siluetas
    this.groundY = 480;
    this.dayFactor = 0.35; // arranca de noche; oscila 0..1 (1 = mediodía)

    // ---- cielo atmosférico: gradiente continuo + estrellas + nubes ----
    this.sky = this.add.graphics();
    this.paintSky();
    this.stars = Array.from({ length: 42 }, (_, i) =>
      this.add.circle(8 + (i * 73) % 784, 22 + (i * 47) % 280, i % 5 === 0 ? 1.5 : 1, 0xe8edf2, 0.6)
    );
    this.clouds = [
      this.makeCloud(120, 128, 0.85),
      this.makeCloud(410, 210, 1.15),
      this.makeCloud(690, 105, 0.7)
    ];

    // sol/luna: arco a través del cielo
    this.orb = this.add.circle(-40, 0, 14, PAL.sun);

    // capas de fondo escalonadas: lejos -> cerca, con aire entre ellas
    // montañas: lejanas, altas en pantalla, muy tenues (niebla atmosférica)
    this.mountains = this.makeStrip('montanas', 3, 398, 1.0);
    this.mountains.setAlpha(0.6);
    // arboleda: media distancia, más presente
    this.grove = this.makeStrip('arbolada', 2, 438, 0.7);
    this.grove.setAlpha(0.75);

    // suelo: la superficie empieza EXACTAMENTE en groundY, donde apoyan los pies
    this.ground = this.add.rectangle(W / 2, 540, W, 120, PAL.groundN);    // 480-600
    this.terrain = this.makeSurfaceStrip('terreno', 4, this.groundY, 1);
    this.front = this.add.rectangle(W / 2, 592, W, 16, PAL.frontN);       // 584-600

    // árboles flanqueando la aldea (marco natural)
    this.add.image(18, this.groundY, 'arbol1').setOrigin(0.5, 1).setScale(0.9).setAlpha(0.95);
    this.add.image(782, this.groundY, 'arbol0').setOrigin(0.5, 1).setScale(0.9).setAlpha(0.95);

    // ---- aldea: empieza humilde; el confort intercambia etapas fijas ----
    const buildingXs = [100, 240, 400, 560, 700];
    this.huts = buildingXs.map(x =>
      this.add.image(x, this.groundY, 'choza').setOrigin(0.5, 1).setScale(0.75).setAlpha(0.9)
    );
    this.buildingStage = 0;

    // ---- 9 aldeanos (escala 1.25) distribuidos: huecos entre edificios + delante de sus casas ----
    // separación mínima ~75px para que las burbujas no se solapen
    const villagerXs = [60, 165, 240, 320, 400, 480, 560, 635, 745];
    this.villagers = villagerXs.map((x, i) => this.makeVillager(x, i));

    // ---- intervenciones ----
    this.beam = null; this.beamInner = null; this.beamCore = null;
    this.beamHalo = null; this.beamGlow = null;
    this.beamT = 0;
    this.effectCooldown = 0;
    this.selectedPower = 'asombro';
    this.input.on('pointerdown', (pointer) => this.castPower(pointer.worldX));

    // ---- economía del péndulo ----
    this.atencion = 55;
    this.atencionMax = 100;
    this.pendulum = 0;            // -100 crisis, +100 confort
    this.prosperity = 8;          // etapas arquitectónicas 0..100

    // ---- fin de partida ----
    this.over = null;             // solo 'lose': los dioses no ganan, duran
    this.cathedralShown = false;
    this.verdict = '';

    // ---- HUD ----
    this.hudPanel = this.add.rectangle(W / 2, 36, W - 24, 54, 0x0a0f13, 0.62)
      .setStrokeStyle(1, 0x5e5346, 0.75).setDepth(10);
    this.hud = this.add.text(16, 14, '', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#d7c7a5'
    }).setDepth(11);
    // barra de Atención: fondo oscuro + fill ámbar
    this.atBarBg = this.add.rectangle(16, 44, 204, 12, 0x0a0f13, 0.8).setOrigin(0, 0.5).setDepth(11);
    this.atBarBg.setStrokeStyle(1, 0x5e5346, 0.9);
    this.atBar = this.add.rectangle(18, 44, 200, 8, PAL.divine, 0.95).setOrigin(0, 0.5).setDepth(12);
    this.verdictText = this.add.text(W / 2, H - 34, '', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#f5b85c',
      backgroundColor: '#0a0f13dd',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(20);
    this.powerPanel = this.add.rectangle(W / 2, 535, W - 24, 42, 0x0a0f13, 0.78)
      .setStrokeStyle(1, 0x5e5346, 0.75).setDepth(10);
    this.powerHud = this.add.text(W / 2, 526, '', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#d7c7a5'
    }).setOrigin(0.5).setDepth(11);
    this.pendulumHud = this.add.text(W / 2, 544, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#9a8fa6'
    }).setOrigin(0.5).setDepth(11);

    // ---- controles ----
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown', event => {
      const byKey = { '1': 'asombro', '2': 'miedo', '3': 'humillacion', '4': 'consuelo' };
      if (byKey[event.key]) this.selectPower(byKey[event.key]);
    });

    // auto-cast para verificación (solo con ?beam en la URL)
    const qs = new URLSearchParams(location.search);
    if (POWERS[qs.get('power')]) this.selectedPower = qs.get('power');
    if (qs.has('beam')) {
      this.atencion = 100;
      this.castPower(400);
    }
    if (qs.has('cast')) {
      this.atencion = 100;
      this.castPower(400);
    }
    if (qs.has('prosper')) {
      this.prosperity = 78;
      this.updateArchitecture();
    }
    if (qs.has('debug')) {
      const d = document.createElement('div');
      d.id = 'debug';
      d.style.cssText = 'position:fixed;bottom:0;left:0;color:#0f0;font:12px monospace;z-index:99;white-space:pre;background:#000c;';
      document.body.appendChild(d);
      this.debugEl = d;
    }
  }

  // tira repetible: coloca N copias seguidas para cubrir el ancho
  makeStrip(key, n, y, scaleY) {
    const g = this.add.container();
    const w = this.textures.get(key).getSourceImage().width * scaleY;
    for (let i = 0; i < n; i++) {
      const im = this.add.image(i * w + w / 2, y, key).setOrigin(0.5, 1).setScale(scaleY);
      g.add(im);
    }
    return g;
  }

  makeSurfaceStrip(key, n, y, scale) {
    const g = this.add.container();
    const w = this.textures.get(key).getSourceImage().width * scale;
    for (let i = 0; i < n; i++) {
      g.add(this.add.image(i * w + w / 2, y, key).setOrigin(0.5, 0).setScale(scale));
    }
    return g;
  }

  makeCloud(x, y, scale) {
    const cloud = this.add.container(x, y).setScale(scale);
    const color = 0xd9dde0;
    cloud.add([
      this.add.ellipse(-24, 4, 54, 18, color, 1),
      this.add.ellipse(5, 0, 68, 24, color, 1),
      this.add.ellipse(32, 5, 48, 16, color, 1)
    ]);
    cloud.setAlpha(0.08);
    return cloud;
  }

  paintSky() {
    const top = mixColor(PAL.skyHighN, PAL.skyHighD, this.dayFactor);
    const mid = mixColor(PAL.skyMidN, PAL.skyMidD, this.dayFactor);
    const low = mixColor(PAL.horizonN, PAL.horizonD, this.dayFactor);
    this.sky.clear();
    this.sky.fillGradientStyle(top, top, mid, mid, 1);
    this.sky.fillRect(0, 0, this.W, 300);
    this.sky.fillGradientStyle(mid, mid, low, low, 1);
    this.sky.fillRect(0, 300, this.W, 200);
  }

  // aldeano real: silueta + burbuja de estado sobre la cabeza
  makeVillager(x, i) {
    const appearance = villagerAppearance(i);
    const img = this.add.image(x, this.groundY, appearance.key).setOrigin(0.5, 1).setScale(appearance.scale);

    // estado inicial: el pueblo arranca con hambre y miedo
    const start = Math.random() < 0.5 ? 'hambre' : (Math.random() < 0.6 ? 'miedo' : 'duda');
    const villager = {
      x: x,
      homeX: x,
      direction: i % 2 === 0 ? 1 : -1,
      speed: 4 + (i % 3) * 1.5,
      role: appearance.role,
      img: img,
      state: start,
      stateCd: 2000 + Math.random() * 4000,
      reactT: 0
    };

    // burbuja real del usuario: fondo oscuro semitransparente + anillo del color del estado
    const bubble = this.add.container(x, this.groundY - img.displayHeight - 26);
    const icon = this.add.image(0, 0, BUBBLE_IMG[start]).setOrigin(0.5).setScale(1.15);
    const bg = this.add.circle(0, 0, Math.max(icon.displayWidth, icon.displayHeight) * 0.78, 0x0a0f13, 0.78);
    bg.setStrokeStyle(1.4, STATES[start].color, 0.95);
    bubble.add([bg, icon]);

    villager.bubble = bubble;
    villager.ring = bg;
    villager.icon = icon;

    this.setVillagerState(villager, start);
    return villager;
  }

  // cambia el estado de un aldeano y refresca su burbuja
  setVillagerState(v, s) {
    v.state = s;
    const st = STATES[s];
    v.ring.setStrokeStyle(1.4, st.color, 0.95);
    v.icon.setTexture(BUBBLE_IMG[s]);
  }

  selectPower(power) {
    this.selectedPower = power;
    const spec = POWERS[power];
    this.verdictText.setText(`${spec.label}: ${spec.cost} Atención · ahora elige DÓNDE y CUÁNDO`);
  }

  // un aldeano presenció una intervención: su estado decide la lectura
  readIntervention(v, power, feedbackSlot) {
    const outcome = interpretPower(power, v.state);
    this.setVillagerState(v, outcome.next);
    v.reactT = 1;
    this.showConversionFeedback(v, outcome, feedbackSlot);
    return outcome;
  }

  showConversionFeedback(v, outcome, feedbackSlot = 0) {
    const color = outcome.next === 'ciencia' ? '#7fb8d8' : (outcome.next === 'fe' ? '#ffe9b0' : '#c3b8aa');
    const stagger = feedbackSlot % 2 === 0 ? 0 : 18;
    const label = this.add.text(v.x, this.groundY - v.img.displayHeight - 55 - stagger, outcome.feedback, {
      fontFamily: 'Courier New', fontSize: '11px', color,
      backgroundColor: '#0a0f13e6', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(30);
    const ring = this.add.circle(v.x, this.groundY - 25, 16, 0x000000, 0)
      .setStrokeStyle(2, outcome.next === 'ciencia' ? 0x7fb8d8 : (outcome.next === 'fe' ? PAL.divine : STATES[outcome.next].color), 0.95)
      .setDepth(19);
    this.tweens.add({ targets: label, y: label.y - 22, alpha: 0, duration: 1500, onComplete: () => label.destroy() });
    this.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
  }

  castPower(x) {
    if (this.over) return;
    if (this.effectCooldown > 0) return;
    const power = this.selectedPower;
    const spec = POWERS[power];
    if (this.atencion < spec.cost) {
      this.verdictText.setText(`Sin Atención para ${spec.label}. La crisis produce fervor.`);
      return;
    }
    this.atencion -= spec.cost;
    this.pendulum = shiftPendulum(this.pendulum, power);
    this.effectCooldown = spec.effect === 'beam' ? 3900 : 1500;
    this.showPowerEffect(x, power);

    let reached = 0, changed = 0, converted = 0;
    for (const v of this.villagers) {
      if (Math.abs(v.x - x) < spec.radius) {
        reached++;
        const before = v.state;
        const outcome = this.readIntervention(v, power, reached - 1);
        if (outcome.next !== before) changed++;
        if (outcome.converted) converted++;
      }
    }
    const side = this.pendulum < -8 ? 'CRISIS' : (this.pendulum > 8 ? 'CONFORT' : 'CENTRO');
    this.verdictText.setText(`${spec.label}: ${reached} lo vieron · ${changed} cambiaron · ${converted} ganaron fe · ${side}`);
  }

  showPowerEffect(x, power) {
    if (power === 'asombro') {
      this.castLight(x);
      return;
    }
    const config = {
      miedo: { key: 'powerFear', y: this.groundY - 58, scale: 2.15, blend: false },
      humillacion: { key: 'powerFall', y: this.groundY - 100, scale: 1.9, blend: false },
      consuelo: { key: 'powerWarmth', y: this.groundY - 52, scale: 2.1, blend: true }
    }[power];
    const effect = this.add.image(x, config.y, config.key).setScale(config.scale).setDepth(18);
    if (config.blend) effect.setBlendMode(Phaser.BlendModes.ADD);
    if (power === 'humillacion') {
      this.tweens.add({ targets: effect, y: this.groundY - 22, angle: 18, duration: 650, ease: 'Cubic.easeIn' });
      this.tweens.add({ targets: effect, alpha: 0, delay: 700, duration: 600, onComplete: () => effect.destroy() });
    } else {
      this.tweens.add({ targets: effect, scale: config.scale * 1.7, alpha: 0, y: config.y - 18, duration: 1400, ease: 'Cubic.easeOut', onComplete: () => effect.destroy() });
    }
  }

  castLight(x) {
    this.beamT = 1;
    this.beamLife = 0;
    this.beamFading = false;

    const geometry = beamGeometry(x, this.groundY);
    const bm = Phaser.BlendModes.ADD;

    const beam = this.add.polygon(x, 0, geometry.outer.map(([px, py]) => [px - x, py]), PAL.divine, 0.40)
      .setOrigin(0.5, 0);
    beam.setBlendMode(bm);
    this.beam = beam;

    const beamInner = this.add.polygon(x, 0, geometry.inner.map(([px, py]) => [px - x, py]), PAL.core, 0.34)
      .setOrigin(0.5, 0);
    beamInner.setBlendMode(bm);
    this.beamInner = beamInner;

    const core = this.add.circle(x, geometry.impact.y, 14, PAL.core, 1);
    core.setBlendMode(bm);
    this.beamCore = core;

    const halo = this.add.circle(x, geometry.impact.y, 30, PAL.divine, 0.28);
    halo.setStrokeStyle(2, PAL.divine, 0.95);
    halo.setBlendMode(bm);
    this.beamHalo = halo;

    const glow = this.add.ellipse(x, geometry.impact.y, 170, 42, PAL.divine, 0.30);
    glow.setBlendMode(bm);
    this.beamGlow = glow;

  }

  updateArchitecture() {
    const stage = this.prosperity >= 75 ? 3 : (this.prosperity >= 45 ? 2 : (this.prosperity >= 20 ? 1 : 0));
    if (stage === this.buildingStage) return;
    this.buildingStage = stage;
    const layouts = [
      ['choza', 'choza', 'choza', 'choza', 'choza'],
      ['choza', 'casa', 'choza', 'casa', 'choza'],
      ['casa', 'casa', 'templo', 'casa', 'casa'],
      ['casa', 'templo', 'catedral', 'templo', 'casa']
    ];
    this.huts.forEach((building, i) => building.setTexture(layouts[stage][i]).setScale(0.75));

    if (stage === 3 && !this.cathedralShown) {
      this.cathedralShown = true;
      const flash = this.add.circle(400, this.groundY - 65, 10, PAL.core, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(17);
      this.tweens.add({ targets: flash, scale: 22, alpha: 0, duration: 1400, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
      this.verdictText.setText('Construyeron la Catedral. No ganaste: ahora viven demasiado bien sin ti.');
    }
  }

  // cuenta fieles / ciencia y decide el final
  tally() {
    let f = 0, c = 0;
    for (const v of this.villagers) {
      if (v.state === 'fe') f++;
      if (v.state === 'ciencia') c++;
    }
    return { fieles: f, ciencia: c };
  }

  update(time, delta) {
    if (this.over) return;
    this.effectCooldown = Math.max(0, this.effectCooldown - delta);

    // ---- ciclo de día/noche: 0..1..0 (período ~40s) ----
    const period = 40000;
    const phase = (time % period) / period;
    this.dayFactor = Math.max(0, Math.sin(phase * Math.PI * 2));

    this.paintSky();
    this.ground.setFillStyle(mixColor(PAL.groundN, PAL.groundD, this.dayFactor));
    this.front.setFillStyle(mixColor(PAL.frontN, PAL.frontD, this.dayFactor));

    const night = 1 - this.dayFactor;
    this.stars.forEach((star, i) => star.setAlpha(night * (0.35 + 0.4 * Math.abs(Math.sin(time / 900 + i)))));
    this.clouds.forEach((cloud, i) => {
      cloud.setAlpha(0.04 + this.dayFactor * 0.16);
      cloud.x += delta * (0.002 + i * 0.0006);
      if (cloud.x > 850) cloud.x = -50;
    });

    const orbX = lerp(-40, 840, phase);
    const orbY = 400 - Math.sin(phase * Math.PI) * 280;
    this.orb.setPosition(orbX, orbY);
    this.orb.setFillStyle(this.dayFactor > 0.5 ? PAL.sun : 0xcfd8e3);
    this.orb.setAlpha(0.35 + 0.65 * this.dayFactor);

    // ---- péndulo: vuelve lentamente al centro, el peor lugar ----
    const { fieles } = this.tally();
    this.pendulum = relaxPendulum(this.pendulum, delta);
    const regen = attentionRegen(this.pendulum, fieles);
    this.atencion = Math.min(this.atencionMax, this.atencion + regen * delta / 1000);
    this.prosperity = Math.max(0, Math.min(100, this.prosperity + prosperityRate(this.pendulum) * delta / 1000));
    this.updateArchitecture();

    // ---- aldeanos: sus estados migran con el tiempo ----
    for (const v of this.villagers) {
      const moved = advanceWalker(v, delta, v.homeX - 10, v.homeX + 10);
      v.x = moved.x;
      v.direction = moved.direction;
      v.img.setX(v.x).setFlipX(v.direction < 0);
      v.bubble.setX(v.x);

      v.stateCd -= delta;
      if (v.stateCd <= 0) {
        this.setVillagerState(v, ambientTransition(v.state, this.pendulum, Math.random()));
        v.stateCd = 6000 + Math.random() * 7000;
      }
      if (v.reactT > 0) {
        v.reactT -= delta / 900;
        const r = Math.max(0, v.reactT);
        v.bubble.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(time / 40)));
        v.bubble.setScale(1 + r * 0.25);
        if (v.reactT <= 0) { v.bubble.setAlpha(1); v.bubble.setScale(1); }
      }
      v.bubble.setY(this.groundY - v.img.displayHeight - 26 + Math.sin(time / 700 + v.x) * 1.5);
    }

    // ---- parpadeo de la luz activa ----
    if (this.beamT > 0 && this.beam) {
      this.beamLife += delta;
      const life = this.beamLife;
      if (life > 3200 && !this.beamFading) this.beamFading = true;
      let a = 1;
      if (this.beamFading) a = Math.max(0, 1 - (life - 3200) / 700);
      const flicker = 0.85 + 0.15 * Math.sin(time / 55);
      this.beam.setAlpha(a * flicker);
      this.beamInner.setAlpha(a * flicker * 1.1);
      this.beamCore.setAlpha(0.9 * a * flicker);
      this.beamHalo.setAlpha(0.9 * a);
      this.beamGlow.setAlpha(0.55 * a);
      this.beamCore.setScale(1 + 0.06 * Math.sin(time / 80));
      if (life > 3900) {
        this.beam.destroy(); this.beamInner.destroy(); this.beamCore.destroy();
        this.beamHalo.destroy(); this.beamGlow.destroy();
        this.beam = this.beamInner = this.beamCore = this.beamHalo = this.beamGlow = null;
        this.beamT = 0;
      }
    }

    // ---- final: no hay victoria; solo olvido ----
    const t = this.tally();
    if (t.ciencia >= this.villagers.length) {
      this.over = 'lose';
      this.verdictText.setText('Te olvidaron. El pueblo siguió sin ti. (R para reiniciar)');
    }

    // ---- HUD ----
    this.hud.setText(
      'APÓCRIFO  ·  fe ' + t.fieles + '/9  ·  ciencia ' + t.ciencia +
      '  ·  Atención ' + Math.floor(this.atencion) + '  ·  R reinicia'
    );
    const spec = POWERS[this.selectedPower];
    this.powerHud.setText(`[1] ASOMBRO  [2] MIEDO  [3] HUMILLACIÓN  [4] CONSUELO  ·  elegido: ${spec.label} (${spec.cost})`);
    const marker = Math.round((this.pendulum + 100) / 20);
    const track = Array.from({ length: 11 }, (_, i) => i === marker ? '●' : '─').join('');
    this.pendulumHud.setText(`CRISIS ${track} CONFORT  ·  aldea ${Math.round(this.prosperity)}%`);
    // barra de Atención: ancho proporcional; parpadea si no alcanza para un milagro
    const frac = this.atencion / this.atencionMax;
    this.atBar.width = Math.max(1, Math.round(200 * frac));
    if (this.atencion < spec.cost) {
      this.atBar.setFillStyle(0x9a7a4a, 0.5 + 0.3 * Math.abs(Math.sin(time / 300)));
    } else {
      this.atBar.setFillStyle(PAL.divine, 0.95);
    }

    // ---- volcado de estados (solo ?debug) ----
    if (this.debugEl) {
      const line = this.villagers.map(v => `${Math.round(v.x)}:${v.state}`).join('  ');
      this.debugEl.textContent = `at=${this.atencion.toFixed(1)} pend=${this.pendulum.toFixed(1)} prosper=${this.prosperity.toFixed(1)} power=${this.selectedPower} f=${t.fieles} c=${t.ciencia} over=${this.over}  ${line}`;
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#0d0d0d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [ApocryphaScene]
};

new Phaser.Game(config);

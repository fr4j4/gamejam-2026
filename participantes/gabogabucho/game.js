// ============================================================
// APÓCRIFO — GameJam 2026, participante: gabogabucho
// Phaser 4.2.1
// Corte 3 (§4-6 del concepto): JUEGO.
// Observar -> esperar -> intervenir -> ver cómo lo leen -> vivir con eso.
// - Atención: recurso que regenera con los fieles. El milagro la gasta.
// - El rayo convierte a la fe a quien lo presencia (menos a la ciencia).
// - Ganas: suficientes fieles construyen la Catedral.
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

// ---- utilidades ----
function lerp(a, b, t) { return a + (b - a) * t; }

// interpola un color hex entero entre dos
function mixColor(c1, c2, t) {
  const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t));
  const g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t));
  const b = Math.round(lerp(c1 & 255, c2 & 255, t));
  return (r << 16) | (g << 8) | b;
}

// matriz de tránsito: cómo migra el pueblo solo con el tiempo
// (los aldeanos son competentes: razonan con lo que tienen)
function nextState(s) {
  const r = Math.random();
  switch (s) {
    case 'hambre':  return r < 0.45 ? 'miedo' : (r < 0.8 ? 'hambre' : 'duda');
    case 'miedo':   return r < 0.35 ? 'fe' : (r < 0.7 ? 'miedo' : 'hambre');
    case 'fe':      return r < 0.45 ? 'fe' : (r < 0.8 ? 'duda' : 'miedo');
    case 'duda':    return r < 0.35 ? 'ciencia' : (r < 0.65 ? 'duda' : (r < 0.85 ? 'hambre' : 'fe'));
    case 'ciencia': return r < 0.45 ? 'ciencia' : (r < 0.85 ? 'duda' : 'fe');
    default:        return 'hambre';
  }
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

    // ---- cielo en 3 bandas: cubre toda la pantalla sin huecos ----
    this.skyHigh = this.add.rectangle(W / 2, 90, W, 180, PAL.skyHighN);   // 0-180
    this.skyMid  = this.add.rectangle(W / 2, 260, W, 180, PAL.skyMidN);   // 170-350
    this.skyLow  = this.add.rectangle(W / 2, 415, W, 170, PAL.horizonN);  // 330-500

    // sol/luna: arco a través del cielo
    this.orb = this.add.circle(-40, 0, 14, PAL.sun);

    // capas de fondo escalonadas: lejos -> cerca, con aire entre ellas
    // montañas: lejanas, altas en pantalla, muy tenues (niebla atmosférica)
    this.mountains = this.makeStrip('montanas', 3, 398, 1.0);
    this.mountains.setAlpha(0.6);
    // arboleda: media distancia, más presente
    this.grove = this.makeStrip('arbolada', 2, 438, 0.7);
    this.grove.setAlpha(0.75);

    // suelo: banda oscura + tira de terreno real en el borde donde se pisa
    this.ground = this.add.rectangle(W / 2, 545, W, 90, PAL.groundN);     // 500-590
    this.terrain = this.makeStrip('terreno', 4, this.groundY + 4, 1);     // 460-484
    // segunda tira de terreno, tenue y desplazada: textura del primer plano
    this.terrain2 = this.makeStrip('terreno', 4, this.groundY + 34, 1);
    this.terrain2.setAlpha(0.28);
    this.terrain2.setX(-90);
    this.front = this.add.rectangle(W / 2, 592, W, 16, PAL.frontN);       // 584-600

    // árboles flanqueando la aldea (marco natural)
    this.add.image(18, this.groundY, 'arbol1').setOrigin(0.5, 1).setScale(0.9).setAlpha(0.95);
    this.add.image(782, this.groundY, 'arbol0').setOrigin(0.5, 1).setScale(0.9).setAlpha(0.95);

    // ---- aldea: chozas, casa y templo reales (Estructuras 1, escala 0.75) ----
    // [x, key]: chozas en los extremos, casa y templo al centro; con aire entre ellas
    const buildings = [
      [100, 'choza'], [240, 'casa'], [400, 'templo'], [560, 'casa'], [700, 'choza']
    ];
    this.huts = buildings.map(([x, key]) =>
      this.add.image(x, this.groundY, key).setOrigin(0.5, 1).setScale(0.75).setAlpha(0.9)
    );

    // ---- 9 aldeanos (escala 1.25) distribuidos: huecos entre edificios + delante de sus casas ----
    // separación mínima ~75px para que las burbujas no se solapen
    const villagerXs = [60, 165, 240, 320, 400, 480, 560, 635, 745];
    this.villagers = villagerXs.map((x, i) => this.makeVillager(x, i));

    // ---- intervención de luz ----
    this.beam = null; this.beamInner = null; this.beamCore = null;
    this.beamHalo = null; this.beamGlow = null;
    this.beamT = 0;
    this.input.on('pointerdown', (pointer) => this.castLight(pointer.worldX, pointer.worldY));

    // ---- recurso: ATENCIÓN (§5: escala con los fieles) ----
    this.atencion = 40;           // arranca con un milagro casi listo
    this.atencionMax = 100;
    this.costLight = 30;          // lo que cuesta un milagro

    // ---- fin de partida ----
    this.over = null;             // 'win' | 'lose'
    this.cathedralShown = false;
    this.verdict = '';

    // ---- HUD ----
    this.hud = this.add.text(16, 14, '', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#8f897c'
    });
    // barra de Atención: fondo oscuro + fill ámbar
    this.atBarBg = this.add.rectangle(16, 40, 204, 12, 0x0a0f13, 0.8).setOrigin(0, 0.5);
    this.atBarBg.setStrokeStyle(1, 0x5e5346, 0.9);
    this.atBar = this.add.rectangle(18, 40, 200, 8, PAL.divine, 0.95).setOrigin(0, 0.5);
    this.verdictText = this.add.text(W / 2, H - 34, '', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: PAL.divine
    }).setOrigin(0.5);

    // ---- controles ----
    this.input.keyboard.on('keydown-R', () => this.scene.restart());

    // auto-cast para verificación (solo con ?beam en la URL)
    const qs = new URLSearchParams(location.search);
    if (qs.has('beam')) {
      this.atencion = 100; // para poder castear en verificación
      this.castLight(400, 440);
    }
    // forzar victoria para verificación (solo con ?win)
    if (qs.has('win')) {
      for (let i = 0; i < 6; i++) this.setVillagerState(this.villagers[i], 'fe');
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

  // un aldeano vio el milagro: ¿qué entendió?
  readMiracle(v) {
    const s = v.state;
    let next, verdict;
    if (s === 'ciencia') {
      next = 'ciencia';
      verdict = 'Alguien midió el rayo. Ya no es milagro: es clima.';
    } else if (s === 'fe') {
      next = 'fe';
      verdict = 'La fe se enciende con lo que ya se creía.';
    } else if (s === 'hambre') {
      next = 'fe';
      verdict = 'El hambriento vio el rayo y supo que había pan.';
    } else if (s === 'miedo') {
      next = 'fe';
      verdict = 'El miedo se arrodilló y lo llamó poder.';
    } else { // duda
      next = Math.random() < 0.6 ? 'fe' : 'ciencia';
      verdict = next === 'fe'
        ? 'La duda se rindió: el rayo era demasiado. Que sea un dios.'
        : 'La duda ganó: prefirió medirlo antes que creerlo.';
    }
    this.setVillagerState(v, next);
    v.reactT = 1;
    return verdict;
  }

  castLight(x, y) {
    if (this.over) return;
    if (this.beamT > 0) return;           // ya hay una activa
    if (this.atencion < this.costLight) { // sin atención: el pueblo no te escucha
      this.verdictText.setText('Sin Atención: no hay nadie mirando. Haz que crean primero.');
      return;
    }
    this.atencion -= this.costLight;
    this.beamT = 1;
    this.beamLife = 0;
    this.beamFading = false;

    const yBase = Math.max(y, this.groundY - 60);
    const bm = Phaser.BlendModes.ADD;

    const beam = this.add.polygon(0, 0, [
      [x - 60, 0], [x + 60, 0], [x + 130, yBase + 26], [x - 130, yBase + 26]
    ], PAL.divine, 0.40);
    beam.setBlendMode(bm);
    this.beam = beam;

    const beamInner = this.add.polygon(0, 0, [
      [x - 26, 0], [x + 26, 0], [x + 62, yBase + 6], [x - 62, yBase + 6]
    ], PAL.core, 0.34);
    beamInner.setBlendMode(bm);
    this.beamInner = beamInner;

    const core = this.add.circle(x, yBase + 8, 14, PAL.core, 1);
    core.setBlendMode(bm);
    this.beamCore = core;

    const halo = this.add.circle(x, yBase + 8, 30, PAL.divine, 0.28);
    halo.setStrokeStyle(2, PAL.divine, 0.95);
    halo.setBlendMode(bm);
    this.beamHalo = halo;

    const glow = this.add.ellipse(x, yBase + 14, 170, 42, PAL.divine, 0.30);
    glow.setBlendMode(bm);
    this.beamGlow = glow;

    // los aldeanos leen el milagro (radio ~130: dentro del cono)
    this.verdict = '';
    for (const v of this.villagers) {
      if (Math.abs(v.x - x) < 130) {
        this.verdict = this.readMiracle(v);
      }
    }
    this.verdictText.setText(this.verdict);
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

    // ---- ciclo de día/noche: 0..1..0 (período ~40s) ----
    const period = 40000;
    const phase = (time % period) / period;
    this.dayFactor = Math.max(0, Math.sin(phase * Math.PI * 2));

    this.skyHigh.setFillStyle(mixColor(PAL.skyHighN, PAL.skyHighD, this.dayFactor));
    this.skyMid.setFillStyle(mixColor(PAL.skyMidN, PAL.skyMidD, this.dayFactor));
    this.skyLow.setFillStyle(mixColor(PAL.horizonN, PAL.horizonD, this.dayFactor));
    this.ground.setFillStyle(mixColor(PAL.groundN, PAL.groundD, this.dayFactor));
    this.front.setFillStyle(mixColor(PAL.frontN, PAL.frontD, this.dayFactor));

    const orbX = lerp(-40, 840, phase);
    const orbY = 400 - Math.sin(phase * Math.PI) * 280;
    this.orb.setPosition(orbX, orbY);
    this.orb.setFillStyle(this.dayFactor > 0.5 ? PAL.sun : 0xcfd8e3);
    this.orb.setAlpha(0.35 + 0.65 * this.dayFactor);

    // ---- Atención: regenera con los fieles (§5) ----
    const { fieles } = this.tally();
    const regen = 0.5 + fieles * 0.35; // cuantos más te creen, más podés hacer
    this.atencion = Math.min(this.atencionMax, this.atencion + regen * delta / 1000);

    // ---- aldeanos: sus estados migran con el tiempo ----
    for (const v of this.villagers) {
      const moved = advanceWalker(v, delta, v.homeX - 10, v.homeX + 10);
      v.x = moved.x;
      v.direction = moved.direction;
      v.img.setX(v.x).setFlipX(v.direction < 0);
      v.bubble.setX(v.x);

      v.stateCd -= delta;
      if (v.stateCd <= 0) {
        this.setVillagerState(v, nextState(v.state));
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

    // ---- final de partida ----
    const t = this.tally();
    if (!this.cathedralShown && t.fieles >= 6) {
      this.cathedralShown = true;
      // el templo (huts[2]) se transforma en la Catedral, con un estallido de luz
      const cat = this.add.image(400, this.groundY, 'catedral').setOrigin(0.5, 1).setScale(0.75);
      cat.setAlpha(0);
      this.tweens.add({ targets: cat, alpha: 1, duration: 2200, ease: 'Cubic.easeOut' });
      this.tweens.add({ targets: this.huts[2], alpha: 0, duration: 1800 });
      // estallido ámbar: flash + halo que se expande
      const flash = this.add.circle(400, this.groundY - 60, 10, PAL.core, 0.9);
      flash.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: flash, scale: 22, alpha: 0, duration: 1400, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
      const ring2 = this.add.circle(400, this.groundY - 60, 12, PAL.divine, 0);
      ring2.setStrokeStyle(3, PAL.divine, 0.9);
      ring2.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: ring2, scale: 14, alpha: 0, duration: 1800, ease: 'Cubic.easeOut', onComplete: () => ring2.destroy() });
      this.over = 'win';
      this.verdictText.setText('Los fieles construyeron la Catedral. Tu nombre viaja lejos. (R para reiniciar)');
    } else if (t.ciencia >= this.villagers.length) {
      this.over = 'lose';
      this.verdictText.setText('Te olvidaron. El pueblo siguió sin ti. (R para reiniciar)');
    }

    // ---- HUD ----
    this.hud.setText(
      'APÓCRIFO  ·  fieles ' + t.fieles + '/9  ·  ciencia ' + t.ciencia +
      '  ·  clic = milagro (' + this.costLight + ' at.)  ·  R = reiniciar'
    );
    // barra de Atención: ancho proporcional; parpadea si no alcanza para un milagro
    const frac = this.atencion / this.atencionMax;
    this.atBar.width = Math.max(1, Math.round(200 * frac));
    if (this.atencion < this.costLight) {
      this.atBar.setFillStyle(0x9a7a4a, 0.5 + 0.3 * Math.abs(Math.sin(time / 300)));
    } else {
      this.atBar.setFillStyle(PAL.divine, 0.95);
    }

    // ---- volcado de estados (solo ?debug) ----
    if (this.debugEl) {
      const line = this.villagers.map(v => `${Math.round(v.x)}:${v.state}`).join('  ');
      this.debugEl.textContent = `at=${this.atencion.toFixed(1)} f=${t.fieles} c=${t.ciencia} over=${this.over}  ${line}`;
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

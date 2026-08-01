// ============================================================
// APÓCRIFO — GameJam 2026, participante: gabogabucho
// Phaser 4.2.1
// Corte 2 (§4-5 del concepto): burbujas de estado sobre cada
// aldeano — miedo, fe, hambre, duda, ciencia. Las burbujas son
// el tablero: leerlas y disparar en el instante correcto.
// El rayo cambia cómo te leen: un milagro enciende la fe,
// pero la ciencia se resiste.
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
    case 'fe':      return r < 0.4 ? 'fe' : (r < 0.75 ? 'duda' : 'miedo');
    case 'duda':    return r < 0.35 ? 'ciencia' : (r < 0.65 ? 'duda' : (r < 0.85 ? 'hambre' : 'fe'));
    case 'ciencia': return r < 0.4 ? 'ciencia' : (r < 0.8 ? 'duda' : 'fe');
    default:        return 'hambre';
  }
}

class ApocryphaScene extends Phaser.Scene {
  constructor() {
    super('ApocryphaScene');
  }

  create() {
    const W = 800, H = 600;
    this.W = W; this.H = H;

    // línea del suelo donde apoyan las siluetas
    this.groundY = 480;
    this.dayFactor = 0.35; // arranca de noche; oscila 0..1 (1 = mediodía)

    // ---- cielo y capas de parallax ----
    this.skyHigh = this.add.rectangle(W / 2, 120, W, 240, PAL.skyHighN);
    this.skyMid  = this.add.rectangle(W / 2, 300, W, 220, PAL.skyMidN);

    // sol/luna: arco a través del cielo
    this.orb = this.add.circle(-40, 0, 14, PAL.sun);

    // montañas (capa 4) y arboleda (capa 3): tiras con Graphics
    this.mountains = this.makeMountains();
    this.grove = this.makeGrove();

    // horizonte cálido + suelo (capa 2) + primer plano (capa 1)
    this.horizon = this.add.rectangle(W / 2, this.groundY - 4, W, 8, PAL.horizonN);
    this.ground = this.add.rectangle(W / 2, this.groundY + 40, W, 80, PAL.groundN);
    this.front = this.add.rectangle(W / 2, H - 12, W, 24, PAL.frontN);

    // ---- aldea: 5 siluetas ----
    const hutXs = [130, 240, 400, 560, 670];
    this.huts = hutXs.map(x => this.makeHut(x));

    // 9 aldeanos de 16px, cada uno con su burbuja de estado
    const villagerXs = [95, 175, 300, 340, 455, 520, 625, 700, 740];
    this.villagers = villagerXs.map(x => this.makeVillager(x));

    // ---- intervención de luz ----
    this.beam = null;      // Polygon del cono de luz
    this.beamInner = null; // núcleo del haz (capa interna)
    this.beamCore = null;  // núcleo en el punto de impacto
    this.beamHalo = null;  // halo alrededor
    this.beamGlow = null;  // resplandor del suelo
    this.beamT = 0;        // 1 = activa
    this.input.on('pointerdown', (pointer) => this.castLight(pointer.worldX, pointer.worldY));

    // ---- HUD mínimo: ahora enseña a leer el tablero ----
    this.hud = this.add.text(16, 16, 'APÓCRIFO — lee las burbujas. Clic: la luz cambia cómo te leen.', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color: '#8f897c'
    });

    // etiqueta del último milagro (qué entendieron)
    this.verdict = this.add.text(W / 2, H - 34, '', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: PAL.divine
    }).setOrigin(0.5);

    // auto-cast para verificación (solo con ?beam en la URL)
    const qs = new URLSearchParams(location.search);
    if (qs.has('beam')) {
      this.castLight(400, 440);
    }
    if (qs.has('debug')) {
      // volcado de estados al DOM para verificación headless
      const d = document.createElement('div');
      d.id = 'debug';
      d.style.cssText = 'position:fixed;bottom:0;left:0;color:#0f0;font:12px monospace;z-index:99;white-space:pre;background:#000c;';
      document.body.appendChild(d);
      this.debugEl = d;
    }
  }

  // siluetas de montañas / arboleda
  makeMountains() {
    const g = this.add.graphics();
    g.fillStyle(PAL.mtnN, 1);
    g.fillPoints([
      [0, this.groundY], [0, 400], [90, 360], [180, 398], [260, 340], [350, 396],
      [440, 350], [530, 398], [620, 356], [710, 396], [800, 364], [800, this.groundY]
    ], true);
    return g;
  }

  makeGrove() {
    const g = this.add.graphics();
    g.fillStyle(PAL.groveN, 1);
    // arbolitos: tronco + copa, todos silueta plana
    const trees = [[40, 444], [220, 452], [470, 440], [760, 448]];
    for (const [x, y] of trees) {
      g.fillRect(x - 2, y, 4, 8);
      g.fillCircle(x, y - 8, 10);
    }
    return g;
  }

  // choza 42px (de la hoja de referencia: triángulo sobre pared)
  makeHut(x) {
    const g = this.add.graphics();
    g.fillStyle(PAL.silhouette, 1);
    g.fillRect(x - 21, this.groundY - 24, 42, 24);        // pared
    g.fillPoints([[x - 26, this.groundY - 24], [x, this.groundY - 42], [x + 26, this.groundY - 24]], true); // techo
    g.fillRect(x - 4, this.groundY - 14, 8, 14);          // puerta
    return g;
  }

  // aldeano 16px: cabeza + cuerpo. La burbuja de estado va sobre la cabeza:
  // el dios no ve caras, ve estados (§6 del concepto).
  makeVillager(x) {
    const g = this.add.graphics();
    g.fillStyle(PAL.silhouette, 1);
    g.fillCircle(x, this.groundY - 8, 3.5);
    g.fillRect(x - 3.5, this.groundY - 5, 7, 10);

    // estado inicial: el pueblo arranca con hambre y miedo
    const start = Math.random() < 0.5 ? 'hambre' : (Math.random() < 0.6 ? 'miedo' : 'duda');
    const villager = {
      x: x,
      g: g,
      state: start,
      stateCd: 2000 + Math.random() * 4000, // cuándo vuelve a migrar
      reactT: 0                               // parpadeo cuando un milagro lo toca
    };

    // burbuja: círculo oscuro + anillo del color del estado + letra
    const bubble = this.add.container(x, this.groundY - 22);
    const ring = this.add.circle(0, 0, 9, 0x080c0f, 0.88);
    ring.setStrokeStyle(1.6, STATES[start].color, 0.95);
    const txt = this.add.text(0, 1, STATES[start].label, {
      fontFamily: 'Courier New',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#' + STATES[start].color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    bubble.add([ring, txt]);
    // el anillo referencia a la que apunta el rayo
    bubble.setData({ villager: villager });

    villager.bubble = bubble;
    villager.ring = ring;
    villager.bubbleText = txt;

    // letra inicial por si la creación difiere del estado
    this.setVillagerState(villager, start);
    return villager;
  }

  // cambia el estado de un aldeano y refresca su burbuja
  setVillagerState(v, s) {
    v.state = s;
    const st = STATES[s];
    v.ring.setStrokeStyle(1.6, st.color, 0.95);
    v.bubbleText.setText(st.label);
    v.bubbleText.setColor('#' + st.color.toString(16).padStart(6, '0'));
  }

  // un aldeano vio el milagro: ¿qué entendió?
  readMiracle(v) {
    const s = v.state;
    let next;
    let verdict;
    if (s === 'ciencia') {
      next = 'ciencia';   // no cree: busca una explicación, no un dios
      verdict = 'Alguien midió el rayo. Ya no es milagro: es clima.';
    } else if (s === 'fe') {
      next = 'fe';        // ya te creía: ahora te cree más
      verdict = 'La fe se enciende con lo que ya se creía.';
    } else if (s === 'hambre') {
      next = 'fe';        // el hambre lo vio: que el cielo coma con él
      verdict = 'El hambriento vio el rayo y supo que había pan.';
    } else if (s === 'miedo') {
      next = 'fe';        // el miedo se hizo fervor
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
    // una sola intervención: cono de luz divina + núcleo + halo (mezcla ADITIVA)
    if (this.beamT > 0) return; // ya hay una activa
    this.beamT = 1;
    this.beamLife = 0;
    this.beamFading = false;

    const yBase = Math.max(y, this.groundY - 60);
    const bm = Phaser.BlendModes.ADD; // la luz se suma al fondo: se siente divina

    // cono de luz: dos capas (ancho + núcleo del haz) — Shape polygon, no Graphics
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

    // núcleo brillante
    const core = this.add.circle(x, yBase + 8, 14, PAL.core, 1);
    core.setBlendMode(bm);
    this.beamCore = core;

    // halo: anillo + resplandor interior
    const halo = this.add.circle(x, yBase + 8, 30, PAL.divine, 0.28);
    halo.setStrokeStyle(2, PAL.divine, 0.95);
    halo.setBlendMode(bm);
    this.beamHalo = halo;

    // resplandor que baña el suelo
    const glow = this.add.ellipse(x, yBase + 14, 170, 42, PAL.divine, 0.30);
    glow.setBlendMode(bm);
    this.beamGlow = glow;

    // ---- los aldeanos leen el milagro (radio ~130: dentro del cono) ----
    this.verdict.setText('');
    for (const v of this.villagers) {
      if (Math.abs(v.x - x) < 130) {
        this.verdict.setText(this.readMiracle(v));
      }
    }
  }

  update(time, delta) {
    // ---- ciclo de día/noche: 0..1..0 (período ~40s) ----
    const period = 40000;
    const phase = (time % period) / period;          // 0..1
    // 0 = medianoche, 0.5 = mediodía
    this.dayFactor = Math.max(0, Math.sin(phase * Math.PI * 2));

    // colores interpolados (solo objetos Shape; Graphics no tiene setFillStyle en v4)
    this.skyHigh.setFillStyle(mixColor(PAL.skyHighN, PAL.skyHighD, this.dayFactor));
    this.skyMid.setFillStyle(mixColor(PAL.skyMidN, PAL.skyMidD, this.dayFactor));
    this.horizon.setFillStyle(mixColor(PAL.horizonN, PAL.horizonD, this.dayFactor));
    this.ground.setFillStyle(mixColor(PAL.groundN, PAL.groundD, this.dayFactor));
    this.front.setFillStyle(mixColor(PAL.frontN, PAL.frontD, this.dayFactor));

    // orb: sol de día, luna de noche, cruzando el cielo en arco
    const orbX = lerp(-40, 840, phase);
    const orbY = 420 - Math.sin(phase * Math.PI) * 300;
    this.orb.setPosition(orbX, orbY);
    this.orb.setFillStyle(this.dayFactor > 0.5 ? PAL.sun : 0xcfd8e3);
    this.orb.setAlpha(0.35 + 0.65 * this.dayFactor);

    // ---- aldeanos: sus estados migran con el tiempo ----
    for (const v of this.villagers) {
      v.stateCd -= delta;
      if (v.stateCd <= 0) {
        this.setVillagerState(v, nextState(v.state));
        v.stateCd = 6000 + Math.random() * 7000;
      }

      // parpadeo cuando un milagro los tocó (el tablero avisa)
      if (v.reactT > 0) {
        v.reactT -= delta / 900;
        const r = Math.max(0, v.reactT);
        v.bubble.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(time / 40)));
        v.bubble.setScale(1 + r * 0.25);
        if (v.reactT <= 0) {
          v.bubble.setAlpha(1);
          v.bubble.setScale(1);
        }
      }

      // la burbuja flota un poco, como un suspiro
      v.bubble.setY(this.groundY - 22 + Math.sin(time / 700 + v.x) * 1.5);
    }

    // parpadeo sutil de la luz activa (vida ~4s: pulsa, se desvanece, se destruye)
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

      // el núcleo late
      this.beamCore.setScale(1 + 0.06 * Math.sin(time / 80));

      if (life > 3900) {
        this.beam.destroy();
        this.beamInner.destroy();
        this.beamCore.destroy();
        this.beamHalo.destroy();
        this.beamGlow.destroy();
        this.beam = this.beamInner = this.beamCore = this.beamHalo = this.beamGlow = null;
        this.beamT = 0;
      }
    }

    // ---- volcado de estados (solo ?debug) ----
    if (this.debugEl) {
      const line = this.villagers.map(v => `${Math.round(v.x)}:${v.state}`).join('  ');
      this.debugEl.textContent = `day=${this.dayFactor.toFixed(2)}  ${line}`;
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

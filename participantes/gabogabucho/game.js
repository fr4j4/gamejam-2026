// ============================================================
// APÓCRIFO — GameJam 2026, participante: gabogabucho
// Phaser 4.2.1
// Corte 1 (§14 del concepto): una aldea de siluetas, ciclo de
// día/noche, una sola intervención de luz. Se mide el contraste:
// lo sublime contra un mundo feo.
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

    // 5 aldeanos de 16px (cabeza + cuerpo), como multitud
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

    // ---- HUD mínimo ----
    this.hud = this.add.text(16, 16, 'APÓCRIFO — haz clic: una intervención de luz', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color: '#8f897c'
    });

    // auto-cast para verificación (solo con ?beam en la URL)
    if (new URLSearchParams(location.search).has('beam')) {
      this.castLight(400, 440);
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

  // aldeano 16px: cabeza + cuerpo (percepción del dios: no ves caras)
  makeVillager(x) {
    const g = this.add.graphics();
    g.fillStyle(PAL.silhouette, 1);
    g.fillCircle(x, this.groundY - 8, 3.5);
    g.fillRect(x - 3.5, this.groundY - 5, 7, 10);
    return g;
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

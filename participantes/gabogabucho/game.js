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
    this.beam = null;      // Graphics del cono de luz
    this.beamCore = null;  // núcleo en el punto de impacto
    this.beamHalo = null;  // halo alrededor
    this.beamT = 0;        // 1 = activa
    this.input.on('pointerdown', (pointer) => this.castLight(pointer.x, pointer.y));

    // ---- HUD mínimo ----
    this.hud = this.add.text(16, 16, 'APÓCRIFO — haz clic: una intervención de luz', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color: '#8f897c'
    });
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
    // una sola intervención: cono de luz divina + núcleo + halo
    if (this.beamT > 0) return; // ya hay una activa
    this.beamT = 1;
    const yBase = Math.max(y, this.groundY - 60);

    const beam = this.add.graphics();
    beam.fillStyle(PAL.divine, 0.14);
    beam.fillPoints([[x - 40, 0], [x + 40, 0], [x + 90, yBase + 20], [x - 90, yBase + 20]], true);
    beam.fillStyle(PAL.divine, 0.16);
    beam.fillPoints([[x - 18, 0], [x + 18, 0], [x + 45, yBase], [x - 45, yBase]], true);
    this.beam = beam;

    const core = this.add.circle(x, yBase + 8, 12, PAL.core, 0.95);
    this.beamCore = core;

    const halo = this.add.circle(x, yBase + 8, 34, 0x000000, 0);
    halo.setStrokeStyle(1.5, PAL.divine, 0.8);
    this.beamHalo = halo;

    // parpadeo orgánico del rayo
    this.tweens.add({
      targets: beam,
      alpha: { from: 0.75, to: 1 },
      duration: 260,
      yoyo: true,
      repeat: 7
    });
    this.tweens.add({
      targets: halo,
      scale: { from: 0.6, to: 1.15 },
      alpha: { from: 0, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.tweens.add({
          targets: [beam, core, halo],
          alpha: 0,
          duration: 700,
          onComplete: () => {
            beam.destroy(); core.destroy(); halo.destroy();
            this.beam = this.beamCore = this.beamHalo = null;
            this.beamT = 0;
          }
        });
      }
    });
  }

  update(time) {
    // ---- ciclo de día/noche: 0..1..0 (período ~40s) ----
    const period = 40000;
    const phase = (time % period) / period;          // 0..1
    // 0 = medianoche, 0.5 = mediodía
    this.dayFactor = Math.max(0, Math.sin(phase * Math.PI * 2));

    // colores interpolados
    this.skyHigh.setFillStyle(mixColor(PAL.skyHighN, PAL.skyHighD, this.dayFactor));
    this.skyMid.setFillStyle(mixColor(PAL.skyMidN, PAL.skyMidD, this.dayFactor));
    this.horizon.setFillStyle(mixColor(PAL.horizonN, PAL.horizonD, this.dayFactor));
    this.mountains.setFillStyle(mixColor(PAL.mtnN, PAL.mtnD, this.dayFactor));
    this.grove.setFillStyle(mixColor(PAL.groveN, PAL.groveD, this.dayFactor));
    this.ground.setFillStyle(mixColor(PAL.groundN, PAL.groundD, this.dayFactor));
    this.front.setFillStyle(mixColor(PAL.frontN, PAL.frontD, this.dayFactor));

    // orb: sol de día, luna de noche, cruzando el cielo en arco
    const orbX = lerp(-40, 840, phase);
    const orbY = 420 - Math.sin(phase * Math.PI) * 300;
    this.orb.setPosition(orbX, orbY);
    this.orb.setFillStyle(this.dayFactor > 0.5 ? PAL.sun : 0xcfd8e3);
    this.orb.setAlpha(0.35 + 0.65 * this.dayFactor);

    // parpadeo sutil de la luz activa
    if (this.beam && this.beamCore) {
      const flicker = 0.85 + 0.15 * Math.sin(time / 60);
      this.beamCore.setAlpha(0.8 * flicker);
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

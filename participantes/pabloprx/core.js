// Mixin de RunnerScene: metodos extraidos de AIRunnerGame.js (sin cambios).
// Se aplica con Object.assign(RunnerScene.prototype, ...) en AIRunnerGame.js.
import * as Phaser from "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js";
import { HEX, FONTS } from "./theme.js";
import { LANE_X, JUMP_V, SLIDE_T, DASH_T, hits, stepPlayer, SPEED_MULS } from "./physics.js";
import {
  loadLevel, zOf, leadOf, flipAt, rowAt, timeOfRow, zoneAt,
} from "./music.js";
import { loadAudio } from "./transport.js";
import { CAMS } from "./cams.js";
import { toScript, fmt } from "./record.js";
import { DEAD_T, FIGS, FLIP_T, GLYPH, MAX_ACID, MAX_LABELS, MAX_TILES, NEON, ORB_GRACE, PLAY, RATES, RATE_KEYS, SWIPE } from "./config.js";
import { LEVELS } from "./music.js";
import { dec } from "./pure.js";
const LEVEL_Q = new URLSearchParams(location.search).get("level");
const LEVEL = LEVELS[LEVEL_Q] ? LEVEL_Q : "insomnia-drop";

export const core = {
    create() {
      this.g = this.fantasma(this.add.graphics());
      this.labels = Array.from({ length: MAX_LABELS }, () => this.add.text(0, 0, "", {
        fontSize: "11px", color: HEX.textMuted, fontFamily: FONTS.mono.fontFamily,
      }).setOrigin(0, 1).setVisible(false));
      this.tileLabels = Array.from({ length: MAX_TILES }, () => this.add.text(0, 0, "", {
        fontSize: "11px", color: HEX.textMuted, fontFamily: FONTS.mono.fontFamily,
      }).setOrigin(0.5, 1).setVisible(false));
      this.acid = Array.from({ length: MAX_ACID }, () => this.add.text(0, 0, "", {
        fontSize: "48px", color: HEX.lime, fontFamily: FONTS.mono.fontFamily, fontStyle: "bold",
      }).setOrigin(0.5).setVisible(false));
      // el orb pide MANTENER ↑, que no se deduce de mirarlo: se dice con todas las letras
      this.orbHint = this.add.text(0, 0, "", {
        fontSize: "15px", color: HEX.pink, fontFamily: FONTS.mono.fontFamily, fontStyle: "bold",
      }).setOrigin(0.5, 0).setVisible(false);
      this.hud = this.add.text(20, 18, "", {
        fontSize: "16px", color: HEX.cyan, fontFamily: FONTS.mono.fontFamily, lineSpacing: 3,
      });
      this.hint = this.add.text(20, 0, "", {
        fontSize: "12px", color: HEX.textMuted, fontFamily: FONTS.ui.fontFamily,
      }).setText(
        "←/→ carril · ↑ saltar (mantener = dash en orb) · ↓ deslizar · SPACE play/pausa · " +
        "1-5 x1/.5/.25/.1/.05 · ,/. ∓compas (shift=beat) · L loop 8c · G #cue · HOME inicio · M marcas · " +
        "T filas/tiles · J capas · P fantasma · C camara · H gravedad · Y grabar · U exportar · " +
        "clic en la tira = ir a ese sector (shift = compas) · " +
        "K inmune · X mute · V feel · -/+ sync"
      );
      this.msg = this.add.text(0, 0, "cargando…", {
        fontSize: "28px", color: HEX.cyan, fontFamily: FONTS.mono.fontFamily, align: "center",
      }).setOrigin(0.5);
  
      const k = this.input.keyboard;
      const on = (key, fn) => k.on(`keydown-${key}`, fn);
      for (const key of ["LEFT", "A"]) on(key, () => this.move(-1));
      for (const key of ["RIGHT", "D"]) on(key, () => this.move(1));
      for (const key of ["UP", "W"]) on(key, () => this.jump());
      this.holdKeys = k.addKeys("UP,W");   // el dash del orb se sostiene, no se pulsa
      for (const key of ["DOWN", "S"]) on(key, () => this.slide());
      // muerto no se toca nada: SPACE y el clic volverian a soltar el audio con el mundo congelado,
      // y la espera es la mecanica ("so its not like spaming retry"). En diseno `dead` vale 0 siempre.
      on("SPACE", () => { if (!this.dead) this.tp?.toggle(); });
      // De aca abajo son las teclas de DISENO: en modo juego no se atan (no hay con que rebobinar,
      // ni volverse inmune, ni exportar el guion). `holdKeys` queda arriba a proposito: el dash del
      // orb lo necesita siempre.
      if (!PLAY) {
        on("R", () => this.resetRun());
        on("HOME", () => this.seek(0));
        RATES.forEach((r, i) => on(RATE_KEYS[i], () => this.tp?.setRate(r)));
        on("COMMA", (e) => this.seekGrid(-1, e.shiftKey));
        on("PERIOD", (e) => this.seekGrid(1, e.shiftKey));
        on("L", () => this.toggleLoop());
        on("G", () => this.gotoCue());
        on("M", () => { this.marks = !this.marks; });
        on("T", () => { this.nums = (this.nums + 1) % 3; });   // off / filas / tiles
        on("J", () => { this.bgMode = (this.bgMode + 1) % 3; });   // todas / solo base / solo detalle
        on("P", () => { this.ghostKey = !this.ghostKey; });   // fantasma a mano (el del nivel es la f63)
        // C elige la camara "de base": dentro de una zona con `cam` manda la zona
        on("C", () => { this.camPick = (this.camIdx + 1) % CAMS.length; this.setCam(this.camPick); });
        // flip a mano para probar: es una cue de flip mas, puesta en el songT de la tecla,
        // asi que rebobinar antes de haberla apretado tambien la deshace
        on("H", () => { this.hflip.push(this.songT); });
        // Y graba DESDE DONDE ESTAS HASTA EL FINAL y no toca nada anterior: se tira lo grabado
        // de aca en adelante (lo estas rehaciendo) y se anota la fila, que es de donde `U` va a
        // empezar a dictar. Lo que ya esta escrito a mano en el guion no se puede pisar.
        on("Y", () => {
          this.recOn = !this.recOn;
          if (!this.recOn) return;
          this.rec = this.rec.filter((a) => a.t < this.songT);
          this.recFrom = this.lv ? Math.max(0, rowAt(this.songT, this.lv)) : 0;
        });
        on("U", () => this.dumpRec());
        on("K", () => { this.godmode = !this.godmode; });
        on("X", () => { this.muted = !this.muted; this.tp?.setMute(this.muted); });
        on("V", () => { this.mulIdx = (this.mulIdx + 1) % SPEED_MULS.length; });
        on("MINUS", () => { if (this.tp) this.tp.adj -= 0.005; });   // sync a ojo: la linea
        on("PLUS", () => { if (this.tp) this.tp.adj += 0.005; });     // tiene que pisar el kick
      }
      this.input.on("pointerdown", (p) => {
        if (this.stripSeek(p)) return;
        if (this.tp && !this.tp.playing && !this.dead) this.tp.play();
      });
      // TACTIL: un gesto = UNA accion y el eje dominante la elige. Llama a las MISMAS move/jump/
      // slide que el teclado, o sea que el mundo no se entera de por donde entro la orden y no hay
      // una segunda fisica que mantener. Solo el toque seco depende del modo: en diseno el clic ya
      // es play/pausa y la tira es un seek.
      this.sw = null;         // gesto en curso: { x, y, done }
      this.touchHold = false; // dedo apoyado = ↑ mantenida, que es como se enganchan los orbs
      this.input.on("pointerdown", (p) => {
        this.sw = { x: p.x, y: p.y, done: false };
        if (p.wasTouch) this.touchHold = true;   // el raton no: en escritorio se mantiene con ↑/W
      });
      this.input.on("pointermove", (p) => {
        const s = this.sw;
        if (!s || s.done || !p.isDown) return;
        const dx = p.x - s.x, dy = p.y - s.y;
        if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
        s.done = true;
        if (Math.abs(dx) > Math.abs(dy)) this.move(Math.sign(dx));
        else if (dy < 0) this.jump();
        else this.slide();
      });
      this.input.on("pointerup", () => {
        if (PLAY && this.sw && !this.sw.done) this.jump();   // toque seco = saltar
        this.sw = null;
        this.touchHold = false;
      });
  
      this.marks = !PLAY;
      this.nums = PLAY ? 0 : 1;   // modo diseno: arranca mostrando las filas
      this.bgMode = 0;
      this.fig = 0;            // figura de la constelacion: una por destello (`FIGS`)
      this.neg = false;        // negativo: la imagen entera invertida (tramo `fx`)
      this.ghost = false;      // fantasma: lo pone `draw()` (la f63) o la tecla
      this.ghostKey = false;   // fantasma forzado a mano (tecla P)
      this.godmode = !PLAY;  // modo diseno: chocar no corta el dictado
      this.dead = 0;         // segundos de espera que quedan tras morir (reloj real, no songT)
      // el HUD y la lista de teclas son herramientas de diseno: jugando no van
      if (PLAY) { this.hud.setVisible(false); this.hint.setVisible(false); }
      this.muted = false;
      this.mulIdx = 0;
      this.songT = 0;
      this.hflip = [];   // flips a mano (tecla H): tiempos de cancion, no estado del nivel
      this.rec = [];     // grabacion (tecla Y): { accion, songT, carril }
      this.recOn = false;
      this.recFrom = 0;  // fila desde la que se dicta: `U` no emite nada anterior
      this.grav = 1;
      this.roll = 0;
      this.camPick = 0;
      this.setCam(0);
      this.resetRun();
      this.boot();
    }
,
    async boot() {
      try {
        this.lv = await loadLevel(LEVEL);
        this.byRow = new Map();   // fila -> [glifo por carril], para el indicador al lado de f<n>
        for (const c of this.lv.cues) {
          if (c.lane == null || !GLYPH[c.kind]) continue;
          const a = this.byRow.get(c.row) ?? Array(this.lanes).fill("·");
          a[c.lane] = GLYPH[c.kind];
          this.byRow.set(c.row, a);
        }
        this.tp = await loadAudio(this.lv.level.audio);
        window.__dbg = this;   // consola: __dbg.lv.cues, __dbg.seek(12), __dbg.tp
        this.msg.setText("click o SPACE para empezar");
      } catch (e) {
        this.msg.setText(`no carga el nivel:\n${e.message}`);
        console.error(e);
      }
    }
,
    get speed() { return (this.lv?.speed ?? 700) * SPEED_MULS[this.mulIdx]; }
,
    get laneX() { return this.lv?.laneX ?? LANE_X; }
,
    get lanes() { return this.lv?.lanes ?? 3; }
,
    get laneIdx() { return Array.from({ length: this.lanes }, (_, i) => i); }
,
    get edge() { return -this.laneX[0] + 85; }
,
    dec(name) { return dec(name, this.lv); }
,
    get neon() {
      const f = this.lv?.neon?.fam?.length ? this.lv.neon.fam : NEON;
      const k = (this.mk ?? 0) % f.length;
      return k ? f.slice(k).concat(f.slice(0, k)) : f;
    }
,
    get rigOver() { return !!this.lv?.rigOver; }
,
    resetRun() {
      this.lane = (this.lanes - 1) >> 1;   // el del medio: 1 con 3 carriles y con 4
      this.x = this.laneX[this.lane];
      this.y = 0;
      this.vy = 0;
      this.sliding = 0;
      this.dash = 0;
      this.orbMiss = null;
      // lo que cobra el muneco: aterrizaje (rodillas), despegue (elige truco) y el tirón
      this.landT = -9;
      this.jumpT = -9;
      this.wobT = -9;
      this.wobDir = 0;
      this.lives = PLAY ? 1 : 3;   // jugando es UNA vida: el golpe mata
      this.invuln = 0;
      this.hit = new Set();
    }
,
    seek(t) {
      this.tp?.seek(t);
      this.songT = this.tp ? this.tp.pos() : t;
      this.resetRun();
      this.trimRec(this.songT);
    }
,
    trimRec(t) {
      if (!this.recOn) return;
      this.rec = this.rec.filter((a) => a.t < t);
      if (this.lv) this.recFrom = Math.min(this.recFrom, Math.max(0, rowAt(t, this.lv)));
    }
,
    log(a, o) { if (this.recOn) this.rec.push({ a, t: this.songT, lane: this.lane, ...o }); }
,
    dumpRec() {
      if (!this.lv || !this.rec.length) return;
      const { script, solid, cells, orbs, from } =
        toScript(this.rec, this.lv, this.speed, this.lv.length, 1 / 240, this.recFrom, this.lanes);
      // el rec crudo va al final: si el relleno hay que recalcularlo, no se vuelve a jugar
      const txt = `// ${this.rec.length} acciones -> ${script.length} directivas en ${cells} celdas`
        + ` (${(100 * script.length / cells).toFixed(0)}% de la pista, ${solid} cajas, ${orbs} jump orbs)\n`
        + `// DESDE LA FILA ${from}: se pega al final del script, no pisa nada anterior\n`
        + `// el negativo de la corrida: solo queda libre por donde pasaste\n${fmt(script)}\n`
        + `// rec crudo (v=${this.speed}): ${JSON.stringify(this.rec)}\n`;
      console.log(txt);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([txt], { type: "text/javascript" }));
      a.download = `guion-${LEVEL}.js`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
,
    seekGrid(dir, beatStep) {
      if (!this.lv) return;
      const s = beatStep ? this.lv.beat : this.lv.bar;
      const g = Math.round((this.songT - this.lv.off) / s) * s + this.lv.off;
      this.seek(Math.max(0, g + dir * s));
    }
,
    toggleLoop() {
      if (!this.tp || !this.lv) return;
      if (this.tp.loop) { this.tp.loop = null; return; }
      const blk = this.lv.bar * 8;
      const a = Math.max(0, Math.floor((this.songT - this.lv.off) / blk) * blk + this.lv.off);
      this.tp.loop = [a, Math.min(a + blk, this.lv.length)];
      this.seek(a);
    }
,
    gotoCue() {
      if (!this.lv) return;
      const s = (prompt("ir a la cue #  (f78 = fila 78)") || "").trim();
      const t = s[0] === "f" ? timeOfRow(parseInt(s.slice(1), 10), this.lv)
        : this.lv.cues.find((q) => q.n === parseInt(s, 10))?.t;
      if (t != null && !isNaN(t)) this.seek(Math.max(0, t - 2));
    }
,
    zone() { return this.lv && !this.recOn ? zoneAt(this.songT, this.lv) : null; }
,
    move(dir) {
      if (this.zone()) return;
      const to = Phaser.Math.Clamp(this.lane + dir, 0, this.lanes - 1);
      if (to !== this.lane) {
        this.log("lane", { to });   // el carril que DEJAS es el que se tapa
        this.wobT = this.songT; this.wobDir = dir;   // el tirón: lo cobra drawPlayer
      }
      this.lane = to;
    }
,
    held() { return this.holdKeys.UP.isDown || this.holdKeys.W.isDown || this.touchHold; }
,
    jump() {
      // Colchon del orb: si lo pasaste SIN mantener, queda anotado ORB_GRACE segundos. Pulsar
      // tarde lo agarra igual (el orb es una ventana de 157ms a v=700: sin esto hay que
      // adivinarla). No es lo mismo que saltar: por eso va antes del corte de "en el aire".
      if (this.orbMiss && this.songT - this.orbMiss.t <= ORB_GRACE) {
        const c = this.orbMiss.c;
        this.orbMiss = null;
        if (!this.hit.has(c.n)) { this.takeOrb(c); return; }
      }
      if (this.grav * this.y > 0) return;   // en el aire no hay salto: tampoco se graba
      this.vy = this.grav * JUMP_V;
      this.sliding = 0;
      this.log("jump");
    }
,
    takeOrb(c) {
      this.hit.add(c.n);
      if (c.kind === "orbj") { this.vy = this.grav * JUMP_V; this.sliding = 0; return; }
      this.dash = DASH_T;
    }
,
    slide() {
      if (this.grav * this.y > 0) this.vy = -this.grav * JUMP_V; // fast fall
      this.sliding = SLIDE_T;
      this.log("slide");
    }
,
    update(time, delta) {
      // Muerto: el mundo se sigue DIBUJANDO congelado (songT no avanza porque el transporte esta
      // pausado) y lo que no corre es la fisica ni el choque. La espera va con el delta REAL de
      // Phaser y no con songT, que es justo lo que esta parado; y no la salta ni una tecla ni un
      // clic, que es toda la gracia de la cuenta.
      if (this.dead > 0) {
        this.dead -= delta / 1000;
        if (this.dead <= 0) { this.dead = 0; this.seek(0); this.tp?.play(); }
        this.draw();
        return;
      }
      if (this.tp) {
        const t = this.tp.tick();
        // FIN DEL NIVEL jugando: `tick` pausa solo al llegar al final, y sin HUD ni lista de
        // teclas no queda un solo texto que lo diga (medido: msg invisible, pantalla quieta).
        // Se reusa la espera de la muerte: mismo cartel y vuelta a empezar. Cual de las dos es
        // lo dice `lives`, que morir deja en 0.
        if (PLAY && !this.tp.playing && t >= this.tp.duration - 1e-2) this.dead = DEAD_T;
        let dt = t - this.songT;
        if (dt < 0 || dt > 0.25) { this.resetRun(); this.trimRec(t); dt = 0; }  // rebobinado o salto: el guy vuelve a cero
        this.songT = t;
        this.flip();
        this.camForZone();
        this.step(dt);
      }
      this.draw();
    }
,
    flip() {
      const f = flipAt(this.songT, this.lv?.cues ?? []);
      const h = this.hflip.filter((t) => t <= this.songT);
      const n = f.n + h.length;
      const k = Phaser.Math.Clamp((this.songT - Math.max(f.at, ...h)) / FLIP_T, 0, 1);
      this.grav = n % 2 ? -1 : 1;
      this.roll = Math.PI * (n - 1 + k * k * (3 - 2 * k));
    }
,
    step(dt) {
      const z = this.zone();
      if (z) this.lane = z.lane;   // entrar en la zona te alinea: es funcion de songT, no un evento
      this.x = Phaser.Math.Linear(this.x, this.laneX[this.lane], Math.min(1, dt * 12));
      const enAire = this.grav * this.y > 0;
      Object.assign(this, stepPlayer(this, dt, this.grav, this.held()));
      if (enAire && this.y === 0) this.landT = this.songT;   // aterrizaje: lo cobra drawPlayer
      if (!enAire && this.grav * this.y > 0) {
        this.jumpT = this.songT;                      // despegue: elige truco
        this.wobT = this.songT; this.wobDir = 0.7;    // y sacude un poco
      }
      if (this.invuln > 0) this.invuln -= dt;
      if (dt === 0 || this.recOn) return;   // grabando la pista esta vacia: no hay con que chocar
      for (const c of this.near()) {
        const orb = c.role === "orb";
        if ((!orb && c.role !== "obstacle") || c.lane !== this.lane || this.hit.has(c.n)) continue;
        if (!orb && (this.invuln > 0 || this.dash > 0)) continue;   // el dash atraviesa
        if (!hits(c.kind, zOf(c, this.songT, this.speed), this.y, this.sliding, this.grav)) continue;
        // el orb pide mantener ↑/W. Si pasaste sin mantener no se pierde: queda anotado y
        // `jump()` lo cobra hasta ORB_GRACE despues (ver ahi).
        if (orb) {
          if (this.held()) this.takeOrb(c);
          else this.orbMiss = { c, t: this.songT };
          continue;
        }
        this.hit.add(c.n);
        this.invuln = 1.2;
        this.wobT = this.songT; this.wobDir = 2.2;   // el golpe sacude mas que un carril
        if (!this.godmode) this.lives = Math.max(0, this.lives - 1);
        // MUERTE: pausar el transporte congela el mundo EN EL SITIO, porque todo lo que se dibuja
        // es funcion de songT. La cuenta atras la lleva `update` con el delta real.
        if (PLAY && !this.lives) { this.tp?.pause(); this.dead = DEAD_T; }
      }
    }
,
    near() {
      const t = this.songT, lead = leadOf(this.speed);
      return this.lv ? this.lv.cues.filter((c) => c.t > t - 0.4 && c.t < t + lead + 0.2) : [];
    }
,
    setCam(i) {
      this.camIdx = ((i % CAMS.length) + CAMS.length) % CAMS.length;
      this.cam = CAMS[this.camIdx];
      this.zn = this.cam.zn;
      this.proj = this.cam.proj.bind(this);
      this.frame = this.cam.frame.bind(this);
    }
,
    setGrid(on, w, h) {
      if (!on && !this.quad) return;
      if (!this.quad) {
        this.rt = this.add.renderTexture(0, 0, w, h).setOrigin(0).setVisible(false);
        this.rt.saveTexture("gridRT");
        this.quad = [0, 1, 2, 3].map(() => this.add.image(0, 0, "gridRT")
          .setOrigin(0).setDepth(-1).setVisible(false));
      }
      this.g.setVisible(!on);
      // El tamano se rehace cada frame en vez de colgarse de un `resize`: `w` y `h` son los mismos
      // de los que sale TODO el dibujo, o sea que redimensionar ya esta contemplado y no queda un
      // segundo sitio que pueda desincronizarse.
      this.quad.forEach((q, i) => q.setVisible(on).setScale(0.5)
        .setPosition((i % 2) * (w / 2), ((i / 2) | 0) * (h / 2)));
      if (!on) return;
      if (this.rt.width !== w || this.rt.height !== h) this.rt.setSize(w, h);
      this.rt.clear();
      this.rt.draw(this.g);
      // ponytail: el clic en la tira (`stripSeek`) sigue midiendo en coordenadas del canvas entero,
      // o sea que mientras dura la grilla hay que pinchar donde estaria la tira sin duplicar. Se
      // arregla el dia que valga la pena partiendo el Graphics en mundo + tira.
    }
,
    camForZone() {
      const z = this.zone();
      const want = z ? CAMS.findIndex((c) => c.id === z.cam) : this.camPick;
      if (want >= 0 && want !== this.camIdx) this.setCam(want);
    }
,
    get bt() {
      return this.lv ? (this.songT - (this.lv.off ?? 0)) / this.lv.beat : undefined;
    }
,
};

// Mixin de RunnerScene: metodos extraidos de AIRunnerGame.js (sin cambios).
// Se aplica con Object.assign(RunnerScene.prototype, ...) en AIRunnerGame.js.
import * as Phaser from "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js";
import { PALETTE } from "./theme.js";
import { KINDS, PLAYER_H, PLAYER_Z, SPAWN_Z, JUMP_V, ride } from "./physics.js";
import {
  LEVELS, enterOf, enterDz, mix, chaseAt, CHASE, hueAt, rotHue,
} from "./music.js";
import { pose, drawAvatar } from "./avatar.js";
import { COLORS, GLYPH_UV, HOVER, KILL, TRICKS, hash } from "./config.js";
import { pasa } from "./pure.js";

export const entities = {
    drawOrb(o, z) {
      const g = this.g, k = KINDS[o.kind] ?? KINDS.orb;
      if (z + k.d < this.zn) return;
      const col = COLORS[o.kind] ?? COLORS.orb;
      const p = this.proj(this.laneX[o.lane], ((k.y0 + k.y1) / 2) * this.grav, Math.max(z + k.d / 2, this.zn));
      const r = (k.w + 14 + 5 * Math.sin(this.songT * 9)) * p.s;   // late a ~1.4Hz
      const a = this.hit.has(o.n) ? 0.2 : 1;
      // Mantener ↑/W es la condicion, asi que se ve: manteniendo el orb se llena, suelto queda
      // hueco. Mas el cartel del que viene entrando (drawOrbHint), que lo dice con letras.
      if (a === 1 && this.held()) {
        g.fillStyle(col, 0.85);
        g.fillCircle(p.x, p.y, r * 0.55);
      }
      g.fillStyle(col, 0.22 * a);
      g.fillCircle(p.x, p.y, r);
      g.lineStyle(Math.max(2, 5 * p.s), col, a);
      g.strokeCircle(p.x, p.y, r);
      if (o.kind !== "orbj") return;
      // flecha hacia donde te va a mandar (con la gravedad invertida, hacia abajo)
      const d = r * 0.5 * this.grav;
      g.lineBetween(p.x, p.y + d, p.x, p.y - d);
      g.lineBetween(p.x - d * 0.6, p.y - d * 0.4, p.x, p.y - d);
      g.lineBetween(p.x + d * 0.6, p.y - d * 0.4, p.x, p.y - d);
    }
,
    pasa(zf) { return pasa(zf, this.cam.body); }
,
    fantasma(g) {
      const fill = g.fillStyle.bind(g), line = g.lineStyle.bind(g);
      const luma = (c) => {
        const l = Math.round(((c >> 16 & 255) * 0.3 + (c >> 8 & 255) * 0.59 + (c & 255) * 0.11) * 0.28);
        return (l << 16) | (l << 8) | l;
      };
      // LA DERIVA DE TONO (`hue` en LEVELS, `hueAt` en music.js) va en la MISMA puerta y ANTES
      // del fantasma: se pidio "una variacion de color, un movimiento de tono y no un pase
      // directo a rosa", o sea la paleta entera girada en el circulo de color y de vuelta.
      // Aca y no en cada capa por la misma razon que el fantasma: es una sola puerta contra
      // veinte funciones de dibujo. En fantasma no se aplica porque ahi no hay tono que girar.
      //
      // `KILL` SE QUEDA QUIETO Y NO PUEDE NO QUEDARSE: es lo unico que mata y por eso es lo unico
      // caliente en todos los niveles (misma regla que lo saca de `neon`). Un rojo que deriva
      // hacia el color del decorado es exactamente lo que la regla prohibe.
      // El blanco, el negro y los grises no hacen falta exceptuarlos: tienen saturacion 0 y girar
      // el tono de un gris devuelve el mismo gris.
      //
      // Se MEMOIZA por frame: el Graphics recibe entre 9000 y 13800 llamadas de estilo por frame
      // y los colores distintos son unas decenas, o sea que la conversion se hace una vez por
      // color y no una por llamada. El cache se tira cuando el giro cambia (una vez por frame).
      const memo = new Map();
      let hk = null;
      const gira = (c) => {
        const d = this.hue ?? 0;
        if (!d || c === KILL) return c;
        if (d !== hk) { memo.clear(); hk = d; }
        const m = memo.get(c);
        if (m !== undefined) return m;
        const v = rotHue(c, d);
        memo.set(c, v);
        return v;
      };
      // el blanco puro se queda blanco: es la unica forma de que algo (la constelacion) siga
      // siendo macizo cuando todo lo demas es gris al 28%.
      // El NEGATIVO va ULTIMO, envolviendo al fantasma y a la deriva de tono. Medido con el cyan
      // del nivel: fantasma solo da #2c2c2c, invirtiendo ANTES da #1c1c1c (16/255, o sea que el
      // fantasma se lo come) e invirtiendo DESPUES da #d3d3d3 (167/255). Y rotar el tono de un
      // color ya invertido lo manda a otra familia, o sea que la deriva medida deja de ser esa.
      // KILL NO esta exento, al reves que en la deriva de tono: `^0xffffff` es una isometria, asi
      // que invertirlo TAMBIEN conserva su separacion exacta contra el decorado (239 minima /
      // 153 grados, los mismos numeros que en normal); eximirlo la hunde a 86.0 y 2 grados, o sea
      // que lo que mata se confundiria con el fondo. Respaldo del dial: con this.neg = false,
      // neg(v) === v, o sea las dos lineas de siempre.
      const neg = (v) => (this.neg ? v ^ 0xffffff : v);
      g.fillStyle = (c, a) => fill(neg(this.ghost && c !== 0xffffff ? luma(c) : gira(c)), a);
      g.lineStyle = (w, c, a) => line(w, neg(this.ghost && c ? 0xffffff : gira(c)), a);
      return g;
    }
,
    drawGap(o, z) {
      const g = this.g, k = KINDS.gap;
      if (z + k.d < this.zn) return;
      const zf = Math.max(z, this.zn), zb = Math.max(z + k.d, this.zn + 10);
      const alpha = (this.hit.has(o.n) ? 0.3 : 1) * this.pasa(zf);
      const P = (xx, zz) => { const p = this.proj(xx, 0, zz); return new Phaser.Geom.Point(p.x, p.y); };
      // de perfil el suelo es una linea: el hueco se ve como una muesca hacia abajo
      const x0 = this.cam.flat ? 0 : this.laneX[o.lane] - k.w;
      const x1 = this.cam.flat ? 0 : this.laneX[o.lane] + k.w;
      const quad = this.cam.flat
        ? (() => { const a = P(0, zf), b = P(0, zb), d = 46 * this.grav;
          return [a, b, new Phaser.Geom.Point(b.x, b.y + d), new Phaser.Geom.Point(a.x, a.y + d)]; })()
        : [P(x0, zf), P(x1, zf), P(x1, zb), P(x0, zb)];
      // Se leia como una baldosa cyan: parecia decoracion, no un agujero que mata. Ahora es
      // negro con dos anillos hacia adentro (eso es lo que le da fondo: sin ellos es una mancha
      // plana) y el borde ROJO, el mismo color que la caja que mata. Late con la musica como
      // las cajas. Los anillos se calculan tirando cada esquina al centro, asi que salen igual
      // en 3D y de perfil sin un solo if.
      const cx = quad.reduce((s, p) => s + p.x, 0) / 4;
      const cy = quad.reduce((s, p) => s + p.y, 0) / 4;
      const dentro = (kk) => quad.map((p) =>
        new Phaser.Geom.Point(p.x + (cx - p.x) * kk, p.y + (cy - p.y) * kk));
      g.fillStyle(0x000000, alpha);
      g.fillPoints(quad, true);
      g.fillStyle(mix(KILL, 0x000000, 0.7), 0.7 * alpha);
      g.fillPoints(dentro(0.2), true);
      g.fillStyle(0x000000, alpha);
      g.fillPoints(dentro(0.42), true);
      // CHASE: los huecos de una zanja se encienden EN FILA, uno cada medio beat (ver `chaseAt`).
      const chase = chaseAt(o.row, this.songT, this.lv?.beat ?? 0.4615);
      for (const [wd, al] of [[5 + 14 * this.beat, 0.25], [3, 0.95]]) {
        g.lineStyle(wd * (1 + chase), KILL, al * alpha * (0.45 + 0.55 * chase));
        g.strokePoints(quad, true);
      }
      // La X dentro del hueco: el `gap` mata igual que el `block`, asi que lleva el MISMO
      // simbolo. Sin ella el agujero se leia como una baldosa y habia que saber que el borde
      // rojo mata; con la X no depende del color. Debajo de 26px de diagonal no se dibuja,
      // igual que los glifos de las cajas: de lejos es una mancha.
      const d = Math.hypot(quad[2].x - quad[0].x, quad[2].y - quad[0].y);
      if (d > 26) {
        const q = dentro(0.26);
        g.lineStyle(Math.max(2, d * 0.1), PALETTE.text, (0.3 + 0.7 * chase) * alpha);
        g.lineBetween(q[0].x, q[0].y, q[2].x, q[2].y);
        g.lineBetween(q[1].x, q[1].y, q[3].x, q[3].y);
      }
    }
,
    drawBox(o, z) {
      const g = this.g;
      const k = KINDS[o.kind];
      let x = this.laneX[o.lane];
      if (z + k.d < this.zn) return;
      const zf = Math.max(z, this.zn);
      const zb = Math.max(z + k.d, this.zn + 10);
      // Niebla + latido, las dos por caja. `f` es lo que le falta de viaje (0 encima tuyo,
      // 1 recien salida) al cuadrado: lo cercano queda limpio y el fondo se apaga rapido, que
      // es lo que hace que una pared no tape la lectura de la que viene detras.
      // 1600 y no SPAWN_Z-PLAYER_Z (3280): medido a v=700, las cajas caen una cada 323z (una por
      // beat), asi que con 3280 la 2a y la 3a (z=1069, 1392) daban f=0.02 y 0.05, o sea nada. Con
      // 1600 la que tenes encima y la siguiente siguen limpias (f=0.00 y 0.05), la 3a empieza a
      // irse (0.17) y de la 5a (z=2361) en adelante esta hundida del todo.
      const f = Phaser.Math.Clamp((zf - PLAYER_Z) / 1600, 0, 1) ** 2;
      const cerca = 1 - f;
      // el latido es del kick y se lo come la niebla: de lejos ni brilla
      const color = mix(mix(COLORS[o.kind], this.fog, f * 0.8), 0xffffff, this.beat * 0.75 * cerca);
      const alpha = (this.hit.has(o.n) ? 0.25 : 1) * (1 - 0.4 * f) * this.pasa(zf);
      let y0 = k.y0 * this.grav, y1 = k.y1 * this.grav;   // con gravedad invertida cuelgan
      let w = k.w, ea = 1, rot = 0;
      // ENTRADA: como aparece el obstaculo, por seccion (`enter` en LEVELS). A la velocidad del
      // nivel termina a 1019 del jugador, o sea 3.2 beats antes del impacto y ya legible: con
      // 5 beats terminaba hundida en la niebla y por eso no se veia. `enterDz` la topa para que
      // eso siga valiendo con `V` (feel) puesto: a x2 el viaje entero dura 5.08 beats y sin
      // topar la caja llegaba con la entrada a medias. Es puro dibujo: la hitbox sale de KINDS
      // y no se entera.
      const e = enterOf(zf, enterDz(this.lv?.beat ?? 0.4615, this.speed));
      if (e < 1) {
        const q = 1 - (1 - e) ** 2;   // ease-out: entra rapido y frena
        switch (this.lv?.enter?.[this.sec] ?? "fade") {
          case "grow": y1 = y0 + (y1 - y0) * q; break;                    // crece desde el piso
          // cae del cielo: 2600 es mas que la altura de la pantalla a esa z, o sea que entra
          // literalmente desde fuera de cuadro y se clava. Con 900 el viaje quedaba dentro de
          // la caja y se leia como un temblor.
          case "slam": { const dy = (1 - q) * 2600 * this.grav; y0 += dy; y1 += dy; break; }
          case "wide": w = k.w * (1 + 3 * (1 - q)); break;                // ancho y se cierra
          // rueda: gira 135 grados sobre su base. Va en PANTALLA y no en el mundo (rotar una
          // caja en 3D es reproyectarla entera; girar sus 4 esquinas ya proyectadas son dos
          // senos), y como el pivote es la base, la caja nunca se despega del carril.
          case "roll": rot = (1 - q) * Math.PI * 0.75 * this.grav; break;
          // entra de costado: sale de fuera de la pista (1500 en el mundo, o sea mas alla del
          // carril de afuera) y se DESLIZA hasta el suyo. El lado sale de `hash(fila)`, nunca
          // de Math.random: rebobinar la trae del mismo lado. Va en el MUNDO y no en pantalla
          // (al reves que `roll`): asi la caja llega con la perspectiva de su carril y no
          // aterriza corrida. En la camara de perfil la x no proyecta, o sea que ahi es solo
          // el alpha; el buildup no usa esa camara.
          case "side": x += (1 - q) * 1500 * (hash(o.row ?? 0) < 0.5 ? -1 : 1); break;
        }
        ea = 0.25 + 0.75 * q;   // todas suben de alpha ademas: si no, aparecen de la nada
      }
      // El `high` cuelga a la altura de la cabeza: encima tuyo tapa la pista entera y no deja
      // ver lo que viene detras. De cerca se le va el RELLENO (0.2 cuando te pisa) pero el
      // contorno y el simbolo se quedan enteros: la silueta se lee, la pared no tapa.
      const velo = o.kind === "high"
        ? 0.2 + 0.8 * Phaser.Math.Clamp((zf - PLAYER_Z) / 700, 0, 1) : 1;
      const aFill = alpha * ea * velo, aLine = alpha * ea;
  
      const P = (xx, yy, zz) => {
        const p = this.proj(xx, yy, zz);
        return new Phaser.Geom.Point(p.x, p.y);
      };
      // de perfil (2D) la x del mundo no proyecta: la cara del bloque es el rectangulo (z, y).
      // Sin esto el ancho sale de x-k.w a x+k.w, que colapsa, y la caja queda en una raya.
      // El orden de las esquinas es el mismo que en 3D (y1/zf, y1/zb, y0/zb, y0/zf), asi que
      // `drawGlyph` no se entera de en que camara esta.
      let cara = this.cam.flat
        ? [P(0, y1, zf), P(0, y1, zb), P(0, y0, zb), P(0, y0, zf)]
        : [P(x - w, y1, zf), P(x + w, y1, zf), P(x + w, y0, zf), P(x - w, y0, zf)];
      // La pared que MATA es un TRIANGULO, no un muro: las esquinas de arriba eran justo lo que
      // tapaba la pista de atras, y la punta se lee como "por aca no" mejor que un rectangulo.
      // La hitbox NO cambia: sigue siendo la caja entera de KINDS y se choca por indice de
      // carril, no por pixel, asi que el carril sigue cerrado de punta a punta.
      const tri = o.kind === "block";
      const mid = (a, b) => new Phaser.Geom.Point((a.x + b.x) / 2, (a.y + b.y) / 2);
      let sil = tri ? [mid(cara[0], cara[1]), cara[2], cara[3]] : cara;
      // caras de arriba: la caja tiene tapa, el triangulo tiene dos aguas hasta la punta
      let tapas = [];
      if (!this.cam.flat) {
        const apF = mid(cara[0], cara[1]), apB = P(x, y1, zb);
        tapas = tri
          ? [[P(x - w, y0, zf), apF, apB, P(x - w, y0, zb)],
            [P(x + w, y0, zf), apF, apB, P(x + w, y0, zb)]]
          : [[cara[0], cara[1], P(x + w, y1, zb), P(x - w, y1, zb)]];
      }
      if (rot) {
        const pv = mid(cara[2], cara[3]);   // pivote: la base, o sea el suelo del carril
        const c = Math.cos(rot), s = Math.sin(rot);
        const gira = (arr) => arr.map((p) => new Phaser.Geom.Point(
          pv.x + (p.x - pv.x) * c - (p.y - pv.y) * s,
          pv.y + (p.x - pv.x) * s + (p.y - pv.y) * c));
        cara = gira(cara); sil = gira(sil); tapas = tapas.map(gira);
      }
      for (const tp of tapas) {
        g.fillStyle(color, 0.55 * aFill);
        g.fillPoints(tp, true);
      }
      // front face
      g.fillStyle(color, 0.9 * aFill);
      g.fillPoints(sil, true);
      // halo en el color puro (el de la cara ya vino lavado). Dos pasadas: una ancha y tenue y
      // otra angosta y fuerte, que es lo que se lee como neon en vez de como borde grueso.
      // Se reporto que la pared no reaccionaba a la musica: el halo iba a 0.22/0.55 de alpha y
      // el contorno era fijo. Ahora el halo pega el doble y el contorno tambien engorda y
      // aclara con el beat, que es lo que se ve de lejos.
      const gl = this.beat * cerca;
      if (gl > 0.05) {
        for (const [wd, al] of [[5 + 26 * gl, 0.35], [2 + 10 * gl, 0.85]]) {
          g.lineStyle(wd, COLORS[o.kind], al * gl * aLine);
          g.strokePoints(sil, true);
        }
      }
      g.lineStyle(2 + 3 * gl, PALETTE.text, (0.35 + 0.5 * gl) * aLine);
      g.strokePoints(sil, true);
      this.drawGlyph(o.kind, cara, aLine * (0.75 + 0.25 * gl));
    }
,
    drawGlyph(kind, cara, alpha) {
      const trazos = GLYPH_UV[kind];
      if (!trazos) return;
      const [tl, tr, br, bl] = cara;
      const d = Math.hypot(br.x - tl.x, br.y - tl.y);
      if (d < 26) return;   // de lejos es una mancha
      const at = (u, v) => ({
        x: (tl.x + (tr.x - tl.x) * u) * (1 - v) + (bl.x + (br.x - bl.x) * u) * v,
        y: (tl.y + (tr.y - tl.y) * u) * (1 - v) + (bl.y + (br.y - bl.y) * u) * v,
      });
      this.g.lineStyle(Math.max(3, d * 0.09), PALETTE.text, 0.95 * alpha);
      for (const t of trazos) {
        for (let i = 1; i < t.length; i++) {
          const a = at(t[i - 1][0], t[i - 1][1]), b = at(t[i][0], t[i][1]);
          this.g.lineBetween(a.x, a.y, b.x, b.y);
        }
      }
    }
,
    drawHood() {
      const g = this.g;
      const p = this.proj(this.x, 0, PLAYER_Z + 260);
      const rw = 34 * p.s * 1.6;
      const aire = Math.min(1, Math.max(0, 1 - this.y / 60));   // saltando se despega y se apaga
      if (aire > 0.02) {
        g.fillStyle(0x000000, 0.3 * aire);
        g.fillEllipse(p.x, p.y, rw, rw * 0.32);
      }
      if (this.beat > 0.05) {
        g.lineStyle(Math.max(1, 3 * this.beat), PALETTE.cyan, 0.5 * this.beat);
        g.strokeEllipse(p.x, p.y, rw * (1.15 + 1 * (1 - this.beat)), rw * 0.34 * (1.15 + 1 * (1 - this.beat)));
      }
    }
,
    drawPlayer() {
      const g = this.g;
      if (!this.cam.body) return this.drawHood();   // en 1a persona la camara ya esta dentro
      // el parpadeo de inmunidad se salta MUERTO: `invuln` se descuenta con dt y con el mundo
      // congelado se queda clavado en el 1.2 del golpe, o sea que floor(1.2*12)=14 es par SIEMPRE
      // y el muneco no se dibujaba en ninguno de los 3 segundos (medido: 6735px de diferencia,
      // bbox 130x199, o sea el muneco entero). Y lo que se pidio es esperar EN EL SITIO.
      if (!this.dead && this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return;
      const sliding = this.sliding > 0 && this.y === 0;
      const air = this.grav * this.y > 0;
      const corre = !air && !sliding && this.dash <= 0;
      // No hay paso que sincronizar: la tabla flota sobre una pista plana. Lo unico que se
      // mueve solo es un flote lento y los brazos, y los dos salen de la cancion.
      const an = ride(this.songT, this.lv?.beat ?? 0.4615);
      // EL BAMBOLEO SALE DE LO QUE HACES, no de ir hacia adelante: cambiar de carril, saltar o
      // comerte una caja. Es un tirón que se apaga solo (seno por exponencial, 0.45s), asi que
      // yendo derecho el muneco esta quieto, que es justo lo que se pedia.
      const dw = this.songT - this.wobT;
      const wob = dw >= 0 && dw < 0.9
        ? Math.sin(dw * 22) * Math.exp(-dw / 0.16) * 0.16 * this.wobDir : 0;
      const bote = corre ? an.hover : 0;
      // amortiguado del aterrizaje: 120ms de rodillas, si no vuelve a correr de golpe
      const land = corre
        ? Phaser.Math.Clamp(1 - (this.songT - this.landT) / 0.12, 0, 1) : 0;
  
      const base = this.proj(this.x, this.y + this.grav * bote * HOVER, PLAYER_Z);
      const s = base.s;
      const bw = 34 * s;         // ancho de referencia para la sombra y el anillo
  
      // Sombra larga: elipses negras pegadas al piso detras del muneco. Es lo unico que le
      // queda en el mundo (hubo una cola de particulas y un halo, los dos se sacaron: en una
      // pantalla que ya esta llena de luz, mas luz encima del muneco lo esconde en vez de
      // marcarlo). Lo que lo ata al suelo es la sombra, no el brillo.
      for (let i = 1; i <= 5; i++) {
        const zz = PLAYER_Z - i * 95;
        if (zz <= this.zn + 4) break;
        const p = this.proj(this.x, 0, zz);
        g.fillStyle(0x000000, 0.26 * (1 - i / 6));
        g.fillEllipse(p.x, p.y, bw * (1.7 + i * 0.5), bw * (0.5 + i * 0.12));
      }
      // La sombra se queda en el piso y encoge con el bote: es lo que dice cuanto despegaste.
      const sh = this.proj(this.x, 0, PLAYER_Z);
      g.fillStyle(0x000000, 0.35 * (1 - 0.25 * bote));
      g.fillEllipse(sh.x, sh.y, bw * 1.6 * (1 - 0.12 * bote), bw * 0.5 * (1 - 0.12 * bote));
      // anillo del beat a los pies: el pulso tambien pasa por el jugador, no solo por el decorado
      if (this.beat > 0.05) {
        g.lineStyle(Math.max(1, 3 * this.beat), PALETTE.cyan, 0.5 * this.beat);
        g.strokeEllipse(sh.x, sh.y, bw * (1.8 + 1.6 * (1 - this.beat)), bw * (0.55 + 0.5 * (1 - this.beat)));
      }
  
      // El cuerpo se dibuja en pantalla, no con `proj`: para colgarlo del techo se gira el
      // canvas sobre los pies en vez de meterle el signo a treinta offsets. El vaiven suma su
      // grado de balanceo: de espaldas eso es lo que se lee de la rotacion de caderas.
      // La tabla APUNTA hacia donde vas: `x` persigue al carril, asi que lo que falta para
      // llegar es la direccion y la fuerza del giro. Va casi todo al `yaw` (la tabla gira en el
      // suelo, que es lo que se lee de espaldas) y solo un resto a la inclinacion de pantalla.
      const gira = Phaser.Math.Clamp((this.laneX[this.lane] - this.x) / 70, -1, 1);
      g.save();
      g.translateCanvas(base.x, base.y);
      g.rotateCanvas(this.roll + gira * 0.10 * this.grav);
      g.translateCanvas(-base.x, -base.y);
  
      // 1 unidad = el alto del muneco, asi que la perspectiva es un solo factor. El aplastado
      // del apoyo y las rodillas del aterrizaje entran en el mapeo, no en la pose.
      const u = PLAYER_H * s;
      const kx = 1 + 0.09 * land, ky = 1 - 0.13 * land;
      const P = (x, y) => ({ x: base.x + x * kx * u, y: base.y - y * ky * u });
      const beat = this.lv?.beat ?? 0.4615;
      // el eq de la mochila late con la musica de verdad: cada barra en su propia subdivision
      // del beat, igual que las del fondo, y el kick las empuja a todas
      const eq = (i) => {
        const sub = 1 + Math.floor(hash(i + 7) * 4);
        const osc = Math.abs(Math.sin(Math.PI * (this.songT / beat) * sub + hash(i) * 6.283));
        return Math.min(1, 0.2 + 0.6 * osc + 0.4 * this.pulse * osc);
      };
      // El truco del salto sale de `hash(cuando saltaste)`, o sea que es el mismo cada vez que
      // rebobinas, y el avance sale de `vy` (JUMP_V al despegar, -JUMP_V al caer): no hay que
      // guardar ni un contador. Es solo dibujo: la hitbox no se entera.
      const tp = air ? Phaser.Math.Clamp((JUMP_V - this.grav * this.vy) / (2 * JUMP_V), 0, 1) : 0;
      // el traje toma el color del compas (como el rig y las formas) y brilla con el beat
      const nb = Math.floor(this.songT / (this.lv?.bar ?? 1.846));
      const neon = {
        col: this.neon[Math.floor(hash(nb + 2.5) * this.neon.length)],
        a: 0.55 + 0.45 * this.beat,
      };
      drawAvatar(g, pose({ arm: an.arm, air, rising: this.grav * this.vy > 0, sliding, land,
        yaw: gira * 0.6, tp, trick: TRICKS[Math.floor(hash(this.jumpT * 7.7) * TRICKS.length)] }),
        P, u, kx, eq, neon, wob);
  
      // burbuja del dash: el muneco va dentro, no se cambia de pose
      if (this.dash > 0) {
        const c = P(0, 0.45);
        for (const [r, w, al] of [[0.44, 10, 0.18], [0.42, 3, 0.5]]) {
          g.lineStyle(w * s, COLORS.orb, al);
          g.strokeCircle(c.x, c.y, r * u);
        }
      }
      g.restore();
    }
,
};

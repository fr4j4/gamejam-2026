// Mixin de RunnerScene: metodos extraidos de AIRunnerGame.js (sin cambios).
// Se aplica con Object.assign(RunnerScene.prototype, ...) en AIRunnerGame.js.
import * as Phaser from "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js";
import { PALETTE } from "./theme.js";
import { PLAYER_Z, SPAWN_Z } from "./physics.js";
import {
  LEVELS, layerAt, mix, rowAt, sectorOfRow, CHASE, markWin, gridAt,
} from "./music.js";
import { bolt, forks, pyras, pyraFaces, arcDir, outrun } from "./fx.js";
import { drawReactor as paintReactor, CX as RCX, CY as RCY } from "./reactor.js";
import { ACID, ARC_N, BEAM_A, BEAM_PAIR, BEAM_PD, BEAM_PW, BEAM_T, BEAM_Z0, BEAM_Z1, BURST_HI, BURST_LO, BURST_R, BURST_SH, BURST_T, FIGS, HAT_A, KILL, LIGHT_OUT, LIGHT_R, LIGHT_SHP, MAX_ACID, MESH_AMP, MESH_CROSS, MESH_DZ, MESH_FAR, MESH_FLAT_N, MESH_FLAT_SKEW, MESH_FLAT_TOP, MESH_FLAT_Y, MESH_FOG, MESH_GAP, MESH_HI, MESH_KD, MESH_KR, MESH_KX, MESH_KZ, MESH_LO, MESH_NX, MESH_PX, MESH_RIP, MESH_RIP_Z, PIN_DIRS, PYRA_A, PYRA_DZ, PYRA_NX, PYRA_THR, REACTOR_A, REACTOR_GROW, REACTOR_NEAR, REACTOR_NEAR_Y, REACTOR_R, REACTOR_SNAP, REACTOR_SWAY, REACTOR_UP, REACTOR_UP_FLAT, RIG_CUT, RIG_DIM, RIG_FAN, RIG_SPOT, RINGS_K, RINGS_N, RINGS_SQ, RINGS_STEP, SKY_COLS, SKY_DRIFT_N, TAG_COLORS, hash } from "./config.js";
import { meshTone, reacAt } from "./pure.js";

export const decor = {
    drawRig(w, h, pulse) {
      const g = this.g, rave = this.rave;
      if (rave <= 0.02) return;   // break: luces apagadas
      const bar = (this.lv?.beat ?? 0.4615) * 4;
      const ph = (this.songT / bar) * Math.PI * 2;
      // EL RIG POR ENCIMA DE TODO (`rigOver`, ver el bloque de dibujo): dibujado sobre el mundo
      // y no solo en el cielo, con el mismo alpha tapaba la pista, asi que ahi va a `RIG_DIM`.
      // Sin el dial vale 1 y el nivel 1 no se entera.
      const dim = this.rigOver ? RIG_DIM : 1;
      // ...Y NO BAJA DE LA MITAD DE LA PANTALLA (`RIG_CUT`). Bajarle el alpha no alcanzo: se
      // reporto que abajo tapa al jugador, y medido es cierto, el 35% del largo de trazo del rig
      // cae por debajo de la mitad (mode 0 47.6%, mode 1 25.2%, mode 2 34.5%, con el 18.6% de sus
      // vigas ENTERAS abajo), los focos cruzan la mitad en el 97% de los frames y llegan a y=531
      // de 582, y el muneco de pie ocupa y 405..498. Sin el dial `yc` es el borde de abajo, o sea
      // que la expresion es la de siempre y el nivel 1 no se entera.
      const yc = this.rigOver ? h * RIG_CUT : h;
      for (let i = 0; i < 3; i++) {   // focos moviles del fondo
        const s = 0.6 + 0.5 * hash(i);
        const cx = w * (0.5 + 0.62 * Math.sin(ph * 0.31 * s + i * 2.1));
        const cy = h * (0.16 + 0.24 * Math.sin(ph * 0.19 * s + i));
        // EL COLOR DEL RIG LO DECLARA EL NIVEL (`neon.rig`) y no es `neon.fam`: los tres focos y
        // el abanico traian dos listas hardcodeadas y distintas entre si (violeta/cyan/rosa los
        // focos, cyan/violeta/rosa/accentSoft el abanico), o sea que `fam` no es un respaldo
        // exacto de ninguna de las dos. El respaldo es lo que el renderer hacia antes de existir
        // el dial, que es lo que deja el nivel 1 en 0 px; el 2 declara su familia cyan.
        const col = (this.lv?.neon?.rig ?? RIG_SPOT)[i % (this.lv?.neon?.rig ?? RIG_SPOT).length];
        for (let k = 3; k >= 1; k--) {
          g.fillStyle(col, rave * dim * (0.06 + 0.08 * pulse) / k);
          // los focos no se arreglan acortandolos: son discos. Un disco cortado por una recta es
          // un SEGMENTO CIRCULAR, y eso es el mismo path que Phaser ya sabe cerrar con la cuerda.
          const rr = h * 0.17 * k * s;
          if (!this.rigOver || cy + rr <= yc) g.fillCircle(cx, cy, rr);
          else if (cy - rr < yc) {
            const f = Math.asin((yc - cy) / rr);   // |(yc-cy)/rr| < 1: lo garantizan los dos ifs
            g.beginPath(); g.arc(cx, cy, rr, Math.PI - f, Math.PI * 2 + f); g.fillPath();
          }                                        // entero por debajo del corte: no se dibuja
        }
      }
      const rig = this.lv?.neon?.rig ?? RIG_FAN;
      const nb = Math.floor(this.songT / bar);
      const col = rig[Math.floor(hash(nb) * rig.length)];
      const a = rave * (0.5 + 0.5 * pulse) * dim;
      const abre = 0.72 + 0.42 * Math.sin(ph * 0.5);   // el abanico respira cada dos compases
      // EL ABANICO TIENE VARIANTES Y CUAL VA LO DICE EL COMPAS. Cuelgan de `rigOver`, o sea que
      // un nivel que no lo declara (el 1) no puede entrar aca ni por hash: sigue siendo el mismo
      // codigo de siempre, que es lo que lo deja en 0 px.
      const mode = this.rigOver ? Math.floor(hash(nb * 5 + 3) * 3) : 0;
      if (mode === 0) for (const s of [-1, 1]) {
        const ex = w / 2 + s * w * 0.56, ey = -h * 0.05;   // emisor fuera de cuadro, arriba
        for (let i = 0; i < 11; i++) {
          // angulo desde la vertical hacia adentro: apertura que respira + barrido por viga
          const ang = 0.16 + 1.3 * abre * (i / 10) + 0.22 * Math.sin(ph * 2 + s * 1.6 + i * 0.5);
          const dx = -s * Math.sin(ang), dy = Math.cos(ang);
          // EL CORTE VA DESPAREJO viga por viga (hasta un 6% del alto, por hash y no random): con
          // el corte seco las 11 vigas mueren en la MISMA y (medido, hasta 22 en y=291) y eso se
          // lee como una raya horizontal dibujada a proposito. Medido a h=582, los cortes quedan
          // repartidos en y 258..289, todos por encima de la mitad.
          const yi = yc - (this.rigOver ? h * 0.06 * hash(i + 13) : 0);
          const x1 = ex + dx * (yi - ey) / dy, br = a * (0.45 + 0.55 * hash(i + 7));
          g.lineStyle(12 + 22 * pulse, col, br * 0.16);   // halo
          g.lineBetween(ex, ey, x1, yi);
          g.lineStyle(2 + 3 * pulse, col, Math.min(1, br * 1.5));   // nucleo
          g.lineBetween(ex, ey, x1, yi);
        }
      }
      // ABANICO HORIZONTAL (las fotos de referencia): los emisores se van a los COSTADOS, fuera
      // de cuadro, y las vigas CRUZAN la pantalla de lado a lado en vez de caer del cielo. El
      // modo 2 pone dos alturas por lado, o sea que los dos abanicos se cruzan en el medio.
      // El segundo emisor del mode 2 estaba en 0.66, o sea POR DEBAJO del corte: recortando y ya,
      // perdia el 52% de su largo y el 37% de sus vigas enteras y "los cuatro abanicos cruzandose"
      // quedaba en tres. Se espeja al otro lado del corte (0.44). Medido, sobrevive: 0.26 -> 83%,
      // 0.42 -> 76%, 0.44 -> 74% del largo, y CERO vigas tiradas en los tres.
      else for (const s of [-1, 1]) for (const yy of (mode === 1 ? [0.42] : [0.26, 0.44])) {
        const ex = s < 0 ? -w * 0.06 : w * 1.06, ey = h * yy, L = w * 1.25;
        for (let i = 0; i < 11; i++) {
          const ang = -0.55 + 1.15 * abre * (i / 10) + 0.22 * Math.sin(ph * 2 + s * 1.6 + i * 0.5);
          const dx = -s * Math.cos(ang), dy = Math.sin(ang);
          const br = a * (0.45 + 0.55 * hash(i + 7));
          // aca el extremo es parametrico y `dy` cambia de signo, asi que el recorte es el general
          // (una sola cuenta por viga, reusada por el halo y el nucleo).
          let bx = ex + dx * L, by = ey + dy * L;
          const yi = yc - (this.rigOver ? h * 0.06 * hash(i + 13) : 0);
          if (ey > yi && by > yi) continue;              // viga entera debajo del corte
          if (by > yi) { const tc = (yi - ey) / (by - ey); bx = ex + (bx - ex) * tc; by = yi; }
          g.lineStyle(12 + 22 * pulse, col, br * 0.16);
          g.lineBetween(ex, ey, bx, by);
          g.lineStyle(2 + 3 * pulse, col, Math.min(1, br * 1.5));
          g.lineBetween(ex, ey, bx, by);
        }
      }
    }
,
    meshWave(x, z, t, rip = 0, mode = 0, x0) {
      if (mode === 2) return outrun(x, z, x0);
      if (mode) {
        return (Math.sin(x * MESH_KX * 0.7 + t * 1.65)
          + 0.70 * Math.sin(z * MESH_KZ * 2 + t * 1.70)
          + 0.45 * Math.sin((x - z) * MESH_KD * 3 - t * 0.90)
          + rip * Math.sin(x * MESH_KR - t * 1.9)) / (2.15 + rip);
      }
      return (Math.sin(x * MESH_KX + t * 1.10)
        + 0.70 * Math.sin(z * MESH_KZ - t * 0.85)
        + 0.45 * Math.sin((x + z) * MESH_KD + t * 0.45)
        + rip * Math.sin(x * MESH_KR - t * 1.9)) / (2.15 + rip);
    }
,
    meshTone(v, f) {
      return meshTone(v, f, this.lv?.mesh?.lo ?? MESH_LO, this.lv?.mesh?.hi ?? MESH_HI, this.fog);
    }
,
    drawMesh() {
      if (this.cam.flat) return this.drawMeshFlat();
      const g = this.g, t = this.songT;
      // LA OLA SUBE CON EL METRONOMO, no con las cues. Con `this.beat` a secas la ola quedaba
      // CONGELADA el 59% del nivel (medido: `pulse` <= 0.05 en 42.7s de 72.31, y `beat` = 0 el
      // 100% del outro), o sea que el buildup, el drop2 y el outro daban la misma imagen.
      // `this.lat` es el metronomo de la grilla con la senal de acento encima (ver `gridAt`).
      // 0.40 + 0.70 y no 0.45 + 0.55: con el metronomo topado (`metro` = 0.45) `lat` medio pasa
      // a 0.150 en el outro y 0.460 en el drop2, y con los coeficientes viejos esos dos extremos
      // daban amplitud x0.532 contra x0.703, o sea **un 32%**. Con 0.40 + 0.70 son x0.505 contra
      // **x0.722 (+43%)**, y ademas baja la media, que es lo que devuelve la pista por delante de
      // la malla (ver el alpha).
      const amp = MESH_AMP * (0.40 + 0.70 * this.lat);
      // EL TIRON de lo que HACES (cambiar de carril, saltar, comerte una caja): la misma
      // envolvente que el bamboleo del muneco (seno por exponencial, ~0.45s), asi que la cresta
      // de al lado del jugador se levanta y se apaga sola. Los DOS lados a la vez: `wobDir` es
      // direccion en el cambio de carril pero magnitud en el salto (0.7) y en el golpe (2.2),
      // o sea que su signo no dice un lado y usarlo mentiria en dos de los tres casos.
      const dw = t - this.wobT;
      const tir = dw >= 0 && dw < 0.9
        ? Math.sin(dw * 22) * Math.exp(-dw / 0.16) * Math.min(1, Math.abs(this.wobDir)) : 0;
      const off = (((t * this.speed) % MESH_DZ) + MESH_DZ) % MESH_DZ;
      for (const s of [-1, 1]) {
        let prev = null, prevH = null;
        // la fila de la reticula GRUESA (una de cada `PYRA_DZ`) y su contador
        let base = null, baseH = null, ri = 0;
        // de `MESH_FAR` para aca y no de `SPAWN_Z`: mas alla de ahi la niebla propia ya la dejo
        // por debajo de alpha 0.05 (medido), o sea que serian filas invisibles y pagadas.
        for (let z = MESH_FAR; z > this.zn; z -= MESH_DZ) {
          const zz = Math.max(z - off, this.zn + 4);
          if (zz <= this.zn + 4) { prev = null; base = null; ri = 0; continue; }
          const f = Phaser.Math.Clamp((zz - PLAYER_Z) / MESH_FOG, 0, 1) ** 1.4;
          // el alpha va por DEBAJO del de las bandas del suelo (0.28 + 0.4*lat) a proposito:
          // el suelo es la pista y la malla es el fondo, la jerarquia estaba invertida.
          // Salia de `this.pulse`, que en este nivel vale 0 el 0% del buildup pero el **100% del
          // drop2 y del outro** (42.7s de 72.31): el alpha se quedaba clavado en el piso mas de
          // media cancion y la malla se veia igual en las tres secciones. Ahora sale del
          // metronomo (`this.lat`), que existe siempre, y la senal solo lo levanta.
          // Piso 0.15 y techo 0.45, contra las bandas del suelo (0.28 -> 0.68). El techo esta
          // topado por MEDICION y no a ojo: con 0.60 la malla marcaba p95 de luma 92/114/82 en
          // buildup/drop2/outro contra 79/84/76 del suelo, o sea que le pasaba a la pista en las
          // tres.
          // El PISO bajo de 0.19 a 0.15 y el recorrido subio de 0.25 a 0.30 por lo mismo que la
          // amplitud: es lo que separa el drop2 del outro (a 0.294 contra 0.195, o sea +51%
          // contra el +22% de antes) y ademas baja la MEDIA de la malla, que era lo que le
          // ganaba al suelo (medido: en el quieto 36.0 de luma media contra 34.3 del suelo, y en
          // el break 19.3 contra 15.7). La pista es lo que hay que leer.
          // ...y en 1a PERSONA se apaga ademas lo que tenes ENCIMA, con el mismo `pasa(z)` que
          // usan las cajas: la camara esta dentro de la pista, o sea que la fila de malla mas
          // cercana (a 4 del plano cercano, s = fov/94 = 7.3) proyecta a pantalla entera y las
          // 28 columnas convergen en un abanico de lineas que se derrama SOBRE el plano del
          // suelo. Es geometria correcta y se lee como un bug, igual que la caja del carril de
          // al lado. AL CUBO y no crudo: `pasa` es una rampa lineal hasta 500, y a 94 (que es
          // donde cae la fila mas cercana) todavia vale 0.19, o sea que el abanico seguia
          // dibujado, solo que mas tenue (medido: 6718 -> 5344px, y en la captura se sigue
          // leyendo igual). Al cubo esa fila da 0.007 y el corte de `a < 0.02` que ya existe la
          // tira entera, mientras que a 400 todavia vale 0.51: se apaga sin saltar de un frame
          // al otro. Es el mismo truco del quake y del flash del drop (`pulse³`).
          // Medido en el drop2 de esa camara: la malla por debajo de y=340 (donde ya no hay
          // fondo, es el plano del suelo que se juega) pasa de **6718px = 1.73% de esa banda a
          // 2549px = 0.66%**, la malla entera de 6.53% a 6.00% del cuadro, y lo mas bajo que
          // llega deja de ser y=557 (por debajo del muneco) para ser y=454: lo que queda es la
          // malla LEJANA vista de frente, no el abanico encima tuyo. En 3a persona y de perfil
          // `pasa` devuelve 1 y no cambia un pixel
          // (`cam.body`), asi que el nivel 1 tampoco se entera.
          const a = (0.15 + 0.30 * this.lat) * this.wave.a * (1 - f) * this.pasa(zz) ** 3;
          if (a < 0.02) { prev = null; base = null; ri = 0; continue; }
          const alza = tir * 150 * Phaser.Math.Clamp(1 - Math.abs(zz - PLAYER_Z) / 700, 0, 1);
          // columnas LINEALES: `proj` es lineal en x (x * fov/z), o sea que parejas en el mundo
          // son parejas en PANTALLA. El `u^1.7` de antes las apretaba contra la pista y dejaba
          // 17px entre las dos internas contra 107 entre las dos externas.
          // El borde de ADENTRO sale de la fila (`MESH_GAP` es pixeles, ver arriba), asi que se
          // recalcula por fila: es lo que devuelve la malla al campo cercano.
          // Y el de AFUERA es **siempre el borde de la PANTALLA**. Estuvo topado a 1400 del
          // mundo, y ese tope no se ve como un tope: se ve como DOS CUNAS NEGRAS en las esquinas
          // de arriba, entre el resplandor del horizonte y la malla. Es que el plano del suelo
          // llega al borde de cuadro a cualquier z y la malla moria en 1400: medido en el drop2,
          // a **y=312** (20px por debajo de la punta de la pista) la malla iba de x=279 a x=999,
          // o sea **527px = el 42% de la fila** en negro repartido entre las dos esquinas, y a
          // y=332 eran 328px (26%).
          // El tope estaba por NYQUIST, no por gusto: con las columnas fijas en 28, llevar el
          // borde a la pantalla sube el paso a 120 del mundo a z=4000 contra un periodo de 262,
          // o sea 2.2 muestras, y la ola lejana se aliasa. Se arregla donde estaba el problema:
          // el numero de columnas sale del PASO EN PANTALLA (`MESH_PX`) y no es fijo. Como
          // `proj` es lineal en x, un paso constante en pantalla es un Nyquist constante en
          // pantalla, que es donde se ve el alias. Medido: la fila cercana (z=700) se queda en
          // las 28 de siempre (282px de ancho en pantalla) y las de lejos, que ahora cruzan la
          // pantalla entera (556px), piden **35**; el periodo de la ola en pantalla nunca baja
          // de 3.0 muestras y de las 4.4 a z=2993, que es donde estaba la cuna.
          const sz = this.proj(0, 0, zz).s;
          const xi = this.edge + MESH_GAP / sz;
          const xo = (this.scale.width / 2 + 80) / sz;
          const nx = Math.max(MESH_NX, Math.round(((xo - xi) * sz) / MESH_PX) + 1);
          const row = [], hs = [];
          let med = 0;
          // el rizo del campo cercano (ver `MESH_KR`): entero encima del jugador y cero a 1000
          // de ahi. Es por FILA, o sea una resta por fila y no una por columna.
          const rip = MESH_RIP * Phaser.Math.Clamp(1 - (zz - PLAYER_Z) / MESH_RIP_Z, 0, 1);
          for (let k = 0; k < nx; k++) {
            const x = xi + ((xo - xi) * k) / (nx - 1);
            const v = this.meshWave(x, zz, t, rip, this.wave.mode, xi);
            hs.push(v);
            med += v / nx;
            const p = this.proj(s * x, (v * amp + alza) * this.grav, zz);
            row.push(new Phaser.Geom.Point(p.x, p.y));
          }
          // EL COLOR ES POR SEGMENTO Y CON SIGNO. Antes salia de un `max` POR FILA y se aplicaba
          // a la polilinea entera, o sea que las 15 filas salian del mismo tono y `MESH_HI` no
          // aparecia nunca: la ola no tenia crestas encendidas ni valles oscuros, era plana.
          // Con `(v+1)/2` el valle llega de verdad a `MESH_LO` y la cresta a `MESH_HI`.
          // ...y con GAMMA, porque la mezcla lineal nunca llegaba a `MESH_HI`: `v` es la suma de
          // cuatro senos, o sea que su distribucion se apila en el medio y el 1.0 solo sale
          // cuando los cuatro coinciden. Medido en pantalla, con la mezcla lineal la malla
          // llegaba a p99 de luma **55.6** y solo 222px del canvas (0.027%) pasaban de 60: era
          // cyan apagado, no neon. Con `u^0.55` la mitad de arriba de la ola ya vive en el
          // color de cresta y el valle sigue cayendo a `MESH_LO`.
          // Los dos colores los puede declarar el NIVEL (`mesh` en LEVELS): la misma malla es agua
          // cyan en el nivel 2 y una cordillera dorada en el 1. El respaldo son las constantes de
          // arriba, o sea lo de siempre.
          const tono = (v) => this.meshTone(v, f);
          // halo ancho: UNA pasada de toda la fila con el tono medio (es difuso, no necesita
          // resolucion de color) y el nucleo fino va segmento a segmento. Con las dos pasadas
          // por segmento el coste se duplicaba sin que se note nada.
          g.lineStyle(3.5, tono(med), a * 0.3);
          g.strokePoints(row, false);
          // el ALPHA tambien sale de la altura, no solo el color: la cresta se enciende y el
          // valle se apaga, que es lo que separa una ola de una cuadricula pintada de dos tonos.
          // La cresta llega a 1.35 veces el alpha de la fila y el valle se queda en 0.5: antes
          // era 0.55..1.30 y con eso la diferencia entre cresta y valle era de 2.4 a 1, poca
          // para que la ola tenga relieve de lejos. Ahora es de 2.7 a 1. El techo de 1.5 que se
          // probo primero daba mas relieve pero subia el p95 de la malla por encima del suelo.
          const alto = (v) => Math.min(1, a * (0.5 + 0.85 * ((v + 1) / 2)));
          for (let k = 1; k < row.length; k++) {
            g.lineStyle(1.2, tono((hs[k] + hs[k - 1]) / 2), alto((hs[k] + hs[k - 1]) / 2));
            g.lineBetween(row[k - 1].x, row[k - 1].y, row[k].x, row[k].y);
          }
          // las de CRUCE, una de cada `MESH_CROSS`: son las que hacen la cuadricula, y la
          // referencia es un mesh de crestas largas. Con todas vuelve la reja.
          // Hasta la MENOR de las dos filas: desde que `nx` sale del paso en pantalla, dos filas
          // vecinas no tienen por que tener las mismas columnas.
          if (prev) for (let k = 0, n = Math.min(row.length, prev.length); k < n; k += MESH_CROSS) {
            g.lineStyle(1.2, tono((hs[k] + prevH[k]) / 2), alto((hs[k] + prevH[k]) / 2) * 0.7);
            g.lineBetween(prev[k].x, prev[k].y, row[k].x, row[k].y);
          }
          // LAS CRESTAS SE FACETAN (`wave[sec].shape` = `"pyra"`): se reporto que la ola digital
          // "sigue sin estar" y que en el buildup se deje como esta pero que en el drop use
          // piramides. No es una capa nueva ni otra geometria: es EL MISMO campo, rellenando el
          // cuadro que ya esta calculado entre la fila de atras y esta, partido en DOS TRIANGULOS
          // de distinto gris. Ese es el idiom de `pyraFaces` (dos caras compartiendo una arista,
          // lo que las hace leer como volumen es el gris y no el contorno), aplicado al terreno
          // en vez de a una esquirla, y por eso no hace falta ni un punto nuevo: la malla ya tenia
          // los cuatro.
          //
          // Solo por encima de `PYRA_THR`, y eso es lo que la hace barata y lo que la hace leerse:
          // rellenando cada cuadro la malla dejaria de ser malla (seria un plano opaco); en las
          // crestas quedan los picos macizos con los valles todavia de alambre, que es un terreno
          // low-poly y no una lamina.
          // Mismo idiom que `pyraFaces` (dos caras que comparten una arista y se leen como
          // volumen por el TONO y no por el contorno), pero sobre la reticula gruesa: la faceta
          // va de `base` (PYRA_DZ filas atras) a `row` y de `k - PYRA_NX` a `k`. La altura que
          // manda es la MAYOR de las cuatro esquinas: en un cuadro de 5x3 celdas la cresta cae
          // adentro, y pedirsela al centro se la comeria. El `zz > PLAYER_Z` es porque las filas
          // de delante del jugador proyectan invertidas (xo < xi) y darian cuadros degenerados;
          // medido, ese campo cercano aporta el 0.07% de la tinta, o sea que no se pierde nada.
          // Las dos caras se separan en COLOR y no solo en alpha: la de sombra va al tono del
          // VALLE de la misma rampa (`tono(-1)` = `MESH_LO` con su niebla). Con las dos del mismo
          // tono y solo el alpha distinto, sobre un cielo negro suman el mismo color y el pico se
          // lee plano, que es lo que `pyraFaces` resuelve con el gris.
          if (this.wave.shape === "pyra" && base && zz > PLAYER_Z) {
            const np = Math.min(row.length, base.length), bajo = tono(-1);
            for (let k = PYRA_NX; k < np; k += PYRA_NX) {
              const j = k - PYRA_NX;
              const hv = Math.max(hs[k], hs[j], baseH[k], baseH[j]);
              if (hv < PYRA_THR) continue;
              const al = alto(hv) * PYRA_A;
              g.fillStyle(tono(hv), al);
              g.fillPoints([base[j], base[k], row[k]], true);
              g.fillStyle(bajo, al * 0.42);
              g.fillPoints([base[j], row[k], row[j]], true);
            }
          }
          prev = row;
          prevH = hs;
          // la reticula gruesa avanza una de cada `PYRA_DZ` filas
          if (ri % PYRA_DZ === 0) { base = row; baseH = hs; }
          ri++;
        }
      }
    }
,
    drawMeshFlat() {
      const g = this.g, t = this.songT, w = this.scale.width;
      const amp = MESH_AMP * (0.40 + 0.70 * this.lat);
      const paso = MESH_DZ / 2;   // en z hay que muestrear el DOBLE: z es el eje de la pantalla
      // solo el tramo de z que cae DENTRO del cuadro: de perfil la escala es fija (fov = h/1000)
      // y la pantalla es una ventana en z, asi que barrer hasta SPAWN_Z era pagar 4/5 de las
      // muestras fuera de cuadro.
      const zA = PLAYER_Z - (w * 0.2) / this.fov - paso, zB = PLAYER_Z + (w * 0.8) / this.fov + paso;
      // 0 dentro del reactor, 1 fuera de el mas 26px de borde blando. **Solo si el nivel tiene
      // reactor**: sin el, `reacAt` igual devuelve un sitio y un radio (es geometria de pantalla,
      // no mira el `decor`) y la malla del nivel 1 saldria con un agujero de ~198px donde no hay
      // nada que tapar.
      const re = this.reacAt(w, this.scale.height);
      const tapa = this.dec("reactor")
        ? (p) => Phaser.Math.Clamp((Math.hypot(p.x - re.x, p.y - re.y) - re.r) / 26, 0, 1)
        : () => 1;
      let prev = null, prevH = null;
      for (let i = 0; i < MESH_FLAT_N; i++) {
        const d = i / (MESH_FLAT_N - 1);
        const y0 = MESH_FLAT_Y + (MESH_FLAT_TOP - MESH_FLAT_Y) * d ** 0.75;
        const k = 1 - 0.65 * d;                       // la ola se achica con la distancia
        const x0 = this.edge + MESH_GAP + i * 210;    // otra franja de la MISMA agua
        const a = (0.15 + 0.30 * this.lat) * (1 - 0.55 * d);
        const row = [], hs = [];
        for (let z = zA; z <= zB; z += paso) {
          // el corte va SESGADO (ver `MESH_FLAT_SKEW`): a x fija las 10 franjas salen iguales
          // De perfil el `mode` va SOLO para el outrun: el 1 (la ola del drop del nivel 2) esta
          // medido de frente y aca movia sus pixeles de la camara de lado sin que nadie lo pidiera.
          const v = this.meshWave(x0 + (z - PLAYER_Z) * MESH_FLAT_SKEW, z, t, 0, this.wave.mode === 2 ? 2 : 0);
          hs.push(v);
          const p = this.proj(0, (v * amp * k + y0) * this.grav, z);
          row.push(new Phaser.Geom.Point(p.x, p.y));
        }
        // copia #2 de la rampa de color (aca sin la niebla: de perfil no hay z que se aleje).
        // El nivel manda igual que en `drawMesh`, o si no la camara de lado se quedaba en cyan.
        const tono = (v) => this.meshTone(v, 0);
        const alto = (v, p) => Math.min(1, a * (0.5 + 0.85 * ((v + 1) / 2))) * tapa(p);
        for (let n = 1; n < row.length; n++) {
          const v = (hs[n] + hs[n - 1]) / 2;
          g.lineStyle(1.2, tono(v), alto(v, row[n]));
          g.lineBetween(row[n - 1].x, row[n - 1].y, row[n].x, row[n].y);
        }
        if (prev) for (let n = 0; n < row.length; n += MESH_CROSS) {
          const v = (hs[n] + prevH[n]) / 2;
          g.lineStyle(1.2, tono(v), alto(v, row[n]) * 0.7);
          g.lineBetween(prev[n].x, prev[n].y, row[n].x, row[n].y);
        }
        prev = row;
        prevH = hs;
      }
    }
,
    drawSky(w, h) {
      const s = this.lv?.sky;
      if (!s) return;
      const g = this.g;
      const dir = this.camY >= 0 ? 1 : -1;   // hacia donde queda el suelo
      const m = this.skyM, u = this.secU ?? 0, L = this.lat ?? 0, K = this.kik ?? 0;
      let upk = 1, am = 1, pw = 2, cols = 1;
      if (m === "swell") { pw = 2 - 0.7 * L; upk = 0.88 + 0.24 * L; }
      else if (m === "duck") { am = 1 - 0.75 * K ** 2; upk = 1 - 0.35 * K; }
      else if (m === "shut") { upk = 1 - u; am = 1 + 0.6 * u; }
      else if (m === "drift") { cols = SKY_COLS; }
      for (const [alto, lado] of [[s.up, -dir], [s.down, dir]]) {
        // `n` sale del alto SIN modular: si el numero de franjas cambiara con el latido, el
        // redondeo haria parpadear las juntas. Lo que se modula es el grosor de cada una.
        const n = Math.max(2, Math.round((h * alto) / 8));
        const th = (h * alto * upk) / n;
        for (let i = 0; i < n; i++) {
          // al cuadrado: pegado al horizonte manda el color y a media altura ya casi no esta.
          // Lineal deja una franja de color plano que se lee como una banda, no como aire.
          const al = s.a * am * (1 - i / n) ** pw;
          // los bordes van REDONDEADOS y las franjas se tocan exactamente: con un `+1` de
          // solape (lo primero que se probo) cada junta suma dos alphas y salen 24 rayas
          // horizontales cruzando el cielo, que es justo lo que se venia a arreglar.
          const a = Math.round(this.horizon + lado * i * th);
          const b = Math.round(this.horizon + lado * (i + 1) * th);
          // ...y `drift` parte SOLO las franjas pegadas al horizonte (las 8 primeras): mas
          // arriba el alpha ya cayo por debajo de lo que se ve y partirlas seria coste sin
          // imagen. La onda da UNA vuelta por compas y va en el mundo de la columna, no en el
          // tiempo suelto: rebobinar la rebobina.
          if (cols > 1 && i < SKY_DRIFT_N) {
            const cw = (w + 120) / cols;
            for (let k = 0; k < cols; k++) {
              const cu = (k + 0.5) / cols;
              const on = 0.55 + 0.45 * Math.sin(Math.PI * 2 * (1.5 * cu - this.songT / (this.lv?.bar ?? 1.846)));
              g.fillStyle(s.col, al * on);
              g.fillRect(-60 + k * cw, Math.min(a, b), cw + 1, Math.abs(b - a));
            }
            continue;
          }
          g.fillStyle(s.col, al);
          g.fillRect(-60, Math.min(a, b), w + 120, Math.abs(b - a));
        }
      }
    }
,
    drawFar(col) {
      if (!this.lv?.sky || this.cam.flat) return;
      const g = this.g, bw = this.edge + 35;
      // el mismo color y el mismo latido que una banda del suelo normal, para que la junta con
      // la ultima banda no se vea
      let z = SPAWN_Z;
      for (let i = 0; i < 7; i++) {
        const z1 = z * 1.9;
        // LA CUNA SE DISUELVE, no es una punta pintada. Se reporto que "el final de la pista se
        // ve siempre asi", y es que la cuna salia al 0.8 del alpha de una banda cayendo 0.68 por
        // tramo, o sea una punta MACIZA y mas plana que la pista rayada de aca (las bandas de
        // cerca alternan medio beat encendido y medio apagado; la cuna no alterna nada).
        // Medido en la banda de la cuna (x 573-673, y 210-260 de canvas, drop2 a t=30.9): luma
        // media **43.89 -> 38.66** y p95 **64 -> 59**, con la banda de pista de justo debajo
        // clavada en 62.39 / 133, o sea que la cuna pasa de 0.70 a **0.62** de la luma de la
        // pista de verdad y deja de competir con ella. Se probo ademas llevar el color al del
        // cielo tramo a tramo y se saco: 38.66 -> 38.58, o sea nada.
        g.fillStyle(mix(PALETTE.surfaceLight, col, 0.32 + 0.35 * this.lat),
          (0.28 + 0.4 * this.lat) * 0.42 * 0.52 ** i);
        g.fillPoints([[-bw, z], [bw, z], [bw, z1], [-bw, z1]].map(([x, zz]) => {
          const p = this.proj(x, 0, zz);
          return new Phaser.Geom.Point(p.x, p.y);
        }), true);
        z = z1;
      }
    }
,
    reacAt(w, h) {
      return reacAt(w, h, {
        bar: this.lv?.bar, songT: this.songT, hype: this.hype, lat: this.lat,
        snap: this.snap, flat: this.cam.flat, proj: this.proj,
      });
    }
,
    drawReactor(w, h) {
      const { k, x: cx, y: cy } = this.reacAt(w, h);
      const P = (x, y) => ({ x: cx + (x - RCX) * k, y: cy + (y - RCY) * k });
      // gira LENTISIMO: una vuelta cada 16 compases (28.0s a 137bpm). Como las tres alas estan
      // a 120 grados, el ciclo aparente es un tercio de eso (9.3s).
      // gira LENTISIMO en reposo (una vuelta cada 16 compases) pero la CRECIENTE lo acelera x3
      // (una cada 5.3, o sea 9.3s a 137bpm) y encima el latido lo tironea 0.12 rad: quieto se
      // lee como un logo, y el sitio donde se lo mira es justo el drop, donde `hype` vale 1.
      // ...y encima el TIRON de los tramos `spin` (ver `draw`), que es una vuelta entera con
      // ease in/out en dos sitios marcados del drop2, uno para cada lado.
      const spin = (this.songT / ((this.lv?.bar ?? 1.846) * 16)) * Math.PI * 2 * (1 + 2 * (this.hype ?? 0))
        + 0.12 * (this.lat ?? 0) + (this.spin ?? 0);
      // las tres trazas salen del FFT REAL del audio que esta sonando, igual que el modo
      // `spectro` del eq. Es lo unico del render que NO es funcion de songT: en pausa el
      // analizador da todo ceros y `wave()` devuelve la linea base, o sea que la pantalla del
      // osciloscopio queda plana en vez de desaparecer o reventar.
      // el alpha va DENTRO de `drawReactor` (opcion `alpha`) y no como un dim global del
      // Graphics: ahi cada pieza puede bajar lo suyo (el chasis se apaga mas que las pantallas
      // y el nucleo), que es lo que un multiplicador unico no puede hacer.
      // ...y en el FOGONAZO va a 1, o sea sin dim: en alpha=1 la curva `DIM` es la identidad
      // (chasis 0.69 -> 1, fondo 0.75 -> 1, rejilla 0.80 -> 1), asi que es el unico frame del
      // nivel donde el jefe se ve entero y no atenuado como fondo. Es la mitad del "ultra
      // visible" que se pidio; la otra mitad es el tamano (`REACTOR_SNAP`).
      paintReactor(this.g, P, {
        t: this.songT, beat: this.lat, pulse: this.pulse, spin,
        alpha: this.snap > 0.01 ? 1 : REACTOR_A,
        fft: this.tp?.spectrum() ?? null, bt: this.bt,
      });
    }
,
    drawPins() {
      const rave = this.rave;
      if (rave <= 0.02 || this.cam.flat) return;
      const g = this.g, t = this.songT;
      const beat = this.lv?.beat ?? 0.4615, bar = beat * 4;
      const P = (x, y, z) => { const p = this.proj(x, y, z); return new Phaser.Geom.Point(p.x, p.y); };
      const paso = beat * 2 * this.speed;   // un tubo cada dos beats
      const off = (((t * this.speed) % paso) + paso) % paso;
      const nb = Math.floor(t / bar);
      const d = PIN_DIRS[Math.floor(hash(nb) * PIN_DIRS.length)];
      const gir = 0.3 * Math.sin((t / bar) * Math.PI * 2);   // barre dentro del compas
      const col = this.neon[Math.floor(hash(nb + 0.5) * this.neon.length)];
      for (let z = SPAWN_Z; z > this.zn; z -= paso) {
        const zz = Math.max(z - off, this.zn + 4);
        if (zz <= this.zn + 4) continue;
        // se apaga de lejos Y de muy cerca: el cono de al lado del jugador es enorme en pantalla
        // y lavaria justo el obstaculo que tenes que leer.
        const a = rave * Phaser.Math.Clamp(1 - (zz - PLAYER_Z) / 3000, 0.12, 1)
          * Phaser.Math.Clamp((zz - PLAYER_Z) / 500, 0, 1);
        if (a < 0.02) continue;
        for (const s of [-1, 1]) {
          // 175 por fuera del borde: pegado al carril de afuera el cono lavaria la lectura.
          // Medido: 430 con 3 carriles (el de siempre) y 515 con 4.
          const x0 = s * (this.edge + 175), y0 = 200 * this.grav;   // al costado y por encima
          const ang = Math.atan2(d[1], s * d[0]) + s * gir;
          // el cono era de 620 de largo y 0.13 de apertura: cruzaban la pista como hilos. Con
          // 900 x 0.26 son vigas, que es lo unico que se lee de lejos. Dos conos, uno ancho y
          // tenue y otro angosto y fuerte: eso es lo que le da el borde marcado a un laser.
          const dx = Math.cos(ang) * 900, dy = Math.sin(ang) * 900 * this.grav;
          for (const [ap, al] of [[0.26, 0.13], [0.09, 0.2]]) {
            g.fillStyle(col, al * a);
            g.fillPoints([P(x0, y0, zz), P(x0 + dx - dy * ap, y0 + dy + dx * ap, zz),
              P(x0 + dx + dy * ap, y0 + dy - dx * ap, zz)], true);
          }
          g.lineStyle(5, col, 0.9 * a);   // nucleo
          const p0 = P(x0, y0, zz), p1 = P(x0 + dx, y0 + dy, zz);
          g.lineBetween(p0.x, p0.y, p1.x, p1.y);
          g.fillStyle(PALETTE.text, 0.9 * a);   // la lampara
          g.fillCircle(p0.x, p0.y, Math.max(2, 5 * this.proj(x0, y0, zz).s));
        }
      }
    }
,
    drawGates(sec) {
      if (this.cam.flat || (sec !== "break" && sec !== "drop")) return;
      const g = this.g, t = this.songT, beat = this.lv?.beat ?? 0.4615;
      const br = sec === "break";
      const paso = beat * (br ? 1 : 2) * this.speed;
      const off = (((t * this.speed) % paso) + paso) % paso;
      // violeta y no rosa: el rosa quedo a un paso del KILL de las paredes y el tunel no
      // puede tener el color de lo que mata.
      const col = br ? PALETTE.accentSoft : PALETTE.violet;
      const P = (x, y, z) => { const p = this.proj(x, y, z); return new Phaser.Geom.Point(p.x, p.y); };
      let prev = null, prevA = 0;
      for (let z = SPAWN_Z; z > this.zn; z -= paso) {
        const zz = Math.max(z - off, this.zn + 4);
        if (zz <= this.zn + 4) continue;
        const d = (zz - PLAYER_Z) / (SPAWN_Z - PLAYER_Z);   // 0 encima, 1 recien salido
        // el embudo: los de cerca abren la boca, los del fondo se cierran
        const k = br ? 1 + 0.5 * (1 - d) : 1;
        // el de encima tuyo se apaga (`d*3`): un porton gigante ocupando la pantalla entera
        // se lee como andamio, no como tunel. El tunel es el que se va cerrando adelante.
        const a = (br ? 0.55 : 0.2 + 0.8 * this.beat)
          * Phaser.Math.Clamp(1 - d * 1.2, 0.05, 1) * Phaser.Math.Clamp(d * 3, 0, 1);
        if (a < 0.02) continue;
        // ARCO de 6 puntos, no un rectangulo: el marco cuadrado se leia como andamio. Los
        // hombros a media altura son lo que lo hace un porton. En el drop ademas es casi el
        // doble de grande (760x620 contra 420x340) y respira con el bajo.
        const bt = br ? 0 : this.beat;
        const W = (br ? 420 : 760) * k * (1 + 0.07 * bt);
        const H = (br ? 340 : 620) * k * this.grav * (1 + 0.07 * bt);
        const q = [P(-W, 0, zz), P(-W, H * 0.5, zz), P(-W * 0.62, H, zz),
          P(W * 0.62, H, zz), P(W, H * 0.5, zz), P(W, 0, zz)];
        // dos pasadas (halo ancho + nucleo): un solo trazo grueso se lee como tuberia
        for (const [wd, al] of [[br ? 7 : 12 + 18 * bt, 0.22], [br ? 2 + 3 * (1 - d) : 3 + 6 * bt, 1]]) {
          g.lineStyle(wd, col, a * al);
          g.strokePoints(q, false);
        }
        // las aristas largas entre porton y porton: sin esto son marcos sueltos, con esto
        // es un tunel. Se dibujan con el alpha del mas tenue de los dos.
        if (prev) {
          g.lineStyle(1.5, col, Math.min(a, prevA) * 0.7);
          for (let i = 0; i < q.length; i++) g.lineBetween(q[i].x, q[i].y, prev[i].x, prev[i].y);
        }
        prev = q; prevA = a;
      }
    }
,
    drawEdges(w, h, cues, t, col) {
      const g = this.g;
      let imp = 0;
      for (const c of cues) {
        if (c.role !== "obstacle") continue;
        imp = Math.max(imp, 1 - Math.min(1, Math.abs(t - c.t) / 0.14));
      }
      const e = Math.max(this.beat * 0.5, imp);
      if (e < 0.02) return;
      const c2 = mix(col, 0xffffff, 0.35 * imp);
      for (const [k, al] of [[1, 0.16], [0.32, 0.4]]) {   // banda ancha tenue + filo fuerte
        g.fillStyle(c2, al * e);
        g.fillRect(0, h - (14 + 54 * e) * k, w, (14 + 54 * e) * k);
        const vw = (8 + 26 * e) * k;
        g.fillRect(0, 0, vw, h);
        g.fillRect(w - vw, 0, vw, h);
      }
    }
,
    drawFlash(w, h, sec, t, pulse) {
      if (!this.lv) return;
      const g = this.g, beat = this.lv.beat, bar = this.lv.bar;
      // DROP: blanco en CADA kick. `pulse^3` deja el fondo limpio entre golpes (medido: el
      // alpha esta por debajo de 0.01 el 60% del beat) y 0.22 de tope es lo que se vio que
      // pega sin lavar la pista: con 0.3 el cielo se ponia gris y la niebla se comia el fondo.
      // `startsWith` y no `=== "drop"`: la seccion del nivel 2 se llama `drop2` y su drop se
      // quedaba SIN respuesta de pantalla. El nivel 1 no cambia (su seccion sigue siendo
      // `drop`) y esto va antes del corte por `decor`: el golpe blanco es de todos los niveles,
      // lo que es del nivel 1 es el apagon del break y los blinders violetas de abajo.
      if (sec?.startsWith("drop")) {
        // ...con `this.kik` y no con `pulse`: en el drop2 del nivel 2 `pulse` vale 0 el 100% del
        // tramo (cero eventos de `bass`), o sea que el golpe blanco no salia NUNCA justo donde
        // tiene que salir. En el nivel 1 `kik === pulse` (no declara `metro`): 0 px.
        const a = 0.22 * this.kik ** 3;
        if (a > 0.01) { g.fillStyle(0xffffff, a); g.fillRect(0, 0, w, h); }
      }
      // APAGON Y BLINDERS: solo donde el nivel los pide (`flash` en `decor`). El nivel 2 los
      // heredaba sin pedirlos: 2.47s de negro absoluto en su break y un estrobo VIOLETA, que
      // ademas no es ni su paleta.
      if (!this.dec("flash")) return;
      const br = this.lv.sections.find((s) => s.label === "break");
      if (!br) return;
      if (sec === "break" && t < br.end - beat) {
        // entra en 0.12s: de golpe se lee como un bug de render, no como un apagon
        g.fillStyle(0x000000, Phaser.Math.Clamp((t - br.start) / 0.12, 0, 1));
        g.fillRect(0, 0, w, h);
        return;   // en el apagon no hay blinders: el apagon ES el efecto
      }
      const d = br.start - t;
      if (d <= 0 || d >= bar) return;
      const p = 1 - d / bar;                 // 0 al empezar el compas, 1 al entrar al break
      // La fase va INTEGRADA, no `t % sub`: con `sub` cambiando, `t % sub` no es una fase y
      // sale parpadeo caotico en vez de un estrobo que acelera. `4u + 8u^2` arranca en 4
      // flashes por compas (uno por beat) y termina en 20 (uno cada 1/5 de beat).
      const ph = (4 * p + 8 * p * p) % 1;
      const a = (0.22 + 0.4 * p) * Math.max(0, 1 - ph * 2.2);   // cada flash decae, no es cuadrado
      if (a < 0.01) return;
      g.fillStyle(mix(PALETTE.violet, 0xffffff, 0.75), a);
      g.fillRect(0, 0, w, h);
    }
,
    drawRings(w, h) {
      const g = this.g, t = this.songT;
      const { x: cx, y: cy, r: rr } = this.reacAt(w, h);
      const col = this.lv?.neon?.def ?? PALETTE.violet;
      const step = RINGS_STEP * (1 + 0.55 * this.hype);   // la creciente los ABRE, no los acelera
      const off = (((t * this.speed * RINGS_K) % step) + step) % step;
      for (let i = 0; i < RINGS_N; i++) {
        const r = off + i * step;
        // se apaga DENTRO del reactor (ahi el anillo seria un aro pegado al chasis) y en el
        // borde de la pantalla (si no, el ultimo aparece de golpe al cruzar el paso)
        const fin = Phaser.Math.Clamp((r - rr * 0.75) / (rr * 0.6), 0, 1);
        const fout = Phaser.Math.Clamp(1 - (r - w * 0.32) / (w * 0.5), 0, 1);
        // A LA MITAD de lo que estaban (0.10 + 0.26): se reporto que se ven de mas. Y ya no
        // aparecen en el buildup, porque cuelgan del reactor y el reactor no existe hasta el
        // drop (ver `this.reac`), que es lo otro que se pidio.
        const a = (0.05 + 0.13 * this.lat) * fin * fout;
        if (a < 0.02) continue;
        for (const [lw, al] of [[7, 0.35], [1.6, 1]]) {
          g.lineStyle(lw, col, a * al);
          g.strokeEllipse(cx, cy, r * 2, r * 2 * RINGS_SQ);
        }
      }
    }
,
    drawHat(w, h, sec) {
      if (sec === "break") return;
      const a = HAT_A * this.hat * (0.55 + 0.45 * this.hype);
      if (a < 0.01) return;
      this.g.fillStyle(0xffffff, a);
      this.g.fillRect(0, 0, w, h);
    }
,
    drawArcs(w, h, mark, nOver, big = 0) {
      const e = mark ** 2;
      if (e < 0.05) return;
      const g = this.g, t = this.songT;
      const { x: cx, y: cy, r } = this.reacAt(w, h);
      const col = this.lv?.neon?.fam?.[0] ?? PALETTE.accentSoft;
      const nb = Math.floor((t - (this.lv?.off ?? 0)) / (this.lv?.beat ?? 0.4615));
      const n = nOver ?? 1 + Math.round(ARC_N * this.hype);
      // DE DONDE SALEN. Con el reactor en pantalla salen de EL, hacia arriba. Sin reactor no
      // pueden: se reporto que en el buildup los relampagos "muestran la posicion del reactor"
      // cuando el reactor todavia no existe (entra en el drop, f68), o sea que marcaban un sitio
      // vacio; ahi caen desde el canto de ARRIBA. Son las dos unicas puntas posibles, porque la
      // direccion ya no es libre (ver `arcDir`): los origenes horizontales que habia (de los
      // costados al centro, y del carril del jugador hacia los lados) daban rayos de mediana 10.1
      // y 17.2 grados sobre la horizontal, o sea justo lo que el reporte pide que no exista.
      const org = this.reac ? 0 : 1;
      for (let i = 0; i < n; i++) {
        const s = nb * 13 + i * 7 + 1;
        // sale del borde del reactor y llega al borde de la pantalla: el largo es lo que hace
        // que se lea como descarga y no como chispa.
        // y el FOGONAZO los tira hacia ABAJO aunque salgan del reactor: hacia arriba el reactor
        // esta a 130px del canto (de 508), o sea que los 8 rayos se iban de cuadro enseguida y el
        // fogonazo medido daba una caja de 247x88, mas chica que la del rayo suelto de antes.
        // Hacia abajo tienen la pantalla entera y siguen siendo una de las tres familias
        // permitidas (arriba-abajo y las dos diagonales); ademas caen SOBRE la pista, que es
        // justo lo que el fogonazo viene a mostrar.
        // Y desde el reactor salen en REDONDO (`all`): las tres familias de arriba mas las tres
        // espejadas hacia abajo. Se reporto que "solo van hacia arriba" y que tienen que salir
        // "desde todos los ejes desde el centro", que es lo que hace un nucleo de plasma. No
        // afloja la regla: el peor caso sigue a 50 grados de la horizontal, solo que ahora
        // tambien para el otro lado. El fogonazo NO (`big`): ahi los 8 van todos abajo a
        // proposito, y el origen de arriba tampoco, que ya nace en el canto de la pantalla.
        const ang = arcDir(s, org || big ? 1 : -1, org || big ? 0 : 1);
        const ux = Math.cos(ang), uy = Math.sin(ang);
        let len = w * (0.34 + 0.5 * hash(s + 0.5)) * (1 + 0.6 * big), x0, y0;
        if (org === 0) {
          // el origen si va aplastado (`0.7`), como los anillos: nace en el canto del reactor,
          // que en pantalla es una elipse. La DIRECCION no, o el aplastado tumbaria el rayo.
          x0 = cx + ux * r * 0.8; y0 = cy + uy * 0.7 * r * 0.8;
        } else {                         // de ARRIBA hacia abajo
          x0 = w * (0.12 + 0.76 * hash(s)); y0 = 0;
          len = h * (0.55 + 0.5 * hash(s + 0.5)) * (1 + 0.6 * big);
        }
        const x1 = x0 + ux * len, y1 = y0 + uy * len;
        const dx = x1 - x0, dy = y1 - y0;
        // el `y` del rayo es LATERAL a su recta, o sea perpendicular: por eso va con (-dy, dx)
        const P = (p, sc = 1) => ({ x: x0 + dx * p.x - dy * p.y * sc, y: y0 + dy * p.x + dx * p.y * sc });
        const main = bolt(s).map((p) => P(p));
        // SE VA AFINANDO Y APAGANDO HACIA LA PUNTA, o sea segmento a segmento y no una polilinea
        // de grosor constante. Una descarga es mas gruesa donde nace y se deshilacha al final;
        // con las tres pasadas de ancho fijo el rayo se leia como un cable doblado pegado al
        // reactor, que es lo que se reporto. El halo ancho si va de una pasada: es difuso.
        const gr = 1 + 0.8 * big;
        g.lineStyle(9 * gr, col, 0.14 * e);
        g.strokePoints(main, false);
        for (let k = 1; k < main.length; k++) {
          const u = k / (main.length - 1);
          const cae = (1 - u) ** 0.7;                       // 1 en el nucleo, 0 en la punta
          g.lineStyle((0.8 + 3.4 * cae) * gr, col, Math.min(1, 0.75 * e * (0.25 + cae)));
          g.lineBetween(main[k - 1].x, main[k - 1].y, main[k].x, main[k].y);
          g.lineStyle((0.5 + 1.3 * cae) * gr, 0xffffff, Math.min(1, e * (0.2 + 0.85 * cae)));
          g.lineBetween(main[k - 1].x, main[k - 1].y, main[k].x, main[k].y);
        }
        // las ramas son lo que separa una descarga de un cable doblado. Cada una lleva SU
        // geometria (`f.pts`): recalcular `bolt(s*5+1, ...)` para las tres dibujaba tres veces
        // la misma rama, o sea que el rayo tenia una sola bifurcacion repetida en tres sitios.
        for (const f of forks(s)) {
          const b = main[Math.round(f.at * (main.length - 1))];
          const ca = Math.cos(f.dir), sa = Math.sin(f.dir);
          const fx = (dx * ca - dy * sa) * f.len, fy = (dy * ca + dx * sa) * f.len;
          const pts = f.pts.map((p) => ({ x: b.x + fx * p.x - fy * p.y, y: b.y + fy * p.x + fx * p.y }));
          const fa = e * (1 - f.at) ** 0.7;   // las de la punta se apagan con el rayo
          g.lineStyle(2.6 * gr, col, 0.4 * fa);
          g.strokePoints(pts, false);
          g.lineStyle(1 * gr, 0xffffff, 0.7 * fa);
          g.strokePoints(pts, false);
        }
      }
    }
,
    drawBurst(w, h, cues) {
      const g = this.g, t = this.songT;
      for (const c of cues) {
        if (c.role !== "fx" || c.fx) continue;   // las letras del acid tienen su propio dibujo
        const p = (t - c.t) / BURST_T;
        if (p < 0 || p >= 1) continue;
        const r0 = hash(c.t * 97), r1 = hash(c.t * 97 + 0.5);
        const cx = w * (0.18 + 0.64 * r0), cy = h * (0.22 + 0.42 * r1);
        const R = h * BURST_R * (0.7 + 0.6 * (c.v ?? 1));
        for (const s of pyras(c.t * 31 + 1, BURST_SH, p)) {
          const a = s.a * 0.9;
          if (a < 0.03) continue;
          // DOS CARAS Y DOS GRISES: eso es lo que la hace una piramide y no un poligono. El
          // contorno no alcanza (una silueta plana con borde sigue siendo plana) y el color no
          // sale de la paleta: son metal, o sea gris y negro, y por eso se leen igual cuando el
          // nivel se va a fantasma, que es donde estan pedidas.
          for (const f of pyraFaces(s)) {
            const pts = f.pts.map((q) => new Phaser.Geom.Point(cx + q.x * R, cy + q.y * R));
            // EL HALO ES LO QUE LAS ENFOCA. Se reporto que "a veces funcionan y a veces no": sin
            // el, una esquirla es un parche de gris de 20-30px (`r` 0.07-0.18 de `R`, y `R` =
            // h*0.17*(0.7+0.6v) = 129px a h=582) contra un fondo que tiene malla, rig y anillos,
            // y por eso parecia que unas veces salian y otras no. Dos pasadas anchas de blanco por
            // debajo del relleno (5.5 y 2.6 de grosor) la despegan de lo que tenga detras.
            // Medido en el estallido de t=14.25 (bbox 115x90px, 14 esquirlas): el halo toca
            // **5558px = 0.68% del cuadro** y dentro de esa caja la luma media pasa de **51.1 a
            // 64.1 (+25%)** y el p95 de **169 a 190**, o sea que enfoca sin repintar la pantalla.
            g.lineStyle(5.5, 0xffffff, a * 0.10);
            g.strokePoints(pts, true);
            g.lineStyle(2.6, 0xffffff, a * 0.18);
            g.strokePoints(pts, true);
            g.fillStyle(mix(BURST_LO, BURST_HI, f.shade), a * (0.55 + 0.35 * f.shade));
            g.fillPoints(pts, true);
            g.lineStyle(1.1, 0xffffff, a * (0.25 + 0.6 * f.shade));   // el filo la despega del fondo
            g.strokePoints(pts, true);
          }
        }
        // el fogonazo del arranque: sin el, las esquirlas salen de la nada
        const f = Math.max(0, 1 - p * 5);
        if (f > 0.02) {
          g.fillStyle(0xffffff, f * 0.5);
          g.fillCircle(cx, cy, R * 0.22 * (0.4 + f));
        }
      }
    }
,
    drawGate(w, h) {
      if (this.gate >= 0.99) return;
      this.g.fillStyle(0x000000, 1 - this.gate);
      this.g.fillRect(0, 0, w, h);
    }
,
    drawBeam(w, h) {
      const g = this.g, t = this.songT, f = this.beam;
      const { x: cx, y: cy } = this.reacAt(w, h);
      const beat = this.lv?.beat ?? 0.4615, off = this.lv?.off ?? 0;
      const div = beat * (f.mode ? 2 : 4);          // un compas, o dos beats en el modo 1
      const u = (t - off) / div, i = Math.floor(u);
      const p = Math.min(1, ((((u % 1) + 1) % 1) * div) / BEAM_T);   // segundos desde el disparo
      const e = (1 - p) ** 2;
      if (e < 0.03) return;
      const q = 1 - e;                              // el barrido es el complemento del apagado
      const col = this.lv?.neon?.fam?.[2] ?? PALETTE.accentSoft;
      const z = Math.max(BEAM_Z0 + (BEAM_Z1 - BEAM_Z0) * q, this.zn + 4);
      const qx = this.qx ?? 0, qy = this.qy ?? 0;   // el suelo tiembla: el impacto tambien
      const N = this.laneX.length;
      const haz = (a, b) => {
        // de perfil la x del mundo no proyecta (los carriles se colapsan): ahi barre solo la z
        const lx = this.cam.flat ? 0 : this.laneX[a] + (this.laneX[b] - this.laneX[a]) * q;
        const im = this.proj(lx, 0, z);
        const tx = im.x + qx, ty = im.y + qy;
        const dx = tx - cx, dy = ty - cy, L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L, ny = dx / L;
        const wd = BEAM_PW * im.s;                  // el cono mide lo que su propio charco
        for (const [k, al] of [[2.3, 0.20], [1, 0.55], [0.36, 1]]) {
          g.fillStyle(col, BEAM_A * e * al);
          g.fillPoints([[cx - nx * wd * k * 0.08, cy - ny * wd * k * 0.08],
            [cx + nx * wd * k * 0.08, cy + ny * wd * k * 0.08],
            [tx + nx * wd * k, ty + ny * wd * k], [tx - nx * wd * k, ty - ny * wd * k]]
            .map(([x, y]) => new Phaser.Geom.Point(x, y)), true);
        }
        g.lineStyle(2 + 5 * e, 0xffffff, Math.min(1, 0.9 * e));
        g.lineBetween(cx, cy, tx, ty);
        g.fillStyle(0xffffff, Math.min(1, 0.5 * e));          // la boca, en el nucleo del reactor
        g.fillCircle(cx, cy, 3 + 12 * e);
        // EL CHARCO VA EN LA SUPERFICIE: un cuadro del plano del suelo alrededor del impacto,
        // proyectado por sus cuatro esquinas, o sea que sale en trapecio como las bandas de la
        // pista. De perfil seria una linea (la x no proyecta): ahi queda el haz solo.
        if (this.cam.flat) return;
        for (const [ex, al] of [[1.7, 0.10], [1, 0.26]]) {
          g.fillStyle(col, al * e);
          g.fillPoints([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => {
            const c = this.proj(lx + sx * BEAM_PW * ex, 0,
              Math.max(z + sz * BEAM_PD * ex, this.zn + 4));
            return new Phaser.Geom.Point(c.x + qx, c.y + qy);
          }), true);
        }
      };
      const a = Math.floor(hash(i * 1.9 + 7) * N);
      const b = (a + 1 + Math.floor(hash(i * 5.3) * (N - 1))) % N;   // nunca el mismo carril
      haz(a, b);
      if (hash(i * 3.7) < BEAM_PAIR) haz(b, a);     // el segundo cruza al primero
    }
,
    drawLights() {
      if (this.cam.flat) return;   // de perfil la x del mundo no proyecta: las dos filas se pisan
      const g = this.g, t = this.songT;
      const beat = this.lv?.beat ?? 0.4615;
      const col = this.lv?.neon?.fam?.[2] ?? PALETTE.accentSoft;
      const paso = (beat / 2) * this.speed;
      const off = (((t * this.speed) % paso) + paso) % paso;
      const hb = Math.floor(t / (beat / 2));
      // van por FUERA del carril de afuera y por DENTRO de la malla (`MESH_GAP` son 90px de
      // pantalla): la pista es lo que se juega y esto la enmarca, no la cruza.
      const x0 = this.edge + LIGHT_OUT;
      // LA FILA DIBUJA UNA FIGURA Y NO UNA RECTA (`LIGHT_SHP`, una por compas via hash, nunca
      // random). La primera es la recta de siempre, o sea que una de cada cuatro se ve como
      // estaba. `mv(idx)` es funcion pura de (indice de luz, songT): la figura entera se mueve
      // sola y rebobinar la rebobina.
      const sh = LIGHT_SHP[Math.floor(hash(Math.floor(t / (beat * 4)) * 3 + 1) * LIGHT_SHP.length)];
      // EL DESPLAZAMIENTO EN X ES SOLO HACIA AFUERA (`0.5 + 0.5*sin`, o sea 0..ax y no -ax..+ax).
      // Se reporto que la figura que entra "dentro de los carriles" no sirve, y medido entraba: la
      // serpentina llegaba a x=270 del mundo con el borde de la pista en 340, o sea **70 adentro**
      // (101 contando el halo) y pasada del centro del carril de afuera (255); la helice llegaba a
      // 330, o sea 10 adentro. Con la ola de un solo lado el minimo de las cuatro figuras es el
      // borde de afuera (`x0`) y ninguna cruza. Y no es la misma figura recortada: la fila abre y
      // cierra hacia el descampado, que es lo que hace de verdad una pista de aterrizaje.
      const mv = (idx) => {
        if (!sh.k) return [0, 0];
        const q = (idx * sh.k * 0.5 + t / (beat * 2)) * Math.PI * 2;
        return [(0.5 + 0.5 * Math.sin(q)) * sh.ax, (0.5 - 0.5 * Math.cos(q)) * sh.ay];
      };
      for (let z = SPAWN_Z; z > this.zn; z -= paso) {
        const zz = Math.max(z - off, this.zn + 4);
        if (zz <= this.zn + 4) continue;
        const idx = Math.round((t * this.speed + zz) / paso);   // indice estable de la luz
        const on = CHASE[(((hb - idx) % CHASE.length) + CHASE.length) % CHASE.length];
        // se apaga de lejos: la niebla se las come igual que a las cajas
        const a = on ** 1.6 * Phaser.Math.Clamp(1 - (zz - PLAYER_Z) / 3600, 0.1, 1);
        if (a < 0.03) continue;
        const [mx, my] = mv(idx);
        for (const sg of [-1, 1]) {
          // el desplazamiento va ESPEJADO en x (`sg * mx`): las dos filas son la misma figura,
          // como un rig de verdad, y no dos luces sueltas moviendose cada una por su lado.
          const p = this.proj(sg * (x0 + mx), my * this.grav, zz);
          const rad = LIGHT_R * p.s * (0.7 + 0.5 * this.lat);
          if (rad < 0.6) continue;
          // tres pasadas: halo ancho de color, cuerpo, y nucleo BLANCO. Una luz de pista es
          // blanca con el color derramado alrededor, igual que las formas y los rayos.
          g.fillStyle(col, a * 0.22);
          g.fillCircle(p.x, p.y, rad * 2.0);
          g.fillStyle(col, a * 0.55);
          g.fillCircle(p.x, p.y, rad);
          g.fillStyle(0xffffff, a);
          g.fillCircle(p.x, p.y, rad * 0.45);
        }
      }
    }
,
    drawShapes() {
      if (this.cam.flat || this.rave <= 0.02) return;
      const g = this.g, t = this.songT;
      // Se encienden EN una marca (la linea amarilla) y se apagan en la siguiente: un destello
      // de un beat por compas, no un adorno que esta siempre. Ver `markWin` en music.js.
      const win = this.lv ? markWin(t, this.lv.cues, this.lv.beat) : 1;
      if (win <= 0.02) return;
      const bar = (this.lv?.beat ?? 0.4615) * 4;
      const paso = bar * this.speed;
      const off = (((t * this.speed) % paso) + paso) % paso;
      for (let z = SPAWN_Z; z > this.zn; z -= paso) {
        const zz = z - off;
        if (zz < PLAYER_Z + 200) continue;   // pegadas a la camara son manchas
        const i = Math.round((t * this.speed + zz) / paso);   // indice estable de la forma
        // el piso de 0.6 (antes 0.45 y multiplicado por rave) es lo que las hace visibles entre
        // beat y beat: latiendo desde 0 se veian solo en el golpe y el resto del compas no estaban.
        // EL ACENTO LAS EMPUJA, y cuanto lo dice la CRECIENTE: se reporto que flotan sin seguir
        // nada. El termino extra va multiplicado por `this.hype`, o sea que en el nivel 1 (que no
        // la declara) vale 0 y no se mueve un pixel, y en el drop del 2, donde `hype` = 1, la
        // forma pega el doble con cada marca en vez de respirar un 40%.
        const pop = this.hype * this.beat;
        const a = win * this.rave * Phaser.Math.Clamp(1 - (zz - PLAYER_Z) / 3200, 0.15, 1)
          * Math.min(1, 0.6 + 0.4 * this.beat + 0.5 * pop);
        if (a < 0.03) continue;
        for (const s of [-1, 1]) {
          const r = hash(i * 2 + (s > 0 ? 1 : 0));
          const n = [3, 4, 6][Math.floor(hash(i + s) * 3)];
          const x = s * (620 + r * 420);
          const y = (140 + hash(i + 0.3) * 420 + Math.sin(t * 0.8 + i) * 40) * this.grav;
          const p = this.proj(x, y, zz);
          const rad = (85 + r * 70) * p.s * (1 + 0.3 * this.beat + 0.45 * pop);
          if (rad < 3) continue;
          const rot = t * (0.3 + r * 0.5) + i + pop * 0.9;   // y ademas se sacuden en el golpe
          const pts = [];
          for (let k = 0; k < n; k++) {
            const ang = rot + (k / n) * Math.PI * 2;
            pts.push(new Phaser.Geom.Point(p.x + Math.cos(ang) * rad, p.y + Math.sin(ang) * rad));
          }
          const col = this.neon[Math.floor(hash(i + 0.7) * this.neon.length)];
          g.fillStyle(mix(col, 0xffffff, 0.3), 0.22 * a);
          g.fillPoints(pts, true);
          // GLOW RETRO: cuatro pasadas, de muy ancha y tenue a fina y BLANCA. El neon de verdad
          // es un tubo blanco con el color derramado alrededor, no un contorno de color: por eso
          // el nucleo va en 0xffffff y el color solo en las capas anchas. Con una sola pasada del
          // color se hundian contra el skyline.
          for (const [wd, cc, al] of [
            [26 + 34 * this.beat, col, 0.14],
            [12 + 16 * this.beat, col, 0.34],
            [5 + 6 * this.beat, mix(col, 0xffffff, 0.55), 0.9],
            [2.5, 0xffffff, 1],
          ]) {
            g.lineStyle(wd, cc, al * a);
            g.strokePoints(pts, true);
          }
        }
      }
    }
,
    drawLayers(w, pulse) {
      const g = this.g, y = this.bgY;   // de perfil el fondo no se apoya en el horizonte
      // de cabeza el suelo ocupa la mitad de arriba: se espeja el fondo en vez de taparlo
      const upside = this.camY < 0;
      if (upside) { g.save(); g.translateCanvas(0, y); g.scaleCanvas(1, -1); g.translateCanvas(0, -y); }
      for (const L of this.lv?.layers ?? []) {
        const st = layerAt(this.songT, this.lv.cues, L);
        if (!st.vis) continue;
        if (L.kind === "bars") { if (this.dec("bars")) this.drawBars(L, st, w, y, pulse); continue; }
        const d = this.songT * this.speed * L.k;
        const i0 = Math.floor(d / L.step);
        g.fillStyle(st.color, 1);
        for (let j = 0, n = Math.ceil(w / L.step) + 2; j < n; j++) {
          const i = i0 + j, x = i * L.step - d, r = hash(i);
          if (L.kind === "stars") { const s = 1 + 2 * r; g.fillRect(x, hash(i + 0.5) * y * L.h, s, s); continue; }
          const bh = y * L.h * (0.3 + 0.7 * r);   // el skyline no se mueve
          g.fillRect(x, y - bh, L.step * 0.74, bh);
        }
      }
      if (upside) g.restore();
    }
,
    drawBars(L, st, w, y, pulse) {
      const g = this.g;
      const beat = this.lv?.beat ?? 0.4615, bar = this.lv?.bar ?? 1.846;
      const secs = this.lv?.sectors ?? [];
      const si = secs.indexOf(sectorOfRow(this.lv ? rowAt(this.songT, this.lv) : 0, secs));
      // el fantasma TRAE la constelacion: son un solo efecto, no dos que hay que sincronizar
      const mode = this.ghost ? "constelacion" : L.modes?.[si] ?? L.modes?.[0] ?? "analyzer";
      const n = Math.ceil(w / L.step) + 2, hMax = y * L.h, bw = L.step * 0.62;
      // FFT real: en pausa da todo ceros (no es funcion de songT), asi que sin el la barra
      // queda en su piso y el fondo no desaparece.
      const fft = mode === "spectro" || mode === "color" ? this.tp?.spectrum() : null;
      // cometa: 1 en la cabeza (u = p) y la cola queda DETRAS, o sea del lado por el que ya
      // paso. Es lo que le da DIRECCION al barrido; con un on/off las barras parpadean por su
      // cuenta y no se ve para donde va.
      const cola = (u, p) => Math.exp(-((p - u + 1) % 1) * 3.5);
  
      if (mode === "constelacion") {
        // La figura CAMBIA con cada destello (`this.fig`, ver `draw()`): el primero (la f63) es
        // el rombo de siempre y de ahi en mas van saliendo las otras. El tamano es el beat.
        const fig = FIGS[this.fig % FIGS.length];
        for (let j = 0; j < n; j++) {
          const x = j * L.step + L.step / 2, r = hash(j);
          const ph = this.songT / bar * Math.PI * 2 + r * 6.283;
          const cy = y - hMax * (0.25 + 0.55 * r) + Math.sin(ph) * hMax * 0.16;
          // 0.4 de radio base y no 0.22: con el rombo chico esto se leia como confeti, no como
          // una capa de fondo. El contorno claro es lo que lo despega del skyline.
          const rad = L.step * (0.4 + 0.45 * r) * (0.8 + 0.45 * this.beat);
          // el vaiven horizontal va a media vuelta del vertical: asi la figura describe un 8 y
          // no una diagonal, que es lo que hace que se lea como que FLOTA y no que se desliza.
          const cx = x + Math.sin(ph * 0.5) * L.step * fig.sway;
          const ang = fig.rot + (this.songT / bar) * fig.spin * Math.PI * 2 + r * 6.283 * fig.spin;
          const pts = Array.from({ length: fig.n }, (_, k) => {
            const a = ang - Math.PI / 2 + (k / fig.n) * Math.PI * 2;
            return new Phaser.Geom.Point(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
          });
          // GLOW RETRO, el mismo que las formas de los costados: cuatro pasadas de muy ancha y
          // tenue a fina y BLANCA. Es el fondo, asi que va a la mitad de alpha que las formas
          // (si pega igual, la constelacion compite con los obstaculos y no es lo que se juega).
          // En FANTASMA el relleno va BLANCO ENTERO: el resto de la pantalla es gris al 28% y
          // linea blanca, asi que un rombo relleno de blanco es lo unico macizo que queda.
          g.fillStyle(this.ghost ? 0xffffff : mix(st.color, 0xffffff, 0.15 + 0.35 * pulse), 0.45 + 0.3 * r);
          g.fillPoints(pts, true);
          for (const [wd, cc, al] of [
            [10 + 14 * this.beat, st.color, 0.1],
            [5 + 6 * this.beat, mix(st.color, 0xffffff, 0.4), 0.22],
            [2.5, mix(st.color, 0xffffff, 0.75), 0.5 + 0.4 * this.beat],
            [1, 0xffffff, 0.5 + 0.5 * this.beat],
          ]) {
            g.lineStyle(wd, cc, al);
            g.strokePoints(pts, true);
          }
        }
        return;
      }
  
      const d = this.songT * this.speed * L.k, i0 = Math.floor(d / L.step);
      g.fillStyle(st.color, 1);
      for (let j = 0; j < n; j++) {
        const i = i0 + j, r = hash(i);
        const x = mode === "analyzer" ? i * L.step - d : j * L.step;
        const u = (j + 0.5) / n;   // 0 en el borde izquierdo, 1 en el derecho
        let e, col = st.color;
        switch (mode) {
          // el piso es 0.18 y no 0.1: con 0.1 lo que no esta barriendo se lee como apagado y
          // medida pantalla queda en negro. El kick levanta el resto, o sea que igual late.
          case "sweep":
            e = Math.min(1, 0.18 + 0.8 * cola(u, (this.songT % bar) / bar) + 0.34 * pulse);
            break;
          // desde el centro: `u` pasa a ser la distancia al centro, o sea que el mismo cometa
          // sale hacia los dos lados a la vez sin duplicar nada.
          case "center":
            e = Math.min(1, 0.18 + 0.8 * cola(Math.abs(2 * u - 1), (this.songT % beat) / beat)
              + 0.34 * pulse);
            break;
          case "spectro":
          case "color": {
            // el bin sale de u^1.7: lineal deja todo el grave apilado en el borde izquierdo y
            // las tres cuartas partes de la pantalla planas.
            const b = Math.min(fft.length - 1, Math.floor(u ** 1.7 * fft.length * 0.8));
            e = Math.max(0.06, (fft[b] / 255) ** 1.3);
            if (mode === "color") {
              col = this.neon[(j + Math.floor(this.songT / bar)) % this.neon.length];
              col = mix(col, 0xffffff, 0.45 * e);
            }
            break;
          }
          default: {   // analyzer, el de siempre
            const sub = 1 + Math.floor(hash(i + 3) * 4);
            const osc = Math.abs(Math.sin(Math.PI * (this.songT / beat) * sub + r * 6.283));
            e = Math.min(1, 0.14 + 0.55 * osc * (0.4 + 0.6 * r) + 0.36 * pulse * osc);
          }
        }
        g.fillStyle(col, 1);
        g.fillRect(x, y - hMax * e, bw, hMax * e);
        // el pico: se despega y baja mas lento que la barra, como el peak hold de un
        // analizador de verdad. Es lo unico brillante del fondo, o sea que marca el borde.
        const pk = hMax * Math.min(1, e + 0.18 * (1 - pulse));
        g.fillStyle(mix(col, 0xffffff, 0.45 + 0.4 * pulse), 0.9);
        g.fillRect(x, y - pk - 3, bw, 3);
      }
    }
,
    drawAcid(p) {
      const txt = (this.lv?.acid ?? ACID).slice(0, MAX_ACID);
      const n = txt.length;
      // ESTILO Y GESTO POR NIVEL (`acidFx` en LEVELS). Respaldo `null` = el nivel 1: ni se toca
      // el estilo del pool ni se sale de este gesto, o sea 0 px de diferencia.
      const fx = this.lv?.acidFx;
      // el estilo se aplica UNA vez por nivel y no por frame: `setStyle` re-renderiza la textura
      // de cada letra, o sea 24 texturas nuevas 60 veces por segundo. El padding es obligatorio
      // con stroke y glow: la textura se recorta en la caja del glifo y el resplandor sale
      // cortado en cuadrado.
      if (fx?.style && this.acidSty !== fx.style) {
        this.acidSty = fx.style;
        for (const l of this.acid) l.setStyle(fx.style).setPadding(20);
      }
      if (fx?.move === "stamp") return this.acidStamp(p, txt, n, fx);
      const out = p == null ? 0 : Math.max(0, (p - 0.85) / 0.15);   // al final revienta hacia la camara
      for (let i = 0; i < this.acid.length; i++) {
        const l = this.acid[i];
        const q = p == null || i >= n ? -1 : p * 3.6 - (i / n) * 1.9;
        if (q <= 0 || txt[i] === " ") { l.setVisible(false); continue; }
        if (l.text !== txt[i]) l.setText(txt[i]);
        const z = (3200 - 2500 * Math.min(1, q)) * (1 - out * 0.72);
        const pr = this.proj((i - (n - 1) / 2) * 36, 250, z);
        const sh = Math.sin(this.songT * 60 + i * 2) * 5 * Math.min(1, q);   // tiembla
        l.setVisible(true).setPosition(pr.x + sh, pr.y)
          .setScale(pr.s * 1.1).setAlpha(Math.min(1, q * 2) * (1 - out));
      }
    }
,
    acidStamp(p, txt, n, fx) {
      const gap = fx.gap ?? 36;
      // WORD = medio beat con `dur` 1.65 (medido: 219.5ms contra 219.0). SET = lo que tarda una
      // palabra en clavarse (99ms). OUT = de aca al final se van: 330ms = 0.75 beats, y terminan
      // en p=1, o sea 285.8ms antes del drop2. El gesto no alarga la cue ni un frame.
      const WORD = 0.133, SET = 0.06, OUT = 0.80;
      const out = p == null ? 0 : Math.max(0, (p - OUT) / (1 - OUT));
      let w = 0;
      for (let i = 0; i < this.acid.length; i++) {
        const l = this.acid[i];
        if (i > 0 && txt[i - 1] === " ") w++;   // el escalonado es por PALABRA, no por letra
        const q = p == null || i >= n ? -1 : (p - w * WORD) / SET;
        if (q <= 0 || txt[i] === " ") { l.setVisible(false); continue; }
        if (l.text !== txt[i]) l.setText(txt[i]);
        // la palabra entra encima de la camara y se clava: z de 406 a 700, o sea escala x1.72 a
        // x1. Y la salida es z creciendo, con lo que las letras convergen SOLAS al punto de fuga
        // (lo hace `proj`, no hace falta una segunda cuenta de escala ni de posicion).
        const e = Math.min(1, q), k = (1 - e) * (1 - e);
        const z = 700 * (1 - k * 0.42) + out * out * 5200;
        // el zigzag late con el METRONOMO de la grilla (`this.lat`) y no con las cues: en el
        // break no hay de que colgarse (1 bass y 2 acid), y `lat` esta vivo el 100% del nivel.
        const sh = this.lat * 10 * Math.sin(i * 1.7);
        const pr = this.proj((i - (n - 1) / 2) * gap, 250 + sh, z);
        l.setVisible(true).setPosition(pr.x, pr.y)
          .setScale(pr.s * 1.1).setAlpha(Math.min(1, e * 3) * (1 - out));
      }
    }
,
    drawRave(cues) {
      if (this.cam.flat) return;   // de perfil los bordes de la pista quedan fuera de cuadro
      const g = this.g;
      const P = (x, y, z) => { const p = this.proj(x, y, z); return new Phaser.Geom.Point(p.x, p.y); };
      for (const c of cues) {
        // por ROL y no por nombre de canal: la segunda tanda trae otros tags (acidbass,
        // response, snare) y el rol es justo lo que dice "esto no es el kick"
        if (c.role !== "mark" && c.role !== "fx") continue;
        // una cue con EFECTO PROPIO (`fx: "acid"`) la dibuja ese efecto y no el suelo: su `dur`
        // esta puesto para que las letras tengan de donde sacar progreso (2.2s), y a v=1400 eso
        // son 3080z de barrido, o sea una losa que tapa la malla entera en vez de un barrido.
        if (c.fx) continue;
        const z = PLAYER_Z + (c.t - this.songT) * this.speed;
        if (z > SPAWN_Z || z + 40 < this.zn) continue;
        // en el mundo van en la familia del nivel; el amarillo/verde de TAG_COLORS se queda
        // para las lineas numeradas del modo diseno, que son otra cosa
        // ...y la familia es la del NIVEL (`neon.fam`), no el violeta del renderer: el nivel 1
        // declara fam[0]=violet y fam[1]=accentSoft, o sea exactamente lo que estaba escrito a
        // mano aca, y el 2 barre en su cyan en vez de tirar dos bandas violetas sobre la malla.
        const col = (c.tag === "voice" || c.tag === "acidbass")
          ? (this.lv?.neon?.fam?.[1] ?? PALETTE.accentSoft)
          : (this.lv?.neon?.fam?.[0] ?? PALETTE.violet);
        const v = c.v ?? 1;
        const a = v * Phaser.Math.Clamp(1 - (z - PLAYER_Z) / 2600, 0, 1);
        const zf = Math.max(z, this.zn);
        const zb = Math.max(z + (c.dur ? c.dur * this.speed : 30 + 90 * v), this.zn + 6);
        if (zb <= zf) continue;
        for (const s of [-1, 1]) {
          // solo el lavado de suelo: la viga vertical que habia aca se leia como un andamio
          // amarillo cruzando el cielo, y el cielo ya es del rig (`drawRig`).
          g.fillStyle(col, 0.34 * a);
          // arranca 45 por FUERA del borde de la pista (300 con 3 carriles, 385 con 4): adentro
          // taparia obstaculos. El 1400 de afuera es el ancho de pantalla proyectado, no la
          // pista, asi que no depende de N.
          const xi = this.edge + 45;
          g.fillPoints([P(s * xi, 0, zf), P(s * 1400, 0, zf), P(s * 1400, 0, zb), P(s * xi, 0, zb)], true);
          g.lineStyle(Math.max(1, 4 * a), col, 0.8 * a);   // el filo de afuera, que marca el pulso
          const p0 = P(s * 1400, 0, zf), p1 = P(s * 1400, 0, zb);
          g.lineBetween(p0.x, p0.y, p1.x, p1.y);
        }
      }
    }
,
};

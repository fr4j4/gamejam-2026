// Mixin de RunnerScene: metodos extraidos de AIRunnerGame.js (sin cambios).
// Se aplica con Object.assign(RunnerScene.prototype, ...) en AIRunnerGame.js.
import * as Phaser from "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js";
import { PALETTE, HEX } from "./theme.js";
import { KINDS, lanesX, PLAYER_Z, SPAWN_Z, SPEED_MULS } from "./physics.js";
import {
  LEVELS, zOf, bgAt, pulseAt, fxAt, mix, rowAt, timeOfRow, tileOf, zoneOfRow, sectionAt, sectorOfRow, markWin, flashIdx, markN, GHOST_ROW, gridAt, hatAt, hypeAt, gateAt, fxOfRow, hueAt,
} from "./music.js";
import { outrun } from "./fx.js";
import { BURST_T, COLORS, FIGS, JOLT_B, MAX_LABELS, MAX_TILES, RIG_DIM, SNAP_ARCS, SNAP_T, SPIN_TURNS, TAG_COLORS } from "./config.js";
import { rowGlyph } from "./pure.js";

export const render = {
    draw() {
      const g = this.g;
      const w = this.scale.width;
      const h = this.scale.height;
      this.frame(w, h);   // horizonte / escala / altura de camara: lo pone la camara activa
      g.clear();
      for (const l of this.labels) l.setVisible(false);
      for (const l of this.tileLabels) l.setVisible(false);
  
      const t = this.songT;
      const cues = this.near();
      const base = this.lv ? bgAt(t, this.lv.cues, this.lv.bg) : PALETTE.bg;
      const pulse = this.lv ? pulseAt(t, this.lv.cues) : 0;
      // Cuanta luz hay, por seccion. En el DROP el rig esta clavado arriba y late con el kick;
      // en el BUILDUP solo prende con las MARCAS (accent/voice, no el beat), o sea que la luz
      // va apareciendo a cuentagotas y el drop se siente; en el BREAK se apaga.
      const sec = this.lv ? sectionAt(t, this.lv.sections) : null;
      const mark = this.lv ? pulseAt(t, this.lv.cues, 0.3, "mark") : 0;
      // `startsWith` y no `===`: el drop del nivel 2 se llama "drop2", o sea que con la igualdad
      // su drop se quedaba con la luz del buildup (marcas a cuentagotas) en vez de clavada arriba.
      // CUAL SECCION ES EL DROP LO DICE EL NIVEL (`dropSec`), no el prefijo de su nombre: el
      // nivel 1 tiene un `drop` Y un `drop2` (59.08-87.69s), asi que `startsWith("drop")` le
      // encendia el rave clavado y el temblor en 28.6s que se disenaron sin ellos (medido:
      // 169813 px distintos a t=65 en la camara de atras). El respaldo es "drop", o sea lo que
      // el renderer hacia antes de existir el dial.
      const drop = sec === (this.lv?.dropSec ?? "drop");
      this.rave = drop ? Math.max(0.62, pulse) : sec === "break" ? 0 : mark * 0.9;
      // el color del guion va oscurecido: si no, un fondo saturado se come los obstaculos
      const tint = mix(base, 0xffffff, pulse * 0.18);
      const ground = mix(tint, 0x000000, 0.4);
      // Niebla: el color al que se va lo lejano (`drawBox`). Es la mitad entre suelo y cielo
      // porque una caja lejana toca los dos: la parte de abajo cae contra el suelo y la de
      // arriba contra el horizonte. Sin esto todas las cajas se dibujan igual a cualquier z y
      // una pared del fondo compite con la que tenes encima.
      this.fog = mix(ground, tint, 0.5);
      this.pulse = pulse;
      // Con que late lo que se juega (cajas, suelo, portones, formas): lo dice el nivel por
      // seccion (`glow`). Antes del drop van con los AGUDOS (accent/voice), o sea que el bajo
      // no aparece hasta que entra de verdad; en el drop pasan todos al bajo (el kick).
      // El rig, los pins y las barras siguen con el kick: son el decorado, no la lectura.
      this.beat = (this.lv?.glow?.[sec] ?? "bg") === "mark" ? mark : pulse;
      // LO QUE LATE CUANDO NO SUENA NADA. `this.beat` sale de las cues, o sea que se apaga con
      // ellas: medido en el nivel 2, `beat` vale 0 el 100% del outro (28.6s, un solo evento) y
      // `pulse` el 0% del drop2 y del outro (42.7s de 72.31 = el 59% del nivel). Todo lo que
      // late con eso se CONGELA: la malla se veia igual en el buildup, en el drop2 y en el outro.
      // `gridAt` es el metronomo de la grilla (funcion pura de songT, existe siempre) y va de
      // PISO, con la senal de acento encima. Solo en los niveles que lo piden (`metro` en
      // LEVELS): el nivel 1 no lo declara, o sea que ahi `lat === beat` y no cambia un pixel.
      // `metro` es el TECHO del metronomo, no un si/no: si llegara a 1 el metronomo pegaria tan
      // fuerte como una senal y la senal no mandaria nunca (medido: el 21.5% del nivel, 0% del
      // outro). Topado, el metronomo es el piso y `beat` sube por encima. Ver `metro` en LEVELS.
      this.lat = this.lv?.metro ? Math.max(this.beat, this.lv.metro * gridAt(t, this.lv)) : this.beat;
      // LA CRECIENTE (`hype` en LEVELS, `hypeAt` en music.js): 0..1 por FILA, o sea la unica
      // cosa del render que no es un latido sino un ARCO de varios compases. De aca cuelgan el
      // tamano del reactor, la apertura de los anillos del fondo y cuantos rayos salen.
      // Respaldo 0 = como si no existiera: el nivel 1 no la declara y no cambia un pixel.
      this.hype = this.lv ? hypeAt(t, this.lv) : 0;
      // EL GATE: 1 abierto, `floor` cerrado, y solo dentro de los tramos `fx` que lo pidan.
      // Fuera de ellos `gateAt` devuelve 1, o sea que no hay nada que dibujar.
      // MUERTO EL GATE SE ABRE: su fase sale de songT y songT esta congelado, o sea que un corte
      // que dura ~30ms se quedaria clavado 3 segundos. Medido en el tramo f36-f60 de orbit-motion
      // (25 filas con obstaculo, 21898 muestras a 0.5ms), la imagen esta cortada el 18.4% del
      // tiempo, y ahi `gateAt` da 0 exacto: congelado a t=24.60 el cuadro queda al 98.98% en negro
      // y lo unico que se ve es el cartel, en vez del mundo parado en el sitio.
      this.gate = this.lv && this.dec("gate") && !this.dead ? gateAt(t, this.lv) : 1;
      // el negativo es el MISMO motor que el gate con otro kind: 1 = imagen normal, cualquier
      // cosa por debajo = invertida. El nivel 1 no declara `fx`, o sea que ahi da 1 siempre.
      this.neg = this.lv ? gateAt(t, this.lv, "neg") < 1 : false;
      // TRAMOS `fx` QUE NO SON EL GATE. Van por fila igual que el, o sea que se leen una vez
      // aca y no una vez por capa. `row` sale de la grilla, o sea funcion pura de songT.
      const row = this.lv ? rowAt(t, this.lv) : 0;
      const fxo = (k) => (this.lv ? fxOfRow(row, this.lv, k) : null);
      // EL REACTOR NO EXISTE HASTA QUE EL NIVEL LO PIDE. Sin el tramo estaba puesto desde el
      // primer frame, o sea que el jefe del fondo se veia entero durante todo el buildup y
      // entrar al drop no lo estrenaba. Sin `fx` declarado sigue puesto siempre (nivel 1).
      // EL FOGONAZO DEL SNARE (`fx` de tipo `snap`): un frame de rayos + reactor en FANTASMA
      // sobre el apagon, o sea el aviso del drop. La envolvente es `(1-p)^2` desde el arranque de
      // la fila del tramo (el mismo idiom que `gridAt` y que el haz: ataque duro y cola), o sea
      // funcion pura de songT. Dura `SNAP_T` y no la fila entera: es un flash, no un tramo.
      const fsn = fxo("snap");
      this.snap = fsn
        ? Math.max(0, 1 - (t - timeOfRow(fsn.from, this.lv)) / SNAP_T) ** 2
        : 0;
      // EL REACTOR NO EXISTE HASTA QUE EL NIVEL LO PIDE... salvo en el fogonazo, que es
      // justamente ensenarlo un frame antes de que entre de verdad.
      this.reac = !this.lv?.fx ? 1 : fxo("reactor") || this.snap > 0.01 ? 1 : 0;
      // LASERES Y RELAMPAGOS SE TURNAN POR COMPAS Y NUNCA ESTAN LOS DOS (`arcTurn`). Se reporto
      // que no pueden "mezclarse" en ninguna parte del nivel, y medido estaban mezclados casi
      // siempre: el rig cubre el 50.3% del buildup y el 100% del drop2, y los rayos son un
      // SUBCONJUNTO suyo (buildup 39.2% de la seccion y los dos a la vez el 39.2%; drop2 72.8% y
      // los dos 72.8%), o sea que el **100% de los frames con rayo tenia laseres debajo**.
      // El turno es el COMPAS y no la seccion ni la cue: es la unidad que ya manda el color del
      // rig y la figura de las luces, dura 1.75s (o sea que se ve el cambio y no parpadea) y sale
      // de `songT`, asi que rebobinar lo rebobina. Los rayos van en los compases IMPARES: medido,
      // ahi caen 37 de las 60 marcas del acid y con los pares solo 23, o sea que los impares son
      // los que tienen algo que descargar. El fogonazo del snare NO mira esto: ahi el rig esta
      // apagado por el `dark` y el rayo es el efecto.
      this.arcTurn = this.dec("arcs")
        && Math.floor((t - (this.lv?.off ?? 0)) / (this.lv?.bar ?? 1.846)) % 2 !== 0;
      // EL APAGON DE LA VOZ: el tramo donde habla el cantante y vuelan las letras. Es el mismo
      // negro que el `flash` del nivel 1, declarado por fila en vez de por seccion.
      this.dark = fxo("dark") ? 1 : 0;
      this.beam = fxo("beam");
      // LA PANTALLA POR CUATRO (`fx` de tipo `grid`): ver `setGrid`. Se lee aca con los otros tramos
      // pero se APLICA al final de `draw()`, porque lo que hace es COPIAR el cuadro ya dibujado.
      this.grid = !!fxo("grid");
      // EL TIRON DE LAS HELICES (`fx` de tipo `spin`): el reactor gira lentisimo todo el nivel
      // (una vuelta cada 16 compases, ver `drawReactor`) y en dos sitios marcados da UNA VUELTA
      // ENTERA con ease in/out, la primera hacia un lado y la segunda hacia el contrario.
      // La vuelta es ENTERA a proposito: fuera del tramo el extra vale 0, y como `SPIN_TURNS` es
      // un numero redondo de vueltas la pieza termina exactamente donde arranco, o sea que
      // volver a 0 no se ve. Con una fraccion habria un salto al salir del tramo.
      // La curva es `p^2(3-2p)`: velocidad 0 en las dos puntas, que es lo que se pidio.
      const fsp = fxo("spin");
      this.spin = 0;
      if (fsp) {
        const t0 = timeOfRow(fsp.from, this.lv), t1 = timeOfRow(fsp.to + 1, this.lv);
        const p = Phaser.Math.Clamp((t - t0) / (t1 - t0), 0, 1);
        this.spin = (fsp.dir ?? 1) * SPIN_TURNS * Math.PI * 2 * p * p * (3 - 2 * p);
      }
      // LAS ESQUIRLAS, leidas ACA y no dentro de `drawBurst`: el estallido ademas manda el nivel
      // entero a FANTASMA mientras dura (se reporto que "a veces se ven y a veces no", y es que
      // gris y negro sobre una pantalla llena de cyan no se despegan de nada). En blanco y negro
      // el metal es lo unico que hay, o sea que el estallido se lee siempre igual.
      this.burst = 0;
      if (this.dec("burst")) for (const c of cues) {
        if (c.role !== "fx" || c.fx) continue;
        const p = (t - c.t) / BURST_T;
        if (p >= 0 && p < 1) this.burst = Math.max(this.burst, 1 - p);
      }
      // LA SACUDIDA DE CADA MARCA (`fx` de tipo `jolt`). Se pidio que en cada marca del acid del
      // drop "cambie algo de golpe y despues vuelva a lo normal CON UNA VARIACION", y son dos
      // cosas distintas y no una: el GOLPE (`this.jolt`, 0.35 de beat = 153ms de fantasma, o sea
      // el nivel entero en blanco y negro un instante) y el ESTADO (`this.mk`, cuantas marcas van),
      // que es lo que queda cuando el golpe se apago: rota la familia de color (ver `get neon`) y
      // da vuelta la forma de la ola. O sea que no vuelve a lo mismo, vuelve a otra cosa.
      // 0.35 y no mas: medido sobre el schema, las 28 marcas del drop2 tienen huecos de **min
      // 226ms (0.52 beat) y mediana 569ms**, asi que con 153ms el par mas apretado deja 73ms de
      // color entre golpe y golpe. Con medio beat los dos se fundirian en un apagon largo.
      // `this.lv.cues` y no `cues`: ese es `near()`, o sea SOLO las de alrededor del jugador, y
      // el numero de marca tiene que ser el GLOBAL o la paleta no rota (medido con `near()`: `mk`
      // se quedaba clavado en 1 durante todo el drop2, o sea que la variacion no existia).
      const mkn = fxo("jolt") ? markN(t, this.lv.cues) : null;
      this.jolt = mkn ? Math.max(0, 1 - mkn.age / (this.lv.beat * JOLT_B)) : 0;
      this.mk = mkn ? mkn.k : 0;
      // LA OLA POR SECCION (`wave` en LEVELS): `a` al empezar la seccion, `to` al terminarla, y
      // `mode` que forma. Se reporto que la ola "no se ve reactiva": es que su alpha solo
      // dependia del latido, o sea que la misma agua estaba puesta de punta a punta del nivel.
      // Ahora el buildup la lleva opaca y se va apagando hacia el apagon, el break la deja en 0
      // (ahi la pantalla es negra) y el drop la devuelve entera y CON OTRA FORMA.
      // Sin `wave` declarado da a=1 y mode=0, o sea lo que el renderer hacia antes del dial.
      const scw = this.lv?.sections?.find((x) => x.label === sec);
      const wv = this.lv?.wave?.[sec];
      const uw = scw ? Phaser.Math.Clamp((t - scw.start) / Math.max(1e-6, scw.end - scw.start), 0, 1) : 0;
      this.wave = wv
        ? { a: wv.a + ((wv.to ?? wv.a) - wv.a) * uw, mode: wv.mode ?? 0, shape: wv.shape ?? null }
        : { a: 1, mode: 0, shape: null };
      // ...y la marca la DA VUELTA (`jolt`): una marca si y otra no, el agua cambia de forma.
      // Es la variacion mas barata que existe (el otro `mode` ya esta medido: 8 -> 15 crestas en
      // z, 10 -> 8 a lo ancho) y no cuesta ni una llamada mas al Graphics.
      // El outrun (`mode` 2) se queda quieto: el `^ 1` da 3 y el `if (mode)` de `meshWave` pregunta
      // por verdadero, o sea que la cordillera se convertiria en el agua del nivel 2 en cada marca.
      if (this.mk & 1 && this.wave.mode < 2) this.wave.mode ^= 1;
      // EL RESPLANDOR DEL HORIZONTE tambien va por seccion (`sky.mode`, ver `drawSky`). Sale de
      // aca y no de dentro de `drawSky` para no volver a buscar la seccion: `uw` ya esta hecho.
      this.skyM = this.lv?.sky?.mode?.[sec] ?? null;
      this.secU = uw;
      // LA DERIVA DE TONO: cuantos grados esta girada la paleta AHORA (ver `hueAt` y `fantasma`).
      // Se lee aca, una vez por frame, y lo aplica la puerta del Graphics.
      this.hue = this.lv ? hueAt(t, this.lv) : 0;
      // EL CONTRATIEMPO: la corchea de en medio, medida sobre el audio (fase 0.505, ver
      // `hatAt`). No sale de ninguna cue porque en el schema no esta marcado: es la grilla.
      this.hat = this.lv && this.dec("hat") ? hatAt(t, this.lv) : 0;
      this.sec = sec;   // lo lee `drawBox` para saber con que animacion entran los obstaculos
      // EL FANTASMA es funcion de songT como todo lo demas, y aparece en dos lados:
      //  - la fila `GHOST_ROW` (la ultima del break, ya sin apagon y todavia sin drop), entera;
      //  - y despues **con las MARCAS**, la misma ventana que enciende las formas de los
      //    costados (`markWin`): prende EN una marca y apaga en la siguiente si estan a menos
      //    de 1.5 beats. En el drop eso es de #46 a #48 (f67-f68), de #52 a #54 (f71-f72), y
      //    asi: un destello de un beat por compas. Medido: 15 ventanas, 20% del drop, y 0% del
      //    buildup (ahi las marcas van filtradas y nunca caen tan cerca).
      // Lleve fantasma o no, `drawBars` dibuja la constelacion: van juntos.
      // Va por `decor` como el apagon: la `GHOST_ROW` es una fila del nivel 1 y su ventana de
      // marcas esta medida sobre SUS marcas. En el nivel 2 la marca es la linea del acid, que
      // esta abierta el 40% del buildup y el 69% del drop2, o sea que el nivel se pasaba mas de
      // media cancion en blanco y negro y su paleta cyan no se veia nunca. `P` lo sigue
      // forzando a mano en cualquier nivel: es una herramienta, no una capa del nivel.
      // ...y ademas un nivel puede pedirlo por TRAMO (`fx` de tipo `ghost`): el nivel 2 se va a
      // fantasma de la f90 al final, que es donde para el haz recto y arranca el otro.
      // ...y ademas lo TRAEN los dos efectos de metal: el fogonazo del snare (`snap`) y las
      // esquirlas (`burst`). Los dos son gris y negro, o sea que en color se hunden contra el
      // cyan del nivel y en blanco y negro son lo unico que hay en pantalla.
      // ...y lo trae tambien la SACUDIDA de cada marca del acid (`jolt`): es el golpe, y el
      // blanco y negro es el cambio mas grande que se puede hacer sin mover un solo pixel de
      // sitio, o sea sin tocar la lectura de la pista.
      this.ghost = this.ghostKey || !!fxo("ghost") || this.snap > 0.01 || this.burst > 0.02
        || this.jolt > 0.01
        || (this.lv && this.dec("ghost")
          ? rowAt(t, this.lv) === GHOST_ROW || markWin(t, this.lv.cues, this.lv.beat) > 0.02
          : false);
      // y que figura dibuja la constelacion: una por destello (`FIGS`), en orden
      this.fig = this.lv ? flashIdx(t, this.lv.cues, this.lv.beat) : 0;
  
      // WOOBY + QUAKE: se mueve la PANTALLA entera, no el mundo. Es un translate del canvas,
      // asi que no toca la proyeccion ni la fisica: se choca exactamente igual que con la
      // pantalla quieta, y como sale de `songT` y del kick, rebobinar lo rebobina.
      //  - wooby: vaiven lento de 2 compases (3.69s), siempre, +-16px.
      //  - quake: solo en el DROP y solo con el kick (`pulse^3`, o sea que entre kicks es 0):
      //    9.7Hz en x y 7.5Hz en y. El cubo es lo que lo hace un golpe y no un mareo.
      // EL GOLPE DEL SUELO NO PUEDE SALIR DE `pulse`. Medido sobre el drop2 de `orbit-motion`,
      // `pulse` vale 0 el **100%** del tramo (ese drop no tiene ni un evento de `bass`), o sea
      // que el temblor estaba APAGADO justo en el drop: eso es el "el reactor no se mueve en el
      // beat y no hay sacudida" que se reporto. Lo que si existe siempre es la GRILLA, y el kick
      // esta ahi: medido sobre el audio, hay un kick real en la fase 0.0 en el **95.8% de los
      // beats (158/165)** y en **31 de los 32 beats del drop2**.
      // `this.kik` = max(lo que suena, el metronomo), el mismo idiom que `this.lat`, y solo en
      // los niveles que declaran `metro`: el nivel 1 no lo declara, o sea que ahi `kik === pulse`
      // y no cambia un pixel (comprobado: 0 px de diferencia contra HEAD en t=12/36.3/50.2/65 y
      // en las tres camaras). Medido sobre los 841 frames del drop2 del nivel 2: el temblor pasa
      // de **0.00px de recorrido y 0% de frames sacudiendo** (con `pulse`, que ahi es 0 entero) a
      // **+-22.4px en x, +-16.4 en y y el 31.4% de los frames por encima de 2px**.
      this.kik = this.lv?.metro ? Math.max(pulse, gridAt(t, this.lv)) : pulse;
      const wob = Math.sin((t / ((this.lv?.bar ?? 1.846) * 2)) * Math.PI * 2) * 16;
      // ...y ademas la CRECIENTE lo empuja: en el pico sacude el doble que al entrar.
      const qk = sec === (this.lv?.dropSec ?? "drop") ? this.kik ** 3 * (1 + (this.hype ?? 0)) : 0;
      const qx = wob + Math.sin(t * 61) * 13 * qk, qy = Math.sin(t * 47) * 9 * qk;
      // el haz (`drawBeam`) se dibuja fuera del temblor pero su charco va en el PLANO DEL SUELO:
      // sin esto se quedaria quieto mientras la pista se sacude y se despegaria del carril.
      this.qx = qx; this.qy = qy;
      g.translateCanvas(qx, qy);
      // cielo + capas de detalle + suelo. El plano y=0 llena la mitad de pantalla del lado
      // en el que esta la camara: con la gravedad invertida (camY<0) la pista se va arriba
      // y tapa las capas. El salto de lado cae justo cuando el plano esta de canto.
      // Los dos rectangulos de base van 60px pasados de cada lado: con el temblor puesto, uno
      // del tamano exacto de la pantalla deja una franja sin pintar en el borde.
      g.fillStyle(this.bgMode === 2 ? 0x000000 : mix(tint, 0x000000, 0.15), 1);
      g.fillRect(-60, -60, w + 120, h + 120);
      // ANTES DEL SUELO: ahi el rig vive en el CIELO y los edificios lo tapan. Con `rigOver` no:
      // se dibuja al final, sobre el mundo entero (ver abajo). Se reporto asi, y se deja el dial
      // porque puede querer volverse atras.
      if (this.bgMode !== 1 && this.dec("rig") && !this.rigOver && !this.arcTurn) this.drawRig(w, h, pulse);
      g.fillStyle(ground, 1);
      g.fillRect(-60, this.camY >= 0 ? this.horizon : -60,
        w + 120, (this.camY >= 0 ? h - this.horizon : this.horizon) + 60);
      // el resplandor del horizonte va sobre los dos rectangulos de base y DEBAJO del reactor:
      // es lo que hace que el reactor tenga algo contra que estar (ver `drawSky`).
      if (this.bgMode !== 1) this.drawSky(w, h);
      // los anillos de resonancia van entre el resplandor y el reactor: son el FONDO contra el
      // que esta el reactor, no un adorno por delante de el.
      if (this.bgMode !== 1 && this.dec("rings") && this.reac) this.drawRings(w, h);
      // el reactor va entre los dos rectangulos de base y el resto del mundo: el punto de fuga
      // cae EN el horizonte, o sea justo en la junta, y dibujado antes el suelo le comeria la
      // mitad de abajo. Delante del color de fondo y detras de todo lo demas.
      if (this.bgMode !== 1 && this.dec("reactor") && this.reac) this.drawReactor(w, h);
      if (this.bgMode !== 1) this.drawLayers(w, pulse);   // despues del suelo: de cabeza van del otro lado
  
      // bandas del suelo: una por beat, asi la pista misma marca el tempo. La banda que cae en
      // el 1 del compas va encendida (color de la seccion), o sea que la pista tambien cuenta
      // los compases y el suelo deja de ser siempre el mismo gris.
      const band = this.lv ? this.lv.beat * this.speed : 200;
      const off = (((t * this.speed) % band) + band) % band;
      // el color de la seccion sale del NIVEL (`neon.sec` en LEVELS), no del renderer: el
      // nivel 1 declara exactamente este mapa (drop rosa / break accentSoft / resto violeta) y
      // el 2 el suyo, cyan. Antes el nivel 2 pintaba su marco y su suelo de violeta.
      const secColor = this.lv?.neon?.sec?.[sec] ?? this.lv?.neon?.def ?? PALETTE.violet;
      // la fila de la banda de mas lejos; de ahi para aca se va restando de a una
      const r0 = this.lv ? rowAt(t, this.lv) : 0;
      const b0 = Math.floor(t / (this.lv?.beat ?? 0.4615));
      // la cuna: de SPAWN_Z al punto de fuga, para que la pista no corte con un canto duro
      // (ver `drawFar`). Va antes de las bandas: ellas se dibujan encima y tapan la junta.
      this.drawFar(secColor);
      for (let z = SPAWN_Z, i = Math.round((SPAWN_Z - PLAYER_Z) / band); z > this.zn; z -= band, i--) {
        const z0 = Math.max(z - off, this.zn), z1 = Math.max(z - off + band / 2, this.zn);
        if (z1 <= this.zn) continue;
        const uno = (((b0 + i) % 4) + 4) % 4 === 0;   // el 1 de cada compas
        // SECTOR: cada tramo de filas tinta su pedazo de piso (`sectors` en LEVELS). Una banda
        // = una fila, asi que el corte del sector se ve como una junta en el suelo y se sabe en
        // que tramo del tema estas mirando la pista. Fuera de todo sector manda la seccion.
        const secCol = sectorOfRow(r0 + i, this.lv?.sectors)?.color ?? secColor;
        // TODAS las bandas laten, no solo la del 1: el suelo era lo unico de la pista que no se
        // movia con la musica. La del 1 ademas va encendida, asi que se sigue pudiendo contar
        // compases mirando el piso.
        // 0.32 de tinte base y no 0.45: medido en pantalla, con 0.45 el sector se comia la
        // pista entera y el suelo dejaba de ser suelo. El sector tiene que CAMBIAR un poco el
        // color, no pintarlo.
        // Late con `this.lat` y no con `this.beat`: en el nivel 2 el suelo se quedaba quieto el
        // 40% del tema (el outro no tiene cues). En el nivel 1 los dos son lo mismo.
        g.fillStyle(uno ? secCol : mix(PALETTE.surfaceLight, secCol, 0.32 + 0.35 * this.lat),
          uno ? 0.22 + 0.3 * this.rave + 0.45 * this.lat : 0.28 + 0.4 * this.lat);
        // de perfil (2D) la x del mundo no proyecta: z es el eje horizontal, o sea que la
        // banda es una franja vertical del lado del suelo, no un cuadrilatero en fuga
        if (this.cam.flat) {
          const a = this.proj(0, 0, z0).x, b = this.proj(0, 0, z1).x;
          g.fillRect(Math.min(a, b), this.camY >= 0 ? this.horizon : 0,
            Math.abs(b - a), this.camY >= 0 ? h - this.horizon : this.horizon);
          continue;
        }
        // 35 por fuera del borde de la pista, o sea que la banda desborda un poco los divisores.
        // Medido a 900x640: con 3 carriles el borde de la banda (±290) proyecta en x=721 de 900
        // y con 4 (±375) en x=800. Entra, pero es lo mas ancho que se dibuja en el mundo.
        const bw = this.edge + 35;
        g.fillPoints([[-bw, z0], [bw, z0], [bw, z1], [-bw, z1]].map(([x, zz]) => {
          const p = this.proj(x, 0, zz);
          return new Phaser.Geom.Point(p.x, p.y);
        }), true);
      }
  
      // lane dividers (en 2D no hay carriles que dividir: los tres son el mismo)
      if (!this.cam.flat) {
        // violeta y no accent: el accent es ahora el color de los obstaculos que se pasan con
        // una tecla, y dos rayas del mismo color cruzando la pista los diluian.
        g.lineStyle(2, this.neon[0], 0.45);
        // los divisores son los BORDES de los carriles, o sea `lanesX(N+1)`: N+1 lineas a medio
        // paso de cada centro. Con 3 da los cuatro de siempre ([-255,-85,85,255]) y con 4 da
        // cinco ([-340,-170,0,170,340]), o sea que la linea del medio aparece sola.
        for (const lx of lanesX(this.lanes + 1)) {
          const n = this.proj(lx, 0, this.zn + 10), f = this.proj(lx, 0, SPAWN_Z);
          g.lineBetween(n.x, n.y, f.x, f.y);
        }
      }
  
      // la malla va PRIMERA del bloque del mundo: es lo mas de atras del decorado y comparte
      // sitio con el barrido (`drawRave`), que hace lo mismo en el mismo plano.
      if (this.dec("lights")) this.drawLights();
      if (this.dec("mesh")) this.drawMesh();
      if (this.dec("pins")) this.drawPins();
      if (this.dec("gates")) this.drawGates(sec);
      if (this.dec("shapes")) this.drawShapes();
      if (this.dec("rave")) this.drawRave(cues);
      if (this.nums && this.lv) this.drawRowNums();
      if (this.marks) this.drawCueLines(cues);
      this.drawFlipGates(cues);
  
      // obstaculos y orbs: de lejos a cerca. Grabando no se dibuja ninguno: la gracia es
      // correr la pista vacia con las lineas, y que los obstaculos salgan de lo que hiciste.
      // en 2D solo se dibuja lo de la zona: fuera de ella hay tres carriles, y de perfil
      // colapsan en la misma linea (una alfombra roja ilegible). La zona es de un carril
      // justamente para que ahi si se lea.
      const obs = this.recOn ? []
        : cues.filter((c) => (c.role === "obstacle" || c.role === "orb")
            && (!this.cam.flat || zoneOfRow(c.row, this.lv)))
            .sort((a, b) => b.t - a.t);
      for (const c of obs) {
        const z = zOf(c, t, this.speed);
        if (c.role === "orb") this.drawOrb(c, z);
        else if (c.kind === "gap") this.drawGap(c, z);
        else this.drawBox(c, z);
      }
      // despues de las cajas: la guia de la zona va sobre el tunel o no se ve (las cajas
      // tambien son rojas). Dentro de la zona no hay cajas en esos carriles, no tapa nada.
      this.drawZoneTiles();
      this.drawOrbHint(obs);
  
      this.drawPlayer();
      g.translateCanvas(-qx, -qy);   // se acaba el temblor: el marco y los flashes van quietos
      // EL RIG SOBRE TODO (`rigOver`): se reporto que los laseres del fondo se veian solo en la
      // franja de arriba, o sea encerrados en el cielo por el orden de dibujo. Aca cruzan el
      // mundo entero, y por eso van a `RIG_DIM` de alpha (si no, tapan la pista).
      if (this.bgMode !== 1 && this.dec("rig") && this.rigOver && !this.arcTurn) this.drawRig(w, h, pulse);
      this.drawEdges(w, h, cues, t, secColor);
      if (this.dec("burst")) this.drawBurst(w, h, cues);
      if (this.arcTurn) this.drawArcs(w, h, mark);
      this.drawFlash(w, h, sec, t, pulse);
      if (this.dec("hat")) this.drawHat(w, h, sec);
      // el haz sale del reactor y cruza la pantalla: va por encima del mundo (como los rayos) y
      // por debajo del apagon y del gate, que son los dos que cortan la imagen entera.
      if (this.beam) this.drawBeam(w, h);
      // EL APAGON DE LA VOZ, justo antes del gate: los dos son negro a pantalla completa, y las
      // letras del acid son objetos de TEXTO de Phaser, o sea que sobreviven a los dos.
      if (this.dark) {
        g.fillStyle(0x000000, 1); g.fillRect(0, 0, w, h);
        // EL FOGONAZO DEL SNARE (`fx` de tipo `snap`, la f66): reactor + rayos POR ENCIMA del
        // apagon, o sea el unico sitio del nivel donde se ve al jefe antes del drop, y en
        // FANTASMA (`this.ghost` lo fuerza `snap`, ver `draw`). Va aca dentro y no en el bloque
        // del mundo justamente porque el apagon lo taparia: el orden ES el efecto.
        if (this.snap > 0.01) {
          if (this.dec("reactor")) this.drawReactor(w, h);
          this.drawArcs(w, h, this.snap, SNAP_ARCS, 1);
        }
      }
      this.drawAcid(this.lv ? fxAt(t, this.lv.cues, "acid") : null);
      // EL GATE VA EL ULTIMO: corta la imagen entera, o sea que tiene que estar por encima de
      // todo lo que dibuja el Graphics. Los textos (HUD, numeros de fila, tira) son objetos de
      // Phaser y van por encima igual, como en el apagon: son herramientas, no el juego.
      this.drawGate(w, h);
      if (this.marks) this.drawStrip(w, h);
  
      const rate = this.tp?.rate ?? 1;
      const mul = SPEED_MULS[this.mulIdx];
      const nxt = this.lv?.cues.find((c) => c.t >= t);
      const bar = this.lv ? Math.floor((t - this.lv.off) / this.lv.bar) + 1 : 0;
      // cuenta atras del flip: el porton de la pista dice DONDE, esto dice CUANDO
      const fl = this.lv?.cues.find((c) => c.role === "flip" && c.t > t && c.t - t < 3);
      this.hud.setText([
        `${t.toFixed(3)}s  c${bar}  f${this.lv ? rowAt(t, this.lv) : "-"}  ` +
          `${nxt?.section ?? "-"}  #${nxt?.n ?? "-"} ${nxt?.tag ?? ""}`,
        `x${rate}${this.tp?.playing ? "" : "  ||"}` +
          `${this.tp?.loop ? `  LOOP ${this.tp.loop[0].toFixed(1)}-${this.tp.loop[1].toFixed(1)}` : ""}` +
          `  v=${Math.round(this.speed)}${mul !== 1 ? ` (x${mul})` : ""}  ${"*".repeat(Math.max(0, this.lives))}` +
          `${this.camIdx ? `  cam ${this.cam.id}` : ""}` +
          `${this.grav < 0 ? "  FLIP" : ""}${fl ? `  ⟲ GRAVEDAD ${(fl.t - t).toFixed(1)}s` : ""}` +
          `${this.dash > 0 ? `  DASH ${this.dash.toFixed(2)}` : ""}` +
          `${this.recOn ? `  REC ${this.rec.length}` : this.rec.length ? `  rec ${this.rec.length}` : ""}` +
          `${this.ghost ? "  FANTASMA" : ""}${this.neg ? "  NEG" : ""}` +
          `${this.godmode ? "  K" : ""}${this.muted ? "  MUTE" : ""}` +
          `${this.tp?.adj ? `  sync ${(this.tp.adj * 1000).toFixed(0)}ms` : ""}`,
      ].join("\n"));
      // se envuelve solo: la lista de teclas ya no entra en una linea a 900px
      this.hint.setWordWrapWidth(w - 40).setPosition(20, h - 32 - this.hint.height);
      if (this.tp?.playing) this.started = true;   // pausar es normal al disenar: no molestar
      // `msg` es un texto de Phaser, o sea que va por encima del Graphics: el cartel de muerto se
      // lee igual dentro del apagon del break o de un corte del gate, como el HUD.
      // ...y dice CUANTO llevabas: `songT` esta congelado en el choque, o sea que el porcentaje es
      // el del sitio donde moriste. Terminando el nivel `t` vale la duracion entera, o sea 100%.
      if (this.dead > 0) {
        const pct = Math.round(Math.min(1, t / (this.tp?.duration || 1)) * 100);
        this.msg.setText(`${this.lives ? "FIN" : "MUERTO"}  ${pct}%\n${this.dead.toFixed(1)}`);
      }
      this.msg.setPosition(w / 2, h / 2).setVisible(this.dead > 0 || !this.started);
      // LA PANTALLA POR CUATRO: lo ULTIMO de todo, porque copia el cuadro que se acaba de dibujar.
      this.setGrid(this.grid, w, h);
    }
,
    drawFlipGates(cues) {
      const g = this.g;
      const P = (x, y, z) => { const p = this.proj(x, y, z); return new Phaser.Geom.Point(p.x, p.y); };
      for (const c of cues) {
        if (c.role !== "flip") continue;
        const z = PLAYER_Z + (c.t - this.songT) * this.speed;
        if (z > SPAWN_Z || z < this.zn) continue;
        const to = -this.grav;   // el lado al que te manda: el contrario al que estas pisando
        const near = Phaser.Math.Clamp(1 - z / SPAWN_Z, 0.5, 1);
        // el medio porton va 65 por fuera del borde: cruza la pista entera y sobra un poco.
        // Medido: 320 con 3 carriles (el de siempre) y 405 con 4.
        const w = this.cam.flat ? 0 : this.edge + 65, h2 = 360;
        // el marco cruza el plano del suelo: por eso se lee que la pista sigue del otro lado
        const marco = [P(-w, -h2, z), P(-w, h2, z), P(w, h2, z), P(w, -h2, z)];
        g.fillStyle(PALETTE.lime, 0.1 * near);
        g.fillPoints(marco, true);
        g.lineStyle(Math.max(3, 9 * near), PALETTE.lime, near);
        g.strokePoints(marco, true);
        // chevrones espejados en el plano del suelo, apuntando a los DOS lados: se lee "se da
        // vuelta". Apuntando a uno solo se lee "agachate", que es otra tecla.
        for (const x of this.cam.flat ? [0] : this.laneX) {   // uno por carril, en su centro
          for (const lado of [to, -to]) {
            for (const d of [90, 220]) {
              const b = P(x, (60 + d) * lado, z);
              for (const s of [-1, 1]) {
                const q = P(x + s * 60, d * lado, z);
                g.lineBetween(b.x, b.y, q.x, q.y);
              }
            }
          }
        }
      }
    }
,
    drawOrbHint(obs) {
      const o = obs.filter((c) => c.role === "orb" && !this.hit.has(c.n) && c.t > this.songT)
        .sort((a, b) => a.t - b.t)[0];
      if (!o || o.t - this.songT > 1.6) return this.orbHint.setVisible(false);
      const k = KINDS[o.kind] ?? KINDS.orb;
      const z = Math.max(zOf(o, this.songT, this.speed) + k.d / 2, this.zn);
      const p = this.proj(this.cam.flat ? 0 : this.laneX[o.lane], ((k.y0 + k.y1) / 2) * this.grav, z);
      this.orbHint.setVisible(true).setPosition(p.x, p.y + (k.w + 22) * p.s)
        .setText(this.held() ? "↑ OK" : "MANTENER ↑")
        .setColor(this.held() ? HEX.green : HEX.pink);
    }
,
    drawZoneTiles() {
      if (this.cam.flat || !this.lv?.zones?.length) return;
      const g = this.g, band = this.lv.beat * this.speed;
      const P = (x, zz) => { const p = this.proj(x, 0, zz); return new Phaser.Geom.Point(p.x, p.y); };
      for (let r = rowAt(this.songT, this.lv), n = 0; n < MAX_TILES; r++, n++) {
        const z = PLAYER_Z + (timeOfRow(r, this.lv) - this.songT) * this.speed;
        if (z > SPAWN_Z) break;
        const zone = zoneOfRow(r, this.lv);
        if (!zone) continue;
        const z0 = Math.max(z, this.zn), z1 = Math.max(z + band, this.zn);
        if (z1 <= this.zn) continue;
        // se dibuja sobre el tunel, que tambien es rojo: sin el contorno la guia no se ve
        const a = Phaser.Math.Clamp(1 - z / SPAWN_Z, 0.35, 0.7);
        for (const lane of this.laneIdx) {
          if (lane === zone.lane) continue;
          // ±85 = medio paso, y el paso no cambia con N: el carril mide lo mismo con 3 y con 4
          const x0 = this.laneX[lane] - 85, x1 = this.laneX[lane] + 85;
          const quad = [P(x0, z0), P(x1, z0), P(x1, z1), P(x0, z1)];
          g.fillStyle(COLORS.block, a);
          g.fillPoints(quad, true);
          g.lineStyle(2, PALETTE.text, a);
          g.strokePoints(quad, true);
        }
      }
    }
,
    drawRowNums() {
      const tiles = this.nums === 2;
      let i = 0;
      // desde la fila siguiente: la actual ya paso al jugador y su numero cae fuera de la pista
      for (let r = rowAt(this.songT, this.lv) + 1; i < MAX_TILES; r++) {
        const z = PLAYER_Z + (timeOfRow(r, this.lv) - this.songT) * this.speed;
        // `this.lanes` y no un 3: con 4 carriles y poca velocidad la fila entraba con i=45 y
        // escribia en `tileLabels[48]` (undefined) -> TypeError.
        if (z > 2600 || i + (tiles ? this.lanes : 1) > MAX_TILES) break;
        if (z < this.zn) continue;   // en 1a persona las filas ya pisadas quedan detras
        const alpha = Phaser.Math.Clamp(1 - z / SPAWN_Z, 0.2, 0.9);
        for (const lane of tiles ? this.laneIdx : [-1]) {
          // el f<n> va 27 por FUERA del borde: dentro caeria encima del carril de afuera.
          // Medido: -282 con 3 carriles (el de siempre) y -367 con 4.
          const p = this.proj(lane < 0 ? -(this.edge + 27) : this.laneX[lane], 1, z);
          this.tileLabels[i++].setVisible(true).setPosition(p.x, p.y - 2)
            // el tile va con N: `tiles()` en music.js resuelve las directivas con `lanes`, o
            // sea que sin el tercer argumento el nivel 2 mostraba 33 donde el guion pide 43.
            .setText(tiles ? `${tileOf(r, lane, this.lanes)}` : `f${r} ${this.rowGlyph(r)}`)
            .setAlpha(alpha);
        }
      }
    }
,
    rowGlyph(r) { return rowGlyph(r, this.byRow, this.lv, this.laneIdx); }
,
    drawCueLines(cues) {
      const g = this.g;
      let li = 0;
      // las lineas numeradas cruzan la pista entera y sobran 45 de cada lado (300 con 3
      // carriles, 385 con 4): mas cortas que la pista, el carril de afuera se quedaria sin
      // marca y es justo lo que se referencia al dictar.
      const lw = this.edge + 45;
      // linea de impacto: donde el centro del obstaculo pisa al jugador (en 1a persona
      // esta a los pies de la camara, o sea detras del plano cercano: no se dibuja)
      if (PLAYER_Z >= this.zn) {
        const a0 = this.proj(-lw, 1, PLAYER_Z), b0 = this.proj(lw, 1, PLAYER_Z);
        g.lineStyle(2, PALETTE.text, 0.45);
        g.lineBetween(a0.x, a0.y, b0.x, b0.y);
      }
  
      for (const c of cues) {
        const z = PLAYER_Z + (c.t - this.songT) * this.speed;
        if (z < this.zn) continue;
        const col = TAG_COLORS[c.tag] || PALETTE.text;
        const alpha = Phaser.Math.Clamp(1 - z / SPAWN_Z, 0.15, 0.9);
        const a = this.proj(-lw, 1, z), b = this.proj(lw, 1, z);
        if (c.dur) {  // marca con rango (la voz): banda hasta t+dur
          const z2 = Math.max(z - c.dur * this.speed, this.zn);
          const a2 = this.proj(-lw, 1, z2), b2 = this.proj(lw, 1, z2);
          g.fillStyle(col, alpha * 0.18);
          g.fillPoints([a, b, b2, a2].map((p) => new Phaser.Geom.Point(p.x, p.y)), true);
        }
        g.lineStyle(c.role === "obstacle" ? 3 : 2, col, alpha);
        g.lineBetween(a.x, a.y, b.x, b.y);
        // los obstaculos dictados por tile solo se etiquetan con T: en un nivel denso
        // son una fila por beat y los #tNNN se comen la pantalla. La grilla ya los numera.
        if (li < MAX_LABELS && z < 2600 && (typeof c.n === "number" || this.nums)) {
          this.labels[li++].setVisible(true).setPosition(b.x + 6, a.y + 4)
            .setText(`#${c.n}`).setColor(`#${col.toString(16).padStart(6, "0")}`)
            .setAlpha(Math.min(1, alpha + 0.2));
        }
      }
    }
,
    drawStrip(w, h) {
      if (!this.lv) return;
      const g = this.g, x0 = 20, y = h - 22, ww = w - 40, len = this.lv.length;
      const t0 = this.lv.doc.track.trim.start;
      g.fillStyle(PALETTE.surface, 0.9);
      g.fillRect(x0, y, ww, 8);
      this.lv.doc.sections.forEach((s, i) => {
        const a = ((s.start - t0) / len) * ww, b = ((s.end - t0) / len) * ww;
        g.fillStyle([PALETTE.violet, PALETTE.cyan, PALETTE.orange, PALETTE.green][i % 4], 0.7);
        g.fillRect(x0 + a, y, Math.max(1, b - a), 8);
      });
      if (this.tp?.loop) {
        const [a, b] = this.tp.loop;
        g.fillStyle(PALETTE.yellow, 0.35);
        g.fillRect(x0 + (a / len) * ww, y - 3, ((b - a) / len) * ww, 14);
      }
      // marcas de SECTOR: son a donde salta el clic, asi que se tienen que ver para poder apuntar
      for (const s of this.lv.sectors ?? []) {
        const t = timeOfRow(s.from, this.lv);
        if (t < 0 || t > len) continue;
        g.fillStyle(PALETTE.text, 0.55);
        g.fillRect(x0 + (t / len) * ww, y - 5, 1, 18);
      }
      g.fillStyle(PALETTE.pink, 1);
      g.fillRect(x0 + (this.songT / len) * ww - 1, y - 4, 3, 16);
      this.strip = { x0, y, ww, len };   // lo usa `stripSeek` (clic para saltar)
    }
,
    stripSeek(p) {
      const s = this.strip;
      if (!this.marks || !s || !this.lv) return false;
      if (p.x < s.x0 || p.x > s.x0 + s.ww || p.y < s.y - 8 || p.y > s.y + 20) return false;
      const t = ((p.x - s.x0) / s.ww) * s.len;
      if (p.event?.shiftKey) {
        this.seek(Math.max(0, Math.round((t - this.lv.off) / this.lv.bar) * this.lv.bar + this.lv.off));
        return true;
      }
      const row = rowAt(t, this.lv);
      const sec = (this.lv.sectors ?? []).find((q) => row >= q.from && row <= q.to);
      this.seek(Math.max(0, timeOfRow(sec ? sec.from : row, this.lv)));
      return true;
    }
,
};

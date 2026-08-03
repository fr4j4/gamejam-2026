// Constantes de configuracion del renderer, extraidas de AIRunnerGame.js.
// Funcion pura: no importa Phaser. `hash` es ruido determinista (misma i = mismo valor).
import { PALETTE } from "./theme.js";
import { SPAWN_Z } from "./physics.js";
// MODO JUEGO (`?play=1`, o sea entrando por el menu de `index.html`): sin marcas, sin numeros de fila, sin
// HUD, sin teclas de diseno y CHOCAR CUENTA. Su ausencia es el modo diseno de siempre, que es
// donde estan medidos todos los diffs de 0 pixeles del proyecto: sin el flag no cambia un byte.
export const PLAY = new URLSearchParams(location.search).has("play");
// una vida: muerto se congela el mundo en el sitio y se espera medio segundo de reloj REAL
// antes de volver a empezar. La espera sigue sin poderse saltar (es lo que evita machacar el
// reintento), pero a 3s cortaba el ritmo: el nivel entero va a 130-137bpm y 3s son 7 compases
// mirando una pantalla quieta. A 0.5 se lee el % y ya estas corriendo otra vez.
export const DEAD_T = 0.5;
export const RATES = [1, 0.5, 0.25, 0.1, 0.05];
export const RATE_KEYS = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];
// El nivel es violeta: TODO el decorado (pins, portones, formas, bandas del suelo) vive en
// esa familia. Los obstaculos se salen de ella a proposito, que es lo unico que hay que leer:
//  - lo que MATA (`block`, `gap`) es rojo y nada mas es rojo.
//  - lo que se PASA con una tecla (`low` saltar / `high` deslizar) es el ACCENT, los dos
//    igual: cual de las dos teclas lo dice el simbolo de la cara (GLYPH_UV), no el color.
// Los orbs NO se chocan, se agarran: amarillo el de dash, rosa el de salto.
// el rojo puro se salia del nivel: KILL es un magenta-rojo (60% hacia el rosa), o sea que
// sigue siendo el unico color caliente pero vive en la misma gama que el resto.
export const KILL = 0xed4679;
export const COLORS = {
  block: KILL, low: PALETTE.accentSoft, high: PALETTE.accentSoft,
  gap: KILL, orb: PALETTE.yellow, orbj: PALETTE.pink,
};
// LA FAMILIA ES DEL NIVEL, no del renderer: sale de `neon.fam` en LEVELS (ver `get neon`).
// Esto es solo el respaldo de los frames en los que todavia no cargo ninguno, y es la familia
// violeta del nivel 1, que la declara identica para que no se mueva un pixel.
// Sin rosa: el rosa quedo a un paso del KILL y el decorado no puede parecerse a lo que mata.
export const NEON = [PALETTE.violet, PALETTE.accentSoft, PALETTE.accent, 0x7c3aed];
// que pide cada celda, al lado del numero de fila (tecla T): se lee de un vistazo
export const GLYPH = { block: "#", low: "^", high: "v", gap: "_", orb: "o", orbj: "O" };
// el mismo simbolo, pero DIBUJADO en la cara del obstaculo: el color no dice que tecla es.
// Trazos en el espacio uv de la cara (u = ancho, v = 0 en el lado y1 de la caja), asi que
// con la gravedad invertida la cara se da vuelta sola y el chevron sigue apuntando al mismo
// lado del MUNDO: `low` se salta (apunta lejos del piso), `high` se desliza (apunta al piso).
// Son DOBLES (dos chevrones, no uno) y van de u=0.28 a u=0.72: un solo chevron chico se
// perdia contra el halo de la caja. La X del `block` vive en la mitad de abajo (v 0.52-0.95)
// porque ahi la cara es un TRIANGULO y arriba no hay ancho donde dibujarla.
export const GLYPH_UV = {
  low: [[[0.3, 0.6], [0.5, 0.2], [0.7, 0.6]], [[0.3, 0.95], [0.5, 0.55], [0.7, 0.95]]],
  high: [[[0.3, 0.05], [0.5, 0.45], [0.7, 0.05]], [[0.3, 0.4], [0.5, 0.8], [0.7, 0.4]]],
  block: [[[0.32, 0.55], [0.68, 0.94]], [[0.68, 0.55], [0.32, 0.94]]],
};
// A donde apuntan los pin spots (`drawPins`), en el plano (x, y) del MUNDO y para el tubo de
// la derecha; el de la izquierda va espejado. -x es hacia la pista.
export const PIN_DIRS = [
  [0, -1],    // v: al piso
  [-1, 0],    // <-: cruzan la pista de lado a lado
  [1, 0],     // ->: hacia afuera
  [-1, 1],    // <- + arriba
  [1, 1],     // arriba + ->
  [-1, -1],   // <- + al piso
];
// LAS FIGURAS DE LA CONSTELACION. Una por destello de fantasma, en orden: el primero (la f63)
// es el rombo de siempre y de ahi en mas van cambiando. `n` = lados, `rot` = angulo de arranque,
// `spin` = vueltas por compas (el signo es el sentido), `sway` = vaiven horizontal en pasos.
// El indice sale de las marcas que quedaron atras, o sea que rebobinar trae la misma figura.
export const FIGS = [
  { n: 4, rot: 0, spin: 0, sway: 0 },                 // rombo, quieto (el de siempre)
  { n: 6, rot: 0, spin: 0.25, sway: 0 },              // hexagono girando
  { n: 3, rot: 0, spin: 0, sway: 0.5 },               // triangulo con vaiven
  { n: 4, rot: Math.PI / 4, spin: -0.5, sway: 0 },    // cuadrado plano, girando al reves
  { n: 5, rot: 0, spin: 0.15, sway: 0.35 },           // pentagono
];
export const FLIP_T = 0.35;   // lo que tarda la camara en dar la vuelta (la gravedad cambia en la cue)
// Cuanto FLOTA el muneco, en unidades de mundo (PLAYER_H = 110). 1.2 = 1.8px en pantalla a
// v=700, o sea que se nota que no es una estatua y nada mas. Aca habia un bote de 5 (7.4px)
// y un vaiven de 1.4: los dos eran del muneco que corria, y sobre una pista PLANA y flotando
// no hay pisada que los justifique. Es lo que se veia como que se bamboleaba.
export const HOVER = 1.2;
// los trucos del salto: uno por salto, elegido con hash(cuando saltaste)
export const TRICKS = ["heli", "grab", "flip", "heli", "grab"];
// colchon para cobrar un orb que pasaste sin mantener. 150ms cubre el retraso humano que se
// midio en la grabacion (los saltos caian entre -109 y +119ms de la fila).
export const ORB_GRACE = 0.15;
// Cuanto dedo es un swipe y no un toque, en px de PANTALLA (no fraccion del ancho: el dedo
// mide lo mismo en un movil ancho que en uno angosto). 24 no esta medido en un telefono
// todavia: es el orden del "slop" de arrastre de iOS (10pt) con margen para el temblor.
export const SWIPE = 24;
export const TAG_COLORS = {
  kick: PALETTE.red, accent: PALETTE.yellow, voice: PALETTE.green,
  kicks: PALETTE.red, response: PALETTE.yellow, acidbass: PALETTE.green, snare: PALETTE.cyan,
};
export const MAX_LABELS = 26;
// Etiquetas de tile visibles a la vez. Sobra: los numeros se cortan en z=2600, o sea
// (2600-PLAYER_Z)/(beat*speed) filas. Medido: 3.84 filas x 3 carriles = 12 en el nivel 1
// (v=1060) y 3.07 x 4 = 13 en el nivel 2 (v=1400). El 48 es de cuando la pista iba a 700.
export const MAX_TILES = 48;
// La frase que vuela en el break la declara el NIVEL (`acid` en LEVELS); esto es el respaldo,
// o sea lo que decia el renderer antes de existir el dial. El pool de textos se dimensiona al
// mas largo que pueda pedir cualquier nivel, no a este: crear objetos de texto en `draw()`
// seria una fuga por frame.
export const ACID = "THIS IS ACID";
export const MAX_ACID = 24;
// LA MALLA DE ONDAS (`drawMesh`), la capa nueva del nivel 2. Cyan-verde sobre negro: `LO` es
// el valle y `HI` la cresta, o sea que la altura tambien se lee por color y no solo por forma.
// Ninguno de los dos es del `NEON` del nivel 1 a proposito: son fondos de niveles distintos.
// `LO` bien apagado (medido en pantalla: con 0x0a6f8c el valle todavia se leia como linea
// encendida y la ola salia plana; el contraste es lo que da la profundidad).
// Son el RESPALDO, no la unica paleta: el nivel puede declarar `mesh: { lo, hi }` (ver `LEVELS`
// y `loadLevel`). Sin declararlo salen estos dos, o sea lo que el renderer hacia antes del dial.
export const MESH_LO = 0x063a4a, MESH_HI = 0x5fffd0;
// LAS FRECUENCIAS DE LA OLA. periodo = 2*PI/k, y lo que hay que meter dentro es el ancho
// VISIBLE de un lado y la mitad cercana en z. El ancho ya no es fijo (`xi` y `xo` salen de la
// fila, ver `MESH_GAP` y `drawMesh`), asi que las cuentas de abajo van con el de la fila del
// medio, que era el ancho unico de antes: 1400 - (edge+200) = **860**, y en z de `zn` a la
// mitad de `MESH_FAR` = 1070.
// Antes: kx=0.0042 (periodo 1496) y kz=0.0031 (periodo 2027), o sea **0.58 crestas en el
// ancho y 0.53 en la mitad cercana**: menos de una onda entera en cuadro. Eso no ondula,
// BASCULA, y se lee como el suelo wireframe de los 80 con una cuadricula encima.
//   kx = 0.016  -> periodo 392.7 -> 860 / 392.7 = **2.19 crestas por lado**
//   kz = 0.0125 -> periodo 502.7 -> 1070 / 502.7 = **2.13 crestas en la mitad cercana**
//                                  (2140 / 502.7 = 4.26 en toda la profundidad dibujada)
// 0.016 seguia siendo poco: 2.19 crestas por lado se leen como dos lomas, no como agua. Se
// probaron 0.020 (periodo 314, 2.74 crestas) y **0.024** (periodo 261.8, 3.28) mirando la
// captura contra las fotos de referencia y gano 0.024: con 0.020 el campo cercano todavia son
// dos lomas largas. Nyquist se mide con el paso PEOR, que es el de las filas de mas lejos:
// 31 de paso contra 261.8 de periodo son 8.4 muestras (ver `xo` en `drawMesh`), o sea que
// `MESH_NX` se queda en 18.
// El tercero sigue siendo de periodo LARGO (2*PI/0.0017 = 3696, o sea 4 veces el ancho) y va
// en x+z: es lo que rompe la regularidad de los otros dos, que solos dan un damero.
export const MESH_KX = 0.024, MESH_KZ = 0.0125, MESH_KD = 0.0017;
// EL RIZO, el cuarto termino, y es del CAMPO CERCANO. Medido contando maximos locales de la
// ola sobre el ancho REALMENTE dibujado (que no es fijo: `xo` lo corta el borde de pantalla),
// con solo los tres senos de arriba: z=700 -> **1.08 crestas**, z=1500 -> 3.25, z=2500 -> 2.79,
// z=4000 -> 2.00. O sea que la fila mas cercana, que es la que mide 234px de cresta a valle en
// pantalla, era UN LOMO: se lee como que el terreno bascula, no como que ondula.
// No se arregla subiendo `MESH_KX`: el ancho de la fila cercana en el MUNDO es 289 (a z=1500
// son 863), asi que para meterle 3 crestas hace falta un periodo de ~96, y con el mismo peso
// la ola quedaria de 51px de alto por 48 de ancho, o sea picos y no olas.
// Se agrega una octava: periodo 83.8 (`MESH_KR`) con **0.4 de peso** contra 1 + 0.70 + 0.45 del
// resto, o sea +-19 del mundo = 37px en pantalla a z=700 sobre los 234 del oleaje. Medido con
// el rizo: z=700 pasa a **3.38 crestas** y las otras tres z no se mueven (3.25 / 2.75 / 2.00).
// Y se APAGA con la distancia (`MESH_RIP_Z` = 1000: entero en el jugador, cero en z=1720), que
// es lo que lo hace gratis en Nyquist: donde el paso entre columnas ya no lo resuelve (3.2
// muestras por periodo a z=1500) el termino vale 0.09 y su alias mide **4px** en pantalla.
// Va contra el tiempo (`-t*1.9`) y no a favor: el rizo corre hacia la camara y el oleaje se
// aleja, y ese cruce es lo que lo separa del fondo en vez de arrastrarlo.
export const MESH_KR = 0.075, MESH_RIP = 0.4, MESH_RIP_Z = 1000;
// DENSIDAD, y sale de Nyquist, no del gusto: el paso entre muestras tiene que estar bastante
// por debajo de MEDIO periodo o la ola se aliasa y vuelve a verse como una reja.
//  - columnas: 18 sobre 860 de ancho = **50.6 de paso**, o sea **7.8 muestras por periodo** en
//    x (el minimo de Nyquist es 2). Repartidas LINEALES y no con `u^1.7`: `proj` es lineal en
//    x (`x * fov/z`), asi que parejas en el mundo son parejas en PANTALLA. Medido a z=1500 y
//    h=651: **23.1px entre columnas, todas iguales**; con `u^1.7` iban de 17px entre las dos
//    internas a 107px entre las dos externas.
//  - filas: una cada 120 = **4.2 muestras por periodo** en z (eran 260, que con el periodo
//    nuevo darian 1.9, o sea por DEBAJO de Nyquist).
// Lo que paga las columnas es que las lineas de CRUCE van una de cada `MESH_CROSS`: la
// referencia son crestas largas, no una cuadricula.
// DENSIDAD MEDIDA CONTRA LA REFERENCIA, segunda vuelta. Con 18 columnas y una fila cada 120 la
// malla llenaba el **16.9% de la banda en la que tiene permiso de existir** y cualquier columna
// vertical de pantalla la cruzaban **9-12 polilineas**; en la referencia son decenas. Lo que
// manda ahi es `MESH_DZ`, no `MESH_NX`: las polilineas de una fila corren de lado a lado (son
// LAS CRESTAS, lo que la referencia tiene largo y seguido) y las de cruce solo las cosen.
//   dz 120 -> 70: de 33 a **57 filas**, o sea 1.7 veces mas crestas cruzando la pantalla.
//   nx  18 -> 28: paso de 17.0 a 10.7 del mundo en la fila cercana (16.6 -> 10.4px en pantalla)
//                 y de 50.7 a 32.0 a z=1500, que es lo que resuelve el rizo de arriba.
//   cross 4 -> 3: la cuadricula sigue siendo mas suelta que las crestas (una de cada tres).
// Lo paga el presupuesto: ver el coste medido en `drawMesh`.
// `MESH_NX` es el MINIMO de columnas por fila; el numero de verdad sale de `MESH_PX`, que es
// el paso en PANTALLA (16px). Ver `xo` en `drawMesh`: desde que el borde de afuera es el de la
// pantalla y no 1400 del mundo, las filas de lejos cruzan mucho mas ancho y con 28 columnas
// fijas el paso se les iba a 2.2 muestras por periodo. Con 16px de paso van de 28 (fila
// cercana) a 35 (las de lejos) y ninguna baja de 3 muestras por periodo.
export const MESH_NX = 28, MESH_PX = 16, MESH_DZ = 70, MESH_CROSS = 3;
// ALTO de la ola, en unidades de mundo y antes de multiplicar por el beat (0.45 + 0.55*beat).
// Era 78 y en pantalla la ola se leia como una arruga: medido a z=1500 y h=651, cresta a
// valle son 2*amp*fov/z px, o sea **71px con el kick arriba y 32 entre golpes**. Con 120 son
// **109px y 49**, que es cuando aparecen los valles oscuros de la referencia.
export const MESH_AMP = 120;
// SEPARACION DE LA PISTA, **en PIXELES de pantalla** y no en unidades de mundo. Era 45 de
// mundo (20.5px a z=1500, medido a h=651 con fov = h*1.05 = 683.6): la malla se pegaba a los
// divisores y se leia como que CRUZA la pista. Se subio a 200 de mundo, y eso arreglo el
// fondo pero rompio el campo CERCANO: 200 de mundo son 200*s px, o sea que a z=300 la malla
// arrancaba tan afuera que el **0%** caia dentro del canvas (12% a z=700, 54% a z=1100), y lo
// que se perdia eran justo las filas de pixeles mas grandes.
// En PANTALLA el hueco es casi el mismo a cualquier z: `xi = edge + 90/s(z)`, o sea que el
// borde interno se corre 197 del mundo a z=1500, 329 a z=2500 y solo 92 a z=700, que es lo que
// mete la fila cercana en cuadro. Medido, hueco en PIXELES entre el borde de la pista
// (`edge + 35`) y la primera columna de la malla:
//    z:            700    1500    2500    4000
//    antes (200):  161px   75px    45px    28px
//    ahora  (90):   56px   74px    80px    84px
// Antes iba de 161 a 28, o sea que la malla estaba lejisimos en el campo cercano y encima de la
// pista en el fondo. Lo que queda de variacion (56 -> 84) es la pista, que se angosta con la
// distancia (los 35 de la banda son mundo): el hueco propio de la malla es plano.
export const MESH_GAP = 90;
// NIEBLA PROPIA. Antes 1500, que con `a = (0.16 + 0.34*pulse) * (1 - f)` dejaba la malla por
// debajo de alpha 0.05 en z=1870: la malla moria en el aire, **36px mas abajo que el fondo de
// la pista** (medido: pixel mas alto y=322 contra 286), o sea un foso negro a los dos lados.
// Tiene que llegar tan lejos como la pista. `MESH_FAR` pasa a ser `SPAWN_Z`, que es hasta
// donde se dibuja el suelo, y la niebla se estira a 3400 para que la fila de SPAWN_Z todavia
// tenga alpha: con 2600 (lo primero que se probo) el alpha se anulaba en z=3320, o sea 304 en
// pantalla, y seguia sin llegar. Medido con 3400: la ultima fila viva cae en z~3890 y el pixel
// mas alto de la malla pasa de **y=322 a y=289**, o sea de 88 a 55 por debajo del horizonte.
// Los 55 que quedan no son un foso: ahi ya no hay pista contra la que compararse (la pista
// converge al punto de fuga y la malla va 90px por fuera), y el resplandor de `drawSky` es lo
// que ocupa esa banda. Cubre el **5.53%** del canvas contra el 2.31% de antes.
// El alpha ademas va por DEBAJO del de las bandas del suelo (0.28 + 0.4*beat): la malla es
// fondo y la pista es lo que se juega.
export const MESH_FOG = 3400, MESH_FAR = SPAWN_Z;
// DE PERFIL (ver `drawMeshFlat`) el campo son `MESH_FLAT_N` franjas repartidas entre estas dos
// alturas de MUNDO. `MESH_FLAT_Y` = la mas cercana (la de abajo): 380 del mundo proyecta en
// **y=221** y con la ola entera en el valle baja a **y=277**, o sea 94px por encima de los
// y=371 donde empieza lo que se juega (el techo de un `block`). Cruza el reactor (y 181..354),
// y eso es a proposito: ahi lo TAPA el (ver `tapa` en `drawMeshFlat`), que es lo que le da
// profundidad. Con 460 (lo primero que se probo) el campo quedaba entero por encima de el,
// apretado en 170px de cielo, y se leia como una cenefa.
// `MESH_FLAT_TOP` = la mas lejana: 670 del mundo proyecta en y=32 de 651, o sea que la ultima
// franja roza el borde de arriba del cuadro y el campo llena el cielo entero de esa camara.
// `MESH_FLAT_SKEW`: cuanto se corre la x del MUNDO por cada z. Sin esto (skew 0) cada franja
// es un corte a x FIJA, o sea que el unico termino que varia a lo largo de la pantalla es el
// de z (periodo 502 del mundo = 327px) y las 10 franjas salen con la MISMA forma, solo
// desplazadas: se leen como rayas paralelas y no como agua. Con 1.3 el termino rapido de x
// (periodo 261.8) entra tambien en el barrido y cae en **131px de periodo en pantalla**, o sea
// que bate contra el de z y la cresta deja de repetirse.
export const MESH_FLAT_N = 14, MESH_FLAT_Y = 340, MESH_FLAT_TOP = 660, MESH_FLAT_SKEW = 1.0;
// EL REACTOR mide `REACTOR_R` de la altura de la pantalla de radio NOMINAL; el radio real es
// el nominal por 486/512 (`radioMax()` de `reactor.js`), o sea `1.898 * REACTOR_R` de diametro.
// Era 0.3 = **57% del alto** (371px de 651): el objeto MAS GRANDE de la pantalla estaba en el
// punto mas LEJOS. Con 0.148 eran **28.1%** (183px de 651) y con 0.160 son **30.4%** (198px):
// se subio con el pedido de "jefe final", donde lo que crece es el ESTADO QUIETO, porque el del
// drop ya estaba topado por el cuadro (ver `REACTOR_SNAP`).
// `REACTOR_UP` sube el centro esa fraccion de su propio radio por encima del FONDO DE LA
// PISTA, que no es el horizonte: el horizonte analitico (`h*0.36` = 234.4, donde caeria
// z=infinito) esta **58.1px por encima** del sitio donde la pista de verdad muere, que es
// `proj(0,0,SPAWN_Z).y` = 292.5. Colgado del horizonte, el reactor dejaba **37..59px de cielo
// negro** entre la punta de la carretera y su borde de abajo (medido en captura: y=248 en el
// drop2, 233 quieto, 252 en el outro), o sea que se leia como un logo flotando y no como el
// jefe al final de la recta. El ancla es `proj(0,0,SPAWN_Z).y` y sirve en las TRES camaras
// sin un caso especial: de perfil `y=0` proyecta en `this.horizon` clavado (o sea el mismo
// numero de antes) y en 1a persona da 250.4, que es donde muere la pista desde ahi.
// `REACTOR_A` es el alpha global: lo mas lejano de la escena no puede ser lo mas saturado.
// EN LAS TRES CAMARAS se dibuja igual, y no hace falta un caso especial en ninguna:
//  - **1a persona**: el reactor va en espacio de PANTALLA y se cuelga de `this.horizon`, que
//    es el mismo en 1a persona que en atras (`h * (0.5 - 0.14*cos(roll))`), o sea que queda
//    exactamente donde estaba: entero por encima del horizonte y sin tapar un metro de pista
//    (verificado en captura). Con el 57% de antes si habia que sacarlo; con el 28% no.
//  - **lado**: antes cortaba con `cam.flat` y el nivel 2 de perfil era un vacio negro (la
//    malla y el reactor son lo unico que dibuja). Al ser espacio de pantalla, ahi tambien
//    sale bien: se cuelga del horizonte de esa camara (h*0.72) y queda sobre la ola.
// `REACTOR_UP` = **0.92** y no 1: el radio REAL del cuadro (486 nominales = 91.5px) es mayor
// que el semialto de lo que se DIBUJA (86.5px medido sobre la silueta), asi que 0.92 deja el
// borde de abajo 2px POR DEBAJO del fondo de la pista, o sea tocandolo. Con 1.0 quedaria un
// pelo colgado y con 0.75 (lo de antes, y ademas contra el horizonte) 44px en el aire.
// DE PERFIL manda `REACTOR_UP_FLAT`, que es otra cosa: ahi el ancla es la linea del suelo
// (h*0.72 = 468.7, que es donde proyecta y=0) y la banda donde se JUEGA va de 371 (el techo
// de un `block`) a 469. Con 0.75 el reactor caia en **y 293..467** (medido apagando la capa y
// restando los dos frames), o sea que el dia que el nivel 2 tenga guion el primer block
// entraria por detras de el. Con 2.2 quedaba en **y 176..350**, entero por encima de los 371.
// Al pasar `REACTOR_R` a 0.160 el radio crece un 8%, y `UP_FLAT` baja a **2.05** para que no se
// despegue hacia arriba: con el mismo 2.2 el centro subia a 0.386h (y 152..350) y ahi el reactor
// deja de rozar el suelo de perfil, que es su ancla. A 2.05 el borde de abajo del DIBUJO (0.945
// del radio del cuadro, medido sobre la silueta) cae en **y=359.5 de 651**, o sea 11.5px por
// encima del techo del `block`: el guion del nivel 2 pasa por delante y no por detras.
// `REACTOR_A` es el alpha con el que la escena lo manda al fondo, y NO es un multiplicador
// plano: `DIM` en `reactor.js` le pone una curva por pieza (el chasis se apaga mucho mas que
// las pantallas y el nucleo). 0.85 y no 0.5: desde que solo aparece en el drop ya no tiene
// que convivir con el buildup, y a 0.5 el jefe entraba lavado justo en el sitio donde se lo
// estrena. Efectivo por pieza a 0.85: chasis 0.69 / fondo 0.75 / rejilla 0.80 / luz 0.92 /
// traza 0.96 / nucleo 0.98 (contra 0.19 / 0.29 / 0.38 / 0.71 / 0.84 / 0.90 a 0.5).
export const REACTOR_R = 0.160, REACTOR_UP = 0.92, REACTOR_UP_FLAT = 2.05, REACTOR_A = 0.85;
// cuanto crece el reactor con la creciente (ver `reacAt`): +34% de radio en el pico
export const REACTOR_GROW = 0.34;
// EL FOGONAZO DEL SNARE LO AGRANDA (`REACTOR_SNAP`, dentro de `reacAt`). Se reporto que el
// flash de la f66 tiene que ser "ultra visible y no un detalle sutil", y medido no lo era: el
// reactor del fogonazo media **32.0% del alto (208.6px de 651) y el del drop 37.6%**, o sea que
// el anticipo salia MAS CHICO que lo que anuncia. El techo esta medido y no elegido: para que
// el borde de arriba no se salga del canto hace falta `(1 + 0.05*lat)*(1 + S) <= 1.4604`, o sea
// S <= 0.391 con lat=1, **y eso vale con `REACTOR_R` en 0.148**: el techo escala con el radio,
// asi que con 0.160 baja a S <= 0.287 (1.4604 * 0.148/0.160 / 1.05) y el 0.35 de entonces se
// saldria del cuadro. Con **0.25** el fogonazo mide LO MISMO en pantalla que antes (en su fila
// `hype` vale 0.41, o sea `1.898*0.160*1.1394*1.25` = **43.25%** contra el
// `1.898*0.148*1.1394*1.35` = 43.20% de antes) y sigue siendo lo mas grande del nivel: el drop
// da 40.7% con `hype`=1 y 43.1% con el acercamiento en su pico. Un jefe cortado por el borde se
// lee como bug. La envolvente sigue siendo `(1-p)²`, o sea que crece de golpe y se desinfla
// dentro de su propia fila: no le queda nada prestado al drop.
export const REACTOR_SNAP = 0.25;
// SE MUEVE EN X y SE ACERCA. Los dos en fraccion de su propio radio, o sea que no hay que
// re-medirlos si cambia `REACTOR_R` ni si la creciente lo agranda. Los periodos son 4 y 8
// compases y no uno solo: con el mismo periodo el vaiven y el acercamiento pican juntos y se
// leen como UN movimiento; a 4 y 8 el acercamiento cae una vez en fase y la siguiente contra.
// ACERCARSE es sobre todo BAJAR y no agrandarse: el techo de arriba esta a 4.5px (con
// `hype`=1 el radio ya es 103.4 de los 122.4 que caben), o sea que el tamano no tiene de donde
// crecer sin (a) salirse del cuadro o (b) pasar al fogonazo del snare, que es lo mas grande
// del nivel y esta medido. Bajando, en cambio, hay pantalla de sobra: el borde de abajo se
// mete 0.275 radios por debajo del final de la pista, que sigue muy por encima de la banda de
// juego. `NEAR` es fraccion del radio, `NEAR_Y` es en radios hacia abajo.
export const REACTOR_SWAY = 0.22, REACTOR_NEAR = 0.06, REACTOR_NEAR_Y = 0.30;
// EL TIRON DE LAS HELICES (`fx` de tipo `spin`, ver `draw`): cuantas VUELTAS ENTERAS da el
// reactor dentro del tramo. Entero y no fraccion: el extra vuelve a 0 al salir del tramo, y
// solo con vueltas enteras eso cae exactamente en la orientacion donde arranco (con media
// vuelta habria un salto). 1 vuelta en un tramo de 2 filas (0.876s) son 3 pasadas de ala, o
// sea 3.4Hz: se lee como que arranca, gira y frena, que es lo que pide el ease in/out.
export const SPIN_TURNS = 1;
// LA SACUDIDA DE CADA MARCA (`fx` de tipo `jolt`): cuanto dura el golpe, en BEATS. Ver `draw`.
// 0.18 y no 0.35, y el numero sale de MEDIR el tramo del drop donde todavia hay color (f68-f89,
// 9.64s: de la f90 para adelante el nivel ya esta declarado en fantasma). Con 0.35 (153ms) el
// golpe dejaba ese tramo **46.9% en blanco y negro** (31.4% puesto por el jolt) y parpadeando a
// **2.08Hz**, o sea que media parte coloreada del drop era monocroma: eso se come justo lo que
// se pidio en el mismo mensaje (el color del reactor y la deriva de tono). Con 0.18 (79ms, unos
// 5 frames a 60fps) el golpe se sigue leyendo entero -la envolvente arranca en 1- y el tramo
// vuelve a ser de color.
export const JOLT_B = 0.18;
// EL CIELO EN COLUMNAS (`sky.mode` = `drift`, ver `drawSky`). `SKY_DRIFT_N` = cuantas de las
// franjas de abajo se parten: solo las pegadas al horizonte, porque mas arriba el alpha ya
// cayo (a la 8a de 20 vale `(1-8/20)^2` = 0.36 del tope) y partirlas seria coste sin imagen.
// `SKY_COLS` = 16 y no 8: con 8 cada columna mide 84px de un cuadro de 1248 y la onda se lee
// como bloques; con 32 el ancho de columna (42px) baja del de la ola de la malla y compiten.
export const SKY_COLS = 16, SKY_DRIFT_N = 8;
// LAS CRESTAS FACETADAS (`wave[sec].shape` = `"pyra"`, ver `drawMesh`). `PYRA_THR` es la altura
// de la ola (en -1..1) a partir de la cual una cresta se rellena.
// LA FACETA VIVE EN UNA RETICULA MAS GRUESA QUE EL ALAMBRE, y eso no es gusto: la celda de la
// malla mide `MESH_PX` = 16px de ancho (sale de Nyquist) por la separacion entre filas, o sea
// 33px en z=700 y 7px en z=1500. Cualquier faceta hecha sobre esa celda mide ~19x12px, y a 238
// por frame eso es confeti, que es lo que se reporto dos veces. Encima el criterio de maximo
// local se quedaba con UNA celda de una mancha de cresta que mide 2.53 columnas x 1.69 filas, o
// sea un cuarto: medido, el 76% de las facetas no tocaba a ninguna otra. Con paso `PYRA_NX` en x
// y `PYRA_DZ` en z se indexan los MISMOS `row`/`hs` (cero puntos nuevos) y salen 42 formas de
// 85x28px en vez de 238 de 19x12, con el 117% de adyacencia, o sea crestas seguidas y no puntos.
// `PYRA_A` baja de 0.55 a 0.32 porque la tinta sube de 3.18% a 5.62% del cuadro: tinta por alpha
// queda en 1.80 contra 1.75, o sea la misma, que es lo que deja la malla por debajo del suelo.
export const PYRA_THR = 0.6, PYRA_A = 0.32, PYRA_NX = 5, PYRA_DZ = 3;
// ANILLOS DE RESONANCIA METALICA (referencia 4), el fondo del nivel 2. Salen del punto de
// fuga hacia afuera: por eso no son una capa de `layers` (esas se desplazan de costado con el
// parallax y un anillo que se desplaza deja de ser un anillo concentrico).
// El PARALLAX de estos es RADIAL: `songT * speed * RINGS_K` los va abriendo, o sea que el
// fondo tambien viaja con la pista, que es lo que se pidio.
export const RINGS_N = 9, RINGS_K = 0.06, RINGS_STEP = 130, RINGS_SQ = 0.62;
// el blanco del contratiempo (`drawHat`). 0.14 y no 0.22 como el del kick del drop: ese cae
// una vez por beat y este otra vez mas, o sea el doble de destellos, y al mismo alpha el
// cielo se queda gris.
export const HAT_A = 0.14;
// rayos electricos (ref 3): cuantos MAS que el primero salen en el pico de la creciente, y
// cuantos salen de golpe en el fogonazo del snare (ahi `hype` ya viene cayendo hacia el break:
// vale 0.41 en la f66, o sea 2 rayos, y un fogonazo de dos rayos no es un fogonazo).
export const ARC_N = 3, SNAP_ARCS = 8;
// piramides de metal (ref 7): cuanto dura el estallido, de que tamano y cuantas.
// El color NO sale de la paleta del nivel: son gris y negro a proposito (metal), y por eso
// se leen igual en fantasma, que es donde el nivel las pide.
export const BURST_T = 0.55, BURST_R = 0.17, BURST_SH = 14;
export const BURST_LO = 0x2a3138, BURST_HI = 0xd8e2ea;
// el color del rig (`drawRig`) cuando el nivel no declara `neon.rig`: son las dos listas que
// estaban escritas dentro del renderer, y son distintas entre si (los focos no llevan
// accentSoft y el abanico arranca en cyan). Copiadas tal cual = el nivel 1 no se mueve.
export const RIG_SPOT = [PALETTE.violet, PALETTE.cyan, PALETTE.pink];
export const RIG_FAN = [PALETTE.cyan, PALETTE.violet, PALETTE.pink, PALETTE.accentSoft];
// EL HAZ DEL REACTOR (`beam`): cuanto baja por la pista y cuanto se abre.
// `BEAM_T` es lo que dura UN disparo en SEGUNDOS (y no una fraccion del hueco, ver `drawBeam`);
// `BEAM_Z0`/`BEAM_Z1` son la z del impacto al empezar y al terminar el barrido; `BEAM_PW`/
// `BEAM_PD` son el charco en el MUNDO (85 = medio paso de carril, el mismo que usa `drawGap`),
// y de ahi sale tambien el ancho del cono; `BEAM_PAIR` es cada cuanto salen DOS haces cruzados.
// `BEAM_A` sube de 0.30 a 0.45 porque el cono dejo de medir `w*0.10` = 124.8px fijos y ahora
// mide `BEAM_PW * s`, o sea 22.4px a z=2600 y 61.4px a z=946: entre 0.18 y 0.49 del viejo, o
// sea que a igual alpha el haz emite 2-5 veces menos luz. x1.5 lo deja igual por debajo.
export const BEAM_A = 0.45, BEAM_T = 0.35, BEAM_Z0 = 2600, BEAM_Z1 = 760;
export const BEAM_PW = 85, BEAM_PD = 150, BEAM_PAIR = 0.4;
// Cuanto se apaga el rig cuando cruza el mundo entero y no solo el cielo (`rigOver`). Medido en
// la BANDA DE JUEGO (la franja donde viven los obstaculos, y 332-419 de 582) en el buildup
// (t=10.7), luma media / p95: sin rig **20.32 / 48**, con rig a 0.55 **23.84 / 56**, con rig a 1
// **26.93 / 62**. O sea que 0.55 deja el aporte del rig en +3.52 en vez de +6.61: la mitad.
export const RIG_DIM = 0.55;
// ...y hasta donde BAJA. El rig cruzando el mundo entero se queda en la mitad de ARRIBA: abajo
// esta el jugador (de pie ocupa y 405..498 de 582) y ahi el laser lo tapa. Solo se lee con
// `rigOver` puesto; sin el dial el rig llega al borde de abajo como siempre (nivel 1).
export const RIG_CUT = 0.5;
// LUCES DE PISTA DE ATERRIZAJE (`lights`): a que distancia del borde, cada cuanto en z y de
// que tamano. El paso es MEDIO BEAT porque el chase de `chaseAt` cicla cada 4, o sea que la
// ola de luz tarda dos beats en recorrerse: a un beat por luz se lee como parpadeo suelto.
export const LIGHT_OUT = 120, LIGHT_R = 13;
// LAS LUCES DIBUJAN UNA FIGURA, no una fila recta (`LIGHT_SHP`, una por compas via `hash`).
// `k` = ciclos de la figura a lo largo de la pista, `ax` = cuanto se corre en x (unidades del
// mundo) y `ay` = cuanto sube en y. Vale la pena que `ax` sea grande: mover la luz 40 del
// mundo a z=3000 son 4px de pantalla, o sea nada. La primera es la recta de siempre.
export const LIGHT_SHP = [
  { k: 0, ax: 0, ay: 0 },        // recta: la de siempre
  // `k` = 2.5 y no 2: con un numero entero de ciclos por luz la fila entera se corre en bloque
  // (que es el "izquierda derecha izquierda derecha" que se reporto). Con 2.5 la onda CORRE a lo
  // largo de la pista, que es lo que se ve desde una cabina.
  { k: 2.5, ax: 190, ay: 0 },    // ola: la fila se abre hacia afuera y vuelve
  { k: 3, ax: 0, ay: 150 },      // saltos: la fila sube y baja del plano del suelo
  { k: 1.5, ax: 130, ay: 120 },  // helice: las dos cosas, desfasadas
];
// EL FOGONAZO DEL SNARE (`fx` de tipo `snap`): cuanto dura. 0.30s = 0.685 beats a 137bpm, o
// sea que se apaga dentro de su propia fila y el apagon del break se lo traga entero.
export const SNAP_T = 0.30;
// ruido determinista: misma i = mismo valor siempre, para que rebobinar de el mismo fondo
export const hash = (i) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };

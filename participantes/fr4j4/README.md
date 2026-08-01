# Deckstiny

Deckstiny es un juego de cartas PvP en español, construido con **Phaser 4** y HTML estático. Cada jugador elige una clase (mago, necromancer, guerrero, asesino o bardo), arma una baraja y se enfrenta en duelos por turnos.

## Cómo jugar

1. En el menú principal elige **Jugar vs Dummy** para probar una partida contra un oponente de práctica (100 HP / 100 armor, no juega cartas).
2. Para armar tu propia baraja ve a **Armar baraja**:
   - Paso 1: elige clase.
   - Paso 2: elige o crea un slot de baraja.
   - Paso 3: selecciona cartas hasta completar el mazo (mínimo 5 cartas). Usa **AUTO** para llenar copias máximas rápidamente.
   - Paso 4: revisa y guarda.
3. En combate:
   - Tu turno dura 60 segundos.
   - Arrastra o toca una carta de tu mano para jugarla (gasta maná).
   - Tus criaturas atacan automáticamente al final del turno.
   - Presiona **FIN DE TURNO** o la tecla **E** / **Enter** para pasar.
   - Presiona **☰** o **Esc** para abrir el menú de pausa.
   - Usa el botón **HEROE** para activar el poder de clase.

## Cómo ejecutar

No hay build. Solo sirve la carpeta raíz con cualquier servidor estático y abre `index.html`:

```bash
python3 -m http.server 8000
# abre http://localhost:8000/
```

No uses `file://` directamente porque los scripts de Phaser y las fuentes se cargan desde CDN.

## Estructura

- `index.html` — punto de entrada del juego.
- `js/main.js` — configura `Phaser.Game` (640×360, FIT, pixelArt).
- `js/constants.js` — constantes compartidas (resolución, maná, mano, tablero).
- `js/phaser-compat.js` — polyfills mínimos de Phaser 3 → 4.
- `js/data/classes.js` y `js/data/cards.js` — datos de clases y cartas.
- `js/scenes/` — escenas: Boot, Menu, Deck (builder), Game (combate), GameOver.
- `js/ui/` — fábricas de cartas, CRT scanlines y efectos visuales.

## Estado actual

- ✅ Menú, deckbuilder y combate modo test funcionales.
- ⚠️ Modos **IA** y **online** son placeholders (no implementados).
- ⚠️ Sin sprites, audio ni animaciones complejas; todo es UI vectorial + texto.
- ⚠️ No hay tests automatizados.

## Créditos

Autor: fr4j4 — Game Jam 2026.

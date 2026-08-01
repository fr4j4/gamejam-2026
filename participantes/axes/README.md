# TIMBIRICHE · v0.0.2

Juego local de **Dots and Boxes / Timbiriche** creado para el **GameJam 2026 de [KodingVibes.com](https://kodingvibes.com)**, comunidad de desarrolladores y vibecoders.

Dos jugadores comparten el mismo dispositivo. Cada turno se traza una línea entre puntos vecinos. Quien completa una caja suma un punto y conserva el turno; si no completa ninguna, el turno cambia. Gana quien reúne más cajas al cerrar el tablero.

## Ejecutar

No requiere instalación ni bundler. Sirve `participantes/axes/` con un servidor estático:

```bash
python3 -m http.server 8080 --directory participantes/axes
```

Abre <http://localhost:8080> en el navegador y elige un tablero de 3x3, 4x4, 5x5 o 6x6 puntos.

## Controles y flujo

- Mouse sobre una línea libre para ver el hover del jugador activo.
- Click en una línea para jugar.
- Completar una caja conserva el turno.
- `REINICIAR` solicita confirmación antes de borrar el progreso.
- `NO` o `Escape` cierran la confirmación sin modificar la partida.
- `SÍ` reinicia usando el mismo tamaño de tablero.
- Al terminar aparece el resultado, los puntajes y las acciones para volver a jugar o regresar al menú.

## Elementos principales

- Tablero SVG procedural con puntos, líneas, celdas y hitboxes amplias.
- Lógica pura y separada en `GameLogic.js`.
- HUD con puntajes, turno activo y feedback cyan/magenta.
- Panel de Game Over con ganador, empate, reinicio y regreso al menú.
- Modal reutilizable de confirmación para acciones destructivas.
- `GlitchButton` reutilizable con estados normal, hover, pressed, selected y disabled.
- Animación de líneas desde el centro hacia sus extremos.
- Expansión de cajas desde el centro de cada celda.
- Efecto experimental `BoxClaimGlitch`, desactivable desde `Constants.js`.
- Sonidos generados con Web Audio API, sin assets de audio externos.
- Carga explícita de fuentes antes de inicializar Phaser, con fallback y timeout.
- Favicon y branding del proyecto.

## Dirección visual

Estética **dark neon-cyberpunk** inspirada en el lenguaje visual de TAK-T-K:

- fondos oscuros y paneles rectos;
- gris para estados inactivos;
- cyan para Jugador 1 y magenta para Jugador 2;
- aberración cromática y glitch reservados para interacción y feedback;
- tipografías Orbitron, Rajdhani y Plus Jakarta Sans.

## Estructura

```text
css/styles.css                 estilos, capas DOM/SVG y responsividad
index.html                     entrada, fuentes, Phaser y favicon
js/main.js                     bootstrap y configuración Phaser
js/scenes/                     BootScene, MenuScene y GameScene
js/objects/                    Board, Line, Dot y Box
js/effects/                    efectos visuales aislados, como BoxClaimGlitch
js/ui/                         HUD, botones, textos y paneles
js/utils/Constants.js          colores, tipografías, layout y timings
js/utils/GameLogic.js          reglas puras y estado de la partida
js/utils/AudioManager.js       audio generado en código
```

## Notas técnicas

- Phaser se carga desde CDN; el juego usa JavaScript vanilla y no necesita compilación.
- El tablero vive en un SVG externo al canvas Phaser. Las capas y `pointer-events` separan las hitboxes de líneas del HUD y los botones.
- `Constants.js` centraliza la paleta, profundidades, tamaños y tiempos reutilizables.
- El flujo de fin de partida bloquea el tablero inmediatamente y presenta el panel tras un breve delay para apreciar la última animación.
- Los sonidos comienzan después de la primera interacción, respetando las restricciones de audio de los navegadores.

## Versión

`0.0.2` · base jugable pulida para GameJam 2026.

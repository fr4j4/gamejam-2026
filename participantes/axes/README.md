# Timbiriche — GameJam 2026

Fases 1–5 completadas: tablero SVG, partida local funcional, HUD, panel final, animaciones y sonidos generados en Phaser 4.

## Probar

Sirve esta carpeta con cualquier servidor estático, por ejemplo:

```bash
python3 -m http.server 8080 --directory participantes/axes
```

Luego visita <http://localhost:8080>. Elige un tamaño, traza líneas y completa una partida. Completar un cuadro conserva el turno; una línea sin cuadro lo cambia. El HUD muestra marcador y turno; `REINICIAR` comienza otra partida del mismo tamaño.

## Estructura

- `js/main.js`: configuración y entrada de Phaser.
- `js/scenes/`: arranque, menú y pantalla de partida.
- `js/objects/`: tablero, líneas, puntos y cuadros SVG.
- `js/ui/`: marcador, turno, reinicio y panel de fin.
- `js/utils/Constants.js`: dimensiones y colores compartidos.
- `js/utils/GameLogic.js`: reglas puras y estado inmutable del juego.
- `js/utils/AudioManager.js`: sonidos ligeros generados con Web Audio API.

Los sonidos se activan después del primer click, como exige la política de audio de los navegadores.

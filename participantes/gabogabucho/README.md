# ⛪ APÓCRIFO — gabogabucho

God game de control indirecto para la GameJam 2026 de kodingvibes (Fase 1). Hecho con **Phaser 4**.

Eres un dios a medias. Tu pueblo no sabe que existes, y tu fe es frágil. No puedes hablarles: solo puedes intervenir con **milagros de luz** (un rayo que baja del cielo), y dejar que lo lean como mejor sepan.

## Cómo jugar / ejecutar

Abre `index.html` en tu navegador. No requiere build ni instalación (Phaser se carga por CDN).

Alternativa (server local, evita posibles restricciones de `file://`):

```bash
python -m http.server 8080
# luego abre http://localhost:8080/participantes/gabogabucho/
```

## Controles

- **Clic izquierdo** — lanzar un milagro (rayo de luz). Cuesta 30 de Atención.
- **R** — reiniciar la partida.

## Cómo se juega (loop central)

- **Atención** es tu recurso: sube con los fieles que te creen (y baja al gastar milagros). Sin Atención, nadie mira — no puedes intervenir.
- Cada aldeano tiene un estado emocional que **migra solo**: hambre → miedo → duda → ciencia (y a veces fe). El mundo es feo: si no haces nada, el pueblo se te olvida.
- Un rayo convierte a la fe a quien lo presencia — **menos a la ciencia**, que prefiere medirlo antes que creerlo.
- La conversión no depende de suerte: hambre, miedo y duda → fe; la ciencia resiste. Cada impacto lo muestra sobre el aldeano.
- **Ganas**: 6+ fieles construyen la Catedral.
- **Pierdes**: todos caen en ciencia. Te olvidaron.

## Estado

- [x] Corte 0: escena Phaser 4 + ciclo de día/noche + parallax
- [x] Corte 1: milagro de luz (rayo con parpadeo) + el pueblo lo lee (veredicto)
- [x] Corte 2: estados emocionales (miedo/fe/hambre/duda/ciencia) que migran solos
- [x] Corte 3: bucle jugable — Atención como recurso, victoria (Catedral) / derrota (olvidado) + reinicio
- [x] Pulido: aldeanos caminando en carriles cortos sin solapar sus burbujas
- [x] Pulido: variedad visual con trabajadores, soldados, sacerdotes y un erudito
- [x] Pulido: rayo alineado al suelo, conversión legible, cielo atmosférico y terreno alineado
- [ ] Pulido: balance de Atención, feedback visual de la Catedral, sonido

## Debug

- `?debug` — vuelca el estado de todos los aldeanos en la esquina inferior.
- `?beam` — auto-lanza un milagro en el centro (fuerza 100 de Atención) para verificación.

## Assets

Arte individualizado del usuario en `assets/` (127 piezas con transparencia, extraídas de la hoja original y etiquetadas).

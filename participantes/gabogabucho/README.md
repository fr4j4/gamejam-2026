# ⛪ APÓCRIFO — gabogabucho

God game de control indirecto para la GameJam 2026 de kodingvibes (Fase 1). Hecho con **Phaser 4**.

Eres un dios a medias. Tu pueblo no sabe que existes, y tu fe es frágil. No puedes hablarles: intervienes con **asombro, miedo, humillación y consuelo**, y dejas que los humanos traduzcan esos gestos como puedan.

## Cómo jugar / ejecutar

Abre `index.html` en tu navegador. No requiere build ni instalación (Phaser se carga por CDN).

Alternativa (server local, evita posibles restricciones de `file://`):

```bash
python -m http.server 8080
# luego abre http://localhost:8080/participantes/gabogabucho/
```

## Controles

- **1** — seleccionar Asombro: convierte crisis/duda en fe; la ciencia resiste.
- **2** — seleccionar Miedo: fabrica crisis y prepara fervor.
- **3** — seleccionar Humillación: rompe certezas, incluso la fe y la ciencia.
- **4** — seleccionar Consuelo: resuelve hambre, pero empuja duda hacia ciencia.
- **Clic izquierdo** — aplicar el poder seleccionado donde está el cursor.
- **R** — reiniciar la partida.

## Cómo se juega (loop central)

- **Atención** es tu recurso: sube con los fieles que te creen (y baja al gastar milagros). Sin Atención, nadie mira — no puedes intervenir.
- Cada aldeano tiene un estado emocional que **migra solo**: hambre → miedo → duda → ciencia (y a veces fe). El mundo es feo: si no haces nada, el pueblo se te olvida.
- El péndulo va de **Crisis** a **Confort**. El centro no produce nada: es la irrelevancia.
- La Crisis produce fervor y regenera más Atención, pero degrada la aldea.
- El Confort construye casas, templos y Catedral, pero hace crecer duda y ciencia.
- La Catedral es un hito, **no una victoria**. Cuanto más hermosa la aldea, menos te necesita.
- **Pierdes**: todos caen en ciencia. Te olvidaron.

## Estado

- [x] Corte 0: escena Phaser 4 + ciclo de día/noche + parallax
- [x] Corte 1: milagro de luz (rayo con parpadeo) + el pueblo lo lee (veredicto)
- [x] Corte 2: estados emocionales (miedo/fe/hambre/duda/ciencia) que migran solos
- [x] Corte 3: bucle jugable — Atención como recurso, victoria (Catedral) / derrota (olvidado) + reinicio
- [x] Pulido: aldeanos caminando en carriles cortos sin solapar sus burbujas
- [x] Pulido: variedad visual con trabajadores, soldados, sacerdotes y un erudito
- [x] Pulido: rayo alineado al suelo, conversión legible, cielo atmosférico y terreno alineado
- [x] Corte 4: cuatro poderes emocionales + péndulo Crisis/Confort + prosperidad arquitectónica
- [ ] Pulido: balance de Atención, feedback visual de la Catedral, sonido

## Debug

- `?debug` — vuelca el estado de todos los aldeanos en la esquina inferior.
- `?beam` — auto-lanza un milagro en el centro (fuerza 100 de Atención) para verificación.
- `?power=miedo&cast` — selecciona y auto-lanza cualquier poder (`asombro`, `miedo`, `humillacion`, `consuelo`).
- `?prosper` — fuerza la etapa Catedral sin convertirla en victoria.

## Assets

Arte individualizado del usuario en `assets/` (127 piezas con transparencia, extraídas de la hoja original y etiquetadas).

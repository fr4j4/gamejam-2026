# Hero Sprites — Deckstiny

Convenciones y schema para los spritesheets de los héroes.

---

## 1. Archivos PNG

- **Ubicación:** `assets/heroes/<classId>.png`
- **Naming:** `<classId>` debe coincidir exactamente con `CLASSES[].id` (lowercase Spanish slug: `mago`, `necromancer`, `guerrero`, `asesino`, `bardo`).
- **Formato:** PNG con canal alfa (RGBA). Fondo transparente recomendado para que se vea sobre el campo de batalla.
- **Tamaño sugerido:** 1024×1024 px. Internamente dividido en un grid 4×4 (16 frames de 256×256). El motor **no asume** este grid: cada config declara su propio `frameSize`.

Si un día se necesita un spritesheet más grande o con un layout distinto, basta editar el archivo `js/data/sprites/heroes/<id>.js` del héroe correspondiente. **No se toca el motor.**

---

## 2. Schema de configuración

Cada héroe tiene un archivo `js/data/sprites/heroes/<id>.js` que expone un objeto en `window.HERO_SPRITE_<ID>` (ID en mayúsculas). Ejemplo completo:

```js
window.HERO_SPRITE_MAGO = {
  key:   'hero_mago',                          // texture key único en Phaser
  src:   'assets/heroes/mago.png',             // ruta del PNG (relativa a index.html)

  frameSize: { w: 256, h: 256 },               // tamaño de cada frame en pixels
  origin:    { x: 0.5, y: 0.85 },              // punto de anclaje (pie del sprite)
  scale:     0.5,                              // escala de render (1 = 256px de alto)
  defaultState: 'idle',                        // estado de fallback

  states: {
    // Cada estado es un array de frames. Un array VACÍO cae a defaultState.
    // Un estado ausente del mapa también cae a defaultState.

    idle: [
      { x:   0, y:   0, vflip: false, hflip: false, dur: 180 },
      { x: 256, y:   0, vflip: false, hflip: true,  dur: 180 }
    ],

    cast: [
      { x:   0, y: 512, vflip: false, hflip: false, dur: 160 },
      { x: 256, y: 512, vflip: false, hflip: false, dur: 160 },
      { x: 512, y: 512, vflip: false, hflip: false, dur: 200 }
    ],

    attack: [                                   // one-shot: vuelve a idle al terminar
      { x:   0, y: 256, vflip: false, hflip: false, dur: 140 },
      { x: 256, y: 256, vflip: false, hflip: false, dur: 140 }
    ],

    hurt: [
      { x:   0, y: 768, vflip: false, hflip: false, dur: 200 }
    ],

    victory: [],
    defeat:  []
  }
};
```

---

## 3. Unidades

| Campo | Unidad | Notas |
|---|---|---|
| `x`, `y` (dentro del frame) | **pixels** dentro del spritesheet | Origen arriba-izquierda |
| `dur` | **milisegundos (ms)** | Duración visible del frame antes de avanzar al siguiente |
| `w`, `h` (frameSize) | pixels | Tamaño de un frame individual |
| `origin.x`, `origin.y` | ratio `[0, 1]` | `(0.5, 0.85)` = pie centrado |
| `scale` | ratio adimensional | `1` = el frame se renderiza a su tamaño nativo |

---

## 4. Estados estándar

| Estado | Tipo | Descripción |
|---|---|---|
| `idle` | loop | Reposo, loop infinito |
| `cast` | loop | Canalización, loop hasta `setState('idle')` |
| `attack` | one-shot | Al terminar, vuelve a `idle` |
| `hurt` | one-shot | Al terminar, vuelve a `idle` |
| `victory` | one-shot | Al terminar, vuelve a `idle` |
| `defeat` | one-shot | Al terminar, vuelve a `idle` |

**Reglas:**

- Si un estado no existe en el mapa o su array está vacío, el motor usa `defaultState` (idle por defecto).
- El motor loggea en consola solo la primera vez que se pide un estado faltante (modo dev).
- Para agregar un estado nuevo, basta añadirlo al mapa `states` con su array de frames. No requiere tocar el motor.

---

## 5. Reglas de flip

Cada frame declara `vflip` y `hflip` individuales (para sprites mal orientados en el spritesheet). Adicionalmente el motor aplica un **`hflip` global** cuando el héroe está del lado derecho de la pantalla.

Fórmula combinada:

```
vflip_final = frame.vflip
hflip_final = (frame.hflip XOR side === 'right')
```

Donde `side` se pasa al crear la instancia: `'left'` (jugador) o `'right'` (oponente).

**Ejemplo:** si un frame ya está espejado (`hflip: true`) y el motor lo renderiza en el lado derecho (`side === 'right'`), el resultado es `hflip_final = true XOR true = false` — vuelve a su orientación original, como pediste.

---

## 6. Layout en pantalla (GameScene)

Cada héroe vive en una columna en los extremos del campo de batalla. Sin highlight ni medallón decorativo — el sprite va directo sobre el fondo.

**Columna del jugador (x=72):**

```
       sprite           y centro ≈ 86   (escala → ~72px de alto)
       MAGO             y ≈ 140
       ━━━━━━━━━        y ≈ 152  (HP bar)
   HP 25/25  ARM 0      y ≈ 164
   MAN 1/3              y ≈ 176
   VENENO 3             y ≈ 188  (opcional)
   ┌────────────────┐
   │ ⚡ BOLA DE FUEGO 1M │  y ≈ 210  (BOTÓN DE PODER)
   └────────────────┘
```

**Columna del oponente (x=W-72):** misma distribución espejada (`side: 'right'` aplica `hflip` global al sprite). Sin botón de poder visible (la IA usa el poder internamente).

---

## 7. Fallback cuando el PNG no existe

Si `assets/heroes/<id>.png` no existe, BootScene emite un `FILE_LOAD_ERROR` (silenciado) y la texture no se registra. GameScene detecta `scene.textures.exists(config.key) === false` y muestra el medallón emoji programático (`VFX.classSeal`) en lugar del sprite. El juego no se rompe.

Para que un sprite aparezca, basta con:

1. Subir el PNG a `assets/heroes/<id>.png`
2. Editar `js/data/sprites/heroes/<id>.js` con las coordenadas de cada frame
3. Hard refresh

No se requiere tocar `HeroSprite.js`, `GameScene.js` ni `BootScene.js`.
# 🎮 GameJam 2026 — kodingvibes

Repositorio oficial de la gamejam organizada por **kodingvibes**.

## ⏱️ Dinámica — 48 horas

La gamejam se divide en **2 fases de 24 horas**:

### Fase 1: Desarrollo (primeras 24h)

Cada participante desarrolla su juego completo dentro de `participantes/<su-nombre>/`. Al terminar, hace un **Pull Request** a `main`. @Motoko revisa y mergea.

### Fase 2: Mejora cruzada (segundas 24h)

Los juegos se reparten entre los participantes. Cada persona recibe el juego de **otro participante** y debe:

- Hacerle mejoras
- Refactorizar código
- Agregar features
- Corregir bugs

Todo dentro de la carpeta del otro participante. Así mezclamos estilos, modelos de código y aprendemos buenas prácticas entre todos.

## 📋 Reglas

1. Cada participante trabaja **exclusivamente** dentro de `participantes/<su-nombre>/`
2. No tocar archivos fuera de tu carpeta — eso incluye README, .gitignore, etc.
3. En Fase 1: haz un **Pull Request** con tu juego a `main`
4. En Fase 2: haz un **Pull Request** con las mejoras al juego que te tocó
5. @Motoko revisa y mergea ambos PRs
6. **No juegos eróticos.** Violencia explícita y extrema sí, permitida. Sangre, gore, desmembramiento, todo bien. Pero nada de contenido erótico o sexual.

## 🚀 Cómo empezar

```bash
git clone git@github.com:kodingvibes/gamejam-2026.git
cd gamejam-2026
mkdir participantes/tu-nombre
# ¡A codear!
```

## 📁 Estructura

```
gamejam-2026/
├── participantes/
│   ├── ejemplos/         # Juegos de ejemplo en Phaser
│   │   ├── Snake/
│   │   ├── Tetris/
│   │   ├── Minesweeper/
│   │   ├── Twenty48/
│   │   ├── SpaceInvaders/
│   │   └── RiverRaid/
│   └── tu-nombre/        # Tu juego aquí
│       ├── index.html
│       └── ...
├── .gitignore
├── LICENSE
└── README.md
```

## ✅ Criterios de validación del PR

- El código debe estar **solo** dentro de `participantes/<tu-nombre>/`
- El juego debe **funcionar** (compilar/arrancar sin errores)
- Nada de código copiado sin entender
- Diviértete 🎉

## 📅 Deadline

Por definir.

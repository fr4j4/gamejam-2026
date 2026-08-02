# FOXSTAR

Rail shooter estilo **Star Fox** hecho en **Three.js 0.160 + TypeScript 5.4 + Vite 5.4**. La cámara avanza por un riel mientras pilotas tu nave, esquivas oleadas de enemigos y te enfrentas a un boss final en el espacio profundo.

## Descripción

FoxStar es un shooter sobre raíles: la cámara se desliza por un corredor espacial mientras tú controlas la nave dentro de ese riel. Tienes **3 vidas + escudos + power-ups**, y te enfrentas a **3 patrones de enemigos** (DiveBomb, Circle y Sweep) antes de llegar al **boss final (Mothership)**.

Todo con música de fondo original (**Starfall Vanguard**) y un sistema de efectos completo: nebulosas, campo de estrellas, explosiones, partículas y efectos de pantalla.

## Ejecutar

Requiere **Node.js** y **npm**.

```bash
npm install
npm run dev
```

Abrir la URL que indica Vite (por defecto `http://localhost:5173`).

Para una build de producción:

```bash
npm run build
npm run preview
```

## Controles

| Tecla | Acción |
|-------|--------|
| `WASD` / `Flechas` | mover la nave y la mira |
| `ESPACIO` | disparar láseres |
| `Z` | lanzar bomba (5 en total) |
| `ESC` | pausa |
| `ESPACIO` / `ENTER` | iniciar partida (menú) |

## Stack tecnológico

- **Three.js** `^0.160.0` — renderizado 3D.
- **TypeScript** `^5.4.0` — tipado estático.
- **Vite** `^5.4.0` — bundler y dev server.
- **@types/three** `^0.185.3` — tipos para Three.js.

## Estructura del proyecto

```
src/
├── audio/        # AudioManager, MusicPlayer (Starfall Vanguard)
├── camera/       # CameraRig, PostProcessingPipeline
├── core/         # Game, StateManager, CollisionSystem, EventBus,
│                 # GameEventBinder, ScoreSystem, Timekeeper, ...
├── enemies/      # EnemyManager, Enemy, EnemyMeshFactory, EnemyTrail
│   ├── bosses/   # BossBase, BossMothership
│   └── patterns/ # PatternBase, DiveBombPattern, CirclePattern,
│                 # SweepPattern, movement
├── fx/           # Starfield, ExplosionSystem, PowerUp, Nebulae,
│                 # ParticleManager, ScreenEffects, HitSpark, ...
├── player/       # PlayerShip, InputMapper, FoxTail, PlayerLifeManager,
│                 # PlayerShipMeshFactory
├── rail/         # RailFactory, RailController
├── types/        # config, events, index
├── ui/           # HUD, MenuScreen, PauseOverlay, GameOverScreen,
│                 # VictoryScreen, LivesDisplay, iconRow
├── utils/        # ObjectPool
├── waves/        # WaveDefinition, WaveManager
└── weapons/      # Projectile, WeaponConfig, WeaponSystem
```

## Notas técnicas

- **Arquitectura por módulos**: el juego está separado en dominios claros (`rail`, `enemies`, `player`, `fx`, `core`, `ui`, `weapons`, `waves`), cada uno con responsabilidad única.
- **Refactor SOLID / KISS / DRY**: se aplicó una pasada de limpieza que renombró variables de un solo carácter y encapsuló la IA de los enemigos en métodos `updateCombat()` / `configure()`, dejando cada patrón autocontenido.
- **Patrones de enemigos**: cada patrón (DiveBomb, Circle, Sweep) hereda de `PatternBase` y define su propio comportamiento de movimiento y combate.
- **Boss final**: `BossMothership` extiende `BossBase` y cierra la partida con un enfrentamiento dedicado.
- **Sistema de vidas**: `PlayerLifeManager` gestiona las 3 vidas, los escudos y los power-ups.
- **Audio**: la banda sonora original se carga desde `public/` y se gestiona a través de `AudioManager` / `MusicPlayer`.
- **Pooling**: `ObjectPool` reutiliza objetos (proyectiles, partículas) para evitar picos de garbage collection.

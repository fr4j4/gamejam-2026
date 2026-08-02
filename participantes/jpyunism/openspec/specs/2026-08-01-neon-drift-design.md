# Neon Drift — Game Design Spec

## Overview

Neon Drift es un roguelite cyberpunk de supervivencia con oleadas de enemigos. El jugador se mueve en tiempo real por una arena procedural con obstáculos, dispara con apuntado manual (mouse), y debe sobrevivir la mayor cantidad de oleadas posible. Entre runs hay meta-progresión con monedas.

**Stack**: Phaser 4 (`phaser` v4.2.1) + TypeScript + Vite
**Carpeta**: `participantes/jpyunism/`

---

## Core Loop

1. Menú principal → elegir 2 armas de 5 disponibles
2. Spawn en arena procedural con obstáculos
3. Enemigos spawnan continuamente desde bordes
4. Matar enemigos → monedas + drops de curación
5. Cada ~30s → horda grande con Tanks
6. Cada X enemigos matados → subir nivel, elegir 1 de 3 power-ups
7. Al morir → Game Over, contabilizar monedas
8. Entre runs → gastar monedas en mejoras de stats

---

## Mapa

- **Tipo**: Arena procedural con obstáculos
- **Tamaño**: ~1280x960px (viewport), el mapa es más grande que la pantalla
- **Cámara**: sigue al jugador
- **Obstáculos**: pilares/columnas generadas aleatoriamente, posición fija por run
- **Bordes**: paredes sólidas, el jugador no puede salir
- **Generación**: random placement de obstáculos con separación mínima, sin bloquear el centro

---

## Jugador

- **Movimiento**: WASD, velocidad base 200px/s
- **Vida**: 100 HP
- **Escudo**: 50 HP, se regenera después de 3s sin recibir daño, 10 HP/s
- **Apuntado**: mouse (posición del cursor)
- **Armas**: 2 equipadas, switcheables con Q
- **Disparo**: click izquierdo

---

## Armas (5 disponibles)

| Arma | Daño | Cooldown | Alcance | Efecto |
|------|------|----------|---------|--------|
| Plasma | 15 | 0.3s | 400px | Proyectil cian, rectilíneo |
| Granada | 40 | 1.5s | 300px | Explota en radio 60px, daño área |
| Pulso | 8 | 0.1s | 350px | Ráfaga 3 proyectiles con spread 5° |
| Eléctrico | 5/tic | 0.05s | 300px | Beam continuo, daña en línea |
| Fuego | 12 | 0.8s | 250px | Deja zona de fuego 2s (5 dmg/tic) |

Todas usan cooldown por disparo (sin munición).

---

## Enemigos (3 tipos)

| Tipo | Color | HP | Daño | Velocidad | Comportamiento |
|------|-------|----|------|-----------|----------------|
| Chaser | Rojo neón | 20 | 10 | 120px/s | Persigue al jugador directamente |
| Shooter | Amarillo neón | 15 | 8 | 60px/s | Se mantiene a 200px, dispara proyectil cada 2s |
| Tank | Magenta neón | 100 | 20 | 40px/s | Aparece solo en hordas, grande (32x32) |

**Spawn**: fuera de cámara (mínimo 100px del borde visible), nunca sobre obstáculos.

---

## Oleadas

- **Spawn continuo**: enemigos básicos (Chaser/Shooter) spawnan cada 2-4s, escalando con el tiempo
- **Hordas periódicas**: cada ~30s llega una horda con 8-12 enemigos + 1-2 Tanks
- **Dificultad**: cada horda aumenta la cantidad y velocidad de spawn

---

## Power-ups (al subir de nivel)

Cada X enemigos matados (escala: 10, 15, 20, 25...), pausa y elegir 1 de 3:

**Stats temporales:**
- +15% velocidad movimiento (30s)
- +20% daño (30s)
- +30% cadencia (30s)
- +50 escudo máximo (30s)
- Proyectiles rebotan 1 vez (permanente-run)

**Efectos especiales:**
- Disparo triple durante 15s
- Escudo temporal que absorbe 1 golpe
- Explosión al matar enemigo (radio 40px)
- Balas perforantes (atraviesan enemigos) 15s

---

## Drops de enemigos

- **Monedas**: 100% de probabilidad, 1-3 monedas
- **Curación**: 15% de probabilidad, recupera 20 HP o 20 escudo

---

## Meta-progresión (tienda entre runs)

| Mejora | Niveles | Costo (por nivel) | Efecto |
|--------|---------|-------------------|--------|
| Daño | 5 | 100/200/400/800/1600 | +10% daño total |
| Velocidad | 3 | 100/200/400 | +8% velocidad |
| Escudo máx | 5 | 100/200/400/800/1600 | +20 escudo |
| Recarga escudo | 3 | 100/200/400 | -15% tiempo para regenerar |
| Cadencia | 5 | 100/200/400/800/1600 | -8% cooldown |

Los datos se persisten en localStorage.

---

## Controles

| Tecla | Acción |
|-------|--------|
| WASD | Moverse |
| Mouse | Apuntar |
| Click izquierdo | Disparar |
| Q | Switchear arma |
| R | Reiniciar (en Game Over) |
| Esc | Pausa |

---

## UI

- **HUD**: vida (roja), escudo (azul), armas equipadas con cooldown, oleada actual, nivel
- **Menú principal**: título + selección de 2 armas + botón Start
- **Level up**: overlay con 3 opciones, pausa el juego
- **Game Over**: puntaje, oleada, monedas, botón Reiniciar + Tienda
- **Tienda**: lista de mejoras con niveles y costos

---

## Escenas (Phaser)

1. **MenuScene** — título, selección de armas, inicio
2. **GameScene** — la run: mapa, jugador, enemigos, oleadas, HUD
3. **GameOverScene** — resultados + tienda

---

## Arquitectura de archivos

```
participantes/jpyunism/
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── scenes/
│   │   ├── MenuScene.ts
│   │   ├── GameScene.ts
│   │   └── GameOverScene.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Enemy.ts
│   │   ├── ChaserEnemy.ts
│   │   ├── ShooterEnemy.ts
│   │   └── TankEnemy.ts
│   ├── weapons/
│   │   ├── Weapon.ts
│   │   ├── PlasmaGun.ts
│   │   ├── GrenadeLauncher.ts
│   │   ├── PulseRifle.ts
│   │   ├── ElectricBeam.ts
│   │   └── Flamethrower.ts
│   ├── systems/
│   │   ├── WaveManager.ts
│   │   ├── LevelUpManager.ts
│   │   └── MapGenerator.ts
│   ├── ui/
│   │   ├── HUD.ts
│   │   └── PowerUpSelect.ts
│   └── store/
│       └── MetaProgress.ts
```

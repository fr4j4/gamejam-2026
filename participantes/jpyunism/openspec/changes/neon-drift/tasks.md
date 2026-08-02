# Tasks: Neon Drift

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,300 (additions) |
| 400-line budget risk | High |
| Chained PRs recommended | No (size:exception pre-approved) |
| Suggested split | Single PR with `size:exception` |
| Delivery strategy | single-pr (with size:exception) |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

> GameJam scope: a single PR is required by the jam timeline. `size:exception` is
> pre-approved at session preflight. Forecast is honest about the size so reviewers
> know what they're signing up for. If the team later wants to split, slice by
> the phases below (each phase is a clean, independently runnable checkpoint).

### Suggested Work Units (informational — not enforced)

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Project bootstrap + main loop | PR 1 | `npm run dev` opens MenuScene | `npm run dev` | revert `package.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/scenes/MenuScene.ts` |
| 2 | Core gameplay (player, weapons, enemies) | PR 2 | `npm run dev` — fire each weapon, kill each enemy type | `npm run dev` (manual) | revert `entities/`, `weapons/`, `GameScene.ts` |
| 3 | Systems + meta + polish | PR 3 | `npm run dev` — survive 1 wave, level up, die, spend coins | `npm run dev` (manual) | revert `systems/`, `ui/`, `store/`, `GameOverScene.ts` |

## Phase 1: Project Bootstrap & Foundation

- [x] 1.1 Create `participantes/jpyunism/package.json` with `phaser@4.2.1`, `vite`, `typescript` as devDeps; add scripts `dev`, `build`, `preview`.
- [x] 1.2 Create `participantes/jpyunism/tsconfig.json` targeting `ES2022`, `moduleResolution: bundler`, `strict: true`, `outDir: dist`.
- [x] 1.3 Create `participantes/jpyunism/vite.config.ts` with `base: './'` and `assetsInclude` for static assets if needed.
- [x] 1.4 Create `participantes/jpyunism/index.html` with a `<canvas id="game">` root and a `<script type="module" src="/src/main.ts">` entry.
- [x] 1.5 Create `participantes/jpyunism/src/main.ts` that boots Phaser 4 with three scenes (`MenuScene`, `GameScene`, `GameOverScene`), pixel-art friendly renderer config, and a neon background color.
- [x] 1.6 Create `participantes/jpyunism/src/scenes/MenuScene.ts` with a centered title "NEON DRIFT" and a placeholder "START" button (full UI lands in Phase 5).

## Phase 2: Core Entities — Player

- [x] 2.1 Create `participantes/jpyunism/src/entities/Player.ts` extending `Phaser.Physics.Arcade.Sprite` with HP (100), shield (50/50), speed (200 px/s), and an `aimAngle` property.
- [x] 2.2 Implement `Player.update(dt, keys, pointer)` handling WASD movement with diagonal normalization and obstacle collision.
- [x] 2.3 Implement `Player.takeDamage(amount)` that prioritizes shield first, tracks the 3s shield-regen timer (10 HP/s).
- [x] 2.4 Implement `Player.equip(weapons)` storing two weapon instances and `switchWeapon()` toggling on Q.
- [x] 2.5 Implement `Player.tryFire(time)` calling the active weapon's `fire()` if cooldown elapsed.

## Phase 3: Core Entities — Enemies

- [x] 3.1 Create `participantes/jpyunism/src/entities/Enemy.ts` base class extending `Phaser.Physics.Arcade.Sprite` with HP, speed, damage, color tint helper, and `dropLoot()` returning coins/heal.
- [x] 3.2 Create `participantes/jpyunism/src/entities/ChaserEnemy.ts` — HP 20, dmg 10, speed 120, red neon tint, `update()` seeks player.
- [x] 3.3 Create `participantes/jpyunism/src/entities/ShooterEnemy.ts` — HP 15, dmg 8, speed 60, yellow tint, maintains ~200px distance and fires a projectile every 2s.
- [x] 3.4 Create `participantes/jpyunism/src/entities/TankEnemy.ts` — HP 100, dmg 20, speed 40, magenta tint, 32x32 sprite, used only during hordes.

## Phase 4: Weapons

- [x] 4.1 Create `participantes/jpyunism/src/weapons/Weapon.ts` base class with `name`, `damage`, `cooldown`, `range`, `lastFiredAt`, abstract `fire(scene, x, y, angle)`.
- [x] 4.2 Create `participantes/jpyunism/src/weapons/PlasmaGun.ts` — 15 dmg, 0.3s cd, 400px range, cyan rectilinear projectile.
- [x] 4.3 Create `participantes/jpyunism/src/weapons/GrenadeLauncher.ts` — 40 dmg, 1.5s cd, 300px range, AoE explosion with 60px radius after short fuse.
- [x] 4.4 Create `participantes/jpyunism/src/weapons/PulseRifle.ts` — 8 dmg, 0.1s cd, 350px range, 3-projectile burst with 5° spread.
- [x] 4.5 Create `participantes/jpyunism/src/weapons/ElectricBeam.ts` — 5 dmg/tic, 0.05s cd, 300px range, continuous beam that hits everything in line while held.
- [x] 4.6 Create `participantes/jpyunism/src/weapons/Flamethrower.ts` — 12 dmg, 0.8s cd, 250px range, leaves a fire zone for 2s dealing 5 dmg/tic.

## Phase 5: Systems

- [x] 5.1 Create `participantes/jpyunism/src/systems/MapGenerator.ts` — generates 1280x960 arena with randomized pillar obstacles (min separation, center kept clear, solid walls).
- [x] 5.2 Create `participantes/jpyunism/src/systems/WaveManager.ts` — continuous spawn every 2-4s (Chaser/Shooter) scaling over time; every 30s triggers a horde of 8-12 enemies + 1-2 Tanks; spawns never overlap obstacles and stay ≥100px outside camera.
- [x] 5.3 Create `participantes/jpyunism/src/systems/LevelUpManager.ts` — kills threshold scales (10, 15, 20, 25...); on threshold, pauses game and offers 3 random power-ups from the 9-item pool.

## Phase 6: Meta-Progression & Store

- [x] 6.1 Create `participantes/jpyunism/src/store/MetaProgress.ts` — schema in localStorage (`neon-drift:meta`): coins, upgrade levels (damage, speed, shield, regen, cadence); helpers `load()`, `save()`, `spend()`, `addCoins()`.
- [x] 6.2 Implement shop upgrade costs and effects per spec table (damage +10%/lvl, speed +8%/lvl, shield +20/lvl, regen -15% time/lvl, cadence -8% cd/lvl, 5/3/5/3/5 levels).
- [x] 6.3 Wire meta bonuses into Player/weapon construction at run start.

## Phase 7: UI

- [x] 7.1 Create `participantes/jpyunism/src/ui/HUD.ts` — top-left HP bar (red), shield bar (blue), top-right equipped weapons with cooldown ring, current wave counter, current level.
- [x] 7.2 Create `participantes/jpyunism/src/ui/PowerUpSelect.ts` — full-screen overlay with 3 cards, pauses scene, returns selected power-up to LevelUpManager.

## Phase 8: Scenes Wiring

- [x] 8.1 Complete `MenuScene.ts` — title, 5 weapon thumbnails, click to pick 2, START button transitions to GameScene passing weapon IDs.
- [x] 8.2 Create `participantes/jpyunism/src/scenes/GameScene.ts` — loads map, spawns player, instantiates WaveManager + LevelUpManager + HUD, handles WASD/click/Q/Esc, fires player weapon on click, manages collisions (projectile vs enemy, enemy vs player).
- [x] 8.3 Create `participantes/jpyunism/src/scenes/GameOverScene.ts` — shows wave reached, coins earned this run, total coins; R restarts, "Shop" opens the meta-progression panel that calls `MetaProgress`.

## Phase 9: Polish & Balance Pass

- [x] 9.1 Add neon visual treatment — glow tints on player/enemies/projectiles via Phaser FX or additive blend mode.
- [x] 9.2 Tune spawn rates and enemy stats per spec (`npm run dev` playtest, 5+ minute survival target).
- [x] 9.3 Verify controls: WASD moves, mouse aims, left-click fires, Q switches weapon, Esc pauses, R restarts at Game Over.

## Phase 10: Final Verification

- [x] 10.1 Run `npm run build` — must succeed with zero TS errors.
- [x] 10.2 Run `npm run dev` and walk through full loop: menu → pick 2 weapons → kill enemies → level up → die → Game Over → spend coins → restart.
- [x] 10.3 Confirm `openspec/changes/neon-drift/state.yaml` is updated as tasks complete (handled by orchestrator, not here).

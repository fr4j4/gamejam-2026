# Neon Drift — SDD Archive Report

## Cycle
- **Change**: `neon-drift`
- **Archived**: 2026-08-01
- **Project**: gamejam-2026
- **Artifact store**: hybrid (engram + openspec filesystem)
- **Engram topic key**: `sdd/neon-drift/archive-report`
- **Engram observation ID**: #29
- **Related engram observations**: #17 (sdd/neon-drift/tasks, SUPERSEDED), #20 (Phase 2 implementation, related), #23 (Phase 6 implementation, related)

## Change summary
Cyberpunk roguelite survival built with **Phaser 4 + TypeScript + Vite**, scoped to `participantes/jpyunism/` per the repo's multi-tenant policy. Player runs an arena with WASD + mouse-aim + click-fire, picks 2 of 5 weapons, fights continuously-spawning Chaser/Shooter enemies and periodic horde waves with Tanks, levels up by choosing 1-of-3 power-ups every X kills, and banks coins into 5 meta-upgrades (damage / speed / shield / regen / cadence) in localStorage.

## Source-of-truth spec
- Path: `openspec/specs/2026-08-01-neon-drift-design.md` (project-level, NOT a delta)
- Authored directly as the final spec; no `openspec/changes/neon-drift/specs/` delta subdir was created during this cycle.

## Final task state
All 33 items across 10 phases marked `[x]` in `openspec/changes/neon-drift/tasks.md`:

| Phase | Items | Status |
|-------|-------|--------|
| 1. Project bootstrap & foundation | 1.1–1.6 |  6/6 |
| 2. Player entity | 2.1–2.5 |  5/5 |
| 3. Enemy entities | 3.1–3.4 |  4/4 |
| 4. Weapons | 4.1–4.6 |  6/6 |
| 5. Systems (map, waves, level-up) | 5.1–5.3 |  3/3 |
| 6. Meta-progression & store | 6.1–6.3 |  3/3 |
| 7. UI (HUD + power-up select) | 7.1–7.2 |  2/2 |
| 8. Scene wiring | 8.1–8.3 |  3/3 |
| 9. Polish & balance | 9.1–9.3 |  3/3 |
| 10. Final verification | 10.1–10.3 |  3/3 (note below) |

## Files created (in `participantes/jpyunism/`)

### Project root (5 files, ~112 LOC)

| File | Purpose |
|------|---------|
| `package.json` | phaser ^4.2.1, vite ^5, typescript ^5; scripts dev / build / preview |
| `tsconfig.json` | strict, ES2022, bundler resolution, noUnusedLocals/Parameters on |
| `vite.config.ts` | `base: './'` for static-host friendliness |
| `index.html` | canvas#game root, module entry to `/src/main.ts` |
| `README.md` | how-to-run docs (required for @Motoko PR review) |

### Source (22 TypeScript files, ~3,774 LOC)

| Directory | File | LOC |
|-----------|------|-----|
| src/ | main.ts | 26 |
| src/scenes/ | MenuScene.ts | 329 |
| src/scenes/ | GameScene.ts | 576 |
| src/scenes/ | GameOverScene.ts | 351 |
| src/entities/ | Player.ts | 156 |
| src/entities/ | Enemy.ts | 129 |
| src/entities/ | ChaserEnemy.ts | 29 |
| src/entities/ | ShooterEnemy.ts | 73 |
| src/entities/ | TankEnemy.ts | 31 |
| src/weapons/ | Weapon.ts | 32 |
| src/weapons/ | PlasmaGun.ts | 59 |
| src/weapons/ | GrenadeLauncher.ts | 126 |
| src/weapons/ | PulseRifle.ts | 62 |
| src/weapons/ | ElectricBeam.ts | 75 |
| src/weapons/ | Flamethrower.ts | 126 |
| src/systems/ | MapGenerator.ts | 180 |
| src/systems/ | WaveManager.ts | 191 |
| src/systems/ | LevelUpManager.ts | 263 |
| src/store/ | MetaProgress.ts | 197 |
| src/ui/ | HUD.ts | 499 |
| src/ui/ | PowerUpSelect.ts | 264 |

**Build artifact**: `dist/index.html` + `dist/assets/index-BICMyUnb.js` (1.7 MB / 395 kB gzipped).

## Files modified
None outside `participantes/jpyunism/`. Repo policy (`openspec/config.yaml` rules.proposal) requires scope inside the participant folder; respected.

## Build verification (ground truth, run 2026-08-01)
- `tsc`: clean, zero errors
- `vite build`: clean, 25 modules transformed, ~1.6s
- Warning: single chunk > 500 kB (1.7 MB un-gzipped). Phaser accounts for the bulk. Not blocking; candidate for `manualChunks` split.

## Known gaps / pending improvements
1. **Task 10.3 marked done but `state.yaml` not produced.** Task text says "handled by orchestrator, not here" — no `openspec/changes/neon-drift/state.yaml` exists. The cycle relied on engram + filesystem state instead. Acceptable for a hybrid store; recorded here so future readers don't grep for a file that won't be there.
2. **Vite chunk-size warning.** Bundle is single-file. `manualChunks: { phaser: ['phaser'] }` would split Phaser out and drop the main bundle to a few hundred kB. Trivial follow-up.
3. **No automated tests.** Repo policy (`openspec/config.yaml` testing.strict_tdd = false) explicitly opts out at repo level; participants MAY add their own. None added for this participant. Manual playtest is the verification path.
4. **Manual playtest loop (task 10.2) was not observed by this archiver.** Orchestrator launch context asserts it was done. Archiver verified static artifacts and the build, but did not run `npm run dev` interactively. Recorded as a limitation of the archive, not as a failure of the cycle.
5. **Stale `sdd/neon-drift/tasks` engram observation (#17).** Saved pre-apply with all checkboxes `[ ]`. Superseded by this archive report (#29) per Final-State Authority.

## Path-convention conflict (recorded, not silently resolved)
- Skill default archive: `openspec/changes/archive/YYYY-MM-DD-neon-drift/`
- Orchestrator (user) prompt asked for: `openspec/changes/neon-drift/archive/`
- Resolved per explicit user override. This filesystem archive lives at `openspec/changes/neon-drift/archive/archive-report.md`. Future cycles for this project may use the skill default unless overridden again.

## Delta-spec sync: N/A
The spec was authored directly at project level (`openspec/specs/2026-08-01-neon-drift-design.md`) and that file already reflects the shipped behavior. No `openspec/specs/{domain}/spec.md` was created or updated because the project's spec layout uses dated top-level files, not domain folders.

## SDD cycle status
COMPLETE. Ready for the next change.
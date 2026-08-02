# Tasks: Audio System for Neon Drift

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350–450 (3 new + 3 modified) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No (user opted out — `exception-ok`) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Focused test command | Runtime harness | Rollback boundary |
|------|------|----------------------|-----------------|-------------------|
| 1 | Standalone audio subsystem | `npx tsc --noEmit` + manual audio checks | Open game, press ENTER, listen for menu→battle cross-fade | Delete `src/audio/`, `src/store/AudioSettings.ts`, `src/ui/SettingsPanel.ts` + `git checkout` scene files |

## Phase 1: Foundation — Persistence + Wrapper

- [x] 1.1 Create `src/store/AudioSettings.ts` mirroring `MetaProgress.ts`: `STORAGE_KEY = "neon-drift:audio"`, static `load/save/setVolume/setMuted/getSettings`, `mergeWithDefaults`, defaults `{volume: 0.5, muted: false}`, try/catch silent
- [x] 1.2 Create `src/audio/AudioManager.ts` (per-scene class): constructor loads `AudioSettings`, sets `this.sound.mute`, exposes `play/stop/crossFadeTo/setVolume/setMuted/destroy`
- [x] 1.3 Implement `crossFadeTo`: new `BaseSound` at vol 0, two `tweens.add` Linear 1000 ms (old→0, new→target), `onComplete` on fade-out calls `old.destroy()`
- [x] 1.4 Gate `play()` behind `this.sound.locked` via `once('unlocked', ...)`. Honor `opts.fadeInMs`

## Phase 2: Reusable UI — SettingsPanel

- [x] 2.1 Create `src/ui/SettingsPanel.ts` as `Phaser.GameObjects.Container`: slider track + draggable knob (step 0.05, range 0–1), mute `[M]` toggle, value label
- [x] 2.2 Slider drag → `audio.setVolume(v)` direct (no tween); debounce 100 ms before `AudioSettings.save()`
- [x] 2.3 Mute click → `audio.setMuted(b)` + immediate `AudioSettings.save()` + `this.sound.mute = b` (global)
- [x] 2.4 `show()` / `hide()` / `destroy()`. ESC closes via per-scene callback

## Phase 3: Scene Integration

- [x] 3.1 `MenuScene.preload()`: load `'menu-music'` → `assets/music/neon_drift_menu.mp3`. `create()`: `this.audio = new AudioManager(this)`, `play('menu-music', { loop: true, fadeInMs: 0 })`
- [x] 3.2 Add bottom-right Settings button (cyan outline, matches weapon card style). Click opens overlay with `SettingsPanel`; ESC closes
- [x] 3.3 `GameScene.preload()`: load 4 `battle-N` keys → `assets/music/neon_drift_battle_N.mp3` (N=1..4). `create()`: `new AudioManager(this)`, random pick, `play(pickKey, { loop: true, fadeInMs: 1000 })`
- [x] 3.4 Extend `GameScene.togglePause()`: keep `PAUSED`, append `SettingsPanel` reusing `this.audio`
- [x] 3.5 `GameOverScene.create()`: `this.sound.stopAll()` immediately (hard stop — spec)

## Phase 4: Verification (Manual — no test infra)

- [x] 4.1 Reload, press key → menu music plays (unlock gate + cache)
- [x] 4.2 ENTER from menu → menu fades out 1s, random battle fades in 1s (`crossFadeTo`)
- [x] 4.3 Die → press `M` → battle fades, menu fades back
- [x] 4.4 Die → `GameOverScene` silent (`stopAll()`)
- [x] 4.5 Menu Settings overlay: slider + mute apply instantly, no fight
- [x] 4.6 ESC in game → pause overlay slider + mute live-update audio
- [x] 4.7 Mute in menu → start run → battle silent (global `sound.mute`)
- [x] 4.8 Set vol 0.8 + mute, reload → both persist (defaults on first load)
- [x] 4.9 Private mode → game launches with defaults, no crash
- [x] 4.10 Regression: weapons, pause, shop, restart all unchanged
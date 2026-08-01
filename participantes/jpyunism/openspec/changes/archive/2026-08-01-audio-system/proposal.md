# Proposal: Audio System for Neon Drift

## Intent

The game currently plays with zero audio — no music, no ambience, no UI feedback sounds. For a 48h gamejam build this is a noticeable gap: the game launches and runs silent. We want background music in the menu and during gameplay, plus a persistent volume/mute control the player can reach without leaving the run.

Concrete motivation:
- The 5 MP3 files (`neon_drift_menu.mp3` + 4× `neon_drift_battle_*.mp3`) are already in `src/assets/music/` — they exist, they are not wired up.
- The meta-progression layer (coins, upgrades) already proves localStorage works in this stack; volume settings should persist the same way.
- The pause overlay in `GameScene` is the natural place to expose volume without leaving the run.

## Scope

### In Scope
- Cross-fade background music between `MenuScene` and `GameScene` using existing assets (no new audio files).
- Random battle track pick on each `GameScene` start (among the 4 battle tracks).
- Settings UI: volume slider + mute toggle in `MenuScene`, plus the same controls on the existing `GameScene` pause overlay.
- localStorage-backed persistence for volume (0–1) and muted (boolean), loaded on game start, written on change.
- A new `AudioSettings` store following the same single-key + `try/catch + mergeWithDefaults` pattern as `MetaProgress`.

### Out of Scope
- New audio files, SFX (weapon shots, enemy deaths, UI clicks), or adaptive music layers.
- WebAudio spatialization / listener position — pure 2D mixing only.
- Audio on `GameOverScene` — background music pauses or continues muted per design; no separate game-over track.
- Per-weapon / per-event sound design.
- Mobile-locked audio quirks beyond `pauseOnBlur` defaults (Phaser handles unlock).

## Capabilities

This change introduces **one** new capability. Spec work should create exactly one full spec.

### New Capabilities
- `audio-music-and-settings`: Background music playback, cross-fade transitions between Menu and Game scenes, random battle track selection, and persistent volume/mute user settings exposed in both the main menu and the in-game pause overlay.

### Modified Capabilities
- `None` — no existing capability has a requirement that changes at spec level. `MenuScene`, `GameScene`, and `GameOverScene` retain their current behaviors; this change adds new scene-level code without modifying any existing requirement contracts.

## Approach

**Single source of truth for playback.** Create `src/audio/AudioManager.ts` as a thin wrapper over Phaser's `SoundManager`. It owns:
- A `MusicController` for the current looping track with `play(key, opts)`, `stop()`, `crossFadeTo(key, duration)`.
- A reference to the running `MenuScene`/`GameScene` `BaseSound` instance so `stop()` and `fadeOut` know what to act on.
- Subscribers to load settings from `AudioSettings.load()` once at construction and apply them to every newly added sound via `setVolume(settings.volume)` and `setMute(settings.muted)`.

**Preload.** No new scene. Each scene that needs audio calls `this.load.audio('menu-music', 'assets/music/neon_drift_menu.mp3')` etc. in `preload()`. To avoid double loading, the first `MenuScene` enters after a small BootScene-style handoff would help, but for this jam scope we accept the worst-case double-load (Phaser caches by key). Tradeoff: simplest, and the cost is one HTTP request the first time only.

**Cross-fade.** Implemented with two `this.tweens.add` running on `BaseSound.volume`. Duration: 1000 ms, ease `Linear`. Implementation: start the next track at volume 0, play it, tween both old and new to (0, 1) over 1000 ms, destroy old after fade-out completes.

**Random battle track.** On `GameScene.create()`:
```ts
const pool = ['battle-1', 'battle-2', 'battle-3', 'battle-4'];
const pick = pool[Math.floor(Math.random() * pool.length)];
this.audio.play(pick, { loop: true, fadeInMs: 1000 });
```

**Settings UI.**
- `MenuScene` — bottom-right "Settings" button (cyan outline, matching existing card style). Opens an overlay panel with: volume slider (`0.00–1.00` step `0.05`), mute toggle (`[M]` checkbox), close `[ESC]` binding. Same scene keeps existing weapon selection.
- `GameScene` pause overlay — extend the existing `PAUSED` text with the same volume + mute controls. ESC already toggles pause.

**Persistence.**
- `src/store/AudioSettings.ts` — parallels `MetaProgress` shape exactly: `STORAGE_KEY = "neon-drift:audio"`, static `load()` / `save()` / `setVolume()` / `setMuted()`, `mergeWithDefaults(parsed)` for safe parsing.
- Defaults: `volume = 0.5`, `muted = false`.
- Save on every slider tick and on mute toggle (debounce 100 ms to avoid localStorage thrash).

**Architecture sketch:**
```
src/
├── audio/
│   └── AudioManager.ts          // SoundManager wrapper, MusicController, cross-fade
├── store/
│   ├── MetaProgress.ts          // (unchanged)
│   └── AudioSettings.ts         // NEW: volume + muted to localStorage
└── ui/
    └── SettingsPanel.ts         // NEW: reusable volume slider + mute toggle, used by MenuScene + GameScene pause
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/audio/AudioManager.ts` | New | New wrapper around `this.sound` with cross-fade + settings binding |
| `src/store/AudioSettings.ts` | New | localStorage persistence for `{volume, muted}` |
| `src/ui/SettingsPanel.ts` | New | Reusable UI primitives (slider + mute button) for menu and pause |
| `src/scenes/MenuScene.ts` | Modified | Add `preload()` for music, instantiate `AudioManager`, mount `SettingsPanel` |
| `src/scenes/GameScene.ts` | Modified | Add `preload()` for battle tracks, instantiate `AudioManager`, extend pause overlay with `SettingsPanel` |
| `src/scenes/GameOverScene.ts` | Modified | Stop music on entry so the game-over screen is silent (no music file — design choice out of scope to add) |
| `src/main.ts` | Unchanged | Phaser config defaults are sufficient; no `audio:` override needed |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Browser autoplay policy blocks first-play attempt | Medium | Subscribe to `this.sound.once('unlocked', ...)` and gate `play()` behind it; falling back to play-on-first-keydown is already handled by Phaser for WebAudio |
| Phaser loads audio twice (once per scene) | Low | Phaser caches by key — second `load.audio` is a cache hit; acceptable for 5 small MP3s |
| localStorage unavailable (private mode) | Low | Mirror `MetaProgress` pattern: `try/catch + fail silently`, defaults apply |
| Slider tweens and slider drags fight | Medium | Drive volume changes directly on the `BaseSound` instance (not tween) for instant response; tween only for cross-fades |
| Mute toggle while game is paused | Medium | Persist + apply to `this.sound.mute` global flag so it takes effect on resume too; not just per-instance |
| MP3 playback gap at loop boundary | Low | WebAudio is gapless for most MP3s; HTML5 fallback may click — acceptable for jam scope |

## Rollback Plan

This change is additive — no existing scene behavior is removed. To roll back:

1. **Revert files**: `git checkout main -- src/scenes/MenuScene.ts src/scenes/GameScene.ts src/scenes/GameOverScene.ts`
2. **Delete new files**: `rm src/audio/AudioManager.ts src/store/AudioSettings.ts src/ui/SettingsPanel.ts`
3. **Audio assets untouched**: `src/assets/music/*.mp3` remains — harmless if unreferenced; the next proposal can reintroduce audio without re-adding files.

The game falls back to the current silent state. No data migration needed: `localStorage["neon-drift:audio"]` is harmless garbage if left behind; clear it manually if desired.

## Dependencies

- Phaser `SoundManager` (`this.sound`) — already wired by Phaser.AUTO; no extra config.
- MP3 assets already present at `src/assets/music/neon_drift_menu.mp3` and `neon_drift_battle_{1..4}.mp3`.
- `MetaProgress.ts` is the *pattern reference* (not a code dependency).

## Success Criteria

- [ ] On boot, `MenuScene` plays `neon_drift_menu.mp3` automatically (after browser unlock).
- [ ] Pressing ENTER from MenuScene fades menu music out and a randomly chosen battle track fades in over ~1s.
- [ ] Returning to menu (via GameOver → `[M]`) fades battle out and menu back in.
- [ ] In `GameScene`, pressing ESC shows the pause overlay with a working volume slider and mute toggle.
- [ ] In `MenuScene`, a Settings button opens an overlay with the same controls.
- [ ] Adjusting volume or mute persists across page reloads (localStorage).
- [ ] Default state on first load: volume `0.5`, not muted.
- [ ] Mute toggle on one scene affects audio on the next scene (single global mute flag).
- [ ] No regressions: weapon selection, pause toggle, shop, and game-over screen all still work as before.

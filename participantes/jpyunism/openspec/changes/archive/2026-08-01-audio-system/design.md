# Design: Audio System for Neon Drift

## Technical Approach

Add a thin `AudioManager` wrapper around Phaser's shared `SoundManager`, a `SettingsPanel` UI primitive reused by `MenuScene` and `GameScene`'s pause overlay, and a `localStorage`-backed `AudioSettings` store mirroring `MetaProgress`. Music cross-fades between scenes via paired tweens on `BaseSound.volume`. Everything runs additively — no scene behavior changes.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| AudioManager lifetime | **Per-scene instance** stored on `this.audio` (each scene constructs its own in `create()`) | Game-wide singleton; attach to `this.sound` | Scenes already own their lifecycle; cross-fade pairs the "outgoing" + "incoming" music instances owned by the destination scene. A singleton adds hidden coupling without payoff at jam scale. |
| Cross-fade impl | Two `tweens.add` on `BaseSound.volume` — old `volume → 0`, new `volume → settings.volume`, both `Linear`, 1000 ms. `onComplete` on fade-out calls `old.destroy()` | Single combined tween; manual `time.update` loop | TweenManager is the project's existing primitive; linear 1000 ms matches spec. |
| SettingsPanel | Plain `Phaser.GameObjects.Container` with rectangle + text + hit zones. Drag handler on the slider track updates `audio.setVolume(v)` directly (no tween) | Custom slider widget from scratch | Reuses the same monospace-text + rectangle visual language as `MenuScene`'s weapon cards and `GameOverScene`'s shop. |
| AudioSettings store | Static class `AudioSettings.{load,save,setVolume,setMuted,getSettings}`, key `"neon-drift:audio"`, `try/catch` + `mergeWithDefaults` — verbatim `MetaProgress` pattern | Inline in AudioManager | Symmetry with existing `MetaProgress`; future tweaks isolated to one file. |
| Loading strategy | Each scene calls `this.load.audio(...)` for its own keys in `preload()`. Phaser caches by key → second call is a no-op | New BootScene; share preload via class hierarchy | Simplest; spec accepts the worst-case double load (5 small MP3s, cached). |
| GameOver silence | `GameOverScene.create()` calls `this.audio.stop()` (hard stop, no fade) | Fade out | Spec mandates "no music SHALL play" on game-over; hard stop is the literal reading. |
| Mute global scope | `this.sound.mute = settings.muted` applied at AudioManager construction (single shared `SoundManager`) | Per-instance mute | Spec explicitly requires global mute across scenes; the SoundManager IS global. |

## Data Flow

```
MenuScene.create()
  └─→ new AudioManager(this)
        ├─ AudioSettings.load() → {volume: 0.5, muted: false}
        ├─ this.sound.mute = settings.muted
        └─ play('menu-music', {loop: true, fadeInMs: 0})
             (deferred if this.sound.locked → once 'unlocked')

ENTER pressed → scene.start('GameScene')
  └─→ MenuScene AudioManager: menu instance owned → fadeOut queued
       GameScene.create()
         └─→ new AudioManager(this)
               ├─ pick = BATTLE_POOL[randInt(0,3)]
               ├─ this.sound.mute = settings.muted
               └─ play('battle-N', {loop: true, fadeInMs: 1000})
                    → crossFadeTo() runs paired tweens
                    → onComplete(old) → old.destroy()

ESC in GameScene → togglePause() draws SettingsPanel inside pause overlay
  ├─ Slider drag → audio.setVolume(v) → AudioSettings.save (debounced 100 ms)
  └─ Mute click  → audio.setMuted(b)  → AudioSettings.save + this.sound.mute = b
```

```
AudioManager (per scene)
  ├── this.scene.sound        (Phaser SoundManager — shared global)
  ├── this.current?: BaseSound
  ├── this.targetVolume: number
  ├── play(key, opts)
  ├── stop()
  └── crossFadeTo(key, opts)  ← menu→game, game→menu

AudioSettings (static, global)
  └── localStorage["neon-drift:audio"]
       = {"volume": 0.5, "muted": false}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/audio/AudioManager.ts` | Create | Per-scene wrapper around `this.sound` with `play`, `stop`, `crossFadeTo`, volume/mute binding |
| `src/store/AudioSettings.ts` | Create | `load/save/setVolume/setMuted` static API; mirrors `MetaProgress` shape exactly |
| `src/ui/SettingsPanel.ts` | Create | Reusable Container: volume slider + mute button; reads AudioSettings on construct; debounced save |
| `src/scenes/MenuScene.ts` | Modify | Add `preload()` (load `menu-music`); in `create()` instantiate `AudioManager`, draw Settings button, mount `SettingsPanel` on click |
| `src/scenes/GameScene.ts` | Modify | Add `preload()` (load 4 `battle-N`); in `create()` instantiate `AudioManager`; extend `togglePause()` overlay to include `SettingsPanel` |
| `src/scenes/GameOverScene.ts` | Modify | `create()` calls `this.sound.stopAll()` (hard stop, no fade) |
| `src/main.ts` | Unchanged | Phaser AUTO handles SoundManager wiring |

## Interfaces / Contracts

```ts
// src/audio/AudioManager.ts
export interface AudioPlayOptions {
  loop?: boolean;
  volume?: number;     // target after fade-in
  fadeInMs?: number;   // 0 = start at target immediately
}

export class AudioManager {
  constructor(scene: Phaser.Scene);
  play(key: string, opts?: AudioPlayOptions): void;
  stop(): void;                                    // hard stop, no fade
  crossFadeTo(key: string, opts?: AudioPlayOptions): void;
  setVolume(v: number): void;                      // applied to current
  setMuted(m: boolean): void;                      // applied to this.sound.mute
  destroy(): void;                                 // cleans tweens
}
```

```ts
// src/store/AudioSettings.ts
export interface AudioSettingsData {
  volume: number;   // 0..1
  muted: boolean;
}
export class AudioSettings {
  static load(): AudioSettingsData;
  static save(d: AudioSettingsData): void;
  static setVolume(v: number): AudioSettingsData;
  static setMuted(m: boolean): AudioSettingsData;
  static getSettings(): AudioSettingsData;
}
```

```ts
// src/ui/SettingsPanel.ts
export class SettingsPanel {
  constructor(scene: Phaser.Scene, opts?: { x?: number; y?: number; compact?: boolean });
  show(): void;     // mounts Container
  hide(): void;     // destroys Container
  destroy(): void;
}
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Manual | Menu music auto-plays after first key | Reload page, press any key, audio starts |
| Manual | Cross-fade menu → game | Press ENTER, listen for 1 s fade; menu dies, battle plays |
| Manual | Cross-fade game → menu | Run → die → press M; battle fades, menu returns |
| Manual | GameOver silence | Die → confirm no audio on game-over screen |
| Manual | Settings persist | Set volume 0.8, mute, reload → both applied |
| Manual | Global mute | Mute in menu → start run → no battle audio |
| Manual | Slider no fight | Drag slider rapidly → no clipping/popping |

Automated test infra doesn't exist in this jam build — verification is manual audio checks.

## Migration / Rollout

No migration. New localStorage key `"neon-drift:audio"` is additive; missing → defaults. Rollback = delete the 3 new files + revert 3 scene files (per proposal's rollback plan).

## Open Questions

- None blocking. Single non-trivial judgement: hard-stop vs fade-out on GameOverScene — proposal/spec both say stop; design honors that. If UX testing prefers a fade, it's a one-line change.
# Audio Music and Settings Specification

## Purpose

Defines background music playback, cross-fade transitions, random battle track selection, and persistent volume/mute settings for Neon Drift across `MenuScene`, `GameScene`, and `GameOverScene`.

## Requirements

### Requirement: Menu Music Auto-Play

The system SHALL loop `neon_drift_menu.mp3` automatically when `MenuScene` starts, gated on Phaser's audio unlock event.

#### Scenario: Plays after unlock

- GIVEN the page just loaded and audio is locked
- WHEN `MenuScene.create()` registers `this.sound.once('unlocked', …)`
- THEN `neon_drift_menu.mp3` MUST start looping within 1 frame of unlock

#### Scenario: Stops on scene exit

- GIVEN menu music is playing
- WHEN the player presses ENTER and transitions to `GameScene`
- THEN menu music MUST NOT continue audibly into `GameScene`

### Requirement: Random Battle Track Selection

`GameScene` SHALL randomly select exactly one of `neon_drift_battle_1..4.mp3` on every fresh start and play it looping.

#### Scenario: Random pick on game start

- GIVEN `GameScene.create()` runs
- WHEN the random pick happens
- THEN exactly one battle track MUST loop, uniformly distributed across runs

### Requirement: Cross-Fade Between Scenes

The system MUST cross-fade music between scenes with a linear 1000 ms fade-out and fade-in.

#### Scenario: Menu to game cross-fade

- GIVEN menu music is playing
- WHEN the player enters `GameScene`
- THEN menu volume MUST tween to 0 over 1000 ms and the battle track MUST tween from 0 to settings volume over 1000 ms
- AND the old menu instance MUST be destroyed after fade-out completes

#### Scenario: Game to menu cross-fade on return

- GIVEN battle music is playing
- WHEN the player presses `M` to return to menu from `GameOverScene`
- THEN battle music MUST fade out and menu music MUST fade in over ~1000 ms

### Requirement: GameOver Silence

`GameOverScene` MUST stop all background music on entry; no music SHALL play on the game-over screen.

#### Scenario: Game-over screen is silent

- GIVEN battle music is playing
- WHEN `GameOverScene` starts
- THEN battle music MUST be stopped (no fade) and no other music SHALL start

### Requirement: Persistent Volume and Mute Settings

The system MUST persist `{volume, muted}` to `localStorage` under `neon-drift:audio` and load on game start. Volume MUST be in `[0.0, 1.0]`; defaults: `volume = 0.5`, `muted = false`.

#### Scenario: Defaults on first load

- GIVEN no `neon-drift:audio` key exists
- WHEN the game reads settings at startup
- THEN volume MUST be `0.5` and muted MUST be `false`

#### Scenario: Settings persist across reload

- GIVEN the player sets volume to `0.8` and mutes
- WHEN the page is reloaded
- THEN loaded settings MUST be `{volume: 0.8, muted: true}` and music MUST start muted at 0.8

#### Scenario: localStorage unavailable

- GIVEN `localStorage.setItem` throws
- WHEN settings are saved
- THEN the error MUST be swallowed silently and defaults MUST remain applied in memory

### Requirement: Settings UI in Menu and Pause

A reusable settings panel MUST be reachable from `MenuScene` (Settings button) and the `GameScene` pause overlay, with a volume slider (step `0.05`, range `0.00–1.00`) and mute toggle. Changes MUST save on every interaction.

#### Scenario: Menu settings overlay

- GIVEN the player is in `MenuScene`
- WHEN they click the Settings button
- THEN an overlay MUST open with volume slider and mute toggle, and ESC MUST close it

#### Scenario: Pause overlay extends with settings

- GIVEN the player presses ESC in `GameScene`
- WHEN the pause overlay renders
- THEN it MUST include a volume slider and mute toggle alongside `PAUSED`

### Requirement: Global Mute Across Scenes

Mute MUST apply via `this.sound.mute` (shared SoundManager) so toggles affect every scene.

#### Scenario: Mute carries across scenes

- GIVEN the player mutes audio in `MenuScene`
- WHEN `GameScene` plays a battle track
- THEN the battle track MUST NOT be audible

## Non-Goals

No SFX, spatial audio, or adaptive layers. No new audio files; only the five MP3s in `src/assets/music/`.
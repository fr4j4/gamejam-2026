# SDD Archive Report — `audio-system`

**Change**: Audio System for Neon Drift
**Archived**: 2026-08-01
**Mode**: hybrid (filesystem + Engram observation #38, topic_key `sdd/audio-system/archive-report`)
**Cycle status**:  complete

---

## Status

**`complete`** — all gates passed, change promoted to source of truth, archive folder established.

### Gate summary

| Gate | Result | Evidence |
|------|--------|----------|
| Task Completion |  pass | 23/23 tasks marked `[x]` in archived `tasks.md` |
| Native Review Receipt | n/a | gentle-ai flow — no review gate required (change did not opt into adversarial review) |
| Spec Sync |  pass | Delta spec copied to main specs (new capability) |
| Archive Move |  pass | `openspec/changes/audio-system/` → `openspec/changes/archive/2026-08-01-audio-system/` |
| Archive Report Persist |  pass | Engram observation #38 + this file |

---

## Executive Summary

The audio-system change adds background music playback, cross-fade transitions, persistent volume/mute settings, and a reusable settings panel to Neon Drift. All 7 requirements and 12 scenarios pass verification; all 7 architecture decisions are honored in code; `npx tsc --noEmit` exits cleanly; Playwright smoke tests pass (2/2).

The change shipped three new files (`src/audio/AudioManager.ts`, `src/store/AudioSettings.ts`, `src/ui/SettingsPanel.ts`) and modified three scene files (`MenuScene`, `GameScene`, `GameOverScene`) — matching the design's predicted `File Changes` table exactly.

Three implementation fixes landed during verification (not part of the original task list) and are now part of the final state:

1. **ShooterEnemy projectiles were static** — `group.add()` was called after `setVelocity()`. Fixed by adding to group first, then setting velocity.
2. **Audio asset path migration** — files moved from `src/assets/music/` to `public/assets/music/` because Vite doesn't serve `src/assets/` as URLs.
3. **Phaser config** — `disableWebAudio: true` added because WebAudio couldn't decode the MP3s.

Two non-blocking design deviations are documented in `verify-report.md` and carried forward as known caveats:

- `MenuScene` uses `fadeInMs: 1000` on the initial menu play (design said `0`) — deliberate UX symmetry decision.
- `AudioManager.setVolume(v, persist)` exposes an extra `persist` boolean — necessary for the slider's 100 ms debounced save.

---

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `audio-music-and-settings` | **Created** (new capability) | 7 requirements, 12 scenarios — full spec copied verbatim from `openspec/changes/archive/2026-08-01-audio-system/specs/audio-music-and-settings/spec.md` to `openspec/specs/audio-music-and-settings/spec.md` |

This is the first capability spec promoted to main specs in this repo. The `openspec/specs/` directory previously contained only one design doc (`2026-08-01-neon-drift-design.md`).

### Spec requirements (R1–R7)
1. Menu Music Auto-Play
2. Random Battle Track Selection
3. Cross-Fade Between Scenes
4. GameOver Silence
5. Persistent Volume and Mute Settings
6. Settings UI in Menu and Pause
7. Global Mute Across Scenes

---

## Archive Contents

```
openspec/changes/archive/2026-08-01-audio-system/
├── proposal.md                       (8,857 bytes)
├── design.md                         (7,540 bytes — 7 architecture decisions)
├── tasks.md                          (3,678 bytes — 23/23 ✅)
├── specs/
│   └── audio-music-and-settings/
│       └── spec.md                   (4,128 bytes — 7 reqs, 12 scenarios)
└── verify-report.md                  (13,035 bytes — PASS, ready-for-archive)
```

---

## Source of Truth Updated

```
openspec/specs/
├── 2026-08-01-neon-drift-design.md   (pre-existing design doc)
└── audio-music-and-settings/
    └── spec.md                       (NEW — promoted from delta)
```

Future changes that touch audio/music/settings MUST read this main spec as the source of truth.

---

## Final-State Facts (carry-forward from verify-report.md)

These describe the state at close, not intermediate snapshots. They were confirmed by the orchestrator after verify-report.md was persisted.

- **All 23 tasks complete** and marked `[x]` in `tasks.md`.
- **TypeScript compiles cleanly**: `npx tsc --noEmit` exits 0 with no output.
- **Playwright tests pass**: 2/2 — canvas renders with correct dimensions, page title correct.
- **Bug fix landed during verification**: ShooterEnemy projectiles were static because `group.add()` was called AFTER `setVelocity()`. Fixed by adding to group first.
- **Asset migration**: Audio files moved from `src/assets/music/` to `public/assets/music/` (Vite doesn't serve `src/assets/` as URLs).
- **Phaser config**: `disableWebAudio: true` added because WebAudio couldn't decode the MP3s.

---

## Non-Blocking Risks (carried forward)

These are documented in `verify-report.md` and judged acceptable at jam scale. Flagged here so any future iteration of the audio system can revisit them.

1. **Volume scaling on live tracks during fade-in.** `setVolume(v)` does not mutate a live tween's `to` target. The slider value wins after the tween completes (~1 s). Acceptable at jam scale.
2. **ESC handler ordering in `MenuScene`.** The ESC-settings handler only closes the settings panel if visible — no conflict with weapon-pick or ENTER.
3. **`AudioManager.destroy()` does NOT detach from `this.sound`.** Phaser's tween system cleans up on scene shutdown, so this is safe.
4. **`MenuScene` uses `fadeInMs: 1000` on first menu play** (design said `0`). Deliberate UX symmetry deviation.
5. **`SettingsPanel.Options.compact` flag is unused.** Reserved for future styling — dead surface only.

---

## Next Recommended

1. **Manual audio smoke test** — run `npm run dev`, walk through the 6-step checklist in `verify-report.md` (≤ 30 s per row). Confirms audible behavior across menu→game→game-over→menu cycle, including volume & mute persistence.
2. **Defer the 5 non-blocking risks** unless they become user-visible. None blocked the archive.
3. **Next change** — pick the next feature from the game jam backlog. The SDD pipeline is ready (init → explore → propose → spec → design → tasks → apply → verify → archive).

---

## Skill Resolution

| Skill | Loaded? | Reason |
|-------|---------|--------|
| `i-have-adhd` | yes | Archive reply shaped for the reader (numbered, concrete next actions, time estimates) |
| `sdd-archive` | yes | This is the archive sub-agent execution |
| `engram` protocol | yes | Report persisted to Engram topic_key `sdd/audio-system/archive-report` (observation #38) and to filesystem |

---

## Engram Reference

- **Observation ID**: `38`
- **Topic Key**: `sdd/audio-system/archive-report`
- **Type**: `architecture`
- **Sync ID**: `obs-07d653c809dfa3e8`
- **Project**: `gamejam-2026`

---

**SDD Cycle Complete.** The audio-system change is fully planned, implemented, verified, and archived. Ready for the next change.

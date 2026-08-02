/**
 * Singleton EventBus for cross-scene / cross-system communication.
 * All events use `domain:action` naming.
 */
import Phaser from "phaser";

export const EventBus = new Phaser.Events.EventEmitter();

// ─── Spectacle event constants ──────────────────────────────────────────
export const SPECTACLE_ENTRANCE = "spectacle:entrance";
export const SPECTACLE_ACTION = "spectacle:action";
export const SPECTACLE_HIT = "spectacle:hit";
export const SPECTACLE_COMBO = "spectacle:combo";
export const SPECTACLE_STREAK = "spectacle:streak";
export const SPECTACLE_NEAR_MISS = "spectacle:near_miss";

// ─── Game events ─────────────────────────────────────────────────────────
export const GAME_PLAYER_DIED = "game:player-died";
export const GAME_ENEMY_KILLED = "game:enemy-killed";
export const GAME_WAVE_START = "game:wave-start";
export const GAME_WAVE_END = "game:wave-end";
export const GAME_LEVEL_UP = "game:level-up";
export const GAME_PAUSED = "game:paused";
export const GAME_RESUMED = "game:resumed";

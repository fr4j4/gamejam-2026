/**
 * Persistent audio settings for Neon Drift.
 *
 * Mirrors the `MetaProgress` pattern: a static API backed by a single
 * `localStorage` key, with try/catch wrapping every read and write so that
 * private-mode browsers, quota errors, or JSON corruption never crash the
 * game. The in-memory `cached` object is the source of truth between calls
 * — `localStorage` is just the durability layer.
 *
 * Defaults: `{ volume: 0.5, muted: false }`. Missing or malformed data
 * silently falls back to those defaults.
 */

export interface AudioSettingsData {
  /** Clamped to [0, 1]. */
  volume: number;
  /** Muting is global — toggles Phaser's shared SoundManager. */
  muted: boolean;
}

const STORAGE_KEY = "neon-drift:audio";

const DEFAULT_SETTINGS: AudioSettingsData = {
  volume: 0.5,
  muted: false,
};

/** Module-level cache. Kept mutable so static methods stay O(1). */
let cached: AudioSettingsData = { ...DEFAULT_SETTINGS };

export class AudioSettings {
  /**
   * Reads persisted settings from `localStorage`, merging with defaults to
   * tolerate missing fields or older payloads. Returns a copy so callers
   * can't mutate the cache by accident.
   */
  public static load(): AudioSettingsData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AudioSettingsData>;
        cached = mergeWithDefaults(parsed);
      } else {
        cached = { ...DEFAULT_SETTINGS };
      }
    } catch {
      // Private mode, quota, malformed JSON — fall back to defaults in memory.
      cached = { ...DEFAULT_SETTINGS };
    }
    return { ...cached };
  }

  /**
   * Replaces the cached settings and persists the replacement. Failures
   * (e.g. localStorage quota) are swallowed silently — the in-memory cache
   * still reflects the requested change for the rest of the session.
   */
  public static save(data: AudioSettingsData): void {
    cached = {
      volume: clamp01(data.volume),
      muted: !!data.muted,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {
      // Silent — see load().
    }
  }

  /**
   * Convenience setter. Clamps to [0, 1], persists, and returns the new
   * full settings object so callers can re-read in one round trip.
   */
  public static setVolume(v: number): AudioSettingsData {
    cached.volume = clamp01(v);
    AudioSettings.save(cached);
    return { ...cached };
  }

  /**
   * Convenience setter. Persists the boolean and returns the new settings.
   */
  public static setMuted(muted: boolean): AudioSettingsData {
    cached.muted = !!muted;
    AudioSettings.save(cached);
    return { ...cached };
  }

  /**
   * Returns a copy of the current cached settings without touching
   * localStorage. Useful for UI that wants to render the latest values
   * without forcing a re-read.
   */
  public static getSettings(): AudioSettingsData {
    return { ...cached };
  }
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) {
    return DEFAULT_SETTINGS.volume;
  }
  return Math.max(0, Math.min(1, v));
}

function mergeWithDefaults(parsed: Partial<AudioSettingsData>): AudioSettingsData {
  const merged: AudioSettingsData = { ...DEFAULT_SETTINGS };
  if (typeof parsed.volume === "number" && Number.isFinite(parsed.volume)) {
    merged.volume = clamp01(parsed.volume);
  }
  if (typeof parsed.muted === "boolean") {
    merged.muted = parsed.muted;
  }
  return merged;
}

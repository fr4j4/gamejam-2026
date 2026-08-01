/**
 * Centralized game state for a single run.
 * Call `reset()` before starting a new run so no stale state leaks across restarts.
 */
export class GameState {
  public runCoins: number = 0;
  public waveNumber: number = 0;
  public level: number = 1;
  public killsThisLevel: number = 0;
  public killsRequired: number = 8;
  public isPaused: boolean = false;

  /** Active timed power-up expiries: id → expiry timestamp (scene time). */
  public readonly activePowerUps: Map<string, number> = new Map();
  /** Permanent-run power-ups currently applied. */
  public readonly permanentPowerUps: Set<string> = new Set();

  reset(): void {
    this.runCoins = 0;
    this.waveNumber = 0;
    this.level = 1;
    this.killsThisLevel = 0;
    this.killsRequired = 8;
    this.isPaused = false;
    this.activePowerUps.clear();
    this.permanentPowerUps.clear();
  }
}

/** Singleton instance for the current run. */
export const gameState = new GameState();

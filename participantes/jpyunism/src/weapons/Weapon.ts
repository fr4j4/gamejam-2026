import Phaser from "phaser";

export abstract class Weapon {
  public readonly name: string;
  /** Base damage. Power-ups (e.g. Damage Amp) can mutate this at runtime. */
  public damage: number;
  /** Base cooldown in ms. Power-ups (e.g. Cadence Boost) can mutate this. */
  public cooldown: number;
  public readonly range: number;
  public lastFiredAt: number = 0;

  constructor(name: string, damage: number, cooldown: number, range: number) {
    this.name = name;
    this.damage = damage;
    this.cooldown = cooldown;
    this.range = range;
  }

  public canFire(time: number): boolean {
    return time - this.lastFiredAt >= this.cooldown;
  }

  public abstract fire(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
  ): void;

  public getDisplayName(): string {
    return this.name;
  }
}
// ─── Sweep Pattern: constant-speed overflight past the player ───────────────

import * as THREE from 'three';
import type { Enemy } from '../Enemy';
import type { Projectile } from '../../weapons/Projectile';
import type { PatternBase } from './PatternBase';
import { dodgeLasers, overfly } from './movement';

export class SweepPattern implements PatternBase {
  name = 'SWEEP';
  private phase = Math.random() * Math.PI * 2;

  update(enemy: Enemy, dt: number, playerPos: THREE.Vector3, playerProjectiles?: Projectile[]): void {
    const pos = enemy.position;
    const speed = enemy.speed;

    dodgeLasers(pos, playerProjectiles, speed, dt);

    // Overfly the player: constant forward speed with a lateral weave.
    overfly(pos, playerPos, speed, dt, this.phase);
  }
}

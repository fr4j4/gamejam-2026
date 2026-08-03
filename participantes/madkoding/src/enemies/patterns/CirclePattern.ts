// ─── Circle Pattern: constant-speed overflight with a wide orbit ────────────

import * as THREE from 'three';
import type { Enemy } from '../Enemy';
import type { Projectile } from '../../weapons/Projectile';
import type { PatternBase } from './PatternBase';
import { dodgeLasers, overfly } from './movement';

export class CirclePattern implements PatternBase {
  name = 'CIRCLE';
  private phase = Math.random() * Math.PI * 2;

  update(enemy: Enemy, dt: number, playerPos: THREE.Vector3, playerProjectiles?: Projectile[]): void {
    const pos = enemy.position;
    const speed = enemy.speed;

    dodgeLasers(pos, playerProjectiles, speed, dt);

    // Overfly with a wide, sweeping orbit around the player.
    overfly(pos, playerPos, speed, dt, this.phase, 6, 3.5);
  }
}

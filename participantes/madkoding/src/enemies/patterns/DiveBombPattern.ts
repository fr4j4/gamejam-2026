// ─── Dive Bomb: overflight with periodic dives toward the player ────────────

import * as THREE from 'three';
import type { Enemy } from '../Enemy';
import type { Projectile } from '../../weapons/Projectile';
import type { PatternBase } from './PatternBase';
import { dodgeLasers, overfly } from './movement';

export class DiveBombPattern implements PatternBase {
  name = 'DIVE_BOMB';
  private phase = Math.random() * Math.PI * 2;
  private diveTimer = 0;
  private diving = false;
  private diveCooldown = 5.0;

  update(enemy: Enemy, dt: number, playerPos: THREE.Vector3, playerProjectiles?: Projectile[]): void {
    const pos = enemy.position;
    const speed = enemy.speed;

    dodgeLasers(pos, playerProjectiles, speed, dt);

    this.diveTimer += dt;
    if (!this.diving && this.diveTimer > this.diveCooldown) {
      this.diving = true; this.diveTimer = 0;
      this.diveCooldown = 4.0 + Math.random() * 4.0;
    }

    if (this.diving) {
      // Dive toward the player, then resume overflight.
      const dir = playerPos.clone().sub(pos).normalize();
      pos.addScaledVector(dir, speed * 1.5 * dt);
      enemy.spinBody(dt * 8);
      if (this.diveTimer > 2.0 || pos.z > playerPos.z - 3) {
        this.diving = false; this.diveTimer = 0;
      }
    } else {
      // Overfly with a moderate weave.
      overfly(pos, playerPos, speed, dt, this.phase, 5, 3);
    }
  }
}

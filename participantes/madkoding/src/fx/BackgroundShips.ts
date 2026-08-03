// ─── Background Corvettes (decorative large ships, off to the sides) ────────
// Corvettes stay FAR off the play field (|x| > 40) so they never block the
// ship's path. Some enemy formations spawn from behind a corvette.

import * as THREE from 'three';

interface Corvette {
  group: THREE.Group;
  speed: number;
  side: number; // -1 = left, +1 = right
  // Warp-in state
  warpIn: boolean;
  warpTimer: number;
  warpDuration: number;
  warpStartZ: number;
  warpEndZ: number;
  portal: THREE.Group;
  portalPulse: number;
  // Portal fadeout/zoomout after the corvette stops
  portalFading: boolean;
  portalFade: number; // 0..1, 1 = fully faded
  // Hold in place after warp-in before recycling
  holdTimer: number;
  holdDuration: number;
}

export class BackgroundShips {
  private scene: THREE.Scene;
  private corvettes: Corvette[] = [];
  // Expose positions so WaveManager can spawn enemies behind corvettes
  private _positions: THREE.Vector3[];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Pre-allocate a position buffer matching the corvette count (4)
    this._positions = [
      new THREE.Vector3(), new THREE.Vector3(),
      new THREE.Vector3(), new THREE.Vector3(),
    ];
    for (let i = 0; i < 4; i++) {
      const c = this.createCorvette(i);
      this.corvettes.push(c);
      this.scene.add(c.group);
    }
  }

  get positions(): THREE.Vector3[] { return this._positions; }

  private createCorvette(index: number): Corvette {
    const group = new THREE.Group();
    const side = index % 2 === 0 ? -1 : 1;

    // Materials — lighter grey with strong emissive so they're visible at distance
    const hullMat = new THREE.MeshPhongMaterial({
      color: 0x8a9bb0, emissive: 0x445566, emissiveIntensity: 0.5, shininess: 50,
    });
    const darkMat = new THREE.MeshPhongMaterial({
      color: 0x6a7a8a, emissive: 0x334455, emissiveIntensity: 0.4, shininess: 40,
    });
    const accentMat = new THREE.MeshPhongMaterial({
      color: 0x4466aa, emissive: 0x224488, emissiveIntensity: 0.5, shininess: 50,
    });

    // ── Angular wedge hull (octahedron stretched) ──
    const hullGeo = new THREE.ConeGeometry(3, 16, 4); // 4-sided = angular diamond
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.rotation.x = Math.PI / 2;
    hull.rotation.z = Math.PI / 4;
    hull.scale.set(1.2, 1, 1);
    group.add(hull);

    // ── Angular bow (pyramid front) ──
    const bowGeo = new THREE.ConeGeometry(3, 6, 4);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.z = Math.PI / 4;
    bow.position.z = -10;
    bow.scale.set(1.2, 1, 1);
    group.add(bow);

    // ── Flat stern panel ──
    const sternGeo = new THREE.BoxGeometry(4, 1, 3);
    const stern = new THREE.Mesh(sternGeo, darkMat);
    stern.position.z = 9.5;
    group.add(stern);

    // ── Bridge tower (angular box) ──
    const towerGeo = new THREE.BoxGeometry(2.5, 3, 3.5);
    const tower = new THREE.Mesh(towerGeo, darkMat);
    tower.position.set(0, 2, -1);
    group.add(tower);

    // Tower top antenna
    const antGeo = new THREE.BoxGeometry(0.1, 2, 0.1);
    const ant = new THREE.Mesh(antGeo, darkMat);
    ant.position.set(0, 4.5, -1);
    group.add(ant);

    // ── Angular side fins (delta shapes) ──
    for (const x of [-1, 1]) {
      const finShape = new THREE.Shape();
      finShape.moveTo(0, 0);
      finShape.lineTo(x * 5, 1);
      finShape.lineTo(x * 5, -2);
      finShape.lineTo(0, -3);
      finShape.lineTo(0, 0);
      const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.3, bevelEnabled: false });
      finGeo.rotateX(-Math.PI / 2);
      const fin = new THREE.Mesh(finGeo, darkMat);
      fin.position.set(x * 2.5, -0.5, 3);
      group.add(fin);
    }

    // ── Running lights (row of small glowing dots along the hull) ──
    const lightGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const lightColors = [0x00ffff, 0xff4400, 0x00ff00, 0xffaa00];
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const z = -6 + t * 12;
      const x = 2.5 * Math.cos(t * Math.PI) * (1 - Math.abs(t - 0.5) * 0.3);
      for (const dir of [-1, 1]) {
        const c = lightColors[i % lightColors.length];
        const light = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({
          color: c, transparent: true, opacity: 0.9,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        light.position.set(dir * x, 0.3, z);
        group.add(light);
      }
    }

    // ── Engine glows (bright blue, rear) ──
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x44aaff, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    for (const x of [-1.2, 0, 1.2]) {
      const g = new THREE.Mesh(new THREE.CircleGeometry(0.6, 8), glowMat.clone());
      g.position.set(x, 0, 11);
      g.rotation.y = Math.PI;
      group.add(g);
    }

    // ── Blinking red beacon on top ──
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    beacon.position.set(0, 5, -1);
    beacon.name = 'beacon';
    group.add(beacon);

    // ── Position: far off to the side, never in the play field ──
    const xOff = side * THREE.MathUtils.randFloat(50, 90);
    const yOff = THREE.MathUtils.randFloat(-20, 30);
    const zOff = -THREE.MathUtils.randFloat(80, 250) - index * 40;
    group.scale.setScalar(3);
    group.position.set(xOff, yOff, zOff);

    // ── Warp portal: a glowing ring + swirling disc the corvette emerges from ──
    const portal = this.createPortal();
    portal.position.copy(group.position);
    this.scene.add(portal);

    return {
      group,
      speed: THREE.MathUtils.randFloat(3, 7),
      side,
      warpIn: true,
      warpTimer: 0,
      warpDuration: 2.2,
      warpStartZ: zOff,
      // Stop just in front of the portal (toward the camera) so the corvette's
      // tail stays near the portal it emerged from. Ship is ~48 units long
      // (scaled 3x), so center stops ~25 units ahead of the portal.
      warpEndZ: zOff + 25,
      portal,
      portalPulse: 0,
      portalFading: false,
      portalFade: 0,
      holdTimer: 0,
      holdDuration: THREE.MathUtils.randFloat(6, 10),
    };
  }

  // Build a dramatic warp portal: vertical ring facing the camera + swirling
  // additive disc + a fire ring around the rim with orbiting fire particles.
  // Sized to match the corvette (~48 units long at 3x scale).
  private createPortal(): THREE.Group {
    const portal = new THREE.Group();
    const R = 22; // portal radius, comparable to the corvette length

    // Outer ring (torus) — cyan/white energy. Default torus lies in the XY
    // plane (normal along +Z), so it faces the camera. No rotation.
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(R, 1.6, 16, 64),
      new THREE.MeshBasicMaterial({
        color: 0x66ccff, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    portal.add(ring);

    // Fire ring around the rim — orange/red torus slightly larger.
    const fire = new THREE.Mesh(
      new THREE.TorusGeometry(R + 1.2, 1.1, 16, 64),
      new THREE.MeshBasicMaterial({
        color: 0xff6622, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    portal.add(fire);

    // Fire particles orbiting the rim — a ring of additive points that look
    // like flames licking the portal edge.
    const fireCount = 60;
    const fireGeo = new THREE.BufferGeometry();
    const firePos = new Float32Array(fireCount * 3);
    for (let i = 0; i < fireCount; i++) {
      const a = (i / fireCount) * Math.PI * 2;
      const r = R + 1.2 + (Math.random() - 0.5) * 2.5;
      firePos[i * 3] = Math.cos(a) * r;
      firePos[i * 3 + 1] = Math.sin(a) * r;
      firePos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    fireGeo.setAttribute('position', new THREE.BufferAttribute(firePos, 3));
    const fireMat = new THREE.PointsMaterial({
      color: 0xff8844,
      size: 1.6,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const firePoints = new THREE.Points(fireGeo, fireMat);
    firePoints.userData.basePositions = firePos.slice();
    portal.add(firePoints);

    portal.visible = false;
    return portal;
  }

  // Rotate the orbiting fire particles around the portal rim.
  private animateFire(portal: THREE.Group, dt: number): void {
    const firePoints = portal.children.find((c) => c instanceof THREE.Points) as THREE.Points | undefined;
    if (!firePoints) return;
    const attr = firePoints.geometry.attributes.position as THREE.BufferAttribute;
    const pos = attr.array as Float32Array;
    const base = firePoints.userData.basePositions as Float32Array;
    const t = performance.now() * 0.001;
    const R = 22;
    for (let i = 0; i < pos.length / 3; i++) {
      const a = (i / (pos.length / 3)) * Math.PI * 2 + t * 1.2;
      const r = R + 1.2 + Math.sin(t * 3 + i) * 1.2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = base[i * 3 + 2] + Math.sin(t * 5 + i) * 0.8;
    }
    attr.needsUpdate = true;
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    for (let i = 0; i < this.corvettes.length; i++) {
      const c = this.corvettes[i];

      // ── Warp-in sequence: emerge dramatically from a portal at warp speed ──
      if (c.warpIn) {
        c.warpTimer += dt;
        const p = Math.min(1, c.warpTimer / c.warpDuration);

        // Portal visible and pulsing while the corvette emerges. It expands
        // dramatically from a small point to full size (dramatic arrival).
        c.portal.visible = true;
        c.portalPulse += dt * 6;
        const pulse = 1 + Math.sin(c.portalPulse) * 0.15;
        const expand = THREE.MathUtils.lerp(0.2, 1, Math.min(1, p * 2.2));
        c.portal.scale.setScalar(expand * pulse);
        this.animateFire(c.portal, dt);
        const ringMat = c.portal.children[0] as THREE.Mesh;
        (ringMat.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - p * 0.6);

        // Corvette flies from the far background toward the camera (Z grows
        // from very negative to less negative). It scales up uniformly as it
        // approaches — no Z-stretch (that looked like gum).
        const warpZ = THREE.MathUtils.lerp(c.warpStartZ, c.warpEndZ, p);
        c.group.position.z = warpZ;
        const grow = THREE.MathUtils.lerp(0.4, 3, p);
        c.group.scale.setScalar(grow);

        if (p >= 1) {
          c.warpIn = false;
          c.group.scale.setScalar(3);
          c.holdTimer = 0;
          // Start the portal fadeout/zoomout now that the corvette has stopped.
          c.portalFading = true;
          c.portalFade = 0;
        }
        // Record position for WaveManager to spawn enemies behind
        this._positions[i].copy(c.group.position);
        continue;
      }

      // Portal fadeout + zoomout after the corvette stops.
      if (c.portalFading) {
        c.portalFade += dt / 0.8; // fade over 0.8s
        const f = Math.min(1, c.portalFade);
        // Zoom out (grow) and fade out simultaneously.
        c.portal.scale.setScalar(1 + f * 2.5);
        for (const child of c.portal.children) {
          if (child instanceof THREE.Points) {
            (child.material as THREE.PointsMaterial).opacity = Math.max(0, 0.9 - f);
          } else {
            const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
            m.opacity = Math.max(0, m.opacity - dt * 1.2);
          }
        }
        if (f >= 1) {
          c.portalFading = false;
          c.portal.visible = false;
        }
      }

      // Hold in place for a while after warp-in before drifting forward.
      if (c.holdTimer < c.holdDuration) {
        c.holdTimer += dt;
        this._positions[i].copy(c.group.position);
        continue;
      }

      // Drift slowly toward +Z (toward and past the player)
      c.group.position.z += c.speed * dt;

      // Beacon blink
      const beacon = c.group.getObjectByName('beacon');
      if (beacon) {
        (beacon as THREE.Mesh).visible = Math.floor(performance.now() * 0.003) % 2 === 0;
      }

      // Record position for WaveManager to spawn enemies behind
      this._positions[i].copy(c.group.position);

      // Recycle when it passes the player — keep it off to the sides.
      // Re-enter through a warp portal for a dramatic arrival.
      if (c.group.position.z > playerPos.z + 50) {
        const newZ = playerPos.z - THREE.MathUtils.randFloat(180, 300);
        c.group.position.set(
          c.side * THREE.MathUtils.randFloat(50, 90),
          THREE.MathUtils.randFloat(-20, 30),
          newZ
        );
        c.portal.position.copy(c.group.position);
        c.warpIn = true;
        c.warpTimer = 0;
        c.warpStartZ = newZ;
        c.warpEndZ = newZ + 25;
        c.holdTimer = 0;
      }
    }
  }

  reset(): void {
    for (let i = 0; i < this.corvettes.length; i++) {
      const c = this.corvettes[i];
      const zOff = -THREE.MathUtils.randFloat(80, 250) - i * 40;
      c.group.position.set(
        c.side * THREE.MathUtils.randFloat(50, 90),
        THREE.MathUtils.randFloat(-20, 30),
        zOff
      );
      c.group.scale.setScalar(3);
      c.portal.position.copy(c.group.position);
      c.portal.visible = false;
      c.warpIn = true;
      c.warpTimer = 0;
      c.warpStartZ = zOff;
      c.warpEndZ = zOff + 25;
      c.holdTimer = 0;
    }
  }

  dispose(): void {
    for (const c of this.corvettes) {
      this.scene.remove(c.group);
      c.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.scene.remove(c.portal);
      c.portal.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    this.corvettes = [];
  }
}
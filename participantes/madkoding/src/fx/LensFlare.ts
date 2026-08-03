// ─── Star Flare FX: procedural 4-point star sprite for light sources ────────
// Generates a 4-point anamorphic star texture at runtime (no external assets)
// and attaches it as an additive sprite that always faces the camera.

import * as THREE from 'three';

const starCache = new Map<number, THREE.Texture>();

function makeStarTexture(color: number): THREE.Texture {
  const cached = starCache.get(color);
  if (cached) return cached;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(color);
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  const cx = size / 2;
  const cy = size / 2;

  // 4-point star (anamorphic lens flare) drawn as two crossing thin gradients.
  const gradX = ctx.createLinearGradient(0, cy, size, cy);
  gradX.addColorStop(0, 'rgba(0,0,0,0)');
  gradX.addColorStop(0.5, `rgba(${r},${g},${b},1)`);
  gradX.addColorStop(1, 'rgba(0,0,0,0)');
  const gradY = ctx.createLinearGradient(cx, 0, cx, size);
  gradY.addColorStop(0, 'rgba(0,0,0,0)');
  gradY.addColorStop(0.5, `rgba(${r},${g},${b},1)`);
  gradY.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradX;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = gradY;
  ctx.fillRect(0, 0, size, size);

  // Soft central glow so the star has a bright core.
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.18);
  core.addColorStop(0, `rgba(${r},${g},${b},1)`);
  core.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  starCache.set(color, tex);
  return tex;
}

export interface StarFlareOptions {
  color?: number;
  scale?: number;   // radius of the star sprite
  opacity?: number;
}

/**
 * Build a 4-point star sprite that always faces the camera. Add the returned
 * sprite to a parent group at the light position.
 */
export function createStarFlare(options: StarFlareOptions = {}): THREE.Sprite {
  const {
    color = 0xffffff,
    scale = 1.6,
    opacity = 0.7,
  } = options;

  const mat = new THREE.SpriteMaterial({
    map: makeStarTexture(color),
    color: 0xffffff,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const star = new THREE.Sprite(mat);
  star.scale.set(scale, scale, 1);
  return star;
}

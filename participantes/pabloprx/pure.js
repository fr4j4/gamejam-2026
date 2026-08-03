// pure.js — funciones puras extraidas de core/render/decor/entities.
// No importan Phaser: son deterministas de sus inputs (y por transitividad de `songT`),
// testeables desde node sin escena. Cada metodo mixin en su modulo es un wrapper de una
// linea que inyecta los campos de `this` como parametros explicitos.
//
// NOTA: las constantes MESH_*/REACTOR_* se copian AQUI en vez de importarse de `config.js`
// porque config.js referencia `location` (global de navegador) en el top-level y rompe la
// carga desde node. Si cambian en config.js, hay que actualizarlas aca (mismo valor).
import { PLAYER_Z, SPAWN_Z } from "./physics.js";
import { mix, zoneOfRow } from "./music.js";

const MESH_LO = 0x063a4a, MESH_HI = 0x5fffd0;
const REACTOR_R = 0.160, REACTOR_UP = 0.92, REACTOR_UP_FLAT = 2.05;
const REACTOR_GROW = 0.34;
const REACTOR_SNAP = 0.25;
const REACTOR_SWAY = 0.22, REACTOR_NEAR = 0.06, REACTOR_NEAR_Y = 0.30;

// core.dec(name) -> dec(name, lv)
export const dec = (name, lv) => (lv ? lv.decor.includes(name) : false);

// entities.pasa(zf) -> pasa(zf, camBody)
export const pasa = (zf, camBody) =>
  camBody ? 1 : Math.min(1, Math.max(0, (zf - PLAYER_Z) / 500));

// render.rowGlyph(r) -> rowGlyph(r, byRow, lv, laneIdx)
export const rowGlyph = (r, byRow, lv, laneIdx) => {
  const a = byRow?.get(r);
  const z = zoneOfRow(r, lv);
  return laneIdx.map((l) => (z && l !== z.lane ? "x" : a?.[l] ?? "·")).join("");
};

// decor.meshTone(v, f) -> meshTone(v, f, meshLo, meshHi, fog)
export const meshTone = (v, f, meshLo, meshHi, fog) => {
  const c = mix(meshLo ?? MESH_LO, meshHi ?? MESH_HI, ((v + 1) / 2) ** 0.55);
  return f ? mix(c, fog, f * 0.75) : c;
};

// decor.reacAt(w, h) -> reacAt(w, h, {bar, songT, hype, lat, snap, flat, proj})
export const reacAt = (w, h, { bar, songT, hype, lat, snap, flat, proj }) => {
  const b = bar ?? 1.846, ts = songT ?? 0;
  const q = ((ts / (b * 8)) % 1 + 1) % 1;
  const near = q > 0.5 ? 0.5 - 0.5 * Math.cos((q - 0.5) * 4 * Math.PI) : 0;
  const k = (h * REACTOR_R * (1 + REACTOR_GROW * (hype ?? 0)) * (1 + 0.05 * (lat ?? 0))
    * (1 + REACTOR_NEAR * near) * (1 + REACTOR_SNAP * (snap ?? 0))) / 512;
  const r = 486 * k;
  const sw = r * REACTOR_SWAY * Math.sin((ts / (b * 4)) * Math.PI * 2);
  const up = (flat ? REACTOR_UP_FLAT : REACTOR_UP) - REACTOR_NEAR_Y * near;
  return { k, r, x: w / 2 + sw, y: proj(0, 0, SPAWN_Z).y - r * up };
};

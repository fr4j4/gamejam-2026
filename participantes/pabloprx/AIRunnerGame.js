// CDN build exports names only (no default). En el repo base cambiar a: import Phaser from "phaser";
import * as Phaser from "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js";
import { HEX } from "./theme.js";
// Fase 1 del desacople: los metodos de RunnerScene viven en estos modulos (objetos planos
// cuyos metodos se copian a RunnerScene.prototype y comparten el mismo `this`, la escena).
// Este archivo es el orquestador: define la escena y le inyecta los mixins.
import { core } from "./core.js";
import { render } from "./render.js";
import { decor } from "./decor.js";
import { entities } from "./entities.js";

// Pseudo-3D endless runner. Camera at origin looking down +z, ground at y=0.
// El mundo entero es funcion del tiempo de la cancion: por eso se puede rebobinar.
// Que nivel se carga sale de la URL (`?level=orbit-motion`); sin parametro, el de siempre.
class RunnerScene extends Phaser.Scene {
  constructor() { super("AIRunner"); }
}

// Aplicar los mixins a RunnerScene.prototype.
// IMPORTANTE: se usa Object.getOwnPropertyDescriptors + Object.defineProperties (NO
// Object.assign directo). Object.assign lee cada getter con `this` sin bindear y lo aplana
// a undefined, rompiendo los getters (speed, laneX, lanes, laneIdx, edge, neon, rigOver, bt).
const mixin = (proto, ...mods) => {
  for (const mod of mods) {
    Object.defineProperties(proto, Object.getOwnPropertyDescriptors(mod));
  }
};
mixin(RunnerScene.prototype, core, render, decor, entities);

export const createAIRunnerGame = (parent) =>
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 900,
    height: 640,
    backgroundColor: HEX.bg,
    scene: [RunnerScene],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  });

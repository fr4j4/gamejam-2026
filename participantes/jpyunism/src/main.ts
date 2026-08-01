import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import Phaser from "phaser";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 960,
  backgroundColor: "#0a0a0f",
  scene: [MenuScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

new Phaser.Game(config);

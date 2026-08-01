// main.js — Configuracion de Phaser 4
// FIT mode: resolucion interna fija 640x360 (16:9 landscape)
// Phaser escala el canvas al tamaño de pantalla manteniendo aspect ratio
// pixelArt: true activa antialias:false y roundPixels:true automaticamente
// Valores de resolucion vienen de js/constants.js (GAME_W / GAME_H).

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.GAME_W,
  height: window.GAME_H,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true,
  backgroundColor: '#0d0d1a',
  scene: [BootScene, MenuScene, DeckScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
// BootScene — Carga inicial, config, assets programáticos

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Cargar fuente Press Start 2P
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
  }

  create() {
    // Configurar escala pixelart
    this.cameras.main.setBackgroundColor('#0d0d1a');

    // Esperar fuente y pasar al menu
    if (typeof WebFont !== 'undefined') {
      WebFont.load({
        google: { families: ['Press Start 2P', 'VT323'] },
        active: () => {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => this.scene.start('MenuScene'));
          } else {
            this.scene.start('MenuScene');
          }
        },
        inactive: () => { this.scene.start('MenuScene'); }
      });
    } else {
      // Fallback: esperar 500ms y continuar
      this.time.delayedCall(500, () => { this.scene.start('MenuScene'); });
    }
  }
}

window.BootScene = BootScene;
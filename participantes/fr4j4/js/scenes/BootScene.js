// BootScene — Carga inicial, config, assets programáticos

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Cargar fuente Press Start 2P
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // Cargar spritesheets de heroes (cada uno como PNG único).
    // Si el archivo no existe, FILE_LOAD_ERROR se silencia y la texture
    // simplemente no se registra; GameScene cae al fallback emoji.
    this._heroSprites = [
      window.HERO_SPRITE_MAGO,
      window.HERO_SPRITE_NECROMANCER,
      window.HERO_SPRITE_GUERRERO,
      window.HERO_SPRITE_ASESINO,
      window.HERO_SPRITE_BARDO,
      window.HERO_SPRITE_DUMMY
    ].filter(Boolean);

    this.load.on('loaderror', (file) => {
      // Silenciar 404s de assets opcionales (sprites que aún no existen)
      if (file && file.type === 'image' && this._heroSprites.some(h => h.key === file.key)) {
        if (!this._reportedMissing) this._reportedMissing = new Set();
        if (!this._reportedMissing.has(file.key)) {
          console.info('[BootScene] sprite de heroe no encontrado, fallback emoji: ' + file.src);
          this._reportedMissing.add(file.key);
        }
        return;
      }
      console.warn('[BootScene] load error:', file && file.src);
    });

    for (const cfg of this._heroSprites) {
      HeroSprite.preload(this, cfg);
    }
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
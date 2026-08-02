// Punto de entrada mínimo: Phaser pasa al menú cuando termina de arrancar.
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scene.start('MenuScene');
  }
}

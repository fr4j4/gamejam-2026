class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add.text(GAME_WIDTH / 2, 120, 'TIMBIRICHE', {
      color: COLORS.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '56px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 180, 'Dots and Boxes · 2 jugadores locales', {
      color: COLORS.muted,
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 270, 'ELIGE EL TAMAÑO', {
      color: COLORS.accent,
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const sizes = [3, 4, 5, 6];
    sizes.forEach((gridSize, index) => {
      this.createButton(
        GAME_WIDTH / 2,
        350 + index * 72,
        `JUGAR (${gridSize}x${gridSize})`,
        () => this.scene.start('GameScene', { gridSize }),
      );
    });
  }

  createButton(x, y, label, onClick) {
    const button = this.add.rectangle(x, y, 300, 52, COLORS.button)
      .setStrokeStyle(2, COLORS.accent)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      color: COLORS.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(COLORS.buttonHover));
    button.on('pointerout', () => button.setFillStyle(COLORS.button));
    button.on('pointerdown', onClick);

    // El texto también debe reenviar el click al botón para que toda la
    // superficie visible se comporte como un único control.
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', onClick);
    text.on('pointerover', () => button.setFillStyle(COLORS.buttonHover));
    text.on('pointerout', () => button.setFillStyle(COLORS.button));
  }
}

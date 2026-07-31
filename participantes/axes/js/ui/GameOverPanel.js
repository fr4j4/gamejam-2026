/** Panel final que aparece cuando no quedan líneas disponibles. */
class GameOverPanel {
  /** @param {Phaser.Scene} scene @param {() => void} onPlayAgain */
  constructor(scene, onPlayAgain) {
    this.scene = scene;
    this.onPlayAgain = onPlayAgain;

    this.overlay = scene.add.rectangle(400, 400, 620, 370, 0x10101f, 0.97)
      .setStrokeStyle(3, COLORS.accent);
    this.title = scene.add.text(400, 285, 'FIN DE LA PARTIDA', {
      color: COLORS.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.result = scene.add.text(400, 370, '', {
      color: SVG_COLORS.playerOne,
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.score = scene.add.text(400, 420, '', {
      color: COLORS.muted,
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
    }).setOrigin(0.5);
    this.button = scene.add.rectangle(400, 500, 250, 54, COLORS.accent)
      .setInteractive({ useHandCursor: true });
    this.buttonLabel = scene.add.text(400, 500, 'JUGAR DE NUEVO', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.button.on('pointerover', () => this.button.setFillStyle(0xff6078));
    this.button.on('pointerout', () => this.button.setFillStyle(COLORS.accent));
    this.button.on('pointerdown', () => this.onPlayAgain());
    this.buttonLabel.setInteractive({ useHandCursor: true });
    this.buttonLabel.on('pointerdown', () => this.onPlayAgain());

    this.objects = [this.overlay, this.title, this.result, this.score, this.button, this.buttonLabel];
    this.hide();
  }

  /** @param {number|null} winner @param {number[]} scores */
  show(winner, scores) {
    this.result.setText(winner === null ? 'EMPATE' : `GANA JUGADOR ${winner + 1}`);
    this.result.setColor(winner === 0 ? SVG_COLORS.playerOne : SVG_COLORS.playerTwo);
    this.score.setText(`J1 ${scores[0]}  —  J2 ${scores[1]}`);
    this.objects.forEach((object) => object.setVisible(true));
  }

  hide() {
    this.objects?.forEach((object) => object.setVisible(false));
  }
}

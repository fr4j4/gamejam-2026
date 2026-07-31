/**
 * Interfaz persistente durante la partida.
 * La lógica vive en GameLogic; este objeto solo refleja el estado recibido.
 */
class HUD {
  /** @param {Phaser.Scene} scene @param {() => void} onRestart */
  constructor(scene, onRestart) {
    this.scene = scene;
    this.onRestart = onRestart;

    this.playerOneCard = this.createCard(42, 28, 215, COLORS.accent, 'JUGADOR 1');
    this.playerTwoCard = this.createCard(543, 28, 215, COLORS.playerTwo, 'JUGADOR 2');
    this.turnText = scene.add.text(400, 42, '', {
      color: COLORS.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.restartButton = scene.add.rectangle(690, 750, 150, 42, COLORS.button)
      .setStrokeStyle(2, COLORS.accent)
      .setInteractive({ useHandCursor: true });
    this.restartLabel = scene.add.text(690, 750, 'REINICIAR', {
      color: COLORS.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.restartButton.on('pointerover', () => this.restartButton.setFillStyle(COLORS.buttonHover));
    this.restartButton.on('pointerout', () => this.restartButton.setFillStyle(COLORS.button));
    this.restartButton.on('pointerdown', () => this.onRestart());
    this.restartLabel.setInteractive({ useHandCursor: true });
    this.restartLabel.on('pointerdown', () => this.onRestart());
  }

  /** @param {number} x @param {number} y @param {number} width @param {number} color @param {string} label */
  createCard(x, y, width, color, label) {
    const card = this.scene.add.rectangle(x, y, width, 58, COLORS.button)
      .setStrokeStyle(1, color);
    this.scene.add.text(x - width / 2 + 14, y - 14, label, {
      color: '#c8c8d8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
    });
    const score = this.scene.add.text(x + width / 2 - 16, y + 2, '0', {
      color: color === COLORS.accent ? SVG_COLORS.playerOne : SVG_COLORS.playerTwo,
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    return { card, score, color };
  }

  /** @param {{currentPlayer: number, scores: number[]}} state */
  update(state) {
    this.playerOneCard.score.setText(String(state.scores[0]));
    this.playerTwoCard.score.setText(String(state.scores[1]));
    this.turnText.setText(`TURNO: JUGADOR ${state.currentPlayer + 1}`);

    this.playerOneCard.card.setStrokeStyle(state.currentPlayer === 0 ? 3 : 1, this.playerOneCard.color);
    this.playerTwoCard.card.setStrokeStyle(state.currentPlayer === 1 ? 3 : 1, this.playerTwoCard.color);
  }

  destroy() {
    // La escena destruye automáticamente sus GameObjects.
  }
}

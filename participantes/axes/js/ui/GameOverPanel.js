/** Panel final que representa un resultado ya calculado por GameLogic. */
class GameOverPanel {
  /** @param {Phaser.Scene} scene @param {() => void} onRestart @param {() => void} onMenu */
  constructor(scene, onRestart, onMenu) {
    this.scene = scene;
    this.onRestart = onRestart;
    this.onMenu = onMenu;

    this.overlay = scene.add.rectangle(GAME_OVER_STYLE.centerX, GAME_OVER_STYLE.centerY, GAME_OVER_STYLE.panelWidth, GAME_OVER_STYLE.panelHeight, COLORS.panelBg, 0.98)
      .setStrokeStyle(2, COLORS.playerOne, 0.8);
    this.title = new GlitchText(scene, GAME_OVER_STYLE.centerX, GAME_OVER_STYLE.titleY, 'GAME OVER', {
      color: SVG_COLORS.textPrimary,
      fontFamily: FONTS.TITLE,
      fontSize: '32px',
      fontStyle: 'bold',
    });
    this.result = new GlitchText(scene, GAME_OVER_STYLE.centerX, GAME_OVER_STYLE.resultY, '', {
      color: SVG_COLORS.playerOne,
      fontFamily: FONTS.TITLE,
      fontSize: '25px',
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    this.score = scene.add.text(GAME_OVER_STYLE.centerX, GAME_OVER_STYLE.scoreY, '', {
      color: SVG_COLORS.textPrimary,
      fontFamily: FONTS.GAME,
      fontSize: '19px',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 7,
    }).setOrigin(0.5);
    this.restartButton = new GlitchButton(scene, GAME_OVER_STYLE.leftButtonX, GAME_OVER_STYLE.buttonsY, GAME_OVER_STYLE.buttonWidth, GAME_OVER_STYLE.buttonHeight, 'VOLVER A JUGAR', () => this.onRestart(), {
      baseColor: COLORS.buttonActive,
      hoverColor: COLORS.buttonPrimaryHover,
      pressedColor: COLORS.buttonPrimaryPressed,
      activeColor: COLORS.playerOne,
      textColor: SVG_COLORS.buttonActiveText,
      fontSize: '16px',
    });
    this.menuButton = new GlitchButton(scene, GAME_OVER_STYLE.rightButtonX, GAME_OVER_STYLE.buttonsY, GAME_OVER_STYLE.buttonWidth, GAME_OVER_STYLE.buttonHeight, 'VOLVER AL MENÚ', () => this.onMenu(), {
      fontSize: '16px',
    });

    this.overlay.setDepth(DEPTH.modal);
    [this.title.container, this.result.container, this.score].forEach((object) => object.setDepth(DEPTH.modalContent));
    this.restartButton.setDepth(DEPTH.modalContent);
    this.menuButton.setDepth(DEPTH.modalContent);

    this.objects = [
      this.overlay,
      this.title.container,
      this.result.container,
      this.score,
      this.restartButton.container,
      this.menuButton.container,
    ];
    this.hide();
  }

  /** @param {{winner: number|null, isDraw: boolean, scores: number[]}} result */
  show(result) {
    const [playerOneScore, playerTwoScore] = result.scores;
    const resultLabel = result.isDraw
      ? 'EMPATE'
      : result.winner === 0 ? 'JUGADOR CYAN GANA' : 'JUGADOR MAGENTA GANA';
    const resultColor = result.isDraw
      ? SVG_COLORS.textPrimary
      : result.winner === 0 ? SVG_COLORS.playerOne : SVG_COLORS.playerTwo;

    this.result.setText(resultLabel);
    this.result.setColor(resultColor);
    this.score.setText(`JUGADOR CYAN: ${playerOneScore} PUNTOS\nJUGADOR MAGENTA: ${playerTwoScore} PUNTOS`);
    this.restartButton.setEnabled(true);
    this.menuButton.setEnabled(true);
    this.objects.forEach((object) => {
      object.setActive(true);
      object.setVisible(true);
    });
  }

  hide() {
    this.restartButton.setEnabled(false);
    this.menuButton.setEnabled(false);
    this.objects?.forEach((object) => {
      object.setActive(false);
      object.setVisible(false);
    });
  }
}

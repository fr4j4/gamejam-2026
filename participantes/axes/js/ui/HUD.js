/**
 * Interfaz persistente durante la partida.
 * La lógica vive en GameLogic; este objeto solo refleja el estado recibido.
 */
class HUD {
  /** @param {Phaser.Scene} scene @param {() => void} onRestart */
  constructor(scene, onRestart) {
    this.scene = scene;
    this.onRestart = onRestart;

    this.playerOneCard = this.createCard(150, 36, 220, COLORS.playerOne, 'JUGADOR 1', SVG_COLORS.playerOne);
    this.playerTwoCard = this.createCard(650, 36, 220, COLORS.playerTwo, 'JUGADOR 2', SVG_COLORS.playerTwo);
    this.turnPill = scene.add.rectangle(400, 36, 150, 42, COLORS.panelBg, 0.92)
      .setStrokeStyle(1, COLORS.panelBorder, 1);
    this.turnText = scene.add.text(400, 36, '', {
      color: SVG_COLORS.textPrimary,
      fontFamily: FONTS.GAME,
      fontSize: '17px',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5);
    this.thinkingText = scene.add.text(400, 90, '', {
      color: SVG_COLORS.playerTwo,
      fontFamily: FONTS.GAME,
      fontSize: '14px',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.restartButton = new GlitchButton(this.scene, 680, 750, 150, 42, 'REINICIAR', () => this.onRestart(), {
      fontSize: '15px',
    });
    [this.playerOneCard.card, this.playerOneCard.label, this.playerOneCard.score,
      this.playerTwoCard.card, this.playerTwoCard.label, this.playerTwoCard.score,
      this.turnPill, this.turnText, this.thinkingText].forEach((object) => object.setDepth(DEPTH.hud));
    this.restartButton.setDepth(DEPTH.controls);
  }

  /** @param {number} x @param {number} y @param {number} width @param {number} color @param {string} label @param {string} cssColor */
  createCard(x, y, width, color, label, cssColor) {
    const card = this.scene.add.rectangle(x, y, width, 58, COLORS.panelBg, UI_STYLE.panelAlpha)
      .setStrokeStyle(1, COLORS.panelBorder, 1);
    const labelText = this.scene.add.text(x - width / 2 + 14, y - 15, label, {
      color: SVG_COLORS.textMuted,
      fontFamily: FONTS.GAME,
      fontSize: UI_STYLE.hudLabelSize,
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    const score = this.scene.add.text(x + width / 2 - 16, y + 3, '0', {
      color: cssColor,
      fontFamily: FONTS.GAME,
      fontSize: UI_STYLE.scoreSize,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    return { card, label: labelText, score, color };
  }

  /** @param {{currentPlayer: number, scores: number[]}} state */
  update(state) {
    this.playerOneCard.score.setText(String(state.scores[0]));
    this.playerTwoCard.score.setText(String(state.scores[1]));
    this.turnText.setText(`TURNO  //  J${state.currentPlayer + 1}`);
    this.turnText.setColor(state.currentPlayer === 0 ? SVG_COLORS.playerOne : SVG_COLORS.playerTwo);
    this.turnPill.setStrokeStyle(UI_STYLE.borderWidth, state.currentPlayer === 0 ? COLORS.playerOne : COLORS.playerTwo, 1);

    this.playerOneCard.card.setStrokeStyle(state.currentPlayer === 0 ? 2 : 1, state.currentPlayer === 0 ? COLORS.playerOne : COLORS.panelBorder, 1);
    this.playerTwoCard.card.setStrokeStyle(state.currentPlayer === 1 ? 2 : 1, state.currentPlayer === 1 ? COLORS.playerTwo : COLORS.panelBorder, 1);
    this.playerOneCard.card.setAlpha(state.currentPlayer === 0 ? 1 : UI_STYLE.inactivePlayerAlpha);
    this.playerTwoCard.card.setAlpha(state.currentPlayer === 1 ? 1 : UI_STYLE.inactivePlayerAlpha);
    this.playerOneCard.score.setAlpha(state.currentPlayer === 0 ? 1 : UI_STYLE.inactivePlayerAlpha);
    this.playerTwoCard.score.setAlpha(state.currentPlayer === 1 ? 1 : UI_STYLE.inactivePlayerAlpha);
    this.scene.game.canvas.style.borderColor = state.currentPlayer === 0
      ? SVG_COLORS.playerOne
      : SVG_COLORS.playerTwo;
    this.scene.game.canvas.style.borderWidth = `${UI_STYLE.activePlayerBorderWidth}px`;
  }

  /** Oculta o muestra la acción persistente durante la partida. */
  setRestartVisible(visible) {
    this.restartButton.setVisible(visible);
    this.restartButton.setEnabled(visible);
  }

  /** Habilita o bloquea REINICIAR sin cambiar su visibilidad. */
  setRestartEnabled(enabled) {
    this.restartButton.setEnabled(enabled);
  }

  /** Muestra feedback durante el turno automático sin cambiar las reglas. */
  setAiThinking(isThinking) {
    this.thinkingText.setText(isThinking ? AI_CONFIG.thinkingText : '');
    this.thinkingText.setVisible(isThinking);
  }

  destroy() {
    // La escena destruye automáticamente sus GameObjects.
  }
}

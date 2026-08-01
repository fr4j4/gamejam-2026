// Escena que compone tablero, HUD y panel final sin mezclar sus responsabilidades.
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.gameFinished = false;
    this.isReady = false;
  }

  init(data) {
    const incomingConfig = data?.matchConfig ?? data;
    this.matchConfig = validateMatchConfig(incomingConfig)
      ? cloneMatchConfig(incomingConfig)
      : createMatchConfig(Number.isInteger(data?.gridSize) ? data.gridSize : 5, data?.mode);
    this.gridSize = this.matchConfig.gridSize;
    this.gameFinished = false;
    this.isReady = false;
    this.state = null;
    this.confirmModal = null;
    this.gameOverTimer = null;
    this.aiTurnTimer = null;
    this.finalResult = null;
    this.isNavigating = false;
  }

  create() {
    this.audioManager = new AudioManager();

    // Crear la UI antes del tablero evita callbacks con referencias incompletas.
    this.hud = new HUD(this, () => this.openRestartConfirmation());
    this.gameOverPanel = new GameOverPanel(
      this,
      () => this.restartGame(),
      () => this.goToMenu(),
    );
    this.board = new Board(this.game.canvas.parentElement, this.gridSize, (result) => this.handleMove(result));
    this.state = this.board.state;
    this.hud.update(this.state);
    this.hud.setAiThinking(false);
    this.isReady = true;
    this.updateTurnController();

    this.cleanupBoard = () => {
      if (!this.board) return;
      this.board.setInteractive(false);
      this.board.destroy();
      this.board = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupBoard);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupBoard);
    this.cleanupModal = () => {
      this.confirmModal?.destroy();
      this.confirmModal = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupModal);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupModal);
    this.cleanupGameOverTimer = () => {
      this.gameOverTimer?.remove(false);
      this.gameOverTimer = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupGameOverTimer);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupGameOverTimer);
    this.cleanupAiTimer = () => this.cancelAiTurn();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupAiTimer);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupAiTimer);
  }

  /** @param {{state: object, completedBoxIds: string[]}} result */
  handleMove(result) {
    if (!this.isReady || this.gameFinished || !this.hud || !this.board) return;
    if (!result || !result.state || !Array.isArray(result.state.scores)) return;

    this.state = result.state;
    this.hud.update(this.state);
    this.audioManager.playLine();
    if (result.completedBoxIds.length > 0) this.audioManager.playBox();

    if (this.state.gameOver || isGameOver(this.state)) this.finishGame();
    else this.updateTurnController();
  }

  finishGame() {
    if (this.gameFinished || !this.state || !this.board) return;
    this.gameFinished = true;
    this.cancelAiTurn();
    this.hud.setAiThinking(false);
    this.board.setInteractive(false);
    this.board.setMoveEnabled(false);
    this.hud.setRestartVisible(false);
    this.hud.update(this.state);
    this.finalResult = Object.freeze(getGameResult(this.state));
    this.audioManager.playVictory();

    this.gameOverTimer = this.time.delayedCall(GAME_TIMING.gameOverDelay, () => {
      this.gameOverTimer = null;
      if (!this.gameFinished || !this.finalResult || !this.board || !this.gameOverPanel) return;
      this.board.setModalLayer(true);
      this.board.setVisible(false);
      this.gameOverPanel.show(this.finalResult);
    });
  }

  openRestartConfirmation() {
    if (!this.isReady || this.gameFinished || this.confirmModal) return;

    this.cancelAiTurn();
    this.hud.setAiThinking(false);
    this.board.setInteractive(false);
    this.board.setModalLayer(true);
    this.hud.setRestartEnabled(false);
    this.confirmModal = new ConfirmModal(this, {
      title: '¿DESEAS REINICIAR LA PARTIDA?',
      message: 'Se perderá el progreso actual.',
      confirmLabel: 'SÍ',
      cancelLabel: 'NO',
      menuLabel: 'VOLVER AL MENÚ PRINCIPAL',
      onConfirm: () => {
        this.confirmModal = null;
        this.restartGame();
      },
      onCancel: () => {
        this.confirmModal = null;
        if (!this.gameFinished) this.updateTurnController();
      },
      onMenu: () => this.goToMenu(),
    });
  }

  restartGame() {
    if (!this.matchConfig) return;
    this.cancelAiTurn();
    this.scene.restart({ matchConfig: cloneMatchConfig(this.matchConfig) });
  }

  goToMenu() {
    if (this.isNavigating) return;
    this.isNavigating = true;
    this.cancelAiTurn();
    this.gameOverTimer?.remove(false);
    this.gameOverTimer = null;
    const modal = this.confirmModal;
    this.confirmModal = null;
    if (modal && !modal.destroyed) modal.destroy();
    this.isReady = false;
    this.gameFinished = true;
    this.gameOverPanel?.hide();
    if (this.board) {
      this.board.setInteractive(false);
      this.board.setMoveEnabled(false);
      this.board.setModalLayer(false);
    }
    this.scene.start('MenuScene');
  }

  updateTurnController() {
    if (!this.isReady || this.gameFinished || !this.board || this.confirmModal) return;
    this.board.setModalLayer(false);

    if (isAITurn(this.matchConfig, this.state)) {
      this.board.setInteractive(false);
      this.hud.setAiThinking(true);
      this.scheduleAiTurn();
      return;
    }

    this.cancelAiTurn();
    this.hud.setAiThinking(false);
    this.board.setInteractive(true);
  }

  scheduleAiTurn() {
    if (this.aiTurnTimer || !isAITurn(this.matchConfig, this.state)) return;
    this.aiTurnTimer = this.time.delayedCall(AI_CONFIG.turnDelay, () => {
      this.aiTurnTimer = null;
      this.executeAiTurn();
    });
  }

  executeAiTurn() {
    const sceneActive = this.sys.isActive();
    const aiConfig = getCurrentPlayerConfig(this.matchConfig, this.state);
    if (!sceneActive || this.gameFinished || !this.isReady || !this.board || this.confirmModal
      || !this.board.moveEnabled || aiConfig?.type !== 'ai') return;

    const availableMoves = getAvailableMoves(this.state);
    if (availableMoves.length === 0) return;
    const lineId = chooseMove(this.state, aiConfig.difficulty);
    if (!lineId || !availableMoves.includes(lineId)) return;
    this.board.playMove(lineId);
  }

  cancelAiTurn() {
    this.aiTurnTimer?.remove(false);
    this.aiTurnTimer = null;
  }
}

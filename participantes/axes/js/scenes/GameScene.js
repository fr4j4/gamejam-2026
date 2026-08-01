// Escena que compone tablero, HUD y panel final sin mezclar sus responsabilidades.
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.gameFinished = false;
    this.isReady = false;
  }

  init(data) {
    this.gridSize = Number.isInteger(data?.gridSize) ? data.gridSize : 5;
    this.gameFinished = false;
    this.isReady = false;
    this.state = null;
    this.confirmModal = null;
    this.gameOverTimer = null;
    this.finalResult = null;
  }

  create() {
    this.audioManager = new AudioManager();

    // Crear la UI antes del tablero evita callbacks con referencias incompletas.
    this.hud = new HUD(this, () => this.openRestartConfirmation());
    this.gameOverPanel = new GameOverPanel(
      this,
      () => this.restartGame(),
      () => this.scene.start('MenuScene'),
    );
    this.board = new Board(this.game.canvas.parentElement, this.gridSize, (result) => this.handleMove(result));
    this.state = this.board.state;
    this.hud.update(this.state);
    this.isReady = true;

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
  }

  finishGame() {
    if (this.gameFinished || !this.state || !this.board) return;
    this.gameFinished = true;
    this.board.setInteractive(false);
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

    this.board.setInteractive(false);
    this.board.setModalLayer(true);
    this.hud.setRestartEnabled(false);
    this.confirmModal = new ConfirmModal(this, {
      title: '¿DESEAS REINICIAR LA PARTIDA?',
      message: 'Se perderá el progreso actual.',
      confirmLabel: 'SÍ',
      cancelLabel: 'NO',
      onConfirm: () => {
        this.confirmModal = null;
        this.restartGame();
      },
      onCancel: () => {
        this.confirmModal = null;
        if (!this.gameFinished && this.board) {
          this.board.setModalLayer(false);
          this.board.setInteractive(true);
        }
        if (!this.gameFinished && this.hud) this.hud.setRestartEnabled(true);
      },
    });
  }

  restartGame() {
    if (!this.gridSize) return;
    this.scene.restart({ gridSize: this.gridSize });
  }
}

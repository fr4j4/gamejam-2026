// Escena que compone tablero, HUD y panel final sin mezclar sus responsabilidades.
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.gridSize = data.gridSize ?? 5;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.audioManager = new AudioManager();
    this.board = new Board(this.game.canvas.parentElement, this.gridSize, (result) => this.handleMove(result));
    this.hud = new HUD(this, () => this.restartGame());
    this.gameOverPanel = new GameOverPanel(this, () => this.scene.start('MenuScene'));
    this.hud.update(this.board.state);

    this.events.once('shutdown', () => this.board.destroy());
  }

  /** @param {{state: object}} result */
  handleMove(result) {
    this.hud.update(result.state);
    this.audioManager.playLine();
    if (result.completedBoxIds.length > 0) this.audioManager.playBox();
    if (!result.state.gameOver) return;

    this.board.setVisible(false);
    this.gameOverPanel.show(getWinner(result.state), result.state.scores);
    this.audioManager.playVictory();
  }

  restartGame() {
    this.scene.restart({ gridSize: this.gridSize });
  }
}

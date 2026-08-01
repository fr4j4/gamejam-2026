class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.selectedMode = GAME_MODES.LOCAL;
    this.title = new GlitchText(this, GAME_WIDTH / 2, 108, 'TIMBIRICHE', {
      color: SVG_COLORS.textPrimary,
      fontFamily: FONTS.TITLE,
      fontSize: UI_STYLE.titleSize,
      fontStyle: 'bold',
    });

    this.add.text(GAME_WIDTH / 2, 172, 'DOTS AND BOXES', {
      color: SVG_COLORS.textMuted,
      fontFamily: FONTS.GAME,
      fontSize: UI_STYLE.subtitleSize,
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5);

    const menuPanel = this.add.rectangle(GAME_WIDTH / 2, 430, 430, 470, COLORS.panelBg, 0.92)
      .setStrokeStyle(1, COLORS.panelBorder, 0.9);
    menuPanel.setDepth(DEPTH.background);

    this.add.text(GAME_WIDTH / 2, 228, 'MODO DE JUEGO', {
      color: SVG_COLORS.playerOne,
      fontFamily: FONTS.GAME,
      fontSize: '18px',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.localModeButton = new GlitchButton(this, 315, 270, 150, 42, 'HOT-SEAT', () => this.setMode(GAME_MODES.LOCAL), {
      fontSize: '15px',
      selected: true,
    });
    this.aiModeButton = new GlitchButton(this, 485, 270, 150, 42, 'VS IA · EASY', () => this.setMode(GAME_MODES.VS_AI), {
      fontSize: '15px',
    });

    this.add.text(GAME_WIDTH / 2, 320, 'SELECCIONA EL TABLERO', {
      color: SVG_COLORS.textPrimary,
      fontFamily: FONTS.GAME,
      fontSize: '17px',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // this.add.text(GAME_WIDTH / 2, 282, 'CADA LÍNEA CAMBIA EL CONTROL', {
    //   color: SVG_COLORS.textMuted,
    //   fontFamily: FONTS.BODY,
    //   fontSize: '11px',
    //   letterSpacing: 1,
    // }).setOrigin(0.5);

    const sizes = [3, 4, 5, 6];
    sizes.forEach((gridSize, index) => {
        this.createButton(
        GAME_WIDTH / 2,
        365 + index * 64,
        `JUGAR  //  ${gridSize}x${gridSize}`,
        () => this.startGame(gridSize),
      );
    });

    this.add.text(GAME_WIDTH / 2, 690, '(mouse) NAVEGA   ·   (left click) CONFIRMA', {
      color: SVG_COLORS.textMuted,
      fontFamily: FONTS.GAME,
      fontSize: '14px',
      letterSpacing: 1,
    }).setOrigin(0.5);

    // Señal de arranque: el loader HTML se retira solo después de crear el menú.
    window.dispatchEvent(new Event('timbiriche:menu-ready'));
  }

  createButton(x, y, label, onClick) {
    return new GlitchButton(this, x, y, 300, 52, label, onClick);
  }

  setMode(mode) {
    this.selectedMode = mode;
    this.localModeButton.setSelected(mode === GAME_MODES.LOCAL);
    this.aiModeButton.setSelected(mode === GAME_MODES.VS_AI);
  }

  startGame(gridSize) {
    this.scene.start('GameScene', createMatchConfig(gridSize, this.selectedMode));
  }
}

/**
 * Modal reutilizable para confirmar acciones destructivas o irreversibles.
 * El overlay captura el input fuera del panel; los botones son GlitchButton.
 */
class ConfirmModal {
  /** @param {Phaser.Scene} scene @param {{title?: string, message?: string, confirmLabel?: string, cancelLabel?: string, menuLabel?: string, onConfirm?: () => void, onCancel?: () => void, onMenu?: () => void}} options */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.onConfirm = options.onConfirm;
    this.onCancel = options.onCancel;
    this.onMenu = options.onMenu;
    this.isClosing = false;
    this.resolved = false;
    this.destroyed = false;

    this.overlay = scene.add.rectangle(
      CONFIRM_MODAL_STYLE.centerX,
      CONFIRM_MODAL_STYLE.centerY,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.black,
      CONFIRM_MODAL_STYLE.overlayAlpha,
    ).setInteractive();
    this.panel = scene.add.rectangle(
      CONFIRM_MODAL_STYLE.centerX,
      CONFIRM_MODAL_STYLE.centerY,
      CONFIRM_MODAL_STYLE.panelWidth,
      CONFIRM_MODAL_STYLE.panelHeight,
      COLORS.panelBg,
      CONFIRM_MODAL_STYLE.panelAlpha,
    ).setStrokeStyle(UI_STYLE.borderWidth, COLORS.panelBorder, 1);
    this.title = scene.add.text(CONFIRM_MODAL_STYLE.centerX, CONFIRM_MODAL_STYLE.titleY, options.title ?? '¿CONFIRMAR ACCIÓN?', {
      color: SVG_COLORS.textPrimary,
      fontFamily: FONTS.TITLE,
      fontSize: '24px',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    this.message = scene.add.text(CONFIRM_MODAL_STYLE.centerX, CONFIRM_MODAL_STYLE.messageY, options.message ?? '', {
      color: SVG_COLORS.textMuted,
      fontFamily: FONTS.BODY,
      fontSize: UI_STYLE.bodySize,
      align: 'center',
    }).setOrigin(0.5);

    const buttonOffset = (CONFIRM_MODAL_STYLE.buttonWidth + CONFIRM_MODAL_STYLE.buttonGap) / 2;
    this.confirmButton = new GlitchButton(
      scene,
      CONFIRM_MODAL_STYLE.centerX - buttonOffset,
      CONFIRM_MODAL_STYLE.buttonsY,
      CONFIRM_MODAL_STYLE.buttonWidth,
      CONFIRM_MODAL_STYLE.buttonHeight,
      options.confirmLabel ?? 'SÍ',
      () => this.resolve('confirm'),
      {
        baseColor: COLORS.playerTwo,
        hoverColor: COLORS.confirmDangerHover,
        pressedColor: COLORS.confirmDangerPressed,
        activeColor: COLORS.playerTwo,
        textColor: SVG_COLORS.textPrimary,
        fontSize: '17px',
      },
    );
    this.cancelButton = new GlitchButton(
      scene,
      CONFIRM_MODAL_STYLE.centerX + buttonOffset,
      CONFIRM_MODAL_STYLE.buttonsY,
      CONFIRM_MODAL_STYLE.buttonWidth,
      CONFIRM_MODAL_STYLE.buttonHeight,
      options.cancelLabel ?? 'NO',
      () => this.resolve('cancel'),
      {
        baseColor: COLORS.playerOne,
        hoverColor: COLORS.buttonPrimaryHover,
        pressedColor: COLORS.buttonPrimaryPressed,
        activeColor: COLORS.playerOne,
        textColor: SVG_COLORS.buttonActiveText,
        fontSize: '17px',
      },
    );
    this.menuButton = new GlitchButton(
      scene,
      CONFIRM_MODAL_STYLE.centerX,
      CONFIRM_MODAL_STYLE.menuButtonY,
      CONFIRM_MODAL_STYLE.menuButtonWidth,
      CONFIRM_MODAL_STYLE.menuButtonHeight,
      options.menuLabel ?? 'VOLVER AL MENÚ PRINCIPAL',
      () => this.resolve('menu'),
      {
        fontSize: '15px',
        baseColor: COLORS.buttonBase,
        hoverColor: COLORS.buttonHover,
        pressedColor: BUTTON_STYLE.backgroundPressed,
        activeColor: COLORS.panelBorder,
        textColor: SVG_COLORS.textPrimary,
      },
    );

    this.overlay.setDepth(DEPTH.overlay);
    [this.panel, this.title, this.message].forEach((object) => object.setDepth(DEPTH.modal));
    this.confirmButton.setDepth(DEPTH.modalContent);
    this.cancelButton.setDepth(DEPTH.modalContent);
    this.menuButton.setDepth(DEPTH.modalContent);
    this.objects = [
      this.overlay,
      this.panel,
      this.title,
      this.message,
      this.confirmButton.container,
      this.cancelButton.container,
      this.menuButton.container,
    ];
    this.escapeKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.onEscape = () => this.resolve(false);
    this.escapeKey?.on('down', this.onEscape);
  }

  /** Resuelve el modal una sola vez y ejecuta el callback correspondiente. */
  resolve(action) {
    if (this.resolved || this.destroyed) return;
    this.resolved = true;
    this.isClosing = true;
    const callback = action === 'confirm' ? this.onConfirm : action === 'menu' ? this.onMenu : this.onCancel;
    this.destroy();
    callback?.();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.escapeKey) {
      this.escapeKey.off('down', this.onEscape);
      this.scene.input.keyboard?.removeKey(this.escapeKey);
      this.escapeKey = null;
    }
    this.confirmButton?.destroy();
    this.cancelButton?.destroy();
    this.menuButton?.destroy();
    this.overlay?.disableInteractive();
    this.overlay?.destroy();
    this.panel?.destroy();
    this.title?.destroy();
    this.message?.destroy();
    this.onConfirm = null;
    this.onCancel = null;
    this.onMenu = null;
    this.objects = [];
    this.scene = null;
  }
}

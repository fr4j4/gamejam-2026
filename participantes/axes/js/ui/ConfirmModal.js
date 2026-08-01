/**
 * Modal reutilizable para confirmar acciones destructivas o irreversibles.
 * El overlay captura el input fuera del panel; los botones son GlitchButton.
 */
class ConfirmModal {
  /** @param {Phaser.Scene} scene @param {{title?: string, message?: string, confirmLabel?: string, cancelLabel?: string, onConfirm?: () => void, onCancel?: () => void}} options */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.onConfirm = options.onConfirm;
    this.onCancel = options.onCancel;
    this.isClosing = false;

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
      () => this.resolve(true),
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
      () => this.resolve(false),
      {
        baseColor: COLORS.playerOne,
        hoverColor: COLORS.buttonPrimaryHover,
        pressedColor: COLORS.buttonPrimaryPressed,
        activeColor: COLORS.playerOne,
        textColor: SVG_COLORS.buttonActiveText,
        fontSize: '17px',
      },
    );

    this.overlay.setDepth(DEPTH.overlay);
    [this.panel, this.title, this.message].forEach((object) => object.setDepth(DEPTH.modal));
    this.confirmButton.setDepth(DEPTH.modalContent);
    this.cancelButton.setDepth(DEPTH.modalContent);
    this.objects = [
      this.overlay,
      this.panel,
      this.title,
      this.message,
      this.confirmButton.container,
      this.cancelButton.container,
    ];
    this.escapeKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.onEscape = () => this.resolve(false);
    this.escapeKey?.on('down', this.onEscape);
  }

  /** Resuelve el modal una sola vez y ejecuta el callback correspondiente. */
  resolve(confirmed) {
    if (this.isClosing) return;
    this.isClosing = true;
    const callback = confirmed ? this.onConfirm : this.onCancel;
    this.destroy();
    callback?.();
  }

  destroy() {
    if (this.escapeKey) {
      this.escapeKey.off('down', this.onEscape);
      this.scene.input.keyboard?.removeKey(this.escapeKey);
      this.escapeKey = null;
    }
    this.confirmButton?.destroy();
    this.cancelButton?.destroy();
    this.overlay?.disableInteractive();
    this.overlay?.destroy();
    this.panel?.destroy();
    this.title?.destroy();
    this.message?.destroy();
    this.onConfirm = null;
    this.onCancel = null;
    this.objects = [];
  }
}

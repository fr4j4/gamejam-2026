// MenuScene — Menu principal con identidad CRT/arcade épica

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = 640;
    const H = 360;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.bgLayer = this.add.layer().setDepth(0);
    this.uiLayer = this.add.layer().setDepth(10);
    this.modalLayer = this.add.layer().setDepth(20);

    this.menuObjects = [];
    VFX.stars(this, this.bgLayer, 60);
    this.createAmbientEffects();
    this.createTitle();
    this.createButtons();

    this.menuObjects.push(VFX.terminalFooter(this, this.uiLayer, W - 8, H - 8, 'fr4j4 - 2026'));

    CRT.addScanlines(this);
  }

  shutdown() {
    this.tweens.killAll();
    this.menuObjects.forEach(obj => {
      if (!obj) return;
      if (obj.glitchTimer) obj.glitchTimer.remove();
      if (obj.timer) obj.timer.remove();
      if (obj.blinkTimer) obj.blinkTimer.remove();
      if (obj.cursor && obj.cursor.destroy) obj.cursor.destroy();
      if (obj.destroy) obj.destroy();
    });
    this.menuObjects = [];
  }

  createAmbientEffects() {
    this.menuObjects.push(
      ...VFX.ambientParticles(this, this.bgLayer, 24, ['#9fcafd', '#b388ff', '#faba72'])
    );
    const seals = [
      { x: 70, y: 70, r: 24, icon: '🔮', color: '#b388ff' },
      { x: 570, y: 90, r: 28, icon: '⚔️', color: '#faba72' },
      { x: 600, y: 300, r: 22, icon: '🎵', color: '#bdcd9c' },
      { x: 50, y: 290, r: 26, icon: '🗡️', color: '#ff6b6b' },
      { x: 320, y: 330, r: 30, icon: '📜', color: '#9fcafd' }
    ];
    seals.forEach(s => this.menuObjects.push(VFX.classSealWatermark(this, this.bgLayer, s.x, s.y, s.r, s.icon, s.color)));
  }

  createTitle() {
    const W = 640;
    const title = VFX.glitchTitle(this, this.uiLayer, W / 2, 92, 'DECKSTINY', '#faba72');
    this.menuObjects.push(title);
    title.setScale(0.85);
    this.tweens.add({
      targets: title, scale: 1, alpha: 1, duration: 800, ease: 'Back.easeOut'
    });
    this.cameras.main.shake(120, 0.004);

    const subtitle = UI.text(this, W / 2, 138, 'BARAJAS EN DUELO', {
      fontFamily: '"VT323"', fontSize: '18px', color: '#9fcafd'
    }).setOrigin(0.5).setAlpha(0);
    this.uiLayer.add(subtitle);
    this.menuObjects.push(subtitle);
    this.tweens.add({
      targets: subtitle, alpha: 1, duration: 500, delay: 600
    });
    this.tweens.add({
      targets: subtitle, alpha: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1100
    });
  }

  showToast(msg, colorHex) {
    const c = colorHex || '#ff6b6b';
    const W = 640;
    const box = this.add.rectangle(W / 2, 60, 480, 30, 0x16213e).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(c).color);
    const txt = UI.text(this, W / 2, 60, msg, {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: c
    }).setOrigin(0.5);
    this.tweens.add({
      targets: [box, txt],
      alpha: 0,
      delay: 2000,
      duration: 400,
      onComplete: () => { box.destroy(); txt.destroy(); }
    });
  }

  createButtons() {
    const W = 640;
    const btnData = [
      { label: 'Online', scene: 'DeckPickerScene', mode: 'online', color: '#ff6b6b' },
      { label: 'VS IA', scene: 'DeckPickerScene', mode: 'ai', color: '#faba72' },
      { label: 'Deckbuilder', scene: 'DeckScene', mode: null, color: '#9fcafd' },
      { label: 'Practice', scene: 'DeckPickerScene', mode: 'test', color: '#bdcd9c' }
    ];

    const startY = 188;
    const gap = 42;
    btnData.forEach((btn, i) => {
      const y = startY + i * gap;
      const result = UI.button(this, W / 2, y, btn.label, btn.color, () => {
        ensureStarterDecks();
        let targetScene = btn.scene;
        let payload = btn.mode ? { mode: btn.mode } : {};

        this.cameras.main.fadeOut(200, 13, 13, 26);
        this.time.delayedCall(220, () => {
          this.scene.start(targetScene, payload);
        });
      }, { minWidth: 240, height: 34, fontSize: '8px' });

      result.container.setAlpha(0);
      this.uiLayer.add(result.container);
      this.menuObjects.push(result.container);
      this.tweens.add({
        targets: result.container, alpha: 1, duration: 400, delay: 300 + i * 120, ease: 'Linear'
      });
    });
  }
}

window.MenuScene = MenuScene;

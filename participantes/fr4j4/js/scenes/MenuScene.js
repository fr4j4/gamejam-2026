// MenuScene — Menu principal con identidad CRT/arcade épica

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = 640;
    const H = 360;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.menuObjects = [];
    VFX.stars(this, this, 60);
    this.createAmbientEffects();
    this.createTitle();
    this.createButtons();

    this.menuObjects.push(VFX.terminalFooter(this, this, W - 8, H - 8, 'fr4j4 - 2026'));

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
      ...VFX.ambientParticles(this, this, 24, ['#9fcafd', '#b388ff', '#faba72'])
    );
    const seals = [
      { x: 70, y: 70, r: 24, icon: '🔮', color: '#b388ff' },
      { x: 570, y: 90, r: 28, icon: '⚔️', color: '#faba72' },
      { x: 600, y: 300, r: 22, icon: '🎵', color: '#bdcd9c' },
      { x: 50, y: 290, r: 26, icon: '🗡️', color: '#ff6b6b' },
      { x: 320, y: 330, r: 30, icon: '📜', color: '#9fcafd' }
    ];
    seals.forEach(s => this.menuObjects.push(VFX.classSealWatermark(this, this, s.x, s.y, s.r, s.icon, s.color)));
  }

  createTitle() {
    const W = 640;
    const title = VFX.glitchTitle(this, this, W / 2, 92, 'DECKSTINY', '#faba72');
    this.menuObjects.push(title);
    title.setScale(0.85);
    this.tweens.add({
      targets: title, scale: 1, alpha: 1, duration: 800, ease: 'Back.easeOut'
    });
    this.cameras.main.shake(120, 0.004);

    const subtitle = this.add.text(W / 2, 138, 'BARAJAS EN DUELO', {
      fontFamily: '"VT323"', fontSize: '18px', color: '#9fcafd'
    }).setOrigin(0.5).setAlpha(0);
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
    const txt = this.add.text(W / 2, 60, msg, {
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
      const { group, bg } = this.createInteractiveButton(W / 2, y, 320, 38, btn.label, btn.color, () => {
        ensureStarterDecks();
        let targetScene = btn.scene;
        let payload = btn.mode ? { mode: btn.mode } : {};

        this.cameras.main.fadeOut(200, 13, 13, 26);
        this.time.delayedCall(220, () => {
          this.scene.start(targetScene, payload);
        });
      });
      group.setAlpha(0);
      this.tweens.add({
        targets: group, alpha: 1, duration: 400, delay: 300 + i * 120, ease: 'Linear',
        onComplete: () => bg.setInteractive({ useHandCursor: true })
      });
    });
  }

  createInteractiveButton(x, y, w, h, label, colorHex, callback) {
    const c = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const group = this.add.container(x, y);

    const glow = this.add.rectangle(0, 0, w + 10, h + 10, c)
      .setAlpha(0).setDepth(-1);
    if (Phaser.BlendModes && Phaser.BlendModes.ADD) glow.setBlendMode(Phaser.BlendModes.ADD);

    const bg = this.add.rectangle(0, 0, w, h, 0x16213e)
      .setStrokeStyle(2, c)
      .disableInteractive();
    const hi = this.add.rectangle(0, -h / 2 + 1, w - 2, 1, 0x3a3a5e).setOrigin(0.5, 0);
    const lo = this.add.rectangle(0, h / 2 - 1, w - 2, 1, 0x050510).setOrigin(0.5, 1);
    const led = this.add.circle(-w / 2 + 10, 0, 3, c);
    if (Phaser.BlendModes && Phaser.BlendModes.ADD) led.setBlendMode(Phaser.BlendModes.ADD);
    const txt = this.add.text(4, 0, label, {
      fontFamily: '"Press Start 2P"', fontSize: '8px',
      color: '#' + c.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    group.add([glow, bg, hi, lo, led, txt]);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x1a2a4e);
      glow.setAlpha(0.35);
      txt.setScale(1.05);
      led.setFillStyle(0xffffff);
      this.tweens.killTweensOf(group);
      this.tweens.add({ targets: group, scaleX: 1.04, scaleY: 1.04, duration: 120, ease: 'Sine.easeOut' });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x16213e);
      glow.setAlpha(0);
      txt.setScale(1);
      led.setFillStyle(c);
      this.tweens.killTweensOf(group);
      this.tweens.add({ targets: group, scaleX: 1, scaleY: 1, duration: 160, ease: 'Sine.easeOut' });
    });
    bg.on('pointerdown', () => {
      this.cameras.main.shake(60, 0.006);
      this.cameras.main.flash(80, (c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff);
      if (callback) callback();
    });

    this.add.existing(group);
    return { group, bg };
  }
}

window.MenuScene = MenuScene;

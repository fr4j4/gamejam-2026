// GameOverScene — Resultados con identidad CRT/arcade

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.result = data; }

  create() {
    const W = 640, H = 360;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.bgLayer = this.add.layer().setDepth(0);
    this.uiLayer = this.add.layer().setDepth(10);
    this.modalLayer = this.add.layer().setDepth(20);

    const win = this.result.win;
    const color = win ? '#bdcd9c' : '#ff6b6b';
    const title = win ? 'VICTORIA' : 'DERROTA';

    VFX.stars(this, this.bgLayer, 30);
    VFX.header(this, this.uiLayer, 'RESULTADO', color, { width: W, height: 34 });

    const pCls = CLASSES.find(c => c.id === this.result.classId) || CLASSES[0];
    VFX.classSeal(this, this.uiLayer, W / 2, 58, 28, pCls.icon, pCls.colorHex, true);

    VFX.lcdPanel(this, this.uiLayer, W / 2, H / 2 + 16, 320, 150);

    const titleTxt = UI.text(this, W / 2, H / 2 - 20, title, {
      fontFamily: '"Press Start 2P"', fontSize: '20px', color: color,
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);
    this.uiLayer.add(titleTxt);

    const stats = [
      `Turnos: ${this.result.turn}`,
      `Daño recibido: ${this.result.damageTaken}`,
      `Cartas jugadas: ${this.result.cardsPlayed}`,
      `Vida restante: ${this.result.hpLeft}`
    ];
    stats.forEach((s, i) => {
      const t = UI.text(this, W / 2, H / 2 + 14 + i * 18, s, {
        fontFamily: '"VT323"', fontSize: '16px', color: '#8892a0'
      }).setOrigin(0.5);
      this.uiLayer.add(t);
    });

    const menuBtn = UI.button(this, W / 2, H - 52, 'MENU PRINCIPAL', '#faba72',
      () => this.scene.start('MenuScene'), { layer: this.uiLayer, minWidth: 240, height: 30, fontSize: '9px' });
    this.uiLayer.add(menuBtn.container);

    if (this.result.mode !== 'test') {
      const rematchBtn = UI.button(this, W / 2, H - 18, 'REVANCHA', '#9fcafd',
        () => this.scene.start('DeckPickerScene', { mode: this.result.mode }), { layer: this.uiLayer, minWidth: 160, height: 26, fontSize: '8px' });
      this.uiLayer.add(rematchBtn.container);
    }

    CRT.addScanlines(this);
  }
}

window.GameOverScene = GameOverScene;

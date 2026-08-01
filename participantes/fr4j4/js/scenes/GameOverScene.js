// GameOverScene — Resultados con identidad CRT/arcade

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.result = data; }

  create() {
    const W = 640, H = 360;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    const win = this.result.win;
    const color = win ? '#bdcd9c' : '#ff6b6b';
    const title = win ? 'VICTORIA' : 'DERROTA';

    VFX.stars(this, this, 30);
    VFX.header(this, this, 'RESULTADO', color, { width: W, height: 34 });

    const pCls = CLASSES.find(c => c.id === this.result.classId) || CLASSES[0];
    VFX.classSeal(this, this, W / 2, 58, 28, pCls.icon, pCls.colorHex, true);

    VFX.lcdPanel(this, this, W / 2, H / 2 + 16, 320, 150);

    this.add.text(W / 2, H / 2 - 20, title, {
      fontFamily: '"Press Start 2P"', fontSize: '20px', color: color,
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    const stats = [
      `Turnos: ${this.result.turn}`,
      `Daño recibido: ${this.result.damageTaken}`,
      `Cartas jugadas: ${this.result.cardsPlayed}`,
      `Vida restante: ${this.result.hpLeft}`
    ];
    stats.forEach((s, i) => {
      this.add.text(W / 2, H / 2 + 14 + i * 18, s, {
        fontFamily: '"VT323"', fontSize: '16px', color: '#8892a0'
      }).setOrigin(0.5);
    });

    VFX.switchButton(this, this, W / 2, H - 52, 240, 34, 'MENU PRINCIPAL', '#faba72', () => {
      this.scene.start('MenuScene');
    });

    if (this.result.mode !== 'test') {
      VFX.switchButton(this, this, W / 2, H - 16, 160, 28, 'REVANCHA', '#9fcafd', () => {
        this.scene.start('GameScene', { mode: this.result.mode });
      });
    }

    CRT.addScanlines(this);
  }
}

window.GameOverScene = GameOverScene;

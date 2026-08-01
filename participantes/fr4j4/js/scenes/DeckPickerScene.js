// DeckPickerScene — Seleccion de baraja antes del combate
// Una sola pantalla: clase a la izquierda, slots a la derecha, COMBATIR abajo.

class DeckPickerScene extends Phaser.Scene {
  constructor() { super('DeckPickerScene'); }

  init(data) {
    this.mode = data.mode || 'test';
    this.selectedClass = 'mago';
    this.activeSlot = 0;
    this.allDecks = ensureStarterDecks();
  }

  create() {
    const W = 640, H = 360;
    this.W = W; this.H = H;
    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.isMobile = window.innerWidth < 700;

    VFX.stars(this, this);
    VFX.header(this, this, 'ELIGE BARAJA', '#faba72', { width: W, height: 22 });
    this.renderBody();
    CRT.addScanlines(this);
  }

  renderBody() {
    const W = this.W, H = this.H;
    const cls = CLASSES.find(x => x.id === this.selectedClass) || CLASSES[0];
    const clsColor = cls.colorHex;
    const clsColorNum = Phaser.Display.Color.HexStringToColor(clsColor).color;

    const leftW = 180;
    const leftX = 8;
    const leftY = 28;
    const leftH = H - leftY - 38;

    const rightX = leftX + leftW + 8;
    const rightW = W - rightX - 8;
    const rightY = leftY;
    const rightH = leftH;

    // Left panel — class picker
    VFX.lcdPanel(this, this, leftX + leftW / 2, leftY + leftH / 2, leftW, leftH);
    const rowH = Math.floor(leftH / CLASSES.length);
    CLASSES.forEach((cl, i) => {
      const y = leftY + i * rowH + rowH / 2;
      const active = cl.id === cls.id;
      const color = Phaser.Display.Color.HexStringToColor(cl.colorHex).color;
      const bg = this.add.rectangle(leftX + leftW / 2, y, leftW - 12, rowH - 4, 0x16213e)
        .setStrokeStyle(2, active ? color : 0x2a2a4a)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { this.selectedClass = cl.id; this.activeSlot = 0; this.renderBody(); });
      VFX.classSeal(this, this, leftX + 24, y, 14, cl.icon, cl.colorHex, active);
      UI.text(this, leftX + 44, y - 4, cl.name.toUpperCase(), {
        fontFamily: '"Press Start 2P"', fontSize: '7px',
        color: active ? cl.colorHex : '#e0e0e0'
      }).setOrigin(0, 0.5);
      UI.text(this, leftX + 44, y + 8, cl.style, {
        fontFamily: '"Press Start 2P"', fontSize: '5px', color: '#8892a0'
      }).setOrigin(0, 0.5);
      if (active) {
        UI.text(this, leftX + leftW - 12, y, '>', {
          fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#faba72'
        }).setOrigin(1, 0.5);
      }
    });

    // Right panel — slot list
    VFX.lcdPanel(this, this, rightX + rightW / 2, rightY + rightH / 2, rightW, rightH);
    const slots = this.allDecks[this.selectedClass] || [];

    if (slots.length === 0) {
      UI.text(this, rightX + rightW / 2, rightY + rightH / 2 - 10, 'No tienes barajas.\nCrea una en el\nDeckbuilder.', {
        fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#8892a0', align: 'center'
      }).setOrigin(0.5);
    } else {
      const slotH = 44;
      const slotGap = 4;
      const visibleSlots = Math.min(slots.length, Math.floor(rightH / (slotH + slotGap)));
      const startY = rightY + 8;

      slots.forEach((s, i) => {
        if (i >= visibleSlots) return;
        const y = startY + i * (slotH + slotGap) + slotH / 2;
        const active = i === this.activeSlot;
        const total = Object.values(s.cards || {}).reduce((a, b) => a + b, 0);
        const valid = total >= 5;
        const accent = active ? clsColor : '#8892a0';

        const bg = this.add.rectangle(rightX + rightW / 2, y, rightW - 12, slotH, 0x16213e)
          .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(accent).color)
          .setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => { this.activeSlot = i; this.renderBody(); });
        this.attachSlotMenu(bg, i);

        UI.text(this, rightX + 16, y - 8, (s.name || 'Baraja').toUpperCase(), {
          fontFamily: '"Press Start 2P"', fontSize: '7px',
          color: active ? clsColor : '#e0e0e0'
        }).setOrigin(0, 0.5);
        UI.text(this, rightX + 16, y + 8, `${total} cartas`, {
          fontFamily: '"Press Start 2P"', fontSize: '6px',
          color: valid ? '#bdcd9c' : '#ff6b6b'
        }).setOrigin(0, 0.5);
        if (active) {
          UI.text(this, rightX + rightW - 16, y, '>', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#faba72'
          }).setOrigin(1, 0.5);
        }
      });
    }

    // Footer buttons
    const btnY = H - 14;
    VFX.switchButton(this, this, 60, btnY, 80, 20, 'ATRAS', '#8892a0', () => this.scene.start('MenuScene'));

    if (slots.length === 0) {
      VFX.switchButton(this, this, W - 80, btnY, 120, 20, 'DECKBUILDER', '#9fcafd', () => this.scene.start('DeckScene', { fromPicker: true, mode: this.mode }));
    } else {
      VFX.switchButton(this, this, W - 160, btnY, 80, 20, 'DECKBUILDER', '#9fcafd', () => this.scene.start('DeckScene', { fromPicker: true, mode: this.mode }));
      const slot = slots[this.activeSlot];
      const total = Object.values(slot.cards || {}).reduce((a, b) => a + b, 0);
      if (total >= 5) {
        VFX.switchButton(this, this, W - 60, btnY, 100, 22, 'COMBATIR', clsColor, () => {
          this.cameras.main.fadeOut(200, 13, 13, 26);
          this.time.delayedCall(220, () => {
            this.scene.start('GameScene', {
              mode: this.mode,
              classId: this.selectedClass,
              slotIndex: this.activeSlot
            });
          });
        });
      } else {
        UI.text(this, W - 60, btnY, 'MIN 5', {
          fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ff6b6b'
        }).setOrigin(0.5);
      }
    }
  }

  attachSlotMenu(bg, slotIndex) {
    let pressTimer = null;
    bg.on('pointerdown', (pointer) => {
      pressTimer = this.time.delayedCall(450, () => this.openSlotMenu(slotIndex, pointer.x, pointer.y));
    });
    bg.on('pointerup', () => { if (pressTimer) pressTimer.remove(); });
    bg.on('pointerout', () => { if (pressTimer) pressTimer.remove(); });
    bg.on('contextmenu', (pointer) => {
      pointer.event.preventDefault();
      this.openSlotMenu(slotIndex, pointer.x, pointer.y);
    });
  }

  openSlotMenu(slotIndex, x, y) {
    this.clearModalLayer();
    const m = this.add.container(0, 0).setDepth(500);
    this.modalLayer = m;
    const menuW = 130, menuH = 90;
    let mx = x, my = y;
    if (mx + menuW > this.W) mx = this.W - menuW - 4;
    if (my + menuH > this.H) my = this.H - menuH - 4;
    if (mx < 0) mx = 4;
    if (my < 0) my = 4;

    const bg = this.add.rectangle(mx + menuW / 2, my + menuH / 2, menuW, menuH, 0x16213e)
      .setStrokeStyle(1, 0x2a2a4a);
    m.add(bg);

    const actions = [
      { label: 'RENOMBRAR', color: '#e0e0e0', cb: () => { this.closeModalLayer(); this.renameSlot(slotIndex); } },
      { label: 'DUPLICAR', color: '#e0e0e0', cb: () => { this.closeModalLayer(); this.duplicateSlot(slotIndex); } },
      { label: 'ELIMINAR', color: '#ff6b6b', cb: () => { this.closeModalLayer(); this.deleteSlot(slotIndex); } }
    ];
    actions.forEach((a, i) => {
      const by = my + 8 + i * 26;
      const bb = this.add.rectangle(mx + menuW / 2, by + 9, menuW - 8, 22, 0x16213e)
        .setInteractive({ useHandCursor: true });
      m.add(bb);
      m.add(UI.text(this, mx + 10, by + 9, a.label, {
        fontFamily: '"Press Start 2P"', fontSize: '7px', color: a.color
      }).setOrigin(0, 0.5));
      bb.on('pointerover', () => bb.setFillStyle(0x1a2a4e, 1));
      bb.on('pointerout', () => bb.setFillStyle(0x16213e, 1));
      bb.on('pointerdown', a.cb);
    });

    const overlay = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.001)
      .setInteractive().setDepth(499);
    overlay.on('pointerdown', () => { this.closeModalLayer(); overlay.destroy(); });
  }

  renameSlot(i) {
    const slots = this.allDecks[this.selectedClass] || [];
    const cur = slots[i];
    if (!cur) return;
    const name = window.prompt('Nuevo nombre:', cur.name || '');
    if (!name || !name.trim()) return;
    const trimmed = name.trim().slice(0, 24);
    if (slots.some((s, idx) => idx !== i && (s.name || '') === trimmed)) {
      this.showToast('Ya existe una baraja con ese nombre');
      return;
    }
    cur.name = trimmed;
    localStorage.setItem('deckstiny_decks', JSON.stringify(this.allDecks));
    this.renderBody();
  }

  duplicateSlot(i) {
    const slots = this.allDecks[this.selectedClass] || [];
    const cur = slots[i];
    if (!cur) return;
    const base = (cur.name || 'Baraja') + ' copia';
    let name = base, n = 1;
    while (slots.some(s => (s.name || '') === name)) { name = `${base} ${++n}`; }
    slots.splice(i + 1, 0, { name: name.slice(0, 24), cards: { ...cur.cards } });
    localStorage.setItem('deckstiny_decks', JSON.stringify(this.allDecks));
    this.renderBody();
  }

  deleteSlot(i) {
    const slots = this.allDecks[this.selectedClass] || [];
    if (!slots[i]) return;
    this.confirmAction('Eliminar esta baraja?', () => {
      slots.splice(i, 1);
      if (this.activeSlot >= slots.length) this.activeSlot = Math.max(0, slots.length - 1);
      localStorage.setItem('deckstiny_decks', JSON.stringify(this.allDecks));
      this.renderBody();
    });
  }

  confirmAction(msg, onYes) {
    this.clearModalLayer();
    const m = this.add.container(0, 0).setDepth(600);
    this.modalLayer = m;
    const overlay = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.7)
      .setInteractive();
    m.add(overlay);
    const pw = 280, ph = 100;
    const px = this.W / 2, py = this.H / 2;
    const panel = this.add.rectangle(px, py, pw, ph, 0x16213e).setStrokeStyle(2, 0xfaba72);
    m.add(panel);
    m.add(UI.text(this, px, py - 24, msg, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#e0e0e0',
      wordWrap: { width: pw - 24 }, align: 'center'
    }).setOrigin(0.5));
    const noBg = this.add.rectangle(px - 50, py + 18, 90, 22, 0x16213e)
      .setStrokeStyle(1, 0x2a2a4a).setInteractive({ useHandCursor: true });
    m.add(noBg);
    m.add(UI.text(this, px - 50, py + 18, 'CANCELAR', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#e0e0e0'
    }).setOrigin(0.5));
    const yesBg = this.add.rectangle(px + 50, py + 18, 90, 22, 0x16213e)
      .setStrokeStyle(2, 0xff6b6b).setInteractive({ useHandCursor: true });
    m.add(yesBg);
    m.add(UI.text(this, px + 50, py + 18, 'ELIMINAR', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ff6b6b'
    }).setOrigin(0.5));
    noBg.on('pointerdown', () => this.clearModalLayer());
    yesBg.on('pointerdown', () => { this.clearModalLayer(); onYes(); });
  }

  clearModalLayer() {
    if (this.modalLayer) {
      this.modalLayer.destroy(true);
      this.modalLayer = null;
    }
  }

  closeModalLayer() {
    this.clearModalLayer();
  }

  showToast(msg) {
    const m = this.add.container(0, 0).setDepth(700);
    const w = Math.max(160, msg.length * 7 + 32);
    const bg = this.add.rectangle(this.W / 2, this.H - 50, w, 32, 0x16213e)
      .setStrokeStyle(2, 0xfaba72);
    m.add(bg);
    m.add(UI.text(this, this.W / 2, this.H - 50, msg, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#faba72'
    }).setOrigin(0.5));
    this.tweens.add({
      targets: bg, alpha: { from: 1, to: 0 }, duration: 1500, ease: 'Cubic.easeIn',
      onComplete: () => m.destroy(true)
    });
  }
}

window.DeckPickerScene = DeckPickerScene;

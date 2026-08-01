// js/ui/card.js — Card factory (vertical playing card layout)
// Two modes: grid (small) and modal (large)
// Everything is Phaser: no HTML, no DOM. All rendered in canvas.
//
// Interactive model: each card has a dedicated interactive Zone as a child
// of the cardRoot container. This avoids the Container hit-area drift that
// happens when children (shadow, badges) extend the container's bounds.

(function () {
  const COLORS = {
    bg: 0x0d0d1a, panel: 0x16213e, panelLight: 0x1a2a4e, panelDark: 0x0a0a14,
    innerHi: 0x2a3a6e, innerLo: 0x0a1428,
    bevelHi: 0x3a3a5e, bevelLo: 0x050510,
    muted: 0x2a2a4a, line: 0x2a2a4a,
    gold: 0xfaba72, goldDim: 0x9a7038,
    info: 0x9fcafd, danger: 0xff6b6b, success: 0xbdcd9c, necro: 0xb388ff,
    text: 0xe0e0e0, textMuted: 0x8892a0, textDim: 0x555570,
    lcd: 0x0a1828, lcdOn: 0x4af0c8, lcdGlow: 0x6afae8
  };

  function drawHex(scene, x, y, size, value, colorNum) {
    const g = scene.add.graphics();
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      pts.push({ x: x + size * Math.cos(a), y: y + size * Math.sin(a) });
    }
    g.fillStyle(COLORS.panelDark, 1);
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < 6; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath(); g.fillPath();
    g.lineStyle(2, colorNum, 1); g.strokePath();
    const t = UI.text(scene, x, y, `${value}`, {
      fontFamily: '"Press Start 2P"', fontSize: '9px',
      color: '#' + colorNum.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    return [g, t];
  }

  function Card(scene, opts) {
    const { card, count = 0, inDeck = false, classColor, mode = 'grid' } = opts;
    const colorNum = Phaser.Display.Color.HexStringToColor(classColor).color;
    const isModal = mode === 'modal';

    const cardW = isModal ? 160 : (opts.cardW || 88);
    const cardH = isModal ? 220 : (opts.cardH || 120);

    const cardRoot = scene.add.container(0, 0);

    // Outer border (class color when in deck, muted otherwise)
    const borderColor = inDeck ? COLORS.gold : colorNum;
    const borderWidth = inDeck ? 3 : 2;
    const bg = scene.add.rectangle(0, 0, cardW, cardH, inDeck ? COLORS.panelLight : COLORS.panel)
      .setStrokeStyle(borderWidth, borderColor);
    cardRoot.add(bg);

    // Inner frame (artistic inset)
    const innerPad = 3;
    const inner = scene.add.rectangle(0, 0, cardW - innerPad * 2, cardH - innerPad * 2,
      isModal ? COLORS.bg : COLORS.innerLo, 0)
      .setStrokeStyle(1, COLORS.bevelHi, 0.6);
    cardRoot.add(inner);

    // Bevel highlights
    const bevelHi = scene.add.rectangle(0, -cardH / 2 + 1, cardW - 2, 1, COLORS.bevelHi).setOrigin(0.5, 0);
    const bevelLo = scene.add.rectangle(0, cardH / 2 - 1, cardW - 2, 1, COLORS.bevelLo).setOrigin(0.5, 1);
    cardRoot.add([bevelHi, bevelLo]);

    if (isModal) {
      const art = scene.add.rectangle(0, -10, cardW - 20, 70, 0x0a1828)
        .setStrokeStyle(1, 0x3a3a5e, 0.6);
      cardRoot.add(art);
    }

    const costHexSize = isModal ? 12 : 7;
    const costHexY = isModal ? -cardH / 2 + 18 : -cardH / 2 + 11;
    const costHex = drawHex(scene, -cardW / 2 + costHexSize + 4, costHexY,
      costHexSize, card.cost, COLORS.info);
    cardRoot.add(costHex);

    if (isModal) {
      const tagLabel = card.type === 'criatura' ? 'CR' : 'AC';
      const typeTag = UI.text(scene, cardW / 2 - 4, -cardH / 2 + 4, tagLabel, {
        fontFamily: '"Press Start 2P"', fontSize: '8px',
        color: '#' + COLORS.textMuted.toString(16).padStart(6, '0')
      }).setOrigin(1, 0);
      cardRoot.add(typeTag);
    }

    if (isModal) {
      const icon = scene.add.text(0, -10, card.type === 'criatura' ? '🐾' : '⚡', {
        fontFamily: 'sans-serif', fontSize: '26px'
      }).setOrigin(0.5);
      cardRoot.add(icon);
    } else {
      const iconY = -cardH / 2 + 28;
      const icon = scene.add.text(0, iconY, card.type === 'criatura' ? '🐾' : '⚡', {
        fontFamily: 'sans-serif', fontSize: '16px'
      }).setOrigin(0.5);
      cardRoot.add(icon);
    }

    const nameY = isModal ? 40 : -8;
    const nameFont = isModal ? '"Press Start 2P"' : '"VT323"';
    const nameSize = isModal ? '12px' : '14px';
    const nameText = UI.text(scene, 0, nameY, card.name, {
      fontFamily: nameFont, fontSize: nameSize,
      color: '#' + COLORS.text.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    nameText.setWordWrapWidth(cardW - 12);
    cardRoot.add(nameText);

    if (isModal) {
      const desc = UI.text(scene, 0, 78, card.desc, {
        fontFamily: '"VT323"', fontSize: '15px',
        color: '#' + COLORS.info.toString(16).padStart(6, '0'),
        align: 'center', wordWrap: { width: cardW - 24 }
      }).setOrigin(0.5);
      cardRoot.add(desc);

      if (card.type === 'criatura') {
        const se = (card.effects || []).find(e => e.type === 'summon');
        if (se) {
          const stats = UI.text(scene, 0, cardH / 2 - 26, `ATK ${se.atk}  /  HP ${se.hp}`, {
            fontFamily: '"Press Start 2P"', fontSize: '10px',
            color: '#' + COLORS.danger.toString(16).padStart(6, '0')
          }).setOrigin(0.5);
          cardRoot.add(stats);
        }
      }

      let ind = '';
      if ((card.effects || []).some(e => e.guard)) ind += '🛡️ ';
      if ((card.effects || []).some(e => e.evasive)) ind += '💨 ';
      if ((card.effects || []).some(e => e.celerity)) ind += '⚡ ';
      if (card.consumable) ind += '🔥';
      if (ind) {
        const indText = UI.text(scene, 0, cardH / 2 - 10, ind.trim(), {
          fontFamily: '"Press Start 2P"', fontSize: '8px',
          color: '#' + COLORS.gold.toString(16).padStart(6, '0')
        }).setOrigin(0.5);
        cardRoot.add(indText);
      }
    } else {
      const effectFont = UI.text(scene, 0, cardH / 2 - 8, shortEffect(card), {
        fontFamily: '"VT323"', fontSize: '11px',
        color: '#' + COLORS.info.toString(16).padStart(6, '0')
      }).setOrigin(0.5, 1);
      effectFont.setWordWrapWidth(cardW - 10);
      cardRoot.add(effectFont);
    }

    if (count > 0) {
      const badgeW = isModal ? 30 : 20;
      const badgeH = isModal ? 16 : 13;
      const badgeX = cardW / 2 - badgeW / 2 - 4;
      const badgeY = -cardH / 2 + badgeH / 2 + 5;
      const badgeBg = scene.add.rectangle(badgeX, badgeY, badgeW, badgeH, COLORS.gold)
        .setStrokeStyle(1, 0x9a7038);
      const badgeFont = isModal ? '"Press Start 2P"' : '"VT323"';
      const badgeSize = isModal ? '9px' : '12px';
      const badgeTxt = UI.text(scene, badgeX, badgeY, `×${count}`, {
        fontFamily: badgeFont, fontSize: badgeSize, color: '#0d0d1a'
      }).setOrigin(0.5);
      cardRoot.add([badgeBg, badgeTxt]);
    }

    // Dedicated interactive Zone for precise hit-testing.
    // Positioned at (0,0) local to cardRoot, size matches the visible card.
    // Zone is invisible and doesn't affect the container's bounding box.
    const zone = scene.add.zone(0, 0, cardW, cardH).setInteractive({
      useHandCursor: true
    });
    cardRoot.add(zone);

    cardRoot._cardBg = bg;
    cardRoot._cardZone = zone;
    cardRoot._cardBaseBorderColor = borderColor;
    cardRoot._cardBaseBorderWidth = borderWidth;
    cardRoot.setData('zone', zone);

    return cardRoot;
  }

  function shortEffect(card) {
    const e = (card.effects || [])[0];
    if (!e) return card.desc || '';
    const a = e.amount || e.base || e.damage || 0;
    switch (e.type) {
      case 'damage': return `${a} de daño`;
      case 'damage_all_enemies': return `${a} de daño a todos`;
      case 'damage_conditional': return `${a} de daño`;
      case 'heal': return `Cura ${a}`;
      case 'armor': return `+${a} armadura`;
      case 'draw': return `Roba ${a}`;
      case 'summon': return `${e.atk}/${e.hp}`;
      case 'venom': return `+${a} veneno`;
      case 'inspiration': return `+${a} inspiración`;
      case 'silence': return `Silenciar`;
      case 'freeze': return `Congelar`;
      case 'weaken': return `-${a} ataque`;
      case 'fortify': return `+${a} vida`;
      default: return card.desc.slice(0, 18);
    }
  }

  function attachHover(cardContainer) {
    const zone = cardContainer._cardZone;
    if (!zone) return;
    const onOver = () => {
      cardContainer.setScale(1.05, 1.05);
      if (cardContainer._cardBg) {
        cardContainer._cardBg.setStrokeStyle(3, 0xfaba72);
      }
    };
    const onOut = () => {
      cardContainer.setScale(1, 1);
      if (cardContainer._cardBg) {
        cardContainer._cardBg.setStrokeStyle(
          cardContainer._cardBaseBorderWidth,
          cardContainer._cardBaseBorderColor
        );
      }
    };
    zone.on('pointerover', onOver);
    zone.on('pointerout', onOut);
    cardContainer._cardZoneOnOver = onOver;
    cardContainer._cardZoneOnOut = onOut;
  }

  function bindOpenModal(cardContainer, card, openFn) {
    const zone = cardContainer._cardZone;
    if (!zone) return;
    zone.on('pointerdown', () => openFn(card));
  }

  window.CardFactory = { Card, shortEffect, attachHover, bindOpenModal, COLORS };
})();
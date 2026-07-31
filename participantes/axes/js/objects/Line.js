/**
 * Línea visual e interactiva entre dos puntos.
 *
 * La línea visible es fina, pero el rectángulo transparente recibe el input
 * con una zona mayor para que sea cómoda de seleccionar en el futuro.
 */
class Line {
  /**
   * @param {SVGElement} svg
   * @param {{ id: string, type: string, x1: number, y1: number, x2: number, y2: number }} data
   */
  constructor(svg, data, onClick) {
    this.id = data.id;
    this.owner = null;
    this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.group.dataset.lineId = this.id;
    this.group.setAttribute('role', 'button');
    this.group.setAttribute('aria-label', `Línea ${this.id}`);

    this.visible = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.visible.setAttribute('x1', data.x1);
    this.visible.setAttribute('y1', data.y1);
    this.visible.setAttribute('x2', data.x2);
    this.visible.setAttribute('y2', data.y2);
    this.visible.setAttribute('stroke', SVG_COLORS.emptyLine);
    this.visible.setAttribute('stroke-width', BOARD_STYLE.lineWidth);
    this.visible.setAttribute('stroke-linecap', 'round');
    this.visible.style.pointerEvents = 'none';

    this.hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.hitbox.setAttribute('x1', data.x1);
    this.hitbox.setAttribute('y1', data.y1);
    this.hitbox.setAttribute('x2', data.x2);
    this.hitbox.setAttribute('y2', data.y2);
    this.hitbox.setAttribute('stroke', 'transparent');
    this.hitbox.setAttribute('stroke-width', BOARD_STYLE.hitboxWidth);
    this.hitbox.setAttribute('stroke-linecap', 'round');
    this.hitbox.style.cursor = 'pointer';

    this.group.append(this.visible, this.hitbox);
    svg.appendChild(this.group);

    this.hitbox.addEventListener('pointerover', () => {
      if (this.owner === null) this.setHovered(true);
    });
    this.hitbox.addEventListener('pointerout', () => {
      if (this.owner === null) this.setHovered(false);
    });
    this.hitbox.addEventListener('pointerdown', () => onClick?.(this.id));
  }

  /** @param {boolean} hovered */
  setHovered(hovered) {
    if (this.owner !== null) return;
    this.visible.setAttribute('stroke', hovered ? SVG_COLORS.hoverLine : SVG_COLORS.emptyLine);
    this.visible.setAttribute('stroke-width', hovered ? BOARD_STYLE.lineWidth + 2 : BOARD_STYLE.lineWidth);
  }

  /** @param {number|null} owner */
  setOwner(owner) {
    this.owner = owner;
    const color = owner === 0 ? SVG_COLORS.playerOne : SVG_COLORS.playerTwo;
    this.visible.setAttribute('stroke', owner === null ? SVG_COLORS.emptyLine : color);
    this.visible.setAttribute('stroke-width', BOARD_STYLE.lineWidth);
    this.hitbox.style.cursor = owner === null ? 'pointer' : 'default';
    this.visible.classList.toggle('line-drawn', owner !== null);
  }

  destroy() {
    this.group.remove();
  }
}

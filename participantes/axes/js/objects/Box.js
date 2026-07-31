/** Cuadro SVG que muestra qué jugador lo completó. */
class Box {
  /** @param {SVGElement} svg @param {string} id @param {number} x @param {number} y @param {number} size */
  constructor(svg, id, x, y, size) {
    this.id = id;
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.element.setAttribute('x', x);
    this.element.setAttribute('y', y);
    this.element.setAttribute('width', size);
    this.element.setAttribute('height', size);
    this.element.setAttribute('fill', 'transparent');
    this.element.setAttribute('rx', 4);
    this.element.style.pointerEvents = 'none';
    svg.appendChild(this.element);
  }

  /** @param {number|null} owner */
  setOwner(owner) {
    const color = owner === 0 ? SVG_COLORS.playerOne : SVG_COLORS.playerTwo;
    this.element.setAttribute('fill', owner === null ? 'transparent' : color);
    this.element.setAttribute('fill-opacity', owner === null ? '0' : '0.28');
    this.element.classList.toggle('box-filled', owner !== null);
  }
}

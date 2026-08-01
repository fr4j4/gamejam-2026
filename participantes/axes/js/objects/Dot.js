/**
 * Punto visual de la cuadrícula.
 *
 * Los puntos son SVG nativo para mantener el tablero ligero y fácil de
 * inspeccionar en el navegador.
 */
class Dot {
  /** @param {SVGElement} svg @param {number} x @param {number} y */
  constructor(svg, x, y) {
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.element.setAttribute('cx', x);
    this.element.setAttribute('cy', y);
    this.element.setAttribute('r', BOARD_STYLE.dotRadius);
    this.element.setAttribute('fill', SVG_COLORS.dot);
    this.element.setAttribute('stroke', SVG_COLORS.boardGridBorder);
    this.element.setAttribute('stroke-width', '2');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.classList.add('board-dot');
    this.element.style.pointerEvents = 'none';
    svg.appendChild(this.element);
  }
}

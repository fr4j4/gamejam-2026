/**
 * Construye la representación SVG de una cuadrícula de Timbiriche.
 *
 * Esta fase solo conoce geometría y presentación. La ocupación de líneas y
 * cuadros se incorporará después mediante una capa de lógica independiente.
 */
class Board {
  /** @param {HTMLElement} parent @param {number} size @param {(result: object) => void} onMove */
  constructor(parent, size, onMove) {
    this.parent = parent;
    this.size = size;
    this.onMove = onMove;
    this.state = initBoard(size);
    this.lines = [];
    this.dots = [];
    this.boxes = [];
    this.lineById = new Map();
    this.svg = this.createSvg();
    this.render();
  }

  createSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'board-svg';
    svg.setAttribute('viewBox', '0 0 800 800');
    svg.setAttribute('aria-label', `Tablero de ${this.size} por ${this.size} puntos`);
    this.parent.appendChild(svg);
    return svg;
  }

  render() {
    const spacing = BOARD_STYLE.width / (this.size - 1);
    const left = (800 - BOARD_STYLE.width) / 2;
    const top = BOARD_STYLE.top;
    const bottom = top + BOARD_STYLE.width;

    // Primero los cuadros, después líneas y puntos para respetar las capas SVG.
    for (let row = 0; row < this.size - 1; row += 1) {
      for (let column = 0; column < this.size - 1; column += 1) {
        this.boxes.push(new Box(this.svg, `box-${row}-${column}`, left + column * spacing, top + row * spacing, spacing));
      }
    }

    for (let row = 0; row < this.size; row += 1) {
      for (let column = 0; column < this.size - 1; column += 1) {
        const x1 = left + column * spacing;
        const x2 = x1 + spacing;
        const y = top + row * spacing;
        const line = new Line(this.svg, {
          id: `h-${row}-${column}`,
          type: 'h', x1, y1: y, x2, y2: y,
        }, (lineId) => this.handleLineClick(lineId));
        this.lines.push(line);
        this.lineById.set(line.id, line);
      }
    }

    for (let row = 0; row < this.size - 1; row += 1) {
      for (let column = 0; column < this.size; column += 1) {
        const x = left + column * spacing;
        const y1 = top + row * spacing;
        const y2 = y1 + spacing;
        const line = new Line(this.svg, {
          id: `v-${row}-${column}`,
          type: 'v', x1: x, y1, x2: x, y2,
        }, (lineId) => this.handleLineClick(lineId));
        this.lines.push(line);
        this.lineById.set(line.id, line);
      }
    }

    for (let row = 0; row < this.size; row += 1) {
      for (let column = 0; column < this.size; column += 1) {
        this.dots.push(new Dot(this.svg, left + column * spacing, top + row * spacing));
      }
    }
  }

  handleLineClick(lineId) {
    const result = drawLine(this.state, lineId, this.state.currentPlayer);
    if (!result.accepted) return;
    this.state = result.state;
    this.renderState();
    this.onMove?.(result);
  }

  renderState() {
    this.state.lines.forEach((line) => this.lineById.get(line.id)?.setOwner(line.owner));
    this.state.boxes.forEach((box) => this.boxes.find((view) => view.id === box.id)?.setOwner(box.owner));
  }

  /** @param {boolean} visible */
  setVisible(visible) {
    this.svg.style.display = visible ? 'block' : 'none';
  }

  destroy() {
    this.lines.forEach((line) => line.destroy());
    this.dots.forEach((dot) => dot.element.remove());
    this.svg.remove();
  }
}

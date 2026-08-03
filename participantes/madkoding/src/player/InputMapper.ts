// ─── Input Mapper ────────────────────────────────────────────────────────────
// WASD + Arrow keys = ship movement (both control the ship)
// Arrow keys also offset the crosshair relative to the ship center
// Space = fire lasers, Z = bomb, Escape = pause

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  fire: boolean;
  bomb: boolean;
  pause: boolean;
  horizontalAxis: number;
  verticalAxis: number;
  aimX: number;
  aimY: number;
}

const AIM_SPEED = 0.6; // how fast crosshair drifts from center
// Margin (in px) from the window edge where the mouse is ignored as an aim
// source — at the very edge we can't tell if the pointer is still inside.
const MOUSE_EDGE_MARGIN = 2;

export class InputMapper {
  private keys: Set<string> = new Set();
  private _state: InputState = {
    left: false, right: false, up: false, down: false,
    fire: false, bomb: false,
    pause: false,
    horizontalAxis: 0, verticalAxis: 0,
    aimX: 0, aimY: 0,
  };
  private pauseConsumed = false;
  private bombConsumed = false;
  private _aimX = 0;
  private _aimY = 0;
  private _lastTime = 0;
  // Mouse aim: only used while the pointer is inside the window (not at edge).
  private _mouseInside = false;
  private _mouseX = 0;
  private _mouseY = 0;
  private _mouseDown = false;

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseleave', this.onMouseLeave);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code);
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) {
      e.preventDefault();
    }
  }
  private onKeyUp(e: KeyboardEvent): void { this.keys.delete(e.code); }
  private getKey(key: string): boolean { return this.keys.has(key); }

  private onMouseMove(e: MouseEvent): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Only treat the mouse as an aim source while it's clearly inside the
    // window. At the edge (or outside) we ignore it.
    this._mouseInside =
      e.clientX > MOUSE_EDGE_MARGIN && e.clientX < w - MOUSE_EDGE_MARGIN &&
      e.clientY > MOUSE_EDGE_MARGIN && e.clientY < h - MOUSE_EDGE_MARGIN;
    if (this._mouseInside) {
      // NDC: -1..1 (x right, y up).
      this._mouseX = (e.clientX / w) * 2 - 1;
      this._mouseY = -((e.clientY / h) * 2 - 1);
    }
  }

  private onMouseLeave(): void {
    this._mouseInside = false;
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0) this._mouseDown = true;
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 0) this._mouseDown = false;
  }

  update(): InputState {
    // Ship movement: both WASD and Arrow keys control the ship
    const left = this.getKey('KeyA') || this.getKey('ArrowLeft');
    const right = this.getKey('KeyD') || this.getKey('ArrowRight');
    const up = this.getKey('KeyW') || this.getKey('ArrowUp');
    const down = this.getKey('KeyS') || this.getKey('ArrowDown');

    const fire = this.getKey('Space') || this._mouseDown;
    const pause = this.getKey('Escape') && !this.pauseConsumed;
    const bomb = this.getKey('KeyZ') && !this.bombConsumed;

    this.pauseConsumed = this.getKey('Escape');
    this.bombConsumed = this.getKey('KeyZ');

    let horizontalAxis = 0;
    let verticalAxis = 0;
    if (left) horizontalAxis -= 1;
    if (right) horizontalAxis += 1;
    if (up) verticalAxis -= 1;
    if (down) verticalAxis += 1;

    // Crosshair aim: mouse takes priority while inside the window; otherwise
    // arrow keys drift the crosshair away from center and it returns slowly.
    const now = performance.now();
    const dt = this._lastTime ? Math.min((now - this._lastTime) / 1000, 0.05) : 0.016;
    this._lastTime = now;

    if (this._mouseInside) {
      // Mouse is inside the window → aim directly at the pointer.
      this._aimX = this._mouseX;
      this._aimY = this._mouseY;
    } else {
      let aimDx = 0, aimDy = 0;
      if (this.getKey('ArrowLeft')) aimDx -= 1;
      if (this.getKey('ArrowRight')) aimDx += 1;
      if (this.getKey('ArrowUp')) aimDy += 1;
      if (this.getKey('ArrowDown')) aimDy -= 1;

      // Move aim with arrows, drift back to center when released
      if (aimDx !== 0 || aimDy !== 0) {
        this._aimX += aimDx * AIM_SPEED * dt;
        this._aimY += aimDy * AIM_SPEED * dt;
      } else {
        // Return to center slowly
        this._aimX *= 0.92;
        this._aimY *= 0.92;
        if (Math.abs(this._aimX) < 0.01) this._aimX = 0;
        if (Math.abs(this._aimY) < 0.01) this._aimY = 0;
      }
    }
    this._aimX = Math.max(-0.85, Math.min(0.85, this._aimX));
    this._aimY = Math.max(-0.6, Math.min(0.6, this._aimY));

    // Gamepad
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp) {
        const deadzone = 0.2;
        const lx = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
        const ly = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
        if (Math.abs(lx) > Math.abs(horizontalAxis)) horizontalAxis = lx;
        if (Math.abs(ly) > Math.abs(verticalAxis)) verticalAxis = ly;
        break;
      }
    }

    this._state = {
      left, right, up, down, fire, bomb, pause,
      horizontalAxis: Math.max(-1, Math.min(1, horizontalAxis)),
      verticalAxis: Math.max(-1, Math.min(1, verticalAxis)),
      aimX: this._aimX,
      aimY: this._aimY,
    };
    return this._state;
  }

  get state(): InputState { return this._state; }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseleave', this.onMouseLeave);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
}
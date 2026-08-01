import Phaser from "phaser";

/**
 * Virtual joystick for mobile touch input.
 *
 * Renders a semi-transparent base + thumb on the left side of the screen.
 * Exposes `getDirection()` returning normalized { x, y } for movement.
 * Auto-hides on desktop (no touch capability).
 */
export class VirtualJoystick {
  private base: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  private baseX: number;
  private baseY: number;
  private readonly radius: number;
  private active: boolean = false;
  private dx: number = 0;
  private dy: number = 0;
  private touchId: number = -1;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number) {
    this.baseX = x;
    this.baseY = y;
    this.radius = radius;

    this.base = scene.add.circle(x, y, radius, 0xffffff, 0.12);
    this.base.setStrokeStyle(2, 0xffffff, 0.25);
    this.base.setScrollFactor(0);
    this.base.setDepth(2000);

    this.thumb = scene.add.circle(x, y, radius * 0.4, 0xffffff, 0.3);
    this.thumb.setScrollFactor(0);
    this.thumb.setDepth(2001);

    // Only show on touch-capable devices
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    this.base.setVisible(hasTouch);
    this.thumb.setVisible(hasTouch);

    if (hasTouch) {
      scene.input.on("pointerdown", this.onPointerDown, this);
      scene.input.on("pointermove", this.onPointerMove, this);
      scene.input.on("pointerup", this.onPointerUp, this);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // Only activate if the touch is on the left half of the screen
    if (pointer.x < this.base.scene.scale.width / 2) {
      this.active = true;
      this.touchId = pointer.id;
      this.baseX = pointer.x;
      this.baseY = pointer.y;
      this.base.setPosition(this.baseX, this.baseY);
      this.thumb.setPosition(this.baseX, this.baseY);
      this.dx = 0;
      this.dy = 0;
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.active || pointer.id !== this.touchId) return;

    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.radius;

    if (dist > maxDist) {
      this.dx = (dx / dist);
      this.dy = (dy / dist);
      this.thumb.setPosition(this.baseX + this.dx * maxDist, this.baseY + this.dy * maxDist);
    } else {
      this.dx = dx / maxDist;
      this.dy = dy / maxDist;
      this.thumb.setPosition(pointer.x, pointer.y);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.active || pointer.id !== this.touchId) return;
    this.active = false;
    this.touchId = -1;
    this.dx = 0;
    this.dy = 0;
    this.thumb.setPosition(this.baseX, this.baseY);
  }

  /** Returns normalized direction vector { x, y } in [-1, 1]. */
  getDirection(): { x: number; y: number } {
    return { x: this.dx, y: this.dy };
  }

  /** Whether a touch is currently active on the joystick. */
  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.base.destroy();
    this.thumb.destroy();
  }
}

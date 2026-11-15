// INKLING — keyboard and mouse state. The real listeners feed this, and the
// screenshot autopilot drives the same object, so a staged scene is a real
// playthrough and never a hand-posed frame.

export class Input {
  constructor() {
    this.keys = new Set();
    this.mouseX = 640;
    this.mouseY = 360;
    this.mouseDown = false;
    this.pressedKeys = new Set();
    this.clicked = false;
    this.onKeyDown = null;
    this.onClick = null;
  }

  attach(canvas) {
    window.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.keys.add(event.code);
        this.pressedKeys.add(event.code);
        if (this.onKeyDown) this.onKeyDown(event.code);
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * 1280;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * 720;
    });
    canvas.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      this.mouseDown = true;
      this.clicked = true;
      if (this.onClick) this.onClick(this.mouseX, this.mouseY);
    });
    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  isDown(code) {
    return this.keys.has(code);
  }

  moveLeft() {
    return this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  moveRight() {
    return this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  jumpHeld() {
    return this.isDown('KeyW') || this.isDown('ArrowUp') || this.isDown('Space');
  }

  /** True once for a key pressed since the last frame was consumed. */
  consumePressed(code) {
    if (this.pressedKeys.has(code)) {
      this.pressedKeys.delete(code);
      return true;
    }
    return false;
  }

  consumeClick() {
    const was = this.clicked;
    this.clicked = false;
    return was;
  }

  endFrame() {
    this.pressedKeys.clear();
  }

  // ---- synthetic input, for the screenshot autopilot only ----
  setKey(code, down) {
    if (down) this.keys.add(code);
    else this.keys.delete(code);
  }

  setMouse(x, y, down) {
    this.mouseX = x;
    this.mouseY = y;
    this.mouseDown = down;
  }

  releaseAll() {
    this.keys.clear();
    this.mouseDown = false;
    this.pressedKeys.clear();
  }
}

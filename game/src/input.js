// Ember & Thyme — Rush Hour Kitchen
// input.js — one job: keyboard and mouse state, nothing else.
// The game reads this each frame; nothing here knows about stations or rules.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered: consumed by the game each frame
  let mouseX = 0;
  let mouseY = 0;
  let mouseClicked = false; // edge-triggered click, consumed each frame
  let mouseDown = false;

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.key.toLowerCase());
    keys.add(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPos(event);
    mouseX = p.x;
    mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = canvasPos(event);
    mouseX = p.x;
    mouseY = p.y;
    mouseDown = true;
    mouseClicked = true;
  });
  window.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  return {
    keys,
    pressed,
    get mouseX() { return mouseX; },
    get mouseY() { return mouseY; },
    get mouseDown() { return mouseDown; },
    // True once per click; call takeClick() to consume it.
    takeClick() {
      const c = mouseClicked;
      mouseClicked = false;
      return c;
    },
    // True once per keydown; call takePressed('e') to consume it.
    takePressed(key) {
      const k = key.toLowerCase();
      if (pressed.has(k)) {
        pressed.delete(k);
        return true;
      }
      return false;
    },
    clearPressed() {
      pressed.clear();
    },
    isDown(...names) {
      return names.some((n) => keys.has(n.toLowerCase()));
    },
  };
}

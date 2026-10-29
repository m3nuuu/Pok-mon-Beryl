// One input layer for keyboard and the on-screen touch pad. Scenes poll it each frame.
export type Button = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start';

const KEYMAP: Record<string, Button> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a', Space: 'a',
  KeyX: 'b', Escape: 'b', Backspace: 'b',
  ShiftLeft: 'start', ShiftRight: 'start',
};

const held = new Set<Button>();
const pressed = new Set<Button>();
const order: Button[] = []; // most recently pressed direction wins

function press(b: Button): void {
  if (!held.has(b)) {
    pressed.add(b);
    order.push(b);
  }
  held.add(b);
}

function release(b: Button): void {
  held.delete(b);
  const i = order.lastIndexOf(b);
  if (i >= 0) order.splice(i, 1);
}

export function initInput(): void {
  window.addEventListener('keydown', (e) => {
    const b = KEYMAP[e.code];
    if (!b) return;
    e.preventDefault();
    press(b);
  });
  window.addEventListener('keyup', (e) => {
    const b = KEYMAP[e.code];
    if (b) release(b);
  });
  window.addEventListener('blur', () => {
    for (const b of [...held]) release(b);
  });

  document.querySelectorAll<HTMLElement>('[data-btn]').forEach((el) => {
    const b = el.dataset.btn as Button;
    const down = (e: Event) => {
      e.preventDefault();
      press(b);
      el.classList.add('active');
    };
    const up = (e: Event) => {
      e.preventDefault();
      release(b);
      el.classList.remove('active');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  });
}

export function isHeld(b: Button): boolean {
  return held.has(b);
}

/** True once per physical press; consumes it. */
export function justPressed(b: Button): boolean {
  if (!pressed.has(b)) return false;
  pressed.delete(b);
  return true;
}

/** Drops presses nobody consumed this frame, so they can't fire later. */
export function endFrame(): void {
  pressed.clear();
}

export function heldDirection(): 'up' | 'down' | 'left' | 'right' | null {
  for (let i = order.length - 1; i >= 0; i--) {
    const b = order[i];
    if (b === 'up' || b === 'down' || b === 'left' || b === 'right') return b;
  }
  return null;
}

/** For tests and scripted demos. */
export const virtual = { press, release };

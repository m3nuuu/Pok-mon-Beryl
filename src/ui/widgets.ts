import Phaser from 'phaser';
import { justPressed } from '../input';

export const FONT = '"Press Start 2P"';
export const SCREEN_W = 720;
export const SCREEN_H = 480;

// --- promise helpers so scripted scenes read top to bottom ------------------

export function until(scene: Phaser.Scene, pred: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const tick = () => {
      if (pred()) {
        scene.events.off('update', tick);
        resolve();
      }
    };
    scene.events.on('update', tick);
  });
}

export function delay(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => scene.time.delayedCall(ms, () => resolve()));
}

export function tweenP(scene: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise((resolve) => scene.tweens.add({ ...cfg, onComplete: () => resolve() }));
}

// --- boxes --------------------------------------------------------------------

export type BoxStyle = 'world' | 'battle';

const STYLES = {
  world: { fill: 0xf8f8f8, outer: 0x4868a8, inner: 0xa8c8f0, text: '#404040', shadow: '#d0d0c8' },
  battle: { fill: 0x284860, outer: 0xd8a848, inner: 0xf8f0d0, text: '#f8f8f8', shadow: '#685868' },
};

export function drawBox(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, style: BoxStyle) {
  const s = STYLES[style];
  g.fillStyle(s.outer, 1).fillRoundedRect(x, y, w, h, 12);
  g.fillStyle(s.inner, 1).fillRoundedRect(x + 6, y + 6, w - 12, h - 12, 8);
  g.fillStyle(s.fill, 1).fillRoundedRect(x + 9, y + 9, w - 18, h - 18, 6);
}

export function label(
  scene: Phaser.Scene, x: number, y: number, s: string,
  opts: { size?: number; color?: string; shadow?: string; style?: BoxStyle } = {},
): Phaser.GameObjects.Text {
  const st = STYLES[opts.style ?? 'world'];
  const t = scene.add.text(x, y, s, {
    fontFamily: FONT,
    fontSize: `${opts.size ?? 24}px`,
    color: opts.color ?? st.text,
  });
  const shadow = opts.shadow ?? st.shadow;
  if (shadow) t.setShadow(3, 3, shadow, 0, false, true);
  return t;
}

// --- dialog -------------------------------------------------------------------

export class DialogBox {
  private container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, style: BoxStyle, depth = 1000) {
    const g = scene.add.graphics();
    drawBox(g, 4, SCREEN_H - 124, SCREEN_W - 8, 120, style);
    this.text = label(scene, 30, SCREEN_H - 96, '', { style }).setLineSpacing(18);
    this.text.setWordWrapWidth(SCREEN_W - 80, true);
    this.arrow = label(scene, SCREEN_W - 52, SCREEN_H - 50, '▼', { style, size: 16 });
    scene.tweens.add({ targets: this.arrow, y: '+=6', duration: 300, yoyo: true, repeat: -1 });
    this.container = scene.add.container(0, 0, [g, this.text, this.arrow]).setDepth(depth).setVisible(false);
  }

  get visible(): boolean {
    return this.container.visible;
  }

  show(): void {
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  /** Types out the message page by page. With wait=false the last page continues on its own. */
  async say(msg: string, wait = true): Promise<void> {
    this.show();
    const lines = this.text.getWrappedText(msg);
    const pages: string[] = [];
    for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2).join('\n'));
    for (let p = 0; p < pages.length; p++) {
      const page = pages[p];
      const last = p === pages.length - 1;
      this.arrow.setVisible(false);
      let shown = 0;
      await until(this.scene, () => {
        if (justPressed('a') || justPressed('b')) shown = page.length;
        else shown = Math.min(page.length, shown + 2);
        this.text.setText(page.slice(0, shown));
        return shown >= page.length;
      });
      if (last && !wait) {
        await delay(this.scene, 700);
        return;
      }
      this.arrow.setVisible(true);
      await until(this.scene, () => justPressed('a') || justPressed('b'));
    }
    this.arrow.setVisible(false);
  }

  /** Shows text instantly, without waiting (e.g. "What will X do?"). */
  set(msg: string): void {
    this.show();
    this.arrow.setVisible(false);
    this.text.setText(this.text.getWrappedText(msg).slice(0, 2).join('\n'));
  }
}

// --- menus ----------------------------------------------------------------------

export interface MenuOptions {
  x: number;
  y: number;
  w: number;
  cols?: number;
  colWidth?: number;
  rowHeight?: number;
  style?: BoxStyle;
  /** Index returned when B is pressed; omit to ignore B. */
  cancel?: number;
  /** Disabled entries are drawn grey but can still be picked (the caller decides what happens). */
  disabled?: boolean[];
  onMove?: (index: number) => void;
  depth?: number;
  start?: number;
  size?: number;
}

/** A boxed grid menu with a ▶ cursor. Resolves with the picked index. */
export async function choose(scene: Phaser.Scene, items: string[], o: MenuOptions): Promise<number> {
  const cols = o.cols ?? 1;
  const rowH = o.rowHeight ?? 48;
  const colW = o.colWidth ?? o.w - 60;
  const rows = Math.ceil(items.length / cols);
  const h = rows * rowH + 36;
  const style = o.style ?? 'world';
  const g = scene.add.graphics();
  drawBox(g, o.x, o.y, o.w, h, style);
  const texts = items.map((s, i) =>
    label(scene, o.x + 52 + (i % cols) * colW, o.y + 26 + Math.floor(i / cols) * rowH, s, {
      style,
      size: o.size,
      color: o.disabled?.[i] ? '#a0a0a0' : undefined,
    }),
  );
  const cursor = label(scene, 0, 0, '▶', { style, size: o.size });
  const container = scene.add.container(0, 0, [g, ...texts, cursor]).setDepth(o.depth ?? 1100);

  let index = o.start ?? 0;
  const place = () => {
    cursor.setPosition(o.x + 22 + (index % cols) * colW, o.y + 26 + Math.floor(index / cols) * rowH);
    o.onMove?.(index);
  };
  place();

  let result = -1;
  await until(scene, () => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    let next = index;
    if (justPressed('up') && row > 0) next -= cols;
    if (justPressed('down') && row < rows - 1 && index + cols < items.length) next += cols;
    if (justPressed('left') && col > 0) next -= 1;
    if (justPressed('right') && col < cols - 1 && index + 1 < items.length) next += 1;
    if (next !== index) {
      index = next;
      place();
    }
    if (justPressed('a')) {
      result = index;
      return true;
    }
    if (o.cancel !== undefined && justPressed('b')) {
      result = o.cancel;
      return true;
    }
    return false;
  });
  container.destroy();
  return result;
}

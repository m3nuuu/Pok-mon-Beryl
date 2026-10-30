// Swaps the built-in art for the player's own picks at boot.
import Phaser from 'phaser';
import { CHARACTERS, ROLES } from './roles';
import { loadCustom, type Pick } from './store';

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function replace(scene: Phaser.Scene, key: string, c: HTMLCanvasElement) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return scene.textures.addCanvas(key, c)!;
}

const source = (scene: Phaser.Scene, key: string) =>
  scene.textures.exists(key) ? (scene.textures.get(key).getSourceImage() as CanvasImageSource) : null;

/** Returns how many textures were replaced. */
export async function applyCustomGraphics(scene: Phaser.Scene): Promise<number> {
  const data = await loadCustom();
  if (!data) return 0;
  const bitmaps: Record<string, ImageBitmap> = {};
  for (const [name, blob] of Object.entries(data.images)) {
    try {
      bitmaps[name] = await createImageBitmap(blob);
    } catch {
      // A broken image just keeps the built-in art.
    }
  }
  const draw = (ctx: CanvasRenderingContext2D, p: Pick, w: number, h: number) =>
    ctx.drawImage(bitmaps[p.img], p.x, p.y, p.w, p.h, 0, 0, w, h);
  const picks = { ...data.config.picks };
  // A second animation frame falls back to the first.
  for (const [a, b] of [['t-water0', 't-water1'], ['t-spill0', 't-spill1']]) if (picks[a] && !picks[b]) picks[b] = picks[a];

  let count = 0;
  for (const role of ROLES) {
    const p = picks[role.key];
    if (!p || !bitmaps[p.img]) continue;
    const { c, ctx } = canvas(role.w, role.h);
    const base = role.base && source(scene, role.base);
    if (base) ctx.drawImage(base, 0, 0, role.w, role.h);
    draw(ctx, p, role.w, role.h);
    replace(scene, role.key, c);
    count++;
  }
  // Custom tall grass without its own front part: use its lower half.
  if (picks['t-tall'] && !picks['t-tall-top'] && bitmaps[picks['t-tall'].img]) {
    const { c, ctx } = canvas(16, 16);
    draw(ctx, picks['t-tall'], 16, 16);
    ctx.clearRect(0, 0, 16, 8);
    replace(scene, 't-tall-top', c);
  }

  for (const { look } of CHARACTERS) {
    const frames = data.config.chars[look];
    const first = frames?.find((f) => f && bitmaps[f.img]);
    if (!frames || !first) continue;
    const fw = first.w, fh = first.h;
    const { c, ctx } = canvas(fw * 9, fh);
    for (let i = 0; i < 9; i++) {
      // Missing steps reuse that direction's standing frame, then any frame.
      const f = [frames[i], frames[i - (i % 3)], first].find((x) => x && bitmaps[x.img])!;
      ctx.drawImage(bitmaps[f.img], f.x, f.y, f.w, f.h, i * fw, 0, fw, fh);
    }
    const tex = replace(scene, `c-${look}`, c);
    for (let i = 0; i < 9; i++) tex.add(i, 0, i * fw, 0, fw, fh);
    count++;
  }
  return count;
}

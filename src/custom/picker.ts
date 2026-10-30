// The "GRAPHICS" page: load your own sprite sheets and click which part of them
// replaces each tile, building and character. Everything is saved in this browser.
import { CHARACTERS, FRAME_NAMES, ROLES, type Role } from './roles';
import { emptyData, loadCustom, saveCustom, usedImages, type CustomData, type Pick } from './store';

type Target = { kind: 'role'; role: Role } | { kind: 'char'; look: string; slot: number };

const CSS = `
  body.picker { overflow: auto; touch-action: auto; user-select: auto; -webkit-user-select: auto; }
  #picker { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px; font: 14px system-ui, sans-serif; color: #d8e4ec; }
  #picker h1 { font-size: 18px; margin: 0 0 4px; width: 100%; }
  #picker p.help { margin: 0; width: 100%; opacity: 0.8; line-height: 1.5; }
  #picker .bar { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; align-items: center; }
  #picker button, #picker label.btn, #picker select, #picker input[type=number] {
    background: #2a3440; color: #e0e8f0; border: 1px solid #4a5a6a; border-radius: 6px; padding: 6px 10px; font: inherit; cursor: pointer;
  }
  #picker input[type=number] { width: 56px; cursor: text; }
  #picker button.primary { background: #2f6a5a; border-color: #4fa088; }
  #picker .roles { flex: 0 1 340px; max-height: 75vh; overflow: auto; background: #161c22; border-radius: 8px; padding: 8px; }
  #picker .roles h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; margin: 12px 4px 4px; }
  #picker .row { display: flex; align-items: center; gap: 8px; padding: 4px; border-radius: 6px; cursor: pointer; }
  #picker .row:hover { background: #222a32; }
  #picker .row.sel { background: #2f4a5a; }
  #picker .row canvas { width: 32px; height: 32px; image-rendering: pixelated; background: #0c1014; border-radius: 3px; flex: none; }
  #picker .row span { flex: 1; }
  #picker .row .x { padding: 0 6px; background: none; border: none; opacity: 0.6; }
  #picker .slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px 4px 8px 44px; }
  #picker .slot { text-align: center; font-size: 11px; padding: 4px; border-radius: 6px; cursor: pointer; background: #1c242c; }
  #picker .slot.sel { background: #2f4a5a; }
  #picker .slot canvas { display: block; margin: 0 auto 2px; width: 32px; height: 48px; image-rendering: pixelated; }
  #picker .sheet { flex: 1 1 400px; min-width: 0; }
  #picker .sheet .wrap { overflow: auto; max-height: 70vh; background: #0c1014; border-radius: 8px; margin-top: 8px; }
  #picker .sheet canvas { image-rendering: pixelated; display: block; cursor: crosshair; }
  #picker .status { min-height: 20px; color: #9fd8c0; width: 100%; }
`;

export async function mountPicker(): Promise<void> {
  document.body.classList.add('picker');
  document.getElementById('wrap')?.remove();
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const data: CustomData = (await loadCustom()) ?? emptyData();
  const imgs = new Map<string, HTMLImageElement>();
  let current = '';
  let zoom = 3;
  let grid = 16;
  let charW = 16, charH = 32;
  let target: Target = { kind: 'role', role: ROLES[0] };
  let drag: { x0: number; y0: number; x1: number; y1: number } | null = null;

  const root = document.createElement('div');
  root.id = 'picker';
  root.innerHTML = `
    <h1>Custom graphics</h1>
    <p class="help">1. Add your sprite sheets (PNG). 2. Pick something on the left. 3. Click the matching tile on the sheet
      (drag a box for houses and backgrounds). Characters: set the frame size, then click the nine frames in order.
      Everything stays in this browser and the game uses it the next time it starts.</p>
    <div class="bar">
      <label class="btn">Add images<input type="file" accept="image/png,image/*" multiple hidden></label>
      <select class="images"></select>
      <button class="remove-img">Remove image</button>
      <span>Zoom <select class="zoom"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>6</option></select></span>
      <span>Grid <select class="grid"><option>8</option><option selected>16</option><option>32</option></select></span>
      <span class="charsize">Frame <input type="number" class="cw" value="16" min="8" step="8"> × <input type="number" class="ch" value="32" min="8" step="8"></span>
      <button class="export">Export</button>
      <label class="btn">Import<input type="file" class="import" accept=".json,application/json" hidden></label>
      <button class="clear">Reset all</button>
      <button class="primary back">Back to the game</button>
    </div>
    <div class="status"></div>
    <div class="roles"></div>
    <div class="sheet"><div class="target"></div><div class="wrap"><canvas></canvas></div></div>`;
  document.body.append(root);

  const $ = <T extends Element>(s: string) => root.querySelector(s) as T;
  const list = $<HTMLDivElement>('.roles');
  const sheet = $<HTMLCanvasElement>('.sheet canvas');
  const select = $<HTMLSelectElement>('.images');
  const status = $<HTMLDivElement>('.status');
  const targetLine = $<HTMLDivElement>('.target');
  const say = (s: string) => (status.textContent = s);

  async function persist() {
    if (!(await saveCustom(data))) say("Couldn't save: this browser blocks storage for this page.");
  }

  function loadImage(name: string, blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = URL.createObjectURL(blob);
      imgs.set(name, img);
    });
  }

  function preview(c: HTMLCanvasElement, p: Pick | null | undefined) {
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    const img = p && imgs.get(p.img);
    if (!p || !img) return;
    const s = Math.min(c.width / p.w, c.height / p.h);
    ctx.drawImage(img, p.x, p.y, p.w, p.h, (c.width - p.w * s) / 2, (c.height - p.h * s) / 2, p.w * s, p.h * s);
  }

  function renderList() {
    list.innerHTML = '';
    let group = '';
    for (const role of ROLES) {
      if (role.group !== group) {
        group = role.group;
        list.insertAdjacentHTML('beforeend', `<h2>${group}</h2>`);
      }
      const sel = target.kind === 'role' && target.role.key === role.key;
      list.append(row(role.label, data.config.picks[role.key], sel, () => {
        target = { kind: 'role', role };
        refresh();
      }, () => {
        delete data.config.picks[role.key];
        void persist();
        refresh();
      }));
    }
    list.insertAdjacentHTML('beforeend', '<h2>Characters</h2>');
    for (const { look, label } of CHARACTERS) {
      const frames = data.config.chars[look] ?? [];
      const sel = target.kind === 'char' && target.look === look;
      list.append(row(label, frames.find((f) => f), sel, () => {
        target = { kind: 'char', look, slot: 0 };
        refresh();
      }, () => {
        delete data.config.chars[look];
        void persist();
        refresh();
      }));
      if (sel && target.kind === 'char') {
        const slots = document.createElement('div');
        slots.className = 'slots';
        FRAME_NAMES.forEach((name, i) => {
          const s = document.createElement('div');
          s.className = 'slot' + (target.kind === 'char' && target.slot === i ? ' sel' : '');
          const c = document.createElement('canvas');
          c.width = 32;
          c.height = 48;
          preview(c, frames[i]);
          s.append(c, name);
          s.onclick = () => {
            target = { kind: 'char', look, slot: i };
            refresh();
          };
          slots.append(s);
        });
        list.append(slots);
      }
    }
  }

  function row(label: string, pick: Pick | null | undefined, sel: boolean, onPick: () => void, onClear: () => void) {
    const r = document.createElement('div');
    r.className = 'row' + (sel ? ' sel' : '');
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    preview(c, pick);
    const span = document.createElement('span');
    span.textContent = label + (pick ? '' : ' (built-in)');
    r.append(c, span);
    if (pick) {
      const x = document.createElement('button');
      x.className = 'x';
      x.textContent = '✕';
      x.title = 'Use the built-in art again';
      x.onclick = (e) => {
        e.stopPropagation();
        onClear();
      };
      r.append(x);
    }
    r.onclick = onPick;
    return r;
  }

  function currentPick(): Pick | null | undefined {
    return target.kind === 'role' ? data.config.picks[target.role.key] : data.config.chars[target.look]?.[target.slot];
  }

  function renderSheet() {
    const img = imgs.get(current);
    const ctx = sheet.getContext('2d')!;
    if (!img) {
      sheet.width = 320;
      sheet.height = 80;
      ctx.fillStyle = '#8898a8';
      ctx.font = '14px system-ui';
      ctx.fillText('Add a sprite sheet to start.', 16, 44);
      return;
    }
    sheet.width = img.naturalWidth * zoom;
    sheet.height = img.naturalHeight * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, sheet.width, sheet.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= img.naturalWidth; x += grid) ctx.moveTo(x * zoom + 0.5, 0), ctx.lineTo(x * zoom + 0.5, sheet.height);
    for (let y = 0; y <= img.naturalHeight; y += grid) ctx.moveTo(0, y * zoom + 0.5), ctx.lineTo(sheet.width, y * zoom + 0.5);
    ctx.stroke();
    const box = (p: { x: number; y: number; w: number; h: number }, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x * zoom + 1, p.y * zoom + 1, p.w * zoom - 2, p.h * zoom - 2);
    };
    const p = currentPick();
    if (p && p.img === current) box(p, '#5fe0b0');
    if (drag) box(dragRect(drag), '#f8d048');
  }

  function refresh() {
    renderList();
    renderSheet();
    const charOnly = target.kind === 'char';
    $<HTMLSpanElement>('.charsize').style.display = charOnly ? '' : 'none';
    if (target.kind === 'role') {
      const r = target.role;
      targetLine.textContent = `Now picking: ${r.label}` + (r.w > 16 || r.h > 16 ? ` (drag a box; it is shown at ${r.w}×${r.h} pixels)` : ' (click a 16×16 tile)');
    } else {
      const c = CHARACTERS.find((x) => x.look === (target as { look: string }).look)!;
      targetLine.textContent = `Now picking: ${c.label}, ${FRAME_NAMES[target.slot]} (click a ${charW}×${charH} frame; right uses left, mirrored)`;
    }
  }

  function renderImages() {
    select.innerHTML = '';
    for (const name of Object.keys(data.images)) select.add(new Option(name, name, false, name === current));
    if (!data.images[current]) current = Object.keys(data.images)[0] ?? '';
    select.value = current;
  }

  const cellAt = (e: MouseEvent) => {
    const r = sheet.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * sheet.width / zoom;
    const py = ((e.clientY - r.top) / r.height) * sheet.height / zoom;
    return { x: Math.floor(px / grid) * grid, y: Math.floor(py / grid) * grid };
  };
  const dragRect = (d: { x0: number; y0: number; x1: number; y1: number }) => ({
    x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0) + grid, h: Math.abs(d.y1 - d.y0) + grid,
  });
  const bigTarget = () => target.kind === 'role' && (target.role.w > 16 || target.role.h > 16);

  sheet.onmousedown = (e) => {
    if (!imgs.get(current)) return;
    const c = cellAt(e);
    if (bigTarget()) {
      drag = { x0: c.x, y0: c.y, x1: c.x, y1: c.y };
      renderSheet();
      return;
    }
    if (target.kind === 'role') {
      data.config.picks[target.role.key] = { img: current, x: c.x, y: c.y, w: 16, h: 16 };
      say(`${target.role.label} set.`);
    } else {
      const frames = (data.config.chars[target.look] ??= Array(9).fill(null));
      frames[target.slot] = { img: current, x: c.x, y: c.y, w: charW, h: charH };
      say(`${FRAME_NAMES[target.slot]} set.`);
      if (target.slot < 8) target = { ...target, slot: target.slot + 1 };
    }
    void persist();
    refresh();
  };
  sheet.onmousemove = (e) => {
    if (!drag) return;
    const c = cellAt(e);
    drag.x1 = c.x;
    drag.y1 = c.y;
    renderSheet();
  };
  window.addEventListener('mouseup', () => {
    if (!drag || target.kind !== 'role') return;
    data.config.picks[target.role.key] = { img: current, ...dragRect(drag) };
    say(`${target.role.label} set.`);
    drag = null;
    void persist();
    refresh();
  });

  $<HTMLInputElement>('input[type=file]').onchange = async (e) => {
    const files = [...((e.target as HTMLInputElement).files ?? [])];
    for (const f of files) {
      data.images[f.name] = f;
      await loadImage(f.name, f);
      current = f.name;
    }
    await persist();
    renderImages();
    refresh();
    say(`Added ${files.length} image${files.length === 1 ? '' : 's'}.`);
  };
  select.onchange = () => {
    current = select.value;
    renderSheet();
  };
  $<HTMLButtonElement>('.remove-img').onclick = async () => {
    if (!current || !confirm(`Remove ${current} and everything picked from it?`)) return;
    delete data.images[current];
    for (const [k, p] of Object.entries(data.config.picks)) if (p.img === current) delete data.config.picks[k];
    for (const frames of Object.values(data.config.chars)) frames.forEach((f, i) => f?.img === current && (frames[i] = null));
    imgs.delete(current);
    current = '';
    await persist();
    renderImages();
    refresh();
  };
  $<HTMLSelectElement>('.zoom').onchange = (e) => {
    zoom = +(e.target as HTMLSelectElement).value;
    renderSheet();
  };
  $<HTMLSelectElement>('.grid').onchange = (e) => {
    grid = +(e.target as HTMLSelectElement).value;
    renderSheet();
  };
  $<HTMLInputElement>('.cw').onchange = (e) => (charW = Math.max(8, +(e.target as HTMLInputElement).value || 16));
  $<HTMLInputElement>('.ch').onchange = (e) => (charH = Math.max(8, +(e.target as HTMLInputElement).value || 32));

  $<HTMLButtonElement>('.export').onclick = async () => {
    const used = usedImages(data.config);
    const images: Record<string, string> = {};
    for (const name of used) {
      const blob = data.images[name];
      if (blob) images[name] = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(blob);
      });
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ config: data.config, images })], { type: 'application/json' }));
    a.download = 'beryl-graphics.json';
    a.click();
    say('Exported beryl-graphics.json. Import it on another device to use the same graphics.');
  };
  $<HTMLInputElement>('.import').onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { config: CustomData['config']; images: Record<string, string> };
      data.config = { picks: parsed.config.picks ?? {}, chars: parsed.config.chars ?? {} };
      data.images = {};
      for (const [name, url] of Object.entries(parsed.images)) {
        data.images[name] = await (await fetch(url)).blob();
        await loadImage(name, data.images[name]);
      }
      current = Object.keys(data.images)[0] ?? '';
      await persist();
      renderImages();
      refresh();
      say('Imported.');
    } catch {
      say("That file doesn't look like an exported graphics file.");
    }
  };
  $<HTMLButtonElement>('.clear').onclick = async () => {
    if (!confirm('Remove all custom graphics and go back to the built-in art?')) return;
    Object.assign(data, emptyData());
    imgs.clear();
    current = '';
    await persist();
    renderImages();
    refresh();
  };
  $<HTMLButtonElement>('.back').onclick = () => {
    location.hash = '';
    location.reload();
  };

  for (const [name, blob] of Object.entries(data.images)) await loadImage(name, blob);
  current = Object.keys(data.images)[0] ?? '';
  renderImages();
  refresh();
}

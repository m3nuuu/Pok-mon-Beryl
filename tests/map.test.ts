import { describe, expect, it } from 'vitest';
import { BUILDINGS, MAP_H, MAP_W, NPCS, SIGNS, STILLBROOK_ROWS, isSolidTile, tileAt } from '../src/data/stillbrook';
import { START_POSITION } from '../src/state';

describe('Stillbrook map', () => {
  it('is rectangular', () => {
    for (const row of STILLBROOK_ROWS) expect(row.length).toBe(MAP_W);
  });

  it('places buildings on B tiles with a reachable door', () => {
    for (const b of BUILDINGS) {
      for (let y = b.y; y < b.y + b.h; y++)
        for (let x = b.x; x < b.x + b.w; x++) expect(tileAt(x, y), `${b.id} ${x},${y}`).toBe('B');
      expect(isSolidTile(tileAt(b.door.x, b.door.y + 1))).toBe(false);
    }
  });

  it('has signs where the text is', () => {
    for (const key of Object.keys(SIGNS)) {
      const [x, y] = key.split(',').map(Number);
      expect(tileAt(x, y)).toBe('S');
    }
  });

  it('puts NPCs and the player on walkable tiles', () => {
    for (const n of NPCS) expect(isSolidTile(tileAt(n.x, n.y)), n.id).toBe(false);
    expect(isSolidTile(tileAt(START_POSITION.x, START_POSITION.y))).toBe(false);
  });

  it('lets the player reach every NPC and the tall grass', () => {
    const seen = new Set<string>();
    const queue = [[START_POSITION.x, START_POSITION.y]];
    const npc = new Set(NPCS.map((n) => `${n.x},${n.y}`));
    while (queue.length) {
      const [x, y] = queue.pop()!;
      const k = `${x},${y}`;
      if (seen.has(k)) continue;
      seen.add(k);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
        if (isSolidTile(tileAt(nx, ny)) || npc.has(`${nx},${ny}`)) continue;
        queue.push([nx, ny]);
      }
    }
    for (const n of NPCS) {
      const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${n.x + dx},${n.y + dy}`));
      expect(adj, n.id).toBe(true);
    }
    expect([...seen].some((k) => { const [x, y] = k.split(',').map(Number); return tileAt(x, y) === ','; })).toBe(true);
  });
});

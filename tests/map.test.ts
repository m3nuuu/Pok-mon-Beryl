import { describe, expect, it } from 'vitest';
import { MAPS, isSolidTile, tileAt, type MapDef } from '../src/data/maps';
import { HOME_DOOR, START_POSITION } from '../src/state';

const all = Object.values(MAPS);
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function reachable(map: MapDef, x: number, y: number): Set<string> {
  const seen = new Set<string>();
  const queue = [[x, y]];
  while (queue.length) {
    const [cx, cy] = queue.pop()!;
    const k = `${cx},${cy}`;
    if (seen.has(k)) continue;
    seen.add(k);
    for (const [dx, dy] of STEPS) if (!isSolidTile(tileAt(map, cx + dx, cy + dy))) queue.push([cx + dx, cy + dy]);
  }
  return seen;
}

describe.each(all.map((m) => [m.id, m] as const))('%s map', (_, map) => {
  it('is rectangular', () => {
    for (const row of map.rows) expect(row.length).toBe(map.rows[0].length);
  });

  it('places buildings on B tiles with a door', () => {
    for (const b of map.buildings) {
      for (let y = b.y; y < b.y + b.h; y++)
        for (let x = b.x; x < b.x + b.w; x++) {
          const isDoor = x === b.door.x && y === b.door.y;
          expect(tileAt(map, x, y), `${b.id} ${x},${y}`).toBe(isDoor ? 'D' : 'B');
        }
    }
  });

  it('has warps on doors or mats that land on walkable tiles', () => {
    for (const w of map.warps) {
      expect(['D', 'X']).toContain(tileAt(map, w.x, w.y));
      const target = MAPS[w.to];
      expect(isSolidTile(tileAt(target, w.tx, w.ty)), `${w.to} ${w.tx},${w.ty}`).toBe(false);
      expect(target.warps.some((back) => back.to === map.id), `${w.to} leads back`).toBe(true);
    }
  });

  it('puts every NPC where the player can talk to it', () => {
    const entry = map.warps.length ? map.warps.map((w) => MAPS[w.to].warps.find((b) => b.to === map.id)!) : [];
    const starts = entry.map((w) => [w.tx, w.ty]);
    const seen = new Set<string>();
    for (const [x, y] of starts) for (const k of reachable(map, x, y)) seen.add(k);
    for (const w of map.warps) expect(seen.has(`${w.x},${w.y}`), `warp ${w.x},${w.y}`).toBe(true);
    // Pokémon behind fences are looked at over the fence instead.
    for (const n of map.npcs.filter((n) => !n.look.startsWith('mon-'))) {
      expect(isSolidTile(tileAt(map, n.x, n.y)), n.id).toBe(false);
      expect(STEPS.some(([dx, dy]) => seen.has(`${n.x + dx},${n.y + dy}`)), n.id).toBe(true);
    }
  });
});

describe('world', () => {
  it('starts and respawns on walkable tiles', () => {
    for (const p of [START_POSITION, HOME_DOOR]) expect(isSolidTile(tileAt(MAPS[p.map], p.x, p.y))).toBe(false);
  });

  it('lets the player reach the tall grass in Stillbrook', () => {
    const seen = reachable(MAPS.stillbrook, HOME_DOOR.x, HOME_DOOR.y);
    expect([...seen].some((k) => { const [x, y] = k.split(',').map(Number); return tileAt(MAPS.stillbrook, x, y) === ','; })).toBe(true);
  });
});

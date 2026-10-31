import { describe, expect, it } from 'vitest';
import { MAPS, arrival, isSolidTile, isWarpTile, tileAt, width, type Exit, type MapDef } from '../src/data/maps';
import { ITEMS } from '../src/data/items';
import { MOVES } from '../src/data/moves';
import { SPECIES } from '../src/data/species';
import { HOME_DOOR, START_POSITION } from '../src/state';

const all = Object.values(MAPS);
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function reachable(map: MapDef, starts: [number, number][]): Set<string> {
  const seen = new Set<string>();
  const queue = [...starts];
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < width(map) && y < map.rows.length;
  while (queue.length) {
    const [cx, cy] = queue.pop()!;
    const k = `${cx},${cy}`;
    if (seen.has(k)) continue;
    seen.add(k);
    for (const [dx, dy] of STEPS) {
      const nx = cx + dx, ny = cy + dy;
      if (inside(nx, ny) && !isSolidTile(tileAt(map, nx, ny))) queue.push([nx, ny]);
    }
  }
  return seen;
}

function edgeTiles(map: MapDef, e: Exit): [number, number][] {
  const out: [number, number][] = [];
  for (let c = e.from; c <= e.to; c++) {
    if (e.side === 'north') out.push([c, 0]);
    if (e.side === 'south') out.push([c, map.rows.length - 1]);
    if (e.side === 'west') out.push([0, c]);
    if (e.side === 'east') out.push([width(map) - 1, c]);
  }
  return out;
}

/** Every tile the player can arrive on from another map. */
function entries(map: MapDef): [number, number][] {
  const out: [number, number][] = [];
  for (const m of all) {
    for (const w of m.warps) if (w.to === map.id) out.push([w.tx, w.ty]);
    for (const e of m.exits ?? []) {
      if (e.map !== map.id) continue;
      for (let c = e.from; c <= e.to; c++) {
        const a = arrival(e, c, MAPS);
        out.push([a.tx, a.ty]);
      }
    }
  }
  if (map.id === START_POSITION.map) out.push([START_POSITION.x, START_POSITION.y]);
  return out;
}

const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' } as const;

describe.each(all.map((m) => [m.id, m] as const))('%s map', (_, map) => {
  it('is rectangular', () => {
    for (const [i, row] of map.rows.entries()) expect(row.length, `row ${i}`).toBe(map.rows[0].length);
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

  it('has warps on doors, mats or caves that land on walkable tiles and lead back', () => {
    for (const w of map.warps) {
      expect(isWarpTile(tileAt(map, w.x, w.y)), `warp tile ${w.x},${w.y}`).toBe(true);
      const target = MAPS[w.to];
      expect(target, w.to).toBeDefined();
      expect(isSolidTile(tileAt(target, w.tx, w.ty)), `${w.to} ${w.tx},${w.ty}`).toBe(false);
      expect(isWarpTile(tileAt(target, w.tx, w.ty)), `${w.to} ${w.tx},${w.ty} is not a warp`).toBe(false);
      expect(target.warps.some((back) => back.to === map.id), `${w.to} leads back`).toBe(true);
    }
  });

  it('has edge exits that line up with the neighbouring map', () => {
    for (const e of map.exits ?? []) {
      const target = MAPS[e.map];
      expect(target, e.map).toBeDefined();
      for (const [x, y] of edgeTiles(map, e)) {
        expect(isSolidTile(tileAt(map, x, y)), `${map.id} edge ${x},${y}`).toBe(false);
        const along = e.side === 'north' || e.side === 'south' ? x : y;
        const a = arrival(e, along, MAPS);
        expect(isSolidTile(tileAt(target, a.tx, a.ty)), `${e.map} arrival ${a.tx},${a.ty}`).toBe(false);
        const back = target.exits?.find((b) => b.side === OPPOSITE[e.side] && b.map === map.id
          && along + e.offset >= b.from && along + e.offset <= b.to);
        expect(back, `${e.map} exit back to ${map.id}`).toBeDefined();
        expect(back!.offset + e.offset).toBe(0);
      }
    }
  });

  it('lets the player reach every warp, exit and NPC', () => {
    const seen = reachable(map, entries(map));
    expect(seen.size).toBeGreaterThan(0);
    for (const w of map.warps) expect(seen.has(`${w.x},${w.y}`), `warp ${w.x},${w.y}`).toBe(true);
    for (const e of map.exits ?? []) for (const [x, y] of edgeTiles(map, e)) expect(seen.has(`${x},${y}`), `exit ${x},${y}`).toBe(true);
    // Pokémon behind fences or in water are looked at from next to them instead.
    for (const n of map.npcs.filter((n) => !n.id.startsWith('deco'))) {
      if (!n.look.startsWith('mon-')) expect(isSolidTile(tileAt(map, n.x, n.y)), `${n.id} stands on a solid tile`).toBe(false);
      // Nurses and clerks are talked to across their counter.
      const talkable = STEPS.some(([dx, dy]) => seen.has(`${n.x + dx},${n.y + dy}`)
        || (tileAt(map, n.x + dx, n.y + dy) === 'r' && seen.has(`${n.x + 2 * dx},${n.y + 2 * dy}`)));
      expect(talkable, `${n.id} at ${n.x},${n.y}`).toBe(true);
    }
  });

  it('only uses known species, moves and items', () => {
    for (const [s] of [...(map.encounters ?? []), ...(map.fishing ?? []), ...(map.zones ?? []).flatMap((z) => z.encounters)]) {
      expect(SPECIES[s], s).toBeDefined();
    }
    for (const n of map.npcs) {
      if (n.item) expect(ITEMS[n.item.id], n.item.id).toBeDefined();
      if (n.look.startsWith('mon-')) expect(SPECIES[n.look.slice(4)], n.look).toBeDefined();
      for (const m of n.trainer?.team ?? []) {
        expect(SPECIES[m.species], m.species).toBeDefined();
        for (const id of m.moves ?? []) expect(MOVES[id], id).toBeDefined();
      }
    }
  });
});

describe('world', () => {
  it('starts and respawns on walkable tiles', () => {
    for (const p of [START_POSITION, HOME_DOOR]) expect(isSolidTile(tileAt(MAPS[p.map], p.x, p.y))).toBe(false);
  });

  it('connects every map to Stillbrook', () => {
    const seen = new Set<string>(['stillbrook']);
    const queue = ['stillbrook'];
    while (queue.length) {
      const m = MAPS[queue.pop()!];
      const next = [...m.warps.map((w) => w.to), ...(m.exits ?? []).map((e) => e.map)];
      for (const id of next) if (!seen.has(id)) { seen.add(id); queue.push(id); }
    }
    expect(all.filter((m) => !seen.has(m.id)).map((m) => m.id)).toEqual([]);
  });

  it('gives every town a Pokémon Center and a gym', () => {
    for (const town of ['lanterncross', 'reedmouth', 'valecrown', 'weirhaven', 'cragmoor', 'pinehollow', 'frostspring']) {
      expect(MAPS[`center_${town}`], town).toBeDefined();
      expect(MAPS[`gym_${town}`], town).toBeDefined();
    }
    expect(MAPS.gym_stillbrook).toBeDefined();
  });
});

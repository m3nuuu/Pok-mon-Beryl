// Every map in Kaldria, by id. Types and helpers live in mapkit.ts.
import { registry, type MapDef, type MapId } from './mapkit';
import { LEAGUE } from './world/league';
import { NORTH } from './world/north';
import { SOUTH } from './world/south';

for (const m of [...SOUTH, ...NORTH, ...LEAGUE]) {
  if (registry[m.id]) throw new Error(`Duplicate map id ${m.id}`);
  registry[m.id] = m;
}

export const MAPS: Record<MapId, MapDef> = registry;

export * from './mapkit';

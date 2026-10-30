// Every piece of art the game draws that a custom image can replace.
import { MAPS } from '../data/maps';

export interface Role {
  /** Texture key in the game. */
  key: string;
  label: string;
  group: 'Outdoor tiles' | 'Indoor tiles' | 'Buildings' | 'Battle backgrounds';
  w: number;
  h: number;
  /** Drawn on top of this tile, so transparent parts of the pick show ground instead of black. */
  base?: string;
}

const tile = (key: string, label: string, group: Role['group'], base?: string): Role => ({ key, label, group, w: 16, h: 16, base });
const out = (key: string, label: string, onGrass = true) => tile(key, label, 'Outdoor tiles', onGrass ? 't-grass' : undefined);
const ind = (key: string, label: string, onFloor = true) => tile(key, label, 'Indoor tiles', onFloor ? 'i-floor' : undefined);

const BUILDING_NAMES: Record<string, string> = {
  home: "Beryl's house", jasper: "Jasper's house", gym: 'Gym', neighbor: "Hazel's house",
};

// Order matters: ground tiles come first so later tiles can be drawn on top of them.
export const ROLES: Role[] = [
  out('t-grass', 'Grass', false),
  out('t-tall', 'Tall grass'),
  out('t-tall-top', 'Tall grass, front part (covers the legs)', false),
  out('t-path', 'Path'),
  out('t-flowers', 'Flowers'),
  out('t-tree', 'Tree'),
  out('t-water0', 'River water', false),
  out('t-water1', 'River water, 2nd frame', false),
  out('t-spill0', 'Dam spillway', false),
  out('t-spill1', 'Dam spillway, 2nd frame', false),
  out('t-dam', 'Dam wall', false),
  out('t-damtop', 'Dam wall, top edge', false),
  out('t-damdoor', 'Dam door', false),
  out('t-bridge', 'Bridge'),
  out('t-dock', 'Ferry dock'),
  out('t-fence', 'Fence'),
  out('t-sign', 'Sign'),
  ind('i-floor', 'Floor', false),
  ind('i-wall', 'Wall', false),
  ind('i-void', 'Outside the room (dark)', false),
  ind('i-window', 'Window', false),
  ind('i-shelf', 'Shelf with Lethys toy', false),
  ind('i-books', 'Bookshelf'),
  ind('i-bedtop', 'Bed, top half'),
  ind('i-bedbot', 'Bed, bottom half'),
  ind('i-table', 'Table (any part)'),
  ind('i-counter', 'Kitchen counter'),
  ind('i-plant', 'Plant'),
  ind('i-tv', 'TV'),
  ind('i-pen', 'Pen fence'),
  ind('i-mat', 'Exit mat'),
  ...MAPS.stillbrook.buildings.map((b): Role => ({
    key: `b-${b.id}`, label: BUILDING_NAMES[b.id] ?? b.id, group: 'Buildings', w: b.w * 16, h: b.h * 16,
  })),
  { key: 'battle-plain', label: 'Field', group: 'Battle backgrounds', w: 240, h: 112 },
  { key: 'battle-water', label: 'River', group: 'Battle backgrounds', w: 240, h: 112 },
];

/** Characters use the same nine frames: three per direction (standing, step, other step). */
export const CHARACTERS: { look: string; label: string }[] = [
  { look: 'beryl', label: 'Beryl (you)' },
  { look: 'jasper', label: 'Jasper' },
  { look: 'spruce', label: 'Prof. Spruce' },
  { look: 'mum', label: 'Mum' },
  { look: 'dad', label: 'Dad' },
  { look: 'grandma', label: 'Grandma' },
  { look: 'jasperDad', label: "Jasper's dad" },
  { look: 'jasperMom', label: "Jasper's mum" },
  { look: 'guard', label: 'Bram (dam guard)' },
  { look: 'fisher', label: 'Otto (fisher)' },
  { look: 'neighbor', label: 'Hazel' },
  { look: 'ferry', label: 'Greta (ferry keeper)' },
  { look: 'homemon', label: 'Family Pokémon' },
];

export const FRAME_NAMES = [
  'Down, standing', 'Down, step 1', 'Down, step 2',
  'Up, standing', 'Up, step 1', 'Up, step 2',
  'Left, standing', 'Left, step 1', 'Left, step 2',
];

import type { Type } from './types';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface SpeciesData {
  id: string;
  dex: string;
  name: string;
  types: Type[];
  base: BaseStats;
  /** Base EXP yield when defeated. */
  expYield: number;
  /** [level, moveId] pairs, learned on reaching that level. */
  learnset: [number, string][];
  /** File in public/sprites. Species without one get a placeholder until Manuel draws it. */
  sprite?: string;
  evolvesTo?: { species: string; level: number };
  /** Gen III catch rate (3 to 255). Defaults to 190, a common wild Pokémon. */
  catchRate?: number;
}

// Names and types follow the Pokédex doc. Base stats are first-pass numbers for the prototype.
const list: SpeciesData[] = [
  {
    id: 'mossfawn', dex: '001', name: 'Mossfawn', types: ['Grass'], catchRate: 45,
    base: { hp: 45, atk: 58, def: 50, spa: 42, spd: 52, spe: 55 }, expYield: 62,
    learnset: [[1, 'tackle'], [1, 'growl'], [5, 'leafage'], [9, 'rockthrow'], [13, 'absorb'], [17, 'razorleaf'], [21, 'stunspore'], [26, 'megadrain']],
    sprite: '001.png', evolvesTo: { species: 'mossbuck', level: 16 },
  },
  {
    id: 'mossbuck', dex: '002', name: 'Mossbuck', types: ['Grass'], catchRate: 45,
    base: { hp: 60, atk: 75, def: 65, spa: 55, spd: 65, spe: 65 }, expYield: 142,
    learnset: [[1, 'tackle'], [1, 'leafage'], [16, 'razorleaf'], [20, 'rocktomb'], [24, 'megadrain'], [29, 'growth'], [33, 'bite'], [38, 'gigadrain']],
    sprite: '002.png', evolvesTo: { species: 'mosshart', level: 36 },
  },
  {
    id: 'mosshart', dex: '003', name: 'Mosshart', types: ['Grass', 'Dark'], catchRate: 45,
    base: { hp: 80, atk: 105, def: 80, spa: 70, spd: 80, spe: 85 }, expYield: 236,
    learnset: [[1, 'razorleaf'], [1, 'rocktomb'], [36, 'nightslash'], [40, 'gigadrain'], [45, 'crunch'], [50, 'leafblade'], [56, 'swordsdance'], [62, 'stoneedge']], sprite: '003.png',
  },
  {
    id: 'newtide', dex: '004', name: 'Newtide', types: ['Water'], catchRate: 45,
    base: { hp: 50, atk: 48, def: 52, spa: 54, spd: 50, spe: 48 }, expYield: 62,
    learnset: [[1, 'tackle'], [1, 'tailwhip'], [5, 'watergun'], [9, 'quickattack'], [13, 'bubble'], [17, 'bite'], [21, 'aquajet'], [26, 'bubblebeam']],
    sprite: '004.png', evolvesTo: { species: 'tidemander', level: 16 },
  },
  {
    id: 'tidemander', dex: '005', name: 'Tidemander', types: ['Water'], catchRate: 45,
    base: { hp: 65, atk: 62, def: 68, spa: 72, spd: 65, spe: 63 }, expYield: 142,
    learnset: [[1, 'tackle'], [1, 'watergun'], [16, 'bubble'], [20, 'aquajet'], [24, 'bubblebeam'], [29, 'wingattack'], [33, 'headbutt'], [38, 'surf']],
    sprite: '005.png', evolvesTo: { species: 'tidrake', level: 36 },
  },
  {
    id: 'tidrake', dex: '006', name: 'Tidrake', types: ['Water', 'Flying'], catchRate: 45,
    base: { hp: 82, atk: 80, def: 80, spa: 98, spd: 85, spe: 95 }, expYield: 236,
    learnset: [[1, 'bubblebeam'], [1, 'wingattack'], [36, 'airslash'], [40, 'surf'], [45, 'dragonbreath'], [50, 'agility'], [55, 'hydropump'], [60, 'dragonpulse']], sprite: '006.png',
  },
  {
    id: 'cindaroo', dex: '007', name: 'Cindaroo', types: ['Fire'], catchRate: 45,
    base: { hp: 44, atk: 56, def: 43, spa: 56, spd: 46, spe: 60 }, expYield: 62,
    learnset: [[1, 'scratch'], [1, 'growl'], [5, 'ember'], [9, 'quickattack'], [13, 'karatechop'], [17, 'flamewheel'], [21, 'bulkup'], [26, 'firefang']],
    sprite: '007.png', evolvesTo: { species: 'marrowroo', level: 16 },
  },
  {
    id: 'marrowroo', dex: '008', name: 'Marrowroo', types: ['Fire'], catchRate: 45,
    base: { hp: 58, atk: 72, def: 58, spa: 72, spd: 60, spe: 78 }, expYield: 142,
    learnset: [[1, 'scratch'], [1, 'ember'], [16, 'flamewheel'], [20, 'karatechop'], [24, 'firefang'], [29, 'astonish'], [33, 'brickbreak'], [38, 'flamethrower']],
    sprite: '008.png', evolvesTo: { species: 'spectaroo', level: 36 },
  },
  {
    id: 'spectaroo', dex: '009', name: 'Spectaroo', types: ['Fire', 'Ghost'], catchRate: 45,
    base: { hp: 75, atk: 95, def: 72, spa: 95, spd: 80, spe: 100 }, expYield: 236,
    learnset: [[1, 'flamewheel'], [1, 'astonish'], [36, 'shadowpunch'], [40, 'flamethrower'], [45, 'willowisp'], [50, 'shadowclaw'], [55, 'crosschop'], [60, 'shadowball']], sprite: '009.png',
  },
  {
    id: 'murkfin', dex: '010', name: 'Murkfin', types: ['Water'],
    base: { hp: 30, atk: 20, def: 50, spa: 20, spd: 40, spe: 60 }, expYield: 40,
    learnset: [[1, 'splash'], [10, 'tackle'], [15, 'bubble'], [20, 'thundershock'], [25, 'bite']], sprite: '010.png',
  },
  {
    id: 'murkeel', dex: '011', name: 'Murkeel', types: ['Water', 'Electric'],
    base: { hp: 80, atk: 85, def: 75, spa: 100, spd: 85, spe: 90 }, expYield: 189,
    learnset: [[1, 'tackle'], [1, 'watergun'], [1, 'thundershock'], [25, 'bite'], [30, 'spark'], [35, 'bubblebeam'], [40, 'crunch'], [45, 'thunderbolt'], [50, 'surf'], [55, 'hydropump']], sprite: '011.png',
  },
  {
    id: 'pipwing', dex: '012', name: 'Pipwing', types: ['Flying'],
    base: { hp: 38, atk: 45, def: 38, spa: 32, spd: 36, spe: 58 }, expYield: 50,
    learnset: [[1, 'peck'], [1, 'growl'], [8, 'quickattack'], [12, 'gust'], [16, 'wingattack']],
    sprite: '012.png', evolvesTo: { species: 'rivetwing', level: 18 },
  },
  {
    id: 'rivetwing', dex: '013', name: 'Rivetwing', types: ['Flying', 'Steel'],
    base: { hp: 55, atk: 65, def: 70, spa: 40, spd: 50, spe: 75 }, expYield: 122,
    learnset: [[1, 'peck'], [1, 'quickattack'], [18, 'wingattack'], [22, 'metalclaw'], [26, 'aerialace'], [30, 'agility'], [33, 'steelwing']],
    sprite: '013.png', evolvesTo: { species: 'jetwing', level: 34 },
  },
  {
    id: 'jetwing', dex: '014', name: 'Jetwing', types: ['Flying', 'Steel'],
    base: { hp: 70, atk: 95, def: 85, spa: 50, spd: 65, spe: 115 }, expYield: 218,
    learnset: [[1, 'wingattack'], [1, 'metalclaw'], [34, 'steelwing'], [38, 'drillpeck'], [43, 'agility'], [48, 'ironhead'], [54, 'airslash']], sprite: '014.png',
  },
  {
    id: 'caddibuzz', dex: '021', name: 'Caddibuzz', types: ['Bug'],
    base: { hp: 40, atk: 45, def: 35, spa: 30, spd: 35, spe: 65 }, expYield: 52,
    learnset: [[1, 'tackle'], [1, 'leer'], [6, 'bugbite'], [12, 'quickattack'], [17, 'rockthrow'], [21, 'harden']],
    sprite: '021.png', evolvesTo: { species: 'caddicairn', level: 22 },
  },
  {
    id: 'caddicairn', dex: '022', name: 'Caddicairn', types: ['Bug', 'Rock'],
    base: { hp: 70, atk: 95, def: 110, spa: 45, spd: 65, spe: 55 }, expYield: 158,
    learnset: [[1, 'bugbite'], [1, 'rockthrow'], [22, 'pebblecase'], [26, 'rocktomb'], [30, 'silverwind'], [35, 'rockslide'], [40, 'xscissor'], [48, 'stoneedge']],
    sprite: '022.png',
  },
  {
    id: 'hivecub', dex: '023', name: 'Hivecub', types: ['Fairy'],
    base: { hp: 50, atk: 60, def: 45, spa: 40, spd: 45, spe: 30 }, expYield: 60,
    learnset: [[1, 'tackle'], [1, 'growl'], [6, 'fairywind'], [10, 'covet'], [14, 'faketears'], [17, 'poisonsting']],
    sprite: '023.png', evolvesTo: { species: 'hivebruin', level: 18 },
  },
  {
    id: 'hivebruin', dex: '024', name: 'Hivebruin', types: ['Fairy'],
    base: { hp: 75, atk: 85, def: 65, spa: 55, spd: 60, spe: 45 }, expYield: 138,
    learnset: [[1, 'covet'], [1, 'fairywind'], [18, 'headbutt'], [22, 'swarmstrike'], [27, 'charm'], [32, 'slam'], [36, 'brickbreak']],
    sprite: '024.png', evolvesTo: { species: 'hivekeeper', level: 38 },
  },
  {
    id: 'hivekeeper', dex: '025', name: 'Hivekeeper', types: ['Fairy', 'Fighting'],
    base: { hp: 105, atk: 125, def: 90, spa: 65, spd: 85, spe: 55 }, expYield: 232,
    learnset: [[1, 'rocksmash'], [1, 'swarmstrike'], [1, 'slam'], [38, 'honeyhug'], [44, 'hammerarm'], [50, 'playrough'], [56, 'bulkup']],
    sprite: '025.png',
  },
  {
    id: 'pixling', dex: '026', name: 'Pixling', types: ['Electric'],
    base: { hp: 40, atk: 30, def: 35, spa: 60, spd: 45, spe: 55 }, expYield: 58,
    learnset: [[1, 'peck'], [1, 'growl'], [5, 'thundershock'], [11, 'quickattack'], [16, 'shockwave']],
    sprite: '026.png', evolvesTo: { species: 'pixmallard', level: 20 },
  },
  {
    id: 'pixmallard', dex: '027', name: 'Pixmallard', types: ['Electric'],
    base: { hp: 60, atk: 45, def: 55, spa: 85, spd: 65, spe: 80 }, expYield: 140,
    learnset: [[1, 'thundershock'], [1, 'shockwave'], [20, 'thunderwave'], [24, 'wingattack'], [30, 'visorbeam'], [34, 'spark']],
    sprite: '027.png', evolvesTo: { species: 'pixcygnus', level: 38 },
  },
  {
    id: 'pixcygnus', dex: '028', name: 'Pixcygnus', types: ['Electric', 'Flying'],
    base: { hp: 80, atk: 60, def: 70, spa: 115, spd: 85, spe: 110 }, expYield: 234,
    learnset: [[1, 'visorbeam'], [1, 'wingattack'], [38, 'airslash'], [42, 'agility'], [46, 'thunderbolt'], [52, 'hypervoice']], sprite: '028.png',
  },
  {
    id: 'wispjel', dex: '029', name: 'Wispjel', types: ['Ghost', 'Electric'],
    base: { hp: 55, atk: 40, def: 50, spa: 85, spd: 70, spe: 70 }, expYield: 120,
    learnset: [[1, 'astonish'], [1, 'thundershock'], [8, 'lick'], [12, 'shockwave'], [18, 'hex'], [24, 'plasmagrasp'], [32, 'shadowball']],
    sprite: '029.png', evolvesTo: { species: 'wispedusa', level: 38 },
  },
  {
    id: 'wispedusa', dex: '030', name: 'Wispedusa', types: ['Ghost', 'Electric'],
    base: { hp: 80, atk: 60, def: 75, spa: 125, spd: 105, spe: 100 }, expYield: 240,
    learnset: [[1, 'plasmagrasp'], [1, 'shadowball'], [38, 'thunderwave'], [44, 'thunderbolt'], [50, 'recover']], sprite: '030.png',
  },
  {
    id: 'lochlet', dex: '031', name: 'Lochlet', types: ['Water'],
    base: { hp: 75, atk: 55, def: 60, spa: 55, spd: 65, spe: 40 }, expYield: 110,
    learnset: [[1, 'watergun'], [1, 'growl'], [10, 'bite'], [15, 'bubble'], [20, 'ancientpower'], [25, 'bubblebeam'], [30, 'reefsong'], [36, 'icywind']],
    sprite: '031.png', evolvesTo: { species: 'lochoral', level: 42 },
  },
  {
    id: 'lochoral', dex: '032', name: 'Lochoral', types: ['Water', 'Dragon'],
    base: { hp: 120, atk: 85, def: 95, spa: 95, spd: 100, spe: 60 }, expYield: 260,
    learnset: [[1, 'reefsong'], [1, 'bite'], [42, 'dragonbreath'], [48, 'bodyslam'], [52, 'icebeam'], [55, 'surf'], [60, 'dragonpulse']],
    sprite: '032.png',
  },
  {
    id: 'raptide', dex: '033', name: 'Raptide', types: ['Rock', 'Water'],
    base: { hp: 45, atk: 90, def: 65, spa: 40, spd: 45, spe: 70 }, expYield: 119,
    learnset: [[1, 'scratch'], [1, 'leer'], [7, 'watergun'], [13, 'rockthrow'], [19, 'quickattack'], [25, 'aquajet'], [31, 'gemlash'], [36, 'bite']],
    sprite: '033.png', evolvesTo: { species: 'raptorrent', level: 40 },
  },
  {
    id: 'raptorrent', dex: '034', name: 'Raptorrent', types: ['Rock', 'Water'],
    base: { hp: 65, atk: 125, def: 90, spa: 60, spd: 70, spe: 90 }, expYield: 201,
    learnset: [[1, 'gemlash'], [1, 'quickattack'], [40, 'slash'], [46, 'waterfall'], [52, 'rockslide'], [58, 'stoneedge']],
    sprite: '034.png',
  },
  {
    id: 'geodling', dex: '035', name: 'Geodling', types: ['Rock'],
    base: { hp: 60, atk: 50, def: 85, spa: 70, spd: 55, spe: 35 }, expYield: 119,
    learnset: [[1, 'tackle'], [1, 'leer'], [7, 'rockthrow'], [13, 'twister'], [19, 'ancientpower'], [25, 'harden'], [31, 'powergem'], [36, 'dragonbreath']],
    sprite: '035.png', evolvesTo: { species: 'geodragon', level: 40 },
  },
  {
    id: 'geodragon', dex: '036', name: 'Geodragon', types: ['Rock', 'Dragon'],
    base: { hp: 85, atk: 70, def: 105, spa: 115, spd: 75, spe: 45 }, expYield: 199,
    learnset: [[1, 'powergem'], [1, 'twister'], [40, 'dragonbreath'], [46, 'dragonclaw'], [52, 'geodeburst'], [58, 'dragonpulse']],
    sprite: '036.png',
  },
  {
    // Placeholder for the family Pokémon's line until Manuel designs it.
    id: 'shellet', dex: 'F01', name: 'Shellet', types: ['Rock', 'Grass'], catchRate: 45,
    base: { hp: 85, atk: 90, def: 105, spa: 70, spd: 85, spe: 60 }, expYield: 180,
    learnset: [[1, 'tackle'], [1, 'harden'], [1, 'absorb'], [8, 'rockthrow'], [14, 'megadrain'], [20, 'rocktomb'], [26, 'headbutt'], [32, 'gigadrain'], [38, 'rockslide'], [44, 'leafblade'], [50, 'stoneedge']],
  },
  {
    id: 'lethys', dex: 'L01', name: 'Lethys', types: ['Water', 'Ghost'], catchRate: 3,
    base: { hp: 105, atk: 80, def: 95, spa: 120, spd: 110, spe: 90 }, expYield: 300,
    learnset: [[1, 'watergun'], [1, 'astonish'], [30, 'shadowball'], [40, 'surf'], [50, 'memorytide'], [60, 'recover'], [70, 'hydropump']], sprite: 'lethys.png',
  },
];

export const SPECIES: Record<string, SpeciesData> = Object.fromEntries(list.map((s) => [s.id, s]));
export const SPECIES_LIST = list;
export const STARTERS = ['mossfawn', 'newtide', 'cindaroo'] as const;

/** Pokédex category and entry. */
export const DEX_ENTRIES: Record<string, { kind: string; text: string }> = {
  mossfawn: { kind: 'SEEDLING', text: 'A fawn with moss growing on its back. It naps in sunny riverside meadows and wakes when the dew falls.' },
  mossbuck: { kind: 'SEEDLING', text: 'Its antlers sprout small ferns. It guards the young of its herd and stamps the ground when a storm comes.' },
  mosshart: { kind: 'OLDWOOD', text: 'An ancient stag whose antlers are tangled with roots. Old stories say it walks the woods at night.' },
  newtide: { kind: 'RIVER NEWT', text: 'It plays in the shallows below the dam. The tip of its tail glows when the current is strong.' },
  tidemander: { kind: 'RIVER NEWT', text: 'It swims against the current for hours to build strength. Small fins have begun to grow on its back.' },
  tidrake: { kind: 'TIDE DRAKE', text: 'It glides over the reservoir on wide fins. Fishers say it can smell a storm a day away.' },
  cindaroo: { kind: 'EMBER ROO', text: 'It kicks sparks from its feet when it hops. It loves to spar and never sulks after losing.' },
  marrowroo: { kind: 'EMBER ROO', text: 'It boxes with flaming fists. The fire in its pouch keeps its young warm through the winter.' },
  spectaroo: { kind: 'WISP ROO', text: 'Its flames burn pale blue. It is said to guide lost souls back to the river at night.' },
  murkfin: { kind: 'MUDFISH', text: 'A weak fish that splashes about in murky water. Fishers throw it back, but it never gives up.' },
  murkeel: { kind: 'STORM EEL', text: 'Murkfin that grew up in the wild current below the dam. It stuns prey with electric shocks.' },
  pipwing: { kind: 'SPARROW', text: 'A noisy little bird that follows travellers along the river roads, hoping for crumbs.' },
  rivetwing: { kind: 'STEELBIRD', text: 'Its feathers harden like metal plates. It nests on the dam wall and the power line towers.' },
  jetwing: { kind: 'JET BIRD', text: 'It dives faster than anything in the sky. Its steel wings whistle loud enough to hear in the valley.' },
  caddibuzz: { kind: 'RIVER FLY', text: 'Its larvae build cases out of river pebbles. It buzzes over the water at dusk in great swarms.' },
  caddicairn: { kind: 'CAIRN FLY', text: 'It glues river pebbles onto its shell with silk. The shell grows heavier with every year it lives.' },
  hivecub: { kind: 'HONEY CUB', text: 'It carries a tiny beehive on its head. The bees inside are its friends and protect it from danger.' },
  hivebruin: { kind: 'HONEY BEAR', text: 'It hugs a chunk of hive to its chest. A sweet smell drifts behind it wherever it goes.' },
  hivekeeper: { kind: 'HIVE GUARD', text: 'It wears its hive like a gauntlet. It is gentle with friends but will punch through trees to protect them.' },
  pixling: { kind: 'VISOR DUCK', text: 'The screen on its face shows how it feels. It quacks static when it is happy.' },
  pixmallard: { kind: 'VISOR DUCK', text: 'Its visor has grown into a display that tracks prey. It reads the weather from radio waves.' },
  pixcygnus: { kind: 'LIGHT SWAN', text: 'Its wings are panels of light. On festival nights it flies over the city like a living lantern.' },
  wispjel: { kind: 'WISP JELLY', text: 'A jellyfish of glowing mist. It drifts up from the river on foggy nights and lights the water.' },
  wispedusa: { kind: 'WISP JELLY', text: 'Its plasma hands crackle with stored lightning. Divers say it watches over sunken villages.' },
  lochlet: { kind: 'LAKE BABY', text: 'A baby lake monster with one coral bud. It hides in reeds and hums softly when it is scared.' },
  lochoral: { kind: 'REEF BEAST', text: 'A living reef grows on its back. Its low song carries across the whole reservoir at night.' },
  raptide: { kind: 'FIN FOSSIL', text: 'A raptor that hunted in the ancient river. Its tail gem shines like water in the sun.' },
  raptorrent: { kind: 'RIVER HUNT', text: 'It cuts through rapids with the blade on its tail. It was the top hunter of the old Lethys.' },
  geodling: { kind: 'GEODE', text: 'Its head is a geode. When it is happy, the crystals inside start to glow purple.' },
  geodragon: { kind: 'CRYSTAL', text: 'Grey stone outside, purple crystal inside. Its wings ring like glass when it flies.' },
  shellet: { kind: 'HEARTH', text: 'A young POKéMON born from a family partner. It stays close to the people who raised it.' },
  lethys: { kind: 'RIVER SOUL', text: 'The spirit of the great river. It carries the souls of the dead to the sea, and with them the memory of the land.' },
};

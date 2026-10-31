import type { Type } from './types';

export type Category = 'physical' | 'special' | 'status';
export type StatKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type Status = 'psn' | 'brn' | 'par' | 'slp' | 'frz';

export interface MoveData {
  id: string;
  name: string;
  type: Type;
  category: Category;
  power: number;
  accuracy: number; // percent; 0 = never misses
  pp: number;
  priority?: number;
  /** Stat stage change on the target. For damaging moves it is a side effect with `chance`. */
  targetStat?: { stat: StatKey; stages: number };
  /** Stat stage changes on the user. */
  selfStat?: { stat: StatKey; stages: number }[];
  /** Inflicts a status. For damaging moves it is a side effect with `chance`. */
  status?: Status;
  /** Percent chance of the side effect (status / targetStat) on damaging moves. */
  chance?: number;
  /** User heals this fraction of the damage dealt. */
  drain?: number;
  /** User takes this fraction of the damage dealt. */
  recoil?: number;
  /** User heals this fraction of its max HP (status moves). */
  heal?: number;
  highCrit?: boolean;
}

type M = Omit<MoveData, 'id' | 'name' | 'type' | 'category' | 'power' | 'accuracy' | 'pp'>;
const mv = (id: string, name: string, type: Type, category: Category, power: number, accuracy: number, pp: number, extra: M = {}): MoveData =>
  ({ id, name, type, category, power, accuracy, pp, ...extra });
const phys = (id: string, name: string, type: Type, power: number, accuracy: number, pp: number, extra?: M) => mv(id, name, type, 'physical', power, accuracy, pp, extra);
const spec = (id: string, name: string, type: Type, power: number, accuracy: number, pp: number, extra?: M) => mv(id, name, type, 'special', power, accuracy, pp, extra);
const stat = (id: string, name: string, type: Type, accuracy: number, pp: number, extra: M) => mv(id, name, type, 'status', 0, accuracy, pp, extra);
const self = (...s: [StatKey, number][]) => s.map(([st, stages]) => ({ stat: st, stages }));

const list: MoveData[] = [
  // Normal
  phys('tackle', 'Tackle', 'Normal', 40, 100, 35),
  phys('scratch', 'Scratch', 'Normal', 40, 100, 35),
  phys('quickattack', 'Quick Attack', 'Normal', 40, 100, 30, { priority: 1 }),
  stat('growl', 'Growl', 'Normal', 100, 40, { targetStat: { stat: 'atk', stages: -1 } }),
  stat('tailwhip', 'Tail Whip', 'Normal', 100, 30, { targetStat: { stat: 'def', stages: -1 } }),
  stat('leer', 'Leer', 'Normal', 100, 30, { targetStat: { stat: 'def', stages: -1 } }),
  stat('splash', 'Splash', 'Normal', 0, 40, {}),
  phys('covet', 'Covet', 'Normal', 40, 100, 40),
  phys('slash', 'Slash', 'Normal', 70, 100, 20, { highCrit: true }),
  phys('slam', 'Slam', 'Normal', 80, 75, 20),
  phys('bodyslam', 'Body Slam', 'Normal', 85, 100, 15, { status: 'par', chance: 30 }),
  phys('headbutt', 'Headbutt', 'Normal', 70, 100, 15),
  phys('takedown', 'Take Down', 'Normal', 90, 85, 20, { recoil: 0.25 }),
  stat('screech', 'Screech', 'Normal', 85, 40, { targetStat: { stat: 'def', stages: -2 } }),
  stat('swordsdance', 'Swords Dance', 'Normal', 0, 20, { selfStat: self(['atk', 2]) }),
  stat('harden', 'Harden', 'Normal', 0, 30, { selfStat: self(['def', 1]) }),
  stat('recover', 'Recover', 'Normal', 0, 10, { heal: 0.5 }),
  stat('scaryface', 'Scary Face', 'Normal', 100, 10, { targetStat: { stat: 'spe', stages: -2 } }),
  spec('hypervoice', 'Hyper Voice', 'Normal', 90, 100, 10),
  // Fire
  spec('ember', 'Ember', 'Fire', 40, 100, 25, { status: 'brn', chance: 10 }),
  phys('flamewheel', 'Flame Wheel', 'Fire', 60, 100, 25, { status: 'brn', chance: 10 }),
  phys('firefang', 'Fire Fang', 'Fire', 65, 95, 15, { status: 'brn', chance: 10 }),
  spec('flamethrower', 'Flamethrower', 'Fire', 90, 100, 15, { status: 'brn', chance: 10 }),
  stat('willowisp', 'Will-O-Wisp', 'Fire', 85, 15, { status: 'brn' }),
  // Water
  spec('watergun', 'Water Gun', 'Water', 40, 100, 25),
  spec('bubble', 'Bubble', 'Water', 40, 100, 30, { targetStat: { stat: 'spe', stages: -1 }, chance: 10 }),
  phys('aquajet', 'Aqua Jet', 'Water', 40, 100, 20, { priority: 1 }),
  spec('bubblebeam', 'Bubble Beam', 'Water', 65, 100, 20, { targetStat: { stat: 'spe', stages: -1 }, chance: 10 }),
  spec('surf', 'Surf', 'Water', 90, 100, 15),
  phys('waterfall', 'Waterfall', 'Water', 80, 100, 15),
  spec('hydropump', 'Hydro Pump', 'Water', 110, 80, 5),
  // Electric
  spec('thundershock', 'Thunder Shock', 'Electric', 40, 100, 30, { status: 'par', chance: 10 }),
  phys('spark', 'Spark', 'Electric', 65, 100, 20, { status: 'par', chance: 30 }),
  spec('shockwave', 'Shock Wave', 'Electric', 60, 0, 20),
  spec('thunderbolt', 'Thunderbolt', 'Electric', 90, 100, 15, { status: 'par', chance: 10 }),
  stat('thunderwave', 'Thunder Wave', 'Electric', 90, 20, { status: 'par' }),
  // Grass
  phys('leafage', 'Leafage', 'Grass', 40, 100, 40),
  spec('absorb', 'Absorb', 'Grass', 20, 100, 25, { drain: 0.5 }),
  spec('megadrain', 'Mega Drain', 'Grass', 40, 100, 15, { drain: 0.5 }),
  phys('razorleaf', 'Razor Leaf', 'Grass', 55, 95, 25, { highCrit: true }),
  spec('gigadrain', 'Giga Drain', 'Grass', 75, 100, 10, { drain: 0.5 }),
  phys('leafblade', 'Leaf Blade', 'Grass', 90, 100, 15, { highCrit: true }),
  stat('sleeppowder', 'Sleep Powder', 'Grass', 75, 15, { status: 'slp' }),
  stat('stunspore', 'Stun Spore', 'Grass', 75, 30, { status: 'par' }),
  stat('growth', 'Growth', 'Grass', 0, 20, { selfStat: self(['atk', 1], ['spa', 1]) }),
  // Ice
  spec('powdersnow', 'Powder Snow', 'Ice', 40, 100, 25, { status: 'frz', chance: 10 }),
  phys('iceshard', 'Ice Shard', 'Ice', 40, 100, 30, { priority: 1 }),
  spec('icywind', 'Icy Wind', 'Ice', 55, 95, 15, { targetStat: { stat: 'spe', stages: -1 }, chance: 100 }),
  spec('aurorabeam', 'Aurora Beam', 'Ice', 65, 100, 20, { targetStat: { stat: 'atk', stages: -1 }, chance: 10 }),
  phys('icefang', 'Ice Fang', 'Ice', 65, 95, 15, { status: 'frz', chance: 10 }),
  spec('icebeam', 'Ice Beam', 'Ice', 90, 100, 10, { status: 'frz', chance: 10 }),
  // Fighting
  phys('rocksmash', 'Rock Smash', 'Fighting', 40, 100, 15, { targetStat: { stat: 'def', stages: -1 }, chance: 50 }),
  phys('karatechop', 'Karate Chop', 'Fighting', 50, 100, 25, { highCrit: true }),
  phys('brickbreak', 'Brick Break', 'Fighting', 75, 100, 15),
  phys('hammerarm', 'Hammer Arm', 'Fighting', 100, 90, 10, { selfStat: self(['spe', -1]) }),
  phys('crosschop', 'Cross Chop', 'Fighting', 100, 80, 5, { highCrit: true }),
  stat('bulkup', 'Bulk Up', 'Fighting', 0, 20, { selfStat: self(['atk', 1], ['def', 1]) }),
  // Poison
  phys('poisonsting', 'Poison Sting', 'Poison', 15, 100, 35, { status: 'psn', chance: 30 }),
  spec('sludge', 'Sludge', 'Poison', 65, 100, 20, { status: 'psn', chance: 30 }),
  stat('toxic', 'Toxic', 'Poison', 90, 10, { status: 'psn' }),
  // Ground
  spec('mudslap', 'Mud-Slap', 'Ground', 20, 100, 10),
  spec('mudshot', 'Mud Shot', 'Ground', 55, 95, 15, { targetStat: { stat: 'spe', stages: -1 }, chance: 100 }),
  phys('dig', 'Dig', 'Ground', 80, 100, 10),
  phys('earthquake', 'Earthquake', 'Ground', 100, 100, 10),
  // Flying
  phys('peck', 'Peck', 'Flying', 35, 100, 35),
  spec('gust', 'Gust', 'Flying', 40, 100, 35),
  phys('wingattack', 'Wing Attack', 'Flying', 60, 100, 35),
  phys('aerialace', 'Aerial Ace', 'Flying', 60, 0, 20),
  spec('airslash', 'Air Slash', 'Flying', 75, 95, 20),
  phys('drillpeck', 'Drill Peck', 'Flying', 80, 100, 20),
  stat('agility', 'Agility', 'Flying', 0, 30, { selfStat: self(['spe', 2]) }),
  // Psychic
  spec('confusion', 'Confusion', 'Psychic', 50, 100, 25),
  spec('psybeam', 'Psybeam', 'Psychic', 65, 100, 20),
  spec('psychic', 'Psychic', 'Psychic', 90, 100, 10, { targetStat: { stat: 'spd', stages: -1 }, chance: 10 }),
  stat('hypnosis', 'Hypnosis', 'Psychic', 60, 20, { status: 'slp' }),
  stat('calmmind', 'Calm Mind', 'Psychic', 0, 20, { selfStat: self(['spa', 1], ['spd', 1]) }),
  // Bug
  phys('bugbite', 'Bug Bite', 'Bug', 60, 100, 20),
  spec('silverwind', 'Silver Wind', 'Bug', 60, 100, 5),
  phys('xscissor', 'X-Scissor', 'Bug', 80, 100, 15),
  spec('signalbeam', 'Signal Beam', 'Bug', 75, 100, 15),
  // Rock
  phys('rockthrow', 'Rock Throw', 'Rock', 50, 90, 15),
  phys('rocktomb', 'Rock Tomb', 'Rock', 60, 95, 15, { targetStat: { stat: 'spe', stages: -1 }, chance: 100 }),
  phys('rockslide', 'Rock Slide', 'Rock', 75, 90, 10),
  spec('ancientpower', 'Ancient Power', 'Rock', 60, 100, 5),
  spec('powergem', 'Power Gem', 'Rock', 80, 100, 20),
  phys('stoneedge', 'Stone Edge', 'Rock', 100, 80, 5, { highCrit: true }),
  // Ghost
  phys('astonish', 'Astonish', 'Ghost', 30, 100, 15),
  phys('lick', 'Lick', 'Ghost', 30, 100, 30, { status: 'par', chance: 30 }),
  phys('shadowpunch', 'Shadow Punch', 'Ghost', 60, 0, 20),
  spec('hex', 'Hex', 'Ghost', 65, 100, 10),
  phys('shadowclaw', 'Shadow Claw', 'Ghost', 70, 100, 15, { highCrit: true }),
  spec('shadowball', 'Shadow Ball', 'Ghost', 80, 100, 15, { targetStat: { stat: 'spd', stages: -1 }, chance: 20 }),
  // Dragon
  spec('twister', 'Twister', 'Dragon', 40, 100, 20),
  spec('dragonbreath', 'Dragon Breath', 'Dragon', 60, 100, 20, { status: 'par', chance: 30 }),
  phys('dragonclaw', 'Dragon Claw', 'Dragon', 80, 100, 15),
  spec('dragonpulse', 'Dragon Pulse', 'Dragon', 85, 100, 10),
  stat('dragondance', 'Dragon Dance', 'Dragon', 0, 20, { selfStat: self(['atk', 1], ['spe', 1]) }),
  // Dark
  phys('bite', 'Bite', 'Dark', 60, 100, 25),
  stat('faketears', 'Fake Tears', 'Dark', 100, 20, { targetStat: { stat: 'spd', stages: -2 } }),
  phys('feintattack', 'Feint Attack', 'Dark', 60, 0, 20),
  phys('nightslash', 'Night Slash', 'Dark', 70, 100, 15, { highCrit: true }),
  phys('crunch', 'Crunch', 'Dark', 80, 100, 15, { targetStat: { stat: 'def', stages: -1 }, chance: 20 }),
  // Steel
  phys('metalclaw', 'Metal Claw', 'Steel', 50, 95, 35),
  phys('steelwing', 'Steel Wing', 'Steel', 70, 90, 25),
  phys('ironhead', 'Iron Head', 'Steel', 80, 100, 15),
  stat('irondefense', 'Iron Defense', 'Steel', 0, 15, { selfStat: self(['def', 2]) }),
  // Fairy
  stat('charm', 'Charm', 'Fairy', 100, 20, { targetStat: { stat: 'atk', stages: -2 } }),
  spec('fairywind', 'Fairy Wind', 'Fairy', 40, 100, 30),
  spec('dazzlinggleam', 'Dazzling Gleam', 'Fairy', 80, 100, 10),
  phys('playrough', 'Play Rough', 'Fairy', 90, 90, 10, { targetStat: { stat: 'atk', stages: -1 }, chance: 10 }),
  spec('moonblast', 'Moonblast', 'Fairy', 95, 100, 15, { targetStat: { stat: 'spa', stages: -1 }, chance: 30 }),
  // Signature moves from the New Pokémon Designs doc.
  phys('swarmstrike', 'Swarm Strike', 'Bug', 70, 100, 15),
  stat('pebblecase', 'Pebble Case', 'Rock', 0, 15, { selfStat: self(['def', 1], ['spd', 1]) }),
  phys('honeyhug', 'Honey Hug', 'Fairy', 80, 100, 10, { drain: 0.5 }),
  spec('visorbeam', 'Visor Beam', 'Electric', 80, 100, 15, { highCrit: true }),
  phys('plasmagrasp', 'Plasma Grasp', 'Electric', 75, 100, 15, { status: 'par', chance: 30 }),
  spec('reefsong', 'Reef Song', 'Water', 75, 100, 15, { status: 'slp', chance: 20 }),
  phys('gemlash', 'Gem Lash', 'Rock', 70, 100, 15, { highCrit: true }),
  spec('geodeburst', 'Geode Burst', 'Rock', 90, 100, 10, { selfStat: self(['def', -1]) }),
  // Lethys
  spec('memorytide', 'Memory Tide', 'Ghost', 95, 100, 10, { drain: 0.25 }),
];

export const MOVES: Record<string, MoveData> = Object.fromEntries(list.map((m) => [m.id, m]));

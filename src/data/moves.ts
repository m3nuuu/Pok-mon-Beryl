import type { Type } from './types';

export type Category = 'physical' | 'special' | 'status';
export type StatKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export interface MoveData {
  id: string;
  name: string;
  type: Type;
  category: Category;
  power: number;
  accuracy: number; // percent; 0 = never misses
  pp: number;
  priority?: number;
  /** Stat stage change applied to the target (status moves). */
  targetStat?: { stat: StatKey; stages: number };
}

const list: MoveData[] = [
  { id: 'tackle', name: 'Tackle', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
  { id: 'scratch', name: 'Scratch', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
  { id: 'quickattack', name: 'Quick Attack', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1 },
  { id: 'growl', name: 'Growl', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 40, targetStat: { stat: 'atk', stages: -1 } },
  { id: 'tailwhip', name: 'Tail Whip', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 30, targetStat: { stat: 'def', stages: -1 } },
  { id: 'leafage', name: 'Leafage', type: 'Grass', category: 'physical', power: 40, accuracy: 100, pp: 40 },
  { id: 'rockthrow', name: 'Rock Throw', type: 'Rock', category: 'physical', power: 50, accuracy: 90, pp: 15 },
  { id: 'watergun', name: 'Water Gun', type: 'Water', category: 'special', power: 40, accuracy: 100, pp: 25 },
  { id: 'ember', name: 'Ember', type: 'Fire', category: 'special', power: 40, accuracy: 100, pp: 25 },
  { id: 'peck', name: 'Peck', type: 'Flying', category: 'physical', power: 35, accuracy: 100, pp: 35 },
  { id: 'gust', name: 'Gust', type: 'Flying', category: 'special', power: 40, accuracy: 100, pp: 35 },
  { id: 'splash', name: 'Splash', type: 'Normal', category: 'status', power: 0, accuracy: 0, pp: 40 },
  { id: 'thundershock', name: 'Thunder Shock', type: 'Electric', category: 'special', power: 40, accuracy: 100, pp: 30 },
  { id: 'astonish', name: 'Astonish', type: 'Ghost', category: 'physical', power: 30, accuracy: 100, pp: 15 },
  { id: 'leer', name: 'Leer', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 30, targetStat: { stat: 'def', stages: -1 } },
  { id: 'covet', name: 'Covet', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 40 },
  { id: 'slash', name: 'Slash', type: 'Normal', category: 'physical', power: 70, accuracy: 100, pp: 20 },
  { id: 'slam', name: 'Slam', type: 'Normal', category: 'physical', power: 80, accuracy: 75, pp: 20 },
  { id: 'bodyslam', name: 'Body Slam', type: 'Normal', category: 'physical', power: 85, accuracy: 100, pp: 15 },
  { id: 'bite', name: 'Bite', type: 'Dark', category: 'physical', power: 60, accuracy: 100, pp: 25 },
  { id: 'faketears', name: 'Fake Tears', type: 'Dark', category: 'status', power: 0, accuracy: 100, pp: 20, targetStat: { stat: 'spd', stages: -2 } },
  { id: 'charm', name: 'Charm', type: 'Fairy', category: 'status', power: 0, accuracy: 100, pp: 20, targetStat: { stat: 'atk', stages: -2 } },
  { id: 'fairywind', name: 'Fairy Wind', type: 'Fairy', category: 'special', power: 40, accuracy: 100, pp: 30 },
  { id: 'playrough', name: 'Play Rough', type: 'Fairy', category: 'physical', power: 90, accuracy: 90, pp: 10 },
  { id: 'rocksmash', name: 'Rock Smash', type: 'Fighting', category: 'physical', power: 40, accuracy: 100, pp: 15 },
  { id: 'hammerarm', name: 'Hammer Arm', type: 'Fighting', category: 'physical', power: 100, accuracy: 90, pp: 10 },
  { id: 'bugbite', name: 'Bug Bite', type: 'Bug', category: 'physical', power: 60, accuracy: 100, pp: 20 },
  { id: 'silverwind', name: 'Silver Wind', type: 'Bug', category: 'special', power: 60, accuracy: 100, pp: 5 },
  { id: 'xscissor', name: 'X-Scissor', type: 'Bug', category: 'physical', power: 80, accuracy: 100, pp: 15 },
  { id: 'rockslide', name: 'Rock Slide', type: 'Rock', category: 'physical', power: 75, accuracy: 90, pp: 10 },
  { id: 'ancientpower', name: 'Ancient Power', type: 'Rock', category: 'special', power: 60, accuracy: 100, pp: 5 },
  { id: 'powergem', name: 'Power Gem', type: 'Rock', category: 'special', power: 80, accuracy: 100, pp: 20 },
  { id: 'wingattack', name: 'Wing Attack', type: 'Flying', category: 'physical', power: 60, accuracy: 100, pp: 35 },
  { id: 'airslash', name: 'Air Slash', type: 'Flying', category: 'special', power: 75, accuracy: 95, pp: 20 },
  { id: 'shockwave', name: 'Shock Wave', type: 'Electric', category: 'special', power: 60, accuracy: 0, pp: 20 },
  { id: 'thunderbolt', name: 'Thunderbolt', type: 'Electric', category: 'special', power: 95, accuracy: 100, pp: 15 },
  { id: 'shadowball', name: 'Shadow Ball', type: 'Ghost', category: 'special', power: 80, accuracy: 100, pp: 15 },
  { id: 'surf', name: 'Surf', type: 'Water', category: 'special', power: 90, accuracy: 100, pp: 15 },
  { id: 'waterfall', name: 'Waterfall', type: 'Water', category: 'physical', power: 80, accuracy: 100, pp: 15 },
  { id: 'twister', name: 'Twister', type: 'Dragon', category: 'special', power: 40, accuracy: 100, pp: 20 },
  { id: 'dragonbreath', name: 'Dragon Breath', type: 'Dragon', category: 'special', power: 60, accuracy: 100, pp: 20 },
  { id: 'dragonclaw', name: 'Dragon Claw', type: 'Dragon', category: 'physical', power: 80, accuracy: 100, pp: 15 },
  // Signature moves from the New Pokémon Designs doc. Their side effects (healing, paralysis,
  // sleep, high crit, self-debuff) are not in the engine yet, so they only deal damage for now.
  { id: 'swarmstrike', name: 'Swarm Strike', type: 'Bug', category: 'physical', power: 70, accuracy: 100, pp: 15 },
  { id: 'honeyhug', name: 'Honey Hug', type: 'Fairy', category: 'physical', power: 80, accuracy: 100, pp: 10 },
  { id: 'visorbeam', name: 'Visor Beam', type: 'Electric', category: 'special', power: 80, accuracy: 100, pp: 15 },
  { id: 'plasmagrasp', name: 'Plasma Grasp', type: 'Electric', category: 'physical', power: 75, accuracy: 100, pp: 15 },
  { id: 'reefsong', name: 'Reef Song', type: 'Water', category: 'special', power: 75, accuracy: 100, pp: 15 },
  { id: 'gemlash', name: 'Gem Lash', type: 'Rock', category: 'physical', power: 70, accuracy: 100, pp: 15 },
  { id: 'geodeburst', name: 'Geode Burst', type: 'Rock', category: 'special', power: 90, accuracy: 100, pp: 10 },
];

export const MOVES: Record<string, MoveData> = Object.fromEntries(list.map((m) => [m.id, m]));

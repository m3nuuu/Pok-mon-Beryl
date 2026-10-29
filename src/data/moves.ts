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
];

export const MOVES: Record<string, MoveData> = Object.fromEntries(list.map((m) => [m.id, m]));

export const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground',
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
] as const;

export type Type = (typeof TYPES)[number];

interface Matchup {
  strong?: Type[];
  weak?: Type[];
  immune?: Type[];
}

// Attacking type -> how it fares against each defending type (modern 18-type chart).
const CHART: Record<Type, Matchup> = {
  Normal: { weak: ['Rock', 'Steel'], immune: ['Ghost'] },
  Fire: { strong: ['Grass', 'Ice', 'Bug', 'Steel'], weak: ['Fire', 'Water', 'Rock', 'Dragon'] },
  Water: { strong: ['Fire', 'Ground', 'Rock'], weak: ['Water', 'Grass', 'Dragon'] },
  Electric: { strong: ['Water', 'Flying'], weak: ['Electric', 'Grass', 'Dragon'], immune: ['Ground'] },
  Grass: {
    strong: ['Water', 'Ground', 'Rock'],
    weak: ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'],
  },
  Ice: { strong: ['Grass', 'Ground', 'Flying', 'Dragon'], weak: ['Fire', 'Water', 'Ice', 'Steel'] },
  Fighting: {
    strong: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'],
    weak: ['Poison', 'Flying', 'Psychic', 'Bug', 'Fairy'],
    immune: ['Ghost'],
  },
  Poison: { strong: ['Grass', 'Fairy'], weak: ['Poison', 'Ground', 'Rock', 'Ghost'], immune: ['Steel'] },
  Ground: {
    strong: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'],
    weak: ['Grass', 'Bug'],
    immune: ['Flying'],
  },
  Flying: { strong: ['Grass', 'Fighting', 'Bug'], weak: ['Electric', 'Rock', 'Steel'] },
  Psychic: { strong: ['Fighting', 'Poison'], weak: ['Psychic', 'Steel'], immune: ['Dark'] },
  Bug: {
    strong: ['Grass', 'Psychic', 'Dark'],
    weak: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel', 'Fairy'],
  },
  Rock: { strong: ['Fire', 'Ice', 'Flying', 'Bug'], weak: ['Fighting', 'Ground', 'Steel'] },
  Ghost: { strong: ['Psychic', 'Ghost'], weak: ['Dark'], immune: ['Normal'] },
  Dragon: { strong: ['Dragon'], weak: ['Steel'], immune: ['Fairy'] },
  Dark: { strong: ['Psychic', 'Ghost'], weak: ['Fighting', 'Dark', 'Fairy'] },
  Steel: { strong: ['Ice', 'Rock', 'Fairy'], weak: ['Fire', 'Water', 'Electric', 'Steel'] },
  Fairy: { strong: ['Fighting', 'Dragon', 'Dark'], weak: ['Fire', 'Poison', 'Steel'] },
};

/** Multiplier of one attacking type against one defending type. */
export function typeMultiplier(attack: Type, defend: Type): number {
  const m = CHART[attack];
  if (m.immune?.includes(defend)) return 0;
  if (m.strong?.includes(defend)) return 2;
  if (m.weak?.includes(defend)) return 0.5;
  return 1;
}

/** Combined multiplier against a (possibly dual-typed) defender. */
export function effectiveness(attack: Type, defenders: readonly Type[]): number {
  return defenders.reduce((acc, t) => acc * typeMultiplier(attack, t), 1);
}

export const TYPE_COLORS: Record<Type, string> = {
  Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Electric: '#f8d030', Grass: '#78c850',
  Ice: '#98d8d8', Fighting: '#c03028', Poison: '#a040a0', Ground: '#e0c068', Flying: '#a890f0',
  Psychic: '#f85888', Bug: '#a8b820', Rock: '#b8a038', Ghost: '#705898', Dragon: '#7038f8',
  Dark: '#705848', Steel: '#b8b8d0', Fairy: '#ee99ac',
};

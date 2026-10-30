export interface ItemData {
  id: string;
  name: string;
  /** Short line shown in the bag. */
  desc: string;
  kind: 'ball' | 'heal';
  /** Ball catch bonus, or HP restored. */
  power: number;
}

const list: ItemData[] = [
  { id: 'pokeball', name: 'POKé BALL', desc: 'A ball for catching wild POKéMON.', kind: 'ball', power: 1 },
  { id: 'potion', name: 'POTION', desc: 'Restores 20 HP to one POKéMON.', kind: 'heal', power: 20 },
];

export const ITEMS: Record<string, ItemData> = Object.fromEntries(list.map((i) => [i.id, i]));

import type { Status } from './moves';

export type Pocket = 'items' | 'balls' | 'key';

export interface ItemData {
  id: string;
  name: string;
  /** Short line shown in the bag. */
  desc: string;
  kind: 'ball' | 'heal' | 'cure' | 'revive' | 'held' | 'key' | 'rod' | 'repel';
  /** Ball catch bonus, HP restored (9999 = full), revive fraction in %, rod tier, or repel steps. */
  power: number;
  /** Status cured; 'all' for Full Heal. */
  cures?: Status | 'all';
  price?: number;
}

const list: ItemData[] = [
  { id: 'pokeball', name: 'POKé BALL', desc: 'A ball for catching wild POKéMON.', kind: 'ball', power: 1, price: 200 },
  { id: 'greatball', name: 'GREAT BALL', desc: 'A good ball with a better catch rate.', kind: 'ball', power: 1.5, price: 600 },
  { id: 'ultraball', name: 'ULTRA BALL', desc: 'A high-performance ball for catching POKéMON.', kind: 'ball', power: 2, price: 1200 },
  { id: 'potion', name: 'POTION', desc: 'Restores 20 HP to one POKéMON.', kind: 'heal', power: 20, price: 300 },
  { id: 'superpotion', name: 'SUPER POTION', desc: 'Restores 50 HP to one POKéMON.', kind: 'heal', power: 50, price: 700 },
  { id: 'hyperpotion', name: 'HYPER POTION', desc: 'Restores 200 HP to one POKéMON.', kind: 'heal', power: 200, price: 1200 },
  { id: 'fullrestore', name: 'FULL RESTORE', desc: 'Fully restores HP and heals any status.', kind: 'heal', power: 9999, cures: 'all', price: 3000 },
  { id: 'antidote', name: 'ANTIDOTE', desc: 'Heals a poisoned POKéMON.', kind: 'cure', power: 0, cures: 'psn', price: 100 },
  { id: 'parlyzheal', name: 'PARLYZ HEAL', desc: 'Heals a paralyzed POKéMON.', kind: 'cure', power: 0, cures: 'par', price: 200 },
  { id: 'awakening', name: 'AWAKENING', desc: 'Wakes up a sleeping POKéMON.', kind: 'cure', power: 0, cures: 'slp', price: 250 },
  { id: 'burnheal', name: 'BURN HEAL', desc: 'Heals a burned POKéMON.', kind: 'cure', power: 0, cures: 'brn', price: 250 },
  { id: 'iceheal', name: 'ICE HEAL', desc: 'Thaws out a frozen POKéMON.', kind: 'cure', power: 0, cures: 'frz', price: 250 },
  { id: 'fullheal', name: 'FULL HEAL', desc: 'Heals any status problem.', kind: 'cure', power: 0, cures: 'all', price: 600 },
  { id: 'revive', name: 'REVIVE', desc: 'Revives a fainted POKéMON with half its HP.', kind: 'revive', power: 50, price: 1500 },
  { id: 'repel', name: 'REPEL', desc: 'Keeps weak wild POKéMON away for 100 steps.', kind: 'repel', power: 100, price: 350 },
  { id: 'expshare', name: 'EXP. SHARE', desc: 'A held item. The holder gets a share of battle EXP. Use it to set the share.', kind: 'held', power: 0 },
  { id: 'oldrod', name: 'OLD ROD', desc: 'An old fishing rod. Use it facing water.', kind: 'rod', power: 1 },
  { id: 'goodrod', name: 'GOOD ROD', desc: 'A new, good-quality fishing rod.', kind: 'rod', power: 2 },
  { id: 'finfossil', name: 'FIN FOSSIL', desc: 'A fossil of an ancient river hunter. It has a fin-shaped crest.', kind: 'key', power: 0 },
  { id: 'geodefossil', name: 'GEODE FOSSIL', desc: 'A fossil with a geode where the head should be.', kind: 'key', power: 0 },
  { id: 'damplans', name: 'DAM PLANS', desc: "The old plans of the dam, from INGRID. One wall is marked 'G'.", kind: 'key', power: 0 },
  { id: 'letters', name: "GRAN'S LETTERS", desc: "Grandma's old letters to Grandpa. 'The door we left for the river...'", kind: 'key', power: 0 },
  { id: 'lantern', name: 'RIVER LANTERN', desc: 'A paper lantern from the festival in LANTERNCROSS.', kind: 'key', power: 0 },
  { id: 'damkey', name: 'DAM PASS', desc: 'A staff pass for the inner dam, from your parents.', kind: 'key', power: 0 },
];

export const ITEMS: Record<string, ItemData> = Object.fromEntries(list.map((i) => [i.id, i]));

export function pocketOf(item: ItemData): Pocket {
  if (item.kind === 'ball') return 'balls';
  if (item.kind === 'key' || item.kind === 'rod') return 'key';
  return 'items';
}

/** What the Marts sell, growing with badges. */
export function martStock(badges: number): string[] {
  const s = ['pokeball', 'potion', 'antidote', 'parlyzheal'];
  if (badges >= 1) s.push('awakening', 'burnheal', 'iceheal', 'repel');
  if (badges >= 2) s.push('greatball', 'superpotion');
  if (badges >= 4) s.push('revive', 'fullheal');
  if (badges >= 5) s.push('ultraball', 'hyperpotion');
  if (badges >= 7) s.push('fullrestore');
  return s;
}

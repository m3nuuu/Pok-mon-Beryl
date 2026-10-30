import { describe, expect, it } from 'vitest';
import {
  calcDamage, calcStats, catchShakes, createPokemon, healBy, expForLevel, gainExp, newBattler, rivalStarterFor, wildLevel,
} from '../src/battle/engine';
import { MOVES } from '../src/data/moves';
import { SPECIES, SPECIES_LIST, STARTERS } from '../src/data/species';
import { effectiveness, typeMultiplier } from '../src/data/types';

const fixed = (v: number) => () => v;

describe('type chart', () => {
  it('matches known matchups', () => {
    expect(typeMultiplier('Water', 'Fire')).toBe(2);
    expect(typeMultiplier('Normal', 'Ghost')).toBe(0);
    expect(typeMultiplier('Dragon', 'Fairy')).toBe(0);
    expect(effectiveness('Electric', ['Water', 'Flying'])).toBe(4);
    expect(effectiveness('Grass', ['Water', 'Flying'])).toBe(1);
  });

  it('keeps the starter triangle', () => {
    expect(typeMultiplier('Grass', 'Water')).toBe(2);
    expect(typeMultiplier('Water', 'Fire')).toBe(2);
    expect(typeMultiplier('Fire', 'Grass')).toBe(2);
  });
});

describe('species data', () => {
  it('only references existing moves and species', () => {
    for (const s of SPECIES_LIST) {
      for (const [, id] of s.learnset) expect(MOVES[id], `${s.id} -> ${id}`).toBeDefined();
      if (s.evolvesTo) expect(SPECIES[s.evolvesTo.species]).toBeDefined();
    }
  });

  it('gives each starter a STAB move at level 5', () => {
    for (const id of STARTERS) {
      const p = createPokemon(id, 5);
      expect(p.moves.some((m) => MOVES[m.id].type === SPECIES[id].types[0])).toBe(true);
    }
  });

  it('lets the rival take the advantaged starter', () => {
    for (const id of STARTERS) {
      const rival = rivalStarterFor(id);
      expect(typeMultiplier(SPECIES[rival].types[0], SPECIES[id].types[0])).toBe(2);
    }
  });
});

describe('battle math', () => {
  it('computes Gen III style stats', () => {
    const p = createPokemon('newtide', 5);
    expect(calcStats(p).hp).toBe(Math.floor(((2 * 50 + 15) * 5) / 100) + 15);
    expect(p.hp).toBe(calcStats(p).hp);
  });

  it('deals more damage when super effective', () => {
    const a = newBattler(createPokemon('newtide', 5));
    const fire = newBattler(createPokemon('cindaroo', 5));
    const grass = newBattler(createPokemon('mossfawn', 5));
    const rng = fixed(0.5);
    const se = calcDamage(a, fire, MOVES.watergun, rng);
    const nve = calcDamage(a, grass, MOVES.watergun, rng);
    expect(se.effectiveness).toBe(2);
    expect(nve.effectiveness).toBe(0.5);
    expect(se.damage).toBeGreaterThan(nve.damage);
  });

  it('can miss and never hits immune targets', () => {
    const a = newBattler(createPokemon('mossfawn', 9));
    const b = newBattler(createPokemon('lethys', 5));
    expect(calcDamage(a, b, MOVES.tackle, fixed(0.5)).damage).toBe(0);
    expect(calcDamage(a, b, MOVES.rockthrow, fixed(0.95)).missed).toBe(true);
  });

  it('levels up and learns moves', () => {
    const p = createPokemon('mossfawn', 8);
    const ups = gainExp(p, expForLevel(9) - p.exp);
    expect(ups).toEqual([{ level: 9, learned: ['rockthrow'] }]);
    expect(p.moves.map((m) => m.id)).toContain('rockthrow');
  });

  it('keeps wild Pokémon 6–8 levels under the next gym', () => {
    for (const r of [0, 0.5, 0.99]) {
      const lv = wildLevel(0, fixed(r));
      expect(lv).toBeGreaterThanOrEqual(4);
      expect(lv).toBeLessThanOrEqual(6);
    }
  });
});

describe('items', () => {
  it('catches a weakened common Pokémon far more often than a healthy one', () => {
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const tries = (hp: (max: number) => number) => {
      let caught = 0;
      for (let i = 0; i < 2000; i++) {
        const p = createPokemon('pipwing', 4);
        p.hp = hp(calcStats(p).hp);
        if (catchShakes(p, 1, rng) === 4) caught++;
      }
      return caught / 2000;
    };
    const full = tries((m) => m), low = tries(() => 1);
    expect(low).toBeGreaterThan(full);
    expect(low).toBeGreaterThan(0.6);
    expect(full).toBeGreaterThan(0.1);
  });

  it('almost never catches Lethys with a POKé BALL', () => {
    const p = createPokemon('lethys', 50);
    expect(catchShakes(p, 1, () => 0.5)).toBeLessThan(4);
  });

  it('heals up to the missing HP only', () => {
    const p = createPokemon('pipwing', 5);
    const max = calcStats(p).hp;
    p.hp = max - 5;
    expect(healBy(p, 20)).toBe(5);
    expect(p.hp).toBe(max);
  });
});

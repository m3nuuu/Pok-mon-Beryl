// Turns trainer data into Pokémon at the right level for the player's progress.
import { MOVES } from '../data/moves';
import type { TeamMon, Tier } from '../data/mapkit';
import { createPokemon, evolvedForm, trainerBase, type Pokemon } from './engine';

/** Strong moves only show up once a Pokémon is high enough level to plausibly know them. */
export function powerCap(level: number): number {
  return 40 + level * 2.2;
}

export function teamMon(species: string, level: number, moves?: string[]): Pokemon {
  const p = createPokemon(evolvedForm(species, level), level);
  if (moves?.length) {
    const ok = moves.filter((id) => MOVES[id] && MOVES[id].power <= powerCap(level));
    const fill = p.moves.map((m) => m.id).filter((id) => !ok.includes(id)).reverse();
    const chosen = [...ok];
    while (chosen.length < 4 && fill.length) chosen.push(fill.pop()!);
    if (chosen.length) p.moves = chosen.slice(0, 4).map((id) => ({ id, pp: MOVES[id].pp }));
  }
  return p;
}

/** Builds a trainer's team. Leaders bring 2 + badges/2 Pokémon, always including their ace (the last one). */
export function buildTeam(team: TeamMon[], tier: Tier, badges: number, scaleTeam = false): Pokemon[] {
  let picked = team;
  if (scaleTeam && team.length > 2) {
    const n = Math.min(team.length, 2 + Math.floor(badges / 2));
    picked = [...team.slice(0, n - 1), team[team.length - 1]];
  }
  return picked.map((m) => {
    const level = tier === 'fixed' ? m.lv : Math.max(2, trainerBase(badges, tier) + m.lv);
    return teamMon(m.species, Math.min(100, level), m.moves);
  });
}

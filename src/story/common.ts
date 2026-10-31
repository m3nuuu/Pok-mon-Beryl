// Small helpers shared by the story scripts.
import { heal, rivalStarterFor, type Pokemon } from '../battle/engine';
import { buildTeam } from '../battle/teams';
import { badgeCount, type BattleBg, type TeamMon, type Tier } from '../data/mapkit';
import { SPECIES, SPECIES_LIST } from '../data/species';
import { game } from '../state';
import type { ScriptApi } from './api';

export const flags = () => game.state.flags;
export const nBadges = () => badgeCount(game.state.flags);
export const nameOf = (p: Pokemon) => SPECIES[p.species].name.toUpperCase();

export function healParty(): void {
  for (const p of game.state.party) heal(p);
}

/** The first form of a species (Mosshart → Mossfawn). */
export function baseForm(species: string): string {
  let s = species;
  for (let i = 0; i < 3; i++) {
    const pre = SPECIES_LIST.find((x) => x.evolvesTo?.species === s);
    if (!pre) break;
    s = pre.id;
  }
  return s;
}

/** The starter Beryl picked (remembered in a flag; older saves fall back to the lead Pokémon). */
export function starterOf(): string {
  const k = Object.keys(flags()).find((x) => x.startsWith('starter_'));
  if (k) return k.slice('starter_'.length);
  const base = baseForm(game.state.party[0]?.species ?? 'mossfawn');
  return ['mossfawn', 'newtide', 'cindaroo'].includes(base) ? base : 'mossfawn';
}

const t = (species: string, lv: number, moves?: string[]): TeamMon => ({ species, lv, moves });

/** Jasper's team for each of his battles. Levels follow Beryl's badges. */
export function rivalTeam(stage: 'blackout' | 'protest' | 'home' | 'final' | 'victory'): { team: TeamMon[]; tier: Tier } {
  const rs = rivalStarterFor(starterOf());
  switch (stage) {
    case 'blackout': return { tier: 'boss', team: [t('pipwing', -1), t(rs, 1)] };
    case 'protest': return { tier: 'boss', team: [t('pipwing', 0), t('geodling', -1), t(rs, 1)] };
    case 'home': return { tier: 'boss', team: [t('pipwing', 0), t('geodling', -1), t('hivecub', -1), t(rs, 2)] };
    case 'final': return { tier: 'boss', team: [t('pipwing', -4), t('geodling', -3), t('hivecub', -3), t('lochlet', -2), t(rs, 0)] };
    case 'victory': return {
      tier: 'fixed',
      team: [t('pipwing', 56), t('geodling', 56), t('hivecub', 57), t('lochlet', 57), t('wispjel', 57), t(rs, 60)],
    };
  }
}

export interface FightOptions {
  canLose?: boolean;
  bg?: BattleBg;
  prize?: number;
}

/** A scripted trainer battle. */
export function fight(api: ScriptApi, name: string, team: TeamMon[], tier: Tier, o: FightOptions = {}) {
  const enemies = buildTeam(team, tier, nBadges());
  return api.battle({ kind: 'trainer', trainerName: name, enemies, smart: true, prize: o.prize ?? 60, canLose: o.canLose, bg: o.bg });
}

/** The four clues about the old soul gate. Three of them unlock the third ending. */
export function clues(): { id: string; found: boolean; text: string }[] {
  const f = flags();
  return [
    { id: 'letters', found: !!f.gotLetters, text: "GRAN'S LETTERS: 'the door we left for the river'" },
    { id: 'plans', found: !!f.pumpFixed, text: "INGRID's DAM PLANS: a wall marked 'G'" },
    { id: 'mural', found: !!f.sawMural, text: 'The SHRINE MURAL: LETHYS passing through a door' },
    { id: 'tunnel', found: !!f.sawTunnel, text: 'The TUNNEL: a stone door, sealed with concrete' },
  ];
}

export const clueCount = () => clues().filter((c) => c.found).length;

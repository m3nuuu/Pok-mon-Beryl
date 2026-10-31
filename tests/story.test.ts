import { beforeEach, describe, expect, it } from 'vitest';
import { createPokemon, inflict, beforeMove, splitExp, statusDamage, calcStats } from '../src/battle/engine';
import { buildTeam } from '../src/battle/teams';
import { MAPS, badgeCount } from '../src/data/maps';
import { SPECIES } from '../src/data/species';
import { BADGE_ORDER } from '../src/data/world/gyms';
import { game, newGame } from '../src/state';
import type { BattleRequest, ScriptApi } from '../src/story/api';
import { clueCount } from '../src/story/common';
import { afterTrainer, onEnterMap, onInspect, onStep, onTalk } from '../src/story/story';

/** A script API that answers everything instantly and records what happened. */
function mockApi(start = 'home', o: { choice?: number; yes?: boolean } = {}) {
  const log: string[] = [];
  const battles: BattleRequest[] = [];
  let map = start;
  let pos = { x: 2, y: 3, facing: 'down' as const };
  const api: ScriptApi & { log: string[]; battles: BattleRequest[]; at(m: string, x?: number, y?: number): void } = {
    log, battles,
    get mapId() { return map; },
    at(m: string, x = 2, y = 3) { map = m; pos = { x, y, facing: 'down' }; },
    playerPos: () => pos as never,
    say: async (...l: string[]) => { log.push(...l); },
    yesNo: async () => o.yes ?? true,
    choose: async (items: string[]) => Math.min(o.choice ?? 0, items.length - 1),
    pickStarter: async () => 'newtide',
    battle: async (req: BattleRequest) => {
      battles.push(req);
      for (const e of req.enemies ?? (req.enemy ? [req.enemy] : [])) expect(SPECIES[e.species], e.species).toBeDefined();
      return req.legendary ? 'caught' : 'win';
    },
    walk: async () => {}, face: () => {}, faceBeryl: () => {}, emote: async () => {}, refresh: () => {},
    warp: async (m: string, x: number, y: number) => { map = m; pos = { x, y, facing: 'down' }; },
    fadeOut: async () => {}, fadeIn: async () => {}, lethysAppears: async () => {}, wait: async () => {},
    whiteOut: async () => { log.push('WHITEOUT'); }, shake: async () => {}, credits: async () => { log.push('CREDITS'); },
    spawn: () => {}, despawn: () => {},
  };
  return api;
}

const f = () => game.state.flags;
function giveBadges(n: number) {
  for (const b of BADGE_ORDER.slice(0, n)) f()[`badge_${b.town}`] = true;
  game.state.badges = badgeCount(f());
}

beforeEach(() => {
  game.state = newGame();
});

describe('story NPCs', () => {
  it('gives every NPC without its own lines a scripted answer', async () => {
    game.state.party.push(createPokemon('newtide', 10));
    Object.assign(f(), { woke: true, parentsLeft: true, metJasper: true, gotStarter: true, taskGiven: true, prologueDone: true, leftHome: true });
    for (const m of Object.values(MAPS)) {
      for (const n of m.npcs) {
        if (n.text?.length || n.trainer || n.item || n.id.startsWith('deco') || n.id === 'nurse' || n.id === 'clerk') continue;
        const api = mockApi(m.id);
        expect(await onTalk(api, n.id), `${m.id}/${n.id}`).toBe(true);
      }
    }
  });
});

describe('the whole story', () => {
  it('runs from waking up to the Hall of Fame', async () => {
    const api = mockApi('home');
    await onEnterMap(api);
    expect(f().woke).toBe(true);
    api.at('jasperHome');
    await onTalk(api, 'jasper');
    expect(f().metJasper).toBe(true);
    api.at('home');
    await onEnterMap(api);
    expect(f().gotStarter && f().taskGiven).toBe(true);
    expect(game.state.party[0].species).toBe('newtide');
    expect(game.state.bag.pokeball).toBe(5);

    api.at('stillbrook', 20, 10);
    expect(await onStep(api)).toBe(true);
    expect(f().prologueDone).toBe(true);
    api.at('route1');
    await onEnterMap(api);
    expect(f().leftHome).toBe(true);

    // 2 badges: blackout, then the power plant
    giveBadges(2);
    api.at('stillbrook');
    await onEnterMap(api);
    expect(f().ev2done).toBe(true);
    api.at('plant');
    await onTalk(api, 'vesper');
    expect(f().plantDone).toBe(true);

    // Side quests and clues
    api.at('pension');
    await onTalk(api, 'rosalind');
    expect(f().pensionQuest).toBe(true);
    for (const [m, id] of [['route1', 'runaway1'], ['lanterncross', 'runaway2'], ['mossveil', 'runaway3']]) {
      api.at(m);
      await onTalk(api, id);
    }
    api.at('pension');
    await onTalk(api, 'rosalind');
    expect(game.state.bag.expshare).toBe(1);
    api.at('shrine');
    expect(await onInspect(api, 4, 1)).toBe(true);

    giveBadges(4);
    api.at('weirhaven');
    await onEnterMap(api);
    expect(f().ev4done).toBe(true);
    api.at('dam');
    await onTalk(api, 'ingrid');
    api.at('shore');
    await onTalk(api, 'shoreSign');
    api.at('pump');
    await onTalk(api, 'pumpMon');
    expect(f().pumpFixed && game.state.bag.damplans).toBeTruthy();

    giveBadges(5);
    api.at('home');
    await onEnterMap(api);
    expect(game.state.egg?.species).toBe('shellet');
    api.at('ruinHouse');
    expect(await onInspect(api, 2, 3)).toBe(true);
    api.at('tunnel');
    expect(await onInspect(api, 4, 1)).toBe(true);
    expect(clueCount()).toBe(4);

    api.at('emberdeep');
    await onTalk(api, 'miner1');
    expect(f().caveCleared).toBe(true);
    await onTalk(api, 'fossilFin');
    api.at('frostspring');
    const before = game.state.party.length + game.state.box.length;
    await onTalk(api, 'elvi');
    expect(game.state.party.length + game.state.box.length).toBe(before + 1);

    giveBadges(6);
    api.at('home');
    await onEnterMap(api);
    expect(f().ev6done).toBe(true);

    giveBadges(7);
    api.at('weirhaven');
    await onEnterMap(api);
    expect(f().ev7 && f().damOpen).toBe(true);
    api.at('dam');
    await onTalk(api, 'vesperBomb');
    expect(f().ev7done && f().torvaldBack).toBe(true);

    giveBadges(8);
    api.at('weirhaven');
    await onEnterMap(api);
    expect(f().ev8).toBe(true);
    api.at('damcrest');
    await onEnterMap(api);
    expect(f().decided).toBe(true);
    expect(game.state.ending).toBe('break');

    api.at('victory');
    await onTalk(api, 'jasperVR');
    expect(f().rivalVR).toBe(true);
    api.at('leagueHall');
    for (const id of ['wren', 'bramble', 'kestrel', 'morgrave']) await afterTrainer(api, id);
    await onTalk(api, 'champion');
    expect(f().hallOfFame).toBe(true);
    expect(api.log).toContain('CREDITS');
    expect(api.log).not.toContain('WHITEOUT');

    api.at('frostspring');
    await onTalk(api, 'lethysSource');
    expect(f().lethysDone).toBe(true);
  });

  it('offers the soul gate only with three clues', async () => {
    giveBadges(8);
    Object.assign(f(), { ev7done: true, ev8: true, sawMural: true, sawTunnel: true });
    const api = mockApi('damcrest', { choice: 2 });
    await onEnterMap(api);
    expect(game.state.ending).toBe('seal');
    game.state = newGame();
    giveBadges(8);
    Object.assign(f(), { ev7done: true, ev8: true, sawMural: true, sawTunnel: true, gotLetters: true });
    const api2 = mockApi('damcrest', { choice: 2 });
    await onEnterMap(api2);
    expect(game.state.ending).toBe('gate');
    expect(f().gateEnding).toBe(true);
    expect(api2.battles.at(-1)?.trainerName).toBe('FLOWKEEPER VESPER');
  });
});

describe('battle rules', () => {
  it('poisons, burns and puts to sleep', () => {
    const p = createPokemon('mossfawn', 20);
    expect(inflict(p, 'psn', () => 0.5)).toBe(true);
    expect(inflict(p, 'brn', () => 0.5)).toBe(false);
    expect(statusDamage(p)).toBe(Math.floor(calcStats(p).hp / 8));
    const fire = createPokemon('cindaroo', 20);
    expect(inflict(fire, 'brn', () => 0.5)).toBe(false);
    const s = createPokemon('newtide', 20);
    inflict(s, 'slp', () => 0);
    expect(s.sleepTurns).toBe(1);
    expect(beforeMove(s, () => 0.5)).toEqual({ act: true, msg: 'woke up!' });
  });

  it('splits EXP between fighters and the EXP Share holder', () => {
    const a = createPokemon('newtide', 10), b = createPokemon('pipwing', 10), h = createPokemon('geodling', 5);
    const out = splitExp(100, [a, b], h, 50);
    expect(out.get(h)).toBe(50);
    expect(out.get(a)).toBe(25);
    expect(out.get(b)).toBe(25);
    expect(splitExp(100, [a], null, 50).get(a)).toBe(100);
  });

  it('brings more leader Pokémon with more badges, always with the ace', () => {
    const team = [1, 2, 3, 4, 5, 6].map((i) => ({ species: i === 6 ? 'geodragon' : 'geodling', lv: 0 }));
    expect(buildTeam(team, 'leader', 0, true)).toHaveLength(2);
    expect(buildTeam(team, 'leader', 7, true)).toHaveLength(5);
    expect(buildTeam(team, 'leader', 7, true).at(-1)!.species).toBe('geodragon');
    expect(buildTeam(team, 'leader', 3, true)[0].level).toBe(30);
  });
});

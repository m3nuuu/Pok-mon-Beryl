import { createPokemon, heal, movesKnownAt, rivalStarterFor, type Pokemon } from '../battle/engine';
import { MOVES } from '../data/moves';
import { SPECIES } from '../data/species';
import { MAPS, tileAt } from '../data/maps';
import { addItem, game, receive, save, HOME_DOOR, type Facing } from '../state';
import type { ScriptApi } from './api';
import {
  badgeHint, blackout, bombVesper, champion, egg, finale, homeWorries, lethysEncounter, plantVesper, protest, reservoir, summons,
  victoryJasper,
} from './acts';
import { flags, nBadges } from './common';
import {
  crest, damParent, elvi, ferry, foreman, fossil, grandmaTalk, ingridDam, ingridShore, mural, organizer, pumpMon, reception,
  reeve, rosalind, ruinTable, runaway, sven, tunnelDoor,
} from './side';

// Story hooks called by the WorldScene. Every scene is gated by flags in game.state.flags, so a
// reloaded save picks up at the right point. Prologue:
//   woke → parentsLeft → metJasper → gotStarter → taskGiven → prologueDone → leftHome
// The acts after it are in acts.ts, side quests in side.ts (see docs/GAME_PLAN.md).

const nameOf = (p: Pokemon) => SPECIES[p.species].name.toUpperCase();
const say = (api: ScriptApi, ...l: string[]) => api.say(...l);

/** Maps you may only enter once the professor has given Beryl the task. */
const OUTSIDE_TOWN = ['route1', 'route2', 'damroad'];

export async function onEnterMap(api: ScriptApi): Promise<void> {
  const f = flags();
  const m = api.mapId;
  const n = nBadges();
  // Prologue
  if (m === 'home' && !f.woke) return morning(api);
  if (m === 'home' && f.metJasper && !f.gotStarter) return spruceVisit(api);
  if (m === 'stillbrook' && f.gotStarter && !f.taskGiven) return firstBattle(api);
  if (OUTSIDE_TOWN.includes(m) && !f.taskGiven) {
    await say(api, f.parentsLeft
      ? "GRANDMA's voice: BERYL! Don't wander off, dear. Not without a POKéMON of your own!"
      : "You can't leave town without breakfast!");
    return api.warp(HOME_DOOR.map, HOME_DOOR.x, HOME_DOOR.y, HOME_DOOR.facing);
  }
  if (OUTSIDE_TOWN.includes(m) && f.taskGiven && !f.leftHome) {
    f.leftHome = true;
    api.refresh();
  }
  // Main events, by badge count
  if (m === 'stillbrook' && n >= 2 && !f.ev2) return blackout(api);
  if (m === 'weirhaven' && n >= 4 && !f.ev4) return protest(api);
  if (m === 'home' && n >= 5 && !f.gotEgg && f.taskGiven) {
    await egg(api);
    if (n >= 6 && !f.ev6) await homeWorries(api);
    return;
  }
  if (m === 'home' && n >= 6 && !f.ev6) return homeWorries(api);
  if (m === 'weirhaven' && n >= 7 && !f.ev7) return reservoir(api);
  if (m === 'weirhaven' && n >= 8 && f.ev7done && !f.ev8) return summons(api);
  if (m === 'damcrest' && f.ev8 && !f.decided) return finale(api);
  // Places
  if (m === 'tunnel' && !f.sawTunnel) {
    await say(api, 'A narrow tunnel, far older than the dam above it. The air is cold and smells of river.');
  }
}

/** Runs after every step the player takes. Returns true if a scene played. */
export async function onStep(api: ScriptApi): Promise<boolean> {
  const f = flags();
  if (api.mapId === 'stillbrook' && f.taskGiven && !f.prologueDone) {
    const spot = riverSpot(api);
    if (spot) {
      await lethysScene(api, spot);
      return true;
    }
  }
  return false;
}

export async function onStepGrassWithoutPokemon(api: ScriptApi): Promise<void> {
  if (!flags().parentsLeft) return api.say("You shouldn't go into the tall grass without a POKéMON.");
  await api.emote('follower', 'exclaim');
  await api.say(
    'Your family POKéMON tugs at your sleeve.',
    "It doesn't want you to go into the tall grass without a POKéMON of your own.",
  );
}

/** Inspecting a tile. Returns true if a script handled it. */
export async function onInspect(api: ScriptApi, x: number, y: number): Promise<boolean> {
  const m = api.mapId;
  if (m === 'shrine' && y === 1 && x >= 3 && x <= 5) return mural(api);
  if (m === 'tunnel' && y === 1 && (x === 4 || x === 5)) return tunnelDoor(api);
  if (m === 'ruinHouse' && (x === 2 || x === 3) && (y === 3 || y === 4)) return ruinTable(api);
  return false;
}

/** After a map trainer has been beaten. */
export async function afterTrainer(api: ScriptApi, id: string): Promise<void> {
  const f = flags();
  if (api.mapId === 'leagueHall' && ['wren', 'bramble', 'kestrel', 'morgrave'].includes(id)) {
    f[`elite_${id}`] = true;
    await api.fadeOut(200);
    api.refresh();
    await api.fadeIn(200);
    return;
  }
  if (id === 'leader') await badgeHint(api);
}

/** A colour wash over a map, for the blackout and the rising reservoir. */
export function mapTint(mapId: string): { color: number; alpha: number } | null {
  const f = flags();
  if (mapId === 'stillbrook' && f.ev2 && !f.plantDone) return { color: 0x101830, alpha: 0.4 };
  if (mapId === 'weirhaven' && f.ev7 && !f.ev7done) return { color: 0x203058, alpha: 0.3 };
  if (mapId === 'damcrest' && f.ev8 && !f.decided) return { color: 0x402818, alpha: 0.2 };
  return null;
}

/** Talking to an NPC. Returns false to fall back to the NPC's own lines. */
export async function onTalk(api: ScriptApi, id: string): Promise<boolean> {
  const f = flags();
  const m = api.mapId;
  const n = nBadges();
  const has = game.state.party.length > 0;
  const t = (...l: string[]) => api.say(...l).then(() => true);

  switch (id) {
    case 'mum':
      if (m === 'dam') return damParent(api, 'mum');
      if (f.ev6) return t("MUM: We'll be fine, sweetie. Go on, your POKéMON are waiting for you.");
      return t("MUM: Morning, sweetie! We're off to the dam soon.");
    case 'dad':
      if (m === 'dam') return damParent(api, 'dad');
      if (f.ev6) return t('DAD: Keep your eyes open at the dam, BERYL. Something is not right there.');
      return t('DAD: The spillway gates need checking again. Busy day!');

    case 'grandma':
      if (m === 'stillbrook') return t('GRANDMA: The river remembers everything. Listen to it.');
      if (!f.parentsLeft) return t('GRANDMA: Breakfast is almost ready, dear.');
      if (!f.gotStarter) {
        return t(
          'GRANDMA: Your little friend wants to play. Why not go and see JASPER?',
          'His house is just across the path.',
        );
      }
      if (await grandmaTalk(api)) return true;
      for (const p of game.state.party) heal(p);
      return t(
        f.hallOfFame ? 'GRANDMA: Our CHAMPION! Sit down, let me make you some tea.' : 'GRANDMA: Welcome home, dear. Sit down and let your POKéMON rest a little.',
        'Your POKéMON were fully healed!',
      );

    case 'homemon':
      await api.emote('homemon', 'heart');
      return t('Your family POKéMON nuzzles you happily.');

    case 'jasperDad':
      if (!f.metJasper) return meetJasperFamily(api).then(() => true);
      if (f.ev6) {
        return t(
          "TORVALD: The company let me go. Twenty years at that dam. Ha... don't worry about me, BERYL.",
          'TORVALD: I am a GYM LEADER before anything else. When the time comes, I will be ready for you.',
        );
      }
      return t(
        "TORVALD: I'm JASPER's dad, TORVALD. I lead the STILLBROOK GYM. FIGHTING-type POKéMON, all the way!",
        'TORVALD: But I help out at the dam a lot these days, so the GYM is closed. Win seven badges, and I will make time for you!',
      );

    case 'jasperMom':
      if (!f.metJasper) return meetJasperFamily(api).then(() => true);
      return t(
        "JASPER'S MUM: I run a POKéMON PENSION in LANTERNCROSS, south along the river.",
        "JASPER'S MUM: If you pass by on your journey, come and say hello. I might have something useful for you.",
      );

    case 'jasper':
      if (m === 'jasperHome') return meetJasperFamily(api).then(() => true);
      if (!has) return t('JASPER: Come on, BERYL! The professor is waiting!');
      if (f.prologueDone && !f.leftHome) {
        return t(
          "JASPER: Eight GYMS, the whole LETHYS, and LETHYS itself! What are we waiting for?",
          'JASPER: ROUTE 1 goes south to LANTERNCROSS. See you out there!',
        );
      }
      return t(
        f.rivalWon
          ? "JASPER: Told you I'd win! But don't worry, you'll get me next time... maybe."
          : "JASPER: Next time I win, for sure! I'll train way harder than you.",
      );
    case 'jasperBlackout':
      return t("JASPER: VALECROWN is east across the bridge, along ROUTE 2. Go!");
    case 'jasperProtest':
      return t('JASPER: ...');

    case 'spruce':
      if (f.hallOfFame) return spruceFinal(api).then(() => true);
      return t(
        'PROF. SPRUCE: The LETHYS carries more than water, you know. Old stories, too...',
        'Ask your grandma about it sometime.',
      );

    case 'guard':
      return t(
        'BRAM: Sorry, kid. Staff only beyond this door.',
        'BRAM: If you want to see your parents, take the DAM ROAD up to WEIRHAVEN. The company office is there.',
      );

    case 'neighbor':
      if (f.ev2 && !f.plantDone) return t('HAZEL: No power, no TV, no fridge! I hope somebody sorts out that plant in VALECROWN soon.');
      if (f.decided) return t('HAZEL: Everyone in town is talking about you, BERYL. Our own hero!');
      if (f.prologueDone) {
        return t(
          'HAZEL: Greta says she saw something huge in the river today!',
          'A water serpent, they said. Just like in the old stories...',
        );
      }
      return t(
        'HAZEL: Have you heard? People keep seeing ghost POKéMON by the river at night.',
        "My grandmother said the river wasn't always this quiet...",
      );

    case 'fisher':
      await fisherman(api);
      return true;

    case 'ferry':
      if (!f.prologueDone) {
        return t(
          "GRETA: I'm the ferry keeper. The LETHYS is too wide to swim, so I take people across and downstream.",
          'GRETA: Come back once you are on your way, and I will take you anywhere along the river you have been.',
        );
      }
      return ferry(api, 'stillbrook');
    case 'ferry2':
      return ferry(api, 'lanterncross');
    case 'ferry3':
      return ferry(api, 'reedmouth');

    // Lanterncross and the pension
    case 'rosalind':
      return rosalind(api);
    case 'runaway1': case 'runaway2': case 'runaway3':
      return runaway(api, id);
    case 'organizer':
      return organizer(api);

    // Reedmouth
    case 'rodguy':
      return sven(api);
    case 'reeve':
      return reeve(api);
    case 'leagueGuard': case 'leagueGuard2':
      return t(
        'GUARD: VICTORY ROAD is closed. By order of CHAMPION SOLENNE, no challengers while the crisis at the dam goes on.',
        ...(n >= 8 ? ['GUARD: You have all eight badges? Then the dam is where you are needed. Go to WEIRHAVEN.'] : []),
      );
    case 'lethysDelta': case 'lethysSource':
      await lethysEncounter(api, id);
      return true;

    // Valecrown
    case 'plantGuard':
      return t('GUARD: The POWER PLANT is for authorized staff only. Move along, please.');
    case 'grunt1':
      return t("FLOWKEEPER: You want to go in? Go ahead. VESPER will be thrilled to meet you. Ha!");
    case 'vesper':
      await plantVesper(api);
      return true;

    // Weirhaven and the dam
    case 'crestGuard': case 'crestGuard2':
      return t(
        'GUARD: The DAM CREST is closed to the public. Orders from DIRECTOR CREST.',
        ...(n >= 8 && !f.ev7done ? ["GUARD: Something's going on inside the dam. You should check the office."] : []),
      );
    case 'ghost1': case 'ghost2': {
      await t('The ghost POKéMON shrieks and attacks!');
      const r = await api.battle({ kind: 'wild', enemy: createPokemon('wispjel', Math.max(5, n * 6 + 4)), bg: 'night' });
      if (r === 'lose') await api.whiteOut();
      else api.despawn(id);
      return true;
    }
    case 'reception':
      return reception(api);
    case 'crest':
      return crest(api);
    case 'ingrid':
      if (f.ev7 && !f.ev7done) return t('INGRID: VESPER is over there, by the west wall! Stop her, BERYL! I will work on the wires!');
      return ingridDam(api);
    case 'vesperBomb':
      await bombVesper(api);
      return true;
    case 'shoreSign':
      return ingridShore(api);
    case 'pumpMon':
      return pumpMon(api);

    // Emberdeep and Frostspring
    case 'miner1':
      return foreman(api);
    case 'miner2':
      return t(f.caveCleared ? 'MINER: Back to work, back to work!' : 'MINER: Watch your head! Rocks keep coming down!');
    case 'fossilFin': case 'fossilGeode':
      return fossil(api, id);
    case 'elvi':
      return elvi(api);

    // The League
    case 'jasperVR':
      await victoryJasper(api);
      return true;
    case 'champion':
      await champion(api);
      return true;
  }
  return false;
}

async function spruceFinal(api: ScriptApi) {
  const s = game.state;
  const caught = Object.keys(s.caught).length, seen = Object.keys(s.seen).length;
  const total = Object.keys(SPECIES).length;
  await say(api,
    `PROF. SPRUCE: CHAMPION BERYL! Let me see your POKéDEX... ${seen} seen, ${caught} caught!`,
    caught >= total - 1
      ? 'PROF. SPRUCE: Incredible! You have recorded nearly every POKéMON along the LETHYS. From the source to the sea!'
      : caught >= total / 2
        ? 'PROF. SPRUCE: Splendid work! But the river still hides a few secrets. Keep looking!'
        : 'PROF. SPRUCE: A fine start! The LETHYS valley is full of POKéMON you have not met yet.',
    "PROF. SPRUCE: Your journey made the river whole again, in its way. I'm sure your grandma is proud.",
  );
}

// --- scenes -----------------------------------------------------------------------

async function morning(api: ScriptApi) {
  const f = flags();
  if (!f.parentsLeft) {
    await api.wait(400);
    await api.say(
      'KALDRIA. A land shaped by one great river: the LETHYS.',
      'In the small town of STILLBROOK, below the MIRRORMERE DAM, a new day begins...',
    );
    api.face('mum', 'left');
    await api.say(
      "MUM: Good morning, BERYL! You're finally up.",
      'MUM: Dad and I have an early shift at the dam today. Grandma will look after you.',
    );
    api.face('dad', 'left');
    await api.say(
      "DAD: The spillway gates are acting up again. We'll be home for dinner.",
      'DAD: Be good, and keep an eye on our little troublemaker over there!',
    );
    await Promise.all([
      api.walk('mum', ['down', 'down', 'down', 'down', 'right']),
      api.walk('dad', ['down', 'down', 'down', 'left']),
    ]);
    await api.fadeOut(200);
    f.parentsLeft = true;
    api.refresh();
    await api.fadeIn(200);
  }
  api.faceBeryl('grandma');
  await api.say(
    'GRANDMA: Good morning, dear. Breakfast is on the table.',
    "GRANDMA: Your little friend has been waiting to play with you all morning.",
    "GRANDMA: Why don't you two go and say hello to JASPER? His house is just across the path.",
  );
  await api.emote('follower', 'heart');
  f.woke = true;
  save();
}

async function meetJasperFamily(api: ScriptApi) {
  const f = flags();
  api.faceBeryl('jasperDad');
  await api.say(
    "JASPER'S DAD: Well, if it isn't BERYL! JASPER has been bouncing off the walls all morning.",
    "JASPER'S DAD: I train at the STILLBROOK GYM. FIGHTING type, through and through!",
    "JASPER'S DAD: Maybe one day you two will battle me there. Ha ha!",
  );
  api.faceBeryl('jasperMom');
  await api.say(
    "JASPER'S MUM: Hello, BERYL! And your family's little one too.",
    "JASPER'S MUM: I'm only home for a few days. I work at a POKéMON PENSION further down the river.",
    "JASPER'S MUM: We look after other trainers' POKéMON there while they travel.",
  );
  api.faceBeryl('jasper');
  await api.say('JASPER: BERYL! Finally! Look, look, out the window!');
  await api.emote('jasper', 'exclaim');
  await api.say(
    "JASPER: Some old man in a lab coat just walked into your house!",
    "JASPER'S MUM: Oh, that's PROF. SPRUCE! He's having tea with your grandma, BERYL.",
    'JASPER: The POKéMON professor?! Come on, BERYL, hurry!',
  );
  await api.fadeOut(200);
  f.metJasper = true;
  api.refresh();
  await api.fadeIn(200);
}

async function spruceVisit(api: ScriptApi) {
  const f = flags();
  await api.say(
    'GRANDMA: Ah, there you are, BERYL! We have a guest.',
    'PROF. SPRUCE: Hello there! You must be BERYL.',
  );
  // The family Pokémon runs straight over to the professor.
  await api.walk('follower', ['right', 'up', 'up', 'right', 'up']);
  await api.emote('follower', 'heart');
  await api.say(
    'PROF. SPRUCE: Ha ha ha! This one has plenty of spirit.',
    'PROF. SPRUCE: Your grandma and I have been friends since we were your age.',
    'PROF. SPRUCE: I study how POKéMON live along the LETHYS. And I brought three young ones who need a good home.',
    'PROF. SPRUCE: BERYL, would you like to choose one?',
  );
  api.face('jasper', 'right');
  await api.say(
    'JASPER: Whoa, for real? Professor, can I have one too?!',
    'PROF. SPRUCE: Ha ha! Of course. But BERYL chooses first.',
  );

  const starter = await api.pickStarter();
  const mon = createPokemon(starter, 5);
  mon.bond = 70;
  receive(mon);
  f[`starter_${starter}`] = true;
  await api.say(`BERYL received ${nameOf(mon)}!`);

  // Like a Gen III rival, Jasper's starter hasn't learned its type move yet.
  const rival = createPokemon(rivalStarterFor(starter), 5);
  rival.moves = movesKnownAt(rival.species, 4).map((id) => ({ id, pp: MOVES[id].pp }));
  rivalMon = rival;
  await api.say(
    `JASPER: Then I'll take this one! ${nameOf(rival)}, you're with me!`,
    "JASPER: Hey, BERYL! Let's see whose POKéMON is stronger. Outside, right now!",
  );
  f.gotStarter = true;
  await api.warp(HOME_DOOR.map, HOME_DOOR.x, HOME_DOOR.y, HOME_DOOR.facing);
  await firstBattle(api);
}

// Jasper's partner, handed from the house scene to the battle outside.
let rivalMon: Pokemon | null = null;

/** Rebuilds Jasper's partner when a reloaded save resumes at the battle. */
function rivalFromFlags(): Pokemon {
  const starter = game.state.party[0]?.species ?? 'mossfawn';
  const rival = createPokemon(rivalStarterFor(starter), 5);
  rival.moves = movesKnownAt(rival.species, 4).map((id) => ({ id, pp: MOVES[id].pp }));
  return rival;
}

async function firstBattle(api: ScriptApi) {
  const f = flags();
  const rival = rivalMon ?? rivalFromFlags();
  rivalMon = null;
  const result = await api.battle({ kind: 'trainer', trainerName: 'JASPER', enemy: rival, canLose: true, bg: 'plain' });
  f.rivalWon = result !== 'win';
  api.faceBeryl('jasper');
  await api.say(
    result === 'win'
      ? "JASPER: Aw, no way! Okay, okay... I'll train harder and beat you next time!"
      : "JASPER: Yes! I won! Don't feel bad, BERYL. You'll get me next time.",
  );
  api.faceBeryl('spruce');
  for (const p of game.state.party) heal(p);
  await api.say(
    'PROF. SPRUCE: What a splendid first battle, both of you! Let me patch your POKéMON up.',
    'Your POKéMON were fully healed!',
    'PROF. SPRUCE: Now, I have a favour to ask. Nobody has ever recorded every POKéMON that lives along the LETHYS.',
    'PROF. SPRUCE: I want you two to follow the river, from its source in the mountains all the way to the sea.',
    'PROF. SPRUCE: Meet every POKéMON you can and record it in this.',
    'BERYL received the POKéDEX!',
    'JASPER received the POKéDEX too!',
    "JASPER: From the source to the sea? I'll get there way before you!",
  );
  api.faceBeryl('grandma');
  await api.say(
    'GRANDMA: My, my. Our BERYL, off on a journey...',
    'GRANDMA: The river remembers everything. Listen to it.',
  );
  api.faceBeryl('spruce');
  await api.say(
    'PROF. SPRUCE: Oh, and you will need these. Catching POKéMON is the best way to learn about them.',
    'BERYL received 5 POKé BALLS!',
    'BERYL received a POTION!',
    'PROF. SPRUCE: Your journey follows the LETHYS, so why not start by saying hello to the river?',
  );
  addItem('pokeball', 5);
  addItem('potion', 1);
  f.hasDex = true;
  f.taskGiven = true;
  api.refresh();
  save();
}

const STEP: Record<Facing, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** If Beryl stands right at the river, the river tile a few steps out where LETHYS can rise. */
function riverSpot(api: ScriptApi): { x: number; y: number } | null {
  const map = MAPS[api.mapId];
  const p = api.playerPos();
  const dirs: Facing[] = [p.facing, 'right', 'left', 'up', 'down'];
  for (const d of dirs) {
    const [dx, dy] = STEP[d];
    if (tileAt(map, p.x + dx, p.y + dy) !== '~') continue;
    let n = 1;
    while (n < 4 && tileAt(map, p.x + dx * (n + 1), p.y + dy * (n + 1)) === '~') n++;
    return { x: p.x + dx * n, y: p.y + dy * n };
  }
  return null;
}

async function lethysScene(api: ScriptApi, spot: { x: number; y: number }) {
  const f = flags();
  await api.say('The water is strangely still...');
  await api.wait(400);
  await api.lethysAppears(spot.x, spot.y);
  await api.emote('player', 'exclaim');
  const p = api.playerPos();
  if (Math.abs(p.x - 20) + Math.abs(p.y - 20) > 3) await api.say('Someone comes running from the ferry dock!');
  await api.say(
    'GRETA: BERYL! Did you see that?! That was LETHYS, the spirit of the river!',
    'GRETA: In broad daylight... My grandmother told me it only shows itself when the region needs its hero.',
    "GRETA: ...But everything seems fine, doesn't it?",
  );
  f.prologueDone = true;
  api.refresh();
  await say(api,
    'JASPER: BERYL! BERYL! Did you see it too?! Greta is shouting about LETHYS!',
    "JASPER: That settles it. The river wants us to go. I'm heading to LANTERNCROSS first, my mum's PENSION is there!",
    'JASPER: ROUTE 1 is south of town. The DAM ROAD goes north to WEIRHAVEN, and ROUTE 2 east to VALECROWN.',
    "JASPER: There are eight GYMS in KALDRIA. See you at the first one... if you're fast enough!",
  );
  save();
}

async function fisherman(api: ScriptApi) {
  const s = game.state;
  if (s.party.length === 0) {
    await api.say("OTTO: The fish are biting today! Come back with a POKéMON and I'll show you my catch.");
    return;
  }
  if (s.flags.fisherBattle && !s.bag.oldrod && !s.bag.goodrod) {
    addItem('oldrod');
    await api.say('OTTO: Oh, take this OLD ROD. Fishing is half the fun of the river!', 'BERYL received the OLD ROD!');
    return;
  }
  if (s.flags.fisherBattle) {
    await api.say(
      "OTTO: MURKFIN don't look like much. But my grandpa swore...",
      'the ones that grow up in the strong current below the dam turn into something else entirely!',
    );
    return;
  }
  await api.say('OTTO: The LETHYS ran wild before the dam, my grandpa said. Look what I just fished up!');
  if (!(await api.yesNo('OTTO: Want to battle my MURKFIN?'))) {
    await api.say('OTTO: Suit yourself!');
    return;
  }
  const result = await api.battle({ kind: 'trainer', trainerName: 'FISHER OTTO', enemy: createPokemon('murkfin', 5), bg: 'water', prize: 10 });
  if (result === 'lose') {
    await api.whiteOut();
    return;
  }
  s.flags.fisherBattle = true;
  addItem('oldrod');
  await api.say(
    'OTTO: Ha! Fair and square. MURKFIN is better at splashing than battling.',
    "OTTO: Here, take my spare OLD ROD. Face the water and press A, and see what bites!",
    'BERYL received the OLD ROD!',
  );
  save();
}

// Side quests and the clues: the Pension runaways, the festival lantern, the fishing rods, Ingrid's
// pump station, the letters, the mural, the tunnel, the Emberdeep fossils and the ferry.
import { createPokemon, wildLevel } from '../battle/engine';
import { ITEMS } from '../data/items';
import { MAPS } from '../data/maps';
import { addItem, game, receive, save, takeItem } from '../state';
import type { ScriptApi } from './api';
import { clueCount, flags, nBadges, nameOf } from './common';

const say = (api: ScriptApi, ...l: string[]) => api.say(...l).then(() => true);

function give(id: string, n = 1): string {
  addItem(id, n);
  return `BERYL received ${n > 1 ? `${n} ` : ''}${ITEMS[id].name}${n > 1 ? 'S' : ''}!`;
}

// --- Pension in Lanterncross --------------------------------------------------------------

const RUNAWAYS = ['runaway1', 'runaway2', 'runaway3'];

export async function rosalind(api: ScriptApi) {
  const f = flags();
  if (!f.pensionQuest) {
    f.pensionQuest = true;
    api.refresh();
    return say(api,
      "ROSALIND: BERYL! You came all the way to LANTERNCROSS! Welcome to my POKéMON PENSION.",
      "ROSALIND: Has JASPER been behaving? Don't answer that.",
      'ROSALIND: Oh, but your timing is perfect. Three of our guests slipped out of the pen this morning!',
      "ROSALIND: A LOCHLET, a HIVECUB and a PIPWING. They can't have gone far... ROUTE 1, the edge of town, maybe even the woods up north.",
      "ROSALIND: If you find them, they'll follow you home. They know the smell of this place. Thank you, dear!",
    );
  }
  if (!f.runawaysBack) {
    const found = RUNAWAYS.filter((r) => f[r]).length;
    if (found < 3) return say(api, `ROSALIND: You've found ${found} of the 3 runaways so far. Keep looking, please!`);
    f.runawaysBack = true;
    api.refresh();
    return say(api,
      'ROSALIND: All three of them! Oh, you rascals. Back in the pen with you.',
      "ROSALIND: BERYL, thank you. Here, take this. It's an EXP. SHARE.",
      give('expshare'),
      'ROSALIND: Let one of your POKéMON hold it, and it gets a share of the EXP from every battle, even without fighting.',
      'ROSALIND: You can set how big the share is from your BAG. Fair for everyone!',
    );
  }
  if (f.decided) {
    return say(api,
      "ROSALIND: JASPER told me everything about the dam. I'm proud of both of you, you know. Even when you disagree.",
    );
  }
  return say(api,
    'ROSALIND: The runaways are happy as anything now.',
    "ROSALIND: JASPER visits when he can. He talks about you all the time. Don't tell him I said that!",
  );
}

export async function runaway(api: ScriptApi, id: string) {
  const f = flags();
  await api.emote(id, 'heart');
  f[id] = true;
  await api.fadeOut(200);
  api.refresh();
  await api.fadeIn(200);
  const left = RUNAWAYS.filter((r) => !f[r]).length;
  return say(api,
    'The runaway POKéMON sniffs BERYL and happily runs off towards the PENSION.',
    left ? `${left} more to find.` : 'That was the last one! Time to see ROSALIND.',
  );
}

// --- Lanterncross festival, mural ------------------------------------------------------------

export async function organizer(api: ScriptApi) {
  const f = flags();
  if (!f.gotLantern) {
    f.gotLantern = true;
    return say(api,
      'IVO: Ah, a traveller! You are just in time for the LANTERN FESTIVAL.',
      'IVO: Every year we write the names of the people we lost on paper lanterns and set them on the LETHYS.',
      'IVO: The river carries them to the sea. Or it used to. Lately they drift back up our banks.',
      "IVO: Here, take one. Light it for someone, if you like. And visit the SHRINE: the mural there is older than anything in the valley.",
      give('lantern'),
    );
  }
  return say(api,
    'IVO: KEEPER ANSEL says the old ones built a door for the river. A door for the souls. Can you imagine?',
  );
}

export async function mural(api: ScriptApi) {
  const f = flags();
  const fresh = !f.sawMural;
  f.sawMural = true;
  await say(api,
    'An ancient mural covers the wall.',
    'It shows LETHYS, the great serpent, swimming down the river with countless small lights behind it.',
    'They pass through a door in a great wall of stone. Above the door is a single word, worn away by time...',
    "'...PASS'",
  );
  if (fresh) await say(api, `BERYL will remember this mural. (Clues found: ${clueCount()} of 4)`);
  return true;
}

// --- Reedmouth: fishing rods, August Reeve ----------------------------------------------------

export async function sven(api: ScriptApi) {
  const f = flags();
  if (!f.gotGoodRod) {
    f.gotGoodRod = true;
    return say(api,
      "SVEN: Seventy years I've fished this delta. The fish are fewer now, but the good ones are still out there.",
      "SVEN: You've got the look of an angler. Take my GOOD ROD. It catches what the OLD ROD can't.",
      give('goodrod'),
      'SVEN: Face the water and use it from your BAG, or just talk to the water with A.',
    );
  }
  return say(api, 'SVEN: The deeper the water, the bigger the fish. Remember that.');
}

export async function reeve(api: ScriptApi) {
  const f = flags();
  if (!f.metReeve) {
    f.metReeve = true;
    return say(api,
      "AUGUST: You came! Sit, sit. Mind the MURKFIN, he bites.",
      'AUGUST: I founded the FLOWKEEPERS twenty years ago. Just fishers and farmers who missed the old river.',
      'AUGUST: When they built the dam, three villages went under MIRRORMERE. My grandparents lived in one of them.',
      'AUGUST: VESPER grew up hearing the same stories. But she stopped believing words could change anything.',
      'AUGUST: I still believe it. Maybe you can prove me right.',
      "AUGUST: Here, a fisher's gift. A trainer can always use a few of these.",
      give('superpotion', 3),
    );
  }
  if (f.ev7done) {
    return say(api,
      "AUGUST: VESPER... a bomb in the dam. I never wanted this. Thank the river you were there.",
      'AUGUST: Something is buried under that dam, BERYL. Something CREST is afraid of. Soon he will have to say it out loud.',
    );
  }
  return say(api,
    'AUGUST: My grandmother used to say: "The river always finds a way." I wonder what she would say about the dam.',
  );
}

// --- Weirhaven: office, dam, Ingrid -----------------------------------------------------------

export async function reception(api: ScriptApi) {
  const f = flags();
  if (!f.damOpen) {
    f.damOpen = true;
    return say(api,
      "RECEPTIONIST: Welcome to the LETHYS DAM COMPANY. Oh! You're the kid from STILLBROOK, aren't you?",
      'RECEPTIONIST: Your parents are working in the inner dam today. Go on through the door at the back, they will be glad to see you.',
    );
  }
  return say(api, 'RECEPTIONIST: The inner dam is through the door at the back. Mind the stairs!');
}

export async function crest(api: ScriptApi) {
  const f = flags();
  if (!f.metCrest) {
    f.metCrest = true;
    return say(api,
      'DIRECTOR CREST: Halvard Crest, director of the LETHYS DAM COMPANY. And you must be BERYL.',
      'DIRECTOR CREST: Your parents are two of my best people. Remarkable family.',
      'DIRECTOR CREST: This dam lights up all of KALDRIA. The FLOWKEEPERS see a wall. I see a promise kept for sixty years.',
      '...He looks out the window at the lake for a long moment.',
      'DIRECTOR CREST: Enjoy your journey, young trainer.',
    );
  }
  if (f.ev6) return say(api, "DIRECTOR CREST: The lower levels are closed for safety. That's all I can say. ...For now.");
  return say(api, 'DIRECTOR CREST: Every lamp in VALECROWN, every train, every screen. All thanks to this dam.');
}

export async function damParent(api: ScriptApi, who: 'mum' | 'dad') {
  const f = flags();
  if (f.decided) {
    const e = game.state.ending;
    if (who === 'mum') {
      return say(api, e === 'break'
        ? "MUM: We're helping to open the gates slowly, so the valley doesn't flood. Our last big job here!"
        : e === 'seal'
          ? 'MUM: The new wall goes up next month. INGRID is designing it. She says it will last a thousand years.'
          : "MUM: Listen... you can hear the river passing through the gate. It sounds almost happy.");
    }
    return say(api, "DAD: The CHAMPION's waiting, isn't she? Go on. We'll be watching the broadcast!");
  }
  if (who === 'mum') {
    return say(api,
      'MUM: BERYL! What a surprise! Look at you, a real trainer.',
      'MUM: This is where we work. The turbines turn the river into electricity for the whole region.',
      "MUM: Say hello to INGRID, she's the chief engineer. She worked with Grandma, long ago!",
    );
  }
  return say(api,
    'DAD: Hey, champ! Careful down here, it gets loud.',
    "DAD: See that hatch in the corner? Old maintenance tunnel. It's been bolted shut since before I started.",
  );
}

export async function ingridDam(api: ScriptApi) {
  const f = flags();
  if (!f.metIngrid) {
    f.metIngrid = true;
    return say(api,
      "INGRID: So you're BERYL! I'm INGRID MARLOW. I helped build this dam, back when your grandmother and I were young engineers.",
      "INGRID: She left the company the year it opened. Never told me why. Stubborn woman. Give her my love!",
      ...(nBadges() >= 3
        ? ['INGRID: Say, could you help me with something? Meet me at the PUMP STATION on MIRRORMERE SHORE, north of town.']
        : ['INGRID: Come back when you are a bit more experienced. I may have a job for a strong trainer.']),
    );
  }
  if (nBadges() >= 3 && !f.pumpQuest) return say(api, 'INGRID: Meet me at the PUMP STATION on MIRRORMERE SHORE, north of town. I need a strong trainer!');
  if (f.ev6 && !f.ev8) {
    return say(api,
      'INGRID: The pressure on the west wall keeps rising. The old plans say that wall was never ours. Something older is behind it.',
    );
  }
  return say(api, 'INGRID: Sixty years and she still hums the same tune. I love this old dam.');
}

export async function ingridShore(api: ScriptApi) {
  const f = flags();
  if (!f.pumpQuest) {
    f.pumpQuest = true;
    api.refresh();
    return say(api,
      'INGRID: BERYL! Over here! The pump station has stopped working. It pumps water from the lake up to the farms.',
      "INGRID: I think a wild POKéMON has got into the intake. It shocks anyone who comes near. Could you drive it out?",
    );
  }
  if (!f.pumpFixed) return say(api, 'INGRID: The pump station is right behind me. Be careful in there!');
  return say(api, 'INGRID: The farms have water again. Thank you!');
}

export async function pumpMon(api: ScriptApi) {
  const f = flags();
  await say(api, 'A MURKEEL is coiled around the pump, crackling with electricity!');
  const enemy = createPokemon('murkeel', Math.max(5, wildLevel(nBadges(), Math.random) + 3));
  const r = await api.battle({ kind: 'wild', enemy, bg: 'water' });
  if (r === 'lose') {
    await api.whiteOut();
    return true;
  }
  if (r === 'run') return say(api, 'The MURKEEL is still wrapped around the pump...');
  f.pumpFixed = true;
  api.refresh();
  await say(api,
    'The pump coughs, rattles... and starts running smoothly again.',
    'INGRID hurries in.',
    "INGRID: You did it! Listen to her purr! Thank you, BERYL.",
    "INGRID: I want you to have these. My old plans of the dam, from when we built it.",
    give('damplans'),
    "INGRID: See the west wall? Marked 'G'. We never built that part. It was already there when we came. Crest's people told us not to ask.",
    `INGRID: ...Funny, the things you remember. (Clues found: ${clueCount()} of 4)`,
  );
  save();
  return true;
}

export async function tunnelDoor(api: ScriptApi) {
  const f = flags();
  const fresh = !f.sawTunnel;
  f.sawTunnel = true;
  await say(api,
    'An enormous door of ancient stone, carved with waves and a great serpent.',
    'Someone has poured concrete into the gap, sealing it completely.',
    'Above the door, the carving reads: LET THE RIVER PASS.',
    'Behind it, faintly, something like singing...',
  );
  if (fresh) await say(api, `This must be the SOUL GATE from the old stories. (Clues found: ${clueCount()} of 4)`);
  return true;
}

// --- Lowbank letters and Grandma's riddle ---------------------------------------------------------

export async function ruinTable(api: ScriptApi) {
  const f = flags();
  if (nBadges() < 5 || f.gotLetters) return false;
  f.gotLetters = true;
  await say(api,
    'Under one of the cups, there is a loose board. Beneath it: a bundle of old letters, tied with ribbon.',
    give('letters'),
    "The top one is addressed in Grandma's handwriting: 'For Edvin, when the water comes.'",
    "'We moved the village up the river, like they asked. But we never forgot the door we left for the river.'",
    "'One day someone will open it again. I hope it is someone we love.'",
    `(Clues found: ${clueCount()} of 4)`,
  );
  save();
  return true;
}

export async function grandmaTalk(api: ScriptApi): Promise<boolean> {
  const f = flags();
  if (f.gotLetters && !f.readLetters) {
    f.readLetters = true;
    return say(api,
      'GRANDMA: Those letters... where did you find them? My, my. I wrote these when I was a girl.',
      'GRANDMA: We lived in LOWBANK, before the river was moved. And our village had a gate in the river wall. A door for the souls.',
      "GRANDMA: When the dam came, they built right over the old gate. I worked on it, BERYL. And I quit the day I saw them pour the concrete.",
      'GRANDMA: The river remembers everything. Maybe it is time somebody remembered the door.',
    );
  }
  if (nBadges() >= 5 && !f.gotLetters) {
    return say(api,
      'GRANDMA: Do you want to hear a riddle my mother taught me?',
      "GRANDMA: 'Two cups on a table where no one lives, by the bank where the river once ran. Look under what was left behind.'",
      'GRANDMA: Ha ha. I always wondered if anyone would ever solve it.',
    );
  }
  return false;
}

// --- Emberdeep fossils and Elvi ---------------------------------------------------------------------

export async function foreman(api: ScriptApi) {
  const f = flags();
  if (f.caveCleared) {
    return say(api, f.tookFossil
      ? "DAG: An old woman in FROSTSPRING knows how to wake up fossils. The spring water does something to them, she says."
      : 'DAG: We dug out two fossils back there. Go on, take one! The other goes to the museum.');
  }
  await say(api,
    "DAG: Hold it! Rockfalls all morning. A wild POKéMON is digging through the tunnel walls back there.",
    "DAG: It's a big CADDICAIRN. It keeps knocking rocks onto my crew. Think you can scare it off?",
  );
  if (!(await api.yesNo('Help FOREMAN DAG?'))) return say(api, 'DAG: Can\'t blame you. Mind the falling rocks!');
  const enemy = createPokemon('caddicairn', Math.max(22, wildLevel(nBadges(), Math.random) + 3));
  const r = await api.battle({ kind: 'wild', enemy, bg: 'cave' });
  if (r === 'lose') {
    await api.whiteOut();
    return true;
  }
  if (r === 'run') return say(api, 'DAG: It is still back there. Come back when you are ready.');
  f.caveCleared = true;
  await api.fadeOut(200);
  api.refresh();
  await api.fadeIn(200);
  await say(api,
    'DAG: The rumbling stopped! You did it!',
    "DAG: And look what the CADDICAIRN dug up while it was at it. Two fossils, up by the far wall. You've earned one!",
  );
  save();
  return true;
}

export async function fossil(api: ScriptApi, id: string) {
  const f = flags();
  const fin = id === 'fossilFin';
  const item = fin ? 'finfossil' : 'geodefossil';
  await say(api, ITEMS[item].desc);
  if (!(await api.yesNo(`Take the ${ITEMS[item].name}? The other one stays here.`))) return true;
  f.tookFossil = true;
  await say(api, give(item), 'The other fossil was carefully packed up by the miners.');
  await api.fadeOut(200);
  api.refresh();
  await api.fadeIn(200);
  save();
  return true;
}

const FOSSILS: Record<string, string> = { finfossil: 'raptide', geodefossil: 'geodling' };

export async function elvi(api: ScriptApi) {
  const s = game.state;
  const held = Object.keys(FOSSILS).find((id) => s.bag[id]);
  if (held) {
    await say(api,
      'ELVI: Oh my. That is a fossil, isn\'t it? From the time when the LETHYS ran wild.',
      'ELVI: The water of the spring is the oldest water in KALDRIA. It remembers what that creature was.',
    );
    if (!(await api.yesNo(`Let ELVI soak the ${ITEMS[held].name} in the spring?`))) return say(api, 'ELVI: Whenever you are ready, dear.');
    takeItem(held);
    await api.fadeOut(400);
    await api.wait(800);
    await api.fadeIn(400);
    const mon = createPokemon(FOSSILS[held], 25);
    mon.bond = 100;
    const where = receive(mon);
    await say(api,
      'The water shimmers. Something stirs inside the stone...',
      `The fossil came back to life as ${nameOf(mon)}!`,
      ...(where === 'box' ? [`${nameOf(mon)} was sent to the PC BOX.`] : []),
      'ELVI: There you are, little one. Welcome back to the world.',
    );
    save();
    return true;
  }
  if (flags().decided) {
    return say(api, flags().gateEnding
      ? 'ELVI: The spring feels lighter these days. As if the whole river let out a long breath. LETHYS has gone to the sea, I think.'
      : 'ELVI: LETHYS has come home to the spring. If you are strong, and kind, it may let you near.');
  }
  return say(api,
    'ELVI: I keep the SOURCE OF THE LETHYS. Every drop of the river begins right here.',
    'ELVI: If you ever find fossils, bring them to me. The spring water can wake things that have slept for ages.',
  );
}

// --- The ferry ---------------------------------------------------------------------------------------

const DOCKS: Record<string, { x: number; y: number; who: string }> = {
  stillbrook: { x: 20, y: 19, who: 'GRETA' },
  lanterncross: { x: 22, y: 13, who: 'TOBIN' },
  reedmouth: { x: 8, y: 15, who: 'MARLO' },
};

export async function ferry(api: ScriptApi, here: string) {
  const f = flags();
  const who = DOCKS[here].who;
  const towns = Object.keys(DOCKS).filter((t) => t !== here && f[`visited_${t}`]);
  await say(api, `${who}: All aboard the LETHYS FERRY! Where to?`);
  if (!towns.length) return say(api, `${who}: Hm, you haven't been anywhere downstream yet. Walk there once and I can take you any time.`);
  const i = await api.choose(towns.map((t) => MAPS[t].name), true);
  if (i < 0) return say(api, `${who}: Another time, then!`);
  const to = towns[i];
  await say(api, `${who}: Hold on tight!`);
  await api.warp(to, DOCKS[to].x, DOCKS[to].y, 'down');
  return say(api, `${DOCKS[to].who}: Here we are, ${MAPS[to].name}! Mind the step.`);
}

export function isDockTown(t: string) {
  return t in DOCKS;
}

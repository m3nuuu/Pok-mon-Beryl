// The main story after the prologue: the events at 2, 4, 5, 6, 7 and 8 badges, the finale on the
// dam crest with its three endings, the League and the Hall of Fame. See docs/GAME_PLAN.md.
import { createPokemon } from '../battle/engine';
import type { TeamMon } from '../data/mapkit';
import { addItem, game, save } from '../state';
import type { ScriptApi } from './api';
import { clueCount, clues, fight, flags, healParty, nBadges, nameOf, rivalTeam } from './common';

const say = (api: ScriptApi, ...l: string[]) => api.say(...l);

// --- 2 badges: the blackout in Stillbrook ------------------------------------------------

export async function blackout(api: ScriptApi) {
  const f = flags();
  f.ev2 = true;
  api.refresh();
  await api.wait(300);
  await say(api,
    'The street lamps are dark. Every window in STILLBROOK is black.',
  );
  await api.emote('jasperBlackout', 'exclaim');
  api.faceBeryl('jasperBlackout');
  await say(api,
    "JASPER: BERYL! You're back! The whole town has been without power since this morning!",
    'JASPER: The news says someone broke into the POWER PLANT in VALECROWN and shut it all down.',
    "JASPER: They're saying it was the FLOWKEEPERS. Those people who want to tear down the dam!",
    'JASPER: My dad says they just want the river to run free again... but this? Grandma had to cook on the old stove!',
    "JASPER: Whatever. How many badges have you got? Two? Me too. Let's see who trained harder!",
  );
  const { team, tier } = rivalTeam('blackout');
  const r = await fight(api, 'JASPER', team, tier, { canLose: true, prize: 40 });
  await say(api, r === 'win'
    ? "JASPER: Argh! Fine, you win this one. But I'm catching up, you'll see!"
    : "JASPER: Ha! I'm the stronger one now! ...Your POKéMON fought well though.");
  await say(api,
    'JASPER: Listen. Somebody has to go to VALECROWN and check that plant. ROUTE 2 leads there, east across the bridge.',
    "JASPER: I'd go, but Mum wants me at the PENSION. Go on, hero. Turn the lights back on!",
  );
  f.ev2done = true;
  await api.fadeOut(200);
  api.refresh();
  await api.fadeIn(200);
  save();
}

export async function plantVesper(api: ScriptApi) {
  const f = flags();
  api.faceBeryl('vesper');
  await say(api,
    "VESPER: Well, well. A child, in the middle of a FLOWKEEPER operation. Who let you in?",
    "VESPER: I am VESPER. AUGUST REEVE founded the FLOWKEEPERS, but he's too soft. Petitions, speeches...",
    "VESPER: The dam has stolen the river for sixty years. If KALDRIA won't listen, it can sit in the dark and think.",
    "VESPER: You want the lights back? Then make me move.",
  );
  const r = await fight(api, 'FLOWKEEPER VESPER', [{ species: 'wispjel', lv: -1 }, { species: 'murkeel', lv: 0 }], 'boss', { prize: 50, bg: 'indoor' });
  if (r === 'lose') return api.whiteOut();
  await say(api,
    "VESPER: ...Hmph. Strong, for a child.",
    'VESPER: Fine. Keep your precious lights. But ask yourself one thing, little hero:',
    'VESPER: Why does the reservoir get higher every year, while the ghosts in MIRRORMERE get louder?',
    'VESPER: FLOWKEEPERS, we are leaving!',
  );
  await api.fadeOut(300);
  f.plantDone = true;
  api.refresh();
  await api.fadeIn(300);
  await say(api,
    'The machines hum back to life. Somewhere far away, the lights of STILLBROOK come on again.',
    'ENGINEER: You chased them off! Thank you! Here, take this. We keep them for emergencies.',
    'BERYL received 3 HYPER POTIONS!',
  );
  addItem('hyperpotion', 3);
  save();
}

// --- 4 badges: the protest at Weirhaven ------------------------------------------------

export async function protest(api: ScriptApi) {
  const f = flags();
  f.ev4 = true;
  api.refresh();
  api.spawn('pReeve', 'reeve', 13, 17, 'left');
  api.spawn('pGrunt1', 'grunt', 14, 16, 'left');
  api.spawn('pGrunt2', 'grunt', 15, 17, 'left');
  api.spawn('pGrunt3', 'grunt', 14, 18, 'left');
  await api.wait(300);
  await say(api,
    'FLOWKEEPERS: FREE THE RIVER! FREE THE RIVER!',
    'A crowd of FLOWKEEPERS fills the square in front of the DAM COMPANY OFFICE.',
  );
  await say(api,
    'AUGUST: Friends! I am AUGUST REEVE. Forty years I fished the LETHYS at REEDMOUTH.',
    'AUGUST: The reeds are dying. The fish are leaving. The festival lanterns wash back up our banks instead of reaching the sea.',
    "AUGUST: We don't want to hurt anyone. We want the company to open its books, and let the river breathe!",
  );
  await api.emote('jasperProtest', 'exclaim');
  api.faceBeryl('jasperProtest');
  await say(api,
    "JASPER: BERYL! Can you believe these people? After what they did to the power plant!",
    "AUGUST: That wasn't us, boy. VESPER went her own way. I don't approve of what she did.",
    "JASPER: Sure. And who's going to pay my mum and dad, and yours, if the dam goes? Half of STILLBROOK works here!",
    "JASPER: I'm with the company. Come on, BERYL, show these people we can stand up for our families!",
    "JASPER: ...What, you're not sure? Then I'll battle you until you are!",
  );
  const { team, tier } = rivalTeam('protest');
  const r = await fight(api, 'JASPER', team, tier, { canLose: true, prize: 50 });
  await say(api, r === 'win'
    ? 'JASPER: You... beat me again. Maybe you just see something I don\'t.'
    : "JASPER: See? I'm right. ...Right?");
  await say(api,
    'AUGUST: Two friends, two sides of the same river. That is how it always starts.',
    'AUGUST: Young one. If you ever pass through REEDMOUTH, visit me. My door is the one by the reeds.',
    'AUGUST: Come, friends. We have said our piece today.',
  );
  await api.fadeOut(300);
  for (const id of ['pReeve', 'pGrunt1', 'pGrunt2', 'pGrunt3']) api.despawn(id);
  f.ev4done = true;
  api.refresh();
  await api.fadeIn(300);
  save();
}

// --- 5 badges: the egg / 6 badges: home worries ------------------------------------------

export async function egg(api: ScriptApi) {
  const f = flags();
  f.gotEgg = true;
  await api.emote('homemon', 'exclaim');
  await say(api,
    'GRANDMA: BERYL, dear! Welcome home. Come and look what your little friend has been guarding.',
    'The family POKéMON proudly nudges something round and warm towards you.',
    'GRANDMA: An EGG! It found it down by the old riverbank and wouldn\'t let anybody near it.',
    'GRANDMA: I think it wants you to take it along. Keep it close and it will hatch on your travels.',
    'BERYL received an EGG!',
  );
  game.state.egg = { species: 'shellet', steps: 600 };
  await api.emote('homemon', 'heart');
  save();
}

export async function homeWorries(api: ScriptApi) {
  const f = flags();
  f.ev6 = true;
  api.refresh();
  await api.wait(300);
  api.faceBeryl('mum');
  await say(api,
    "MUM: BERYL! Oh, it's so good to see you. Come here.",
    "MUM: We have to tell you something. The company announced job cuts today. A lot of people at the dam...",
    "DAD: And DIRECTOR CREST has closed the lower levels of the dam. Nobody goes down there. Not even the engineers.",
    "DAD: He says it's for safety. But the turbines are fine. Something else is going on down there.",
    "MUM: INGRID thinks the water pressure on the old west wall is wrong. Crest won't even let her look.",
  );
  api.spawn('hJasper', 'jasper', 6, 7, 'up');
  await api.emote('hJasper', 'exclaim');
  await say(api,
    'JASPER: Hey... sorry for barging in. I heard about the cuts. My dad is one of them.',
    "JASPER: I defended the company in WEIRHAVEN. I thought they were the good guys. Now I don't know anymore.",
    "JASPER: I don't know what to think, BERYL. So let's do the one thing I DO know. Battle me!",
  );
  const { team, tier } = rivalTeam('home');
  const r = await fight(api, 'JASPER', team, tier, { canLose: true, bg: 'indoor', prize: 60 });
  await say(api, r === 'win'
    ? "JASPER: Ha... you're really strong now. Thanks. My head feels clearer."
    : 'JASPER: Thanks, BERYL. I needed that.');
  await say(api,
    "JASPER: Whatever's down in that dam, we'll find out. Together, okay?",
    'DAD: You two be careful. The reservoir is higher than I have ever seen it.',
  );
  await api.fadeOut(300);
  api.despawn('hJasper');
  f.ev6done = true;
  healParty();
  api.refresh();
  await api.fadeIn(300);
  await say(api, 'GRANDMA: Your POKéMON look tired. Sit, eat something. ...There, all rested.');
  save();
}

// --- 7 badges: the reservoir rises -----------------------------------------------------

export async function reservoir(api: ScriptApi) {
  const f = flags();
  f.ev7 = true;
  f.damOpen = true;
  api.refresh();
  await api.shake(700);
  await say(api,
    'The ground trembles. The lake has risen right up to the edge of the town.',
    'Ghost POKéMON drift through the streets, pale and restless.',
  );
  await api.lethysAppears(26, 5, 0.9);
  await api.emote('player', 'exclaim');
  await say(api,
    'Out on MIRRORMERE, LETHYS rose from the water... and dived back under, towards the dam wall.',
    "FRIDA: BERYL! Thank goodness! The FLOWKEEPERS broke into the inner dam an hour ago!",
    'FRIDA: VESPER is with them. The guards say they carried crates in... crates marked EXPLOSIVE!',
    'FRIDA: The office door to the inner dam is open. Please, hurry!',
  );
  save();
}

export async function bombVesper(api: ScriptApi) {
  const f = flags();
  api.faceBeryl('vesperBomb');
  await say(api,
    'VESPER: You again. Of course.',
    'VESPER: The charges are on the west wall. One word from me and MIRRORMERE goes back where it belongs: down the valley.',
    'VESPER: STILLBROOK? WEIRHAVEN? They were built on drowned villages. Let them learn what that feels like.',
    'VESPER: No more speeches. Let the river decide!',
  );
  const team: TeamMon[] = [
    { species: 'wispjel', lv: -2 }, { species: 'murkeel', lv: -1 }, { species: 'caddibuzz', lv: -1 }, { species: 'wispjel', lv: 1 },
  ];
  const r = await fight(api, 'FLOWKEEPER VESPER', team, 'boss', { prize: 80, bg: 'indoor' });
  if (r === 'lose') return api.whiteOut();
  await say(api,
    "VESPER: ...You won't even let the river have this.",
    'INGRID: Got it! The detonator wires are cut. The charges are dead.',
    'VESPER: Laugh while you can. Ask your precious DIRECTOR what he sealed under this dam. Ask him about the gate!',
  );
  await api.fadeOut(300);
  f.ev7done = true;
  f.torvaldBack = true;
  api.refresh();
  await api.fadeIn(300);
  api.faceBeryl('ingrid');
  await say(api,
    "INGRID: VESPER slipped away in the chaos. But the dam is safe, thanks to you.",
    "INGRID: The lake is calming down. Listen... even the ghosts went quiet.",
    'INGRID: Oh, and someone was looking for you. TORVALD, JASPER\'s father. He came back to STILLBROOK to help.',
    "INGRID: He has opened the STILLBROOK GYM again. That's your eighth badge, isn't it?",
  );
  save();
}

// --- 8 badges: the truth on the dam crest ------------------------------------------------

export async function summons(api: ScriptApi) {
  const f = flags();
  f.ev8 = true;
  api.refresh();
  await say(api,
    'FRIDA: BERYL! DIRECTOR CREST has been asking for you.',
    'FRIDA: He went up to the DAM CREST with your parents, JASPER and... AUGUST REEVE? The guards have orders to let you through.',
    'FRIDA: The path to the crest is on the east side of town.',
  );
  save();
}

const CREST_CAST: [string, string, number, number, 'left' | 'right' | 'up' | 'down'][] = [
  ['cCrest', 'crest', 16, 3, 'left'],
  ['cReeve', 'reeve', 17, 4, 'left'],
  ['cJasper', 'jasper', 15, 4, 'left'],
  ['cMum', 'mum', 18, 3, 'left'],
  ['cDad', 'dad', 19, 4, 'left'],
];

export async function finale(api: ScriptApi) {
  const f = flags();
  const s = game.state;
  for (const [id, look, x, y, d] of CREST_CAST) api.spawn(id, look, x, y, d);
  if (!s.ending) {
    await finaleTalk(api);
  } else {
    await say(api, 'The wind howls over the dam. Everyone is still waiting for you.');
  }
  const won = await finalBattle(api);
  if (!won) return;
  f.decided = true;
  if (s.ending === 'gate') f.gateEnding = true;
  await epilogue(api);
  for (const [id] of CREST_CAST) api.despawn(id);
  api.despawn('cVesper');
  api.refresh();
  save();
}

async function finaleTalk(api: ScriptApi) {
  const s = game.state;
  await say(api,
    'DIRECTOR CREST: BERYL. Thank you for coming. And for saving my dam.',
    'DIRECTOR CREST: You have all eight badges now. People listen to trainers like you. So I will tell you the truth, here, in front of everyone.',
    'DIRECTOR CREST: When the dam was built in 1962, the builders found something under the old riverbed.',
    'DIRECTOR CREST: A wall of ancient stone, with a door in it. The old people of the valley called it the SOUL GATE.',
    'DIRECTOR CREST: They believed the dead travel down the LETHYS to the sea, and that the gate let them pass.',
    'DIRECTOR CREST: The company poured concrete over it. And it has been sealed ever since.',
  );
  await say(api,
    'AUGUST: And ever since, the souls have gathered in MIRRORMERE. The ghosts. The lanterns that come back. LETHYS, searching for a way through.',
    'MUM: The pressure on the west wall... INGRID was right. The river is pushing against that gate.',
    'DIRECTOR CREST: If nothing is done, the dam may fail on its own one day. So something must be done. The question is what.',
    'AUGUST: Break the dam. Give the river back. The villages, the reeds, the souls. All of it.',
    'DIRECTOR CREST: And leave VALECROWN and half of KALDRIA without power? Keep it sealed. Reinforce the wall. We can manage the ghosts.',
    'DAD: BERYL... everyone here is looking at you. What do you think?',
  );
  const n = clueCount();
  const opts = ['BREAK THE DAM', 'KEEP IT SEALED'];
  if (n >= 3) {
    await say(api,
      "BERYL thinks of GRAN's letters, INGRID's plans, the mural in the shrine and the stone door in the tunnel...",
      "'The door we left for the river.' There is a third way: open the SOUL GATE, and let the river pass through the dam.",
    );
    opts.push('OPEN THE SOUL GATE');
  }
  let pick = -1;
  for (;;) {
    pick = await api.choose(opts, false);
    if (await api.yesNo(`${opts[pick]}... Are you sure?`)) break;
  }
  s.ending = (['break', 'seal', 'gate'] as const)[pick];
  if (s.ending === 'break') {
    await say(api,
      'AUGUST: Thank you, child. The river thanks you.',
      "JASPER: No. NO. BERYL, my dad already lost his job! If the dam goes, STILLBROOK loses everything!",
      "JASPER: I can't let you do this. If you want to break the dam, you'll have to break through me first!",
    );
  } else if (s.ending === 'seal') {
    await say(api,
      'DIRECTOR CREST: A wise choice. Hard, but wise.',
      "JASPER: Wise? BERYL, you saw the ghosts! You saw LETHYS! They're trapped down there, and we're just going to pour more concrete on them?",
      "JASPER: I won't stand by and watch. If you want the dam sealed, you'll have to beat me!",
    );
  } else {
    await say(api,
      'INGRID: The gate! Of course. My old plans... the wall marked G. It was never part of the dam. It was there first.',
      "DIRECTOR CREST: Open the gate... and keep the dam? The river passes, the turbines still turn... Could it really work?",
      'JASPER: BERYL, you genius! The souls go free AND nobody loses their home!',
    );
    api.spawn('cVesper', 'vesper', 10, 3, 'right');
    await api.emote('cVesper', 'exclaim');
    await say(api,
      'VESPER: How touching. A little door, so everyone can feel good about themselves.',
      'VESPER: No! Sixty years of theft, and you want to forgive it with a doorway? The dam comes down. Today.',
      'JASPER: Not while we\'re here, VESPER! BERYL, she\'s yours. I\'ll keep her grunts busy!',
    );
  }
  save();
}

async function finalBattle(api: ScriptApi): Promise<boolean> {
  const s = game.state;
  let r;
  if (s.ending === 'gate') {
    const team: TeamMon[] = [
      { species: 'wispjel', lv: -2 }, { species: 'murkeel', lv: -2 }, { species: 'raptide', lv: -1 },
      { species: 'cindaroo', lv: -1 }, { species: 'geodling', lv: 1 },
    ];
    r = await fight(api, 'FLOWKEEPER VESPER', team, 'boss', { prize: 100, bg: 'water' });
  } else {
    const { team, tier } = rivalTeam('final');
    r = await fight(api, 'JASPER', team, tier, { prize: 100, bg: 'water' });
  }
  if (r === 'lose') {
    await api.whiteOut();
    return false;
  }
  return true;
}

async function epilogue(api: ScriptApi) {
  const ending = game.state.ending;
  if (ending === 'gate') {
    await say(api,
      'VESPER: ...So this is how it ends. With a door.',
      'AUGUST: Come home, VESPER. It is over. And for once, everybody won.',
    );
  } else {
    await say(api,
      "JASPER: ...I lost. Okay. Okay, BERYL. It's your call. It was always going to be your call.",
      "JASPER: I still don't agree. But I'll be there, whatever happens. That's what friends do.",
    );
  }
  await api.fadeOut(600);
  await api.wait(600);
  if (ending === 'break') {
    await say(api,
      'Over the next months, the spillway gates of MIRRORMERE DAM are opened, one by one.',
      'The lake sinks. The church tower of an old village sees the sun for the first time in sixty years.',
      "VALECROWN rations its power, and STILLBROOK's people rebuild on higher ground.",
      'And in the evening, the festival lanterns float all the way down to the sea.',
    );
  } else if (ending === 'seal') {
    await say(api,
      'The dam holds. Engineers pour a new wall behind the old one, and the lights of KALDRIA stay on.',
      'DIRECTOR CREST keeps his word: more water flows down to REEDMOUTH every spring, and the reeds slowly recover.',
      'But on quiet nights, people in WEIRHAVEN still hear singing from the lake. Low, like a whale.',
    );
  } else {
    await say(api,
      'INGRID and the engineers cut through the concrete in the maintenance tunnel. Behind it, the old stone door stands unharmed.',
      'When it opens, the river rushes through. The turbines keep turning. And the ghosts of MIRRORMERE drift out with the current.',
      'All the way down the valley, people see lights on the water that are not lanterns.',
      'Far downstream, at the mouth of the LETHYS, something huge and graceful reaches the sea.',
    );
  }
  await api.fadeIn(600);
  await say(api,
    'DIRECTOR CREST: Whatever comes now, KALDRIA will remember who stood on this wall.',
    "MUM: We're so proud of you, BERYL.",
    'DAD: Oh! And the LEAGUE sent word. With the crisis over, VICTORY ROAD in REEDMOUTH is open again.',
    "JASPER: The LEAGUE! BERYL, I'll see you on VICTORY ROAD. And this time, I'm winning!",
  );
}

// --- the League ------------------------------------------------------------------------------

export async function victoryJasper(api: ScriptApi) {
  const f = flags();
  api.faceBeryl('jasperVR');
  await say(api,
    "JASPER: There you are! I've been training here every day since the dam.",
    "JASPER: From the source to the sea, Professor SPRUCE said. Well, this is the sea. Let's finish what we started in STILLBROOK!",
  );
  const { team, tier } = rivalTeam('victory');
  const r = await fight(api, 'JASPER', team, tier, { prize: 120 });
  if (r === 'lose') return api.whiteOut();
  await say(api,
    "JASPER: ...Yeah. You're the real deal, BERYL. Always were.",
    "JASPER: Go and beat the CHAMPION. Then come home. Grandma's making a cake, I bet.",
  );
  await api.fadeOut(300);
  f.rivalVR = true;
  api.refresh();
  await api.fadeIn(300);
  save();
}

export async function champion(api: ScriptApi) {
  const f = flags();
  if (!['wren', 'bramble', 'kestrel', 'morgrave'].every((id) => f[`elite_${id}`])) {
    return say(api, 'SOLENNE: Face the ELITE FOUR first, young trainer.');
  }
  await say(api,
    'SOLENNE: Welcome, BERYL. I am SOLENNE, CHAMPION of KALDRIA.',
    'SOLENNE: I watched what happened at MIRRORMERE. You stood between a river and a nation, and you chose.',
    'SOLENNE: Every trainer who reaches this room has a story. Now let me see the strength behind yours!',
  );
  const team: TeamMon[] = [
    { species: 'lochoral', lv: 60 }, { species: 'jetwing', lv: 59 }, { species: 'pixcygnus', lv: 59 },
    { species: 'mosshart', lv: 60 }, { species: 'wispedusa', lv: 60 }, { species: 'geodragon', lv: 62 },
  ];
  const r = await fight(api, 'CHAMPION SOLENNE', team, 'fixed', { prize: 200, bg: 'indoor' });
  if (r === 'lose') return api.whiteOut();
  await say(api,
    'SOLENNE: ...Wonderful. The river has a new CHAMPION.',
    'SOLENNE: Come. Your name belongs in the HALL OF FAME.',
  );
  await hallOfFame(api);
}

async function hallOfFame(api: ScriptApi) {
  const f = flags();
  const s = game.state;
  await api.fadeOut(500);
  await say(api,
    'HALL OF FAME',
    ...s.party.map((p) => `${nameOf(p)}  Lv${p.level}`),
    `CHAMPION BERYL. POKéDEX: ${Object.keys(s.caught).length} caught.`,
  );
  f.hallOfFame = true;
  save();
  const ending = { break: 'The river runs free.', seal: 'The dam still stands.', gate: 'The soul gate is open.' }[s.ending ?? 'gate'];
  await api.credits([
    '# POKéMON BERYL',
    '',
    'A fan game made for Manuel',
    '',
    '# STORY & WORLD',
    'Manuel',
    '',
    '# GAME DESIGN & PROGRAMMING',
    'Claude',
    '',
    '# THE REGION OF KALDRIA',
    'Stillbrook  Lanterncross  Reedmouth',
    'Valecrown  Weirhaven  Cragmoor',
    'Pinehollow  Frostspring',
    '',
    '# GYM LEADERS',
    'Isolde  Brannock  Maren  Nerissa',
    'Oda  Cassian  Sedge  Torvald',
    '',
    '# ELITE FOUR',
    'Wren  Bramble  Kestrel  Morgrave',
    '',
    '# CHAMPION',
    'Solenne',
    '',
    '# AND',
    'Jasper, Grandma, Prof. Spruce',
    'August Reeve, Ingrid Marlow, Vesper',
    '',
    ending,
    '',
    'Thank you for playing!',
  ]);
  await api.fadeOut(10);
  await api.warp('home', 5, 6, 'up');
  await say(api,
    'GRANDMA: Welcome home, CHAMPION. The whole town is talking about you.',
    'PROF. SPRUCE is here too. He wants to see your POKéDEX.',
  );
  save();
}

/** The river spirit, at the source or at the delta after the ending. */
export async function lethysEncounter(api: ScriptApi, id: string) {
  const f = flags();
  await say(api, 'LETHYS rises from the water and looks at BERYL with ancient, gentle eyes.', 'It seems to be waiting.');
  if (!(await api.yesNo('Will you challenge LETHYS?'))) return;
  const r = await api.battle({ kind: 'wild', enemy: createPokemon('lethys', 60), legendary: true, bg: 'water' });
  if (r === 'lose') return api.whiteOut();
  if (r === 'caught') {
    f.lethysDone = true;
    api.refresh();
  } else {
    api.despawn(id);
    await say(api, 'LETHYS sank back beneath the surface. It will surely return to this place.');
  }
  save();
}

/** Hints after each badge, so Beryl knows where the story continues. */
export async function badgeHint(api: ScriptApi) {
  const f = flags();
  const n = nBadges();
  if (n === 2 && !f.ev2) return say(api, 'BERYL overhears someone: "Did you hear? The lights went out in STILLBROOK!"');
  if (n === 4 && !f.ev4) return say(api, 'People are talking about a big FLOWKEEPER protest in WEIRHAVEN.');
  if (n === 5 && !f.gotEgg) return say(api, 'For some reason, BERYL suddenly misses home. Maybe GRANDMA has news.');
  if (n === 6 && !f.ev6) return say(api, "A note from MUM was delivered to the POKéMON CENTER: 'Come home soon. We need to talk.'");
  if (n === 7 && !f.ev7) return say(api, 'News flash: the water level at MIRRORMERE is rising fast! WEIRHAVEN is on alert!');
  if (n === 8 && !f.ev8) {
    const c = clues();
    return say(api,
      'All eight badges! A messenger arrives: DIRECTOR CREST asks to meet BERYL in WEIRHAVEN.',
      `BERYL has found ${c.filter((x) => x.found).length} of 4 clues about the old river.`,
    );
  }
}

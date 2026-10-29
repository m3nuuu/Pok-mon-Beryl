import { createPokemon, heal, movesKnownAt, rivalStarterFor, type Pokemon } from '../battle/engine';
import { MOVES } from '../data/moves';
import { SPECIES } from '../data/species';
import { game, save, HOME_DOOR } from '../state';
import type { ScriptApi } from './api';

// The prologue, scene by scene. Each scene is gated by story flags, so a
// reloaded save picks up at the right point:
//   woke → parentsLeft → metJasperDad → metJasperMom → gotStarter → taskGiven → prologueDone

const flags = () => game.state.flags;
const nameOf = (p: Pokemon) => SPECIES[p.species].name.toUpperCase();

export async function onEnterMap(api: ScriptApi): Promise<void> {
  const f = flags();
  if (api.mapId === 'home' && !f.woke) return morning(api);
  if (api.mapId === 'home' && f.metJasperMom && !f.gotStarter) return spruceVisit(api);
  if (api.mapId === 'stillbrook' && f.gotStarter && !f.taskGiven) return firstBattle(api);
  if (f.taskGiven && !f.prologueDone) return evening(api);
}

export async function onStepGrassWithoutPokemon(api: ScriptApi): Promise<void> {
  if (!flags().parentsLeft) return api.say("You shouldn't go into the tall grass without a POKéMON.");
  await api.emote('follower', 'exclaim');
  await api.say(
    'Your family POKéMON tugs at your sleeve.',
    "It doesn't want you to go into the tall grass without a POKéMON of your own.",
  );
}

/** Talking to an NPC. Returns false to fall back to the default "..." line. */
export async function onTalk(api: ScriptApi, id: string): Promise<boolean> {
  const f = flags();
  const has = game.state.party.length > 0;
  const say = (...l: string[]) => api.say(...l).then(() => true);

  switch (id) {
    case 'mum':
      return say("MUM: Morning, sweetie! We're off to the dam soon.");
    case 'dad':
      return say('DAD: The spillway gates need checking again. Busy day!');

    case 'grandma':
      if (api.mapId === 'stillbrook') return say('GRANDMA: The river remembers everything. Listen to it.');
      if (!f.parentsLeft) return say('GRANDMA: Breakfast is almost ready, dear.');
      if (!f.gotStarter) {
        return say(
          'GRANDMA: Your little friend wants to play. Why not go and see JASPER?',
          'His house is just across the path.',
        );
      }
      for (const p of game.state.party) heal(p);
      return say(
        'GRANDMA: Welcome home, dear. Sit down and let your POKéMON rest a little.',
        'Your POKéMON were fully healed!',
      );

    case 'homemon':
      await api.emote('homemon', 'heart');
      return say('Your family POKéMON nuzzles you happily.');

    case 'jasperDad':
      if (!f.metJasperDad) return meetJasperDad(api).then(() => true);
      return say(
        "JASPER'S DAD: I train at the STILLBROOK GYM. FIGHTING-type POKéMON, all the way!",
        'The GYM opens again once the season starts. Come by when you have a team.',
      );

    case 'jasperMom':
      if (f.metJasperDad && !f.metJasperMom) return meetJasperMom(api).then(() => true);
      if (!f.metJasperMom) return say("JASPER'S MUM: Hello, BERYL! JASPER is still at home, I think.");
      return say(
        "JASPER'S MUM: We look after POKéMON while their trainers travel.",
        "Come back once you've been on the road a while. I might have something useful for you.",
      );

    case 'jasper':
      if (api.mapId === 'jasperHome') return meetJasperDad(api).then(() => true);
      if (api.mapId === 'pension') return meetJasperMom(api).then(() => true);
      if (!has) return say('JASPER: Come on, BERYL! The professor is waiting!');
      return say(
        f.rivalWon
          ? "JASPER: Told you I'd win! But don't worry, you'll get me next time... maybe."
          : "JASPER: Next time I win, for sure! I'll train way harder than you.",
        "JASPER: Dad says a real trainer needs all eight badges. ROUTE 1 opens soon, and I'm getting them first!",
      );

    case 'spruce':
      return say(
        'PROF. SPRUCE: The LETHYS carries more than water, you know. Old stories, too...',
        'Ask your grandma about it sometime.',
      );

    case 'guard':
      return say(
        'DAM GUARD: Sorry, kid. Staff only beyond this door.',
        'Your mum and dad are hard at work in there today.',
      );

    case 'neighbor':
      if (f.prologueDone) {
        return say(
          'NEIGHBOR: Someone saw something big in the river last night!',
          'A water serpent, they said. Just like in the old stories...',
        );
      }
      return say(
        'NEIGHBOR: Have you heard? People keep seeing ghost POKéMON by the river at night.',
        "My grandmother said the river wasn't always this quiet...",
      );

    case 'fisher':
      await fisherman(api);
      return true;

    case 'ferry':
      if (f.prologueDone) {
        return say(
          'FERRY KEEPER: Did you sleep well, BERYL?',
          "Don't tell anyone, but I've only seen LETHYS twice in my life. Last night was the second time.",
        );
      }
      return say('FERRY KEEPER: The river is calm tonight.');

    case 'penPipwing':
      return say('PIPWING is dozing in the sun.');
    case 'penMurkfin':
      return say('MURKFIN splashes around in its water bowl.');
  }
  return false;
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

async function meetJasperDad(api: ScriptApi) {
  const f = flags();
  api.faceBeryl('jasperDad');
  await api.say(
    "JASPER'S DAD: Well, if it isn't BERYL! JASPER has been bouncing off the walls all morning.",
    "JASPER'S DAD: I train at the STILLBROOK GYM. FIGHTING type, through and through!",
    "JASPER'S DAD: Maybe one day you two will battle me there. Ha ha!",
  );
  api.faceBeryl('jasper');
  await api.say(
    'JASPER: BERYL! Finally!',
    "JASPER: Let's go see my mum at the POKéMON PENSION. She's got new POKéMON there!",
    "JASPER: Race you! It's the green roof across the bridge path!",
  );
  await api.fadeOut(200);
  f.metJasperDad = true;
  api.refresh();
  await api.fadeIn(200);
}

async function meetJasperMom(api: ScriptApi) {
  const f = flags();
  api.faceBeryl('jasperMom');
  await api.say(
    "JASPER'S MUM: Hello, BERYL! And your family's little one too. Welcome to the PENSION!",
    "JASPER'S MUM: That PIPWING and MURKFIN are staying with us while their trainers travel.",
  );
  await api.emote('jasper', 'exclaim');
  await api.say(
    "JASPER: Mum! Who was that old man walking up to BERYL's house?",
    "JASPER'S MUM: Oh, that was PROF. SPRUCE! He's having tea with your grandma, BERYL.",
    'JASPER: The POKéMON professor?! Come on, BERYL, hurry!',
  );
  await api.fadeOut(200);
  f.metJasperMom = true;
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
  game.state.party.push(mon);
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
    'PROF. SPRUCE: Take today to get to know your partner. ROUTE 1 will still be there tomorrow.',
  );
  f.hasDex = true;
  f.taskGiven = true;
  api.refresh();
  await evening(api);
}

async function evening(api: ScriptApi) {
  const f = flags();
  await api.say('That evening...');
  await api.warp('stillbrook', 21, 19, 'right', () => api.setEvening(true));
  api.face('ferry', 'right');
  await api.say(
    'FERRY KEEPER: Evening, BERYL. Come to watch the river with me?',
    'FERRY KEEPER: Off on a journey tomorrow, I heard. The whole town is talking about it.',
  );
  await api.wait(500);
  await api.lethysAppears(23, 18);
  await api.emote('player', 'exclaim');
  await api.say(
    'FERRY KEEPER: Did you see that?! That was LETHYS, the spirit of the river!',
    'FERRY KEEPER: My grandmother told me it only comes when the region needs its hero.',
    'FERRY KEEPER: ...But everything seems fine, doesn\'t it?',
  );
  await api.fadeOut(600);
  await api.say('The next morning...');
  f.prologueDone = true;
  await api.warp(HOME_DOOR.map, HOME_DOOR.x, HOME_DOOR.y, HOME_DOOR.facing, () => api.setEvening(false));
  await api.say(
    'GRANDMA (from the door): Have a good day, dear! Come home whenever your POKéMON need a rest.',
    'END OF PROLOGUE. Thanks for playing! ROUTE 1 and WEIRHAVEN come in the next chapter.',
  );
  save();
}

async function fisherman(api: ScriptApi) {
  const s = game.state;
  if (s.party.length === 0) {
    await api.say("FISHERMAN: The fish are biting today! Come back with a POKéMON and I'll show you my catch.");
    return;
  }
  if (s.flags.fisherBattle) {
    await api.say(
      "FISHERMAN: MURKFIN don't look like much. But my grandpa swore...",
      'the ones that grow up in the strong current below the dam turn into something else entirely!',
    );
    return;
  }
  await api.say('FISHERMAN: The LETHYS ran wild before the dam, my grandpa said. Look what I just fished up!');
  if (!(await api.yesNo('FISHERMAN: Want to battle my MURKFIN?'))) {
    await api.say('FISHERMAN: Suit yourself!');
    return;
  }
  const result = await api.battle({ kind: 'trainer', trainerName: 'FISHERMAN', enemy: createPokemon('murkfin', 5), bg: 'water' });
  if (result === 'lose') {
    await api.whiteOut();
    return;
  }
  s.flags.fisherBattle = true;
  await api.say('FISHERMAN: Ha! Fair and square. MURKFIN is better at splashing than battling.');
  save();
}

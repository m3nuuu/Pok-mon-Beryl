// The eight gyms. Every gym uses the same hall; leaders scale with the badges you already have.
// Teams use the Pokémon that exist so far, with type-fitting moves, until Manuel's list arrives.
import { has, trainer, type Building, type MapDef, type NpcDef, type TeamMon } from '../mapkit';
import { gymMap } from './interiors';

const t = (species: string, lv: number, moves?: string[]): TeamMon => ({ species, lv, moves });

interface GymDef {
  town: string;
  townName: string;
  type: string;
  leader: { name: string; look: string; badge: string; intro: string[]; defeat: string[]; after: string[]; team: TeamMon[] };
  trainers: [{ name: string; look: string; team: TeamMon[]; intro: string; defeat: string }, { name: string; look: string; team: TeamMon[]; intro: string; defeat: string }];
}

export const GYMS: GymDef[] = [
  {
    town: 'frostspring', townName: 'FROSTSPRING', type: 'Ice',
    leader: {
      name: 'ISOLDE', look: 'isolde', badge: 'FROST BADGE',
      intro: [
        "ISOLDE: Welcome to the source of the LETHYS. Every drop of the river starts here, as ice.",
        'ISOLDE: Ice is patient. It waits, it holds, and then it breaks mountains. Show me your patience!',
      ],
      defeat: ['ISOLDE: The ice melts and the river flows on... You have earned the FROST BADGE.'],
      after: ['ISOLDE: The spring is purest at dawn. Old ELVI by the water knows more about it than anyone.'],
      team: [
        t('lochlet', -3, ['powdersnow', 'bubble', 'bite', 'growl']),
        t('newtide', -2, ['icywind', 'aquajet', 'bite', 'bubblebeam']),
        t('raptide', -2, ['icefang', 'rocktomb', 'aquajet', 'bite']),
        t('pipwing', -1, ['icywind', 'wingattack', 'agility', 'aerialace']),
        t('lochlet', -1, ['icebeam', 'bodyslam', 'reefsong', 'dragonbreath']),
        t('murkeel', 0, ['icefang', 'thunderbolt', 'surf', 'icebeam']),
      ],
    },
    trainers: [
      { name: 'SKIER LENA', look: 'skier', team: [t('lochlet', 0, ['powdersnow', 'watergun']), t('pipwing', 0)], intro: 'The snow up here is perfect. Battle me!', defeat: 'Brr... I lost my footing.' },
      { name: 'SKIER TOMAS', look: 'skier', team: [t('newtide', 0, ['icywind', 'watergun', 'bite'])], intro: 'ISOLDE taught me to keep cool. Watch!', defeat: "I'm frozen stiff..." },
    ],
  },
  {
    town: 'cragmoor', townName: 'CRAGMOOR', type: 'Rock',
    leader: {
      name: 'BRANNOCK', look: 'brannock', badge: 'CAIRN BADGE',
      intro: [
        "BRANNOCK: Ha! Another one who wants to crack the CRAGMOOR rock? We dig, we haul, we don't give up.",
        "BRANNOCK: My POKéMON are as hard as the mountain. Let's see you move them!",
      ],
      defeat: ["BRANNOCK: Well, I'll be. You moved the mountain. Take the CAIRN BADGE, you earned it."],
      after: ['BRANNOCK: The miners in EMBERDEEP CAVE have hit some odd rock. Give them a hand, will you?'],
      team: [
        t('caddibuzz', -3, ['rocktomb', 'bugbite', 'harden', 'rockthrow']),
        t('geodling', -2, ['rockthrow', 'harden', 'ancientpower', 'twister']),
        t('raptide', -2, ['rocktomb', 'aquajet', 'bite', 'gemlash']),
        t('caddibuzz', -1, ['rockslide', 'xscissor', 'pebblecase', 'stoneedge']),
        t('raptide', -1, ['gemlash', 'waterfall', 'rockslide', 'stoneedge']),
        t('geodling', 0, ['powergem', 'dragonpulse', 'geodeburst', 'irondefense']),
      ],
    },
    trainers: [
      { name: 'HIKER GUNNAR', look: 'hiker', team: [t('geodling', 0), t('caddibuzz', -1)], intro: 'I climbed every peak around here. You next!', defeat: 'Rockslide! On me!' },
      { name: 'MINER ODIL', look: 'miner', team: [t('caddibuzz', 0, ['rockthrow', 'bugbite', 'harden'])], intro: 'Dug through a mountain for this badge. Not giving it up!', defeat: 'Back to the mine...' },
    ],
  },
  {
    town: 'pinehollow', townName: 'PINEHOLLOW', type: 'Dragon',
    leader: {
      name: 'MAREN', look: 'maren', badge: 'SCALE BADGE',
      intro: [
        'MAREN: Dragons once nested in MOSSVEIL WOOD, when the river ran wild. They are few now.',
        "MAREN: The ones that stayed are proud and old. Earn their respect, if you can.",
      ],
      defeat: ['MAREN: The dragons bow to you. Here, the SCALE BADGE.'],
      after: ['MAREN: Dragons remember the old river. They are restless lately. So is the LETHYS, I think.'],
      team: [
        t('geodling', -3, ['twister', 'rockthrow', 'harden', 'dragonbreath']),
        t('lochlet', -2, ['twister', 'bite', 'bubble', 'reefsong']),
        t('newtide', -2, ['dragonbreath', 'aquajet', 'bite', 'bubblebeam']),
        t('geodling', -1, ['dragonclaw', 'powergem', 'dragondance', 'rockslide']),
        t('newtide', -1, ['dragonpulse', 'airslash', 'surf', 'agility']),
        t('lochlet', 0, ['dragonpulse', 'surf', 'icebeam', 'reefsong']),
      ],
    },
    trainers: [
      { name: 'ACE TAMSIN', look: 'ace', team: [t('geodling', 0, ['twister', 'rockthrow'])], intro: "Dragons don't scare me. Do they scare you?", defeat: 'Okay, you are scarier.' },
      { name: 'ACE CORVIN', look: 'ace', team: [t('lochlet', -1, ['twister', 'bite']), t('pipwing', -1)], intro: 'MAREN only lets the best train here.', defeat: 'I need more training...' },
    ],
  },
  {
    town: 'weirhaven', townName: 'WEIRHAVEN', type: 'Water',
    leader: {
      name: 'NERISSA', look: 'nerissa', badge: 'TIDE BADGE',
      intro: [
        'NERISSA: MIRRORMERE is the biggest lake in KALDRIA. And I know every current in it.',
        "NERISSA: The company built this town, but the water was here first. Let's see if you can swim!",
      ],
      defeat: ['NERISSA: You rode the wave all the way. The TIDE BADGE is yours.'],
      after: ["NERISSA: The water level keeps changing at night. The company says it's nothing. I'm not so sure."],
      team: [
        t('lochlet', -3, ['watergun', 'bite', 'bubble']),
        t('newtide', -2, ['bubblebeam', 'aquajet', 'bite']),
        t('murkeel', -2, ['spark', 'bubblebeam', 'bite', 'thunderwave']),
        t('raptide', -1, ['waterfall', 'rocktomb', 'aquajet', 'bite']),
        t('lochlet', -1, ['surf', 'reefsong', 'bodyslam', 'icywind']),
        t('newtide', 0, ['hydropump', 'airslash', 'dragonpulse', 'agility']),
      ],
    },
    trainers: [
      { name: 'SWIMMER IDA', look: 'swimmer', team: [t('newtide', 0, ['watergun', 'aquajet'])], intro: 'I swim across MIRRORMERE every morning!', defeat: 'Glub...' },
      { name: 'SAILOR HAAK', look: 'sailor', team: [t('murkfin', 1), t('lochlet', -1)], intro: 'Ahoy! Ready to get soaked?', defeat: 'Sunk like an anchor!' },
    ],
  },
  {
    town: 'lanterncross', townName: 'LANTERNCROSS', type: 'Ghost',
    leader: {
      name: 'ODA', look: 'oda', badge: 'LANTERN BADGE',
      intro: [
        'ODA: Every autumn we send lanterns down the LETHYS for those we have lost.',
        'ODA: My POKéMON walk between this world and the next. Do you have the courage to face them?',
      ],
      defeat: ['ODA: The lanterns burn bright for you. Take the LANTERN BADGE.'],
      after: ['ODA: Have you seen the old mural in our shrine? The river flows right through a wall in it. Strange, no?'],
      team: [
        t('wispjel', -3, ['astonish', 'lick', 'thundershock', 'hex']),
        t('cindaroo', -2, ['astonish', 'ember', 'flamewheel', 'willowisp']),
        t('wispjel', -2, ['hex', 'shockwave', 'plasmagrasp', 'thunderwave']),
        t('cindaroo', -1, ['shadowpunch', 'flamethrower', 'willowisp', 'shadowclaw']),
        t('wispjel', -1, ['shadowball', 'thunderbolt', 'recover', 'thunderwave']),
        t('wispjel', 0, ['shadowball', 'thunderbolt', 'recover', 'hex']),
      ],
    },
    trainers: [
      { name: 'MEDIUM SALLA', look: 'medium', team: [t('wispjel', 0, ['astonish', 'lick'])], intro: 'The spirits whisper your name...', defeat: 'The spirits have gone quiet.' },
      { name: 'MEDIUM URS', look: 'medium', team: [t('wispjel', -1), t('cindaroo', -1, ['astonish', 'ember'])], intro: 'Do you believe in ghosts? You will.', defeat: 'Boo... hoo.' },
    ],
  },
  {
    town: 'valecrown', townName: 'VALECROWN', type: 'Electric',
    leader: {
      name: 'CASSIAN', look: 'cassian', badge: 'VOLT BADGE',
      intro: [
        'CASSIAN: VALECROWN never sleeps. Every light in this city runs on the dam.',
        "CASSIAN: Power is everything. Let's see how much you can handle!",
      ],
      defeat: ['CASSIAN: Short-circuited! Fine, the VOLT BADGE is yours.'],
      after: ["CASSIAN: If the dam ever went dark, this city would stop dead. People don't like to think about that."],
      team: [
        t('pixling', -3, ['thundershock', 'quickattack', 'thunderwave', 'peck']),
        t('wispjel', -2, ['spark', 'lick', 'thunderwave']),
        t('pixling', -2, ['spark', 'wingattack', 'thunderwave', 'visorbeam']),
        t('murkeel', -1, ['spark', 'bite', 'surf', 'thunderwave']),
        t('wispjel', -1, ['thunderbolt', 'shadowball', 'recover', 'plasmagrasp']),
        t('pixling', 0, ['thunderbolt', 'airslash', 'agility', 'visorbeam']),
      ],
    },
    trainers: [
      { name: 'ENGINEER PIM', look: 'worker', team: [t('pixling', 0, ['thundershock', 'peck'])], intro: 'I keep the city lights on. Watch this spark!', defeat: 'Power outage...' },
      { name: 'ENGINEER KAI', look: 'worker', team: [t('wispjel', -1), t('pixling', -1)], intro: 'High voltage ahead!', defeat: 'Fuse blown!' },
    ],
  },
  {
    town: 'reedmouth', townName: 'REEDMOUTH', type: 'Grass',
    leader: {
      name: 'SEDGE', look: 'sedge', badge: 'REED BADGE',
      intro: [
        'SEDGE: The delta used to be green for miles. Now look at it. The reeds are drying out.',
        "SEDGE: My POKéMON grew up in what's left of it. They are tougher than they look!",
      ],
      defeat: ['SEDGE: You have the roots of a real trainer. Take the REED BADGE.'],
      after: ['SEDGE: Old AUGUST down by the water has a lot to say about the river. Listen to him, but think for yourself.'],
      team: [
        t('caddibuzz', -3, ['absorb', 'bugbite', 'stunspore']),
        t('mossfawn', -2, ['razorleaf', 'stunspore', 'absorb']),
        t('hivecub', -2, ['megadrain', 'fairywind', 'sleeppowder']),
        t('mossfawn', -1, ['gigadrain', 'rocktomb', 'growth', 'sleeppowder']),
        t('caddibuzz', -1, ['xscissor', 'gigadrain', 'rockslide', 'pebblecase']),
        t('mossfawn', 0, ['leafblade', 'nightslash', 'swordsdance', 'stoneedge']),
      ],
    },
    trainers: [
      { name: 'PICNICKER AVA', look: 'lass', team: [t('mossfawn', 0, ['absorb', 'tackle'])], intro: 'The delta is my garden!', defeat: 'My flowers wilted...' },
      { name: 'CAMPER ROB', look: 'youngster', team: [t('caddibuzz', -1), t('hivecub', -1)], intro: 'I camp in the reeds every summer!', defeat: 'Time to pack up.' },
    ],
  },
  {
    town: 'stillbrook', townName: 'STILLBROOK', type: 'Fighting',
    leader: {
      name: 'TORVALD', look: 'jasperDad', badge: 'FIST BADGE',
      intro: [
        "TORVALD: BERYL! I knew you'd come. JASPER talks about you every single day, you know.",
        "TORVALD: Fighting POKéMON don't quit. Neither do I. Give me everything you've got!",
      ],
      defeat: ["TORVALD: Ha ha ha! That's how it's done! The FIST BADGE, and my respect."],
      after: ["TORVALD: Whatever happens at the dam, look out for JASPER. He's more scared than he shows."],
      team: [
        t('hivecub', -3, ['rocksmash', 'headbutt', 'bulkup', 'charm']),
        t('cindaroo', -2, ['karatechop', 'bulkup', 'flamewheel', 'quickattack']),
        t('raptide', -2, ['brickbreak', 'rocktomb', 'aquajet', 'bite']),
        t('hivecub', -1, ['hammerarm', 'honeyhug', 'bulkup', 'playrough']),
        t('cindaroo', -1, ['crosschop', 'brickbreak', 'firefang', 'bulkup']),
        t('hivecub', 0, ['hammerarm', 'crosschop', 'honeyhug', 'bulkup']),
      ],
    },
    trainers: [
      { name: 'BLACKBELT DORN', look: 'blackbelt', team: [t('hivecub', 0, ['rocksmash', 'tackle'])], intro: 'HAAA! TORVALD trains us hard!', defeat: 'OSU! Well fought.' },
      { name: 'BLACKBELT MIKA', look: 'blackbelt', team: [t('cindaroo', -1, ['karatechop', 'ember']), t('hivecub', -1)], intro: 'My fists are ready!', defeat: "I'll do a hundred push-ups for this." },
    ],
  },
];

export function gymNpcs(g: GymDef): NpcDef[] {
  const [a, b] = g.trainers;
  const tr = (id: string, x: number, y: number, facing: 'left' | 'right', d: typeof a) =>
    trainer(id, x, y, facing, d.look, { name: d.name, team: d.team, tier: 'gym', prize: 40, intro: [d.intro], defeat: [d.defeat], sight: 5 });
  const L = g.leader;
  const flag = `badge_${g.town}`;
  return [
    tr('gymA', 3, 8, 'right', a),
    tr('gymB', 11, 5, 'left', b),
    {
      id: 'leader', name: L.name, x: 7, y: 2, facing: 'down', look: L.look,
      trainer: {
        name: `LEADER ${L.name}`, team: L.team, tier: 'leader', prize: 100, sight: 0, scaleTeam: true, smart: true,
        intro: L.intro, defeat: L.defeat, after: L.after, badge: { flag, name: L.badge },
      },
    },
    { id: 'guide', name: 'GYM GUIDE', x: 9, y: 11, facing: 'left', look: 'guide', text: [
      `GUIDE: Yo! Going for the ${L.badge}? This GYM uses ${g.type.toUpperCase()}-type POKéMON.`,
      'GUIDE: The LEADER levels up with every badge you have, so any order works. Good luck, champ-to-be!',
    ], when: (f) => !f[flag] },
    { id: 'guide', name: 'GYM GUIDE', x: 9, y: 11, facing: 'left', look: 'guide', text: ['GUIDE: What a battle! You are on your way to the LEAGUE!'], when: has(flag) },
  ];
}

export function gymFor(town: string, outside: string, b: Building): MapDef {
  const g = GYMS.find((x) => x.town === town)!;
  return gymMap(town, g.townName, g.type, outside, b, gymNpcs(g));
}

export const BADGE_ORDER = GYMS.map((g) => ({ town: g.town, name: g.leader.badge, type: g.type }));

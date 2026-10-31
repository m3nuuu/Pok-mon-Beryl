// Victory Road and the Pokémon League on the coast beyond Reedmouth.
import { ball, bld, has, mons, person, trainer, type MapDef, type NpcDef, type TeamMon } from '../mapkit';
import { CENTER_IN, centerMap, doorTo } from './interiors';

const victory: MapDef = {
  id: 'victory',
  name: 'VICTORY ROAD',
  kind: 'outdoor',
  rows: [
    'TTTTTTTT::TTTTTTTTTT',
    'TRR.....::.......RRT',
    'TR..,,,.::.,,,,...RT',
    'TR..,,,.::.,,,,...RT',
    'T.......::........RT',
    'TRRRR...::...RRRRRRT',
    'T.......::.........T',
    'T.,,,,,.::.,,,,,,..T',
    'T.,,,,,.::.,,,,,,..T',
    'T.......::.........T',
    'TRR.....::.....RRRRT',
    'T.......::.........T',
    'T..OO...::..,,,,,..T',
    'T..OO...::..,,,,,..T',
    'T.......::.........T',
    'TRRRRR..::..RRRRRRRT',
    'T.......::.........T',
    'T.,,,,,,::,,,,,,,..T',
    'T.,,,,,,::,,,,,,,..T',
    'T.......::.........T',
    'T..RR...::...OO....T',
    'T..RR...::...OO....T',
    'T.......::.........T',
    'T.,,,,..::..,,,,...T',
    'T.,,,,..::..,,,,...T',
    'T.......::.........T',
    'TRRR....::....RRRRRT',
    'T.......::.........T',
    'T.......::.........T',
    'TTTTTTTT::TTTTTTTTTT',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'north', from: 8, to: 9, map: 'reedmouth', offset: 8 },
    { side: 'south', from: 8, to: 9, map: 'league', offset: 4 },
  ],
  npcs: [
    trainer('vrA', 3, 6, 'right', 'ace', {
      name: 'ACE TROND', team: [{ species: 'jetwing', lv: 0 }, { species: 'raptorrent', lv: 0 }],
      intro: ['Only the best make it this far. Prove you belong!'], defeat: ['You belong here. Go on.'],
    }),
    trainer('vrB', 15, 11, 'left', 'ace', {
      name: 'ACE LIV', team: [{ species: 'wispedusa', lv: 0 }, { species: 'hivekeeper', lv: 0 }],
      intro: ['The LEAGUE is right ahead. But first, me!'], defeat: ['The LEAGUE is in for a surprise.'],
    }),
    trainer('vrC', 3, 19, 'right', 'blackbelt', {
      name: 'BLACKBELT ARNE', team: [{ species: 'hivekeeper', lv: 1 }, { species: 'marrowroo', lv: 0 }],
      intro: ['HAAAH! My final training!'], defeat: ['OSU...'],
    }),
    trainer('vrD', 15, 25, 'left', 'ace', {
      name: 'ACE MALIN', team: [{ species: 'lochoral', lv: 0 }, { species: 'pixcygnus', lv: 0 }, { species: 'geodragon', lv: 0 }],
      intro: ["I've been waiting here for a worthy opponent."], defeat: ['Worth the wait.'],
    }),
    { id: 'jasperVR', name: 'JASPER', x: 9, y: 27, facing: 'up', look: 'jasper', when: (f) => !!f.decided && !f.rivalVR },
    ball('victory', 17, 2, 'fullrestore'),
    ball('victory', 1, 13, 'ultraball', 3),
    ball('victory', 18, 22, 'revive', 2),
  ],
  inspect: {},
  encounters: mons(['caddicairn', 20], ['hivebruin', 20], ['rivetwing', 20], ['pixmallard', 20], ['wispedusa', 10], ['geodling', 10]),
};

const lgCenter = bld('center', 18, 2);
const lgHall = bld('league', 8, 3);

const league: MapDef = {
  id: 'league',
  name: 'POKéMON LEAGUE',
  kind: 'outdoor',
  town: 'league',
  rows: [
    'TTTTTTTTTTTT::TTTTTTTTTTTT',
    'T...........::...........T',
    'T...........::....BBBBBB.T',
    'T.......BBBBBBBBB.BBBBBB.T',
    'T.......BBBBBBBBB.BBBBBB.T',
    'T..L....BBBBBBBBB.BBDBBB.T',
    'T.......BBBBBBBBB...:....T',
    'T.......BBBBBBBBB...:....T',
    'T.......BBBBDBBBB...:....T',
    'T...........::::::::::...T',
    'T..L........::.......L...T',
    'T........................T',
    'T........................T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [lgCenter, lgHall],
  warps: [
    doorTo(lgCenter, 'center_league', CENTER_IN.x, CENTER_IN.y),
    doorTo(lgHall, 'leagueHall', 5, 20),
  ],
  exits: [{ side: 'north', from: 12, to: 13, map: 'victory', offset: -4 }],
  npcs: [
    person('lg1', 'GUARD', 13, 10, 'down', 'police', [
      'GUARD: Welcome to the POKéMON LEAGUE. Four ELITE trainers and the CHAMPION wait inside.',
      'GUARD: Once you go in, you face them one after another. Heal up first!',
    ]),
  ],
  inspect: {
    '3,5': ['A golden torch burns in the sea wind.'],
    '3,10': ['A golden torch burns in the sea wind.'],
    '21,10': ['A golden torch burns in the sea wind.'],
  },
};

const t = (species: string, lv: number, moves?: string[]): TeamMon => ({ species, lv, moves });

function elite(id: string, gapY: number, name: string, look: string, team: TeamMon[], intro: string[], defeat: string[]): NpcDef[] {
  const flag = `elite_${id}`;
  return [
    {
      id, name, x: 5, y: gapY, facing: 'down', look, when: (f) => !f[flag],
      trainer: { name: `ELITE ${name}`, team, tier: 'fixed', prize: 120, sight: 0, smart: true, intro, defeat },
    },
    { id: `${id}After`, name, x: 7, y: gapY - 1, facing: 'left', look, text: ['Go on. The next room awaits.'], when: (f) => !!f[flag] },
  ];
}

const leagueHall: MapDef = {
  id: 'leagueHall',
  name: 'POKéMON LEAGUE',
  kind: 'indoor',
  theme: 'shrine',
  rows: [
    '###########',
    '#WWWWWWWWW#',
    '#g_______g#',
    '#_________#',
    '#_________#',
    '#####_#####',
    '#_________#',
    '#_________#',
    '#_________#',
    '#####_#####',
    '#_________#',
    '#_________#',
    '#_________#',
    '#####_#####',
    '#_________#',
    '#_________#',
    '#_________#',
    '#####_#####',
    '#_________#',
    '#_________#',
    '#p_______p#',
    '#____X____#',
    '###########',
  ],
  buildings: [],
  warps: [{ x: 5, y: 21, to: 'league', tx: lgHall.door.x, ty: lgHall.door.y + 1, facing: 'down' }],
  npcs: [
    ...elite('wren', 17, 'WREN', 'wren',
      [t('jetwing', 54), t('pixcygnus', 54), t('tidrake', 55), t('jetwing', 56)],
      ['WREN: I am WREN of the ELITE FOUR. My birds ride the winds above the whole LETHYS valley.', 'WREN: From up there, every problem looks small. Shall we fly?'],
      ['WREN: You soar higher than my birds. Go on.']),
    ...elite('bramble', 13, 'BRAMBLE', 'bramble',
      [t('caddicairn', 55), t('hivekeeper', 55), t('hivebruin', 56), t('hivekeeper', 57)],
      ['BRAMBLE: BRAMBLE, the second of the ELITE FOUR. My bugs and bears grew up in MOSSVEIL WOOD.', 'BRAMBLE: Small things, working together, can bring down anything. Watch!'],
      ['BRAMBLE: Hmm. You work well with your team. That is the whole secret.']),
    ...elite('kestrel', 9, 'KESTREL', 'kestrel',
      [t('raptorrent', 56), t('geodragon', 56), t('caddicairn', 56), t('raptorrent', 57), t('geodragon', 58)],
      ['KESTREL: I am KESTREL. I dig up the past. My POKéMON lived in the LETHYS before people did.', 'KESTREL: Let us see if you can stand against history itself!'],
      ['KESTREL: The past bows to the future, it seems.']),
    ...elite('morgrave', 5, 'MORGRAVE', 'morgrave',
      [t('wispedusa', 57), t('spectaroo', 57), t('wispedusa', 58), t('spectaroo', 59)],
      ['MORGRAVE: I am MORGRAVE, last of the ELITE FOUR. I tend the lanterns of the dead.', 'MORGRAVE: You have stood at the dam, before the river and its souls. Now stand before mine!'],
      ['MORGRAVE: The souls are at peace. Go, the CHAMPION is waiting.']),
    { id: 'champion', name: 'SOLENNE', x: 5, y: 3, facing: 'down', look: 'solenne', when: (f) => !f.hallOfFame },
    person('championAfter', 'SOLENNE', 5, 3, 'down', 'solenne', ['SOLENNE: The LEAGUE will always be here for you, CHAMPION.'], has('hallOfFame')),
  ],
  inspect: {
    '1,2': ['A statue of the first CHAMPION of KALDRIA.'],
    '9,2': ['A statue of the first CHAMPION of KALDRIA.'],
  },
};

export const LEAGUE: MapDef[] = [victory, league, leagueHall, centerMap('league', 'LEAGUE', 'league', lgCenter)];

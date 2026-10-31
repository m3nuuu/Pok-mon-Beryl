// Stillbrook and everything downstream: Route 1/2/7/8, Lanterncross, Valecrown, Reedmouth, Lowbank.
import {
  all, ball, badges, before, between, bld, has, mons, person, trainer, type MapDef,
} from '../mapkit';
import { gymFor } from './gyms';
import { CENTER_IN, GYM_IN, HOUSE_IN, centerMap, doorTo, houseMap } from './interiors';

// --- Stillbrook -------------------------------------------------------------------------

const sbGym = bld('gym', 3, 14);
const stillbrook: MapDef = {
  id: 'stillbrook',
  name: 'STILLBROOK',
  kind: 'outdoor',
  town: 'stillbrook',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TWWWWWWWWWWWWWWWWWWWWVVVVVVVVVVWWWWWWWT',
    'TWWWWWWWWWEWWWWWWWWWWVVVVVVVVVVWWWWWWWT',
    'TT........:..........~~~~~~~~~~,,,,,,.T',
    'TTBBBBB...:SBBBBB....~~~~~~~~~~,,,,,,::',
    'TTBBBBBFF.:.BBBBB.F..~~~~~~~~~~,,,TT,::',
    'TTBBBBBF..:.BBBBB.F..~~~~~~~~~~,,,TT,.T',
    'TTBBDBB...:.BBDBB....~~~~~~~~~~,,,,,,.T',
    'TT::::::::::::::::::.~~~~~~~~~~,,,,,,.T',
    'TT.......:.S.........~~~~~~~~~~,,,,,,.T',
    'TTfffff..:...........~~~~~~~~~~.......T',
    'TT.......::::::::::::==========::::::::',
    'TT.......:..BBBBBB...~~~~~~~~~~........',
    'TT.......:.FBBBBBBFF.~~~~~~~~~~.,,,,,.T',
    'TT.BBBBBBB..BBBBBB...~~~~~~~~~~.,,,,,.T',
    'TT.BBBBBBB..BBDBBBS..~~~~~~~~~~.,,,,,.T',
    'TT.BBBBBBB....:::::::~~~~~~~~~~.,,,,,.T',
    'TT.BBBBBBB..........:~~~~~~~~~~.,,,,,.T',
    'TT.BBBDBBBS.........:~~~~~~~~~~.,,,,,.T',
    'TT....::::...TTTT...:d~~~~~~~~~.,,,,,.T',
    'TTTTT....:...TTTTF...d~~~~~~~~~.,,,,,.T',
    'TTTTT....:..FTTTT.F..~~~~~~~~~~.......T',
    'TTTTT....:S..........~~~~~~~~~~.......T',
    'TTTTTTTT.:TTTTTTTTTTT~~~~~~~~~~TTTTTTTT',
  ],
  buildings: [bld('home', 2, 4), bld('jasper', 12, 4), sbGym, bld('neighbor', 12, 12)],
  warps: [
    { x: 4, y: 7, to: 'home', tx: 5, ty: 7, facing: 'up' },
    { x: 14, y: 7, to: 'jasperHome', tx: 4, ty: 5, facing: 'up' },
    doorTo(sbGym, 'gym_stillbrook', GYM_IN.x, GYM_IN.y, {
      when: has('torvaldBack'),
      locked: ["The GYM is locked. A note says: 'Gone to help at the dam. Back soon! - TORVALD'"],
    }),
  ],
  exits: [
    { side: 'south', from: 8, to: 9, map: 'route1', offset: 0 },
    { side: 'east', from: 4, to: 5, map: 'damroad', offset: 16 },
    { side: 'east', from: 11, to: 12, map: 'route2', offset: -9 },
  ],
  npcs: [
    { id: 'jasper', name: 'JASPER', x: 4, y: 9, facing: 'up', look: 'jasper', when: between('gotStarter', 'taskGiven') },
    { id: 'spruce', name: 'PROF. SPRUCE', x: 6, y: 8, facing: 'left', look: 'spruce', when: between('gotStarter', 'taskGiven') },
    { id: 'grandma', name: 'GRANDMA', x: 2, y: 8, facing: 'right', look: 'grandma', when: between('gotStarter', 'taskGiven') },
    { id: 'jasper', name: 'JASPER', x: 15, y: 8, facing: 'down', look: 'jasper', when: between('prologueDone', 'leftHome') },
    { id: 'guard', name: 'BRAM', x: 10, y: 3, facing: 'down', look: 'guard' },
    { id: 'fisher', name: 'OTTO', x: 20, y: 13, facing: 'right', look: 'fisher' },
    { id: 'neighbor', name: 'HAZEL', x: 8, y: 12, facing: 'down', look: 'neighbor' },
    { id: 'ferry', name: 'GRETA', x: 20, y: 20, facing: 'right', look: 'ferry' },
    person('kid', 'TILDE', 25 + 8, 9, 'left', 'youngster', [
      "TILDE: The east bank goes up to the dam road. That's how the workers get to WEIRHAVEN!",
    ]),
    { id: 'jasperBlackout', name: 'JASPER', x: 16, y: 9, facing: 'down', look: 'jasper', when: between('ev2', 'ev2done') },
  ],
  inspect: {
    '11,9': ['STILLBROOK', 'Where the Lethys leaves the dam.'],
    '11,4': ['MIRRORMERE DAM', 'Staff entrance ahead. No unauthorized visitors.'],
    '10,18': ['STILLBROOK GYM', 'LEADER: TORVALD. Type: FIGHTING.'],
    '18,15': ['STILLBROOK GARDENS', 'Please keep POKéMON off the flower beds!'],
    '14,15': ["HAZEL's house. The door is locked."],
    '10,22': ['ROUTE 1', 'South to LANTERNCROSS.'],
    '10,2': ["It's locked. A plate reads: MIRRORMERE DAM - STAFF ONLY."],
  },
  encounters: mons(['pipwing', 70], ['caddibuzz', 30]),
  fishing: mons(['murkfin', 80], ['newtide', 5], ['lochlet', 15]),
};

const home: MapDef = {
  id: 'home',
  name: "BERYL'S HOUSE",
  kind: 'indoor',
  rows: [
    '############',
    '#WwWWsWWwWk#',
    '#b_______kk#',
    '#b_________#',
    '#____TT____#',
    '#____TT____#',
    '#__________#',
    '#p_______vB#',
    '#____X_____#',
    '############',
  ],
  buildings: [],
  warps: [{ x: 5, y: 8, to: 'stillbrook', tx: 4, ty: 8, facing: 'down' }],
  npcs: [
    { id: 'mum', name: 'MUM', x: 4, y: 4, facing: 'right', look: 'mum', when: (f) => !f.parentsLeft || !!(f.ev6 && !f.ev6done) },
    { id: 'dad', name: 'DAD', x: 7, y: 5, facing: 'left', look: 'dad', when: (f) => !f.parentsLeft || !!(f.ev6 && !f.ev6done) },
    { id: 'grandma', name: 'GRANDMA', x: 8, y: 3, facing: 'down', look: 'grandma', when: (f) => !(f.gotStarter && !f.taskGiven) },
    { id: 'homemon', name: 'FAMILY POKéMON', x: 3, y: 6, facing: 'down', look: 'homemon', when: (f) => !f.parentsLeft || !!f.gotStarter },
    { id: 'spruce', name: 'PROF. SPRUCE', x: 7, y: 4, facing: 'left', look: 'spruce', when: (f) => between('metJasper', 'gotStarter')(f) || !!f.hallOfFame },
    { id: 'jasper', name: 'JASPER', x: 4, y: 6, facing: 'right', look: 'jasper', when: between('metJasper', 'gotStarter') },
  ],
  inspect: {
    '5,1': ['A soft toy of LETHYS, the river serpent. You have had it since you were tiny.'],
    '9,7': ['The TV shows the weather: sunny over the whole LETHYS valley.'],
    '10,7': ['Old books about the river. One is called "Kaldria Before the Dam".'],
    '9,2': ['It smells like fresh bread.'],
    '10,2': ['It smells like fresh bread.'],
    '1,2': ['Your bed. Still warm.'],
    '1,3': ['Your bed. Still warm.'],
  },
};

const jasperHome: MapDef = {
  id: 'jasperHome',
  name: "JASPER'S HOUSE",
  kind: 'indoor',
  rows: [
    '##########',
    '#WwWWBWwW#',
    '#________#',
    '#__TT__b_#',
    '#__TT__b_#',
    '#p______p#',
    '#___X____#',
    '##########',
  ],
  buildings: [],
  warps: [{ x: 4, y: 6, to: 'stillbrook', tx: 14, ty: 8, facing: 'down' }],
  npcs: [
    { id: 'jasperDad', name: "JASPER'S DAD", x: 2, y: 2, facing: 'down', look: 'jasperDad', when: before('ev7') },
    { id: 'jasperMom', name: "JASPER'S MUM", x: 6, y: 2, facing: 'down', look: 'jasperMom', when: before('metJasper') },
    { id: 'jasper', name: 'JASPER', x: 6, y: 4, facing: 'left', look: 'jasper', when: before('metJasper') },
  ],
  inspect: {
    '5,1': ['A shelf full of FIGHTING-type training manuals.'],
    '7,3': ["Jasper's bed. It's a mess."],
    '7,4': ["Jasper's bed. It's a mess."],
  },
};

// --- Route 1 (Stillbrook → Lanterncross, west bank) -----------------------------------------

const route1: MapDef = {
  id: 'route1',
  name: 'ROUTE 1',
  kind: 'outdoor',
  rows: [
    'TTTTTTTT.:TTTTT~~~',
    'TT......::....T~~~',
    'TT.,,,,,::....T~~~',
    'TT.,,,,,::..S.T~~~',
    'TT.,,,,,::....T~~~',
    'TT......::....T~~~',
    'TTTT....::,,,,T~~~',
    'TT......::,,,,T~~~',
    'TT.TT...::,,,,.~~~',
    'TT.TT...::,,,,.~~~',
    'TT......::.....~~~',
    'TT,,,,..::.....~~~',
    'TT,,,,..::..TT.~~~',
    'TT,,,,..::..TT.~~~',
    'TT,,,,..::.....~~~',
    'TT......::.....~~~',
    'TTTTTT..::..TTT~~~',
    'TT......::.....~~~',
    'TT.FF...::,,,,.~~~',
    'TT.FF...::,,,,.~~~',
    'TT......::,,,,.~~~',
    'TT,,,,..::,,,,.~~~',
    'TT,,,,..::.....~~~',
    'TT,,,,..::...S.~~~',
    'TT......::.....~~~',
    'TTTT....::..TTT~~~',
    'TT......::.....~~~',
    'TT......::.....~~~',
    'TT.TT...::...TT~~~',
    'TTTTTTTT::TTTTT~~~',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'north', from: 8, to: 9, map: 'stillbrook', offset: 0 },
    { side: 'south', from: 8, to: 9, map: 'lanterncross', offset: 4 },
  ],
  npcs: [
    { id: 'runaway1', name: 'RUNAWAY POKéMON', x: 14, y: 10, facing: 'left', look: 'mon-lochlet', when: all(has('pensionQuest'), before('runaway1')) },
    trainer('r1a', 5, 10, 'right', 'youngster', {
      name: 'YOUNGSTER FINN', team: [{ species: 'pipwing', lv: 0 }],
      intro: ["Hey! You're from STILLBROOK, right? Let's battle!"], defeat: ['Aww, I wanted to win my first battle...'],
      after: ['FINN: Tall grass is where wild POKéMON hide. Walk through it to find them!'],
    }),
    trainer('r1b', 13, 17, 'left', 'lass', {
      name: 'LASS NELL', team: [{ species: 'hivecub', lv: -1 }, { species: 'caddibuzz', lv: -1 }],
      intro: ['Your POKéMON look cute! Mine are cuter!'], defeat: ['Hmph. Fine, yours are cuter.'],
      after: ['NELL: The river is so wide here. My dad says it used to flood every spring before the dam.'],
    }),
    trainer('r1c', 11, 21, 'up', 'bugcatcher', {
      name: 'BUG CATCHER EMIL', team: [{ species: 'caddibuzz', lv: 0 }, { species: 'caddibuzz', lv: 0 }],
      intro: ['Bugs! Bugs everywhere! Want to see?'], defeat: ['My bugs need a rest...'],
      after: ["EMIL: CADDIBUZZ build shells out of river pebbles when they grow up. Isn't that cool?"],
    }),
    ball('route1', 14, 10, 'potion'),
    ball('route1', 2, 27, 'pokeball', 2),
  ],
  inspect: {
    '12,3': ['ROUTE 1', 'North: STILLBROOK  South: LANTERNCROSS'],
    '13,23': ['ROUTE 1', 'LANTERNCROSS ahead. Home of the LANTERN FESTIVAL!'],
  },
  encounters: mons(['pipwing', 40], ['caddibuzz', 35], ['hivecub', 25]),
  fishing: mons(['murkfin', 85], ['lochlet', 15]),
};

// --- Lanterncross ---------------------------------------------------------------------------

const lcCenter = bld('center', 3, 3);
const lcShrine = bld('shrine', 15, 2);
const lcHouse = bld('house', 7, 9);
const lcGym = bld('gym', 3, 14);
const lcPension = bld('pension', 15, 13);

const lanterncross: MapDef = {
  id: 'lanterncross',
  name: 'LANTERNCROSS',
  kind: 'outdoor',
  town: 'lanterncross',
  rows: [
    'TTTTTTTTTTTT::TTTTTTTTTT~~~~~~',
    'T...........::..........~~~~~~',
    'T...........::.BBBBB....~~~~~~',
    'T..BBBBBB...::.BBBBB....~~~~~~',
    'T..BBBBBB..L::LBBBBB....~~~~~~',
    'T..BBBBBB...::.BBBBB....~~~~~~',
    'T..BBDBBB...::.BBDBB....~~~~~~',
    'T....:......::...:......~~~~~~',
    'T....::::::::::::::.....~~~~~~',
    'T......BBBBB::.....L....~~~~~~',
    'T......BBBBB::..........~~~~~~',
    'T..F...BBBBB::.....FF...~~~~~~',
    'T..F...BBDBB::..........~~~~~~',
    'T........:::::.BBBBBBB..~~~~~~',
    'T..BBBBBBB..::.BBBBBBB.d~~~~~~',
    'T..BBBBBBB..::.BBBBBBB.d~~~~~~',
    'T..BBBBBBB..::.BBBDBBB..~~~~~~',
    'T..BBBBBBB..::....:...L.~~~~~~',
    'T..BBBDBBB..:::::::.....~~~~~~',
    'T.....:.....::...fffff..~~~~~~',
    'T.....::::::::...f...f..~~~~~~',
    'T.S.........::...fffff..~~~~~~',
    'T...........::..........~~~~~~',
    'TTTTTTTTTTTT::TTTTTTTTTT~~~~~~',
  ],
  buildings: [lcCenter, lcShrine, lcHouse, lcGym, lcPension],
  warps: [
    doorTo(lcCenter, 'center_lanterncross', CENTER_IN.x, CENTER_IN.y),
    doorTo(lcShrine, 'shrine', 4, 6),
    doorTo(lcHouse, 'house_lanterncross', HOUSE_IN.x, HOUSE_IN.y),
    doorTo(lcGym, 'gym_lanterncross', GYM_IN.x, GYM_IN.y),
    doorTo(lcPension, 'pension', 6, 6),
  ],
  exits: [
    { side: 'north', from: 12, to: 13, map: 'route1', offset: -4 },
    { side: 'south', from: 12, to: 13, map: 'route7', offset: -4 },
  ],
  npcs: [
    { id: 'ferry2', name: 'TOBIN', x: 22, y: 14, facing: 'right', look: 'ferry' },
    person('lc1', 'MARTA', 10, 16, 'down', 'oldwoman', [
      'MARTA: Every autumn we light lanterns for the people we lost and let the LETHYS carry them away.',
      "MARTA: The river takes them to the sea, they say. Lately... they don't seem to get very far.",
    ]),
    person('lc2', 'PETRA', 20, 10, 'left', 'lass', [
      'PETRA: Have you been to the shrine? The mural inside is older than the dam. Older than anything here!',
    ]),
    { id: 'runaway2', name: 'RUNAWAY POKéMON', x: 2, y: 9, facing: 'down', look: 'mon-hivecub', when: all(has('pensionQuest'), before('runaway2')) },
    { id: 'deco1', name: 'POKéMON', x: 18, y: 20, facing: 'down', look: 'mon-pipwing' },
    { id: 'deco2', name: 'POKéMON', x: 20, y: 20, facing: 'down', look: 'mon-lochlet' },
  ],
  inspect: {
    '2,21': ['LANTERNCROSS', 'The town of a thousand lanterns.'],
    '11,4': ['A paper lantern flickers on its post.'],
    '14,4': ['A paper lantern flickers on its post.'],
    '19,9': ['A paper lantern flickers on its post.'],
    '22,17': ['A paper lantern flickers on its post.'],
    '17,19': ["The PENSION's play pen. A sign says: 'Please don't feed the POKéMON!'"],
  },
  fishing: mons(['murkfin', 70], ['lochlet', 25], ['newtide', 5]),
};

const shrine: MapDef = {
  id: 'shrine',
  name: 'LANTERN SHRINE',
  kind: 'indoor',
  theme: 'shrine',
  rows: [
    '#########',
    '#WWaaaWW#',
    '#l_____l#',
    '#_______#',
    '#l_____l#',
    '#_______#',
    '#p_____p#',
    '#___X___#',
    '#########',
  ],
  buildings: [],
  warps: [{ x: 4, y: 7, to: 'lanterncross', tx: lcShrine.door.x, ty: lcShrine.door.y + 1, facing: 'down' }],
  npcs: [person('priest', 'KEEPER ANSEL', 6, 3, 'left', 'oldman', [
    'ANSEL: Welcome to the LANTERN SHRINE. We have kept the old stories here for five hundred years.',
    'ANSEL: The LETHYS carries the souls of the dead down to the sea. And with them, the memory of our land.',
  ])],
  inspect: {},
};

const lcCenterMap = centerMap('lanterncross', 'LANTERNCROSS', 'lanterncross', lcCenter);
const lcHouseMap = houseMap('house_lanterncross', 'FESTIVAL HOUSE', 'lanterncross', lcHouse, [
  person('organizer', 'IVO', 3, 2, 'down', 'oldman', []),
  person('lchouse2', 'LINA', 6, 4, 'left', 'lass', [
    "LINA: My grandpa's lantern went down the river last year. I hope it found its way.",
  ]),
]);
const lcGymMap = gymFor('lanterncross', 'lanterncross', lcGym);

const pension: MapDef = {
  id: 'pension',
  name: 'POKéMON PENSION',
  kind: 'indoor',
  rows: [
    '############',
    '#WWwWWWWwWW#',
    '#rrrr______#',
    '#_____ooooo#',
    '#p____o___o#',
    '#_____ooooo#',
    '#__________#',
    '#_____X____#',
    '############',
  ],
  buildings: [],
  warps: [{ x: 6, y: 7, to: 'lanterncross', tx: lcPension.door.x, ty: lcPension.door.y + 1, facing: 'down' }],
  npcs: [
    { id: 'rosalind', name: 'ROSALIND', x: 2, y: 3, facing: 'down', look: 'jasperMom' },
    { id: 'deco1', name: 'POKéMON', x: 7, y: 4, facing: 'down', look: 'mon-hivecub' },
    { id: 'deco2', name: 'POKéMON', x: 9, y: 4, facing: 'down', look: 'mon-newtide' },
    { id: 'deco3', name: 'POKéMON', x: 8, y: 4, facing: 'down', look: 'mon-pipwing', when: has('runawaysBack') },
  ],
  inspect: { '1,2': ['A visitor book full of trainer names.'], '2,2': ['A visitor book full of trainer names.'] },
};

// --- Route 7 (Lanterncross → Reedmouth) ---------------------------------------------------

const route7: MapDef = {
  id: 'route7',
  name: 'ROUTE 7',
  kind: 'outdoor',
  rows: [
    'TTTTTTTT::TTTTT~~~',
    'TT......::....T~~~',
    'TT.,,,,.::.,,,T~~~',
    'TT.,,,,.::.,,,T~~~',
    'TT......::....T~~~',
    'TTTT....::..TTT~~~',
    'TT,,,,,.::.....~~~',
    'TT,,,,,.::..S..~~~',
    'TT,,,,,.::.....~~~',
    'TT......::,,,,.~~~',
    'TT..TT..::,,,,.~~~',
    'TT..TT..::,,,,.~~~',
    'TT......::.....~~~',
    'TTTTT...::...TT~~~',
    'TT......::.....~~~',
    'TT.,,,,,::,,,,.~~~',
    'TT.,,,,,::,,,,.~~~',
    'TT.,,,,,::,,,,.~~~',
    'TT......::.....~~~',
    'TT..FF..::..TT.~~~',
    'TT..FF..::..TT.~~~',
    'TT......::.....~~~',
    'TTTT....::....T~~~',
    'TT,,,,..::....T~~~',
    'TT,,,,..::,,,,T~~~',
    'TT,,,,..::,,,,T~~~',
    'TT......::....T~~~',
    'TT.TT...::..S.T~~~',
    'TT......::....T~~~',
    'TTTTTTTT::TTTTT~~~',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'north', from: 8, to: 9, map: 'lanterncross', offset: 4 },
    { side: 'south', from: 8, to: 9, map: 'reedmouth', offset: -2 },
  ],
  npcs: [
    trainer('r7a', 5, 4, 'right', 'hiker', {
      name: 'HIKER BJORN', team: [{ species: 'geodling', lv: 0 }],
      intro: ['I walked here all the way from CRAGMOOR!'], defeat: ['My legs are tired anyway.'],
      after: ['BJORN: The miners up north found some strange rock in EMBERDEEP CAVE.'],
    }),
    trainer('r7b', 11, 12, 'left', 'lass', {
      name: 'LASS ROSA', team: [{ species: 'pixling', lv: -1 }, { species: 'hivecub', lv: 0 }],
      intro: ["I'm going to the festival! But first, a battle!"], defeat: ['I lost... at least the festival will cheer me up.'],
    }),
    trainer('r7c', 3, 21, 'right', 'fisher', {
      name: 'FISHER LUDO', team: [{ species: 'murkfin', lv: 2 }, { species: 'lochlet', lv: -1 }],
      intro: ["The fish aren't biting. You'll do instead!"], defeat: ['Even you got away!'],
      after: ['LUDO: Down in REEDMOUTH the water gets lower every year. The fish are leaving.'],
    }),
    trainer('r7d', 12, 26, 'left', 'medium', {
      name: 'MEDIUM VERA', team: [{ species: 'wispjel', lv: 0 }],
      intro: ['The lanterns... they come back up the river at night. Did you know?'], defeat: ['The spirits are restless...'],
    }),
    ball('route7', 13, 2, 'superpotion'),
    ball('route7', 2, 24, 'greatball'),
  ],
  inspect: {
    '12,7': ['ROUTE 7', 'North: LANTERNCROSS  South: REEDMOUTH'],
    '12,27': ['ROUTE 7', 'REEDMOUTH and the delta ahead.'],
  },
  encounters: mons(['caddibuzz', 30], ['hivecub', 25], ['pixling', 25], ['wispjel', 20]),
  fishing: mons(['murkfin', 70], ['lochlet', 30]),
};

// --- Reedmouth --------------------------------------------------------------------------------

const rmCenter = bld('center', 9, 4);
const rmGym = bld('gym', 17, 3);
const rmHouse2 = bld('house2', 2, 4);
const rmHouse = bld('house', 27, 4);
const rmReeve = bld('house3', 3, 14);

const reedmouth: MapDef = {
  id: 'reedmouth',
  name: 'REEDMOUTH',
  kind: 'outdoor',
  theme: 'marsh',
  town: 'reedmouth',
  rows: [
    'TTTTTT::TTTTTTTTTTTTTTTTTT::TTTTTT',
    'T.....::..................::.....T',
    'T.....::::::::::::::::::::::.....T',
    'T................BBBBBBB.........T',
    'T.BBBBB..BBBBBB..BBBBBBB...BBBBB.T',
    'T.BBBBB..BBBBBB..BBBBBBB...BBBBB.T',
    'T.BBBBB..BBBBBB..BBBBBBB...BBBBB.T',
    'T.BBDBB..BBDBBB..BBBDBBB...BBDBB.T',
    'T...::::::::::::::::::::::::::...T',
    'T...........S...::...............T',
    'T.,,,,,.........::.......,,,,,,..T',
    'T.,,,,,..~~~~~~~==~~~~~~~,,,,,,..T',
    'T.,,,,,..~~~~~~~==~~~~~~~,,,,,,..T',
    'T........~~~~~~~==~~~~~~~........T',
    'T..BBBBB.~~~~~~~==~~~~~~~..L.....T',
    'T..BBBBB.d~~~~~~==~~~~~~~........T',
    'T..BBBBB.d~~~~~~==~~~~~~~..,,,,..T',
    'T..BBDBB.~~~~~~~==~~~~~~~..,,,,..T',
    'T....:...~~~~~~~==~~~~~~~..,,,,..T',
    'T....::::::::...::...............T',
    'T...........:...::......F.F.F....T',
    'T...........::::::...............T',
    'T...............::.........S.....T',
    'T,,,,,..........::..........,,,,,T',
    'T,,,,,..........::..........,,,,,T',
    'TTTTTTTTTTTTTTTT::TTTTTTTTTTTTTTTT',
  ],
  buildings: [rmCenter, rmGym, rmHouse2, rmHouse, rmReeve],
  warps: [
    doorTo(rmCenter, 'center_reedmouth', CENTER_IN.x, CENTER_IN.y),
    doorTo(rmGym, 'gym_reedmouth', GYM_IN.x, GYM_IN.y),
    doorTo(rmHouse2, 'house_rodfisher', HOUSE_IN.x, HOUSE_IN.y),
    doorTo(rmReeve, 'house_reeve', HOUSE_IN.x, HOUSE_IN.y),
  ],
  exits: [
    { side: 'north', from: 6, to: 7, map: 'route7', offset: 2 },
    { side: 'north', from: 26, to: 27, map: 'route8', offset: -18 },
    { side: 'south', from: 16, to: 17, map: 'victory', offset: -8 },
  ],
  npcs: [
    { id: 'ferry3', name: 'MARLO', x: 8, y: 16, facing: 'right', look: 'ferry' },
    person('rm1', 'WILLA', 22, 9, 'down', 'oldwoman', [
      'WILLA: When I was a girl, the reeds here were taller than me. Look at them now, all brown at the tips.',
      "WILLA: The river doesn't bring enough water down anymore. Not since the dam.",
    ]),
    person('rm2', 'DOCKHAND JEP', 13, 20, 'left', 'sailor', [
      "JEP: Ships used to sail right up to LANTERNCROSS. Now they'd get stuck in the mud.",
    ]),
    { id: 'leagueGuard', name: 'GUARD', x: 16, y: 24, facing: 'down', look: 'police', when: before('decided') },
    { id: 'leagueGuard2', name: 'GUARD', x: 17, y: 24, facing: 'down', look: 'police', when: before('decided') },
    { id: 'lethysDelta', name: 'LETHYS', x: 15, y: 13, facing: 'down', look: 'mon-lethys', when: (f) => !!f.gateEnding && !f.lethysDone },
  ],
  inspect: {
    '12,9': ['REEDMOUTH', 'Where the LETHYS meets the sea.'],
    '27,22': ['VICTORY ROAD', 'The POKéMON LEAGUE lies beyond. Only trainers with all eight badges may pass.'],
    '27,14': ['A lantern washed up from the river, tangled in the reeds.'],
  },
  encounters: mons(['caddibuzz', 35], ['mossfawn', 10], ['hivecub', 30], ['pixling', 25]),
  fishing: mons(['murkfin', 50], ['lochlet', 35], ['newtide', 15]),
};

const rmCenterMap = centerMap('reedmouth', 'REEDMOUTH', 'reedmouth', rmCenter);
const rmGymMap = gymFor('reedmouth', 'reedmouth', rmGym);
const rodFisher = houseMap('house_rodfisher', "FISHER'S HOUSE", 'reedmouth', rmHouse2, [
  person('rodguy', 'OLD SVEN', 3, 2, 'down', 'fisher', []),
]);
const reeveHouse = houseMap('house_reeve', "AUGUST'S HOUSE", 'reedmouth', rmReeve, [
  { id: 'reeve', name: 'AUGUST', x: 6, y: 4, facing: 'left', look: 'reeve', when: before('ev8') },
  person('reevecat', 'POKéMON', 2, 2, 'down', 'mon-murkfin', ['The MURKFIN in the bowl blows bubbles at you.']),
]);

// --- Route 8 (Valecrown → Reedmouth, east bank) -------------------------------------------

const route8: MapDef = {
  id: 'route8',
  name: 'ROUTE 8',
  kind: 'outdoor',
  rows: [
    'TTTTTTTT::TTTTTTTT',
    'T.......::.......T',
    'T.,,,,..::..,,,,.T',
    'T.,,,,..::..,,,,.T',
    'T.......::.......T',
    'TTT.....::....TTTT',
    'T.......::.......T',
    'T..S....::.,,,,..T',
    'T.......::.,,,,..T',
    'T,,,,,..::.,,,,..T',
    'T,,,,,..::.......T',
    'T,,,,,..::..TT...T',
    'T.......::..TT...T',
    'TTTTT...::.......T',
    'T.......::....TTTT',
    'T..FF...::.......T',
    'T.......::.,,,,,.T',
    'T.,,,,..::.,,,,,.T',
    'T.,,,,..::.,,,,,.T',
    'T.,,,,..::.......T',
    'T.......::...TT..T',
    'TTT.....::...TT..T',
    'T.......::.......T',
    'T.,,,,,.::.......T',
    'T.,,,,,.::...S...T',
    'T.......::.......T',
    'T..TT...::..,,,..T',
    'T.......::..,,,..T',
    'T.......::.......T',
    'TTTTTTTT::TTTTTTTT',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'north', from: 8, to: 9, map: 'valecrown', offset: 6 },
    { side: 'south', from: 8, to: 9, map: 'reedmouth', offset: 18 },
  ],
  npcs: [
    trainer('r8a', 11, 6, 'left', 'ace', {
      name: 'ACE HELGE', team: [{ species: 'pixling', lv: 0 }, { species: 'pipwing', lv: 0 }],
      intro: ["I'm training for the LEAGUE. You'll be my warm-up!"], defeat: ['Warm-up over... for me.'],
    }),
    trainer('r8b', 3, 12, 'right', 'youngster', {
      name: 'YOUNGSTER BO', team: [{ species: 'caddibuzz', lv: 0 }, { species: 'pixling', lv: -1 }, { species: 'pipwing', lv: -1 }],
      intro: ["I've got THREE POKéMON! Beat that!"], defeat: ['Three wasn\'t enough...'],
    }),
    trainer('r8c', 15, 22, 'left', 'lass', {
      name: 'BEAUTY ELSA', team: [{ species: 'hivecub', lv: 1 }],
      intro: ['The city is so loud. I come out here to breathe.'], defeat: ['At least it was quiet.'],
    }),
    ball('route8', 16, 16, 'revive'),
    ball('route8', 1, 23, 'superpotion'),
  ],
  inspect: {
    '3,7': ['ROUTE 8', 'North: VALECROWN CITY  South: REEDMOUTH'],
    '13,24': ['ROUTE 8', 'REEDMOUTH, gateway to the delta.'],
  },
  encounters: mons(['pixling', 40], ['pipwing', 30], ['hivecub', 30]),
};

// --- Valecrown City --------------------------------------------------------------------------

const vcCenter = bld('center', 3, 3);
const vcGym = bld('gym', 22, 3);
const vcHouse = bld('house', 6, 10);
const vcHouse2 = bld('house2', 19, 10);
const vcPlant = bld('plant', 3, 17);
const vcHouse3 = bld('house3', 23, 17);

const valecrown: MapDef = {
  id: 'valecrown',
  name: 'VALECROWN CITY',
  kind: 'outdoor',
  theme: 'city',
  town: 'valecrown',
  rows: [
    'TTTTTTTTTTTTTT::TTTTTTTTTTTTTTTT',
    'T.............::...............T',
    'T.............::...............T',
    'T..BBBBBB.....::......BBBBBBB..T',
    'T..BBBBBB..L..::..L...BBBBBBB..T',
    'T..BBBBBB.....::......BBBBBBB..T',
    'T..BBDBBB.....::......BBBBBBB..T',
    'T....:........::......BBBDBBB..T',
    'T....::::::::::::::::::::::....T',
    'T.............::...............T',
    'T..FF.BBBBB...::...BBBBB..FF...T',
    'T..FF.BBBBB...::...BBBBB..FF...T',
    'T.....BBBBB...::...BBBBB.......T',
    'T.....BBDBB...::...BBDBB.......T',
    'T.......:.....::.....:.........T',
    'T.......::::::::::::::.........T',
    'T.............::...............T',
    'T..BBBBBBBB..:::...LL..BBBBB...T',
    'T..BBBBBBBB...::.......BBBBB...T',
    'T..BBBBBBBB...::.......BBBBB...T',
    'T..BBBBBBBB...::.......BBDBB...T',
    'T..BBBDBBBB...::.........:.....T',
    'T.....:.......::.........:.....T',
    'T.....::::::::::::::::::::.....T',
    'T.............::...............T',
    'TTTTTTTTTTTTTT::TTTTTTTTTTTTTTTT',
  ],
  buildings: [vcCenter, vcGym, vcHouse, vcHouse2, vcPlant, vcHouse3],
  warps: [
    doorTo(vcCenter, 'center_valecrown', CENTER_IN.x, CENTER_IN.y),
    doorTo(vcGym, 'gym_valecrown', GYM_IN.x, GYM_IN.y),
    doorTo(vcHouse, 'house_valecrown', HOUSE_IN.x, HOUSE_IN.y),
    doorTo(vcPlant, 'plant', 7, 6),
  ],
  exits: [
    { side: 'north', from: 14, to: 15, map: 'route2', offset: -4 },
    { side: 'south', from: 14, to: 15, map: 'route8', offset: -6 },
  ],
  npcs: [
    person('vc1', 'BANKER OLAF', 17, 12, 'down', 'gentleman', [
      'OLAF: VALECROWN is the capital of KALDRIA. Every light, every train, every screen runs on the dam.',
      'OLAF: Those FLOWKEEPERS want to tear it down? Madness. The whole city would go dark.',
    ]),
    person('vc2', 'STUDENT NIA', 26, 14, 'left', 'lass', [
      'NIA: My history teacher says three villages were flooded when the dam was built. Nobody talks about them.',
    ]),
    person('vc3', 'TOURIST JUN', 10, 22, 'up', 'youngster', [
      "JUN: The POWER PLANT is the biggest building in the city. It takes the dam's power and sends it everywhere!",
    ]),
    { id: 'plantGuard', name: 'GUARD', x: 6, y: 22, facing: 'down', look: 'police', when: (f) => !f.ev2 },
    { id: 'grunt1', name: 'FLOWKEEPER', x: 8, y: 22, facing: 'left', look: 'grunt', when: all(has('ev2'), before('plantDone')) },
  ],
  inspect: {
    '5,22': ['VALECROWN POWER PLANT', 'Property of the LETHYS DAM COMPANY.'],
    '11,4': ['A bright electric street lamp.'],
    '18,4': ['A bright electric street lamp.'],
    '19,17': ['A fountain shaped like the dam. Water pours over its tiny spillway.'],
    '20,17': ['A fountain shaped like the dam. Water pours over its tiny spillway.'],
    '21,13': ['A smart apartment block. The door is locked.'],
    '25,20': ['The door is locked. A sign: CRUZ FAMILY.'],
  },
};

const vcCenterMap = centerMap('valecrown', 'VALECROWN', 'valecrown', vcCenter);
const vcGymMap = gymFor('valecrown', 'valecrown', vcGym);
const vcHouseMap = houseMap('house_valecrown', 'CITY FLAT', 'valecrown', vcHouse, [
  person('vchouse1', 'REMY', 3, 2, 'down', 'gentleman', [
    "REMY: I grew up in a village the reservoir swallowed. MIRRORMERE, they call it now. Pretty name for a grave.",
  ]),
  person('vchouse2', 'POKéMON', 6, 4, 'left', 'mon-pixling', ['PIXLING: Quack! Its visor shows a smiley face.']),
]);

const plant: MapDef = {
  id: 'plant',
  name: 'POWER PLANT',
  kind: 'indoor',
  theme: 'dam',
  rows: [
    '################',
    '#WWWWWWWWWWWWWW#',
    '#zz__zz__zz__zz#',
    '#______________#',
    '#zz__zz__zz__zz#',
    '#______________#',
    '#p____________p#',
    '#______X_______#',
    '################',
  ],
  buildings: [],
  warps: [{ x: 7, y: 7, to: 'valecrown', tx: vcPlant.door.x, ty: vcPlant.door.y + 1, facing: 'down' }],
  npcs: [
    trainer('plantG1', 3, 5, 'right', 'grunt', {
      name: 'FLOWKEEPER', team: [{ species: 'murkfin', lv: 1 }, { species: 'caddibuzz', lv: 0 }], tier: 'boss', smart: false,
      intro: ['Free the river! This plant runs on stolen water!'], defeat: ["You'll see. VESPER will show you all."],
    }, all(has('ev2'), before('plantDone'))),
    trainer('plantG2', 12, 3, 'left', 'grunt', {
      name: 'FLOWKEEPER', team: [{ species: 'wispjel', lv: 0 }, { species: 'pipwing', lv: 0 }], tier: 'boss', smart: false,
      intro: ['Kid, go home. This is bigger than you.'], defeat: ['Ugh... VESPER is not going to like this.'],
    }, all(has('ev2'), before('plantDone'))),
    { id: 'vesper', name: 'VESPER', x: 7, y: 3, facing: 'down', look: 'vesper', when: all(has('ev2'), before('plantDone')) },
    person('plantWorker', 'ENGINEER', 13, 6, 'left', 'worker', [
      'ENGINEER: Thanks to you, the plant is running again. The lights in STILLBROOK are back on too!',
    ], has('plantDone')),
  ],
  inspect: {
    '1,2': ['A huge transformer hums with power.'],
    '5,2': ['Gauges show the power coming in from MIRRORMERE DAM.'],
  },
};

// --- Route 2 (Stillbrook east bank → Valecrown) --------------------------------------------

const route2: MapDef = {
  id: 'route2',
  name: 'ROUTE 2',
  kind: 'outdoor',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T......................T',
    '::::::::::::.,,,,,,....T',
    '::::::::::::.,,,,,,....T',
    'T.........::.,,,,,,....T',
    'T.,,,,....::...........T',
    'T.,,,,....::.....TT....T',
    'T.,,,,....::.....TT....T',
    'T.........::...........T',
    'TTTT......::......,,,,.T',
    'T.........::......,,,,.T',
    'T..TT.....::......,,,,.T',
    'T..TT.....::...........T',
    'T.........::...........T',
    'T.,,,,,...::::::::::::::',
    'T.,,,,,...::::::::::::::',
    'T.,,,,,...::...........T',
    'T.........::...........T',
    'TTTTT.....::....,,,,,..T',
    'T.........::....,,,,,..T',
    'T..S......::....,,,,,..T',
    'T.........::...........T',
    'T.,,,,....::.....TTT...T',
    'T.,,,,....::.....TTT...T',
    'T.........::...........T',
    'T....TT...::...........T',
    'T.........::..FF.......T',
    'T.........::..FF.......T',
    'T.........::...........T',
    'TTTTTTTTTT::TTTTTTTTTTTT',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'west', from: 2, to: 3, map: 'stillbrook', offset: 9 },
    { side: 'east', from: 14, to: 15, map: 'lowbank', offset: -6 },
    { side: 'south', from: 10, to: 11, map: 'valecrown', offset: 4 },
  ],
  npcs: [
    trainer('r2a', 6, 8, 'right', 'youngster', {
      name: 'YOUNGSTER PELLE', team: [{ species: 'pixling', lv: 0 }],
      intro: ["I'm walking to the big city! Want to battle first?"], defeat: ["Guess I'll walk faster."],
    }),
    trainer('r2b', 15, 10, 'left', 'bugcatcher', {
      name: 'BUG CATCHER IKE', team: [{ species: 'caddibuzz', lv: -1 }, { species: 'caddibuzz', lv: 0 }],
      intro: ['Shh! You scared off a rare bug!'], defeat: ['Now my bugs are scared too...'],
    }),
    trainer('r2c', 7, 19, 'right', 'lass', {
      name: 'LASS JONNA', team: [{ species: 'hivecub', lv: 0 }, { species: 'pipwing', lv: -1 }],
      intro: ['The ruins east of here are spooky. Battle me so I feel brave!'], defeat: ['I still feel scared.'],
      after: ['JONNA: People say the LOWBANK RUINS were a village before the big flood. Long before the dam, even.'],
    }),
    ball('route2', 21, 1, 'potion', 2),
    ball('route2', 22, 27, 'antidote'),
  ],
  inspect: {
    '3,20': ['ROUTE 2', 'West: STILLBROOK  East: LOWBANK RUINS  South: VALECROWN CITY'],
  },
  encounters: mons(['pipwing', 35], ['caddibuzz', 30], ['pixling', 35]),
};

// --- Lowbank Ruins --------------------------------------------------------------------------

const ruin = bld('ruin', 14, 4);

const lowbank: MapDef = {
  id: 'lowbank',
  name: 'LOWBANK RUINS',
  kind: 'outdoor',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T,,,,....TTT......,,,,,,.T',
    'T,,,,.O..TTT..O...,,,,,,.T',
    'T,,,,.........FF..,,,,,,.T',
    'T.....,,,,....BBBBB......T',
    'T.O...,,,,....BBBBB..O...T',
    'T.....,,,,....BBBBB......T',
    'T.............BBDBB......T',
    '::::::::::::::::.........T',
    '::::::::::::::::..,,,,,..T',
    'T......O......:...,,,,,..T',
    'T.,,,,,.......:...,,,,,..T',
    'T.,,,,,...~~~~~~..,,,,,..T',
    'T.,,,,,...~~~~~~.........T',
    'T.........~~~~~~...O.O...T',
    'T..OO.....~~~~~~.........T',
    'T,,,,,,..........,,,,,,,.T',
    'T,,,,,,....OOO...,,,,,,,.T',
    'T,,,,,,..........,,,,,,,.T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [ruin],
  warps: [doorTo(ruin, 'ruinHouse', 4, 5)],
  exits: [{ side: 'west', from: 8, to: 9, map: 'route2', offset: 6 }],
  npcs: [
    person('lb1', 'RUIN MANIAC OSK', 20, 8, 'left', 'hiker', [
      'OSK: The LOWBANK RUINS! A whole village, abandoned when the river changed course, long ago.',
      'OSK: Well, some say it was abandoned. Others say the people moved up the river to build STILLBROOK.',
    ]),
    trainer('lbT', 4, 10, 'right', 'medium', {
      name: 'MEDIUM ELKE', team: [{ species: 'wispjel', lv: 0 }, { species: 'wispjel', lv: 1 }],
      intro: ['Something lives in these ruins. Something old.'], defeat: ['It was only me after all.'],
    }),
    ball('lowbank', 24, 1, 'ultraball'),
    ball('lowbank', 12, 16, 'revive'),
  ],
  inspect: {
    '6,2': ['An old stone with worn carvings. You can make out waves... and a door?'],
    '14,2': ['A moss-covered stone marker: LOWBANK.'],
    '21,5': ['A broken stone lantern.'],
    '7,10': ['A broken stone lantern.'],
    '11,17': ['The foundation of an old house.'],
    '12,17': ['The foundation of an old house.'],
    '13,17': ['The foundation of an old house.'],
  },
  encounters: mons(['caddibuzz', 25], ['hivecub', 20], ['geodling', 20], ['mossfawn', 10], ['wispjel', 25]),
  fishing: mons(['murkfin', 70], ['lochlet', 30]),
};

const ruinHouse: MapDef = {
  id: 'ruinHouse',
  name: 'OLD HOUSE',
  kind: 'indoor',
  rows: [
    '#########',
    '#WWwWWBW#',
    '#_______#',
    '#_TT__p_#',
    '#_TT____#',
    '#p______#',
    '#___X___#',
    '#########',
  ],
  buildings: [],
  warps: [{ x: 4, y: 6, to: 'lowbank', tx: ruin.door.x, ty: ruin.door.y + 1, facing: 'down' }],
  npcs: [],
  inspect: {
    '3,1': ['The window frame is empty. Ivy grows through it.'],
    '2,3': ['A dusty table. Two old cups still stand on it.'],
  },
};

export const SOUTH: MapDef[] = [
  stillbrook, home, jasperHome, gymFor('stillbrook', 'stillbrook', sbGym),
  route1, lanterncross, shrine, lcCenterMap, lcHouseMap, lcGymMap, pension,
  route7, reedmouth, rmCenterMap, rmGymMap, rodFisher, reeveHouse,
  route8, valecrown, vcCenterMap, vcGymMap, vcHouseMap, plant,
  route2, lowbank, ruinHouse,
];

export { badges };

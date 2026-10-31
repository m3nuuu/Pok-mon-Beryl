// Upstream of Stillbrook: the dam, Weirhaven, Mirrormere Shore and the northern villages.
import { all, ball, badges, before, bld, has, mons, person, trainer, type MapDef } from '../mapkit';
import { gymFor } from './gyms';
import { CENTER_IN, GYM_IN, HOUSE_IN, centerMap, doorTo, houseMap } from './interiors';

// --- Dam Road (Stillbrook → Weirhaven) -------------------------------------------------------

const damroad: MapDef = {
  id: 'damroad',
  name: 'DAM ROAD',
  kind: 'outdoor',
  rows: [
    'TTTTTTTTT::TTTTTTTTT',
    'TRRR.....::.....RRRT',
    'TRR......::......RRT',
    'TR...,,,.::.,,,...RT',
    'TR...,,,.::.,,,...RT',
    'TR.......::.......RT',
    'TRRRR....::....RRRRT',
    'T........::........T',
    'T.,,,,...::...,,,,.T',
    'T.,,,,...::...,,,,.T',
    'T........::........T',
    'TTTT.....::.....TTTT',
    'T........::........T',
    'T..S.....::........T',
    'T....,,,,::,,,,....T',
    'T....,,,,::,,,,....T',
    'T........::........T',
    'TRRR.....::......RRT',
    'T........::........T',
    'T........::........T',
    '::::::::::::.......T',
    '::::::::::::.......T',
    'T.........,,,,.....T',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'west', from: 20, to: 21, map: 'stillbrook', offset: -16 },
    { side: 'north', from: 9, to: 10, map: 'weirhaven', offset: 1 },
  ],
  npcs: [
    trainer('drA', 12, 18, 'left', 'worker', {
      name: 'WORKER KNUT', team: [{ species: 'pipwing', lv: 0 }, { species: 'pixling', lv: 0 }],
      intro: ["Commuting to the dam again. A battle wakes me up!"], defeat: ['Okay, I\'m awake now.'],
      after: ['KNUT: Your parents work in the control room, right? Good people. Always the last to leave.'],
    }),
    trainer('drB', 4, 10, 'right', 'lass', {
      name: 'LASS MIA', team: [{ species: 'wispjel', lv: -1 }, { species: 'hivecub', lv: 0 }],
      intro: ['Ghosts come out of the reservoir at night. I came to see them!'], defeat: ['Nothing spooky about that loss...'],
    }),
    trainer('drC', 14, 4, 'left', 'hiker', {
      name: 'HIKER ANDOR', team: [{ species: 'geodling', lv: -1 }, { species: 'caddibuzz', lv: 0 }],
      intro: ['This road is steep! Good training!'], defeat: ['Phew, need a breather.'],
    }),
    ball('damroad', 18, 22, 'potion', 2),
    ball('damroad', 1, 12, 'awakening'),
  ],
  inspect: { '3,13': ['DAM ROAD', 'North: WEIRHAVEN  West: STILLBROOK'] },
  encounters: mons(['pipwing', 35], ['wispjel', 25], ['pixling', 25], ['caddibuzz', 15]),
};

// --- Weirhaven, the company town on the dam -------------------------------------------------

const whCenter = bld('center', 2, 3);
const whGym = bld('gym', 14, 2);
const whOffice = bld('office', 2, 12);
const whHouse = bld('house', 14, 12);

const weirhaven: MapDef = {
  id: 'weirhaven',
  name: 'WEIRHAVEN',
  kind: 'outdoor',
  theme: 'dam',
  town: 'weirhaven',
  rows: [
    'TTTTTTTTTT::TTTTTTTTTT~~~~~~~~~T',
    'T.........::.........~~~~~~~~~~T',
    'T.........::..BBBBBBB.~~~~~~~~~T',
    'T.BBBBBB..::..BBBBBBB.~~~~~~~~~T',
    'T.BBBBBB..::..BBBBBBB.~~~~~~~~~T',
    'T.BBBBBB..::..BBBBBBB.~~~~~~~~~T',
    'T.BBDBBB..::..BBBDBBB.d~~~~~~~~T',
    'T...:.....::.....:....d~~~~~~~~T',
    'T...::::::::::::::....~~~~~~~~~T',
    'T.........::..........~~~~~~~~~T',
    'T..L......::......L...~~~~~~~~~T',
    'T.........::..........~~~~~~~~~T',
    'T.BBBBBBBB::..BBBBB...WWWWWWWWWT',
    'T.BBBBBBBB::..BBBBB...WWWWWWWWWT',
    'T.BBBBBBBB::..BBBBB.............',
    'T.BBBBBBBB::..BBDBB.............',
    'T.BBBDBBBB::....:.....WWWWWWWWWT',
    'T....:....::....:.....WWWWWWWWWT',
    'T....:::::::::::::....WWWWWWWWWT',
    'T.........::..........WWWWWWWWWT',
    'T..S......::...FF.....VVVVVVVVVT',
    'T.........::...FF.....VVVVVVVVVT',
    'T.........::..........~~~~~~~~~T',
    'TTTTTTTTTT::TTTTTTTTTT~~~~~~~~~T',
  ],
  buildings: [whCenter, whGym, whOffice, whHouse],
  warps: [
    doorTo(whCenter, 'center_weirhaven', CENTER_IN.x, CENTER_IN.y),
    doorTo(whGym, 'gym_weirhaven', GYM_IN.x, GYM_IN.y),
    doorTo(whOffice, 'office', 7, 7),
    doorTo(whHouse, 'house_weirhaven', HOUSE_IN.x, HOUSE_IN.y),
  ],
  exits: [
    { side: 'south', from: 10, to: 11, map: 'damroad', offset: -1 },
    { side: 'north', from: 10, to: 11, map: 'shore', offset: -1 },
    { side: 'east', from: 14, to: 15, map: 'damcrest', offset: -11 },
  ],
  npcs: [
    { id: 'crestGuard', name: 'GUARD', x: 21, y: 14, facing: 'left', look: 'police', when: before('ev8') },
    { id: 'crestGuard2', name: 'GUARD', x: 21, y: 15, facing: 'left', look: 'police', when: before('ev8') },
    person('wh1', 'CLERK FRIDA', 7, 9, 'down', 'lass', [
      'FRIDA: Welcome to WEIRHAVEN, home of the LETHYS DAM COMPANY! Everyone here works for the dam.',
    ]),
    person('wh2', 'OLD PER', 19, 10, 'right', 'oldman', [
      'PER: My village lies at the bottom of MIRRORMERE. On calm days you can still see the church tower.',
    ]),
    person('wh3', 'FISHER LOU', 21, 7, 'right', 'fisher', [
      'LOU: Strange things in the lake lately. Ghost POKéMON drifting up at night, and the water rising and falling.',
    ]),
    { id: 'ghost1', name: 'POKéMON', x: 20, y: 11, facing: 'down', look: 'mon-wispjel', when: all(has('ev7'), before('ev7done')) },
    { id: 'ghost2', name: 'POKéMON', x: 13, y: 9, facing: 'down', look: 'mon-wispjel', when: all(has('ev7'), before('ev7done')) },
    { id: 'jasperProtest', name: 'JASPER', x: 9, y: 17, facing: 'right', look: 'jasper', when: between4 },
  ],
  inspect: {
    '3,20': ['WEIRHAVEN', 'Built by the LETHYS DAM COMPANY. Powering KALDRIA since 1962.'],
    '3,10': ['A tall lamp post with the company logo.'],
    '18,10': ['A tall lamp post with the company logo.'],
    '22,12': ['MIRRORMERE DAM. The wall drops down into the spillway far below.'],
  },
  fishing: mons(['murkfin', 50], ['lochlet', 30], ['wispjel', 20]),
};

function between4(f: Record<string, boolean>) {
  return !!f.ev4 && !f.ev4done;
}

const office: MapDef = {
  id: 'office',
  name: 'DAM COMPANY OFFICE',
  kind: 'indoor',
  theme: 'dam',
  rows: [
    '##############',
    '#WWWWWXWWWWWW#',
    '#____________#',
    '#rrrr____rrrr#',
    '#____________#',
    '#_TT______TT_#',
    '#____________#',
    '#p__________p#',
    '#______X_____#',
    '##############',
  ],
  buildings: [],
  warps: [
    { x: 7, y: 8, to: 'weirhaven', tx: whOffice.door.x, ty: whOffice.door.y + 1, facing: 'down' },
    { x: 6, y: 1, to: 'dam', tx: 7, ty: 11, facing: 'up', when: has('damOpen'), locked: ["RECEPTIONIST: Sorry, staff only beyond this point!"] },
  ],
  npcs: [
    { id: 'reception', name: 'RECEPTIONIST', x: 2, y: 2, facing: 'down', look: 'lass' },
    { id: 'crest', name: 'DIRECTOR CREST', x: 11, y: 2, facing: 'down', look: 'crest', when: before('ev8') },
    person('officeW', 'WORKER', 10, 6, 'left', 'worker', ['WORKER: Paperwork, paperwork... The dam runs on paperwork, I swear.']),
  ],
  inspect: {
    '2,5': ['A model of the dam. A tiny plaque says: MIRRORMERE DAM, 1962. Chief engineers: I. MARLOW, E. BERG.'],
    '3,5': ['A model of the dam. A tiny plaque says: MIRRORMERE DAM, 1962. Chief engineers: I. MARLOW, E. BERG.'],
  },
};

const dam: MapDef = {
  id: 'dam',
  name: 'INSIDE THE DAM',
  kind: 'indoor',
  theme: 'dam',
  rows: [
    '####################',
    '#WWWWWWWWWWWWWWWWWW#',
    '#__zz____~~____zz__#',
    '#__zz____~~____zz__#',
    '#________~~_______H#',
    '#_rrrr___==___rrrr_#',
    '#________~~________#',
    '#__zz____~~____zz__#',
    '#________~~________#',
    '#WWWW____==____WWWW#',
    '#________~~________#',
    '#_p______~~______p_#',
    '#______X_~~________#',
    '####################',
  ],
  buildings: [],
  warps: [
    { x: 7, y: 12, to: 'office', tx: 6, ty: 2, facing: 'down' },
    { x: 18, y: 4, to: 'tunnel', tx: 5, ty: 11, facing: 'up', when: badges(5), locked: ['A metal hatch in the floor. It is bolted shut. Cold air seeps through the cracks.'] },
  ],
  npcs: [
    { id: 'mum', name: 'MUM', x: 3, y: 4, facing: 'down', look: 'mum', when: (f) => !f.ev6 || !!f.ev8 },
    { id: 'dad', name: 'DAD', x: 16, y: 4, facing: 'down', look: 'dad', when: (f) => !f.ev6 || !!f.ev8 },
    { id: 'ingrid', name: 'INGRID', x: 12, y: 8, facing: 'left', look: 'ingrid' },
    { id: 'vesperBomb', name: 'VESPER', x: 16, y: 10, facing: 'left', look: 'vesper', when: all(has('ev7'), before('ev7done')) },
    trainer('bombG1', 4, 10, 'right', 'grunt', {
      name: 'FLOWKEEPER', team: [{ species: 'wispjel', lv: 0 }, { species: 'murkeel', lv: -2 }], tier: 'boss',
      intro: ['Too late, kid! The charges are already set!'], defeat: ['Go on then. Stop VESPER if you can.'],
    }, all(has('ev7'), before('ev7done'))),
  ],
  inspect: {
    '3,2': ['A giant turbine roars behind the glass.'],
    '15,2': ['A giant turbine roars behind the glass.'],
    '2,5': ['Control panels with hundreds of lights. WATER LEVEL: rising.'],
    '15,5': ['Control panels with hundreds of lights. SPILLWAY: closed.'],
    '19,4': ['The wall here is cold. You hear running water behind it.'],
  },
};

const tunnel: MapDef = {
  id: 'tunnel',
  name: 'MAINTENANCE TUNNEL',
  kind: 'indoor',
  theme: 'dark',
  rows: [
    '##########',
    '#WWWaaWWW#',
    '#________#',
    '#_g____g_#',
    '#________#',
    '###____###',
    '###____###',
    '#________#',
    '#________#',
    '###____###',
    '###____###',
    '#________#',
    '#____X___#',
    '##########',
  ],
  buildings: [],
  warps: [{ x: 5, y: 12, to: 'dam', tx: 18, ty: 3, facing: 'down' }],
  npcs: [],
  inspect: {
    '2,3': ['An old stone pillar, carved with waves. Much older than the concrete around it.'],
    '7,3': ['An old stone pillar, carved with waves. Much older than the concrete around it.'],
  },
  encounters: mons(['wispjel', 70], ['geodling', 30]),
  encounterTile: '_',
  battleBg: 'night',
};

const damcrest: MapDef = {
  id: 'damcrest',
  name: 'DAM CREST',
  kind: 'outdoor',
  theme: 'dam',
  rows: [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    '::::::::::::::::::::::::::::WW',
    '::::::::::::::::::::::::::::WW',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  buildings: [],
  warps: [],
  exits: [{ side: 'west', from: 3, to: 4, map: 'weirhaven', offset: 11 }],
  npcs: [],
  inspect: {},
  battleBg: 'water',
};

const whCenterMap = centerMap('weirhaven', 'WEIRHAVEN', 'weirhaven', whCenter);
const whGymMap = gymFor('weirhaven', 'weirhaven', whGym);
const whHouseMap = houseMap('house_weirhaven', 'COMPANY HOUSING', 'weirhaven', whHouse, [
  person('whh1', 'NIGHT SHIFT ULLA', 3, 2, 'down', 'worker', [
    "ULLA: I work nights at the dam. Sometimes I hear singing from the water. Low, like a whale. Don't tell anyone.",
  ]),
]);

// --- Mirrormere Shore --------------------------------------------------------------------------

const pumpB = bld('pump', 3, 18);

const shore: MapDef = {
  id: 'shore',
  name: 'MIRRORMERE SHORE',
  kind: 'outdoor',
  rows: [
    'TTTTTTTTT::TTTTTTTTT',
    'T........::...~~~~~T',
    'T.,,,,...::...~~~~~T',
    'T.,,,,...::...~~~~~T',
    'T........::...~~~~~T',
    '::::::::::::..~~~~~T',
    '::::::::::::..~~~~~T',
    'T........::...~~~~~T',
    'T..TT....::...~~~~~T',
    'T..TT....::....~~~~T',
    'T........::.....~~~T',
    'T.,,,,,..::......~~T',
    'T.,,,,,..::........T',
    'T........::........T',
    'T........:::::::::::',
    'T........:::::::::::',
    'T..S.....::........T',
    'T........::..,,,,..T',
    'T..BBBB..::..,,,,..T',
    'T..BBBB..::..,,,,..T',
    'T..BDBB..::........T',
    'T...:....::...~~~..T',
    'T...::::::::..~~~..T',
    'T........::...~~~..T',
    'T.,,,,...::........T',
    'T.,,,,...::..TT....T',
    'T........::..TT....T',
    'T..FF....::........T',
    'T........::........T',
    'TTTTTTTTT::TTTTTTTTT',
  ],
  buildings: [pumpB],
  warps: [doorTo(pumpB, 'pump', 4, 5)],
  exits: [
    { side: 'south', from: 9, to: 10, map: 'weirhaven', offset: 1 },
    { side: 'north', from: 9, to: 10, map: 'route6', offset: -1 },
    { side: 'west', from: 5, to: 6, map: 'route5', offset: 0 },
    { side: 'east', from: 14, to: 15, map: 'mossveil', offset: -4 },
  ],
  npcs: [
    trainer('shA', 13, 12, 'left', 'fisher', {
      name: 'FISHER HAL', team: [{ species: 'murkfin', lv: 1 }, { species: 'murkfin', lv: 1 }, { species: 'lochlet', lv: 0 }],
      intro: ["Shh! You'll scare the fish! ...Fine, let's battle."], defeat: ['The one that got away... was me.'],
    }),
    trainer('shB', 6, 24, 'right', 'lass', {
      name: 'PICNICKER SIV', team: [{ species: 'hivecub', lv: 0 }, { species: 'pixling', lv: 0 }],
      intro: ['Isn\'t the lake beautiful? Battle me by the water!'], defeat: ['Even losing is nice with this view.'],
    }),
    trainer('shC', 5, 3, 'down', 'medium', {
      name: 'MEDIUM ROAN', team: [{ species: 'wispjel', lv: 1 }],
      intro: ['The drowned villages are calling...'], defeat: ['The call has faded.'],
    }),
    person('shoreSign', 'INGRID', 6, 21, 'left', 'ingrid', [], all(badges(3), before('pumpFixed'))),
    ball('shore', 18, 12, 'superpotion'),
    ball('shore', 1, 28, 'greatball', 2),
  ],
  inspect: {
    '3,16': ['MIRRORMERE SHORE', 'North: ROUTE 6 to FROSTSPRING  West: CRAGMOOR  East: MOSSVEIL WOOD'],
  },
  encounters: mons(['wispjel', 30], ['pixling', 25], ['pipwing', 25], ['caddibuzz', 20]),
  fishing: mons(['lochlet', 45], ['murkfin', 35], ['murkeel', 5], ['newtide', 15]),
};

const pump: MapDef = {
  id: 'pump',
  name: 'PUMP STATION',
  kind: 'indoor',
  theme: 'dam',
  rows: [
    '#########',
    '#WWzzzWW#',
    '#_______#',
    '#z_~~~_z#',
    '#__~~~__#',
    '#_______#',
    '#___X___#',
    '#########',
  ],
  buildings: [],
  warps: [{ x: 4, y: 6, to: 'shore', tx: pumpB.door.x, ty: pumpB.door.y + 1, facing: 'down' }],
  npcs: [
    { id: 'pumpMon', name: 'MURKEEL', x: 4, y: 2, facing: 'down', look: 'mon-murkeel', when: all(has('pumpQuest'), before('pumpFixed')) },
  ],
  inspect: {
    '3,1': ['A big valve wheel. It is stuck fast.'],
    '4,1': ['The main pump. It groans and rattles.'],
    '5,1': ['A pressure gauge. The needle is in the red.'],
  },
  battleBg: 'water',
};

// --- Route 5 and Cragmoor ------------------------------------------------------------------

const route5: MapDef = {
  id: 'route5',
  name: 'ROUTE 5',
  kind: 'outdoor',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TRRRR.....,,,,,,....RRRT',
    'TRR.......,,,,,,......RT',
    'TR..,,,,..,,,,,,.......T',
    'T...,,,,...............T',
    'T...,,,,....::::::::::::',
    'T...........::::::::::::',
    'T..O........::...,,,,..T',
    '::::::::::::::...,,,,..T',
    '::::::::::::::...,,,,..T',
    'T.......,,,,.....OO....T',
    'TR......,,,,...........T',
    'TRR.....,,,,.....,,,,..T',
    'TRRR.............,,,,.RT',
    'TRRRRR.............RRRRT',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'east', from: 5, to: 6, map: 'shore', offset: 0 },
    { side: 'west', from: 8, to: 9, map: 'cragmoor', offset: 2 },
  ],
  npcs: [
    trainer('r5a', 10, 9, 'left', 'hiker', {
      name: 'HIKER STIG', team: [{ species: 'geodling', lv: 0 }, { species: 'geodling', lv: 0 }],
      intro: ['The mountains are calling, and so am I!'], defeat: ['The mountain wins this time... no, you do.'],
    }),
    trainer('r5b', 18, 11, 'up', 'bugcatcher', {
      name: 'BUG CATCHER NOOR', team: [{ species: 'caddibuzz', lv: 1 }],
      intro: ['My CADDIBUZZ is almost ready to evolve!'], defeat: ['Almost...'],
    }),
    ball('route5', 21, 2, 'iceheal'),
    ball('route5', 1, 4, 'repel', 2),
  ],
  inspect: {},
  encounters: mons(['caddibuzz', 30], ['hivecub', 25], ['pipwing', 25], ['geodling', 20]),
};

const cmCenter = bld('center', 16, 3);
const cmGym = bld('gym', 4, 13);
const cmHouse = bld('house2', 17, 13);

const cragmoor: MapDef = {
  id: 'cragmoor',
  name: 'CRAGMOOR',
  kind: 'outdoor',
  town: 'cragmoor',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TRRRRRRRRRRRRRRRRRRRRRRRRRRT',
    'TRRRRCRRRR.........RRRRRRRRT',
    'TR...:..........BBBBBB....RT',
    'TR...:..........BBBBBB....RT',
    'TR...:...O......BBBBBB....RT',
    'TR...:..........BBDBBB....RT',
    'T....:............:.......RT',
    'T....::::::::::::::::.....RT',
    'T.........:...............RT',
    'T.........:.................',
    'T.........::::::::::::::::::',
    'T....................,,,,..T',
    'T...BBBBBBB......BBBBB,,,..T',
    'T...BBBBBBB......BBBBB,,,..T',
    'T...BBBBBBB......BBBBB.....T',
    'T...BBBBBBB......BBDBB.....T',
    'T...BBBDBBB........:.......T',
    'T......:...........:...O...T',
    'T......:::::::::::::.......T',
    'T..S.......................T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [cmCenter, cmGym, cmHouse],
  warps: [
    doorTo(cmCenter, 'center_cragmoor', CENTER_IN.x, CENTER_IN.y),
    doorTo(cmGym, 'gym_cragmoor', GYM_IN.x, GYM_IN.y),
    doorTo(cmHouse, 'house_cragmoor', HOUSE_IN.x, HOUSE_IN.y),
    { x: 5, y: 2, to: 'emberdeep', tx: 11, ty: 21, facing: 'up' },
  ],
  exits: [{ side: 'east', from: 10, to: 11, map: 'route5', offset: -2 }],
  npcs: [
    person('cm1', 'MINER ASTA', 7, 9, 'down', 'miner', [
      'ASTA: CRAGMOOR is a mining village. We dig for the stone the dam was built from!',
    ]),
    person('cm2', 'OLD HELGI', 22, 18, 'left', 'oldman', [
      'HELGI: Before the dam, the river ran so fast in spring you could hear it from the mountains.',
      'HELGI: My grandmother would say the LETHYS was singing the dead to sleep.',
    ]),
  ],
  inspect: {
    '3,20': ['CRAGMOOR', 'A village carved from the mountain.'],
    '5,3': ['EMBERDEEP CAVE. Danger: hot rock ahead!'],
    '9,5': ['A cart full of grey stone.'],
  },
};

const cmCenterMap = centerMap('cragmoor', 'CRAGMOOR', 'cragmoor', cmCenter);
const cmGymMap = gymFor('cragmoor', 'cragmoor', cmGym);
const cmHouseMap = houseMap('house_cragmoor', "MINERS' LODGE", 'cragmoor', cmHouse, [
  person('cmh1', 'COOK BIRTA', 3, 2, 'down', 'oldwoman', [
    'BIRTA: The boys have been stuck in EMBERDEEP for days. Something big is living in the rubble, they say.',
  ]),
]);

const emberdeep: MapDef = {
  id: 'emberdeep',
  name: 'EMBERDEEP CAVE',
  kind: 'outdoor',
  theme: 'cave',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T....TTTT,,,,,,TTTT....T',
    'T.ll.TTTT,,,,,,TTTT.,,.T',
    'T.ll....,,,,,,,,....,,.T',
    'T.......TTTTTTTT....,,.T',
    'T,,,,...TTTTTTTT.......T',
    'T,,,,...........TTTTT..T',
    'TTTTTTTTTTT..TTTTTTTTTTT',
    'T,,,,,.............,,,,T',
    'T,,,,,.....TT......,,,,T',
    'T..........TT..........T',
    'T...TT..,,,,,,,,..TT...T',
    'T...TT..,,,,,,,,..TT...T',
    'T.......,,,,,,,,.......T',
    'TTTTTT...........TTTTTTT',
    'T,,,,,,.........,,,,,,,T',
    'T,,,,,,...TTT...,,,,,,,T',
    'T.........TTT..........T',
    'T...TT.............TT..T',
    'T...TT....,,,,.....TT..T',
    'T.........,,,,.........T',
    'T......................T',
    'TTTTTTTTTTTCTTTTTTTTTTTT',
  ],
  buildings: [],
  warps: [{ x: 11, y: 22, to: 'cragmoor', tx: 5, ty: 3, facing: 'down' }],
  npcs: [
    { id: 'miner1', name: 'FOREMAN DAG', x: 11, y: 8, facing: 'down', look: 'miner', when: before('caveCleared') },
    { id: 'miner2', name: 'MINER', x: 12, y: 7, facing: 'down', look: 'miner', when: before('caveCleared') },
    { id: 'miner1', name: 'FOREMAN DAG', x: 9, y: 8, facing: 'right', look: 'miner', when: has('caveCleared') },
    trainer('edA', 3, 18, 'right', 'hiker', {
      name: 'HIKER RUNE', team: [{ species: 'geodling', lv: 0 }, { species: 'caddicairn', lv: -2 }],
      intro: ['It gets hot down here. Keep up!'], defeat: ['Sweating too much to battle...'],
    }),
    trainer('edB', 19, 10, 'left', 'miner', {
      name: 'MINER JOSTEIN', team: [{ species: 'caddibuzz', lv: 0 }, { species: 'geodling', lv: 1 }],
      intro: ['Watch your step! Rocks fall here all the time!'], defeat: ['Ow! Was that a rock or you?'],
    }),
    { id: 'fossilFin', name: 'FOSSIL', x: 20, y: 1, facing: 'down', look: 'fossil', when: all(has('caveCleared'), before('tookFossil')) },
    { id: 'fossilGeode', name: 'FOSSIL', x: 22, y: 1, facing: 'down', look: 'fossil', when: all(has('caveCleared'), before('tookFossil')) },
    ball('emberdeep', 1, 13, 'burnheal', 2),
    ball('emberdeep', 22, 21, 'superpotion'),
  ],
  inspect: {
    '2,2': ['Bubbling lava! The heat is unbearable.'],
    '3,2': ['Bubbling lava! The heat is unbearable.'],
    '2,3': ['Bubbling lava! The heat is unbearable.'],
    '3,3': ['Bubbling lava! The heat is unbearable.'],
  },
  encounters: mons(['geodling', 40], ['caddibuzz', 30], ['caddicairn', 10], ['wispjel', 20]),
  zones: [{ x0: 1, y0: 1, x1: 7, y1: 6, encounters: mons(['cindaroo', 50], ['geodling', 40], ['marrowroo', 10]) }],
  battleBg: 'cave',
};

// --- Mossveil Wood and Pinehollow ------------------------------------------------------------

const mossveil: MapDef = {
  id: 'mossveil',
  name: 'MOSSVEIL WOOD',
  kind: 'outdoor',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTT,,,,TTTTT,,,,,TTTT,,,TT',
    'TT,,,,,,TTT,,,,,,,TT,,,,TT',
    'TT,,TT,,,,,,,TT,,,,,,TT,TT',
    'TT,,TT,,,,,,,TT,,,,,,TT,TT',
    'TT,,,,,,TTT,,,,,,TTT,,,,TT',
    'TTTT,,,,TTT,,,,,,TTT,,,,TT',
    'TT......:::::::::........T',
    'TT......:TTTT..T::::::::::',
    'TT......:TTTT..T::::::::::',
    ':::::::::......T,,,,,,,,TT',
    ':::::::::......T,,,,,,,,TT',
    'TT,,,,,,,..TT...,,TT,,,,TT',
    'TT,,,,,,,..TT...,,TT,,,,TT',
    'TT,,TT,,,,,,,,,,,,,,,,,,TT',
    'TT,,TT,,,TTTTT,,,,TTT,,,TT',
    'TT,,,,,,,TTTTT,,,,TTT,,,TT',
    'TTT,,,,,,,,,,,,,,,,,,,,TTT',
    'TTTT,,,,,,TTTT,,,,,,,TTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'west', from: 10, to: 11, map: 'shore', offset: 4 },
    { side: 'east', from: 8, to: 9, map: 'pinehollow', offset: 0 },
  ],
  npcs: [
    trainer('mvA', 4, 7, 'right', 'bugcatcher', {
      name: 'BUG CATCHER ALVA', team: [{ species: 'caddibuzz', lv: 0 }, { species: 'caddibuzz', lv: 1 }, { species: 'hivecub', lv: -1 }],
      intro: ['MOSSVEIL WOOD is the best bug spot in KALDRIA!'], defeat: ['You squashed my bugs!'],
    }),
    trainer('mvB', 13, 14, 'up', 'ranger', {
      name: 'RANGER KJELL', team: [{ species: 'mossfawn', lv: 0 }, { species: 'pipwing', lv: 1 }],
      intro: ['I protect this forest. Prove you respect it!'], defeat: ['You may pass, trainer.'],
      after: ['KJELL: The forest floor used to flood every spring and come back greener. Now it just dries out.'],
    }),
    trainer('mvC', 21, 12, 'left', 'lass', {
      name: 'LASS EIRA', team: [{ species: 'hivecub', lv: 1 }, { species: 'hivecub', lv: 1 }],
      intro: ['I came for honey and found you instead!'], defeat: ['No honey for me today.'],
    }),
    { id: 'runaway3', name: 'RUNAWAY POKéMON', x: 3, y: 17, facing: 'down', look: 'mon-pipwing', when: all(has('pensionQuest'), before('runaway3')) },
    ball('mossveil', 23, 1, 'revive'),
    ball('mossveil', 2, 2, 'greatball', 2),
  ],
  inspect: {},
  encounters: mons(['caddibuzz', 35], ['hivecub', 30], ['mossfawn', 10], ['pixling', 15], ['wispjel', 10]),
};

const phCenter = bld('center', 3, 2);
const phGym = bld('gym', 15, 2);
const phHouse = bld('house', 4, 12);
const phHouse3 = bld('cabin', 15, 12);

const pinehollow: MapDef = {
  id: 'pinehollow',
  name: 'PINEHOLLOW',
  kind: 'outdoor',
  town: 'pinehollow',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT......................TT',
    'TT.BBBBBB......BBBBBBB..TT',
    'TT.BBBBBB......BBBBBBB..TT',
    'TT.BBBBBB......BBBBBBB..TT',
    'TT.BBDBBB......BBBBBBB..TT',
    'TT...:.........BBBDBBB..TT',
    'TT...:............:.....TT',
    ':::::::::::::::::::.....TT',
    ':::::::::::::::::::.....TT',
    'TT.......:..............TT',
    'TT..F....:.......F......TT',
    'TT..BBBBB:.....BBBBB....TT',
    'TT..BBBBB:.....BBBBB....TT',
    'TT..BBBBB:.....BBBBB....TT',
    'TT..BBDBB:.....BBDBB....TT',
    'TT....:..:.......:......TT',
    'TT....:::::::::::::..S..TT',
    'TT......................TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [phCenter, phGym, phHouse, phHouse3],
  warps: [
    doorTo(phCenter, 'center_pinehollow', CENTER_IN.x, CENTER_IN.y),
    doorTo(phGym, 'gym_pinehollow', GYM_IN.x, GYM_IN.y),
    doorTo(phHouse, 'house_pinehollow', HOUSE_IN.x, HOUSE_IN.y),
  ],
  exits: [{ side: 'west', from: 8, to: 9, map: 'mossveil', offset: 0 }],
  npcs: [
    person('ph1', 'WOODCUTTER AKE', 12, 10, 'down', 'hiker', [
      'AKE: PINEHOLLOW is the last village before the deep forest. The DRAGON GYM has been here for centuries.',
    ]),
    person('ph2', 'GRANNY SOLVI', 21, 16, 'left', 'oldwoman', [
      'SOLVI: When I was young, dragons flew over MIRRORMERE. Before it was MIRRORMERE, I mean.',
    ]),
  ],
  inspect: {
    '21,17': ['PINEHOLLOW', 'The hamlet at the edge of MOSSVEIL WOOD.'],
    '17,15': ['A snug cabin. Nobody answers the door.'],
  },
};

const phCenterMap = centerMap('pinehollow', 'PINEHOLLOW', 'pinehollow', phCenter);
const phGymMap = gymFor('pinehollow', 'pinehollow', phGym);
const phHouseMap = houseMap('house_pinehollow', 'OLD HOUSE', 'pinehollow', phHouse, [
  person('phh1', 'STORYTELLER EBBA', 3, 2, 'down', 'oldwoman', [
    'EBBA: Do you know the old saying? "Not every wall is meant to hold water."',
    'EBBA: The old ones built doors in their river walls, so the spirits could pass. Nobody does that anymore.',
  ]),
]);

// --- Route 6 and Frostspring ------------------------------------------------------------------

const route6: MapDef = {
  id: 'route6',
  name: 'ROUTE 6',
  kind: 'outdoor',
  theme: 'snow',
  rows: [
    'TTTTTTTT::TTTTTTTT',
    'TRR.....::.....RRT',
    'TR..,,,.::.,,,..RT',
    'TR..,,,.::.,,,..RT',
    'T.......::.......T',
    'TRRR....::....RRRT',
    'T.......::.......T',
    'T.,,,,,.::.,,,,,.T',
    'T.,,,,,.::.,,,,,.T',
    'T.......::.......T',
    'T..RR...::...RR..T',
    'T..RR...::...RR..T',
    'T.......::.......T',
    'T,,,,,..::..,,,,,T',
    'T,,,,,..::..,,,,,T',
    'T.......::.......T',
    'TRRRR...::...RRRRT',
    'T.......::.......T',
    'T..S....::.,,,,..T',
    'T.......::.,,,,..T',
    'T.,,,,..::.,,,,..T',
    'T.,,,,..::.......T',
    'T.......::...RR..T',
    'TRR.....::...RR..T',
    'T.......::.......T',
    'T.,,,,,.::.,,,,,.T',
    'T.,,,,,.::.,,,,,.T',
    'T.......::.......T',
    'TRRR....::....RRRT',
    'TTTTTTTT::TTTTTTTT',
  ],
  buildings: [],
  warps: [],
  exits: [
    { side: 'south', from: 8, to: 9, map: 'shore', offset: 1 },
    { side: 'north', from: 8, to: 9, map: 'frostspring', offset: 6 },
  ],
  npcs: [
    trainer('r6a', 3, 9, 'right', 'skier', {
      name: 'SKIER BRIT', team: [{ species: 'lochlet', lv: 0 }, { species: 'pipwing', lv: 0 }],
      intro: ['Fresh snow! Fresh challenger!'], defeat: ['I wiped out...'],
    }),
    trainer('r6b', 14, 17, 'left', 'hiker', {
      name: 'HIKER TOR', team: [{ species: 'geodling', lv: 1 }, { species: 'caddicairn', lv: -1 }],
      intro: ['Cold up here, huh? A battle will warm us up!'], defeat: ['Still cold...'],
    }),
    trainer('r6c', 5, 24, 'right', 'ace', {
      name: 'ACE SIGRID', team: [{ species: 'newtide', lv: 0 }, { species: 'pixling', lv: 0 }, { species: 'wispjel', lv: 0 }],
      intro: ["I'm heading to the FROSTSPRING GYM. You're in my way!"], defeat: ['Okay, after you.'],
    }),
    ball('route6', 16, 4, 'iceheal', 2),
    ball('route6', 1, 15, 'hyperpotion'),
  ],
  inspect: { '3,18': ['ROUTE 6', 'North: FROSTSPRING, the source of the LETHYS.'] },
  encounters: mons(['pipwing', 30], ['lochlet', 30], ['newtide', 15], ['wispjel', 25]),
  battleBg: 'snow',
};

const fsCenter = bld('center', 3, 8);
const fsGym = bld('gym', 19, 8);
const fsCabin = bld('cabin', 3, 15);

const frostspring: MapDef = {
  id: 'frostspring',
  name: 'FROSTSPRING',
  kind: 'outdoor',
  theme: 'snow',
  town: 'frostspring',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TRRRRRRRRR~~~~~~~~RRRRRRRRRT',
    'TRRRR....~~~~~~~~~~....RRRRT',
    'TRR......~~~~~~~~~~......RRT',
    'TR........~~~~~~~~........RT',
    'TR.........~~~~~~.........RT',
    'T.............::...........T',
    'T.............::...........T',
    'T..BBBBBB.....::...BBBBBBB.T',
    'T..BBBBBB..L..::.L.BBBBBBB.T',
    'T..BBBBBB.....::...BBBBBBB.T',
    'T..BBDBBB.....::...BBBBBBB.T',
    'T....:........::...BBBDBBB.T',
    'T....::::::::::::::::::....T',
    'T.............::...........T',
    'T..BBBBB......::.....,,,,..T',
    'T..BBBBB......::.....,,,,..T',
    'T..BBBBB......::.....,,,,..T',
    'T..BBDBB......::...........T',
    'T....:::::::::::...........T',
    'T.............::...........T',
    'TTTTTTTTTTTTTT::TTTTTTTTTTTT',
  ],
  buildings: [fsCenter, fsGym, fsCabin],
  warps: [
    doorTo(fsCenter, 'center_frostspring', CENTER_IN.x, CENTER_IN.y),
    doorTo(fsGym, 'gym_frostspring', GYM_IN.x, GYM_IN.y),
    doorTo(fsCabin, 'cabin_frostspring', HOUSE_IN.x, HOUSE_IN.y),
  ],
  exits: [{ side: 'south', from: 14, to: 15, map: 'route6', offset: -6 }],
  npcs: [
    { id: 'elvi', name: 'ELVI', x: 9, y: 4, facing: 'right', look: 'oldwoman' },
    person('fs1', 'CHILD AUD', 20, 15, 'left', 'youngster', [
      "AUD: The spring never freezes, even in the coldest winter. Grandma says it's because the river is alive.",
    ]),
    { id: 'lethysSource', name: 'LETHYS', x: 14, y: 5, facing: 'down', look: 'mon-lethys', when: (f) => !!f.decided && !f.gateEnding && !!f.badge_frostspring && !f.lethysDone },
  ],
  inspect: {
    '11,9': ['A lantern frozen in ice.'],
    '17,9': ['A lantern frozen in ice.'],
    '14,6': ['The SOURCE OF THE LETHYS. Clear water bubbles up from deep under the mountain.'],
    '15,6': ['The SOURCE OF THE LETHYS. Clear water bubbles up from deep under the mountain.'],
  },
  fishing: mons(['lochlet', 60], ['newtide', 40]),
  battleBg: 'snow',
};

const fsCenterMap = centerMap('frostspring', 'FROSTSPRING', 'frostspring', fsCenter);
const fsGymMap = gymFor('frostspring', 'frostspring', fsGym);
const fsCabinMap = houseMap('cabin_frostspring', 'SNOWY CABIN', 'frostspring', fsCabin, [
  person('fsc1', 'TRAPPER ORM', 3, 2, 'down', 'hiker', [
    'ORM: Every drop of the LETHYS starts at that spring. The big river, the dam, the delta... all from here.',
    "ORM: If you want to see the river spirit, they say you'll find it where the river is born... or where it ends.",
  ]),
], {}, 'home');

export const NORTH: MapDef[] = [
  damroad, weirhaven, office, dam, tunnel, damcrest, whCenterMap, whGymMap, whHouseMap,
  shore, pump, route5, cragmoor, cmCenterMap, cmGymMap, cmHouseMap, emberdeep,
  mossveil, pinehollow, phCenterMap, phGymMap, phHouseMap,
  route6, frostspring, fsCenterMap, fsGymMap, fsCabinMap,
];

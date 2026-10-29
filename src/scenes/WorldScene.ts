import Phaser from 'phaser';
import { DIR_FRAMES } from '../art/procedural';
import { calcStats, createPokemon, heal, movesKnownAt, rivalStarterFor, wildLevel, type Pokemon } from '../battle/engine';
import { MOVES } from '../data/moves';
import { SPECIES } from '../data/species';
import {
  BUILDINGS, ENCOUNTERS, ENCOUNTER_RATE, MAP_H, MAP_W, NPCS, SIGNS, isSolidTile, tileAt, type NpcId,
} from '../data/stillbrook';
import { heldDirection, isHeld, justPressed } from '../input';
import { game, save, START_POSITION, type Facing } from '../state';
import type { BattleConfig, BattleResult } from './BattleScene';
import type { UIScene } from './UIScene';
import { delay, tweenP } from '../ui/widgets';

const T = 16;
const WALK_MS = 200;
const RUN_MS = 110;
const DELTA: Record<Facing, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE: Record<Facing, Facing> = { up: 'down', down: 'up', left: 'right', right: 'left' };

const TILE_TEXTURES: Record<string, string> = {
  '.': 't-grass', ',': 't-tall', ':': 't-path', F: 't-flowers', T: 't-tree', '~': 't-water0',
  V: 't-spill0', W: 't-dam', E: 't-damdoor', '=': 't-bridge', f: 't-fence', S: 't-sign', B: 't-grass',
};

const nameOf = (p: Pokemon) => SPECIES[p.species].name.toUpperCase();

class Walker {
  sprite: Phaser.GameObjects.Sprite;
  moving = false;
  private stepParity = 0;

  constructor(scene: Phaser.Scene, look: string, public x: number, public y: number, public facing: Facing) {
    this.sprite = scene.add.sprite(0, 0, `c-${look}`, 0).setOrigin(0.5, 1);
    this.place();
    this.face(facing);
  }

  place() {
    this.sprite.setPosition(this.x * T + T / 2, this.y * T + T);
    this.sprite.setDepth(this.y * 10 + 5);
  }

  private frame(offset: number) {
    const base = DIR_FRAMES[this.facing === 'right' ? 'left' : this.facing];
    this.sprite.setFrame(base + offset).setFlipX(this.facing === 'right');
  }

  face(dir: Facing) {
    this.facing = dir;
    this.frame(0);
  }

  async step(scene: Phaser.Scene, dir: Facing, running = false) {
    const ms = running ? RUN_MS : WALK_MS;
    this.face(dir);
    this.moving = true;
    const [dx, dy] = DELTA[dir];
    this.x += dx;
    this.y += dy;
    this.stepParity ^= 1;
    this.frame(1 + this.stepParity);
    this.sprite.setDepth(Math.max(this.y, this.y - dy) * 10 + 5);
    scene.time.delayedCall(ms / 2, () => this.frame(0));
    await tweenP(scene, {
      targets: this.sprite, x: this.x * T + T / 2, y: this.y * T + T, duration: ms,
    });
    this.place();
    this.moving = false;
  }
}

export class WorldScene extends Phaser.Scene {
  private player!: Walker;
  private npcs = new Map<NpcId, Walker>();
  private grassOverlay!: Phaser.GameObjects.Image;
  private animated: { img: Phaser.GameObjects.Image; base: string }[] = [];
  private busy = false;
  private turnUntil = 0;
  private ui!: UIScene;

  constructor() {
    super('world');
  }

  create() {
    this.npcs.clear();
    this.animated = [];
    this.busy = false;
    this.drawMap();

    for (const n of NPCS) this.npcs.set(n.id, new Walker(this, n.look, n.x, n.y, n.facing));
    const p = game.state.player;
    this.player = new Walker(this, 'beryl', p.x, p.y, p.facing);
    this.grassOverlay = this.add.image(0, 0, 't-tall-top').setOrigin(0).setVisible(false);
    this.updateGrassOverlay();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * T, MAP_H * T).setZoom(3).setRoundPixels(true);
    cam.startFollow(this.player.sprite, true);
    cam.setFollowOffset(0, 8);

    let frame = 0;
    this.time.addEvent({
      delay: 450, loop: true, callback: () => {
        frame ^= 1;
        for (const a of this.animated) a.img.setTexture(`${a.base}${frame}`);
      },
    });

    this.scene.launch('ui');
    this.ui = this.scene.get('ui') as UIScene;
    this.cameras.main.fadeIn(300);

    if (!game.state.flags.intro) {
      game.state.flags.intro = true;
      void this.script(async () => {
        await delay(this, 400);
        await this.ui.say(
          "GRANDMA: BERYL, dear! My old friend PROF. SPRUCE is visiting today.",
          "He's waiting just outside the house. Go and say hello!",
        );
      });
    }
  }

  private drawMap() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const c = tileAt(x, y);
        let key = TILE_TEXTURES[c] ?? 't-grass';
        if (c === 'W' && tileAt(x, y - 1) !== 'W') key = 't-damtop';
        const img = this.add.image(x * T, y * T, key).setOrigin(0);
        if (c === '~') this.animated.push({ img, base: 't-water' });
        if (c === 'V') this.animated.push({ img, base: 't-spill' });
      }
    }
    for (const b of BUILDINGS) {
      this.add.image(b.x * T, b.y * T, `b-${b.id}`).setOrigin(0).setDepth((b.y + b.h - 1) * 10 + 1);
    }
  }

  private npcAt(x: number, y: number): NpcId | undefined {
    for (const [id, w] of this.npcs) if (w.x === x && w.y === y) return id;
    return undefined;
  }

  private blocked(x: number, y: number) {
    return isSolidTile(tileAt(x, y)) || this.npcAt(x, y) !== undefined;
  }

  private updateGrassOverlay() {
    const onGrass = tileAt(this.player.x, this.player.y) === ',';
    this.grassOverlay.setVisible(onGrass);
    if (onGrass) {
      this.grassOverlay.setPosition(this.player.x * T, this.player.y * T).setDepth(this.player.y * 10 + 6);
    }
  }

  /** Runs a scripted sequence with player control locked. */
  private async script(fn: () => Promise<void>) {
    this.busy = true;
    try {
      await fn();
    } finally {
      this.busy = false;
    }
  }

  update(time: number) {
    if (this.busy || this.player.moving) return;

    if (justPressed('a')) {
      const [dx, dy] = DELTA[this.player.facing];
      void this.script(() => this.interact(this.player.x + dx, this.player.y + dy));
      return;
    }
    if (justPressed('start')) {
      void this.script(() => this.startMenu());
      return;
    }

    const dir = heldDirection();
    if (!dir) return;
    if (dir !== this.player.facing) {
      this.player.face(dir);
      this.turnUntil = time + 90;
      return;
    }
    if (time < this.turnUntil) return;
    void this.tryStep(dir);
  }

  private async tryStep(dir: Facing) {
    const [dx, dy] = DELTA[dir];
    const nx = this.player.x + dx, ny = this.player.y + dy;
    if (this.blocked(nx, ny)) return;
    if (tileAt(nx, ny) === ',' && game.state.party.length === 0) {
      await this.script(() => this.ui.say("JASPER: Hey, BERYL! Don't go into the tall grass without a POKéMON!"));
      return;
    }
    // Holding B (X key) runs, from the very start of the game.
    await this.player.step(this, dir, isHeld('b'));
    game.state.player = { x: this.player.x, y: this.player.y, facing: this.player.facing };
    this.updateGrassOverlay();
    if (tileAt(this.player.x, this.player.y) === ',' && Math.random() < ENCOUNTER_RATE) {
      await this.script(() => this.wildEncounter());
    }
  }

  // --- battles -------------------------------------------------------------------

  private startBattle(cfg: Omit<BattleConfig, 'onEnd'>): Promise<BattleResult> {
    return new Promise((resolve) => {
      const cam = this.cameras.main;
      cam.flash(250, 255, 255, 255);
      this.time.delayedCall(280, () => {
        cam.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(260, () => {
          this.scene.sleep('ui');
          this.scene.sleep();
          this.scene.launch('battle', {
            ...cfg,
            onEnd: (result: BattleResult) => {
              this.scene.wake();
              this.scene.wake('ui');
              cam.fadeIn(300);
              resolve(result);
            },
          } satisfies BattleConfig);
        });
      });
    });
  }

  private async wildEncounter() {
    const total = ENCOUNTERS.reduce((a, [, w]) => a + w, 0);
    let roll = Math.random() * total;
    const species = ENCOUNTERS.find(([, w]) => (roll -= w) < 0)?.[0] ?? ENCOUNTERS[0][0];
    const enemy = createPokemon(species, wildLevel(game.state.badges, Math.random));
    const result = await this.startBattle({ kind: 'wild', enemy });
    if (result === 'lose') await this.whiteOut();
    save();
  }

  private async whiteOut() {
    for (const p of game.state.party) heal(p);
    game.state.player = { ...START_POSITION };
    this.player.x = START_POSITION.x;
    this.player.y = START_POSITION.y;
    this.player.place();
    this.player.face('down');
    this.updateGrassOverlay();
    await this.ui.say('GRANDMA: Oh my, BERYL! You look exhausted.', 'Your POKéMON have had a good rest now. Be careful out there!');
  }

  // --- interaction -----------------------------------------------------------------

  private async interact(x: number, y: number) {
    const npc = this.npcAt(x, y);
    if (npc) {
      this.npcs.get(npc)!.face(OPPOSITE[this.player.facing]);
      return this.talk(npc);
    }
    const sign = SIGNS[`${x},${y}`];
    if (sign) return this.ui.say(sign.join('\n'));
    const door = BUILDINGS.find((b) => b.door.x === x && b.door.y === y);
    if (door) return this.door(door.id);
    const c = tileAt(x, y);
    if (c === 'E') return this.ui.say("It's locked. A plate reads: MIRRORMERE DAM - STAFF ONLY.");
    if (c === '~') return this.ui.say('The LETHYS flows past, cold and clear.');
  }

  private async door(id: 'home' | 'jasper' | 'gym') {
    const s = game.state;
    if (id === 'home') {
      if (s.party.length === 0) {
        return this.ui.say("GRANDMA: PROF. SPRUCE is waiting outside, dear. Don't keep him waiting!");
      }
      for (const p of s.party) heal(p);
      save();
      return this.ui.say(
        'GRANDMA: Welcome home, dear. Let your POKéMON rest a little.',
        'Your POKéMON are fully healed! (Game saved.)',
      );
    }
    if (id === 'jasper') return this.ui.say("It's JASPER's house. His mum is at work at the POKéMON PENSION.");
    return this.ui.say("The GYM is locked. A note says: 'Closed today. Come back with a stronger team!'");
  }

  private async talk(id: NpcId) {
    const s = game.state;
    switch (id) {
      case 'spruce':
        if (s.party.length === 0) return this.starterEvent();
        return this.ui.say(
          'PROF. SPRUCE: The LETHYS carries more than water, you know. Old stories, too...',
          'Ask your grandma about it sometime.',
        );
      case 'jasper':
        if (s.party.length === 0) return this.ui.say('JASPER: BERYL! The professor is here! Go talk to him, quick!');
        return this.ui.say(
          s.flags.rivalWon
            ? "JASPER: Told you I'd win! But don't worry, you'll get me next time... maybe."
            : 'JASPER: Next time I win, for sure! I\'ll train way harder than you.',
          'JASPER: My dad says a real trainer needs all eight badges. I\'m getting them first!',
        );
      case 'guard':
        return this.ui.say(
          "DAM GUARD: Sorry, kid. Staff only beyond this door.",
          'Your mum and dad are hard at work in there today.',
        );
      case 'fisher':
        return this.fisherman();
      case 'neighbor':
        return this.ui.say(
          'NEIGHBOR: Have you heard? People keep seeing ghost POKéMON by the river at night.',
          "My grandmother said the river wasn't always this quiet...",
        );
    }
  }

  private async starterEvent() {
    const ui = this.ui;
    await ui.say(
      'PROF. SPRUCE: Ah, you must be BERYL! Your grandma and I have been friends since we were your age.',
      'She tells me you already know a thing or two about POKéMON.',
      'I study how POKéMON live along the LETHYS. And I brought three young ones who need a good home.',
    );
    await this.npcs.get('jasper')!.face('right');
    await ui.say(
      'JASPER: Whoa, for real? Professor, can I have one too?!',
      'PROF. SPRUCE: Ha ha! Of course. But BERYL chooses first.',
    );

    const starter = await ui.pickStarter();
    const mon = createPokemon(starter, 5);
    game.state.party.push(mon);
    await ui.say(`BERYL received ${nameOf(mon)}!`);

    // Like a Gen III rival, Jasper's starter hasn't learned its type move yet.
    const rival = createPokemon(rivalStarterFor(starter), 5);
    rival.moves = movesKnownAt(rival.species, 4).map((id) => ({ id, pp: MOVES[id].pp }));
    this.npcs.get('jasper')!.face('right');
    await ui.say(
      `JASPER: Then I'll take this one! ${nameOf(rival)}, you're with me!`,
      "JASPER: Hey, BERYL! Let's see whose POKéMON is stronger!",
    );

    const result = await this.startBattle({ kind: 'trainer', trainerName: 'JASPER', enemy: rival, canLose: true });
    game.state.flags.rivalBattle = true;
    game.state.flags.rivalWon = result !== 'win';
    await ui.say(
      result === 'win'
        ? "JASPER: Aw, no way! Okay, okay... I'll train harder and beat you next time!"
        : 'JASPER: Yes! I won! Don\'t feel bad, BERYL. You\'ll get me next time.',
      'PROF. SPRUCE: What a splendid first battle, both of you! Let me patch your POKéMON up.',
    );
    heal(mon);
    await ui.say(
      'Your POKéMON were fully healed!',
      'PROF. SPRUCE: If your POKéMON get tired, rest at home. Your grandma will look after you.',
      'The tall grass east of the bridge is full of wild POKéMON. Go and explore!',
    );
    save();
  }

  private async fisherman() {
    const s = game.state;
    if (s.party.length === 0) {
      return this.ui.say("FISHERMAN: The fish are biting today! Come back with a POKéMON and I'll show you my catch.");
    }
    if (s.flags.fisherBattle) {
      return this.ui.say(
        "FISHERMAN: MURKFIN don't look like much. But my grandpa swore...",
        'the ones that grow up in the strong current below the dam turn into something else entirely!',
      );
    }
    await this.ui.say('FISHERMAN: The LETHYS ran wild before the dam, my grandpa said. Look what I just fished up!');
    if (!(await this.ui.yesNo('FISHERMAN: Want to battle my MURKFIN?'))) {
      return this.ui.say('FISHERMAN: Suit yourself!');
    }
    const result = await this.startBattle({ kind: 'trainer', trainerName: 'FISHERMAN', enemy: createPokemon('murkfin', 5) });
    if (result === 'lose') return this.whiteOut();
    s.flags.fisherBattle = true;
    await this.ui.say('FISHERMAN: Ha! Fair and square. MURKFIN is better at splashing than battling.');
    save();
  }

  private async startMenu() {
    const choice = await this.ui.menu(['POKéMON', 'SAVE', 'EXIT']);
    if (choice === 0) {
      if (game.state.party.length === 0) return this.ui.say("You don't have any POKéMON yet.");
      for (const p of game.state.party) {
        const st = calcStats(p);
        const sp = SPECIES[p.species];
        await this.ui.say(
          `${nameOf(p)}  Lv${p.level}  ${sp.types.join('/').toUpperCase()}\nHP ${p.hp}/${st.hp}`,
          `Moves: ${p.moves.map((m) => MOVES[m.id].name.toUpperCase()).join(', ')}`,
        );
      }
    } else if (choice === 1) {
      save();
      await this.ui.say('BERYL saved the game.');
    }
  }
}

# Pokémon Beryl

A free, non-commercial, Gen-3-style Pokémon fan game set in the region of **Kaldria**, along the river **Lethys**.

This is **v0.2: the prologue**, playable from start to finish in Beryl's home town, Stillbrook.

- Wake up at home; Mum and Dad leave for their shift at the Mirrormere Dam
- Visit Jasper and his parents next door, with the family Pokémon tagging along
- Prof. Spruce is having tea with Grandma: pick Mossfawn, Newtide or Cindaroo
- First battle against Jasper, then Spruce's task: fill the Pokédex and follow the Lethys from source to sea
- That evening, Lethys rises from the river by the ferry dock
- Afterwards: wild Pipwing in the tall grass, the fisherman's Murkfin, healing with Grandma, saving

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys / WASD | D-pad |
| A (talk, agree) | Y / Enter / Space | A |
| B (back, cancel) | X / Esc / Backspace | B |
| Run | Hold X while moving | Hold B while moving |
| Menu | Shift | MENU |

## Run it locally

```bash
npm install
npm run dev      # open the printed localhost URL
npm test         # battle rules and map checks
npm run build    # production build into dist/
```

## Tech

- [Phaser 3](https://phaser.io/) + TypeScript, built with Vite. Runs in any browser, including phones and tablets.
- 720×480 canvas = the GBA's 240×160 at 3× scale. The overworld uses 16×16 tiles.
- Battle rules (`src/battle/engine.ts`) are plain TypeScript with no Phaser code, so they are unit-tested.
- Gen III damage formula, STAB, critical hits, 18-type chart with Fairy, physical/special split per move, stat stages, medium-fast EXP curve.
- Wild Pokémon level: 6–8 levels below the next gym (`gymLevel` / `wildLevel`).

## Project layout

```
src/
  art/procedural.ts     placeholder tiles, buildings and characters drawn in code
  battle/engine.ts      battle math (pure, tested)
  data/                 species, moves, type chart, maps (town and interiors)
  story/                story scripts (prologue), driven by flags in the save
  scenes/               Boot, Title, World, UI (dialogs), Battle
  ui/widgets.ts         dialog box, menus, async helpers
public/sprites/         Pokémon sprites (by Manuel)
public/battle/          battle backgrounds (by Leob0505, see CREDITS.md)
tests/                  vitest tests
```

### Editing the map

`src/data/maps.ts` holds every map as ASCII rows (`T` tree, `,` tall grass, `~` river, `:` path, …), plus its doors (warps), NPCs and sign texts. NPCs can be tied to story flags with `when`. Change a character and reload; `npm test` checks that doors and NPCs stay reachable.

### Story

`src/story/story.ts` holds the events. Each scene runs when you enter a map or talk to someone, and sets a flag when it is done (`woke`, `parentsLeft`, `metJasper`, `gotStarter`, `taskGiven`, `prologueDone`).

### Adding a Pokémon

1. Put a 64×64 PNG front sprite in `public/sprites/`.
2. Add an entry in `src/data/species.ts` (types, base stats, learnset, sprite file name).

## Placeholders and known limits

- Overworld tiles and characters are simple placeholder pixel art drawn in code, to be replaced by real tilesets (see `CREDITS.md`).
- Your own Pokémon are shown flipped on the player side, since there are no back sprites yet.
- The family Pokémon is an original placeholder until its design is ready.
- No catching, bag, party switching, abilities, status conditions or music yet.

## Deployment

Every push builds and deploys the game to GitHub Pages via `.github/workflows/pages.yml`.
One-time setup: in the repository **Settings → Pages**, set **Source** to **GitHub Actions**.

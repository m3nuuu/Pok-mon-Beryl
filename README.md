# Pokémon Beryl

A free, non-commercial, Gen-3-style Pokémon fan game set in the region of **Kaldria**, along the river **Lethys**.

This is **v1.0: the full game**, from waking up in Stillbrook to the Hall of Fame.

- The prologue in Stillbrook: Jasper, Prof. Spruce, your first partner and Lethys at the river
- 8 gyms in any order (except Torvald's in Stillbrook), with leaders that scale to your badge count
- The main story: the Stillbrook blackout and the power plant, the Flowkeeper protest at Weirhaven,
  an egg from the family Pokémon, the rising reservoir and Vesper's bomb, and the truth on the dam crest
- Three endings: break the dam, keep it sealed, or (with 3 of 4 clues) open the old soul gate
- Victory Road, the Elite Four, Champion Solenne, the Hall of Fame and credits; Lethys afterwards
- Side quests: the Pension runaways (EXP Share), Ingrid's pump station, Grandma's letters, the shrine mural,
  the hidden tunnel, the Emberdeep fossils, fishing rods, and Greta's ferry between river towns
- Bag, party, summary, Pokédex, trainer card, Marts, PC boxes, FLY, status conditions, evolution and move learning

The canon (map, levels, events, endings) is in `docs/GAME_PLAN.md`.

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
  battle/engine.ts      battle math (pure, tested); battle/teams.ts builds trainer teams
  data/                 species, moves, items, type chart; data/world/ holds every map, gym and the League
  story/                story scripts, driven by flags in the save (story.ts hooks, acts.ts, side.ts)
  scenes/               Boot, Title, World, UI (dialogs), Battle
  ui/                   dialog box and menus (widgets.ts), full-screen menus (screens.ts)
public/sprites/         Pokémon sprites (by Manuel)
public/battle/          battle backgrounds (by Leob0505, see CREDITS.md)
tests/                  vitest tests
```

### Editing the map

`src/data/world/*.ts` holds every map as ASCII rows (helpers in `src/data/mapkit.ts`) (`T` tree, `,` tall grass, `~` river, `:` path, …), plus its doors (warps), NPCs and sign texts. NPCs can be tied to story flags with `when`. Change a character and reload; `npm test` checks that doors and NPCs stay reachable.

### Story

`src/story/story.ts` holds the hooks (entering a map, talking, inspecting, after a trainer) and the prologue; `acts.ts` has the main events and endings, `side.ts` the side quests. Each scene sets a flag when it is done, so a save picks up at the right point. `tests/story.test.ts` plays the whole plot through a mock and checks every flag.

### Custom graphics

Pick **GRAPHICS** on the title screen (or open the game with `#graphics` at the end of the address). Add your own sprite sheets, choose a tile, building, battle background or character on the left, and click the matching part of the sheet. Everything is stored in that browser only (IndexedDB) and replaces the built-in art the next time the game starts. **Export** and **Import** move a setup to another device. The code is in `src/custom/`.

### Adding a Pokémon

1. Put a 64×64 PNG front sprite in `public/sprites/`.
2. Add an entry in `src/data/species.ts` (types, base stats, learnset, sprite file name) and a Pokédex text in `DEX_ENTRIES`.
3. Put it in wild encounter tables (`encounters` on a map) or trainer teams. Species without a sprite get a placeholder.

## Placeholders and known limits

- Overworld tiles and characters are simple placeholder pixel art drawn in code, to be replaced by real tilesets (see `CREDITS.md`).
- Your own Pokémon are shown flipped on the player side, since there are no back sprites yet.
- The family Pokémon and the egg species (Shellet) are placeholders until their designs are ready.
- The species list is a placeholder too: gyms use type-fitting moves on the existing species until the full fakemon list arrives.
- No abilities, held-item battle effects (other than EXP Share), double battles or music yet.

## Deployment

Every push builds and deploys the game to GitHub Pages via `.github/workflows/pages.yml`.
One-time setup: in the repository **Settings → Pages**, set **Source** to **GitHub Actions**.

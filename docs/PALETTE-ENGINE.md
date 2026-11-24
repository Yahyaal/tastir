# The palette engine (23 November 2026)

## In short

When you choose a palette, the engine decides which colour each part of the wall takes. A part is one shape, one ring of a rosette, or one group of matching pieces. The tutorial's colours are the starting point, and the engine changes them only where they break a rule. It then picks the change that looks best by modern colour practice. It now works for all three ways of colouring: By shape, Ring by ring and By place. Last night's version covered By shape only.

Four reviewer agents judged its picks on 24 walls under six palettes, over four rounds. They saw the old rule (A) beside the engine (B) and scored both from 1 to 5. Each round was tuned from what they found.

Look at it on [#/review/palette-engine](http://localhost:4200/#/review/palette-engine). Start with the Marrakesh throne-room rosette and the Arrayanes porch ceiling.

## What it fixes

The audit measured all 233 walls under each of the twelve tile palettes, piece by piece, in each wall's own way of colouring. It measured them as tiles and under white bands: 2,796 walls each way.

| Broken rule | Tiles, old rule | Tiles, engine | Under bands, old rule | Under bands, engine |
| --- | --- | --- | --- | --- |
| Different shapes touching in one colour | 330 walls | 133 | 330 | 37 |
| Different shapes touching in colours that read as one | 372 | 72 | 372 | 91 |
| A piece in the bands' colour, or turned grey under them | – | – | 2,459 | 130 |
| One colour over 60% of the wall | 237 | 204 | 237 | 165 |

The pieces of one ring touch each other in one colour by design, so the audit counts only different shapes touching.

The walls that still break a rule mostly have a reason:
- A few palettes don't have enough colours. Almohad is green and white only, and Chefchaouen is light blues, so neither has a colour left under white bands.
- Most of the plain-tile walls left are coloured by place. There the tutorial's own colours join neighbouring shapes into one field on purpose, and the engine keeps them (rule 7). Before rule 7 the engine left 31 such walls, but it repainted the rules into confetti to do it.

## The rules, and where they come from

Colours are measured in OKLab (Ottosson, 2020), a modern colour space where equal distances look equally different.

1. **Shapes that touch never share a colour, or two that read as one.** "Read as one" means either of:
   - colours very close in OKLab;
   - two darks, such as black beside navy or dark teal beside teal.
2. **Under white bands, no piece in the band's colour, a pale colour or a grey.** Those hide the bands (task STYLE.4). Black is allowed: under the bands it reads as the rosettes' dark anchor.
3. **A moved part keeps its role.**
   - It keeps its lightness: a light ground stays light, and the ground never turns to the loudest colour (the 60–30–10 proportion).
   - Black never goes onto a large shape that wasn't dark.
4. **Symmetry is kept.** A part is every piece of one shape that the tutorial's rules colour alike, so a ring, or an orbit of a placement, changes as one piece. The rules' colouring stays symmetric. Grünbaum and Shephard showed that colour is part of a pattern's symmetry.
5. **Taste chooses among the colours that fix a broken rule.** It never repaints a wall that breaks no rule. Taste here means:
   - neighbours differ in lightness (Itten's light–dark contrast);
   - two strong complements of one lightness don't sit side by side, because they vibrate;
   - the strongest colour is a small accent;
   - the hues fall within one of Matsuda's harmonic templates, as used for colour harmonisation by Cohen-Or et al. (2006).
6. **Only real colours.** The engine uses the palette's colours first, then its glaze's other colours. Under white bands it may also use one pale glaze of the palette's cool colour (a celadon or pale blue-grey) for the ground. It never generates tints: the reviewers found every generated tint off-tradition (pink from red, periwinkle from blue).
7. **A wall coloured by place keeps the rules' colours as plain tiles.** The reviewers judged the rules' placements better there. The engine moves a part only where two different shapes touch in one colour by accident of the palette, meaning the tutorial's own colours tell them apart. Shapes the tutorial's own colours join into one field stay joined. Under white bands the engine works as everywhere else, because there it scored better.
8. **The author's colours are kept** wherever someone set them on purpose:
   - a photo's original colours;
   - a palette made for one design;
   - a tutorial's ring corrections;
   - colours the learner painted.

## What the reviewers said

Each reviewer scored the same walls, 1 to 5, round after round:

- **Round 1:** B made blots of black, invented tints, and broke symmetry by moving single pieces.
- **Round 2:** symmetry was fixed. Grounds that had to change took the loudest colour.
- **Round 3:** black returned as an anchor. A wide "reads as one" test moved pieces of walls they liked.
- **Round 4:** averages A 3.30, B 3.38.
  - B is clearly better under white bands: Arrayanes, Bou Inania, Mexuar, Barca and Samarkand score 3–4 against A's 2.
  - B is the same on most plain-tile walls.
  - B is worse on a few walls coloured by place: Comares west dado, Nasrid casket and Samarkand as tiles, scoring 2–3 against A's 4.

## Still wrong

Most important first:

1. **Fixed on 23 November:** the Comares west dado and Nasrid casket as tiles read as confetti. Walls coloured by place now keep the rules' colours (rule 7).
2. **Some palettes' own colours sit close together.**
   - Mamluk wood's two mid browns are close in value.
   - Fès tile's green and blue are close in value.
   - Alhambra's orange and ochre are close in hue.

   The palettes themselves would need a wider spread.
3. **Modern Moroccan and Fès tile are loud everywhere.** Their yellow, mustard or crimson often covers most of the wall. That comes from the palettes more than the walls.
4. **Grey second shades.** Copies that take turns (Khojent) use a second shade, and with a black or white colour that shade is a grey.

## Decisions (the owner, 23 November, on my recommendation)

1. **Under white bands the wall is coloured all over.** The ground takes a pale glaze of the palette's cool colour rather than staying white, because white pieces wash the bands out, and the reviewers scored these walls better than the old rule's.
2. **By shape stays offered on every wall, even where one colour floods it.** A flood comes from a palette or a pattern with one large shape, not from the way of colouring, and the engine already holds a flood back where a rule breaks. Hiding the choice on some walls would make the panel differ from pattern to pattern for little gain.

## Code and checks

- **Code:**
  - `packages/project-core/src/harmony.ts` measures colour and runs the search;
  - `packages/project-core/src/coloring.ts` holds the palette's colours and By shape;
  - `packages/project-core/src/placement.ts` holds Ring by ring and By place.
- **Tests:** `apps/player/src/app/paletteEngine.spec.ts`.
- **The audit:** `apps/player/src/review/palette.audit.spec.ts` (`PALETTE_OUT=out.json`).
- **The reviewers' contact sheets:** `apps/player/src/build/paletteSheets.tsx`.

## Sources

- Björn Ottosson, "A perceptual color space for image processing" (OKLab, 2020).
- Daniel Cohen-Or, Olga Sorkine, Ran Gal, Tommer Leyvand and Ying-Qing Xu, "Color Harmonization" (SIGGRAPH 2006), after Matsuda's harmonic templates.
- Johannes Itten, *The Art of Color* (1961): the contrasts of light and dark, and of proportion.
- Branko Grünbaum, Zdenka Grünbaum and G. C. Shephard, "Symmetry in Moorish and other ornaments" (1986).
- The glaze notes in `coloring.ts` (Marçais; Cambazard-Amahan).

# The palette engine (23 November 2026)

## Overnight, in short

Three things were done overnight, each on the branch `claude/jovial-mestorf-ae177f`; nothing is pushed.

1. **The palette engine.** A palette now colours a pattern by rules, not by slot alone. The grey twelve-sided pieces you saw on the Arrayanes porch ceiling are gone, and so are touching shapes in one colour. See the pictures at [#/review/palette-engine](http://localhost:4300/#/review/palette-engine).
2. **The real wall badge** on the wall now does what Show the original does: the photo opens beside the wall. Both read "Hide" when it is open, and either closes it. The golden wipe is kept as a button among the photo's own tools (the two arrows), so it is one click from the photo.
3. **Print is one click.** The paper is your country's (Letter in the United States, Canada, Mexico and most of Central and South America and the Philippines; A4 elsewhere), and the browser's print dialog can still change it. The arrow and the menu are gone.

## What was wrong

A tutorial names a palette slot for each shape: the Arrayanes ceiling gives `ground` (the white) to four shapes, the twelve-sided pieces, octagons, triangles and kites. With its own Mamluk wood that is a mid wood, and fine. With any other palette it is white, and under the white interlace a white piece hides the bands, so the wall re-tinted it towards the palette's colour farthest from the band. That is nearly always its black, which made the grey. No palette has that grey.

The audit below ran every one of the 233 walls under each of the twelve tile palettes, as tiles and under bands (2,796 walls each way), with the old rule and with the engine.

| Broken rule | Tiles, before | Tiles, engine | Under bands, before | Under bands, engine |
| --- | --- | --- | --- | --- |
| Two touching shapes in one colour | 56 | 0 | 56 | 0 |
| Two touching shapes in colours that read as one | 116 | 0 | 120 | 6 |
| A piece in the bands' own colour | – | – | 2,344 | 0 |
| A piece re-tinted under the bands (the grey) | – | – | 2,463 | 0 |
| One colour over half the wall | 707 | 588 | 707 | 848 |

Where a tutorial's colours already broke no rule (1,003 walls as tiles), the engine kept every one of them exactly. It changes colours only to mend a broken rule.

The last row is the one rule the engine cannot always keep: on walls where one shape alone is more than half of the wall (the Comares bones, the Infantas crosses), a colour per shape has to flood. Ring by ring and colouring by placement are the way out there, and the tutorials that need it already have them. Under bands it rose because the white is no longer allowed: the colours that remain cover the wall between them.

## The rules

These come from how the tradition colours its tile, and from the problems seen in the app (STYLE.2 and STYLE.4 in the task list):

1. **Shapes that touch never share a colour,** nor two colours that read as one. Where they meet they merge into one blot.
2. **Under bands, no piece takes the bands' colour,** or a shade of their dark edge. A white piece under white interlace loses the bands.
3. **Every copy of a shape keeps one colour,** so the colouring keeps the pattern's symmetry. Grünbaum and Shephard showed that colour is part of these patterns' symmetry, and that a colouring which breaks it changes the pattern's group. Alhambra colourings are regular enough that the colours can be read back from the carving.
4. **No colour floods the wall** while the palette has colours to spare.
5. **Neighbours differ in lightness as well as hue,** so the shapes read in grey and for colour-blind eyes. This only settles ties.

## How it works

The tutorial's slots are the wish. The engine starts from them and keeps them unless a rule breaks. Then it looks for the colouring that breaks the fewest rules and moves the fewest shapes. A broken rule costs far more than a moved shape, and a large shape costs more to move than a small one.

The smallest shapes give way first, because the large shapes set the wall's look. On the Abas and Salman bands the large bowties keep their white and the small kites move instead.

Colours come from the palette's five slots first. When those run out, they come from the palette's glaze: the tradition's other glazes, such as the turquoise of Marinid zellige. Last of all, a lighter or darker shade of a slot's colour may be used. It never mixes two colours, since a mix would make a colour no palette has.

The search is deterministic, so a wall is always coloured the same way. Colours the learner chose, a design palette's own, and a photo's original are never changed.

The code is `pieceColors` and `assignColours` in `packages/project-core/src/coloring.ts`, and the tests are in `apps/player/src/app/paletteEngine.spec.ts`. The audit (`apps/player/src/review/palette.audit.spec.ts`) runs again with `PALETTE_OUT=out.json`.

## What to look at

- [#/review/palette-engine](http://localhost:4300/#/review/palette-engine): four walls under six palettes, A the old rule and B the engine. Start with the Arrayanes porch ceiling.
- [The Arrayanes porch ceiling](http://localhost:4300/#/alhambra-arrayanes-porch-ceiling/result), in By shape: no grey pieces under any palette.
- [The Minbar doors](http://localhost:4300/#/minbar-doors-cairo/result): the Real wall badge and Show the original now do the same thing; Print in More is one click.

## Open questions for you

1. **Under white bands, the Arrayanes ceiling now has no white pieces at all.** It reads as a coloured wall with white bands, as the tradition does it, but it is darker than before. Is that the look you want, or should a light glaze (a pale honey, say) stand in for the white?
2. **Flooding walls** (one shape over half the wall) still flood when coloured by shape. Should By shape be hidden on those walls, so Ring by ring or By place is used instead?

## Sources

- Branko Grünbaum, Zdenka Grünbaum and G. C. Shephard, "Symmetry in Moorish and other ornaments" (1986), and Branko Grünbaum, "What symmetry groups are present in the Alhambra?" (2006): colour as part of a pattern's symmetry.
- Blanco and Harris, "Symmetry groups in the Alhambra" (2011): the Alhambra's groups with colour taken into account.
- The glaze notes already in `coloring.ts` (Marçais; Cambazard-Amahan) for which colours each tradition had.

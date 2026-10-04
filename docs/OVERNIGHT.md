# Overnight run, 3–4 October 2026

The job was to add as many correct pattern tutorials as possible. This log says, for each pattern, where the construction came from, what matched, and what was decided and why. The per-pattern logs in `docs/patterns/` have the step-by-step detail, and `docs/patterns/LESSONS.md` collects what to avoid next time.

## Tools

Three tools were built first. `pnpm review <id>` renders each step, the ink, one tile and the tiled wall to `docs/review/<id>/`, evaluating the tutorial one step at a time so a half-written tutorial still renders up to the step that fails. `pnpm compare` puts a source picture beside our render of the same step, which is how each step was checked. The golden test now also checks that every tutorial builds step by step and inks only along lines the construction drew.

Six- and twelve-fold patterns sit on a triangular lattice, which no rectangle centred on a rosette can tile on its own, so the cell may now be a parallelogram whose lattice also repeats as a rectangle (the 60° rhombus). The player fills its wall with that rectangle, so grout is never sheared. Repeats gained `rot3`, `rot5`, `rot6`, `rot10` and `rot12`.

Running agents in worktrees under `.claude/worktrees/` made Nx discover their copies of the packages, which broke the main test run; `.nxignore` now keeps them out.

## Six-fold snowflake (verified)

Mamoot's "Six-Fold Snowflake" was the only step-by-step source found for this exact sequence, with photos of the pattern at Ibn Tulun and the Eski Mosque on the same page; the ATM handout builds the same base for a sibling pattern. Every step matched the source drawings, the only correction being to draw the small star as six lines rather than two triangles, as the source does. The first tile was a rhombus from O to two neighbouring centres, which cut the right pieces but broke free inking, because the learner can only ink construction inside the cell. So the engine now accepts a hexagon as the cell, and the snowflake repeats its hexagon exactly as the source does. The wall matches both photos: small stars each ringed by six hexagons, with chevrons, rhombi and triangles between.

## Star and hexagons (verified)

The four agents started in parallel all stopped on a usage limit within minutes, before writing anything usable, so from here the patterns were done one at a time without agents. Their downloads in `docs/research/` were kept, and their worktrees are still in `.claude/worktrees/` because removing them was not permitted.

Charlotte Webb's ATM handout gives three step drawings and a photo, and Kaplan's dissertation names the pattern. The construction and ink matched the handout on the first try. The handout's tile, though, is the large hexagon, and repeating it gave three hexagons sharing edges at every corner, which the photo does not have. The repeat in the photo is the smaller hexagon through the centres of the corner hexagons, so the tutorial adds that as its tile, and the wall then matches the photo. Lesson: a source's suggested tile can be wrong even when its drawing is right, so always check the wall against a photo.

## Six-fold hammerheads (verified)

Mamoot's hammerhead tutorial was the one step-by-step source, with photos from Seville and Aleppo. Its note and its written step disagree on the size of the inner star, so the drawing was measured, and it follows the written step. The final trace was matched by sampling the source drawing along every construction segment and keeping the black ones, which gave a clean six-fold rule and an exact overlay. The motif tiles two ways; the Alcázar photo's lattice is turned 30° from the obvious one, so the tile is the hexagon lying on its side, and the wall then matches the source's own drawing of that tiling.

## Alhambra star and arrows (abandoned)

Mamoot's Alhambra rosette was rebuilt exactly, and our ink overlays the source's final drawing line for line. But the source shows it only as a single rosette, and the Alhambra photo sets it inside a larger band network that one photo is not enough to reconstruct. The only repeat available, rosettes touching tip to tip on a square grid, is our own invention and cannot be checked against a real wall, so the tutorial is abandoned. The finished file, which passes every check, is kept in `docs/patterns/abandoned/` for review rather than shipped.

## Ibn Tulun window (verified)

Mamoot's Ibn Tulun window is the most intricate pattern so far: a twelve-pointed star on a six-fold base, with six "fish" and two stars that bend on the diagonals. The text does not say which lines those are, so a crop of the fish was measured, which showed fins along the square sides and a crossed tail through a square-square crossing; the stars then follow as the twelve-pointed star's lines and lines parallel to them through the fin tips. That set explains every black segment of the final drawing, and our ink overlays it exactly. The tile is the hexagon through the noses, the source's "clover" tiling, whose lattice and openings match the photo of the grille.

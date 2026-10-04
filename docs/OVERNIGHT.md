# Overnight run, 3–4 October 2026

The job was to add as many correct pattern tutorials as possible. This log says, for each pattern, where the construction came from, what matched, and what was decided and why. The per-pattern logs in `docs/patterns/` have the step-by-step detail, and `docs/patterns/LESSONS.md` collects what to avoid next time.

## Tools

Three tools were built first. `pnpm review <id>` renders each step, the ink, one tile and the tiled wall to `docs/review/<id>/`, evaluating the tutorial one step at a time so a half-written tutorial still renders up to the step that fails. `pnpm compare` puts a source picture beside our render of the same step, which is how each step was checked. The golden test now also checks that every tutorial builds step by step and inks only along lines the construction drew.

Six- and twelve-fold patterns sit on a triangular lattice, which no rectangle centred on a rosette can tile on its own, so the cell may now be a parallelogram whose lattice also repeats as a rectangle (the 60° rhombus). The player fills its wall with that rectangle, so grout is never sheared. Repeats gained `rot3`, `rot5`, `rot6`, `rot10` and `rot12`.

Running agents in worktrees under `.claude/worktrees/` made Nx discover their copies of the packages, which broke the main test run; `.nxignore` now keeps them out.

## Six-fold snowflake (verified)

Mamoot's "Six-Fold Snowflake" was the only step-by-step source found for this exact sequence, with photos of the pattern at Ibn Tulun and the Eski Mosque on the same page; the ATM handout builds the same base for a sibling pattern. Every step matched the source drawings, the only correction being to draw the small star as six lines rather than two triangles, as the source does. The first tile was a rhombus from O to two neighbouring centres, which cut the right pieces but broke free inking, because the learner can only ink construction inside the cell. So the engine now accepts a hexagon as the cell, and the snowflake repeats its hexagon exactly as the source does. The wall matches both photos: small stars each ringed by six hexagons, with chevrons, rhombi and triangles between.

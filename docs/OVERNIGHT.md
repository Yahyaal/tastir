# Overnight run, 3–4 October 2026

The job was to add as many correct pattern tutorials as possible. This log says, for each pattern, where the construction came from, what matched, and what was decided and why. The per-pattern logs in `docs/patterns/` have the step-by-step detail, and `docs/patterns/LESSONS.md` collects what to avoid next time.

## Tools

Three tools were built first. `pnpm review <id>` renders each step, the ink, one tile and the tiled wall to `docs/review/<id>/`, evaluating the tutorial one step at a time so a half-written tutorial still renders up to the step that fails. `pnpm compare` puts a source picture beside our render of the same step, which is how each step was checked. The golden test now also checks that every tutorial builds step by step and inks only along lines the construction drew.

Six- and twelve-fold patterns sit on a triangular lattice, which no rectangle centred on a rosette can tile on its own, so the cell may now be a parallelogram whose lattice also repeats as a rectangle (the 60° rhombus). The player fills its wall with that rectangle, so grout is never sheared. Repeats gained `rot3`, `rot5`, `rot6`, `rot10` and `rot12`.

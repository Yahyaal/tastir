# Lessons from writing pattern tutorials

Each entry is a mistake that already cost time once, or a fact that saves time. Add to it whenever something surprises you.

## Research

- The Met Museum's educator PDF (`islamic_art_and_geometric_design.pdf`) answers scripts with an HTML page, not the PDF. Check every download with `file` before reading it.
- mamootdiy.com has numbered written steps with one picture per step for several patterns (six-fold model, four-fold model, five-fold model, six-fold hammerhead, Ibn Tulun window, six-fold snowflake, Alhambra rosette tile). Its pictures download with a plain `curl -A "Mozilla/5.0"`; drop the `?w=` suffix for full size.

## Format

- The cell may be a rectangle, a parallelogram whose lattice also repeats as a rectangle, or a centrally symmetric hexagon. Repeats exist for `rot3`, `rot4`, `rot5`, `rot6`, `rot8`, `rot10`, `rot12` and `rot16`.
- Use the hexagon around O as the cell for six- and twelve-fold patterns, not a rhombus. Free inking (and its test) only offers construction inside the cell, and a rhombus with a corner at O reaches into neighbouring hexagons where nothing was built.
- A step-by-step source often draws a star as lines, not as two triangles. Match the source's elements, not just its final shape, or the step comparison shows extra lines.
- Our renders are framed on the cell, so they can look smaller than the source. Crop the source to the same area before deciding a step does not match.
- Run `python3 tools/review/format_tutorial.py tutorials/<id>.json` after generating a tutorial with a script; `json.dump` with indent 2 spreads every element over a dozen lines.
- The golden test checks the tutorial's `fold` symmetry about O for pieces within distance 1 of O, so O must be a rosette centre and OA should be about the size of the rosette.

## Checking

- A source's suggested tile can be wrong even when its drawing is right. The ATM handout repeats the large hexagon of the star-and-hexagons pattern, which gives a different wall from the photo. Always compare the wall with a photo of the real pattern, not only with the source's drawing.
- Before building a tile, work out the expected piece areas by hand (star, hexagon, rhombus) and check that they add up to the cell area; when `pnpm review` prints the same numbers, the construction is right.

- When a source's final trace is intricate, sample its image along every construction segment between crossings and keep the ones drawn black (see the hammerhead log). Then overlay our ink on the source image to confirm; it is faster and surer than reading the drawing by eye.
- When a source's note and its written step disagree, measure the source drawing.
- One motif can tile several ways. Check which way the photo uses by the direction from one star to its neighbours, then pick the cell that gives that lattice.

- Before building, check that a source shows the pattern repeating, not just one motif. Standalone rosettes (like Mamoot's Alhambra rosette) cannot be verified as a wall.

## Tooling

- Agent worktrees live in `.claude/worktrees/` inside the repo. Without `.nxignore`, Nx picks them up as extra projects, the main test run fails with circular project references, and `pnpm typecheck` adds them to the root `tsconfig.json`. `.nxignore` now excludes `.claude/`.
- `perf.spec.ts` times a 3,000-segment arrangement against 300 ms. While several agents run tests at once it can take slightly longer; rerun it alone before treating it as a regression.

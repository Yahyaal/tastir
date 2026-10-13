# Brief for writing one pattern tutorial

This is the working method for adding a pattern tutorial to `tutorials/`. It was written for the overnight run, where several patterns were worked on in parallel, and it holds for any later pattern too.

## Read first

Read `CLAUDE.md`, `docs/tutorial-format.md`, `docs/geometry-notes.md`, `docs/patterns/LESSONS.md` and the worked example `tutorials/eight-fold-star-and-cross.json`. The lessons file lists mistakes that already cost time; do not repeat them.

## Tools

- `pnpm review <id>` evaluates `tutorials/<id>.json` one step at a time and writes `docs/review/<id>/step-NN.png` (earlier elements grey, this step red, new points labelled), and once the ink, cell and `expect` parse, `ink.png`, `tile.png` (pieces by type, with a legend of vertices, area and count) and `wall.png`. A failing step is drawn with the engine's error in red. It prints the piece types, which is where the `expect` values come from.
- `pnpm compare <id> <step|ink|tile|wall> <picture> [--crop x,y,w,h]` puts a source picture beside our render as `docs/review/<id>/compare-step-N.png` (or `compare-wall.png`). Open the result with the Read tool and look at it.
- `pnpm test` and `pnpm lint` must both exit 0 before a tutorial is committed. Every tutorial gets the golden checks in `packages/engine/src/golden.spec.ts` automatically: it builds step by step, ink lies on construction lines between crossings, the pieces have the tutorial's `fold` symmetry about O, there are no slivers, and the pieces match `expect`.

## Method

1. **Research.** Find at least two step-by-step constructions of the pattern with pictures or written steps (skip video-only sources). Save the pages and pictures in `docs/research/<id>/` with a `sources.md` listing every URL, and save one photo of the real pattern in a building or object. Check each download with `file`: some sites return an HTML block page with a `.pdf` or `.jpg` name. `docs/research/` is gitignored and never shipped.
2. **One step at a time.** Write one step, run `pnpm review <id>`, compare the step's render with the source picture, and only go on when it matches. If a step still does not match after 5 tries, stop and mark the tutorial abandoned with the reason.
3. **Ink and tile.** Ink the pattern, build the cell, and check `ink.png`, `tile.png` and `wall.png`. The cell is a rectangle, or for six- and twelve-fold patterns the 60° rhombus joining four neighbouring rosette centres. The ink must cover one whole cell's worth of pattern.
4. **Expect.** Copy the piece types `pnpm review` prints into `expect`, naming each piece, and give each a palette key in `pattern.colors` (`a`, `b`, `c`, `ground`, as the existing tutorials do).
5. **Verify.** Compare `wall.png` with the real photo. The status is **verified** only when the line structure matches the photo (same stars, same pieces, same way they meet); otherwise **needs review** with what differs, or **abandoned** with the reason.

## Check the player before shipping

For a new rosette or a change that adds construction lines, crossings, helpers or repeat copies, follow the [Ink performance checklist](../testing/ink-performance.md). Golden tests establish geometry correctness; they do not show that the browser paints promptly or that a learner can ink by hand. Exercise construction → Ink → Repeat, compare the complete tile and wall, and record browser timings for dense patterns alongside the geometry checks.

## Rules

- Step text is in our own words. Credit every source whose specific sequence you followed in the tutorial's `credits` (`source`, `creator`, `url`, `note`, `steps`).
- No coordinates, ever. Every point is a crossing or tangency of earlier elements, chosen with `pick` rules that cannot flip (prefer `angle` or `nearest`/`farthest` with a clear margin).
- When a pattern needs something the format lacks, say exactly what in the pattern log and the report, rather than changing the engine in a parallel branch.
- Keep the log of the pattern in `docs/patterns/<id>.md`: the sources, which steps matched on which try, what you decided and why, in short connected sentences, any learning worth keeping, and a last line `Status: verified | needs review: <what differs> | abandoned: <reason>`.

# Tasks

Work top to bottom, one task per session and one commit per task. A task is done only when its acceptance test passes and the full test and lint commands are green. Tick the box in the same commit.

## Phase 0: spike

The goal of phase 0 is one tutorial, the eight-fold star and cross, playing exactly from its JSON in a bare player, with a golden test guarding it.

- [x] **0.1 Set up the repo.** Initialise git and an Nx workspace with pnpm in this folder, keeping every existing file. Create `packages/engine` and `packages/schema` as TypeScript libraries with Vitest, and `apps/player` as a React + Vite app. Add ESLint, Prettier and strict TypeScript. Fill in the Commands section of `CLAUDE.md`.
  *Done when:* install, test, lint and typecheck all run clean from the root; the player dev server shows a placeholder page; the first commit exists. If the GitHub CLI is logged in, create a private GitHub repo named `tastir` and push; if not, stop and tell me.

- [x] **0.2 Engine primitives.** In `packages/engine`, add vectors, lines (point + direction), circles and segments, with the three intersections: line–line, line–circle, circle–circle. Use one shared tolerance, relative to the drawing size, and report a tangent contact as one point.
  *Done when:* unit tests cover crossing, parallel, tangent and disjoint cases for each intersection, and a test shows two points closer than the tolerance are treated as one.

- [x] **0.3 Constructions.** Add perpendicular and parallel through a point, the bisector of an angle given three points, a circle through a point, a circle with another circle's radius, and a circle at a centre tangent to lines or circles (an error when no single radius touches all of them).
  *Done when:* each construction has a test against a hand-computed value; the tangent circle is tested with the two cases from `docs/geometry-notes.md` (radii 0.29289 and 0.12132).

- [ ] **0.4 Schema.** In `packages/schema`, write the Zod schema for format v0 from `docs/tutorial-format.md` and export its TypeScript types.
  *Done when:* `tutorials/eight-fold-star-and-cross.json` parses; tests show a coordinate, a forward reference and an index-style pick are each rejected with a clear message.

- [ ] **0.5 Evaluator.** Turn a parsed tutorial into a scene: every element with its geometry, the step that made it and the elements it depends on. Implement the `pick` rules and the frame. Missing, ambiguous or impossible references throw an error naming the step and element.
  *Done when:* evaluating the example gives the eight crossings `k.1`–`k.8` at distance 0.76537 from `O`, in counter-clockwise order starting at 22.5°; tests cover an ambiguous pick and a missing reference.

- [ ] **0.6 Ink and pieces.** Check that each ink segment lies on an existing element. Port the planar arrangement from the prototype (split at crossings, drop dangling ends, walk faces), compute pieces over a 3×3 neighbourhood of the cell, and group them into types by congruence.
  *Done when:* the example yields exactly two piece types matching its `expect` block (star and cross, 16 vertices each, areas 2.34315 and 1.65685, one of each per cell).

- [ ] **0.7 Golden test harness.** A single test loads every file in `tutorials/`, evaluates it and compares the result with its `expect` block.
  *Done when:* the test passes for the example, and changing one number in `expect` makes it fail with a readable diff.

- [ ] **0.8 Bare player.** In `apps/player`, load the example and render it as SVG with Next and Back buttons and the step text. Elements from the current step are drawn in color and earlier ones in light grey. After the last step, show the inked pattern, then the two piece types filled and the cell tiled across the screen.
  *Done when:* I can click through all six steps, the ink and the tiled wall in the browser, and what I see matches the description in each step's text. No animation is needed yet.

**Phase 0 exit:** all boxes ticked, golden test green, and the star and cross plays end to end.

## Phase 1: player MVP

These are listed so the phase 0 design leaves room for them. Each one gets broken into tasks with acceptance tests when phase 0 is finished.

1. Step animation with the Web Animations API (compass sweep, ruler stroke, crossing dots), with speed control, Back reversing, and a reduced-motion setting.
2. Highlight-before-draw: the elements in `highlight` flash before the step animates.
3. Camera: pan, zoom and auto-frame to the current step.
4. Second tutorial, the classic eight-fold zellige, which needs tangent circles, `repeat` and parallels. See the research notes for what is known and unknown about it.
5. Free inking: the user picks their own segments between crossings, with one click back to the default.
6. Coloring: piece panel, palettes, hover to highlight every copy, tap to recolor a type, reset to default.
7. Wall: infinite tiling with drag and scroll, grout width, and the three styles (tiles, strapwork, lines).
8. Export: SVG, PNG and a printable line sheet.
9. Web Worker for evaluation and piece finding.
10. Third tutorial, a 16-fold rosette.

Later phases (AI pipeline, accounts and library, learning features, designers) are described in `docs/PRD.md`.

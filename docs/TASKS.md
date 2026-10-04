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

- [x] **0.4 Schema.** In `packages/schema`, write the Zod schema for format v0 from `docs/tutorial-format.md` and export its TypeScript types.
  *Done when:* `tutorials/eight-fold-star-and-cross.json` parses; tests show a coordinate, a forward reference and an index-style pick are each rejected with a clear message.

- [x] **0.5 Evaluator.** Turn a parsed tutorial into a scene: every element with its geometry, the step that made it and the elements it depends on. Implement the `pick` rules and the frame. Missing, ambiguous or impossible references throw an error naming the step and element.
  *Done when:* evaluating the example gives the eight crossings `k.1`–`k.8` at distance 0.76537 from `O`, in counter-clockwise order starting at 22.5°; tests cover an ambiguous pick and a missing reference.

- [x] **0.6 Ink and pieces.** Check that each ink segment lies on an existing element. Port the planar arrangement from the prototype (split at crossings, drop dangling ends, walk faces), compute pieces over a 3×3 neighbourhood of the cell, and group them into types by congruence.
  *Done when:* the example yields exactly two piece types matching its `expect` block (star and cross, 16 vertices each, areas 2.34315 and 1.65685, one of each per cell).

- [x] **0.7 Golden test harness.** A single test loads every file in `tutorials/`, evaluates it and compares the result with its `expect` block.
  *Done when:* the test passes for the example, and changing one number in `expect` makes it fail with a readable diff.

- [x] **0.8 Bare player.** In `apps/player`, load the example and render it as SVG with Next and Back buttons and the step text. Elements from the current step are drawn in color and earlier ones in light grey. After the last step, show the inked pattern, then the two piece types filled and the cell tiled across the screen.
  *Done when:* I can click through all six steps, the ink and the tiled wall in the browser, and what I see matches the description in each step's text. No animation is needed yet.

**Phase 0 exit:** all boxes ticked, golden test green, and the star and cross plays end to end.

## Phase 1: player MVP

The goal of phase 1 is a player a friend can use unaided: animated steps, a camera, three tutorials to choose from, free inking, coloring, an infinite wall and export, all on a desktop, with no accounts.

- [x] **1.1 Step animation.** In `apps/player`, animate each construction step with the Web Animations API: a circle sweeps round from the point the compass opens to, a line or polygon side draws from one end, and new points pop in after the lines that make them. A step takes 0.8 s at normal speed, with a speed control (½×, 1×, 2×). Back plays the current step backwards, then shows the previous one. A reduced-motion setting, on by default when the system asks for reduced motion, draws every step at once.
  *Done when:* tests with a stand-in for `element.animate` show that each kind of element gets its animation, that speed scales the timing, that Back reverses, and that reduced motion draws without animating; in the browser I see the compass swing and the ruler draw.

- [x] **1.2 Highlight before draw.** Before a step animates, the elements in its `highlight` list flash, so the learner can predict where the compass goes. With reduced motion they are outlined instead, without flashing.
  *Done when:* tests show the flash comes before the drawing and covers every highlighted element, and that reduced motion outlines them; in the browser, step 4 of the star and cross flashes E, N, W and S before the square draws.

- [x] **1.3 Camera.** Drag to pan, wheel or pinch to zoom about the pointer, and a Fit button. Each step frames itself: the view moves smoothly to fit the step's new elements and the elements they are built from. The arrow keys stay with Back and Next.
  *Done when:* unit tests show that zooming keeps the point under the pointer still, that fitting contains the given box with a margin, and that the frame for a step contains its elements; in the browser I can drag, zoom, fit, and watch the view follow the steps.

- [x] **1.4 Tutorial picker.** The player lists every tutorial in `tutorials/` with its title, fold, level, step count and a small picture of the finished pattern, and plays the one I choose. The address bar keeps the choice, so a reload returns to it.
  *Done when:* adding a tutorial file shows it in the list with no code change (a test covers this), and the star and cross plays from the list.

- [ ] **1.5 Eight-fold zellige tutorial.** Write `tutorials/eight-fold-zellige.json`, the classic eight-fold star with petals. Steps 1–10 and 17 of the geometry notes are known; work out the rest again from the geometry, not from the ambiguous PDF text. Every inked line must pass through at least two crossings of the construction, no piece may be a sliver, and the pattern must have eight-fold symmetry. Step text is our own; credit Sandy Kurt if the sequence follows her tutorial closely.
  *Done when:* the golden test passes for it, a test checks the two-crossings rule and the symmetry, and I confirm by eye in the player that it looks like the classic pattern.

- [x] **1.6 Free inking.** On the ink stage, a "Make your own" mode shows every straight piece of construction between two neighbouring crossings; clicking one inks or erases it, and "Back to the classic" restores the tutorial's inking. The repeat and color stages use whatever is inked. The engine gains the split into pieces between crossings and pieces from any chosen set of them.
  *Done when:* an engine test shows the tutorial's own inking, picked piece by piece, gives the same pieces as its ink paths; a player test toggles a piece and sees the pieces change, then restores the classic.

- [x] **1.7 Coloring.** The color stage gets a piece panel: each piece type with its shape, count per tile and color. Hovering a type, in the panel or on the wall, highlights every copy; clicking one opens a palette to recolor every piece of that type. Preset palettes (Fès, Marrakech, Chefchaouen, Tétouan, Isfahan, Kashan), undo and redo, and Reset to the tutorial's colors.
  *Done when:* player tests recolor a type, undo, redo and reset, and switch palettes; in the browser hovering a star highlights every star.

- [x] **1.8 Wall.** The wall becomes infinite: an SVG `<pattern>` fill, drag to pan and scroll to zoom. Controls for grout width and three styles: tiles (filled pieces with grout), strapwork (the ink drawn as bands) and lines (black lines on white, for coloring by hand).
  *Done when:* tests show the pattern tile holds every piece that reaches into the cell, and each style renders; in the browser I can pan the wall without reaching an edge.

- [ ] **1.9 Export.** Download the colored wall as SVG and PNG, and print a line sheet on A4 or Letter with the pattern in lines only and the tutorial's title and credits.
  *Done when:* a test checks the SVG is standalone and shows the same pieces as the screen; I can open the SVG and PNG and print the sheet from the browser.

- [ ] **1.10 Web Worker.** Evaluation and piece finding run in a Web Worker, so the page stays responsive; the player shows progress while it waits.
  *Done when:* the player loads every tutorial through the worker; an engine benchmark finds the pieces of about 3,000 segments in under 300 ms and evaluates a 40-step tutorial in under 50 ms.

- [ ] **1.11 Sixteen-fold rosette tutorial.** Write `tutorials/sixteen-fold-rosette.json`, a sixteen-fold rosette on a square repeat, under the same rules as 1.5. This proves the engine reaches patterns like the Fès panel.
  *Done when:* the golden test passes for it, the two-crossings and symmetry checks pass, and I confirm by eye that it looks right.

**Phase 1 exit:** all boxes ticked, every golden test green, and a friend finishes a tutorial unaided in under 10 minutes.

Later phases (AI pipeline, accounts and library, learning features, designers) are described in `docs/PRD.md`.

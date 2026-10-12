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

- [x] **1.9 Export.** Download the colored wall as SVG and PNG, and print a line sheet on A4 or Letter with the pattern in lines only and the tutorial's title and credits.
  *Done when:* a test checks the SVG is standalone and shows the same pieces as the screen; I can open the SVG and PNG and print the sheet from the browser.

- [x] **1.10 Web Worker.** Evaluation and piece finding run in a Web Worker, so the page stays responsive; the player shows progress while it waits.
  *Done when:* the player loads every tutorial through the worker; an engine benchmark finds the pieces of about 3,000 segments in under 300 ms and evaluates a 40-step tutorial in under 50 ms.

- [ ] **1.11 Sixteen-fold rosette tutorial.** Write `tutorials/sixteen-fold-rosette.json`, a sixteen-fold rosette on a square repeat, under the same rules as 1.5. This proves the engine reaches patterns like the Fès panel.
  *Done when:* the golden test passes for it, the two-crossings and symmetry checks pass, and I confirm by eye that it looks right.

### Clear steps (owner, 5 October 2026; review card “Making long tutorials easy to follow”)

Work on branch `review-screenshots` (worktree `../Tastir-review`), merged into main when done. Mockups: `docs/review/ux-steps/` (made by the scratch script described on the card).

- [x] **1.12 Hidden marking steps.** A step may say `"hidden": true`: the engine evaluates it, the player skips it as a stage and never draws its elements, and the step counter leaves it out. Mark the nine steps that only mark corners (Bou Inania rosette 13, Bou Inania wall 20, four-fold ring 13 and 14, Kurt wheel 19 and its shifted copy 19, stellated rosettes 12, Mian rosette 11 square and hex).
  *Done when:* schema and player tests cover hidden steps, golden tests are unchanged, and Bou Inania goes from step 12 to the tile with no red dots.

- [x] **1.13 Colours with one meaning, and no codes.** Earlier construction grey, this step's new elements orange, what the step uses (its `highlight`) blue with crossings ringed, construction that never carries ink thin and dashed. Point names are hidden unless “Show names” is on. Colours from the Okabe–Ito set; each role also differs by width or dash.
  *Done when:* player tests check each role's class and the names toggle; Bou Inania step 6 looks like picture C.

- [x] **1.14 Ink as you go, as a switch.** The engine gives each ink stroke the earliest step at which it can be drawn: its line and the lines it turns onto at both ends exist (strokes along one line between turns form one run). The player gets an “Ink as you go / Ink at the end” switch beside the speed control, remembered per browser. As you go, a step's new ink draws in green after its lines and is black from the next step; the ink stage then fades the construction.
  *Done when:* an engine test checks the steps for the star and cross and Bou Inania (6: star; 8: a third of the ink), player tests cover the switch; both modes play every tutorial.

- [x] **1.15 Parts of a step.** A step may have `parts`, each with its own `text`, `create`, `highlight` and `animate`; the player shows “Step 11 · 2 of 4” and Next/Back move by part. Split Bou Inania steps 8–12 into parts, one construction each.
  *Done when:* schema, engine and player tests cover parts; golden tests unchanged; step 11 plays like picture D.

- [x] **1.16 The next tile in blue.** On the step that creates the pattern cell, the neighbouring copies of the ink are drawn in blue around the tile, so the band at the edge explains itself; Bou Inania's tile step text says so.
  *Done when:* a player test finds the neighbour copies on that step; Bou Inania's last step looks like picture E.

- [x] **1.17 Zoom to the work.** *(Replaced on 6 October at the owner's request: the zooming was jittery. The view now shows everything drawn so far and only widens; see `growingFrame` in `apps/player/src/app/camera.ts`.)* Each step or part frames the elements it uses and makes, then the view widens to show their copies round the centre.
  *Done when:* camera tests show the frame of a part holds its crossing and new line; in the browser step 12 zooms to the corner star.

**Phase 1 exit:** all boxes ticked, every golden test green, and a friend finishes a tutorial unaided in under 10 minutes.

## Phase 2: Visual styles & draw-along polish

- [x] **2.0 Dotted in-progress polygon preview in Draw-Along & Editor.** When using the `polygon` or `tile` tool, render live dotted SVG lines connecting the corners clicked so far ($P_0 \to P_1 \to \dots \to P_{k-1}$), plus a rubber-band dotted line to the active pointer or hovered crossing.
  *Done when:* Clicking corners shows dotted connected edges and a responsive rubber-band to the cursor; tests verify SVG rendering and closing behavior.

**Review of the style tasks (Claude, 11 October 2026).** Gemini added 2.1 to 2.6 without the owner's OK. Here is a recommendation for other models to confirm or push back on; the owner decides. Keep two of them, because each shows something real. *Interlace* (2.3) is how strapwork actually looks at the Alhambra and in Córdoba lacería, and it teaches something: the bands can alternate over and under only because of the way the construction lines cross. It is geometry work rather than a skin, so the over-and-under is found in `packages/engine` from the ink, and the wall only draws it. *Jali* (2.1) is cheap and grounded: the strapwork look with the pieces left open, as in Mughal stone screens (Sikandra, Fatehpur Sikri). (Codex has since built it, and the owner chose material finishes for it: 2.1a to 2.1d.) Drop the other four for now. Illumination (2.2), relief (2.4), wood (2.5) and blueprint (2.6) are surface skins: each is a lot of work to look convincing rather than fake, and their SVG filters and gradients would slow the large walls, where painting is already the slowest part of Bou Inania. Two of them (2.2 and 2.6) also choose colours, and palettes stay as they are until the owner's separate conversation about colour (`docs/WORKING-WITH-OWNER.md`). Styles in general rank below the library itself: real designs, verified against real examples.

- [x] **2.1 Jali / Lattice (Pierced Screen) style.** Add `jali` to `WallStyle`. The strapwork forms a solid architectural screen (carved marble/sandstone/wood) while piece apertures are cut out (transparent or translucent) showing a soft ambient/backlit ground.
  *Done when:* Player wall dropdown includes `Jali`, rendering open voids with a structural framework; tests and preview snapshots pass.
  *Implemented 11 October:* Marble-colored stone bands with directional bevels, clear apertures and a continuous backlit ground. Shared appearance settings keep the live wall, saved previews and SVG/PNG consistent. Lattice controls width; colors are preserved when switching styles. Screenshots and owner feedback are at `#/review`; reproduction and checks are in [the Jali report](testing/jali-2026-10-11.md).

- [x] **2.1a Jali foreground and background colors (11 October).** Keep clear apertures; allow independent framework and background color choices. Derive the bevel/shadow from the framework color and preserve the choices in saved designs, share links, thumbnails and exports.
  *Done when:* The user can change either color independently, restore defaults and reopen/export the same appearance without losing tile colors.
  *Picker follow-up:* The browser-native popup could be cut off at the right edge. The owner asked for the same interaction as other styles. Jali now uses material buttons and directly visible finish swatches. Each finish applies with one click; Custom color opens the native picker directly with a centered anchor. The separate RGB/hex editor, material/finish dropdowns and extra chooser dialog are removed.

- [x] **2.1b Material finishes (11 October).** Keep style separate from material. Offer Stone, Wood and Metal families with finish presets and a custom color option, with restrained shading and wood grain; avoid turning every material into another wall style.
  *Done when:* Each finish has a distinct visible treatment, survives saving/sharing/exporting and stays responsive on the dense Bou Inania patterns.
  *Implemented:* Independent color pickers and reset; stone bevels, restrained wood grain, and polished metal highlights. Presets: limestone, marble, sandstone, slate; oak, walnut, cedar; silver, gold, bronze, copper. Material presets change the framework starting color and preserve the background. Older designs keep the original stone finish. Jali acceptance checks and the final full suite pass. Two existing Bou Inania timing checks failed on earlier runs (including the pre-change commit), but pass on this run without engine or threshold changes. See [the finish checks](testing/jali-finishes-2026-10-11.md).

- [x] **2.1c Grouped Jali finish options (11 October).** Owner-approved Stone → limestone/marble/sandstone/slate, Wood → oak/walnut/cedar, and Metal → silver/gold/bronze/copper. Each family supports Custom color and preserves its shading treatment. These are stylized color presets; new stone veins and bronze patina are not part of this implementation. Older gold/silver designs and links migrate to Metal without changing their appearance.
  *Done when:* The family limits the finish options, custom colors retain the family, saved/shared designs and exports retain the selected finish, and validation passes.

- [x] **2.1d Jali material textures (11 October).** Add automatic finish-specific texture to the screen and the visible finish swatches. Limestone pores, marble veins, sandstone grain, slate strata, wood grain, brushed gold/silver and hammered bronze/copper must preserve open apertures, custom colors and the one-click controls. Match live walls, saved previews and SVG/PNG exports without lighting filters.
  *Done when:* Normal and zoomed screenshots are captured and inspected on desktop/phone and dense Bou Inania, textures are refined from that inspection, and tests/lint/typecheck/build/browser checks pass. See [the texture report](testing/jali-textures-2026-10-11.md).

- [ ] *(Recommended to drop, see the review above; waiting for the owner's decision.)* **2.2 Tazhib / Illumination (Gold Leaf & Lapis) style.** Add `illumination` to `WallStyle`. Gilded gold-leaf star rosettes with SVG metallic gradients, deep ultramarine/lapis lazuli backgrounds, and fine black *tahrir* pen outlines.
  *Done when:* Player wall dropdown includes `Illumination`, applying gold metallic gradients and lapis ground; tests pass.

- [ ] *(Merged into `main` on 11 October, pull requests #4 and #7; waiting for the owner's look at the fix.)* **2.3 True Interlace (Woven / Lacería) style.** Add `interlace` to `WallStyle`. Ribbons weave in an alternating over-and-under pattern at crossings instead of merging into a flat band, with seam incisions and subtle under-crossing drop shadows.
  *Done when:* Player wall dropdown includes `Interlace`, displaying alternating over/under ribbon layers at intersections; tests pass.
  *Fixed 11 October (owner's report of Barca stars and Bou Inania):* the live wall slid each patch to its tile twice, so patches at the seams were cut in half; and each patch was a straight piece clipped to the ink piece it sat on, which in Bou Inania is often a hundredth of the tile, so the weave vanished there. The engine now follows each top band through cuts and bends to halfway to the next crossing, the player draws the patch along that path as long as the crossing angle needs, a band ending against another (a T) no longer breaks the chain, and a conflict no longer leaves the whole pattern flat. Every tutorial weaves with no broken step (tested). See `docs/geometry-notes.md`.

- [ ] *(Recommended to drop, see the review above; waiting for the owner's decision.)* **2.4 Carved Stucco / Yesería (Bas-Relief & Chiseled Stone) style.** Add `relief` to `WallStyle`. 2.5D architectural relief using SVG lighting filters (`feSpecularLighting`, `feDiffuseLighting`) or beveled facet gradients.
  *Done when:* Player wall dropdown includes `Relief`, rendering dimensional beveled facets with directional lighting; tests pass.

- [ ] *(Recommended to drop, see the review above; waiting for the owner's decision.)* **2.5 Kündekari & Wood Marquetry (Inlaid Woodwork) style.** Add `wood` to `WallStyle`. Oriented timber grain textures across piece types (e.g. radial grain for star petals) with ivory/bone stringing along seams.
  *Done when:* Player wall dropdown includes `Wood`, rendering timber grain joinery; tests pass.

- [ ] *(Recommended to drop, see the review above; waiting for the owner's decision.)* **2.6 Blueprint / Architectural Draft style.** Add `blueprint` to `WallStyle`. Cyanotype/architectural draft aesthetic with deep navy background, luminous cyan/amber linework, and faint ghost compass/ruler construction arcs.
  *Done when:* Player wall dropdown includes `Blueprint`, rendering high-contrast architectural linework; tests pass.

Later phases (AI pipeline, accounts and library, learning features, designers) are described in `docs/PRD.md`.


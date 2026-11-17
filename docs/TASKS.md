# Tasks

Work top to bottom, one task per session and one commit per task. A task is done only when its acceptance test passes and the full test and lint commands are green. Tick the box in the same commit.

## Player interface

- [x] **UI.3 Make Patterns a show/hide sidebar.** On wide screens, reserve space beside the canvas, keep the toggle usable and the sidebar open while browsing, and remember the desktop choice. Narrow screens retain a modal drawer. Preserve current view, unsaved-work protection and keyboard/focus behavior. Screenshot iteration checked 1280px light/dark, 1024px and 390px layouts. [Evidence](testing/pattern-sidebar-2026-11-16.md). Approved for publication.

- [x] **UI.2 Restore the centered title and clarify three finish actions.** Owner refinement: Previous–title–Next as a centered group, quiet arrow navigation, an icon-only Patterns drawer toggle, and three distinct action weights: filled Next lesson, outlined Save, text-style Copy link with a link icon. Screenshot iteration tightened arrow spacing and fixed the 320px view switch; explicit arrow slots keep the title centered at either end of the library. Full root tests, lint/typecheck/build, and final 58 browser cases passed (two phone skips). [Visual review](http://localhost:4200/__review/renders/player-header-2026-11-16/index.html). Approved for publication.

- [x] **UI.1 Clarify action hierarchy and header utilities.** Owner request, 16 November: keep Next lesson as the primary filled action, make Save secondary beside it, group previous/next pattern navigation with directional emphasis, place icon-only Feedback beside Settings, and shorten the tooltip to Settings. Preserve keyboard labels, feedback context and unsaved-work protection. Screenshot iteration also removed the phone Share row above the construction. Full root checks and final 39 sharing/layout browser cases passed. Approved for publication; [evidence](testing/player-action-hierarchy-2026-11-16.md).

## Learning path

- [x] **LEARN.1 Propose the beginner path visually.** Present twelve linked existing lessons with one new focus each, original difficulty ratings and explicit status/photo evidence. Show the order and missing free-photo gates before promoting a public course. Prototype: [review the path](http://localhost:4200/#/notes/beginner-path). Full root lint/typecheck/tests and the production build passed; 11 focused unit and six desktop/phone review-browser cases passed. Navigation was subsequently approved and built as LEARN.2; reference and newcomer checks remain LEARN.3.
- [x] **LEARN.2 Build the approved learning navigation.** The owner approved Start here and next-lesson links on 16 November after the distinction from existing tutorials was explained. The home card opens the first paused lesson or the twelve-lesson path at `#/learn`. Finished watch lessons and kept draw-along boards offer the next lesson in the same mode. Hidden lessons are excluded; unsaved-work protection remains active. Original difficulty and photo limitations remain visible. No completion tracking is inferred. Root lint/typecheck/build and all workspace test targets passed (player: 3,140 tests); 81 production-browser and six evidence-review cases passed, with one configured phone skip. [Evidence](testing/learning-path-2026-11-16.md). Approved for publication with the learning/UI release.
- [ ] **LEARN.3 Complete the selected path’s reference and newcomer checks.** Prioritize matching free photos for the opening lessons, then plain-language/read-aloud checks and newcomer trials. Three recorded matching public examples and nine unresolved photo gates remain. Navigation approval does not close these checks.

## Wall styles (owner, 16 November 2026)

The owner's notes after looking at the finished walls on the live site, recorded to work through one at a time. Screenshots of the current look and the owner's inspiration pictures are in `docs/research/wall-styles-2026-11-16/` (private; the inspiration pictures are from a web search and are never shipped). For each one, show a visual proposal and wait for the owner's choice before changing the app.

- [ ] **STYLE.1 Make Lines look hand drawn and hand coloured.** Lines looks bad in every drawing option (Single, Double, Pencil): the colour wash is a muddy, mottled texture that hides the pattern, and the colours do not look right. The owner wants it to look like an artist's sheet: lines drawn by hand and pieces coloured by hand, as in the watercolour rosette and the coloured-pencil drawing over its construction lines. Research how such sheets are made (watercolour wash with paper showing through and white gaps between pieces, pencil shading, visible construction lines underneath) and say what we think before building anything.
  *Study, 16 November:* [the lines study](http://localhost:4200/#/notes/lines-study) puts today's Lines beside three proposed looks (Watercolour with paper lines, Ink and wash, Coloured pencil over the construction), each piece painted on its own with paper palettes, on the star and cross and the Arrayanes ceiling. Review only; the player is unchanged until the owner chooses.
  *Owner's choice, 16 November:* Watercolour (paper lines, no ink).
  *Built, 16 November (awaiting the owner's look):* the Lines style is now called Watercolour. Each piece is drawn inside its outline so the paper shows between pieces, and one paint filter over the whole wall gives each piece a wavering edge, a darker pooled rim and paper grain, with no seam between tiles. The pen choices (Single, Double, Pencil), Lines only / Colour wash and the ink colours are removed; the slider is now Paper line. Old designs and share links with a pen open as Watercolour; the print sheet keeps its bare ink outline; downloads and the style thumbnails show the same paint. Four paper palettes (Rose, Violet and sky, Indigo and ochre, Teal and gold) are added to the palette list. Watercolour opening in a paper palette automatically waits for STYLE.5.
- [ ] **STYLE.2 Tiles: no two touching pieces in the same colour.** Neighbouring pieces with the same colour merge into one shape (the large white areas of the Arrayanes ceiling). Colour assignment should avoid it wherever the pattern allows.
- [ ] **STYLE.3 Strapwork or Interlace: keep one?** The owner always prefers Interlace. Work out what Strapwork shows that Interlace does not, and whether anyone would miss it; if nothing, remove Strapwork.
- [ ] **STYLE.4 Interlace: no white pieces under white bands.** The bands are white, so white pieces behind them make the wall busy and lose the bands (both Arrayanes and Dos Hermanas). Avoid white pieces whenever the bands are white.
- [ ] **STYLE.5 Separate colours for Interlace and Tiles.** A colouring that suits Interlace does not always suit Tiles. Each style may keep its own colours.
- [ ] **STYLE.6 A better name than "Jali".** Find a plain, descriptive name that a newcomer understands (it shows a pierced screen in stone, wood or metal).
- [ ] **STYLE.7 Jali: the pattern is hard to read at the default lattice.** With the default lattice the openings are small, and the pattern does not come through (Dos Hermanas looks like scattered holes). Choose a better default, perhaps per pattern.

Found while reading the same screenshots (Claude, 16 November), for the owner to confirm or drop:

- [ ] **STYLE.8 Grout or edges the same colour as pieces.** On the Dos Hermanas Tiles wall the background pieces are black and so is the grout, so the outlines vanish and the stars float on a black field. The grout should differ from every piece colour, or pieces should avoid the grout colour.
- [ ] **STYLE.9 Raw names in the colour list.** The colour list shows internal names such as `pointed_star` and `twelve`. Show plain names ("pointed star", "twelve-pointed rosette") instead.
- [ ] **STYLE.10 Colour tabs change order between patterns.** Arrayanes shows By shape, Ring by ring; Dos Hermanas shows By place, Ring by ring, By shape. Keep one order everywhere.
- [ ] **STYLE.11 The default wall shows too many repeats.** Dense patterns such as Dos Hermanas open so far out that each piece is tiny and the Interlace bands become noise. Open closer, perhaps scaled to the pattern's size.
- [ ] **STYLE.12 The panel's slider is named three ways.** Line width, Band width and Lattice are the same kind of control, each shown as "1×". Check that the names and the value make sense to a newcomer.
- [ ] **STYLE.13 "Reset the drawing" is hard to see.** It is grey on dark and reads as disabled. Check its contrast in both themes.

## Cleanups (noted 16 November 2026)

Found while reviewing Codex's PRs #16–#18 and retiring GitHub Pages. None of them changes what learners see, so they can wait, but do not lose them.

- [ ] **TIDY.1 Share the player's icons.** The arrow, feedback, link and sidebar icons are written out as inline SVG in `PatternNav.tsx`, `FeedbackButton.tsx`, `Sharing.tsx` and `Player.tsx`, each repeating the same stroke settings. Put them in one small icon module so a change of stroke or size is made once. *Done when:* every icon comes from that module and the browser checks still pass.
- [ ] **TIDY.2 Close the pattern sidebar through a ref.** `Player.tsx` returns focus to the Patterns button with `document.querySelector('.topbar .menu-button')`, which breaks silently if the class or layout changes. Pass a ref from `PatternMenu` instead. Also move the imports that PR #18 added above the existing ones (`Player.tsx`, `Library.tsx`, `DrawAlong.tsx`) back into the usual order. *Done when:* the focus test in `e2e/pattern-sidebar.spec.ts` still passes.
- [ ] **TIDY.3 Bring the player's lint warnings down.** `pnpm nx run player:lint` has no errors but 306 warnings. Sort them by rule, fix the cheap ones, and turn off on purpose any rule we do not want rather than living with the noise. *Done when:* the remaining warnings are a short list we chose to keep.
- [ ] **TIDY.4 Silence the Vite config warning.** Every player test run prints that `vite.config.mts` imports `./reviewFiles` without an extension and that `reviewFiles.ts` is ESM loaded as CommonJS. Fix the import so the warning goes, before Vite makes the native config loader the default.
- [ ] **TIDY.5 Delete finished branches and worktrees.** There are 38 agent worktrees in `.claude/worktrees/`, 24 `../Tastir-*` worktrees and 86 local branches already merged into main. Remove the merged ones. Of the unmerged ones, `codex/agent-editor-constructions` is already in main as a different commit and `atelier-ui` (22 October) was replaced by the Outline redesign and conflicts with main, so both can go. `origin/docs/readme-first-minute` (1 November) is a README rewrite with screenshots and the live link that still merges cleanly: decide to merge or drop it. Ask the owner before deleting anything that is not merged.
- [ ] **TIDY.6 Finish retiring GitHub Pages.** Pages is switched off and its workflow removed. Still left: the `github-pages` branch and its `../Tastir-pages` worktree; the `TASTIR_BASE` sub-path setting in `apps/player/vite.config.mts`, which nothing uses now; and present-tense mentions of "the GitHub Pages site" in `docs/STUDIO-HOSTED-PRD.md` and `docs/AI-STUDIO-INTEGRATION-REVIEW.md`. Dated history files stay as written.
- [ ] **TIDY.7 Decide on `tools/_shot.mjs`.** An untracked script that screenshots a zoomed wall from the dev server. Either move it into `tools/review/` with a line of usage, or delete it.

## Reported bugs

- [x] **REPAIR.1 Stop signed-out Studio retries.** Protect Studio and Your work with one shared session check, stop list/pulse/live-room calls after a 401, suppress stale responses, retain recovery after verified sign-in, and distinguish connection failures from sign-out. A controlled poller test reproduced 13 failed calls in 12 seconds before the fix. Ten focused unit cases, six hosted-browser cases and full root verification passed.
- [x] **REPAIR.2 Discoverable editable exports.** Add JSON beside SVG/PNG and verify importing into a clean browser preserves the construction and current design appearance.
- [x] **REPAIR.3 Library anchors and Unicode search.** Fix direct collection links and Arabic-only/mixed-script queries, retaining useful title-first ranking.
- [x] **REPAIR.4 Fresh accessibility and performance audit.** Three serial mobile runs before/after: accessibility 88→100, median performance 96→96, transfer −21%. Named progress, valid chip ARIA, main landmark, contrast and responsive previews verified; full checks and 51 browser cases passed (one intentional phone skip). [Evidence](testing/grok-accessibility-2026-11-15.md).

- [x] **REPAIR.5 Numbered lesson links and deliberate Back history.** Open numbered watch links paused, preserve manual step visits in history without autoplay flooding it, retain the mounted drawing on Back/Forward, override local resume with explicit positions, and retain the color-first order. Verify reload, invalid links, existing sharing and browsing.
- [x] **REPAIR.6 Draw-along teaching guidance and named report audit.** Fix premature point aliases, keep the next required tool visible, and explicitly exercise construction → ink → repeat. Preserve unresolved older reports when their reproduction cannot be identified.
- [x] **REPAIR.7 Remaining everyday usability.** Added safe pattern/design Duplicate actions, explicit variation saving, rectangular personal previews with 44px actions, real preparation feedback and stronger repeat guides. Existing tooltips and horizontal phone rows are verified. Final root checks and all 251 desktop/phone browser cases passed; 11 configured platform skips. [Evidence](testing/grok-usability-2026-11-16.md).

- [ ] **REVIEW.1 Close the remaining review acceptance.** All seven local reliability repairs are verified; [the morning report](NIGHT-REPORT-2026-11-16.md) shows the changes and evidence. Published through PR #17 with a passing production smoke check. Remaining: physical-phone zoom acceptance, controlled authenticated Studio acceptance, and the three older draw-along reports once their original lessons/steps can be identified. Keep these separate from the repaired named issues.


- [ ] **BUG.1 Phone pattern view does not zoom.** Reported by the owner on 14 November 2026 after encountering it on 13 November. On a phone, open a pattern and try to zoom the drawing: neither a two-finger pinch (in or out) nor double tapping changes the zoom. Expected: the pattern can be enlarged to inspect details and reduced again with touch gestures. The exact pattern, page/stage, phone model, OS and browser of the original report were not recorded. Pinch zoom was included in completed task 1.3.
  *Investigation, 14 November:* reproduced on the [star-and-cross wall](http://localhost:4200/#/eight-fold-star-and-cross/result) with Chromium touch emulation at 390×844. Spreading two contacts panned the wall sideways but left its view width at 12; double tapping also left it at 12. A wheel event on the same drawing reduced the width to 8.372, confirming that wheel zoom works. Browser page scale stayed at 1 throughout the touch gestures. `apps/player/src/app/useCamera.ts` zooms only from wheel events (including desktop trackpad Ctrl-wheel), tracks one pointer for panning and has no two-pointer pinch or double-tap handler. The drawing's `touch-action: none` in `styles.css` suppresses native gesture zoom. The emulation data is saved locally at `docs/review/phone-zoom/reproduction.json`. Real-phone verification and the fix remain open.
  *Local fix, 15 November:* two-finger midpoint-anchored pinch and pan are implemented in the shared camera, with gesture cancellation and tap protection. Unit checks cover zoom in/out, midpoint movement, continuation with one finger, cancellation and limits; Production Chromium touch checks cover a paused construction lesson and a finished wall, including off-centre pinch anchors, zoom out and one-finger panning. Double tapping retains existing selection behaviour; pinch and Fit are the supported zoom/reset controls. This remains unchecked until a real-phone acceptance check.
  *Done when:* reproduce and document the affected view and device/browser; verify on a real phone that pinching zooms in and out around the gesture centre, panning still works, and tapping pieces/controls is not broken. Decide and document the intended double-tap behavior, and check it if supported. Add a regression check for the diagnosed cause.

- [x] **BUG.2 Library filter counts omit alternate places.** Found during the duplicate/place review on 15 November 2026. In the local [library](http://localhost:4200/#/), the “Alhambra and Nasrid Spain” region says 36 patterns, but selecting it displays 39 cards. The selected filter returns the places correctly; its count is wrong. `facetCounts` in `apps/player/src/app/browsing.ts` considers a card and its variations but omits their `places`, while the filter itself includes them. The [marked screenshot](http://localhost:4200/__review/renders/ink-overlay/region-counts.png) and six affected region counts are in [the duplicate review](http://localhost:4200/#/notes/duplicates-review).
  *Fixed locally, 15 November:* counts now call the same filter as the card results, preventing cross-member query/level mismatches as well as including places. Regression cases cover duplicate member regions, variation places and combinations of queries and facets; desktop/phone browser checks confirm the menu count equals returned cards. Full tests, lint, typechecking and production build pass.
  *Done when:* each facet count equals the number of cards returned by applying that facet with the other active filters, including places and variations and counting each card once. Cover places in different regions, overlapping member regions, text queries and other active filters in regression checks.

## Settings and shared views (owner, 15 November 2026)

- [x] **UI.1 Modernize View settings.** Replace Speed and Ink dropdowns with visible segmented choices; replace the three plain checkboxes with labelled switches. Give Hide from library a clear action-button treatment and an eye/visibility icon. Keep keyboard support, visible focus, touch sizing, outside/Escape dismissal, error handling and light/dark themes. Apply the same preference to future controls elsewhere; a full app-wide control audit remains follow-up work.
- [x] **UI.6 Keep only Outline.** Remove the alternate settings themes, theme picker, preview/comparison code and theme preference machinery. Ignore legacy theme values so every browser gets Outline. Preserve light/dark, accessible controls and the selected ink/speed treatments.
- [x] **UI.5 Selected Outline polish.** Make Outline the default for unsaved panel preferences. Remove toggle state words/check marks while retaining text colour and weight. Improve speed selection contrast, typography, hover/focus and touch size in light and dark. [Review Outline](http://localhost:4200/#/notes/settings-designs).
- [x] **UI.4 Refine settings themes from owner feedback.** Add four working blue/teal variations with minimal typography, larger ink diagrams, tighter spacing, and explicit On/Off label states (colour and weight as well as words). Keep original themes in the visual comparison; selection remains the owner’s choice. [Compare themes](http://localhost:4200/#/notes/settings-designs).
- [x] **UI.3 Working settings-theme alternatives.** Build Atelier, Precision and Mosaic as distinct treatments of the real settings component, with a live comparison, light/dark and narrow-width views. Preview changes must not alter lessons or hide patterns; applying a choice stores the panel theme locally and lets the owner try it beside a real pattern. Keep the previous design available for reference. Superseded by UI.6: the owner selected Outline and requested removal of the alternatives.
- [ ] **UI.2 Audit other app controls.** Apply the owner’s visible-choice and switch preference elsewhere, retaining dropdowns only where they are the clearest practical choice. Review candidate changes visually instead of restyling every control indiscriminately.
- [x] **LINK.1 Share the intended presentation.** Existing share links preserve design appearance; extend them to include the current stage, ink mode, speed, names/helpers, repeat arrangement and zoom/pan framing. Shared options override viewing defaults for that link without changing the recipient's saved preferences. Respect reduced motion, validate optional state, retain old-link compatibility, and test opening in a clean browser.

## Teaching investigations (owner, 15 November 2026)

- [x] **TEACH.1 Compare the construction paths of near-matching designs.** For the [Paccard pair](http://localhost:4200/#/paccard-222-rosette/result) / [ring version](http://localhost:4200/#/paccard-222-rosette-ring/result), and [Najjarin](http://localhost:4200/#/fes-najjarin-rosette/result) / [Bou Inania, Meknes](http://localhost:4200/#/meknes-bou-inania-rosette/result), determine whether they already share exactly the early drawing steps and diverge near the end, could be rewritten that way, or use different constructions that converge on similar ink. Compare actual operations and dependencies, allowing renaming and uniform similarity; final-ink resemblance alone is not evidence of shared steps. Present synchronized construction diagrams with the divergence marked. Propose any rewrite before changing a credited construction, and preserve final ink, source fidelity and the golden tests.
  *Investigation complete, 15 November:* [the visual follow-up](http://localhost:4200/#/notes/teaching-update) shows shared prefixes of four and ten complete steps. A review-only Paccard reorder extends its prefix to seven; a reproducible audit verifies unchanged final geometry, ink and tile. No tutorial steps were rewritten.
  *Done when:* both pairs have a visual, evidence-backed explanation of their shared beginning or differing routes, and any proposed shared-prefix rewrite identifies its pedagogical benefit and provenance tradeoffs.

- [x] **TEACH.2 Make the destination visible before inking.** The owner reports that the last construction step still gives no clear idea which lines will become the pattern. Inspect existing “Ink as you go” behavior first. Explore a faint, clearly labelled final-ink guide and/or emphasis on eligible portions of the construction, with a controllable transition from construction to ink. Show a simple star-and-cross and a dense rosette side by side in a visual prototype before altering the lesson. Preserve the roles of current-step colour, highlighted dependencies and committed ink; preview must not edit the drawing or reveal lines as already constructed when they are not.
  *Implemented with the owner’s approval, 15 November:* “Guide first” is the default mode. It shows a faint, non-interactive line guide on the last visible construction step, then keeps the full inking animation. End-only and progressive modes remain available; an existing progressive choice is retained. The [visual review](http://localhost:4200/#/notes/settings-update) shows the real implementation, and the [cue study](http://localhost:4200/#/notes/ink-guide) compares lines with point-only markers.
  *Done when:* the owner can see and compare the proposal, including reduced-motion/manual behavior, and decides which treatment to implement. The original request is recorded even if no lesson UI change is yet approved.

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


## Local AI assistant

The delivered milestones and their live/automated evidence are in [AI agent setup](AI-AGENT-SETUP.md). These tasks track the remaining work without deleting the unmerged milestone branches.

- [x] **AI.1 Normal-page square-band coloring and review fixes.** Connect a checked concentric-square command to the current result page and its color Undo history. Clarify band sizes, preserve other shapes, save/reload/share the new coloring data, reject stale/stopped replies, and address the applicable items in [Claude’s review](AI-AGENT-REVIEW.md).
  *Done when:* the Squares and stars wall shows a black centre and teal/blue/orange one-cell borders, one Undo reverses the request, Redo restores it, a saved design reloads identically, and required checks pass with one worker.
- [x] **AI.2 Chat companion and editing the open normal drawing.** Use a compact toolbar icon and a real conversation thread with a fixed composer, Stop, New conversation and accessible close/focus behavior. Separate chat presentation and transcript state from the drawing UI. Reuse the normal editor’s commands and history, with author/request labels, autosave and a fresh image after each batch.
  *Done when:* a request edits the actual saved-pattern editor, protects a later manual edit, and Undo/Redo and saving preserve the expected geometry.
- [x] **AI.2a Companion icon and service-error recovery.** Replace the robot with a theme-aware zellige star; distinguish confirmed usage limits from unavailable usage checks, expose Manage usage on confirmed limits, and preserve earlier edits and action records when later inference fails.
  *Done when:* exact HTTP/SSE error classifications and chat recovery pass; desktop/tablet/phone previews show the new icon and retain the prompt; full tests, lint and TypeScript pass sequentially.
- [x] **AI.3 Broader coloring and named saves.** Add named rosette rings, individual positions in the color repeat, shape palettes, shared square borders and new named saves through the existing storage paths.
  *Done when:* only a selected ring/piece changes, surrounding colors remain unchanged, and save/export/share round-trip the result.
- [ ] **AI.4 Local release and distribution.** Finish bounded repair and generation checks, account recovery, credential keyring storage, and wider live evaluation; review merging before pruning contained branches.
  *Done when:* the acceptance scenarios in the AI plan pass, startup is clear on desktop and phone, and the owner reviews the release evidence.

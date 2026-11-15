# Teaching and usability follow-up, 15 November 2026

Start with [the visual follow-up](http://localhost:4200/#/notes/teaching-update) and [the palette study](http://localhost:4200/#/plan/palettes). This document retains the technical evidence; presentations are now the owner's preferred way to receive substantive feedback, with animation where it improves understanding. That preference is recorded in `docs/WORKING-WITH-OWNER.md`.

## Shared construction routes

The Paccard pair shares four complete steps byte-for-byte after schema parsing; Najjarin and Meknes Bou Inania share ten. This includes step wording, named construction operations, highlights and animation metadata. The first Paccard difference is an auxiliary circle `cu6` and point `U6` in step 5; the first Najjarin/Bou Inania difference is the choice of `P14` and its guide lines in step 11. These are shared beginnings followed by branches, not independent routes that happen to converge on similar final ink.

For Paccard, a proposed temporary reorder moves `cu6` and `U6` to step 8. Steps 5–7 then match the ring version as well. `tools/audit-shared-constructions.mts` parses and evaluates that proposal and verifies equality of every final named geometry, the entire ordered list of ink segments and the repeat cell. The result is seven shared steps with the same final drawing. The source tutorial files were not rewritten. A credited drawing reconstruction need not preserve an arbitrary grouping of auxiliary measurements, but the source note and teaching text should be reviewed if this proposal is adopted.

## Before the ink

The app already offers “Ink as you go”. That mode draws eligible ink as supporting geometry becomes available. The owner's new question is about recognizing the destination before the final inking stage. The visual prototype therefore keeps that mode separate and shows an optional dashed final-ink guide on the completed construction. A manual reveal control and optional animation strengthen the guide while construction lines fade. Reduced motion reveals the final state directly; manual controls remain available. The prototype never edits a tutorial, changes committed ink or displays a future stroke as already drawn. It is demonstrated on a simple star-and-cross and a dense rosette; the actual lesson UI is unchanged pending visual review.

## Usability and attribution

The shared camera now tracks touch contacts and uses a fixed gesture snapshot to zoom around the initial midpoint and pan with the moving midpoint. Two fingers cannot select a piece accidentally, one-finger dragging continues after a finger lifts, and a fresh single tap retains its original target. Cancellation, unrelated pointer movement, zoom bounds and capture transfer are handled. Wheel zoom and Fit remain available. Double tapping retains the existing selection behaviour rather than adding delayed single taps or an extra ink edit. Physical phone acceptance remains open even after Chromium touch emulation passes.

Facet counts now ask the same `filtered` function as the results. This also avoids a subtler error where a region from one family member borrowed a matching text query or level from another. Each card is counted once. The Comares place credit retains its historical design source but explicitly describes the standard construction now taught; the obsolete steps 1–5 mapping is removed. No construction or ink was changed by the credit edit.

## Palette evidence

The two Paccard sources contain exactly the same seven-colour original palette. Najjarin and Meknes Bou Inania have no separate original palette in their files: they currently use `Marinid zellige` and `Modern Moroccan`. The review page therefore offers all existing presets and one distinct Paccard candidate, rather than inventing four new palettes or calling preset colours photo samples. The same three walls and placement rules are used for comparison. Candidate colours are applied only to review copies; core palette types, original colourings and saved designs are unchanged. Ring colouring and the general extra-slot fallback policy still require implementation review after the owner chooses a direction.

## Validation

The initial focused camera and browsing suites passed 28 checks. The final full suite also includes a fifth touch regression for capture transfer from a child path, alongside the two place/facet regressions. The shared-prefix audit verifies 4 → 7 shared steps for the Paccard proposal with identical final geometry, ink and cell, and 10 shared steps for Najjarin/Bou Inania. Final workspace validation passed: `pnpm lint --parallel=1`, `pnpm typecheck --parallel=1`, and `pnpm test --maxWorkers=1`. All 13 test tasks succeeded (six reused from cache); the completed serial run took 15 minutes 11 seconds. An earlier runner received a termination signal before completion and was restarted; it is not counted as a passing run.

`pnpm nx run player:build` passed. Production Chromium checks for browsing, places and touch zoom passed 37 tests, with three intentionally skipped by viewport. The touch cases explicitly use a paused `/watch` construction and `/result` wall, assert their drawing classes, pinch away from the drawing centre, verify the anchor, zoom back out and pan. Both region-count checks and all 22 place-navigation checks passed. This does not substitute for acceptance on the owner's physical phone.

Development-browser checks passed for both exact shared prefixes and first branch points, the simple and dense ink guides, manual controls and reduced-motion reveal, all six palette-wall previews, palette switching and phone layout without horizontal overflow or page errors. Screenshots and the shared-prefix audit are under `docs/review/teaching-update/`. No frozen-engine equivalence, performance timing or independent historical/photo/colour verification is claimed for this follow-up.

Final smoke checks also passed real animation progress and Pause with normal motion, direct navigation from the construction study to the guide, dark-theme rendering, the dense phone preview and the evidence link. The final player lint and typecheck targets passed after the route and browser-test refinements. The corrected development touch measurements are saved at `docs/review/teaching-update/touch-zoom-fixed.json`: construction width 2.48 → 1.24 → 2.48, wall width 12 → 6 → 12, with each off-centre anchor preserved. The local region menu and result cards both count 39.

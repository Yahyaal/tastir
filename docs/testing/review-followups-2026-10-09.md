# Claude review follow-ups, 9 October 2026

Review: `docs/prompts/team-2026-10-09b.md`. Branch: `codex/learning-reliability`, based on main at `c1b5a08`.

## Review pictures

The dev server looks for each render or research file in its own worktree first, then in the main checkout. Existing local folders no longer prevent fallback for files they lack. All 77 render URLs referenced by the review page returned HTTP 200 from port 4290. Tests use a real temporary Git worktree and check local overrides, fallback, absent files, directories and traversal.

## Draw-along layout

Step chips occupy one horizontally scrolling row. Next and Back reveal the active chip without scrolling the page. Desktop instructions reserve consistent space; tablet headers reserve two lines for longer titles. Instructions fit without needing their own scrollbar in every audited case.

Measured with playwright-core and Chromium 1248 on the isolated dev server at port 4291, with live reload disabled. The audit covered the original six tutorials plus the revised `bou-inania-twelve-fold-wall`: construction before/after drawing, ink opening/completion, repeat, filled wall, color, and phone reference/palette switching.

**35 tutorial/viewport cases, 1144 observations, zero failures.** Desktop cases at the three larger sizes were completed first; tablet and phone cases were run after the tablet-header fix. That fix applies only from 761px through 1100px, so it does not affect the three completed desktop runs. The combined raw data and screenshots are in ignored `docs/review/codex-layout-followup/`.

| Viewport | Learner x | Learner y | Width | Height | Movement between stages |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1280x800 | 20 | 328 | 606 | 391.203125 | 0 px |
| 1366x768 | 20 | 328 | 649 | 359.203125 | 0 px |
| 1440x900 | 20 | 328 | 686 | 491.203125 | 0 px |
| 1024x768 | 20 | 433 | 478 | 254.203125 | 0 px |
| 390x844 | 20 | varies by tutorial | 350 | 523.265625 | 0 px |

All seven tutorials have the same desktop board box at a given viewport. Their two boards stay equal and aligned. Phone panels have equal sizes and stay at the same position within each tutorial; phone pages scroll vertically.

Run the complete audit with `TASTIR_URL=http://localhost:4290 node tools/check-draw-along.mjs` after test/build/catalog commands finish, or use a dev server with live reload disabled.

## Missing Upcoming images

Failed photos and finished-wall pictures are removed and replaced by the blueprint in both cards and inspection viewers. Source links remain available. Browser checks simulated missing private assets on all 24 cards and both photo/drawing inspection modes. Available public photos still display.

## Arabic labels

Only the three requested strings changed:

- Bou Inania rosette: خاتم الاثني عشر البوعنانية بفاس
- Nasrid tradition: العمارة النصرية بغرناطة
- Mian hexagonal repeat: روزيتا اثنا عشرية بتكرار سداسي

All three were checked in the live app. Other Arabic labels are unchanged.

## Validation

Each follow-up was checked with `pnpm test`, `pnpm lint` and `pnpm typecheck`. The final run is sequential: one Bou Inania functional test exceeded 30 seconds when tests and the layout audit competed for resources, so the final checks run after the audit.

The final full tests, lint and TypeScript commands exited 0. The final complete production browser run exited 0: **54 passed, six intentional non-desktop performance skips**. Slowest measured stages: Bou Inania 336 ms, Kurt 197 ms, shifted Kurt 156 ms. Ink preparation waits were 4,730 ms, 11 ms and 922 ms.

The first browser run had one Bou Inania timing outlier at 2,980 ms. The same build passed an isolated rerun (412 ms) and the complete rerun (336 ms); the one-second threshold was unchanged. Timing remains sensitive to machine load.

Engine speed work is assigned separately. These follow-ups do not change `packages/engine`, tutorial data, palettes, or the review page’s data file.

# Draw-along verification, 9 October 2026

Branch: `codex/learning-reliability`. No tutorial files were changed.

All 36 tutorials pass automated drawing and inking checks with helpers both on and off, including panel geometry and expected piece types. Draw along is available at every level. Sharing validation, error recovery, beginner guidance, library previews, and local browser checks are also included in this branch.

## Layout measurements

Measured using `node tools/check-draw-along.mjs`, the standalone playwright-core harness, Chromium 1248, and the isolated dev server on port 4290. Coordinates are CSS pixels in the document, so scrolling a phone does not count as board movement. Each observation checks both visible boards for equal dimensions/alignment, fixed position, horizontal overflow, and unclipped status text. Desktop checks also require the page and footers to fit the viewport. Phone checks include switching to the reference drawing and color palette.

The table gives the learner board’s initial box; it stayed exactly the same at every recorded construction, ink, repeat, and color stage. Both desktop boards stayed equal and aligned. The second board’s x coordinate is 654 at 1280px, 697 at 1366px, 734 at 1440px, and 526 at 1024px. Phone panels alternate at the same coordinates. Phone pages scroll vertically.

| Tutorial | Viewport | x | y | Width | Height | Observations | Maximum movement |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| eight-fold-star-and-cross | 1280x800 | 20 | 276.1875 | 606 | 443.015625 | 19 | 0 px |
| alhambra-comares-bones | 1280x800 | 20 | 276.1875 | 606 | 443.015625 | 19 | 0 px |
| twelve-fold-rosette-mian | 1280x800 | 20 | 276.1875 | 606 | 443.015625 | 24 | 0 px |
| alhambra-reyes-stars | 1280x800 | 20 | 296.78125 | 606 | 422.421875 | 27 | 0 px |
| bou-inania-rosette | 1280x800 | 20 | 366.78125 | 606 | 352.421875 | 51 | 0 px |
| kurt-eight-fold-zellige | 1280x800 | 20 | 276.1875 | 606 | 443.015625 | 43 | 0 px |
| eight-fold-star-and-cross | 1366x768 | 20 | 276.1875 | 649 | 411.015625 | 19 | 0 px |
| alhambra-comares-bones | 1366x768 | 20 | 276.1875 | 649 | 411.015625 | 19 | 0 px |
| twelve-fold-rosette-mian | 1366x768 | 20 | 276.1875 | 649 | 411.015625 | 24 | 0 px |
| alhambra-reyes-stars | 1366x768 | 20 | 296.78125 | 649 | 390.421875 | 27 | 0 px |
| bou-inania-rosette | 1366x768 | 20 | 366.78125 | 649 | 320.421875 | 51 | 0 px |
| kurt-eight-fold-zellige | 1366x768 | 20 | 276.1875 | 649 | 411.015625 | 43 | 0 px |
| eight-fold-star-and-cross | 1440x900 | 20 | 276.1875 | 686 | 543.015625 | 19 | 0 px |
| alhambra-comares-bones | 1440x900 | 20 | 276.1875 | 686 | 543.015625 | 19 | 0 px |
| twelve-fold-rosette-mian | 1440x900 | 20 | 276.1875 | 686 | 543.015625 | 24 | 0 px |
| alhambra-reyes-stars | 1440x900 | 20 | 276.1875 | 686 | 543.015625 | 27 | 0 px |
| bou-inania-rosette | 1440x900 | 20 | 296.78125 | 686 | 522.421875 | 51 | 0 px |
| kurt-eight-fold-zellige | 1440x900 | 20 | 276.1875 | 686 | 543.015625 | 43 | 0 px |
| eight-fold-star-and-cross | 1024x768 | 20 | 321.78125 | 478 | 365.421875 | 19 | 0 px |
| alhambra-comares-bones | 1024x768 | 20 | 321.78125 | 478 | 365.421875 | 19 | 0 px |
| twelve-fold-rosette-mian | 1024x768 | 20 | 343.46875 | 478 | 343.734375 | 24 | 0 px |
| alhambra-reyes-stars | 1024x768 | 20 | 364.0625 | 478 | 323.140625 | 27 | 0 px |
| bou-inania-rosette | 1024x768 | 20 | 432.96875 | 478 | 254.234375 | 51 | 0 px |
| kurt-eight-fold-zellige | 1024x768 | 20 | 391.78125 | 478 | 295.421875 | 43 | 0 px |
| eight-fold-star-and-cross | 390x844 | 20 | 622.59375 | 350 | 523.265625 | 21 | 0 px |
| alhambra-comares-bones | 390x844 | 20 | 622.59375 | 350 | 523.265625 | 21 | 0 px |
| twelve-fold-rosette-mian | 390x844 | 20 | 666.21875 | 350 | 523.265625 | 26 | 0 px |
| alhambra-reyes-stars | 390x844 | 20 | 722.8125 | 350 | 523.265625 | 29 | 0 px |
| bou-inania-rosette | 390x844 | 20 | 792.375 | 350 | 523.265625 | 53 | 0 px |
| kurt-eight-fold-zellige | 390x844 | 20 | 694.59375 | 350 | 523.265625 | 45 | 0 px |

Total: **927 observations, 30 tutorial/viewport pairs, zero failures**. Raw measurements and screenshots are regenerated under the ignored `docs/review/codex-layout/` directory.

## Validation

`pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser` all exited 0. The production browser suite passed 54 tests; six duplicate performance cases are intentionally skipped on tablet/phone because timings are asserted on desktop, while layout and user journeys cover all three.

## Performance and limits

Production Chromium tests measure the click through the first two rendered frames for every construction stage plus Ink, Repeat and Color on Bou Inania and both Kurt zellige tutorials. Stage opening is under one second in the recorded runs. Step checks, ink preparation and wall geometry run in workers, with explicit progress feedback.

The final production run measured slowest stages of 542 ms (Bou Inania), 317 ms (Kurt), and 240 ms (shifted Kurt), with ink preparation waits of 5,450 ms, 21 ms, and 878 ms respectively.

**Cold ink preparation is still slower than one second.** The task 2 production run measured waits of 8,910 ms for Bou Inania, 415 ms for Kurt zellige and 1,453 ms for shifted Kurt. The page remains responsive, but ink controls wait for the geometry. This is a remaining performance limitation, not a claim that the full ink stage is ready within one second.

## Try it

From this worktree, start `pnpm exec vite --config apps/player/vite.config.mts --port 4290 --strictPort` and open http://localhost:4290. If the server is already running, just open it.

Choose Draw along on a beginner, intermediate, and advanced card. Try Star and cross, Comares bones, and Bou Inania. Draw each step yourself or use Draw it for me, then Ink it for me → Repeat it → Fill the wall for me → Color it → Keep it. Reload partway through to check saved progress. On a phone, switch between your drawing and the reference/palette; their frames should stay the same size.

Run `pnpm check` for lint, TypeScript, unit/geometry/UI tests, production build and browser tests. Run these sequentially: build and TypeScript share generated output. The browser suite uses port 4392. Run the layout audit separately after generation/build work finishes so Vite hot reloads do not interrupt measurements.

GitHub Actions is disabled repository-wide. The Pages workflow is manual-only; automatic deployments are paused. This branch has not been merged into main.

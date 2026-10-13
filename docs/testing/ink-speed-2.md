# Ink speed, 13 October 2026

Baseline: `3fc89f1`, production build, unchanged `ink-speed.spec.ts`, desktop Chromium, three runs. All nine browser tests passed. This shared workstation was under heavy memory pressure (15 GiB RAM, 2 GiB swap full); the first repeat also overlapped a unit-test run that was stopped. Raw samples are included because the medians are noisy.

| Tutorial | Ink to pen samples (ms) | Median | Ink to Repeat samples (ms) | Median |
| --- | --- | ---: | --- | ---: |
| bou-inania-rosette | 18680, 3887, 16459 | 16459 | 9675, 1685, 3307 | 3307 |
| bou-inania-twelve-fold-wall | 32116, 6161, 7180 | 7180 | 10405, 7268, 34590 | 10405 |
| kurt-eight-fold-zellige-shifted | 1628, 761, 675 | 761 | 1021, 291, 524 | 524 |

Validation baseline incorporates upstream `45a8d60`, Claude's correction of the stale editor playback expectation introduced by PR #11. No existing test is edited by this branch. On that baseline, `pnpm test`, `pnpm lint`, and `pnpm typecheck` each exited 0. The before screenshots were captured on the measured `3fc89f1` production build.

## Rendering and visual comparison

Large boards use two canvas background layers inside the existing SVG: unselected dashed bits and pen dots. Ink, hints, and interaction geometry remain SVG/engine data. The layers inherit the existing colors, widths, dashes and opacity; resize and zoom rerasterize at device pixel resolution. Small boards retain their original SVG elements. Camera changes and raster work are coalesced before painting, and camera motion no longer rebuilds style groups.

Both Bou Inania boards were compared before and after, ready to ink and fully inked, at 1280×800. The geometry, colors and layout are preserved; canvas and SVG have small antialiasing differences on the dense background. Screenshots are captured after the UI settles.

| Board | Before | After |
| --- | --- | --- |
| Rosette, ready | [Before](ink-speed-2/before-bou-inania-rosette-ready.png) | [After](ink-speed-2/after-bou-inania-rosette-ready.png) |
| Rosette, inked | [Before](ink-speed-2/before-bou-inania-rosette-inked.png) | [After](ink-speed-2/after-bou-inania-rosette-inked.png) |
| Twelve-fold wall, ready | [Before](ink-speed-2/before-bou-inania-twelve-fold-wall-ready.png) | [After](ink-speed-2/after-bou-inania-twelve-fold-wall-ready.png) |
| Twelve-fold wall, inked | [Before](ink-speed-2/before-bou-inania-twelve-fold-wall-inked.png) | [After](ink-speed-2/after-bou-inania-twelve-fold-wall-inked.png) |

The new browser regression covers zoom, viewport resizing and inherited colors. Rendering-stage `pnpm test`, `pnpm lint`, and `pnpm typecheck` each exited 0. Browser runs use `TASTIR_BROWSER_PORT` to keep this worktree's preview separate from Claude's.

## After painting less and preparing early

Same unchanged browser test, production build, desktop Chromium, three runs. No other checks launched by this task ran alongside this final measurement.

| Tutorial | Ink to pen samples (ms) | Median | Ink to Repeat samples (ms) | Median |
| --- | --- | ---: | --- | ---: |
| bou-inania-rosette | 645, 626, 622 | 626 | 365, 367, 352 | 365 |
| bou-inania-twelve-fold-wall | 846, 853, 937 | 853 | 449, 425, 548 | 449 |
| kurt-eight-fold-zellige-shifted | 260, 235, 198 | 235 | 149, 144, 142 | 144 |

All three medians and all nine final samples are below one second. The baseline was much noisier under memory pressure, so its speedup ratio should not be treated as a controlled hardware comparison.

The worker warms the expected construction as soon as draw-along knows the tutorial. It builds the same optional-helper construction as “Draw it for me” and retains the prepared geometry and finished pattern without transferring the warm arrays. When the last construction step is complete, the actual learner board is prepared against the existing exact-geometry cache. Different learner geometry gets its own prepare; newer requests still terminate unfinished work. Transfer copies keep the worker cache valid after a board reaches the page.

The final click-time worker work was about 60–70 ms for both Bou Inania boards, with no bits/graph rebuild after the click. No engine change was needed. New regressions cover early worker startup, cancellation and obsolete replies, transfer/cache reuse, and a learner board with an extra circle. Existing golden and draw-for-me tests remain unchanged. A browser interaction check also put the pen down, inked to a reachable dot, and lifted it over the raster layers.

Final validation ran on the exact implementation integrated with upstream `ddf2483` in a separate checkout: `TASTIR_BROWSER_PORT=4493 pnpm check` exited 0, including lint, typecheck, unit tests, production builds, and 143 passing browser cases (16 intentional project skips). This includes Claude's committed colour-stage changes.

To try the branch without sharing Claude's server port, run `pnpm exec vite --config apps/player/vite.config.mts --port 4490 --strictPort`. Open `http://localhost:4490/#/bou-inania-rosette/draw` or `http://localhost:4490/#/bou-inania-twelve-fold-wall/draw`, complete construction, and press Ink. Draw between connected dots, or choose Ink it for me and continue to Repeat it.

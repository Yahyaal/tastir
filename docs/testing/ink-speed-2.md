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

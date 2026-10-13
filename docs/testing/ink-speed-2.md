# Ink speed, 13 October 2026

Baseline: `3fc89f1`, production build, unchanged `ink-speed.spec.ts`, desktop Chromium, three runs. All nine browser tests passed. This shared workstation was under heavy memory pressure (15 GiB RAM, 2 GiB swap full); the first repeat also overlapped a unit-test run that was stopped. Raw samples are included because the medians are noisy.

| Tutorial | Ink to pen samples (ms) | Median | Ink to Repeat samples (ms) | Median |
| --- | --- | ---: | --- | ---: |
| bou-inania-rosette | 18680, 3887, 16459 | 16459 | 9675, 1685, 3307 | 3307 |
| bou-inania-twelve-fold-wall | 32116, 6161, 7180 | 7180 | 10405, 7268, 34590 | 10405 |
| kurt-eight-fold-zellige-shifted | 1628, 761, 675 | 761 | 1021, 291, 524 | 524 |

Validation baseline incorporates upstream `45a8d60`, Claude's correction of the stale editor playback expectation introduced by PR #11. No existing test is edited by this branch. On that baseline, `pnpm test`, `pnpm lint`, and `pnpm typecheck` each exited 0. The before screenshots were captured on the measured `3fc89f1` production build.

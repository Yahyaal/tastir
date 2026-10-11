# Dense-pattern engine performance

Validated on 10 October 2026 in the isolated `Tastir-engine` worktree,
branch `engine/speed`, based on `main` at `fecca93`. Changes are confined to
the engine and its benchmark. GitHub Actions remains disabled.

## Inking

Node v22.23.3; milliseconds, median of seven calls after two warmups.
Each call recomputes its result. These are warmed engine timings, not the
complete cold browser transition. The changed operations improved on all
36 tutorials. Bou Inania meets the 300 ms targets; the wall's ink median
is close to the limit, so machine load can affect the result.

| Tutorial | Ink bits: before → after | Pieces from bits: before → after | Tutorial pattern: before → after |
| --- | ---: | ---: | ---: |
| alhambra-arrayanes-squares | 8.9 → 3.3 | 10.1 → 3.0 | 8.2 → 2.4 |
| alhambra-barca-stars | 15.4 → 4.6 | 20.6 → 3.0 | 9.8 → 2.1 |
| alhambra-bath-stars | 9.6 → 1.9 | 15.7 → 2.3 | 11.0 → 1.8 |
| alhambra-comares-bones | 4.6 → 0.8 | 4.7 → 0.9 | 4.0 → 0.7 |
| alhambra-comares-dado | 5.0 → 1.0 | 9.0 → 1.1 | 4.3 → 0.9 |
| alhambra-comares-frames | 8.1 → 1.6 | 37.1 → 5.5 | 29.1 → 4.2 |
| alhambra-comares-lattice | 6.6 → 1.5 | 9.3 → 1.3 | 5.0 → 0.8 |
| alhambra-comares-stars | 2.6 → 0.5 | 2.4 → 0.4 | 2.6 → 0.5 |
| alhambra-infantas-crosses | 5.9 → 0.9 | 5.3 → 0.8 | 4.3 → 0.7 |
| alhambra-infantas-stars | 5.5 → 0.9 | 11.2 → 1.4 | 9.9 → 1.4 |
| alhambra-leones-fret | 5.4 → 0.9 | 12.8 → 1.6 | 9.3 → 1.2 |
| alhambra-mexuar-stars | 4.1 → 0.6 | 10.3 → 1.4 | 6.0 → 1.0 |
| alhambra-reyes-dodecagrams | 12.1 → 2.2 | 42.6 → 4.8 | 35.4 → 3.5 |
| alhambra-reyes-fret | 15.1 → 2.2 | 49.1 → 6.6 | 33.7 → 5.5 |
| alhambra-reyes-stars | 94.1 → 15.0 | 123.6 → 19.7 | 46.9 → 4.9 |
| alhambra-star-and-arrows-shifted | 19.8 → 2.3 | 39.7 → 5.1 | 23.9 → 2.4 |
| alhambra-star-and-arrows | 11.2 → 1.4 | 29.0 → 2.9 | 19.1 → 1.8 |
| bou-inania-rosette | 1108.0 → 263.2 | 1727.1 → 285.7 | 328.9 → 81.3 |
| bou-inania-twelve-fold-wall | 1232.6 → 298.8 | 1395.8 → 239.8 | 146.2 → 16.1 |
| eight-fold-star-and-cross | 4.5 → 0.6 | 2.4 → 0.4 | 3.0 → 0.5 |
| eight-fold-zellige | 25.6 → 2.5 | 25.6 → 3.0 | 14.8 → 3.3 |
| four-fold-ring-of-circles | 34.3 → 3.7 | 79.4 → 9.7 | 66.5 → 11.6 |
| ibn-tulun-window | 100.5 → 10.0 | 69.5 → 10.3 | 34.8 → 3.7 |
| kurt-eight-fold-zellige-shifted | 601.8 → 27.4 | 390.3 → 71.0 | 178.2 → 25.8 |
| kurt-eight-fold-zellige | 436.2 → 16.3 | 274.0 → 42.3 | 188.9 → 27.1 |
| mian-stellated-hex | 34.9 → 7.2 | 122.5 → 18.0 | 36.5 → 2.9 |
| mian-stellated-rosettes | 48.9 → 7.5 | 137.9 → 21.4 | 74.8 → 8.8 |
| minbar-doors-cairo | 17.8 → 2.8 | 50.7 → 6.9 | 30.6 → 3.1 |
| six-fold-hammerhead | 9.8 → 1.3 | 29.2 → 3.0 | 14.4 → 1.4 |
| six-fold-snowflake | 9.2 → 1.1 | 30.8 → 4.0 | 16.2 → 1.4 |
| six-fold-star-and-hexagons | 13.1 → 1.5 | 3.1 → 0.5 | 17.2 → 1.4 |
| sixteen-fold-rosette | 58.9 → 8.5 | 103.9 → 18.6 | 28.7 → 2.7 |
| ten-pointed-star-decagon-rect | 11.0 → 1.3 | 32.0 → 3.7 | 22.0 → 2.5 |
| twelve-fold-dodecagrams | 15.1 → 1.4 | 20.2 → 2.8 | 9.5 → 0.9 |
| twelve-fold-rosette-mian-hex | 25.7 → 4.0 | 88.7 → 10.6 | 31.7 → 2.6 |
| twelve-fold-rosette-mian | 39.0 → 5.2 | 95.1 → 14.0 | 41.0 → 2.9 |

## Construction crossings

Single calls with no warmup, run sequentially with the frozen reference and
optimized engine. This check is used by tests, not by the interactive pen.

| Tutorial | Before (ms) | After (ms) |
| --- | ---: | ---: |
| bou-inania-rosette | 26855.0 | 74.7 |
| bou-inania-twelve-fold-wall | 18813.7 | 40.5 |

The old merge scanned every retained point for every candidate. The new
merge checks nearby spatial bins and still keeps the first representative
in input order, using the same distance test. Small arrays and coordinates
outside the safe indexing range keep the original scan.

## Validation

- `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`: exit 0.
- Frozen pre-optimization implementations compare all 36 tutorials: bit ids
  and endpoints (within 1e-9), full patterns including panels, and unchanged
  golden output. Crossing coordinates and order compare exactly.
- Additional cases cover clipping boundaries, tangencies, overlap,
  irregular segment networks, hash collisions, and merging representatives.
- Isolated speed tests enforce both 300 ms inking budgets and the one-second
  crossing budget on both Bou Inania tutorials. They run with `pnpm test:perf`,
  not in `pnpm test`, because a busy machine would fail them at random.
- Production browser checks at 1280×800 complete every visible construction
  step, ink, repeat, fill the wall, enter coloring, and change a piece color.
  Both flows completed with no page errors. Rendered walls were inspected.

## Remaining app latency

The engine assignment is complete, but the full cold pen transition is
still several seconds. The browser checks measured click-to-enabled-pen:

| Tutorial | Visible steps | Cold Ink transition (ms) | Wall pieces |
| --- | ---: | ---: | ---: |
| bou-inania-rosette | 22 | 3358 | 878 |
| bou-inania-twelve-fold-wall | 18 | 4410 | 1033 |

A separate Node diagnostic followed the app's draw-for-me preparation and
measured the following additional work. These are diagnostic Node timings,
not a breakdown of the browser measurements above:

| Tutorial | Line-path map | Mirror lookup | Pen graph | Clone ready result |
| --- | ---: | ---: | ---: | ---: |
| bou-inania-rosette | 91 | 284 | 364 | 780 |
| bou-inania-twelve-fold-wall | 148 | 374 | 638 | 1450 |

The next app task is to reduce the worker result's size and repeated pen-data
representations, then profile the browser's receive/render work. Preserve
worker responsiveness, pen hit testing, symmetry, and saved selections.
Relevant app code: `along/inkWork.ts`, `along/pen.ts`, and `along/along.worker.ts`.
No app files were changed in this engine assignment.

## Try this branch

The running production preview is at <http://localhost:4291/>. Port 4290
serves the separate app worktree and does not include this engine branch.

1. Open `/#/bou-inania-rosette/draw` or `/#/bou-inania-twelve-fold-wall/draw`.
2. Use **Draw it for me** through the numbered steps, then select **Ink**.
3. Wait for **Ink it for me** to become available and click it.
4. Select **Repeat it**, **Fill the wall for me**, then **Color it**.
5. Choose a piece type and change its color. Confirm the matching wall
   pieces change together.

To rebuild and restart the preview if it has stopped:

```sh
cd /home/yahya/Documents/projects/Tastir-engine
pnpm build
pnpm exec vite preview --config apps/player/vite.config.mts --port 4291 --strictPort
```

To run the checks and reproduce the benchmarks from that directory:

```sh
pnpm test
pnpm lint
pnpm typecheck
node --conditions=@tastir/source --import tsx tools/bench-engine.mts --runs=7 --warmup=2
node --conditions=@tastir/source --import tsx tools/bench-engine.mts --reference --runs=7 --warmup=2
node --conditions=@tastir/source --import tsx tools/bench-engine.mts --crossings --runs=1 --warmup=0 bou-inania-rosette bou-inania-twelve-fold-wall
```

Add `--reference` to the last command for the old crossing timings; that
version intentionally takes tens of seconds. Run timing checks without
other local test/build jobs competing for the CPU.

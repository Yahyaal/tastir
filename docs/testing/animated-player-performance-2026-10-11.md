# Animated player performance: filled zellige wheel

This pass starts after the earlier polygon culling and animation restart fixes.
It targets the step-by-step player's animation frames, not draw-along worker
preparation. No tutorial geometry or coloring rules changed.

## What the previous work established

- `420f765` and `7022c2b`: spatial indexes, prepared geometry, and exact-output
  comparisons made engine operations faster without changing geometry.
- `3138258`: worker ownership and transferred arrays reduced draw-along message
  overhead. This does not address the step-by-step player's frame painting.
- `a6042e0`: shared SVG paths and stable construction content removed large DOM
  rebuilds. Reusing a path saves DOM work but still paints every visible instance.

A Chromium trace of ink, repeat, and coloring recorded about 6.2 seconds of
raster tasks versus 1.2 seconds of JavaScript function calls. These are summed
trace categories, not additive wall-clock durations; raster tasks can overlap.
The remaining cost was substantially in the browser's rendering pipeline.

## Changes

- Do not animate a camera that is already at its destination.
- Animate each repeated row together, rather than scheduling identical animations
  for each tile. Reuse one outline and one ink path, including the original tile.
- Give construction guides one inherited stroke-color animation instead of one
  animation per shape.
- Paint the temporary coloring cover once into per-type canvas buffers. Composite
  the active radial fade over these cached images; combine future types into one
  cached image. There is one animation clock and no geometry painting per frame.
  The underlying wall, picking, final zoom, and exports remain vector-based.
- Limit temporary bitmap dimensions and aggregate allocation, and release the
  buffers when the transition completes or is unmounted. Without canvas support,
  show the final SVG wall directly.

## Reproduce

Build with `pnpm exec nx run player:build`, then start:

```sh
pnpm exec vite preview --config apps/player/vite.config.mts --port 4392 --strictPort
```

In another terminal:

```sh
pnpm exec tsx tools/bench-player.mts http://localhost:4392 4
```

Run the benchmark alone, without builds or other tests competing for CPU. It
uses production assets, headless Chromium at 1280×800, motion enabled, and 4× CPU
throttling. It records requestAnimationFrame gaps and CDP task/script/layout/style
metrics while advancing through ink, repeat, color, and twenty wheel events.
The three stages each include their entry and a three-second observation;
Playwright actionability waits can change the total observation length.

One before/after run on this workstation (milliseconds):

| Stage | Before p95 frame gap | After p95 frame gap | Before max | After max |
| --- | ---: | ---: | ---: | ---: |
| Ink | 150 | 50 | 833 | 933 |
| Repeat | 133 | 33 | 417 | 83 |
| Color | 383 | 17 | 533 | 317 |
| Wall wheel zoom | 33 | 17 | 133 | 33 |

These are measurements, not timing assertions in the normal test suite. They
show much better steady animation, especially repeat and coloring. Ink entry
still has an expensive cold frame; this pass does not claim every frame meets
16.7 ms. Absolute timings vary with machine load and browser rendering backend.

## Regression coverage

`animated-player.spec.ts` runs with motion enabled on desktop, tablet, and phone.
It checks the shared guide fade, stable repeat animation clocks, canvas alignment,
initial cover opacity, partial radial reveal, and final buffer cleanup. A canvas
stroke counter verifies that advancing the fade does not repaint the geometry.

Unit coverage checks unchanged repeat positions, shared outlines, no camera
updates at an unchanged destination, transparent fallback without canvas, free
inking's altered stroke count, wall coverage, and existing animation behavior.

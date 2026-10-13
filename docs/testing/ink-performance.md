# Checking Ink when adding or changing a pattern

Use this check when adding a dense rosette, changing construction or optional helpers, or updating the worker, camera or board renderer. The target is a working pen within one second after pressing Ink. See the [13 October results](ink-speed-2.md) and [lessons](../patterns/LESSONS.md#dense-rosettes-and-ink-performance-13-october-2026) for the evidence behind these checks.

## Measure the production app

From the worktree root, build first, then run three desktop samples on an unused preview port:

```sh
pnpm nx run player:build && TASTIR_BROWSER_PORT=4492 pnpm exec playwright test apps/player/e2e/ink-speed.spec.ts --project=desktop --repeat-each=3
```

The existing test covers both Bou Inania tutorials and Kurt shifted. For a new dense tutorial, add its ID to that test's list and exercise the same flow. The test completes construction and presses Ink immediately after the final step is checked; do not add an artificial wait to let preparation finish.

**The test currently reports timings; it does not assert the one-second target.** Inspect every printed Ink-to-pen sample, report all three and their median, and record Ink it for me-to-Repeat separately. Its readiness proxy is the enabled Ink it for me button, so also test manual pen input. A green test alone does not establish the performance target. Keep the existing reference tutorials in coverage.

Avoid running other builds or test suites during measurement. Record the commit, browser, viewport and any CPU or memory contention. Use the same conditions for before and after; if they differ, say so. Use `pnpm bench:ink` to investigate engine preparation, but retain the browser measurement because the engine benchmark does not include painting.

## Check behavior and appearance

1. Complete construction, press Ink, put the pen down on a dot, draw to a connected dot, and lift it. Also use Ink it for me and continue to Repeat. Try a learner draft with an extra construction element to check that early preparation does not substitute the expected board for the actual one.
2. Navigate to another tutorial while preparation is unfinished. The new board must win, without old geometry or errors appearing later. Worker regression tests cover cancellation and stale replies; preserve them when changing this lifecycle.
3. Compare ready-to-ink and fully inked screenshots at matching viewport and zoom. Wait for camera updates and scheduled canvas painting to settle. Check zoom, resizing, colors and stroke opacity. Dense boards use canvas backgrounds; small boards still use SVG, so exercise both paths.
4. For geometry changes, compare all piece shapes and counts, the complete tile and the repeated wall with the approved version. Keep golden and draw-for-me coverage. If optimizing engine algorithms, add equivalence coverage against the old implementation rather than accepting changed expected geometry to make tests pass.

Run `pnpm test`, `pnpm lint` and `pnpm typecheck` before committing, and `pnpm check` before handing off the complete change. An unused `TASTIR_BROWSER_PORT` keeps browser checks separate from another worktree's preview; it does not isolate CPU or RAM. Existing speed measurements cover desktop only, so measure other devices separately before claiming their performance.

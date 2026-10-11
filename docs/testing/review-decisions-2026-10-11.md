# Owner review answers, 11 October 2026

Applied in the isolated `Tastir-jali` worktree on `codex/jali`. The owner’s answers below supersede earlier instructions to withhold the two eight-fold drawings. Approval for publication is recorded separately from historical verification.

1. **Jali looks good.** The owner suggested adjustable background/framework colors and finishes such as wood, gold, silver and stone. Recommended follow-up: keep style, material and color independent; first add the two color controls, then material presets. These controls are proposed in Tasks 2.1a–b, not implemented in this change.
2. **Keep the Safavid khatam drawing as unverified.** Copied the committed tutorial from `patterns/khatam`, preserving its geometry, expect block and Sandy Kurt source credits. It is playable and marked “Historical match unverified”. No mismatching Sikandra photograph is shipped with it. The owner wants community contributions to grow the library later.
3. **Ship star and octagon at intermediate level.** Copied the committed tutorial and its free attributed photo from `patterns/khatam`. Its construction and intermediate level are unchanged. The prior exact-match assertion was rejected in the 10 October team review; the tutorial, photo caption and review card now say that historical verification is pending. Publication approval does not turn the reference photograph into an exact match.
4. **Keep the unverified ten-fold rectangular study.** It remains playable with the same geometry and expect block, now with its historical status visible. The actual Darb-e Imam spandrel is a separate Upcoming target, already present as `darb-e-imam-decagram`. Corrected that entry using [Lu & Steinhardt (2007), Figure 3](https://peterlu.org/pdf/publications/2007/Science_315_1106_2007.pdf): the documented panel has two scales of girih linework. Removed the generic rectangular instructions and generated finished-wall image from that entry. Its blueprint is explicitly schematic; reconstruction remains under research.

All four questions were removed from the pending review list and their decisions recorded in the review cards, Progress, Project, Queue and Status. Jali’s approved screenshots remain in the star-and-cross review card.

The optional tutorial verification metadata is carried into the generated library catalog. The library card displays its unverified label, and the player provides an expandable explanation at every stage. Older tutorials without metadata still load normally; absence of metadata does not assert verification.

Try `http://localhost:4292/#/`, `#/eight-fold-khatam/result`, `#/eight-fold-star-and-octagon/result`, `#/ten-pointed-star-decagon-rect/result`, `#/upcoming` and `#/review`.

## Validation

Full `pnpm test`, `pnpm lint`, `pnpm typecheck` and `pnpm nx run player:build` pass with exit code 0. The first full run passed every functional case but the existing engine speed assertion measured 300.94 ms against its 300 ms limit; a quiet full rerun passed. The engine and timing threshold were not changed.

All 12 browser checks pass on desktop, tablet and phone with `pnpm exec playwright test apps/player/e2e/review-decisions.spec.ts`. These exercise production catalog labels, the three playable walls and their expandable explanations, and the corrected Upcoming target. The dev review page was checked separately: all four questions are closed. Screenshots are in `test-results/`.

A structural comparison against the original tutorial JSON confirms the only differences are verification metadata and the star-and-octagon photo caption. Geometry, expect blocks and palettes are identical. The full golden tests and draw-for-me tests now cover all 38 tutorials.

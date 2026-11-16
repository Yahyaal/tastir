# Learning path implementation — 16 November 2026

The owner approved building the proposed navigation after the explanation of how it differs from the existing library. This authorization supersedes the earlier proposal-only hold for navigation; it does not certify the outstanding photo evidence or newcomer checks.

Try [Start here on the home page](http://localhost:4200/#/) and [the full path](http://localhost:4200/#/learn). The map shows twelve numbered existing patterns in three chapters. Each gives a learning focus, practice cue, original difficulty and reference-photo availability. Pattern previews link to the real results; actions open the first paused watch step or draw-along board. Returning users still see their in-progress work first.

At a watch lesson’s final position, a recommendation opens the next lesson. After a draw-along board is kept at its final stage, the recommendation opens the next drawing. Both repeat/color orders work. The last lesson links back to the map without claiming completion. Suggestions exclude unavailable/hidden entries, preserve native unsaved-work guards, and never write completion state. Personal and shared designs do not receive course suggestions.

The public path shares its sequence and teaching cues with the owner’s evidence review. Status-log prose stays in the development review; private reference pictures are not imported into public navigation. No tutorial geometry, original ratings, palettes or stored designs were rewritten.

## Validation

- Root lint, strict type checks and production builds passed across the workspace (Nx serial).
- Studio preflight: 13 passed. All workspace test targets passed: seven projects passed in the root run, then the full player suite passed separately with **104 files / 3,140 tests**. One Vitest worker and bounded Node heaps were used. The root command was interrupted during its player run, so that incomplete run is not counted as a pass; the independent rerun exited 0.
- Focused unit checks: 15 passed, including availability, order, watch/draw links, rating preservation, photo limitations and review-page regressions.
- Final production browser checks: **81 passed, one configured phone skip** across path navigation, browsing, library accessibility/entry points, numbered watch navigation, settings sharing and saved-work usability. All fourteen new path cases passed, including both draw-along finishing orders and the unsaved-work guard.
- Development evidence-review browser checks: **six passed** across desktop/phone and light/dark. Source filters, image loading and rationale links remain functional.
- Visually inspected the home card and path at 390px light and 1280px dark; numbered previews load and the layouts fit. Screenshots are local `/tmp/tastir-learn-{home,path}-{phone,desktop-dark}.png`.
- The long-running owner dev server briefly served an empty newly written module during HMR. Touching the new modules refreshed it; a fresh browser then rendered both routes successfully. The production build and browser checks were unaffected.

No account was signed in or cloud project changed. This implementation is local and has not been pushed, merged or deployed.

## Next

Prioritize a matching free photo for each opening lesson, read the instructions aloud and try the sequence with a newcomer. Only three recorded matching public examples exist across this path; nine photo gates remain open, including one historical-reference-only image. Navigation approval does not close those gates. Physical-phone gesture acceptance and controlled signed-in Studio acceptance remain separate tasks.

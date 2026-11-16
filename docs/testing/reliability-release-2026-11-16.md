# Reliability release: 16 November 2026

The owner explicitly requested push, merge and deployment, then starting the next task. Seven repair commits were pushed and merged through [PR #17](https://github.com/Yahyaal/tastir/pull/17). Expected head `e95c730c3f03707a721697eab998c5abdf322e5c` was supplied to the merge. Merge commit: `bb6f8c1d542caa9b2e26bfee4d35afb5623db825`. No newer main changes needed conflict resolution.

Vercel reported success for the branch preview and for the merged production commit. A fresh phone-sized Chromium session then tested https://tastir-studio.vercel.app/ against the deployed assets, rather than relying on the deployment status alone:

- Direct collection entry and Arabic `نجمة فاس` returned the expected 18 cards.
- `#/eight-fold-star-and-cross/watch/3` opened paused at position 3; Next and browser Back restored positions 4 and 3.
- The real editable download parsed as version 2.
- The first draw-along hint used A.
- Signed-out Your work → Studio made one `/api/me` and zero `/api/projects` requests, including a 6.5-second observation after navigation. No account sign-in or server-side user data writes occurred.

Full release validation remains the prior root lint/typecheck/all-13-test-task run, public/hosted builds and 251 desktop/phone browser cases with 11 configured platform skips. The release head was unchanged between that verification and publication. Private review assets were excluded from the production bundle.

Local main was fast-forwarded before switching to it, with identical tracked content, so the owner's running server never saw an old schema. The new `feat/beginner-path-proposal-2026-11-16` branch starts from the merge. The owner's server on 4200 stayed running; the pre-existing `.claude/` and `tools/_shot.mjs` files were untouched. Live smoke log: `/tmp/tastir-release17-live.log`.

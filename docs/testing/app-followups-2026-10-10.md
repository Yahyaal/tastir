# App follow-ups, 10 October 2026

Worktree: `../Tastir-learning-reliability`, branch `codex/learning-reliability`. The owner authorized completing the following tasks in sequence, then addressing further confirmed app problems. If a usage limit interrupts the work, resume unfinished tasks when the session can run again; no new permission is needed.

## Task 1: returning to a saved drawing

The old floating “Welcome back” notice covered step chips at 1024×768. The returning-session message and its Continue/Start again actions now use the existing instruction and navigation slots. Start again still asks for confirmation; Keep my board cancels without changing saved work. The normal navigation retains its space while hidden, so the boards stay still.

Browser checks at 1280×800, 1024×768, and 390×844 confirmed no overlap with step chips and identical board boxes before reload, during the welcome message, during restart confirmation, after cancelling, and after continuing. The tablet screenshot was inspected. The production browser regression also checks board positions and that the return action stays inside the instruction row. The functional test checks cancelling a restart preserves the current step, completed steps, and the learner's extra circle.

`pnpm test`, `pnpm lint`, and `pnpm typecheck`: exit code 0. The production browser run passed 53 journeys and skipped six non-desktop performance checks; its one phone failure was the new reload assertion comparing the scroll offset of a hidden, zero-sized reference panel. The assertion now compares visible boards. The reload journey was rerun on all three projects: three passed, exit code 0. Other browser assertions and timing budgets are unchanged.

## Task 2: missing original photos

Failed public or private photo URLs now show a placeholder and source link in Result and original. Their broken images and full-size launch buttons are removed. Other gallery photos continue working; revisiting a failed photo keeps its fallback. A shortened gallery correctly selects its first photo. If a photo fails in the full-size viewer, the viewer stays open with a source link and Close button, and leaves actual-size mode.

Added functional coverage for public/private failures, viewer failures, gallery switching, and shortened galleries. Native browser HTTP 404 checks exercised viewer failures at 1280, 1024, and 390 px widths (using a cache-busting query on the viewer image to force a new request); its source and Close worked at every size. The phone fallback screenshot was inspected. A production regression blocks the initial photo request: all three viewport projects passed, exit code 0.

`pnpm test`, `pnpm lint`, `pnpm typecheck`, and the production build: exit code 0.

## Task 3: saving failures without covered controls

Reproduced the storage-failure notice covering Ink/Repeat/Color at 1024×768. The warning now uses the reserved feedback slot; obsolete floating-notice styles were removed. It explains the board cannot be saved and asks the learner to keep the page open. Drawing remains available, and ordinary feedback returns after a successful save.

The functional test blocks storage writes, draws a step, restores writing, and verifies completed work survives. Production browser tests block writes and verify warning placement, drawing, recovery and unchanged visible board boxes at all three sizes. The reload regression was also rerun. Six browser cases passed, exit code 0. Full tests, lint, type checks and production build each exited 0.

## Next

Task 4 is confirmed and pending: the full-size photo viewer leaves focus on its launch button; Tab reaches the underlying Source link. Fix focus entry, keyboard containment, Escape, focus return, and background scrolling.

Engine and tutorial work remain assigned elsewhere.

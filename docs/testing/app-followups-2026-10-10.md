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

## Task 4: full-size photo keyboard access

The viewer previously left focus on its launch button, and Tab reached Source on the underlying page. It now focuses Close, contains Tab and Shift+Tab, blocks the player's shortcuts behind the viewer, and prevents background page scrolling. Escape closes the viewer and restores focus and scrolling. If a photo fails and removes its launch button, focus returns to its fallback source link. If the focused zoom button disappears on failure, focus moves to Close.

Functional tests cover focus entry, tab wrapping, Escape, scroll restoration, and photo-failure focus recovery. A native browser check confirmed ArrowLeft leaves the viewer open. Production viewer-keyboard and missing-photo regressions passed at all three sizes: six cases, exit code 0. Full tests, lint, type checks and production build each exited 0.

## Task 5: keyboard shortcuts respect focused controls

Confirmed ArrowLeft on Style changed Color to an earlier stage. Step shortcuts now ignore interactive controls, editable text and dialogs, modified browser shortcuts, and events already handled elsewhere. Ordinary page shortcuts still work. Native Space activation of Next advances exactly one step.

Functional tests cover control keys and ignored modifiers/handled events while retaining ordinary arrows. Production shortcut and viewer-keyboard regressions passed on all three viewport projects: six cases, exit code 0. Full tests, lint, type checks and production build each exited 0. Type checking initially caught a test-query option from the wrong library; the option was removed and the recheck passed.

## Next

Task 6 is confirmed and pending: the Upcoming inspection viewer leaves focus outside on entry and after Tab. Give it the same focus containment, restoration, and background scroll protection as the original-photo viewer.

Engine and tutorial work remain assigned elsewhere.

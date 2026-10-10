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

## Task 6: Upcoming inspection keyboard access

The Upcoming inspection viewer was confirmed to leave focus outside on entry and after Tab. Both photo viewers now use a shared focus handler with containment, restoration, and background scroll protection. Upcoming tests cover opening from the blueprint, wrapping Tab, Escape focus return, and removal of a focused zoom control after a photo fails. The first full browser run passed 66 cases and failed all three new Upcoming keyboard-entry cases: Enter opened the viewer and then default activation closed it after focus moved to Close. Card Enter/Space handlers now prevent that default action. Native browser checks confirmed both activation keys keep the viewer open.

After the correction, full tests, lint and type checks each exited 0. The complete production browser suite passed 69 cases and skipped six intentionally desktop-only performance cases, exit code 0. Timing budgets were unchanged.

## Task 7: home navigation on narrow phones

The home navigation overflowed at 320 px (document scroll width 334 px), clipping Upcoming patterns. Its links now wrap within the header on phones; document scroll width is now 320 px. Before/after screenshots were inspected. A production regression checks a fresh library and the extra My designs link after actually saving a wall. Full tests, lint, type checks and production build each exited 0. The narrow-navigation and square-preview browser checks passed in all three projects: six passed, exit code 0.

## Task 8: unsaved-changes confirmation keyboard access

The unsaved-changes confirmation focused Stay initially, but Tab escaped to the page and Escape did nothing in a native browser. It now uses the shared modal focus handler, with Escape cancelling the departure and preserving edits. Functional and browser tests check tab wrapping, background shortcut blocking, focus/scroll restoration, preserved palette changes, and the explicit Leave action. Full tests, lint, type checks and production build each exited 0. All three dialog regressions passed in all three viewport projects: nine passed, exit code 0.

## Task 9: complete Upcoming titles on phones

A native browser confirmed Upcoming card headers clipped 23 of 24 Arabic titles at 320 px and nine at 390 px. The metadata row and title now wrap, keeping the Arabic title aligned to the right. The same browser audit found zero clipped titles at both widths after the fix; the header screenshot was inspected. A production regression measures every title inside its header at the project's normal width and at 320 px. Full tests, lint, type checks and production build each exited 0. The complete production browser suite passed 78 cases and skipped six intentionally desktop-only performance cases, exit code 0. No assertions or timing budgets were weakened.

The final desktop performance checks measured slowest stages of 423 ms (Bou Inania rosette), 358 ms (Kurt zellige), and 262 ms (shifted Kurt). First ink preparation on Bou Inania still waited 5,486 ms; that remains the separate engine task.

## Try the changes

The dev server for this worktree is `http://localhost:4290/#/`. Refresh it to load the current branch. If the server is stopped, run `pnpm exec vite --config apps/player/vite.config.mts --port 4290 --strictPort` from `/home/yahya/Documents/projects/Tastir-learning-reliability`.

1. On the home page, check square thumbnails and shrink the browser to 320 px: Library and Upcoming patterns should remain fully visible.
2. Open Upcoming patterns on a phone width: Arabic titles should remain complete. Choose Blueprint on a card, focus its preview and press Enter or Space. Tab and Shift+Tab should stay inside inspection; Escape should return to the card.
3. Open Result and original on a tutorial with a photo. Open its full-size photo, try Tab and Escape, and check focus returns to the opener.
4. Save a design, change its palette and choose All patterns. Tab should stay inside the unsaved-changes confirmation; Escape should retain the palette change and return to All patterns. Leave without saving should still return home.
5. Draw a step in Draw along, reload, and try Continue and Start again/Keep my board. The message should leave the step chips visible and the board should stay in position.

## Resume checkpoint

Tasks 1–9 are complete. On a later continuation, check for new Claude feedback in `docs/prompts/` and on the branch before starting further app fixes. Work only in this worktree and keep GitHub Actions disabled; its repository setting was verified `false` during this batch.

Engine and tutorial work remain assigned elsewhere.

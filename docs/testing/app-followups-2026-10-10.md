# App follow-ups, 10 October 2026

Worktree: `../Tastir-learning-reliability`, branch `codex/learning-reliability`. The owner authorized completing the following tasks in sequence, then addressing further confirmed app problems. If a usage limit interrupts the work, resume unfinished tasks when the session can run again; no new permission is needed.

## Task 1: returning to a saved drawing

The old floating “Welcome back” notice covered step chips at 1024×768. The returning-session message and its Continue/Start again actions now use the existing instruction and navigation slots. Start again still asks for confirmation; Keep my board cancels without changing saved work. The normal navigation retains its space while hidden, so the boards stay still.

Browser checks at 1280×800, 1024×768, and 390×844 confirmed no overlap with step chips and identical board boxes before reload, during the welcome message, during restart confirmation, after cancelling, and after continuing. The tablet screenshot was inspected. The production browser regression also checks board positions and that the return action stays inside the instruction row. The functional test checks cancelling a restart preserves the current step, completed steps, and the learner's extra circle.

`pnpm test`, `pnpm lint`, and `pnpm typecheck`: exit code 0. The production browser run passed 53 journeys and skipped six non-desktop performance checks; its one phone failure was the new reload assertion comparing the scroll offset of a hidden, zero-sized reference panel. The assertion now compares visible boards. The reload journey was rerun on all three projects: three passed, exit code 0. Other browser assertions and timing budgets are unchanged.

## Next

Task 2: handle missing photos in the regular player's Result and original view and its full-size viewer. Keep source links and working gallery photos available.

Further candidate: the storage-failure notice still floats over controls; reproduce it before changing it. Engine and tutorial work remain assigned elsewhere.

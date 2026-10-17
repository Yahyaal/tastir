# M0 first half — Codex and wall-panel integration

The owner authorized merging `origin/main` and `codex/assistant-chat-and-tools` into local `main`, with a push held for explicit approval. This report records that integration; the earlier [handoff](../AI-M0-HANDOFF.md) records pre-merge branch checks. The hosted PRD on `claude/studio` remains the authoritative delivery plan.

## Inputs and resolution

Local `main` was fast-forwarded from `46e2f5c` to fetched `origin/main` at `d25c674b1a6b8de0d6f98a052774de3200518d06`, including PR #13 and the two wall-panel commits. The assistant branch at `5266f48` was then merged with both histories retained.

- `ColourPanel.tsx`: keep the wall-panel branch’s palette-first layout and the assistant’s square-band status/removal controls, ordinary coloring and shared Undo/Redo.
- `review/data.ts`: retain the wall-panel entry and all assistant entries, using the newer update date.
- `Player.tsx` merged automatically, preserving the wall-style previews/controls and assistant coloring registration.
- No manual edits to `app.tsx`, `Editor.tsx` or `Notes.tsx`; their merged contents exactly match the assistant branch. No Studio files were added or edited, and the `Tastir-studio` checkout was left alone. Claude will merge its branch and resolve those three files afterward.

## Checks

Checks ran serially in `/tmp/tastir-m0-main`, with one worker, `NX_DAEMON=false`, `NX_ISOLATE_PLUGINS=false`, and Node heap limits of 1024 MiB for workspace checks and 768 MiB for browser checks. Before each command, a guard acquired `/tmp/tastir-heavy-checks.lock` and waited for active Vitest/Playwright processes to exit. The owner's running checkout/dev server was not switched or stopped.

| Command | Result |
| --- | --- |
| `pnpm test --maxWorkers=1` | Passed; 5 projects plus 3 dependency tasks, with 7/8 Nx cache hits. |
| `pnpm lint --parallel=1` | Passed; rechecked after the test setup correction. |
| `pnpm typecheck --parallel=1` | Passed; rechecked after the test setup correction. |
| `pnpm test:browser --workers=1` | Passed; 151 passed, 17 configured skips, including the production build. |
| `pnpm test:agent:browser --workers=1` | Passed; complete rerun, 126 passed. |

The first assistant run had 125 passes and one desktop pointing failure. Its receipt correctly rejected a changed view. The test conditionally clicked Pause using an immediate DOM count, which could miss the player mounting and leave playback running during capture. The test now waits for Pause, clicks it and waits for Play before sending the view. The complete rerun passed on desktop, tablet and phone. No application behavior, timeout or stale-view protection was weakened. The unit and production suites passed before this test-only correction; lint/typecheck were rechecked afterward.

Logs: `/tmp/tastir-m0-main-test.log`, `/tmp/tastir-m0-main-lint.log`, `/tmp/tastir-m0-main-typecheck.log`, `/tmp/tastir-m0-main-browser.log`, `/tmp/tastir-m0-main-agent-browser.log`, `/tmp/tastir-m0-main-agent-rerun.log`, `/tmp/tastir-m0-final-lint.log`, `/tmp/tastir-m0-final-typecheck.log`. The initial failure artifacts are preserved in `/tmp/tastir-m0-main-agent-initial-results/`.

## Handoff

Local main contains the first half of M0. Nothing was pushed or deployed; push requires the owner's explicit OK. Claude’s Studio merge and its combined regressions remain separate work. The app and test tree was validated before committing; this report only adds Markdown.

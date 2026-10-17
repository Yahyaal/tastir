# Codex side of M0 — merge handoff

Prepared 16 October 2026. This records branch ancestry and validation evidence; it is not another task plan. [STUDIO-HOSTED-PRD.md](STUDIO-HOSTED-PRD.md), arriving from `claude/studio`, owns the delivery order and checklist. [AI-STUDIO-INTEGRATION-REVIEW.md](AI-STUDIO-INTEGRATION-REVIEW.md) is background only.

## Branches and merge order

1. Merge **`codex/assistant-chat-and-tools`** into current `main`. It contains all the AI milestone branches below; no separate merges or cherry-picks are needed.
2. Integrate **`claude/studio`** according to the authoritative PRD. Claude owns that branch and its M1 work. This handoff does not claim its checks or the combined merge have passed.

The cumulative Codex branch contains these milestones in order:

| Order | Contained branch | Milestone commit |
| --- | --- | --- |
| 1 | `codex/ai-agent-plan-2026-10-15` | `5f7ba11` |
| 2 | `codex/ai-agent-phase-0` | `85923d8` |
| 3 | `codex/ai-agent-drawing` | `464bbbe` |
| 4 | `codex/ai-agent-construction` | `9ca4689` |
| 5 | `codex/ai-agent-repeat-color` | `32bd1d6` |
| 6 | `codex/ai-agent-navigation` | `15477da` |
| 7 | `codex/ai-agent-undo` | `0d5ef66` |
| 8 | `codex/ai-agent-history-context` | `c6f080a` |
| 9 | `codex/ai-agent-screen-pointing` | `01d369d` |
| 10 | `codex/ai-agent-square-colors` | `48db133` |
| 11 | `codex/assistant-chat-and-tools` | `a053d67`, `db11d33`, `668e029` |

`codex/jali` (`94d0071`), `codex/learning-reliability` (`2831414`) and `codex/pattern-preview-autoplay` (`3842191`) are already ancestors of `origin/main`; they need no additional merge.

## Completed preparation

- The chat, normal drawing tools and companion/error improvements are committed in `a053d67` and `db11d33`.
- `668e029` commits the integration review and finishes the Notes change. The review explicitly withdraws its delivery order in favor of the hosted PRD.
- The untracked `docs/STUDIO-PLAN.md` and duplicate “Studio plan” Notes tab were removed. The separate “AI agent review” link remains.
- No changes were made to `apps/studio/`, `apps/player/src/studio/` or the `Tastir-studio` folder.

## Validation

The cumulative branch is checked at **`668e029d24bc1b999ea5e19f8e6af36ae4b76165`**, in detached worktree `/tmp/tastir-m0-validation`. Historical branch heads are listed for ancestry; they are not separate merge candidates and were not individually rechecked.

Fetched `origin/main` is **`d25c674b1a6b8de0d6f98a052774de3200518d06`**. These results cover the Codex branch before integration with its newer main commits or Studio. M0 still needs regression checks on the resulting combined tree; no merge, push or deployment was performed here.

Checks run sequentially with `NX_DAEMON=false`, `NX_ISOLATE_PLUGINS=false`, bounded Node heaps and one worker. Before each phase a guard acquires `/tmp/tastir-heavy-checks.lock`, scans for active Vitest/Playwright processes and waits until they are absent. The owner’s running checkout and dev servers are not used for validation.

| Check | Command | Result |
| --- | --- | --- |
| Workspace tests | `pnpm test --maxWorkers=1` | Passed; 8 successful Nx tasks (7 cache hits). |
| Lint | `pnpm lint --parallel=1` | Passed; 5 successful Nx tasks (4 cache hits). |
| Typecheck | `pnpm typecheck --parallel=1` | Passed; 9 successful Nx tasks (8 cache hits). |
| Production browser tests and build | `pnpm test:browser --workers=1` | Passed; 151 passed, 17 skipped. |
| Extra assistant browser suite | `pnpm test:agent:browser --workers=1` | 125 passed; one tablet square-band reply assertion timed out after 5 seconds. |
| Isolated assistant recheck | `pnpm test:agent:browser square-colors.spec.ts --project=tablet --grep 'colors normal square bands' --repeat-each=2 --workers=1` | Both repetitions passed without code changes (21.3 s and 19.6 s for the complete flows). |

Node heap limits were 1024 MiB for workspace checks and 768 MiB for browser checks. Browser ports were 4492 (production) and 4494 (assistant).

The four required checks passed. The extra suite was not fully green on its first run: the square-band edit had applied, but the reply was still pending when its five-second assertion expired. Both isolated repetitions subsequently passed, including Undo/Redo, saving and reloading. This is recorded as an intermittent test timeout, not a product fix or an unqualified full-suite pass. No timeout was increased and no test was skipped to hide it. The guard also waited for other active test runs before the extra suite and its recheck.

A scan of the production JavaScript bundles found none of the checked assistant-only markers (`data-screen-pointer`, `highlight_target`, `color_square_bands`, `apply_steps`, `create_pattern`, `X-Tastir-Bridge`, `Open drawing assistant`, `tastir-assistant`, `AI-AGENT-REVIEW`, `agent-usage-link`). The local app at `http://127.0.0.1:4291/` remained available.

This handoff is a documentation-only addition after the tested commit; it does not change the validated application or test files.

Temporary evidence logs are `/tmp/tastir-m0-test.log`, `/tmp/tastir-m0-lint.log`, `/tmp/tastir-m0-typecheck.log`, `/tmp/tastir-m0-browser.log`, `/tmp/tastir-m0-agent-browser.log` and `/tmp/tastir-m0-agent-recheck.log`. The initial assistant failure artifacts are preserved in `/tmp/tastir-m0-agent-initial-results/`.

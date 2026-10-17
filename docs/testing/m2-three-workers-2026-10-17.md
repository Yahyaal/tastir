# M2 — one project, three workers

Built on merged `origin/main` at `6c18979` in isolated branch `codex/m2-three-workers`, worktree `/tmp/tastir-m2`. The hosted PRD remains the only delivery checklist; package extraction is M3.

## Behavior and proof

`pnpm studio:agent` enables the existing local companion inside the existing Studio launcher. The editor, chat assistant and MCP agent share one Studio project. Normal Studio and stdio/HTTP MCP launch modes remain available. No files in `apps/studio/` or the owner's `Tastir-studio` checkout were edited.

The assistant delegates shared edits to Studio, uses its revision and authored history, and acknowledges only after saving and loading the committed drawing. Commands use a deterministic digest of request/call IDs. Local normal editor operations retain their existing history/autosave. The model receives shared-project guidance. Stop is checked before sending the shared edit; an already sent or committed save is not rolled back by stopping inference.

The owner has an explicit Undo mine control, while ordinary Undo/Redo and shortcuts continue to travel through the whole shared history. The assistant's own Undo and MCP's only_mine use server ownership. Local companion author `tastir-assistant` is distinct from owner and external-client names; hosted authenticated connection identities remain H3.

The new browser suite uses **real editor controls, real Studio persistence and real MCP Streamable HTTP requests, with simulated model replies**. It is automated integration evidence, not a live ChatGPT-provider evaluation or an owner visual signoff.

- MCP creates a project and circle. The assistant adds an axis through its normal tool loop. The owner draws another circle with the actual compass by clicking A and O. All three edits appear in one project with their respective authors.
- A stale two-element MCP batch is refused with no project change. Each author's Undo mine stops at another actor. Ordinary Undo still intentionally reverses the latest shared edit.
- A separate fixture constructs a square from O and A, inks, tiles and paints it entirely through MCP. The assistant saves a separate named copy. Reload, tutorial export and normal playback retain the chosen paint without changing the source.
- The server PNG and actual browser-wall screenshot both contain the chosen paint; visual inspection confirms the same square lattice. They are labelled separately because camera, framing and border thickness differ.
- An owner rename during a held assistant save remains recoverable as a new project while the accepted assistant geometry remains in the shared source. This extends M1 recovery to the new assistant save path.

The six focused checks passed on desktop and phone. Captures are on the dev review page under “M2: the editor, assistant and MCP share one project”, linked to `/__review/renders/m2-three-workers/proof.html`. They are generated local review assets under `docs/review/m2-three-workers/`; rerunning the suite produces fresh artifacts in `test-results/shared-project/`.

## Regression results

| Check | Result |
| --- | --- |
| `pnpm test --maxWorkers=1` | Passed; all 10 Nx tasks, including player, Studio, companion, engine, schema and protocol tests. |
| `pnpm lint --parallel=1` | Passed; all 6 projects. |
| `pnpm typecheck --parallel=1` | Passed; all 12 Nx tasks. |
| `pnpm test:browser --workers=1` | Passed; 151 passed, 17 configured skips, including the production build. |
| `pnpm test:agent:browser --workers=1` | Passed; 126 passed. |
| `pnpm test:studio:browser --workers=1` | Passed; 14 passed. |
| `pnpm test:shared:browser --workers=1` | Passed; 6 passed. |

The production JavaScript marker audit found none of the checked companion/Studio-only markers. The documentation completion status was updated after the checks; no application or test code changed afterward.

Every heavy command runs through `/tmp/tastir-m0-guard.py`, acquiring `/tmp/tastir-heavy-checks.lock` and waiting for active Vitest/Playwright processes before starting. Checks run one at a time, with one worker and bounded Node heaps: 1024 MiB for workspace checks, 768 MiB for browser suites. Browser ports are isolated from the owner's running apps. Logs are `/tmp/tastir-m2-*.log`.

## Scope

Play and named saves intentionally create normal browser copies; edits on those copies do not write back to Studio. Shared editing happens on the Studio editor route. This task does not claim whole-tab capture, shared editing-package extraction, hosted sign-in, remote deployment, cross-provider account compatibility or live model-quality evaluations. The setup guide records the launch modes and copy behavior.

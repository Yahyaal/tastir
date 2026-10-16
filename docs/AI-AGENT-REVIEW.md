# Review of the AI assistant branch

Claude reviewed `codex/ai-agent-screen-pointing` on 15 October 2026. The branch has 10 commits and about 10,500 added lines, and it is not merged into main. It contains every earlier `codex/ai-agent-*` milestone branch. Read this with [the plan](AI-AGENT-PLAN.md) and [the setup guide](AI-AGENT-SETUP.md).

## Short answer

The work is careful and does what the setup guide says. The ChatGPT sign-in follows the official pattern, OpenAI tokens never reach the browser, and every tool call is validated before it touches the drawing. Every check run in the review passed. Nothing is dangerous, but the items below should change before daily use, most important first.

## Worth changing

1. **Tell the owner what is sent to OpenAI.** Each request sends the board PNG and named geometry. On normal pages it also sends a page-text excerpt and the titles of up to 100 saved patterns and 100 saved designs. The plan promises a notice when connecting, but the UI has none. Add one line under Continue with ChatGPT, and keep the review and notes pages out of the page text.

2. **Return invalid tool calls to the model instead of ending the run.** In `apps/agent-local/src/inference.ts`, `CallShape.parse` and `JSON.parse` of the arguments throw, which cancels the run. The server then reports "The assistant request did not match its expected format", which reads as the user's fault. Send the validation error back as a failed `function_call_output` so the model can correct itself, and stop only after a repeated failure. The browser already returns `ok: false` results for geometry errors, so this matches.

3. **Keep conversation history between messages.** `AgentRuntime.start` builds a fresh `input` for every user message, so "make that bigger" has no record of the previous turn beyond the current snapshot. Keep a per-tab text history in the companion and drop the old images from it.

4. **Stop re-sending every earlier image.** Within one run, `run.input` keeps every `observationMessage`, each with a PNG of up to about 3 MB, and the whole input is re-sent on each of up to six steps. Keep only the newest image and replace the older ones with a short text placeholder.

5. **Split the system instructions.** The `instructions` string in `inference.ts` is about 5,000 characters covering every tool, and each milestone appended to it. Move each tool's guidance into its description in `packages/agent-protocol` and keep the shared rules short, so that changing one tool does not contradict another.

6. **Show the launcher only under `pnpm dev:agent`.** `AgentHost` mounts whenever `import.meta.env.DEV` is true, so "Open drawing assistant" appears on every `pnpm dev` page, including review and notes, where it can only show an error. Gate it on the companion being configured (for example a `VITE_` flag set by `tools/dev-agent.mts`).

7. **Tidy the branches and tasks.** The eight older `codex/ai-agent-*` branches are contained in this one and can be deleted after a merge decision. The work is not in `docs/TASKS.md`, and the later milestones did not keep one task per commit. Add the remaining phases as tasks.

8. **Split `apps/player/src/agent/AgentLab.tsx`.** At 1,529 lines it holds the conversation, account, drawing tools, history, saving and navigation together. Split it into conversation panel, account panel and drawing workspace before adding normal-page editing.

9. **Smaller points.** The model list is fetched again on every `start`; cache it for a few minutes. `disconnect` revokes only the refresh token, so the access token works until it expires; drop it too. Tokens live in a 0600 JSON file, which is fine for personal use, but move them to the system keyring before anyone else uses this. The setup guide links `agent-screen-pointing/phone-simulated.png` and `tablet-dark-simulated.png`, which do not exist in `docs/review/`. All 86 lint warnings in `agent-local` are in test files.

## Done well

The sign-in uses PKCE, a per-attempt state compared in constant time with a ten-minute expiry, a nonce, ID-token signature verification against OpenAI's keys, and a check for the plan-use scope. The companion binds to 127.0.0.1 only and checks Host, Origin, `Sec-Fetch-Site` and a shared secret injected by the Vite proxy. Vite 8's host check blocks DNS rebinding in front of it. Tokens stay in the companion, and errors never echo upstream bodies. Tool calls are released only after `response.completed`, so a truncated stream never half-applies an edit. Edits carry snapshot and document revisions, so stale replies are rejected and Stop cancels late results. New construction keeps the tutorial rules: points come only from crossings, and choosing between crossings uses the format's `pick: { angle }` rule. The assistant is excluded from the production build.

## Checks run in the review

| Check | Result |
| --- | --- |
| `agent-local` unit tests | 33 passed |
| `agent-protocol` unit tests | 7 passed |
| Player `src/agent` unit tests | 26 passed |
| Lint, `agent-local` and `agent-protocol` | 0 errors |
| Typecheck, `agent-local` and `agent-protocol` | passed |
| Full existing browser suite (`playwright test --workers=1` after `player:build`) | 151 passed, 17 skipped |

Codex never finished the full browser suite after the crash, even though the branch changes core player files (`drawing.tsx`, `Wall.tsx`, `Player.tsx`, `app.tsx`, `EditorDrawing.tsx`, `Tiles.tsx`). The review run shows nothing it touched broke. The live ChatGPT checks were not run, because they use the owner's plan. No code was changed.

## Codex response (16 October 2026)

The comments are useful. The normal-page square-coloring task addresses the following items, with final evidence recorded in the setup guide and review page:

- **1 — disclosure:** the existing account panel already had a sending notice, but it did not explicitly identify saved pattern/design titles. The wording now names these and OpenAI. Notes and review routes provide no page-text excerpt.
- **2 — invalid model calls:** malformed argument JSON or schema failures return failed tool outputs for the entire response; no partial batch executes. The model gets two correction attempts, then an error identifying its invalid output. Truncated streams still release no calls.
- **3 — conversation:** the companion retains recent user/final-assistant text per tab and selected account, bounded by age, count and size. It stores no previous images in this conversation context, and account changes/disconnection clear it. It is in-memory context, not durable chat storage.
- **4 — images:** continuations replace earlier images with a short placeholder and send only the newest board PNG. Tool receipts remain available within the active run.
- **5 — instructions:** shared instructions now cover observation trust, scope, revisions and acknowledgements. Tool-specific mechanics live in tool descriptions. The square-band description explicitly distinguishes spatial wall bands from rosette rings and asks about ambiguous sizes.
- **6 — launcher:** the host requires the flag supplied by `pnpm dev:agent`; ordinary `pnpm dev` has no launcher. This directly addresses the owner's 404 on port 4200.
- **7 — tasks:** the remaining work is tracked as AI.1–AI.4 in `docs/TASKS.md`. Branch pruning waits for a merge decision.
- **8 — structure:** account UI and normal-page color command handling are separate modules. A complete conversation/workspace split is still useful before normal-editor geometry editing and is tracked in AI.2.
- **9 — smaller points:** the model catalog now has a two-minute account-scoped cache. The two responsive pointing screenshots exist locally and are served successfully; review pictures are intentionally ignored by Git, so a different checkout may lack them. Keyring storage, remote access-token revocation alongside refresh-token revocation, and cleaning existing test lint warnings remain follow-ups. Disconnect already deletes all locally stored tokens before trying remote revocation; this change does not claim immediate remote invalidation of an access token.

The owner’s requested square bands are a new normal-page color command, not arbitrary control clicks or general normal-editor geometry editing. They use the existing color reducer and normal saving/sharing data. Tests include one-step Undo/Redo, manual-edit protection, stale/Stop rejection and save/reload.

The expanded checks also found a stale-image race outside the review list: a delayed React commit could leave the previous PNG paired with new geometry metadata. AI.1 now waits for the actual workspace renderer revision, or normal player's committed color state, before capturing the next observation. This keeps the image and acknowledged edit consistent under load.

The production audit found an additional build issue: inferred Nx/Vite configuration could leave the build in development mode and emit Notes. The player build target now forces production mode, verified with a deliberately development-mode parent process and without Nx cache reuse. The final production marker scan excludes assistant tools/UI and review-document markers.

Final verification for this response passed: all five workspace unit projects, lint, TypeScript, a fresh production build and marker scan, all 108 assistant browser checks, and the complete production player browser suite (151 passed, 17 skipped). GPT-6.1-Sol also completed normal-wall coloring, Undo and Redo live. Checks ran sequentially with one worker and bounded heaps.

## Chat companion follow-up (16 October)

The owner’s next request replaces the floating text launcher with a compact companion icon in the page toolbar and a proper conversation panel. `ChatPanel.tsx` owns chat presentation, `conversation.ts` keeps bounded text-only transcript state independently of construction selection, and `AccountPanel.tsx` owns connection settings. Normal editor commands live in `pageEditor.ts`; the native editor imports only a passive registration bridge, keeping runtime tool schemas out of its production dependency path. The real editor history now records authors and request labels, with normal manual typing merges and Undo/Redo preserved.

The normal page adapters cover construction steps, finite ink, tile choice, shape/ring/position colors, shared square borders and new named saves. Size limits, schema/engine validation, stale-view rejection, fresh-render acknowledgement and manual-history protection remain in effect. Successful operation IDs are remembered within a run. Interrupted requests retain bounded intent and acknowledged receipts for a follow-up; New conversation resets the tab’s server context before rotating its identity. The runtime also refuses model tools it did not offer on the current screen.

The new position-color representation includes its original repeat period so later square bands preserve earlier edits to other shapes. Both manual and assistant repainting can replace position overrides. Keyring integration, immediate remote access-token revocation, optional whole-tab capture, wider generation evaluations and distribution review remain separate release follow-ups. Verification passed: full workspace units, lint and TypeScript; a fresh production build and assistant-marker audit; the complete 117-check assistant browser run; all 15 affected coloring checks after the live save fix, including three new named-copy regressions; and the complete production browser run (151 passed, 17 skipped). Six focused observation/rendering unit checks passed after the camera-settling change. Live generation built, inked and colored an editable star, exposed the save acknowledgement bug, and a separate live save/reopen check passed after the fix. The setup guide records both incomplete attempts and the successful follow-up. All verification ran sequentially with one worker and bounded heaps.

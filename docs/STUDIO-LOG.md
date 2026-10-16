# Studio log

Progress on [the studio plan](STUDIO-PLAN.md), newest last. The work is on branch `claude/studio` in the checkout `../Tastir-studio`, branched from Codex's `codex/ai-agent-screen-pointing` at 01d369d, so it does not touch Codex's checkout. A session that resumes this work reads this log first and continues the first phase not marked done.

## Phases

| Phase | State |
| --- | --- |
| 1. Studio and MCP | Done, 16 October |
| 2. Live in Tastir | Next |
| 3. Pictures | Not started |
| 4. Talking and pointing | Not started |
| 5. Photos | Not started |
| 6. Codex and Gemini | Not started |
| 7. Contest (optional) | Not started |

The plan asks for each phase to be added to `docs/TASKS.md`. Codex has uncommitted changes to that file in its checkout, so the studio phases are tracked here and will be added to the task list when the branches are merged.

## Phase 1: studio and MCP (16 October)

The plan had two apps, the service and the MCP server. They are one app, `apps/studio`, with two entry points, because they share the request shapes and a second package would only add configuration. `pnpm studio` starts the service (`tools/studio.mts`), and MCP clients start `tools/studio-mcp.sh`.

The drawing is kept in the editor's own format (a draft with steps, ink and pattern), not in the in-app assistant's segment list, so that the owner's edits in the editor and the agents' edits are the same kind of change. The edits reuse the editor's functions (`editor/document.ts`, `editor/finish.ts`) and Codex's construction specs (`agent/drawing.ts`) through one file, `apps/studio/src/player.ts`, which turns off the module-boundary lint rule for those imports. That code should move into a package once the branches are merged. The tile check in `apps/studio/src/ops.ts` copies the one in `agent/repeat.ts` for the same reason, so the two must be kept in step until then.

An edit that is refused goes back to the agent as a tool error with the reason, and the run carries on, which answers point 2 of [the review](AI-AGENT-REVIEW.md) for the studio.

The project folder (`studio/`) is ignored by Git with `/studio/`; a first `studio/` pattern also hid `apps/studio` from Nx. `nx sync` adds a reference from the studio's TypeScript config to the player's, which is what makes the player files typecheck.

**Checks.** 11 studio tests pass: the edits, history and authorship, and a recorded MCP session that builds the square from O and A, tiles and colors it, and saves a pattern file that parses and plays. Studio typecheck passes (with its dependencies, one task at a time) and lint has no errors (26 warnings of the kinds the rest of the repository has).

**Live check.** Claude Code (`claude -p`, the owner's plan, default model) was asked to build the square from O and A with fold-4 goals, tile it, color it and check it. It did so in 9 turns and 25 seconds: one construct batch of ten elements, one ink batch, the tile and the color, with `check` empty on the first try, and it left a note. The project is `studio/live-square-check-e7ca`.

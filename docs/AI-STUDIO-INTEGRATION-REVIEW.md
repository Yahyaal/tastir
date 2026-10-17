# Combining the assistant and hosted Studio — background review

Review written 16 October 2026; updated for the owner’s M0 preparation request. This is a review of `Tastir-studio/docs/STUDIO-HOSTED-PRD.md` and the current implementations, not a claim that the hosted service has been built or deployed. No branches were merged or client connections changed for this review.

**Status: background only.** [STUDIO-HOSTED-PRD.md](STUDIO-HOSTED-PRD.md) is the single authoritative delivery plan and task checklist. It lives on `claude/studio` until M0 brings that branch into main. This review supplies rationale and regression examples; it has no separate task sequence or completion status.

## Recommendation

Combine them around one project service. Keep the assistant's chat, theme-aware companion, current-view observations, coloring tools and error recovery. Use Studio's shared projects, authored history, notes, questions, reference overlays and MCP tools to let external agents work on those same projects.

The browser editor, the in-app assistant and an external MCP agent should be three clients of that service. Every edit uses the same validation and history, regardless of which client requested it. The drawing engine remains pure TypeScript.

Codex is a suitable client. Official documentation supports both local stdio and remote Streamable HTTP MCP connections, including OAuth. Claude's Studio log also records completed local Codex square and star runs. I have read that evidence; I have not rerun those sessions or connected Studio to this conversation. A Studio tool must be configured and exposed by the current Codex host before I can call it here.

Sources: [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp), [OpenAI MCP server guidance](https://developers.openai.com/plugins/concepts/mcp-server), and `Tastir-studio/docs/STUDIO-LOG.md`.

## Owner's scope clarification

The owner clarified that the added ring/position coloring and concentric square-border changes were experiments. They may be dropped or simplified during integration and must not hold up the merge. This is permission to simplify those experimental extensions, not a request to remove them immediately.

Keep or improve the working product capabilities: drawing and editing native geometry, inking, repeat tiles and walls, ordinary coloring, saving and export/import, shared Undo/Redo, conversation and follow-ups, navigation, current-view awareness, pointing, Stop and clear connection/usage recovery. The existing player’s normal coloring controls and ordinary saved designs remain part of that baseline. Equivalent or better implementations are acceptable; preserving every tool name or internal adapter is unnecessary.

Studio adds shared projects, other MCP agents, reference overlays, notes and questions. Those should extend the baseline. Reliable recovery of a manual edit during a conflict is a required improvement.

## What each approach contributes

| Existing work | Role in the combined app |
| --- | --- |
| Tastir player and normal editor | The owner's drawing, coloring, playback and export interface. |
| Our assistant panel | In-app conversation, current-page context, pointing, tool feedback and model/usage recovery. |
| Studio project service | Shared saved state, revision checks, history, notes, questions and reference alignment. |
| Studio MCP adapters | Tool access from supported external agent clients, locally or remotely. |
| Hosted storage and authentication | Access from another computer or phone, with durable projects and revocable connections. |

MCP provides access to tools; the model runs in the client using them. An external agent's conversation stays in its own app unless an explicit integration shares messages. MCP does not automatically populate Tastir's chat transcript or turn another provider's subscription into an embedded model connection. Our in-app chat therefore keeps a separate model connection while using the shared project commands. Hosting that model connection requires its own supported deployment/authentication design; exposing Studio over MCP does not finish it.

## Integration considerations

### Share commands and complete design state

Studio already imports pure editor/model helpers through `apps/studio/src/player.ts`. Move the shared operations into a workspace package, such as `packages/project-core`, and use it from both adapters. Keep DOM access, browser storage, network code and model credentials outside that package.

Do a functional regression pass before declaring the merge complete. Studio's current MCP edit schema covers basic construction, ink, tile and paint. Preserve the broader native construction/editing capability and named design copies through shared commands or equivalent mappings. The experimental assistant ring/position coloring and square-border commands are optional and can be omitted. Avoid maintaining separate implementations that drift.

A project's state must preserve the draft and the normal coloring/display settings used by ordinary saved designs. Persisting only construction steps and tutorial shape colors is insufficient for a faithful saved design. Import/export and saved-copy tests must round-trip the retained product settings. Experimental placement overrides and square bands are not required migration or feature-parity gates.

### Keep one history and protect the owner's pending edit

Use a persistent actor ID, request ID and label on each history entry. An agent's "undo mine" must identify that actor, including when several agents use the same model/provider. Connection names are display labels; authenticated identities determine access and ownership.

The current Studio page clears its pending draft after a save conflict and fetches the server version (`StudioPage.tsx`, the `flush` error handler). Before hosting, preserve that pending draft as a recoverable local change. Explain the conflict and offer a checked retry or recovery copy. Do not promise that server Undo restores a draft that was never committed unless that behavior has been implemented and tested.

Commit the project update, history entry and operation receipt atomically. Store command IDs so a retried successful request returns its original receipt without repeating the edit, save, note or question. Revision checks protect competing edits; operation IDs handle transport retries.

### Distinguish a project picture from the owner's live view

Studio's headless picture is useful even when no browser is open. Our screen observation also knows the active route, camera, visible targets, controls and selection. Retain both, clearly labeled with their project revision and, for a live browser observation, its view identity and freshness.

An MCP agent can mark named geometry through Studio. Pointing at a page control or a particular visible piece additionally requires a connected browser view and its current target IDs. If no such view is available, report that rather than implying a headless render is the owner's current screen. Reuse the retained normal coloring rules in both renderers so agents and the owner see matching designs.

### Make questions durable and waits short

Keep `ask` and its answer in persistent storage. Prefer returning a pending question ID promptly, with a bounded `wait_for_answer`, rather than holding one function open for 200 seconds and querying Postgres every second. Codex's documented default tool timeout is 60 seconds, so fitting within Vercel's maximum alone does not establish client compatibility. Longer waits can be configurable for clients that support them.

Source: [Codex MCP timeout configuration](https://learn.chatgpt.com/docs/extend/mcp).

### Keep the hosted deployment separate from the static public site

The PRD's separate signed-in Studio deployment is compatible with the existing GitHub Pages player. Preserve the local stdio/file-storage mode while adding authenticated HTTP and database storage. Hosted sessions, tokens, marks and pending questions cannot depend on one Node process staying alive.

Keep the initial owner allow-list, per-request/project authorization, immediate connection revocation and explicit permission for private-photo uploads. Treat "free plans only" as a measured budget target, with limits and a graceful stop, rather than a guarantee that polling, pictures and long-running waits will fit indefinitely. Durable Objects can remain a later notification layer; the database remains authoritative and reconnects must resynchronize from it.

## Review comments supplied to Claude (historical)

- The statement that Neon's HTTP driver cannot run transactions is too broad. It supports non-interactive transaction batches; interactive read/check/write transactions require a suitable connection approach. postgres.js can still be a valid choice, but choose it for the actual transaction requirements and deployment compatibility. [Neon documentation](https://neon.com/docs/serverless/serverless-driver).
- The opening says hosted work is planned and nothing is built, while the task introduction says H1–H4 are built and tested locally; their checkboxes are unchecked. Clarify whether the latter describes the intended sequence or completed work before relying on that status.
- Keep H0's real-client checks. Local Codex success is useful evidence, but it does not verify hosted OAuth, remote pictures or every other client's current account capabilities.

## Delivery order — superseded

The original six-step delivery order in this review is withdrawn and replaced by [STUDIO-HOSTED-PRD.md](STUDIO-HOSTED-PRD.md). Follow that document for M0, M1, M2 and the hosted milestones, including their order, owners and ticked completion states.

M0 merges the existing work and passes its regression checks. The three-way shared-project proof belongs to M1. Shared-code extraction belongs to M2 rather than expanding M0 into a refactor. The owner's pending-change recovery must work before the corresponding M1 scenario is signed off; its implementation can be separated from package extraction. These are review agreements, not a second task list.

## Reference regression scenarios

These examples identify functionality to retain or improve. They are not additional M0 merge gates or a second checklist. The hosted PRD assigns and tracks the relevant M1 and later checks. No combined implementation is claimed as tested here.

1. Start from O and A, construct and edit native geometry, ink a closed pattern, choose a valid repeat tile and display its wall. Invalid batches leave the drawing unchanged.
2. Keep a conversation across follow-ups and navigation. Stop prevents late actions and clearly reports changes that already completed. Navigation respects unsaved-work decisions.
3. Preserve both the committed project and the owner's recoverable pending change when manual and agent edits compete. Reject stale agent edits atomically.
4. Undo and Redo through one shared history. An agent's "undo mine" stops before another actor's work.
5. Color using the ordinary player controls, save a named copy, reload it, and export/import the retained drawing and design settings without overwriting the source.
6. Read the actual connected browser view and point at valid visible geometry or controls. Marks follow the camera/scroll, and stale or unavailable views are reported accurately.
7. Distinguish connection failures, confirmed usage limits and temporary usage-check failures. Keep completed edits and action feedback; offer appropriate recovery without automatic request loops.
8. Have the owner, embedded assistant and an MCP agent work on the same project with consistent pictures, exactly-once effects for retried commands, and questions that remain answerable after a short tool wait ends.

This makes the two efforts one product without assuming that MCP alone supplies an embedded model, unlimited subscription usage or a finished hosted release.

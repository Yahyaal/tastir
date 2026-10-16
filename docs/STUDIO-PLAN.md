# Tastir studio: drawing with AI agents

Plan written 16 October 2026. Progress is in [the studio log](STUDIO-LOG.md) and setup in [the studio setup](STUDIO-SETUP.md). The owner wants AI agents and people to work on the same pattern together, both to recreate patterns that have no clear tutorial and to design new ones. This plan builds a studio: a project folder holding one shared drawing, a local service that owns it, and an MCP server so that Claude Code, Codex and Gemini's command-line tool can all work on it while the owner draws in Tastir. A contest between models is a small optional extra at the end. Read [the AI agent plan](AI-AGENT-PLAN.md) and [the review of its branch](AI-AGENT-REVIEW.md) first, because this reuses that work.

## Why it works this way

Anthropic does not allow third-party apps to sign in with a Claude subscription, so Tastir cannot call Claude the way Codex's companion calls ChatGPT. An MCP server turns this around: each provider's own app connects to Tastir's tools, the owner signs in to that app with their own plan, and Tastir never sees any credentials. The owner has the $20 plan with all three providers, so all three can join.

Each MCP client starts its own copy of an MCP server, so two agents working at once would have two copies. One drawing therefore needs one owner, and that is the studio service. The MCP servers and the Tastir tab are all clients of it, which means every edit, from anyone, goes through the same checks and the same history.

## What already exists

The drawing logic Codex wrote does not need a browser. `apps/player/src/agent/drawing.ts` and `agent/repeat.ts` build on `editor/document.ts`, `editor/finish.ts`, `app/model.ts`, `app/coloring.ts` and `app/placement.ts`, and none of these touch the DOM or browser storage. The tool contracts are Zod schemas in `packages/agent-protocol` (`construct`, `edit_segments`, `set_tile`, `paint_pattern`, `travel_history`). Codex's history already records who made each edit, so "undo your changes" stops at someone else's work, and every edit carries a revision, so an edit based on an old view is rejected. The engine's checks (`firstFailingStep`, `strokesOffConstruction`, `strokesOffCrossings`, `hasSymmetry`) and the tile checks in `agent/repeat.ts` say whether a drawing is valid. A draft saves as a pattern file through `editor/files.ts`. `tools/review/overlay_grid.py` already draws a tutorial's ink over a source picture once O and the grid are placed on it, which is the idea the photo overlay below builds on.

This code lives on the unmerged `codex/ai-agent-screen-pointing` branch, so the work starts after the owner decides to merge it, on a new branch from main.

## A studio project

A project is a folder in `studio/<project>/` at the repository root, ignored by Git because it holds the owner's own work and possibly private photos. It contains the drawing as a pattern file, its history with the author of every entry, a notes thread, and for a reconstruction the reference photo and its alignment. Keeping it as plain files means any agent, including one without the MCP server, can read the project, and a finished drawing opens in Tastir with the existing file import.

The authors are the owner and each agent by client and model, for example "Claude Code, Claude Sonnet 5.5". The finished pattern's credits name all of them, plus the photo's source for a reconstruction, as the content rules require.

## The studio service

Put the service in `apps/studio`, a Node program like `apps/agent-local`, because it needs file access and its own dependencies and `packages/engine` must stay free of both. `pnpm studio` starts it together with the Tastir dev server, the same way `pnpm dev:agent` starts the companion, and prints the address of the studio page. It listens on 127.0.0.1 only and requires a secret it writes to `studio/.secret` with owner-only permissions, so only local programs started by the owner can edit the drawing.

The service holds each open project in memory, applies every edit with the shared drawing functions, writes the pattern file after each successful edit, and tells every connected client what changed. Edits are atomic and carry the revision they were based on, so if the owner draws a line while an agent is preparing a batch, the agent's batch is rejected whole and the agent looks again before retrying. The owner's edits are never blocked by an agent.

## The MCP server

The MCP server lives in the same app, `apps/studio`, as a second entry point (`tools/studio-mcp.sh`), because it shares the service's request shapes. It uses the official MCP TypeScript SDK and the stdio transport, because every client listed above starts a local server that way. It holds no drawing of its own: each tool is a call to the studio service. Each client is set up once with a line in its MCP settings, and the setup notes go in `docs/STUDIO-SETUP.md`.

The drawing tools reuse the existing contracts so the in-app assistant and the studio cannot drift apart: `open_project`, `new_project` (from O and A, or from a library tutorial), `construct`, `edit_segments`, `set_tile`, `paint_pattern`, `undo` and `redo`. `inspect` returns the named points, lines, circles, sides, tile and shape types. `view` returns a PNG of the construction or the wall as MCP image content. `check` runs every validity check and the project's goals and returns the failures in plain words.

The working-together tools are new. `note` posts a message to the project's thread, and `read_notes` returns the messages since the agent last looked, so agents and the owner can explain choices and leave requests for each other. `point` marks a named element in Tastir with a short label, using the same kind of marker Codex built. `ask` does both and waits for the owner's answer, up to a time limit, so an agent can ask "is this the crossing the star's point comes from?" and continue with the reply.

## Working in Tastir

The studio page in Tastir opens a project in the normal editor, with the drawing coming from the studio service instead of browser storage. Agent edits appear as they happen, without a page reload, with the author shown in the history. The owner draws with the ordinary tools, and those edits go to the service like anyone else's. A side panel shows the notes thread with a reply box, the agents' markers and questions, and which agents are connected. This needs an adapter in the editor that loads and saves through the service, which is the same "edit the drawing you have open" step Codex's plan names as its next milestone, so the two should share it.

## Recreating a pattern from a photo

A reconstruction project starts with a reference photo. It comes from `docs/research/` or is added to the project folder, and it stays private unless it is free to use, as the content rules already say. The owner aligns the photo once in the studio page by placing O and A on it, and dragging to adjust the scale and angle. The alignment is stored in the project, never in the pattern, so the tutorial still has no coordinates: it remains a ruler-and-compass construction, and the photo is only a guide for checking it.

`reference` returns the photo, and `overlay` returns it with the current ink drawn on top in a contrasting color, aligned, for the whole photo or a chosen area. The agent compares the two, finds where its lines leave the photo's, changes the construction and looks again. When the photo is ambiguous, for example a worn or hidden part, the agent asks the owner instead of guessing. A drawing is done when the owner accepts the overlay and `check` passes.

## Designing new patterns

A design project starts from a brief written in the notes thread, for example "eight-fold, smaller stars between the large ones, three colors, square repeat". The measurable goals (fold, star or motif counts, step limit, colors, tile shape) are stored with the project, so `check` reports them beside the validity checks. The agent proposes, the owner reacts by drawing or by note, and the history shows who made each part.

## Several agents together

Several agents can work on one project at once, because they all go through the studio service. A useful pattern is to give them roles in the project's notes: one drafts the construction and another checks it against the photo or the brief and posts what it finds, while the owner decides. Their edits cannot overwrite each other, because a batch based on an old revision is rejected. The studio page shows who is connected and what each one did.

## Pictures for the models

`view` and `overlay` build an SVG string from the evaluated scene and convert it to PNG with `@resvg/resvg-js`, which runs in Node without a browser. The construction picture draws circles and lines faintly, finite ink dark, and labels named points, so the model can match the picture to `inspect`. The wall picture reuses `wallSvg` from `app/exporting.ts`, after moving its two helpers out of React files (`banded` from `Wall.tsx` and `strapWidths` from `drawing.tsx`). The pictures will not match the app pixel for pixel, which is fine because they are for the models, while the owner works in Tastir itself.

## Subscription limits

The $20 plans have the lowest paid limits, and pictures use a lot of them. `view` and `overlay` keep pictures to about 1,000 pixels and can crop to an area, and the setup notes suggest asking agents to look only after a meaningful change. When a client reports a usage limit, its work so far is already saved in the project, so another agent or the owner can continue.

## Phases

| Phase | Work | Done when |
| --- | --- | --- |
| 1. Studio and MCP | `apps/studio` with projects, revisions, authored history, the drawing tools and the MCP server; setup for Claude Code. | Claude Code builds the eight-fold square from O and A in a new project, and the saved file opens in the editor and plays. A test shows a stale batch is rejected whole. |
| 2. Live in Tastir | The studio page, the editor adapter, live updates, the owner's edits through the service. | An agent's edit appears in the open editor without a reload. A line the owner draws while the agent works survives, and "undo your changes" leaves it in place. |
| 3. Pictures | `view` for construction and wall. | Test PNGs show the expected ink and colors, checked by pixel. |
| 4. Talking and pointing | Notes thread, `note`, `read_notes`, `point`, `ask`, and the side panel. | An agent asks about a named crossing, the owner sees the marker and answers, and the agent continues from the answer. |
| 5. Photos | Reference photos, alignment, `reference` and `overlay`. | An agent recreates a pattern that already has a tutorial and a photo, so the answer is known, and the owner accepts its overlay. |
| 6. Codex and Gemini | Setup notes for both, and two agents on one project with roles. | Each client finishes the easy brief, and a drafter and a checker work on one project without overwriting each other. |
| 7. Contest (optional) | Briefs in `studio/briefs/`, a runner that gives every client the same brief in its own project, and a blind side-by-side on the review page. | Two runs per model on one brief finish unattended, and the owner picks a favourite before seeing which model drew which. |

Each phase is one task with one commit, added to `docs/TASKS.md` before it starts, and runs the full test, lint and typecheck commands one project at a time. The first patterns to try in phase 5 are ones already in the library with free photos, so the owner can judge the method before it is used on patterns that have no tutorial.

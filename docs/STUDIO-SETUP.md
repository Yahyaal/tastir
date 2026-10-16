# Using the Tastir studio

The studio lets AI agents and you work on the same pattern. This page says how to start it and connect each agent. The plan behind it is in [the studio plan](STUDIO-PLAN.md) and progress is in [the studio log](STUDIO-LOG.md).

## Start the studio

From the repository root run `pnpm studio`. It starts the studio service and a Tastir dev server beside it, and prints the address of the studio page. Keep the terminal open while you work. `pnpm studio --no-app` starts only the service, for agents working without you watching.

Projects are kept in the `studio/` folder at the repository root, one folder per project. Git ignores it, because it holds your own work and possibly private photos. Each project folder has `project.json`, the drawing with its whole history and notes, and `pattern.json`, the drawing as a normal Tastir pattern file that the editor's file import opens.

Only one studio runs at a time, so two services never write the same project. The service listens on this computer only and needs a secret that it hands to the agents' MCP server and to the dev server, so no website can reach your drawings.

## Connect Claude Code

Run this once:

```sh
claude mcp add --scope user tastir-studio -- /home/yahya/Documents/projects/Tastir-studio/tools/studio-mcp.sh
```

The path is the studio branch's checkout until it is merged into main; after the merge it becomes the main checkout's `tools/studio-mcp.sh`. Then start the studio and ask Claude Code something like "Use the tastir-studio tools to start a project from O and A and draw an eight-pointed star". Claude Code asks before using each tool the first time; you can allow them all for the session.

## Connect Codex

Run this once:

```sh
codex mcp add tastir-studio --env TASTIR_AUTHOR=codex -- /home/yahya/Documents/projects/Tastir-studio/tools/studio-mcp.sh
```

Codex then lists the studio's tools in any session; ask it in the same words as Claude Code. It asks before each tool call; to let it use the studio's tools without asking, add `default_tools_approval_mode = "approve"` under `[mcp_servers.tastir-studio]` in `~/.codex/config.toml`. `pnpm contest` passes that setting itself, because `codex exec` cannot ask. Codex uses your ChatGPT plan, which Codex's own work on Tastir also uses, so the two share one allowance.

## Connect Gemini

Gemini's command-line tool is not installed on this computer yet. Install it with `npm install -g @google/gemini-cli`, run `gemini` once and sign in with the Google account that has your Gemini plan, then run:

```sh
gemini mcp add -e TASTIR_AUTHOR=gemini tastir-studio /home/yahya/Documents/projects/Tastir-studio/tools/studio-mcp.sh
```

## Several agents on one project

Agents can share a project. Give each a role in your request, for example one drafts the construction and the other checks it against the photo or the goals and posts what it finds. Each agent's changes are marked with its name in the history (set by `TASTIR_AUTHOR` above), an edit based on an old view is refused, and an agent's own Undo stops at anyone else's change.

## What agents can do

Agents start projects from O and A or from a library tutorial, then add named lines, circles and crossings, ink straight sides between named points, choose the repeating tile and color its pieces. `check` lists every remaining problem, including the project's goals such as the fold. `inspect` shows the whole drawing with its history, and agents leave notes for you and for each other.

Every edit is checked by the same code as Tastir's editor, and an edit that cannot be drawn changes nothing. Each edit names the revision it was based on, so if you or another agent changed the drawing first, the late edit is refused and the agent looks again. Undo by an agent stops at anyone else's change unless you ask it to go further.

## Working together in Tastir

Open the address `pnpm studio` prints, normally http://127.0.0.1:4293/#/studio. It lists the projects and starts a new one from O and A. A project opens in the normal editor: agents' changes appear as they make them, and anything you draw goes back to the studio. The status line names the latest change and who made it. Undo in the editor works on everything, agents' changes included.

Under the steps, the studio panel shows agents' questions with a box to answer each, what they have marked (it glows on the drawing), and the notes thread, where you can leave notes for them. ▶ Play keeps a copy in this browser and plays it like your own patterns.

## Still to come

The optional contest between models is the last phase; the log says where each phase stands.

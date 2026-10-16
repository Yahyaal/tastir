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

## What agents can do

Agents start projects from O and A or from a library tutorial, then add named lines, circles and crossings, ink straight sides between named points, choose the repeating tile and color its pieces. `check` lists every remaining problem, including the project's goals such as the fold. `inspect` shows the whole drawing with its history, and agents leave notes for you and for each other.

Every edit is checked by the same code as Tastir's editor, and an edit that cannot be drawn changes nothing. Each edit names the revision it was based on, so if you or another agent changed the drawing first, the late edit is refused and the agent looks again. Undo by an agent stops at anyone else's change unless you ask it to go further.

## Not yet

Seeing the drawing live in Tastir, pictures for the agents, pointing and questions, reference photos, and the Codex and Gemini setup are later phases; the log says where each stands.

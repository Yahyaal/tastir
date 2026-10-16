# Studio log

Progress on [the studio plan](STUDIO-PLAN.md), newest last. The work is on branch `claude/studio` in the checkout `../Tastir-studio`, branched from Codex's `codex/ai-agent-screen-pointing` at 01d369d, so it does not touch Codex's checkout. A session that resumes this work reads this log first and continues the first phase not marked done.

## Phases

| Phase | State |
| --- | --- |
| 1. Studio and MCP | Done, 16 October |
| 2. Live in Tastir | Done, 16 October |
| 3. Pictures | Done, 16 October |
| 4. Talking and pointing | Done, 16 October (live check with the owner still to do) |
| 5. Photos | Tools done 16 October; the live reconstruction waits for the owner to line up a photo |
| 6. Codex and Gemini | Two agents done 16 October; Codex waits for the ChatGPT allowance, Gemini for the owner to install and sign in |
| 7. Contest (optional) | Done 16 October with Claude Code; waits for the owner's pick, and for Codex and Gemini runs |

The plan asks for each phase to be added to `docs/TASKS.md`. Codex has uncommitted changes to that file in its checkout, so the studio phases are tracked here and will be added to the task list when the branches are merged.

## Phase 1: studio and MCP (16 October)

The plan had two apps, the service and the MCP server. They are one app, `apps/studio`, with two entry points, because they share the request shapes and a second package would only add configuration. `pnpm studio` starts the service (`tools/studio.mts`), and MCP clients start `tools/studio-mcp.sh`.

The drawing is kept in the editor's own format (a draft with steps, ink and pattern), not in the in-app assistant's segment list, so that the owner's edits in the editor and the agents' edits are the same kind of change. The edits reuse the editor's functions (`editor/document.ts`, `editor/finish.ts`) and Codex's construction specs (`agent/drawing.ts`) through one file, `apps/studio/src/player.ts`, which turns off the module-boundary lint rule for those imports. That code should move into a package once the branches are merged. The tile check in `apps/studio/src/ops.ts` copies the one in `agent/repeat.ts` for the same reason, so the two must be kept in step until then.

An edit that is refused goes back to the agent as a tool error with the reason, and the run carries on, which answers point 2 of [the review](AI-AGENT-REVIEW.md) for the studio.

The project folder (`studio/`) is ignored by Git with `/studio/`; a first `studio/` pattern also hid `apps/studio` from Nx. `nx sync` adds a reference from the studio's TypeScript config to the player's, which is what makes the player files typecheck.

**Checks.** 11 studio tests pass: the edits, history and authorship, and a recorded MCP session that builds the square from O and A, tiles and colors it, and saves a pattern file that parses and plays. Studio typecheck passes (with its dependencies, one task at a time) and lint has no errors (26 warnings of the kinds the rest of the repository has).

**Live check.** Claude Code (`claude -p`, the owner's plan, default model) was asked to build the square from O and A with fold-4 goals, tile it, color it and check it. It did so in 9 turns and 25 seconds: one construct batch of ten elements, one ink batch, the tile and the color, with `check` empty on the first try, and it left a note. The project is `studio/live-square-check-e7ca`.

## Phase 2: live in Tastir (16 October)

`#/studio` lists the projects and starts one from O and A, and `#/studio/<id>` opens a project in the normal editor. The editor (`EditorPage` in `apps/player/src/editor/Editor.tsx`) takes an optional shared drawing: the studio page hands in the latest drawing whenever the studio reports a change, and the editor sends each of the owner's changes back instead of keeping them in browser storage. A drawing that arrives from the studio becomes one more step in the editor's own Undo, so the owner can undo an agent's change by hand. The owner's changes are sent as a whole new drawing with a label worked out from what changed ("Added step 4 in Tastir", "Inked in Tastir"). ▶ Play keeps a copy in browser storage under `studio-<id>` and plays it like the owner's own patterns. The page and its route exist only on the dev server, and `pnpm studio` sets up a `/__studio` proxy that adds the studio's secret, so the page never sees it. Changes reach the page through a server-sent event stream.

When an agent's change and the owner's arrive in the same moment, the agent's wins and the page says the owner's last change was not kept and that Undo brings it back. An agent that is still thinking when the owner edits has its late batch refused instead, which is the usual case.

**Checks.** `pnpm test:studio:browser` (new, `tools/studio-playwright.config.mts`) runs `pnpm studio` with a throwaway folder and calls the service as an agent would. On desktop and phone: an agent's change appears in the open editor without a reload; the owner renames the drawing; the agent's late batch is refused and its "undo mine" stops at the owner's change; Undo in the editor reaches the studio; and the list page starts a project. The test uses a rename as the owner's change rather than drawing a line with the tools.

## Phase 3: pictures (16 October)

`view` returns a PNG of the construction (guides faint, ink dark, tile dashed, points named) or of the wall (two rings of tile copies around the centre, in the pattern's colors), optionally of an area in drawing units. The SVG is built in `apps/studio/src/picture.ts` and turned into PNG with `@resvg/resvg-js`. It does not reuse the app's `wallSvg` after all, because that would mean moving helpers out of `Wall.tsx` and `drawing.tsx`, which Codex is changing.

Two things to remember. resvg's scan of every system font hangs inside Vitest, so the picture code loads one named font file (DejaVu Sans, then Noto Sans or Liberation Sans). And `RenderedImage.pixels` copies the whole image on every read: a test that read it inside a per-pixel loop hung while eating memory and crashed the owner's machine twice. The test now reads it once, and every heavy command in this work now runs under `timeout` and a `systemd-run` memory cap.

**Checks.** 14 studio tests pass, including pixel counts of the ink and of the chosen blue on the wall.

## Phase 4: talking and pointing (16 October)

Agents have `point` (mark a named element with a label), `clear_marks`, `note`, `read_notes` and `ask`. `ask` posts a question, marks the element it is about, and waits up to ten minutes for the answer. If none comes it tells the agent to carry on with what does not depend on it and to look at the notes later, so it never has to guess. Marks are kept in the service's memory, not in the project, because they are only for the moment; questions and answers are notes, so they stay with the project.

In Tastir, a panel under the steps shows the open questions with a box to answer each, what is marked (marked elements glow on the drawing, and marked points are ringed), and the notes thread with a box for the owner's own notes. The editor took two optional props for this (`marks` and `aside` on its shared drawing), so the normal editor is unchanged.

Phases 2 to 4, and the tools of phase 5, went into one commit, not one each. The machine crashed twice during phase 3 (see above), and by then the changes overlapped in the same files.

**Checks.** 15 studio tests pass, including an MCP session where the agent points, asks and gets the owner's answer while it waits. 6 studio browser checks pass on desktop and phone, including answering a question, posting a note and clearing marks in the panel. Player: 695 unit tests pass; lint has no errors; typecheck passes. The full player browser suite passed (151 passed, 17 skipped) before the panel was added and is run again before the commit. The live check, where Claude Code asks the owner something and continues from the answer, needs the owner at the screen and is still to do.

## Phase 5: photos (16 October, tools)

A project can have a reference photo: the owner adds one in the studio panel (PNG or JPEG), or an agent names one in `docs/research/` or `apps/player/public/photos/` with `set_reference`. It is copied into the project folder, which Git ignores, so a private photo never reaches the repository. The owner lines it up once by pressing "Line up" and clicking O, then A, on the photo; the alignment is kept in the project, never in the pattern. `view` then shows the photo with the ink drawn over it in magenta (O and A in cyan), whole or cropped to an area in drawing units, and the panel shows the same overlay to the owner after every change. The MCP instructions tell agents how to work from a photo: compare the overlay, change the construction rather than the ink alone, and ask instead of guessing where the photo is unclear.

**Checks.** 18 studio tests pass, including the photo's size from its header, the mapping from O and A (also for a turned photo), magenta ink only once the photo is lined up, and cropping. 8 studio browser checks pass on desktop and phone, including adding a photo and lining it up by clicking. Lint has no errors and typecheck passes for the studio and the player.

**Still to do for this phase.** The live test: the owner lines up a free photo of a pattern that already has a tutorial (the Itimad star and octagon photo is a good first one, `apps/player/public/photos/itimad-star-and-octagon.jpg`), an agent recreates it from O and A, and the owner judges the overlay.

## Phase 6: Codex, Gemini and two agents (16 October, in part)

**Two agents on one project.** Two Claude Code runs, named `claude-drafter` and `claude-checker` with `TASTIR_AUTHOR`, shared the project `studio/two-agents-eight-pointed-star-c176`. The drafter built an eight-pointed star from two squares inscribed in the unit circle, starting from O and A, inked its outline, used the square around the circle as the tile and colored it with a palette: 22 turns, about two minutes, `check` clean at revision 10. Along the way `check` caught a mistake. The drafter had inked lines out to the tile corners, the pieces around O lost their eight-fold symmetry, and it removed them. It left two notes. The checker read the notes, rebuilt every point's derivation from O and A, looked at both pictures, removed three guides the drafter had marked unused (revision 11), and posted a review: a correct star and cross, 11 turns.

**A bug the checker found.** After any change to the construction or the ink, inspect listed the tile's pieces as empty until the tile was set again, although the wall still drew them. Construct and ink now find the pieces again whenever the tile still repeats, keeping their names and colors; a test covers it, and 19 studio tests pass.

**Codex.** `codex exec` with the studio as an MCP server (`-c mcp_servers.tastir-studio…`) reached the model, but the ChatGPT plan had hit its usage limit until 4:52 AM on 16 October, shared with Codex's own work in the main checkout. The live Codex check is the next step after that time: the same square brief as Claude Code's phase 1 check, with `TASTIR_AUTHOR=codex`.

**Gemini.** Gemini's command-line tool is not installed here, and it needs the owner to sign in with Google, so its setup is written in [the setup notes](STUDIO-SETUP.md) and its live check waits for the owner.

## Phase 7: contest (16 October, tools)

Briefs are JSON files in `apps/studio/briefs/` (text for the models, the fold, and the goals `check` measures); there are two to start with, `square` and `star-and-cross`. `pnpm contest <brief> --models claude,codex,gemini --runs 2 [--minutes 15]` gives the brief to each client in turn, one run at a time so the machine never runs two, each in a fresh project, through its own command-line tool (`claude -p`, `codex exec`, `gemini -p`) with the studio as its MCP server. After each run it saves the time, the number of edits, the remaining problems and whether the run finished, failed, or was stopped by a usage or time limit (stopped runs do not count against the model) to `studio/contests/<id>.json`.

`#/studio/contest/<id>` shows the designs as Design A, B… in an order fixed by the contest, with the walls of finished ones side by side and no model names. The owner can mark any as not good and picks a favourite, and only then are the models, times and edit counts shown. The studio list page links each contest.

The Gemini command is written from its documentation and has not been tried, because Gemini's tool is not installed here.

**Checks.** 20 studio tests pass, including a contest run with two stand-in clients (one draws the square through the service, one stops on a usage limit) and blind judging. 10 studio browser checks pass, including judging a contest on desktop and phone. Typecheck and lint pass for the studio and the player.

**Live contest.** `pnpm contest star-and-cross --models claude --runs 2 --minutes 10` ran Claude Code twice, unattended, one run after the other. Both finished with `check` clean, in 113 and 124 seconds (contest `star-and-cross-2026-10-16-28fc`). They are two different designs. One inks only the outlines of the two squares' star, giving stars and crosses. The other inks both whole squares, giving an octagon ringed by triangles inside each star. Both repeat cleanly on the square tile. The owner can judge them at `#/studio/contest/star-and-cross-2026-10-16-28fc` with `pnpm studio` running.

## What waits for the owner or for a limit

1. **Codex.** The ChatGPT allowance resets at 4:52 AM on 16 October. After that, run the square brief once with `TASTIR_AUTHOR=codex` (as in phase 6), then `pnpm contest star-and-cross --models codex --runs 2`. A resumed session does this.
2. **Gemini.** Install its tool and sign in (setup notes), then run the same brief.
3. **Asking live (phase 4).** With the owner at the screen: an agent asks about an element, the owner answers in the panel, the agent continues.
4. **A photo (phase 5).** The owner lines up `apps/player/public/photos/itimad-star-and-octagon.jpg` in a studio project; an agent then recreates the pattern from O and A, and the owner judges the overlay.
5. **Judging** the first contest, and deciding whether to merge `claude/studio` (it is built on Codex's `codex/ai-agent-screen-pointing`).

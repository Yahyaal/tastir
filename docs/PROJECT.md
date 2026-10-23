# Start here

This page is the way into the project for the owner and for every new Claude Code session. It says what we are trying to do, where things stand, what comes next, and where everything else is written down. The app shows it, with the other documents it names, at `#/notes` on the dev server.

## The objective

Tastir teaches Islamic geometric patterns one ruler or compass step at a time. The current goal is a rich library: every pattern family with several real designs, each verified against a photo or a published drawing of a real example, drawn exactly with ruler and compass, and shown well by the player (inking by hand, the repeat built tile by tile, colouring piece by piece). Later, learners should be able to make their own designs from a construction.

## Where things stand (12 October 2026)

**Read this first if you are a fresh session.** The dated record of how we got here is in [the history](HISTORY.md); this section only says what is true now.

**How work is done.** Other tools build on their own branches and Claude reviews before the owner merges; nobody pushes `main`. Prompts for them go in `docs/prompts/`, one dated file per batch, each self-contained. Lately Claude cloud sessions and Codex have done the building (Gemini hit its weekly limit on 10 October). Do not spawn builder or tester agents unless the owner asks, because they use a lot of the limit.

**The library** has 39 tutorials; [Pattern status](patterns/STATUS.md) says how each was checked. Three are construction studies whose match to a real monument is not verified, and the player says so: `eight-fold-khatam`, `eight-fold-star-and-octagon` and `ten-pointed-star-decagon-rect` (owner's decision of 11 October, recorded in [the review decisions](testing/review-decisions-2026-10-11.md)).

**Construction sources (21 October).** The [audit of all 39 tutorials](patterns/CONSTRUCTION-AUDIT.md) separates following published instructions from reconstructing a finished drawing, and records departures and evidence for each. Every pattern shows these findings under **How this construction was made**. Eleven use instructions, nine mix instructions with our additions, fifteen reconstruct finished designs, three are app-developed studies and one uses a standard construction. Among the twenty with instructional sources, five have documented close correspondence, eleven have identifiable adaptations and four lack a complete fidelity check. This is separate from historical matching and owner approval.

**Plain steps (22–23 October).** Squares and stars (with Star and arrows as a second example) is the pilot for writing the steps in simple, controlled English ([Writing the steps](tutorial-writing.md)): one action to a numbered line, every point named by a letter or a family (S1–S8), points the text names shown large on the learner's board, long steps split into parts, and the ink a shape at a time in `ink.parts`. The tools are now Circle, Line, Perpendicular, Parallel and so on. The owner checks the pilot by eye; then the other 38 tutorials follow, in batches, each added to the list in `plainText.spec.ts`.

**The player** draws each step, inks the pattern, builds the repeat tile by tile and colours it. Learners can also draw along on every tutorial, save their own designs, edit and share them (the build log is [Your own patterns](USER-PATTERNS.md)). The finished wall has five styles: tiles, strapwork, lines, Jali (a pierced screen in stone, wood or metal finishes) and interlace (bands woven over and under by one rule).

**The colour stage** (12 October) colours a pattern with rosettes ring by ring: each rosette is a card of its rings from the centre out, a second rosette starts as the first with its colours swapped or the same, and every rosette can be coloured alike instead. A click on the wall opens that piece's ring. A Wall / Unit switch over the picture shows only the unit that repeats: one whole rosette of each family and the filler stars round them, drawn large (13 October). "Rosettes in the unit" offers 1, the lattice's own number taking turns, and on square lattices 4 (A B over C D), each with its own colours (`ringsOf(pattern, true)`, `rosetteOptions`). The palettes show as strips of their colours, and the learner can switch to colouring by shape. Saved designs and share links keep the way of colouring and the number of rosettes (`Coloring.method` and `Coloring.rosettes`).

**Merged on 11 and 12 October:**
- Jali with colours, material finishes and textures (Codex, pull request #5; tasks 2.1–2.1d in [the tasks](TASKS.md)).
- Interlace (task 2.3, pull requests #4 and #7), rebuilt after the owner found crossings in Barca stars and Bou Inania that were not woven.
- Ink speed: the prepared ink stays in its worker, and only small typed arrays cross to the page. Pressing Ink on Bou Inania went from 9.6 s to 2.9 s on a slow cloud machine, so it is faster but not yet under one second. Timing tests now run in `pnpm test:perf`, not `pnpm test`.
- The owner's feedback on the zellige wheel: the shifted wheel repeats on a hexagon, and a new `kurt-eight-fold-zellige-filled` fills the space between four wheels by overlapping them, with the cross where four meet filled too (pull requests #6, #8, #9).

**With Codex (13 October):** Ink under one second, the last step, on the branch `app/ink-speed-2` ([the task](prompts/codex-2026-10-13.md)). 

**The redesign (13 October).** The owner approved a new look, plaster, zellige and ink in a light and a dark theme, drawn on the design canvas https://claude.ai/artifact/McyS36FxVoDKxVCUKNZmX1. The plan is the `redesign` card on the review page: R1 themes, R2 the lesson (arch frame, a four-chapter timeline), R3 the colour panel (paint colours first; this is also how the colour-stage mock gets built), R4 the home page, R5 draw along on one board with a faint guide (the owner chose this over two boards), R6 the phone. The step colours keep the owner's four roles, and palettes stay as visible strips. R1 to R6 are done (on a phone the drawing comes first, R6; draw along uses one board with the step as a faint guide at the steps and the ink, as the owner chose on 13 October, replacing the two boards side by side). Every colour is a variable in `apps/player/src/styles.css` with a light value on `:root` and a dark one on `:root[data-theme='dark']`, and `src/app/theme.tsx` holds the switch. New CSS must use those variables, never a fixed colour, or it breaks one of the themes.

## Open decisions and things still to do

**Local AI assistant (15 October).** The owner asked to begin the [AI agent plan](AI-AGENT-PLAN.md) on a new branch. `codex/ai-agent-phase-0` implements a local ChatGPT companion and a workspace using the real editor drawing. It can send the current construction image and accept a model tool call that highlights an object after validating the view. The first live check passed with the owner's connected account after fixing missing stream headers and empty terminal output arrays: the board image produced a displayed highlight and a final explanation. Automated checks remain simulated. Original drawing and coloring remain later phases. [Setup, verification and current limits](AI-AGENT-SETUP.md). The next branch, `codex/ai-agent-drawing`, adds editable sides between existing named points, one Undo per model edit, manual endpoint changes and saving an editor copy. A live request drew jW–jN–jE–jS, received a fresh image, and completed its reply; Undo removed all four sides and Redo restored them. The owner confirmed that result. `codex/ai-agent-construction` now starts from O and A and creates named lines, circles and intersections, then uses the new points for finite ink. A live construction-to-ink request passed, including Undo/Redo; 36 assistant browser checks passed. `codex/ai-agent-repeat-color` now adds checked closed repeats, tile choice, shape colors and palettes, with the existing wall renderer and normal playable saves. `codex/ai-agent-navigation` adds real destination navigation and a panel on ordinary pages, preserving the assistant workspace and its Undo history while honoring unsaved-design questions. Changed editor copies cannot be overwritten by the retained workspace; Keep as new pattern preserves both versions. `codex/ai-agent-undo` gives the assistant real Undo/Redo commands using the shared workspace history, with available step counts and fresh-image acknowledgement; a live three-edit Undo/Redo check passed. `codex/ai-agent-history-context` records author/request/label for new history entries so assistant-only Undo stops at manual or unidentified work; added geometry frames itself and fit_view restores the full construction before continuing. `codex/ai-agent-screen-pointing` registers visible normal editor/tutorial geometry, wall and unit pieces, and labeled page controls. Its annotations follow the camera and scrolling without pressing controls. `codex/ai-agent-square-colors` (AI.1) adds checked concentric square borders on the normal Color/result page, sharing its color Undo/Redo and normal save/share data. Other shapes retain their colors. It also addresses the applicable [review comments](AI-AGENT-REVIEW.md): clearer sharing notice, scoped launcher, malformed-call recovery, bounded text context, latest-image-only continuations, concise shared instructions and a short model cache. `codex/assistant-chat-and-tools` adds the compact toolbar companion and a proper conversation thread, normal-editor construction/ink/tile tools with its real history and autosave, ring/shape/position colors, shared square borders and new named saves. Full unit tests, lint, TypeScript, the fresh production build and marker audit passed. The complete assistant browser run passed 117 checks; all 15 affected coloring checks passed after the live save fix, including three new regressions. The complete production browser run passed 151 checks with 17 skips. A live original-star request reached construction, ink, repeat and colors; a focused live follow-up verified named saving and reopening after fixing its acknowledgement. Checks ran sequentially within bounded memory. The AI.2a feedback follow-up replaces the robot with a colorful zellige-star companion and distinguishes app/plan limits from temporary usage-check failures, with direct usage recovery and preserved earlier edits. Broader live generation evaluations, optional whole-tab capture and local-release packaging remain later work.

**Shared Studio assistant (17 October, M2).** `pnpm studio:agent` runs the local companion and Studio at one browser address. Assistant edits and Undo use the server's revision checks and authored history, with a separate `tastir-assistant` identity. The owner has Undo mine as well as normal shared Undo/Redo. Manual changes made during an assistant save stay recoverable. The three-worker, conflict, named-copy/color/export and picture checks use a real MCP HTTP connection and real editor with simulated model replies; they do not claim a live provider evaluation. [Setup](STUDIO-SETUP.md) and [validation evidence](testing/m2-three-workers-2026-10-17.md). The hosted PRD owns completion status and task order; package extraction is M3.

**Live rooms (17 October, H7 local portion).** `apps/live-room` is an independent Cloudflare Worker with hibernatable project sockets, signed short-lived page tickets and server revision notices. Its small page client polls when the room is unavailable. Seventeen tests include actual hibernation recovery, and a real Chromium/Worker fixture verifies delivery and fallback. Full workspace test, lint and typecheck pass. [Setup and H4 contract](../apps/live-room/README.md), [validation evidence](testing/h7-live-room-2026-10-17.md). Claude wires the hosted Studio separately. H7 stays unchecked until H6 measures deployed edit-to-screen latency and a week of free-plan usage.
**Hosted deployment preparation (17 October, H5).** [The short setup guide](STUDIO-DEPLOY.md) maps provider values to Studio settings. `pnpm studio:preflight` checks configuration and database migrations without changing the database or displaying secrets. [The Vercel audit](STUDIO-VERCEL-AUDIT.md) identifies the packaging and deployed checks for the merged H4/H7 tree. H5 remains unchecked until the owner creates the accounts and the real deployment/persistence checks pass.

**ChatGPT connection and visible results (21 October, H6).** The owner connected ChatGPT and saved its blue repeating square online. The corrected [connection guide](STUDIO-CONNECT.md) covers setup, existing connectors and finding online projects in Your work. [Issues, causes and lessons](testing/studio-chatgpt-2026-10-21.md) records the discovery-schema failure and the navigation/preview bugs that hid the saved result. [The Studio log](STUDIO-LOG.md) holds deployment verification; [the hosted PRD](STUDIO-HOSTED-PRD.md) retains the outstanding acceptance checks.

**Design review (22 October).** At the owner's request the app was compared with the approved design canvas screen by screen and eight differences fixed: arched card pictures and a cedar arch on the home drawing, card buttons that fit, the typewriter face removed, draw along in the lesson's look, a library search, a plain page for broken addresses, pill controls in the editor and upcoming page, and the editor's title first on a phone. The owner chose the arch for library cards only; opened patterns and the home drawing are rectangles, and the original photo hides and shows from a button on the drawing. [The report](testing/design-review-2026-10-22.md).

The prioritised list is the **Next** section of the review page (`PROGRESS` in `apps/player/src/review/data.ts`), and the pattern work is in [the queue](patterns/QUEUE.md). The owner still has to:
- answer the question on the review page about the filled wheel's colours, and look at the interlace fix;
- decide on the four wall styles Claude recommended dropping (tasks 2.2, 2.4, 2.5 and 2.6);
- look at the atelier look and draw along in a real browser, and read the agent-written `textWithoutHelpers` step texts;
- choose where learners send library files (hidden until there is a form or an address);
- find a native reader for the Arabic titles ([the review](arabic-titles-review.md) lists them).

## The next goal

The redesign is done (R1 to R6, 13–14 October). Next: the owner’s look at it, then more Alhambra panels from [the queue](patterns/QUEUE.md).

## How a session works

1. Read `CLAUDE.md`, this page, [how to work with the owner](WORKING-WITH-OWNER.md), [the lessons](patterns/LESSONS.md) and `docs/geometry-notes.md`.
2. Take the next goal above, or the first unchecked item in [the queue](patterns/QUEUE.md).
3. Show the owner a short plan and wait for an OK before writing code.
4. Put every update and question on the review page (`#/review`), with labelled pictures. The terminal only says what changed and where to look.
5. Before calling anything done, run `pnpm test`, `pnpm lint` and `pnpm typecheck`, then commit with the task named in the message.
6. When a goal is finished, update this page, [the queue](patterns/QUEUE.md) and [the status](patterns/STATUS.md), and suggest the next goal.

## Where everything is

| Document | What it holds |
| --- | --- |
| [How to work with the owner](WORKING-WITH-OWNER.md) | How the owner wants to be shown work and asked questions, and the process mistakes made so far |
| [History](HISTORY.md) | The dated record of reviews, merges and owner decisions since 8 October |
| [Prompts](prompts/) | One dated file per batch of work handed to Gemini, Codex, Grok or a Claude cloud session |
| `docs/testing/` | Test and inspection reports for merged work (draw along, Jali, review decisions) |
| [Your own patterns](USER-PATTERNS.md) | The build log for user-made patterns: tasks, tester reports, lessons |
| [Work queue](patterns/QUEUE.md) | Every piece of pattern work, done and left, with the detail needed to resume it |
| [Pattern status](patterns/STATUS.md) | Every tutorial in the library and how it was verified |
| [Lessons](patterns/LESSONS.md) | Mistakes that cost time once, and facts that save time |
| [ChatGPT Studio issues and lessons](testing/studio-chatgpt-2026-10-21.md) | Connection failures, hidden online projects and finished walls: evidence, causes, fixes and regression checks |
| `docs/geometry-notes.md` | Lessons from the prototype about intersections, motifs and piece finding |
| Plan for user-made patterns (`#/plan`, `apps/player/src/review/Plan.tsx`) | How learners will make their own patterns: the editor, copying at any step, building blocks, the order of the work, and the owner's open questions |
| [How to write a pattern tutorial](patterns/BRIEF.md) | The working method and the tools for adding a pattern |
| `docs/PRD.md`, `docs/TASKS.md`, `docs/tutorial-format.md` | The product, the original task list and the tutorial format |
| `docs/OVERNIGHT.md` | The log of the overnight run of 3–4 October |
| `tools/review/` | The generators and image tools, one folder per design |
| `docs/research/` | Private reference pictures and papers; never shipped |

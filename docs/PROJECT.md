# Start here

This page is the way into the project for the owner and for every new Claude Code session. It says what we are trying to do, where things stand, what comes next, and where everything else is written down. The app shows it, with the other documents it names, at `#/notes` on the dev server.

## The objective

Tastir teaches Islamic geometric patterns one ruler or compass step at a time. The current goal is a rich library: every pattern family with several real designs, each verified against a photo or a published drawing of a real example, drawn exactly with ruler and compass, and shown well by the player (inking by hand, the repeat built tile by tile, colouring piece by piece). Later, learners should be able to make their own designs from a construction.

## Where things stand (16 November 2026)

The only public site is https://tastir-studio.vercel.app, which Vercel deploys from main on every merge. The old GitHub Pages copy (`yahyaal.github.io/tastir`, last built 15 October) was retired on 16 November at the owner's request: Pages is switched off for the repository and its workflow is removed.

The library has 233 tutorial files and ten additional places sharing existing designs. The player teaches construction, ink, repeat and colour; saved designs, drawing along, the editor and five wall styles are implemented. Verification against a real wall is separate from a valid construction: many tutorials still need photographic checks. [Pattern status](patterns/STATUS.md) holds the per-pattern evidence.

The ink overlay is implemented. All ten earlier place merges agree with their archived ink; the Paccard pair and Najjarin/Bou Inania remain separate drawings. The rosette pairs already share four and ten complete opening steps respectively. A review-only Paccard reorder extends the common beginning to seven without changing final geometry. [Visual research follow-up](http://localhost:4200/#/notes/teaching-update) shows the constructions and the destination-guide study. “Guide first” is now the default in the actual lesson: a faint cue on the final construction step, followed by the full inking reveal.

The local working tree now includes two-finger pinch zoom, filter counts that include places, and the corrected Comares construction credit. Phone gesture emulation is checked separately from real-phone acceptance, which remains open in [BUG.1](TASKS.md). The viewer release was merged in PR #16 (`7ca29fa`) and checked on the live site in a phone-sized browser.

The [palette study](http://localhost:4200/#/plan/palettes) shows existing presets and a seven-colour Paccard candidate on the same three walls. Presets and saved designs are unchanged. The owner prefers visual research presentations, including explanatory animation when useful; [working together](WORKING-WITH-OWNER.md) records that standing preference.

Outline is now the single settings design. The alternatives, panel theme picker and comparison page have been removed; old saved panel-theme values no longer affect the interface. The [settings and sharing review](http://localhost:4200/#/notes/settings-update) shows the new segmented choices, switches and visibility action. Share links now carry the viewing choices and framing as well as design appearance. The completed viewer release is published; all seven subsequent reliability repairs are published through PR #17 (`bb6f8c1`), with green Vercel preview/production statuses and a live phone-sized smoke check. Other builders work on their own branches; do not spawn agents unless requested. Feedback rollout still needs the owner’s [deployment settings and real submission check](FEEDBACK-GO-LIVE.md). The assistant, hosted sign-in and live-room details remain in their own setup documents; the former long status is kept in [the archived status](HISTORY-STATE-2026-11-15.md).

The player header now centers the title between compact Previous and Next arrows. Patterns is an icon-only side-menu toggle; Feedback sits beside Settings. Finish actions use filled Next lesson, outlined Save and text-style Copy link with an icon. The earlier phone Share-row improvement remains. [Current before/after screenshot review](http://localhost:4200/__review/renders/player-header-2026-11-16/index.html). Full root tests and final styling/navigation checks passed. The owner requested push and merge following final verification.

Patterns now toggles a real sidebar on wide screens: the drawing makes room, remains usable, and the list stays open while choosing patterns. The desktop open/closed preference is remembered; narrow screens use a drawer. [Sidebar screenshot review](http://localhost:4200/__review/renders/pattern-sidebar-2026-11-16/index.html). Full root checks and 94 desktop/tablet/phone browser checks passed (two intentional phone skips). The owner approved publishing the learning path and all UI changes on 16 November; [GitHub deployments](https://github.com/Yahyaal/tastir/deployments) records release status.

On 17 November three owner reports were fixed: Comares west dado no longer freezes for seconds after its pieces are found (PERF.1), dense patterns' interlace bands thin so crossings read cleanly (STYLE.14), and the Patterns menu has a search box (NAV.1). [Before/after review](http://localhost:4200/__review/renders/interlace-speed-search-2026-11-17/index.html).

Loading followed (PERF.2): the card now appears only past 0.4 s, and patterns just seen or prepared as Next, Previous or under the pointer in the menu open at once.

On 19 November the owner asked for a 3D extension: carved panels, tiles and moulds for the Bambu Lab A1. The [3D plan](http://localhost:4200/#/notes/3d-plan) was approved, and its first task (3D.1, `packages/relief` and `pnpm relief <pattern>`) is done, with three panels to look at linked from the plan. 3D.2 followed the same day: [Make it in 3D](http://localhost:4200/#/eight-fold-star-and-cross/make) on every pattern's finished wall, with downloads for Bambu Studio. 3D.3 added moulds: a rigid mould for plaster that holds exactly the panel, and a box for pouring silicone round a printed master, with the plaster and silicone quantities. 3D.4 cut anything larger than the bed into parts with pin holes along the seams, and added mitred borders. 3D.5 made the bands weave over and under in 3D, and gave them rounded and double shapes. 3D.6 added pierced screens and SVG and DXF lines for laser and CNC. Saved designs and a depth for each kind of piece followed. 3D.7, asked for the same day, prints every piece of a pattern on its own in the wall's colours, with a joint, a bevel and a magnet pocket, packed onto one-colour plates, with a full-size layout and an optional tray. 3D.8 added whole pieces: no piece cut, a zig-zag edge, and on a tile any number of repeats across and down, so a wall can grow set by set. 3D.9 made the download one Bambu Studio project file: double-click it and every plate opens in its colour with the A1's settings. Next is printing on the A1 to check the fits and the look, then the later ideas in the plan.

## The next goal

Try [the working learning path](http://localhost:4200/#/learn), approved by the owner on 16 November after the proposal was explained. The library now offers Start here; finished lessons suggest the next existing tutorial, and kept draw-along boards keep the learner in drawing mode. The twelve lessons preserve their original ratings and visible reference-photo limitations. The owner approved publication after the final sidebar checks. [Implementation and checks](testing/learning-path-2026-11-16.md).

Next, prioritize matching free-photo checks for the opening lessons, read the instructions aloud, and try them with a newcomer. Three candidates have recorded matching free examples; nine still need photo work, including one historical-reference-only image. The [visual evidence review](http://localhost:4200/#/notes/beginner-path) retains the detailed source distinctions. Owner approval authorizes navigation, not a claim that reference checks are complete. The prior reliability release is deployed through [PR #17](https://github.com/Yahyaal/tastir/pull/17).

Physical-phone zoom acceptance, the three older unnamed draw-along reports and controlled authenticated Studio acceptance remain open. Palette selection, shared-step teaching and feedback rollout remain separate follow-ups. New patterns wait while the existing library becomes easier to use.

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
| [Next steps (14 November)](NEXT-STEPS-2026-11-14.md) | The broader order of work, authorized on 15 November; publishing and unresolved product choices remain separate |
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
| [Feedback setup and operation](FEEDBACK-SETUP.md) | Local review, production settings, private inbox, spam limits, retention and manual AI export |
| [Turn on feedback: your remaining steps](FEEDBACK-GO-LIVE.md) | Completed migration/widget preparation and the owner's remaining Vercel settings, deployment and live checks |
| [Pattern feedback plan](FEEDBACK-PLAN.md) | In-app issue reports and comments, private owner review, optional AI handoff, and spam protection; implementation phases F1–F7 |
| `docs/OVERNIGHT.md` | The log of the overnight run of 3–4 October |
| `tools/review/` | The generators and image tools, one folder per design |
| `docs/research/` | Private reference pictures and papers; never shipped |

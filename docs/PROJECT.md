# Start here

This page is the way into the project for the owner and for every new Claude Code session. It says what we are trying to do, where things stand, what comes next, and where everything else is written down. The app shows it, with the other documents it names, at `#/notes` on the dev server.

## The objective

Tastir teaches Islamic geometric patterns one ruler or compass step at a time. The current goal is a rich library: every pattern family with several real designs, each verified against a photo or a published drawing of a real example, drawn exactly with ruler and compass, and shown well by the player (inking by hand, the repeat built tile by tile, colouring piece by piece). Later, learners should be able to make their own designs from a construction.

## Where things stand (15 November 2026)

The library has 233 tutorial files and ten additional places sharing existing designs. The player teaches construction, ink, repeat and colour; saved designs, drawing along, the editor and five wall styles are implemented. Verification against a real wall is separate from a valid construction: many tutorials still need photographic checks. [Pattern status](patterns/STATUS.md) holds the per-pattern evidence.

The ink overlay is implemented. All ten earlier place merges agree with their archived ink; the Paccard pair and Najjarin/Bou Inania remain separate drawings. The rosette pairs already share four and ten complete opening steps respectively. A review-only Paccard reorder extends the common beginning to seven without changing final geometry. [Visual research follow-up](http://localhost:4200/#/notes/teaching-update) shows the constructions and the destination-guide study. “Guide first” is now the default in the actual lesson: a faint cue on the final construction step, followed by the full inking reveal.

The local working tree now includes two-finger pinch zoom, filter counts that include places, and the corrected Comares construction credit. Phone gesture emulation is checked separately from real-phone acceptance, which remains open in [BUG.1](TASKS.md). The viewer release was merged in PR #16 (`7ca29fa`) and checked on the live site in a phone-sized browser.

The [palette study](http://localhost:4200/#/plan/palettes) shows existing presets and a seven-colour Paccard candidate on the same three walls. Presets and saved designs are unchanged. The owner prefers visual research presentations, including explanatory animation when useful; [working together](WORKING-WITH-OWNER.md) records that standing preference.

Outline is now the single settings design. The alternatives, panel theme picker and comparison page have been removed; old saved panel-theme values no longer affect the interface. The [settings and sharing review](http://localhost:4200/#/notes/settings-update) shows the new segmented choices, switches and visibility action. Share links now carry the viewing choices and framing as well as design appearance. The completed viewer release is published; the subsequent reliability repairs are being implemented locally in order. Other builders work on their own branches; do not spawn agents unless requested. Feedback rollout still needs the owner’s [deployment settings and real submission check](FEEDBACK-GO-LIVE.md). The assistant, hosted sign-in and live-room details remain in their own setup documents; the former long status is kept in [the archived status](HISTORY-STATE-2026-11-15.md).

## The next goal

Prioritize a reliability and discoverability pass from [Grok’s live-site review](GROK-REVIEW-2026-11-15.md): reproduce and guard signed-out retries, make editable JSON downloads visible, then fix direct collection links and Unicode search. Region counts are already addressed in the release. Keep prior draw-along reports unconfirmed until tested explicitly. Then resume palette selection, the shared-step teaching proposal, a beginner’s path and feedback rollout. New patterns wait while the existing library becomes easier to enter and trust.

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

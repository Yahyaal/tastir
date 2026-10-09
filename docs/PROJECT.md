# Start here

This page is the way into the project for the owner and for every new Claude Code session. It says what we are trying to do, where things stand, what comes next, and where everything else is written down. The app shows it, with the other documents it names, at `#/notes` on the dev server.

## The objective

Tastir teaches Islamic geometric patterns one ruler or compass step at a time. The current goal is a rich library: every pattern family with several real designs, each verified against a photo or a published drawing of a real example, drawn exactly with ruler and compass, and shown well by the player (inking by hand, the repeat built tile by tile, colouring piece by piece). Later, learners should be able to make their own designs from a construction.

## Where things stand (8 October 2026)

**Read this first if you are a fresh session.** The owner is close to the weekly Claude limit, so Claude now works as an **orchestrator**: it reviews, plans and writes prompts, and **Gemini in Antigravity does the building**. Prompts for Gemini go in `docs/prompts/`, one dated file per batch, each prompt self-contained (it repeats the project's rules), because the owner points Antigravity at the file. Do not spawn builder or tester agents unless the owner asks; they use a lot of the limit.

### In flight right now

Gemini has completed all four prompts from [`docs/prompts/gemini-2026-10-08.md`](prompts/gemini-2026-10-08.md):

1. **Finish task 6.16 on `main`.** (Done, commit `0d2cfac`). Added jsdom tests for colour picking and double "Keep it", verified 0 px board stability on Comares bones in a real browser across desktop, tablet, and mobile, and ticked 6.16 in [the build log](USER-PATTERNS.md).
2. **Ready the UI redesign.** (Done on `ui-redesign`, merged to `main`). Brought `main` in without conflicts; audited upcoming photos to ensure only free Creative Commons photos ship publicly while private photos remain in git-ignored research; renamed the rectangular repeat tutorial to honest claims ("Ten-pointed star and decagon, rectangular repeat") and added a review card; aligned player/draw-along colour legends to orange and blue; unified draw along, editor, and review to the dark atelier style, verifying 0 px board movement on all 13 beginner tutorials across three viewports; cataloged Arabic titles in `docs/prompts/arabic-titles.md`.
3. **Tester pass.** (Done). Thorough pass as a beginner hobbyist on a frozen copy (`c1b8791`) across desktop (1280×800), tablet (1024×768), and phone (390×844). Verified home filters, stepped 3 tutorials, compare-with-original, full draw along flow, editor, and upcoming catalog. Confirmed 0 px board stability, matching colour legends, and rendered verdict: ready to merge.
4. **Merge.** (Done, commit `b00795e`). Merged `ui-redesign` into `main`, verified all tests, lint, and typecheck pass (each exit 0), pushed to `origin main`, and restarted dev server on port 4200.

**Prompt 5 completed (8 October):** Gemini completed and pushed all five items from [`docs/prompts/gemini-2026-10-08b.md`](prompts/gemini-2026-10-08b.md) in individual commits on `main`:
1. **Draw along fits laptop screens without scrolling** (commit `7493dc8`). Removed stage `min-height: 58vh`, compacted tool spacing into two rows; verified in Playwright across all 13 beginner tutorials across 5 screen sizes (1280×800, 1366×768, 1440×900, 1024×768, 390×844) with max movement 0.00 px across all stages (step 1..N, Ink, Repeat, Color) and no scrolling needed on laptop/tablet viewports.
2. **"Welcome back" does not move the board** (commit `5cfb9a9`). Positioned banner as an overlay/toast outside the layout flow; verified 0.00 px board shift before reload, during banner display, and after dismissing.
3. **Fixed 404 images on `#/upcoming`** (commit `ec51454`). Exported `upcomingDrawnSrc` to route drawings through dev review endpoint and hide in production, added worktree fallback in `apps/player/vite.config.mts` to locate `docs/research`, and verified 0 failed requests and 0 console errors in browser.
4. **Al-Maridani photo marked "(cropped)"** (commit `2dd9173`). Added "(cropped)" to caption in `upcoming-patterns.ts`.
5. **Upcoming intro without promises** (commit `382f252`). Replaced batch promises with one plain sentence describing the researched masterwork catalog.

**Next:** Prompt 6 (independent tester pass on a frozen worktree) to be run in a fresh Antigravity conversation so the tester has not seen the code it is judging.

### What is built (6–8 October)

- **UI redesign & Islamic geometric drafting atelier**: Dark atelier theme across Home, Player, Draw along, Editor, and Review. Calligraphic brand mark (تسطير), Moroccan tradition cards and dossiers, upcoming masterwork queue with honest claims and CC credits, and colour legends that match the artwork.
- **Your own patterns** (plan at `#/plan`, tasks 1.1–5.5 in [the build log](USER-PATTERNS.md)): My designs (save your inking and colours), the editor (`#/edit/<id>`: copy a tutorial at any step, or start from nothing; ten ruler and compass tools; symmetry mode; tile, ink, play), building blocks, pattern files and share links. The owner removed the rosette block (it did not look like our rosettes) and asked to focus on beginner patterns; "Send it to the library" is hidden until there is a form.
- **Draw along** (the owner's idea; plan at `#/plan/draw-along`, tasks 6.1–6.16): `#/<tutorial>/draw` on every beginner card and in the player. The learner draws on the left while the tutorial shows the step on the right; the two halves line up and the board never moves; Next is always open; each step is ticked when it is on the board, however it was drawn; hints in three levels and "Draw it for me". Ink with a **pen** (click a dot, then a dot on the same line; copies round the centre are an option, off by default), then **repeat it yourself** (place copies by clicking ghosts or dragging; they snap edge to edge) and colour it if you want; it is kept under My patterns.
- **Helper lines** (construction the pattern never runs along) are **hidden by default**, with a "Show helper lines" setting in the player and in draw along. A helper line that is the only way to find a needed point stays shown and still counts. Steps whose text mentions hidden lines carry a `textWithoutHelpers` (format, schema and a test that none is missing).
- The review page puts its questions first, above Progress, and its links to cards stay on the page.

### Open decisions and things still to do

- **The owner's look** at the new atelier look and draw along on a real browser, especially the Comares bones and repeat it yourself.
- **Where learners send library files**: hidden for now; needs a form or an address the owner chooses.
- **Step texts** were given `textWithoutHelpers` by an agent; the owner has not read them yet.
- **Arabic titles** from the redesign need a native reader (cataloged in `docs/prompts/arabic-titles.md`).
- After all that, the earlier next goal: more Alhambra panels from Brian Wichmann's Tiling Search, each checked against David Wade's photo (candidates and method in [the queue](patterns/QUEUE.md)).

### Older work (to 5 October)

There are 36 tutorials in the library. Each one's status, with what was checked, is in [Pattern status](patterns/STATUS.md). The Alhambra family grew from Brian Wichmann's drawings checked against David Wade's photos; Samira Mian's rosettes and the Cairo minbars are verified; the Bou Inania rosette and wall were judged right by the owner on 5 October.

## The next goal

The owner's look at the new atelier look and draw along, then Arabic subtitles verification, then more Alhambra panels from [the queue](patterns/QUEUE.md).

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
| [Prompts for Gemini](prompts/) | One dated file per batch of work handed to Gemini in Antigravity |
| [Your own patterns](USER-PATTERNS.md) | The build log for user-made patterns: tasks, tester reports, lessons |
| [Work queue](patterns/QUEUE.md) | Every piece of pattern work, done and left, with the detail needed to resume it |
| [Pattern status](patterns/STATUS.md) | Every tutorial in the library and how it was verified |
| [Lessons](patterns/LESSONS.md) | Mistakes that cost time once, and facts that save time |
| `docs/geometry-notes.md` | Lessons from the prototype about intersections, motifs and piece finding |
| Plan for user-made patterns (`#/plan`, `apps/player/src/review/Plan.tsx`) | How learners will make their own patterns: the editor, copying at any step, building blocks, the order of the work, and the owner's open questions |
| [How to write a pattern tutorial](patterns/BRIEF.md) | The working method and the tools for adding a pattern |
| `docs/PRD.md`, `docs/TASKS.md`, `docs/tutorial-format.md` | The product, the original task list and the tutorial format |
| `docs/OVERNIGHT.md` | The log of the overnight run of 3–4 October |
| `tools/review/` | The generators and image tools, one folder per design |
| `docs/research/` | Private reference pictures and papers; never shipped |

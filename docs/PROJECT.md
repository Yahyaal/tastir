# Start here

This page is the way into the project for the owner and for every new Claude Code session. It says what we are trying to do, where things stand, what comes next, and where everything else is written down. The app shows it, with the other documents it names, at `#/notes` on the dev server.

## The objective

Tastir teaches Islamic geometric patterns one ruler or compass step at a time. The current goal is a rich library: every pattern family with several real designs, each verified against a photo or a published drawing of a real example, drawn exactly with ruler and compass, and shown well by the player (inking by hand, the repeat built tile by tile, colouring piece by piece). Later, learners should be able to make their own designs from a construction.

## Where things stand (8 October 2026)

**Read this first if you are a fresh session.** The owner is close to the weekly Claude limit, so Claude now works as an **orchestrator**: it reviews, plans and writes prompts, and **Gemini in Antigravity does the building**. Prompts for Gemini go in `docs/prompts/`, one dated file per batch, each prompt self-contained (it repeats the project's rules), because the owner points Antigravity at the file. Do not spawn builder or tester agents unless the owner asks; they use a lot of the limit.

### In flight right now (9 October)

The second Gemini batch is done and Claude reviewed it on 9 October: checks pass; draw along now fits 1280×800, 1366×768 and 1024×768 without scrolling, and the board never moved through steps, a reload ("Welcome back" is now an overlay), Ink and Repeat (measured on the Comares bones); no 404s on `#/upcoming`; the al-Maridani caption says cropped; the Upcoming intro promises nothing. The independent tester's pass (Prompt 6) was not run; Grok's outsider test below replaces it. Small leftover: the "Welcome back" overlay slightly covers the top of Back and Next at 1280×800.

Three tools now work at once, from [`docs/prompts/team-2026-10-09.md`](prompts/team-2026-10-09.md), each in its own area and branch (nobody pushes `main`; the owner merges after Claude reviews):
- **Codex** (worktree `../Tastir-learning-reliability`): draw along for every tutorial, not only beginners, and the "Draw along" button on all cards.
- **Gemini** (worktree `../Tastir-patterns`, branch `patterns/khatam`): two new eight-fold designs (star and octagon, khatam) verified against free photos.
- **Grok** (its own computer, a fresh GitHub clone): an outsider's test reported as GitHub issues, a hunt for free photos (`docs/research-candidates.md`), and a review of the Arabic titles, in one pull request `grok/free-photos`.

**Reviewed on the evening of 9 October.** Codex's branch is merged: draw along works on all 36 tutorials and every card, and the boards hold still at every stage. It also disabled GitHub Actions at the owner's request, because there is no GitHub Pages site yet. Grok (running in Cursor) did the owner's Bou Inania request as pull request #2, and it is merged. It confirmed the owner's reading that the rosette is twelve-fold, not sixteen. The simpler wall has 18 steps, none hidden, and the ring round each corner star is now cut where the rosette rims cross it, as the photo shows. The owner has not looked at it by eye yet. From pull request #1 only the Arabic review (`docs/arabic-titles-review.md`) was taken. Its photo table and the outsider test (no issues were opened) went back in [the follow-up prompts](prompts/team-2026-10-09b.md), along with four follow-ups for Codex and a prompt for another model to speed up the engine (inking on Bou Inania spends about 5 s in `inkPieces` and `computePattern`). The review page's pictures looked missing because the dev server on port 4200 ran from Gemini's worktree, whose git-ignored `docs/review/` holds render folders for only 9 of 43 tutorials. Codex's first follow-up makes those renders fall back to the main tree.

**Reviewed on 10 October.** Merged:
- Codex's four follow-ups.
- Gemini's 45° turn of Arrayanes and Barca.
- Grok's photo table: the five Alhambra rows are honest "no match" results.

Sent back in [the 10 October prompts](prompts/team-2026-10-10.md):
- **Gemini's photo swap** (uncommitted). It replaced David Wade's photos on five Alhambra tutorials and called all five "verified line-for-line"; only the Reyes stars photo matches.
- **Gemini's two new eight-fold tutorials.** They have no real overlays, and each takes steps 4–9 from Sandy Kurt.
- **Grok's crop pull request #3**, which contains no crop.
- **Grok's outsider test**, still not done.
- **Codex's empty band** above the boards.

The engine prompt has not been started.

**Reviewed on the afternoon of 10 October.** Merged:
- The engine speed-up (identical results; Bou Inania crossings 27 s → 0.07 s).
- Codex's taller boards and app follow-ups.
- Gemini's photo audit (only the Reyes stars free photo kept) and its four simplified tutorials (Bou Inania rosette 1,840 → 465 elements).

The two new eight-fold tutorials stay on `patterns/khatam`: neither overlay matches its photo. Gemini hit its weekly limit.

**Next for Claude:** the follow-ups in [the afternoon prompts](prompts/team-2026-10-10b.md): Ink under one second in the browser, the two eight-fold tutorials, and Grok's empty crop pull request.

### Owner review decisions, 11 October 2026

On `codex/jali`, the owner approved the Jali appearance and suggested separate background/framework colors and material finishes. The owner then approved implementing these controls. Tasks 2.1a and 2.1b now add independent framework/background color pickers, reset, and Stone/Wood/Metal families and eleven finish presets; saving, sharing, thumbnails and SVG/PNG retain them. Older designs keep the original stone defaults. The owner requested fewer clicks and directly visible choices. Material buttons reveal labelled finish swatches, each applied with one click. Custom color buttons open the native picker directly, anchored away from the right edge. Background presets and its custom button are also directly available; material/finish dropdowns and the extra chooser dialog are removed. Stone includes limestone, marble, sandstone and slate; Wood includes oak, walnut and cedar; Metal includes silver, gold, bronze and copper. Each family allows Custom color. Legacy gold/silver designs migrate to Metal with their colors preserved. Task 2.1d adds restrained SVG textures to the framework and finish swatches: stone grain/veins, wood grain, brushed or hammered metal. Desktop/phone and dense-pattern screenshots were inspected; wood and sandstone were softened after the first pass. Full tests, lint/typecheck/build and 24 browser checks pass. See [the texture report](testing/jali-textures-2026-10-11.md). Tasks 2.1a–2.1c pass the final full test suite, lint, typecheck, build and all 18 Jali browser checks. See [the finish report](testing/jali-finishes-2026-10-11.md). The owner also approved keeping `eight-fold-khatam` as an unverified Safavid study, publishing `eight-fold-star-and-octagon` at intermediate level, and keeping `ten-pointed-star-decagon-rect` as an unverified rectangular study. Both eight-fold tutorials are now included on this branch, and all three studies show their historical verification status in the library and player. This overrides the older hold instructions for these drawings; it does not establish a photographic match.

The authentic Darb-e Imam spandrel was already in Upcoming. Its entry now points to Lu & Steinhardt’s Figure 3, removes the unrelated rectangular instructions and generated finished drawing, and labels the remaining preview as schematic. The owner wants public contributions to grow the library later; publishing a construction study and verifying its historical match remain separate decisions. All four review questions are resolved. See [the recorded answers](testing/review-decisions-2026-10-11.md).

### What is built (6–8 October)

**Added on 11 October, branch `codex/jali`:** Task 2.1 adds a Jali stone-screen appearance to the finished wall. Choose Style → Jali at Color, then adjust Lattice. Saved designs, share links, thumbnails and SVG/PNG preserve it; changing back to Tiles restores the colors. The review page has labelled screenshots and an appearance question. See [the implementation and testing report](testing/jali-2026-10-11.md). Geometry and tutorial content are unchanged.

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

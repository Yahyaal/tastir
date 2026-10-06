# Start here

This page is the way into the project for the owner and for every new Claude Code session. It says what we are trying to do, where things stand, what comes next, and where everything else is written down. The app shows it, with the other documents it names, at `#/notes` on the dev server.

## The objective

Tastir teaches Islamic geometric patterns one ruler or compass step at a time. The current goal is a rich library: every pattern family with several real designs, each verified against a photo or a published drawing of a real example, drawn exactly with ruler and compass, and shown well by the player (inking by hand, the repeat built tile by tile, colouring piece by piece). Later, learners should be able to make their own designs from a construction.

## Where things stand (5 October 2026)

There are 25 tutorials in the library. Each one's status, with what was checked, is in [Pattern status](patterns/STATUS.md). The most recent work:

- The minbar of al-Nasir Muhammad in the Citadel turned out to be the same design as the al-Maridani minbar, so `mian-stellated-rosettes` now has two real examples.
- Design H2, the minbar doors from Cairo in the Metropolitan Museum (about 1325–30), built as `minbar-doors-cairo` and checked against the museum's photo. It is Samira Mian's rosette on a hexagonal tile, inked as the doors are.
- Design H1, the al-Maridani minbar in Cairo, turned out to be Samira Mian's stellated rosettes, already in the library. Every inlay of the photo was measured and matches; the tutorial now credits the photo and is marked verified.
- Samira Mian's twelve-fold rosette (square and hexagonal tiles) and her stellated rosettes (activity 8), both credited to her.
- The Bou Inania rosette built her way, in 14 steps. Its tile copies overlap by one band, and each corner holds an eight-pointed star with four identical pieces round it. The owner judged it right on 5 October.
- Design E, the Bou Inania twelve-fold wall, rebuilt as fifteen sets of twelve lines.
- Player transitions that look hand-drawn: inking by ruler, the tile copied into a row and then the rows, colouring one colour at a time, and the tile outline in green that fades.

## The next goal

Add a second Ibn Tulun window grille. The mosque has over a hundred different grilles and the library has one; Wikimedia Commons has straight-on photos of many. Read a different one from its photo, build it, and check the wall against the photo. Details are in [the queue](patterns/QUEUE.md).

After that, take the next unchecked item in [the queue](patterns/QUEUE.md).

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
| [Work queue](patterns/QUEUE.md) | Every piece of pattern work, done and left, with the detail needed to resume it |
| [Pattern status](patterns/STATUS.md) | Every tutorial in the library and how it was verified |
| [Lessons](patterns/LESSONS.md) | Mistakes that cost time once, and facts that save time |
| `docs/geometry-notes.md` | Lessons from the prototype about intersections, motifs and piece finding |
| [How to write a pattern tutorial](patterns/BRIEF.md) | The working method and the tools for adding a pattern |
| `docs/PRD.md`, `docs/TASKS.md`, `docs/tutorial-format.md` | The product, the original task list and the tutorial format |
| `docs/OVERNIGHT.md` | The log of the overnight run of 3–4 October |
| `tools/review/` | The generators and image tools, one folder per design |
| `docs/research/` | Private reference pictures and papers; never shipped |

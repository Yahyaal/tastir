# How to work with the owner

These are the owner's standing wishes about how work is shown and discussed. Each one has the mistake behind it, so the reason is clear. `CLAUDE.md` holds the rules that do not bend; this page adds what was learned while working together.

## Showing work and asking questions

- **Everything for the owner goes on the review page** (`#/review` on the dev server, written in `apps/player/src/review/data.ts`). That covers questions, updates and anything to look at. Markdown in `docs/` is reference, and the terminal only says what changed and where to look. *Why:* the owner finds long terminal text hard to scroll and read, and twice found that a question asked in the terminal was not on the page.
- **Never ask the owner to judge something they cannot see.** If something needs their eye, put a picture on the page with the part marked; otherwise do not raise it. *Why (5 October):* a seam choice in the Bou Inania tile was described in words only, and the owner had no idea what it meant.
- **Questions are short, most important first, and point at pictures.** Name designs with letters (Design A, B…) and mark the parts meant in colour on the picture. *Why:* a question that described a design in words ("two-square stars… ringed by pentagons") was not understood.
- **Explain the way the owner writes:** short connected sentences, each decision with its reason. No fragment lists, no options that were rejected, no jargon without a plain explanation.
- **Keep the Progress section current** (`PROGRESS` in `data.ts`: now, done, next, waiting) after every piece of work.
- **Tell the owner how to see visual work:** the address to open, and what they should see there.
- **Say "done" only when it is done,** then suggest the next goal.

## Doing the work

- **Plan first.** Show a short plan for each task and wait for an OK before writing code (`CLAUDE.md`).
- **One task, one commit,** with the task named in the message. Run `pnpm test`, `pnpm lint` and `pnpm typecheck` first.
- **Check the whole result after every change, not only the part that was fixed.** *Why (5 October):* a fix to the Bou Inania long hexagons broke the corner, giving an incomplete star and two stray triangles, and the owner caught it. After each change, compare the full list of piece shapes with the last version the owner approved, and look at the wall.
- **Keep the owner's corrections exactly.** When the owner says how a shape should be (for example "twelve kites, not four" or "an eight-pointed star with the same piece all round it"), build that and check the piece counts against it.
- **Do not hide work that could not be verified.** Finish it as well as possible, keep it in the library, and ask the owner to judge it on the review page. *Why:* the owner was confused when unverified patterns were moved out of the app.
- **Never `git stash`, or check out other versions of files, while the owner's dev server runs.** *Why:* Vite picked up an old schema during a stash and kept serving it, so two tutorials showed as broken. It happened twice.
- **Resume after interruptions.** If work stops on a usage limit or a crash, pick it up from [the queue](patterns/QUEUE.md) as soon as possible.
- **Ask when the docs and the code disagree;** do not silently pick one (`CLAUDE.md`).

## Standing goals

- Many designs per pattern family, not one. A single construction can give many designs.
- Later, learners make their own designs from a construction (free inking already exists in the player).
- Every design is checked against a real example, and specific sources are credited in the tutorial.
- Palettes: the owner wants a separate conversation about colour palettes some time. The last rework was disliked and reverted, so do not change palettes until then.

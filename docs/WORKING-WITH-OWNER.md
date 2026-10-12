# How to work with the owner

These are the owner's standing wishes about how work is shown and discussed. Each one has the mistake behind it, so the reason is clear. `CLAUDE.md` holds the rules that do not bend; this page adds what was learned while working together.

## Showing work and asking questions

- **Everything for the owner goes on the review page** (`#/review` on the dev server, written in `apps/player/src/review/data.ts`). That covers questions, updates and anything to look at. Markdown in `docs/` is reference, and the terminal only says what changed and where to look. *Why:* the owner finds long terminal text hard to scroll and read, and twice found that a question asked in the terminal was not on the page.
- **Never ask the owner to judge something they cannot see.** If something needs their eye, put a picture on the page with the part marked; otherwise do not raise it. *Why (5 October):* a seam choice in the Bou Inania tile was described in words only, and the owner had no idea what it meant.
- **Questions come first on the review page.** Nothing sits above them except what the owner needs to answer them; Progress and everything else come after. *Why (7 October):* the owner found the questions below Progress.
- **Questions are short, most important first, and point at pictures.** Name designs with letters (Design A, B…) and mark the parts meant in colour on the picture. *Why:* a question that described a design in words ("two-square stars… ringed by pentagons") was not understood.
- **Render a question's picture before asking it.** The pictures under `docs/review/` are not in git, so a question can point at a file that is not there. *Why (12 October):* the filled-wheel colour question showed no picture and the owner could not answer it.
- **Explain the way the owner writes:** short connected sentences, each decision with its reason. No fragment lists, no options that were rejected, no jargon without a plain explanation.
- **Keep the Progress section current** (`PROGRESS` in `data.ts`: now, done, next, waiting) after every piece of work.
- **Tell the owner how to see visual work:** the address to open, and what they should see there.
- **Say "done" only when it is done,** then suggest the next goal.

The owner’s 11 October Jali correction: minimize clicks. Show material choices as buttons and finish colors as directly visible swatches. A Custom color button must open the color picker directly; do not insert another dialog or dropdown when a few visible choices suffice. Apply this principle to later UI work.

## Doing the work

- **When the owner is near the Claude limit, orchestrate.** Plan, review and write self-contained prompts for Gemini in Antigravity in `docs/prompts/<date>.md`, and do not spawn builder or tester agents. *Why (8 October):* the owner is close to the weekly limit and asked for this; prompts in chat are hard to copy, so they go in a file the owner points Antigravity at.
- **Review outside work against the content rules, not only the looks.** *Why (8 October):* a redesign made elsewhere looked good and passed every test, but shipped a private research photo, uncredited photos, and claims ("verified", "world-renowned") that were not true.
- **An action that does more than the learner clicked must show it, or be off by default.** *Why (8 October):* inking a dot on the Comares bones inked several lines in different directions (whole runs plus copies round the centre, both on by default), and the owner could not tell why.
- **The tester must not be the builder.** Run the tester's prompt in a fresh conversation, and check its verdict yourself. *Why (8 October):* Gemini tested its own redesign in the same conversation, called a 38 px board jump "minor" and missed that the board no longer fits a 1280×800 screen.
- **The owner's eye matters most on layout.** Two halves that should match must line up exactly, and nothing may shift between stages. *Why (7 October):* the owner asked for it in the draw-along answers.

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
- Palettes: on 12 October the owner picked columns C and D on `#/plan/colors`: a palette per tradition with clear light, mid and dark steps, and colour by role. Show the new colours on the review page before changing the tutorials' palettes.

# How to work with the owner

These are the owner's standing wishes about how work is shown and discussed. Each one has the mistake behind it, so the reason is clear. `CLAUDE.md` holds the rules that do not bend; this page adds what was learned while working together.

## Showing work and asking questions

- **Screenshot review loop (owner, 16 November 2026).** For UI work, capture the real interface, inspect every screenshot, explicitly ask what would make it clearer, more intuitive and visually appealing, then improve and capture again. Check relevant states and screen sizes in both themes before declaring the pass satisfactory. Complete visual iteration before the expensive final test run. If several directions remain equally compelling, build them as switchable themes with the same real controls and ask the owner to compare them visually. Do not ask the owner to choose from prose descriptions.

- **Preferred feedback format (owner, 15 November 2026): a visual research presentation.** Use the [ink comparison presentation](http://localhost:4200/#/notes/ink-presentation) as the model: explain the question, show what was done, show the evidence and conclusions, then propose the next steps. Keep each slide focused and the drawings beside the explanation. Use interactive comparisons and animations when they make an idea clearer; respect reduced motion and provide manual controls. Keep dense technical notes as supporting references. This is the owner's default preference for substantive reviews and progress reports, rather than long prose reports. Simple factual answers can remain short.

- **Everything for the owner goes on the review page** (`#/review` on the dev server, written in `apps/player/src/review/data.ts`). That covers questions, updates and anything to look at. Markdown in `docs/` is reference, and the terminal only says what changed and where to look. *Why:* the owner finds long terminal text hard to scroll and read, and twice found that a question asked in the terminal was not on the page.
- **Never ask the owner to judge something they cannot see.** If something needs their eye, put a picture on the page with the part marked; otherwise do not raise it. *Why (5 October):* a seam choice in the Bou Inania tile was described in words only, and the owner had no idea what it meant.
- **Questions come first on the review page.** Nothing sits above them except what the owner needs to answer them; Progress and everything else come after. *Why (7 October):* the owner found the questions below Progress.
- **Questions are short, most important first, and point at pictures.** Name designs with letters (Design A, B…) and mark the parts meant in colour on the picture. *Why:* a question that described a design in words ("two-square stars… ringed by pentagons") was not understood.
- **Render a question's picture before asking it.** The pictures under `docs/review/` are not in git, so a question can point at a file that is not there. *Why (12 October):* the filled-wheel colour question showed no picture and the owner could not answer it.
- **Explain the way the owner writes:** short connected sentences, each decision with its reason. No fragment lists, no options that were rejected, no jargon without a plain explanation.
- **Keep the Progress section current** (`PROGRESS` in `data.ts`: now, done, next, waiting) after every piece of work.
- **Tell the owner how to see visual work:** the address to open, and what they should see there.
- **Everything in the app you mention carries its own link, in chat too.** A pattern, a family, a group on a plan page, a review card: give the `http://localhost:4200/#/...` or `https://tastir-studio.vercel.app/#/...` address each time, never only a name, a number or a file path. *Why (14 November, said many times before):* a reply asked about "groups 14 and 15" of the duplicates page with no link, and the owner had no idea what they were.
- **Say "done" only when it is done,** then suggest the next goal.

The owner’s 11 October Jali correction: minimize clicks. Show material choices as buttons and finish colors as directly visible swatches. A Custom color button must open the color picker directly; do not insert another dialog or dropdown when a few visible choices suffice. Apply this principle to later UI work.

## Doing the work

- **Keep verification within the machine’s memory.** Use one test worker and bounded Node heaps, and finish one suite before starting the next. Do not overlap browser suites, unit tests, typechecks and builds. Keep the owner’s app available. *Why (15 October):* the owner reported a crash during overlapping AI-agent checks and asked us to avoid overloading memory.
  *Clarification (21 October):* Nx `--parallel=1` limits concurrent projects, not Vitest workers. Pass `--maxWorkers=1` too; the Studio/Player suites timed out with multiple forks and passed when rerun with one. [Incident and lessons](testing/studio-chatgpt-2026-10-21.md).

- **When the owner is near the Claude limit, orchestrate.** Plan, review and write self-contained prompts for Gemini in Antigravity in `docs/prompts/<date>.md`, and do not spawn builder or tester agents. *Why (8 October):* the owner is close to the weekly limit and asked for this; prompts in chat are hard to copy, so they go in a file the owner points Antigravity at.
- **Review outside work against the content rules, not only the looks.** *Why (8 October):* a redesign made elsewhere looked good and passed every test, but shipped a private research photo, uncredited photos, and claims ("verified", "world-renowned") that were not true.
- **An action that does more than the learner clicked must show it, or be off by default.** *Why (8 October):* inking a dot on the Comares bones inked several lines in different directions (whole runs plus copies round the centre, both on by default), and the owner could not tell why.
- **The tester must not be the builder.** Run the tester's prompt in a fresh conversation, and check its verdict yourself. *Why (8 October):* Gemini tested its own redesign in the same conversation, called a 38 px board jump "minor" and missed that the board no longer fits a 1280×800 screen.
- **The owner's eye matters most on layout.** Two halves that should match must line up exactly, and nothing may shift between stages. *Why (7 October):* the owner asked for it in the draw-along answers.

- **When the owner says to work on while they are away, decide and keep going.** Take your own recommendation, build it, and put the choice on the review page as done, so the owner can revert it; ask only about what cannot be undone, such as pushing to production. *Why (22 October):* the owner asked for an overnight design review with every suggestion made, and woke to a question whose answer was my own recommendation.

- **Plan first.** Show a short plan for each task and wait for an OK before writing code (`CLAUDE.md`).
- **One task, one commit,** with the task named in the message. Run `pnpm test`, `pnpm lint` and `pnpm typecheck` first.
- **Check the whole result after every change, not only the part that was fixed.** *Why (5 October):* a fix to the Bou Inania long hexagons broke the corner, giving an incomplete star and two stray triangles, and the owner caught it. After each change, compare the full list of piece shapes with the last version the owner approved, and look at the wall.
- **Keep the owner's corrections exactly.** When the owner says how a shape should be (for example "twelve kites, not four" or "an eight-pointed star with the same piece all round it"), build that and check the piece counts against it.
- **Do not hide work that could not be verified.** Finish it as well as possible, keep it in the library, and ask the owner to judge it on the review page. *Why:* the owner was confused when unverified patterns were moved out of the app.
- **Never `git stash`, or check out other versions of files, while the owner's dev server runs.** *Why:* Vite picked up an old schema during a stash and kept serving it, so two tutorials showed as broken. It happened twice.
- **Resume after interruptions.** If work stops on a usage limit or a crash, pick it up from [the queue](patterns/QUEUE.md) as soon as possible.
- **Ask when the docs and the code disagree;** do not silently pick one (`CLAUDE.md`).

## UI preferences (owner, 15 November 2026)

When choosing an aesthetic direction, show working visual alternatives. The owner cannot choose between style descriptions alone; provide switchable themes using the same real controls, light/dark comparison and a way to try them in the lesson before selecting one.

The owner’s refinement: combine Mosaic’s blue/teal colours with Precision’s minimal layout and Atelier’s illustrated ink choices; make icons larger and spacing tighter. The owner selected Outline and requested removal of the other settings themes and the theme picker; keep Outline as the single settings design. Toggle labels should distinguish states through colour and weight; do not show On/Off words or check marks. Speed buttons need a clearly filled selection with good contrast, particularly in dark mode. For future aesthetic choices, show working visual alternatives before asking for a decision.

Prefer visible segmented choices for two or three mutually exclusive values, and labelled switches for on/off settings. Use dropdowns only when a better alternative does not fit. Actions must look like buttons and have clear labels; icons supplement the words. Keep keyboard interaction, focus visibility, touch targets and both themes working. Preserve the satisfaction of the final inking reveal: the default lesson mode should show a faint destination guide before that reveal rather than commit ink throughout construction.

The owner’s action-hierarchy preference (16 November): give actions with different importance different visual weight. At the lesson finish, Next lesson is the single filled primary action; Save and Share are secondary. The owner’s refinement: center the current title between Previous on the left and Next on the right; use compact arrows and an icon-only Patterns side-menu toggle. For three finish actions, use filled Next lesson, outlined Save and text-style Copy link with an icon. The owner prefers Patterns as a true show/hide sidebar beside the image on wide screens, with the canvas making room and the toggle remaining available; a list covering the image does not meet that desktop intent. Keep Feedback as an accessible icon beside Settings in the lesson header, and use the shorter Settings tooltip. Keep light/dark contrast, 44px utility targets and keyboard focus visible.

## Standing goals

- Many designs per pattern family, not one. A single construction can give many designs.
- Later, learners make their own designs from a construction (free inking already exists in the player).
- Every design is checked against a real example, and specific sources are credited in the tutorial.
- Palettes: on 12 October the owner chose colouring by rings (`pattern.rings`, `apps/player/src/app/rings.ts`) in four glaze palettes, from their own pictures of real zellige (kept private in `docs/research/zellige/`). Every tutorial now uses it except the Comares bones and Infantas plaster stars. The owner may name more to look at again; show any colour change as before and after on the review page first.

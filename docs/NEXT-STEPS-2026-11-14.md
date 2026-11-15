# Where Tastir stands and what to do next (14 November 2026)

This is a whole-project view written after reading [the review handover](prompts/review-handover-2026-11-14.md), the project documents and the code. It is a proposal for the owner to approve or change, and then a work list for the agents who come next. Nothing here has been built, and no code, tutorial or production setting was changed.

## The short version

The engine, the player and the library are in good shape, and the library has grown from 39 tutorials to 233 in five weeks. Three things have not kept up with that growth, and they matter more now than another batch of patterns.

1. **Nobody outside has used it yet in a way we can see.** Feedback is still switched off in production and the app counts nothing, so the product goals in [the PRD](PRD.md) (60% of learners finish a lesson, ten minutes for twenty steps) cannot be checked.
2. **The library is wide but not yet trusted or easy to enter.** 188 of the 233 tutorials are marked "drawing only" in [the status](patterns/STATUS.md), which means no photo of the real wall confirms them, and half the library (116) is advanced while only 41 lessons are for beginners.
3. **The documents a new agent starts from are out of date,** so each new session spends its first hour finding out what is true.

So the recommended order is: finish the open review, make the documents true, do the palette work the owner asked for, then turn toward real learners (a beginner's path, feedback on, simple counts) before adding more patterns or more assistant features.

## What is strong, and should be kept as it is

- **The five rules in `CLAUDE.md` have held.** No tutorial has a coordinate, every tutorial has a golden test, and the engine stays pure, which is why Codex and other agents could add 190 tutorials without breaking old ones.
- **The pattern pipeline is repeatable.** Reading a Tiling Search drawing, snapping it to an exact grid, building, and checking takes about ten minutes a pattern, and [the lessons](patterns/LESSONS.md) record each mistake once.
- **The duplicates tool is the right idea.** It compares designs by their pieces and not by their look, and it found fifteen groups that the eye had missed. See http://localhost:4200/#/plan/duplicates.
- **The way of working with the owner is written down** in [how to work with the owner](WORKING-WITH-OWNER.md), with the reason for each rule.

## What I found, most important first

### 1. No signal from learners

The PRD's success measures need two things that do not exist: a way for a learner to tell us something is wrong, and a count of lessons started and finished. Feedback is built and waits only for the owner's last steps in [the go-live guide](FEEDBACK-GO-LIVE.md). There is no counting at all in the player. Meanwhile much work went into things only a signed-in owner uses: the hosted Studio, the ChatGPT connection, live rooms and the local assistant. These are good, but none of them tells us whether a beginner can finish a lesson.

### 2. Most of the library is unconfirmed

The status page counts 17 verified, 15 approved, 6 checked by eye against a photo, and 188 drawing only. Codex's photo pass of 1 November could line up only 22 of 59 photos. Only 15 tutorials carry a free photo that may ship. The owner's standing goal is "every design is checked against a real example", so this is the largest gap between the goal and the library. It cannot be closed for all 188, because for many no straight-on photo exists, so the honest fix has two parts: say plainly in the player what "drawing only" means, and spend photo effort on the designs learners will meet first.

### 3. The library is hard to enter

171 of 233 tutorials repeat on a square with four-fold symmetry, because the Tiling Search 45° list was the richest source. Levels are 41 beginner, 76 intermediate and 116 advanced. A beginner opening http://localhost:4200/#/ sees mostly dense advanced rosettes. The PRD's first user is a hobbyist who has seen one wall and wants to understand it, so the library needs a short marked path before it needs more designs.

### 4. Families now mean two things

A Variations family first meant "one design, small changes". Since 13 November it also means "different designs cut from the same pieces". The rule that a tutorial sits in one family at most already caused a wrong result: the Seyyed stars share their four pieces with Khojent and Mosul, but stay out of that family because they already sit in another. See http://localhost:4200/#/khojent-tile-stars/result and http://localhost:4200/#/isfahan-seyyed-stars/result. The second meaning is a fact the duplicates tool can compute, so it should not be kept by hand in the same list as the first.

### 5. The start documents are stale

- [Start here](PROJECT.md) is dated 12 October, its next goal names the finished Alhambra work, and one paragraph about the local assistant is longer than the rest of the page.
- [The status](patterns/STATUS.md) says "updated 12 October" and speaks of "all 39 tutorials"; [the remaining list](patterns/REMAINING.md) says 240 tutorials; the true number is 233 files and 10 places.
- [The queue](patterns/QUEUE.md) keeps finished items as walls of text that a new agent must read past.
- [The tasks](TASKS.md) still show 1.5 and 1.11 unticked although both tutorials exist.
- The Progress block of the review page (http://localhost:4200/#/review) was last updated on 2 November.

### 6. Code that will slow the next agents down

- `packages/project-core` (4,400 lines: colouring, placement, history, the drawing commands) has no test file of its own. The player's tests cover it from outside, but an agent changing it in the Studio or the assistant gets no quick answer.
- `apps/player/src/review/data.ts` is 9,600 lines, and every agent that reports to the owner must edit it. Old cards should move out so the live file stays short.
- `apps/player/src/styles.css` is 5,900 lines in one file, and `Player.tsx` and `DrawAlong.tsx` are about 2,000 lines each.
- The repository has 85 local branches, 83 of them already merged into `main`.
- Lint reports 260 warnings, so a new warning is invisible.
- Two tests depend on how busy the machine is: the Bou Inania stage test (a one-second limit) and the library address test (raised to 90 seconds). Both failed or slowed only while another project's job used eleven processors, and that job is running again today, so I did not run the suites.

## The plan, in order

Each piece below is one task for one agent: what to do, why, and how we know it is done. Pieces 1 and 2 are small and clear the ground. Piece 3 is what the owner asked for. Pieces 4 to 6 turn the project toward learners. Piece 7 can run beside any of them.

### 1. Finish the review the handover asks for

Do the five checks of [the handover](prompts/review-handover-2026-11-14.md) and write `docs/testing/review-duplicates-2026-11-14.md`, because the merged places and resampled colourings are already in production and nobody but their author has looked at them. Three points to add to that brief:

- Run `pnpm test:equivalence` and the two timing tests only when `uptime` shows a load under 2. Record the load beside each result.
- For the two rosette pairs, the piece counts already answer part of the question. `paccard-222-rosette` has 11 piece shapes and `paccard-222-rosette-ring` has 13, so they are two designs and stay a family (http://localhost:4200/#/paccard-222-rosette/result, http://localhost:4200/#/paccard-222-rosette-ring/result). `fes-najjarin-rosette` and `meknes-bou-inania-rosette` both have 20, so they may truly be one design in two places; compare them piece by piece before merging (http://localhost:4200/#/fes-najjarin-rosette/result, http://localhost:4200/#/meknes-bou-inania-rosette/result). Show the owner the differing pieces marked on a picture.
- Check that a search for a place's name, a share link made at a place, and a saved design made at a place each open the place and not the base tutorial.

Done when the review is at `#/notes` and the owner has answered its one question.

### 2. Make the start documents true

Rewrite, do not append, because these pages are read at the start of every session.

- **`PROJECT.md`, "Where things stand".** Cut it to one screen: the library's numbers, how work is done, what is live in production, and what waits on the owner. Move the assistant, Studio, live-room and sign-in paragraphs into their own documents, which already exist, and leave one line and a link for each.
- **`PROJECT.md`, "The next goal".** Proposed text: "The next goal is palettes made from the colourings the owner likes, then a beginner's path through the library and feedback switched on. New patterns wait until then. The full order is in [the next steps](NEXT-STEPS-2026-11-14.md)."
- **`QUEUE.md`.** Proposed "Next goal": the same sentence. Move every ticked item and the long finished Tiling Search logs to `docs/patterns/QUEUE-DONE.md`, so the open work fits on one screen.
- **`STATUS.md`, `REMAINING.md`, `TASKS.md`.** Correct the dates and counts, and tick 1.5 and 1.11.
- **The review page.** Bring Progress up to date, and move cards the owner has answered into an archive file that the page loads only when asked.

Done when a fresh agent can read `CLAUDE.md` and `PROJECT.md` and state the next goal correctly without opening anything else.

### 3. Palettes from the colourings the owner likes

This is the owner's wish of 14 November. A palette today is five slots (`a`, `b`, `c`, `d`, `ground` in `packages/project-core/src/coloring.ts`), and placement rules may also use `e`, `f` and `g`. The liked colourings are richer than five colours: the Paccard rosettes keep seven photo colours in `pattern.original`. So the work has an order.

1. First show the owner what exists. Make a page at `#/plan/palettes` with every current palette as a strip, laid on the same three walls (a simple star and cross, a mid rosette, a dense rosette), and ask which palettes look poor. The owner said "some", and we should not guess which.
2. Then draw the candidates. Take the colours of the four liked rosettes from their `original` and `colors`, sort each into slots by role (the ground, the darkest line colour, the two main fills, the accents), and show each as a new palette on the same three walls, before and after.
3. Only then change code. Give `Palette` the three extra slots as optional colours, with a rule for palettes that lack them (each falls back to a named main slot), because otherwise a seven-colour palette shows only five on most walls and a five-colour palette breaks the rosettes.
4. Check with `placementPalette.spec.ts` and by eye that "The original" still shows the photo colours on all thirteen converted tutorials.

Done when the owner has picked the palettes on the page and every tutorial recolours under each one.

### 4. A beginner's path

Choose about twelve lessons that go from one circle to a full rosette, each adding one idea (dividing the circle, the static square, the star and cross, the first rosette), and show them as a numbered path at the top of the library. This serves the PRD's first user, and it also tells us where to spend verification effort. The path's lessons should all be verified or approved with a free photo, should be the first to get a native reader for the Arabic titles, and should be the ones read aloud for clear step text. Present the proposed twelve to the owner as a row of linked pictures on the review page before building anything.

Done when a new visitor sees "Start here" with lesson 1 first, and each lesson ends by offering the next.

### 5. Switch on the signal

- **Feedback.** The owner follows the remaining steps of [the go-live guide](FEEDBACK-GO-LIVE.md). An agent can sit beside them, but the Vercel settings are the owner's to enter.
- **Counts.** Add the smallest possible counting: lesson opened, last step reached, ink done, colour saved or exported, with no cookies and no personal data. This needs the owner's decision first, because it sends something from the learner's browser, so it is the one question at the end of this page.

Done when the owner can open one page and read last week's started and finished lessons per pattern.

### 6. Say what "drawing only" means, and confirm the path first

Show the verification state on each pattern page in one plain line, for example "Drawn from a published drawing; not yet compared with a photo of the wall", using the status the tutorial already has. Then work through photo checks in this order: the beginner's path, the designs with a Wade photo that Codex could line up in part, and last the rest. Stop adding Tiling Search patterns until the first two groups are done, because the library is already wider than we can confirm.

Done when no pattern page lets a learner think an unconfirmed drawing is a confirmed wall.

### 7. Housekeeping that makes later work cheaper

These are independent and small, so any agent can take one between larger pieces.

- **Tests for `project-core`.** Start with `placement.ts` and `coloring.ts`, since the palette work is about to change both.
- **Timing tests.** Move the Bou Inania stage test and the library address test to `pnpm test:perf`, where the other timing tests already live, so `pnpm test:browser` passes or fails for real reasons only.
- **"Built from the same pieces" as a computed row.** Let the build write, from the duplicates tool's first level, which designs share all their piece shapes, and show that as its own row under Variations. Then a design such as the Seyyed stars can be a variation in one family and still be listed beside Khojent and Mosul, and nobody has to keep the list by hand. The hand-written `notes` stay, attached to the pair.
- **Run the duplicates tool as a check** when a tutorial is added, and fail when a new tutorial matches an old one at the second level and is neither a place nor in its family.
- **Branches.** List the 83 merged local branches for the owner and delete them on a yes.
- **Lint.** Clear the 260 warnings folder by folder, then make warnings fail.
- **Split `styles.css`** by page, keeping the colour variables in one file, because the rule "every colour is a variable" is easier to hold when the variables are easy to find.

## What should wait

- **More patterns.** The large panels over 1,000 pieces, the finer-angle lists, and the parked Córdoba, Generalife and Ibn Tulun designs stay parked until pieces 4 to 6 are done. The exception is a pattern the beginner's path turns out to need.
- **The four wall styles recommended for dropping** (tasks 2.2, 2.4, 2.5 and 2.6 in [the tasks](TASKS.md)). Recommend closing them as dropped, since they have waited a month for a decision and five styles already ship.
- **The assistant's local release (AI.4), the hosted ChatGPT sign-in, and live rooms (H7).** Each works for the owner today. Freeze them where they are until there are learners, because each new feature there adds tests and documents that every later change must carry.
- **Community contributions.** This needs feedback on, the verification line of piece 6, and the duplicates check of piece 7 first, since those three are what make an outside design safe to accept.

## Rules for the agents who take this on

1. Read `CLAUDE.md`, [Start here](PROJECT.md), [how to work with the owner](WORKING-WITH-OWNER.md) and this page, then take one numbered piece, show a short plan and wait for the owner's OK.
2. Everything shown to the owner carries its own link, and anything they must judge carries a picture with the part marked.
3. Run checks one project at a time with one worker, and look at `uptime` first; a timing result under load proves nothing.
4. Before adding or merging a tutorial, run `tools/duplicates.mts` and read http://localhost:4200/#/plan/duplicates. The same pieces in the same amounts with the same neighbours is a place; the same pieces laid out differently is a related design; a small change to one design is a variation.
5. Rules name palette slots and never hex colours, and a colour change goes on the review page as before and after before it goes anywhere else.
6. Nothing is pushed, deployed or deleted without the owner's yes in chat.

## What I did not check

I did not run the test suites, because another project's job was using eleven processors (load 13.8) and the results would not have been trustworthy. I did not open each merged place beside its photo; that is piece 1. The numbers on this page come from the tutorial files, `STATUS.md` and the code as of commit `7496447`.

## The decisions needed from the owner

1. **Is this order right:** palettes, then the beginner's path and feedback, with new patterns waiting?
2. **May the player count lessons started and finished,** with no cookies and nothing personal?
3. **May the four undecided wall styles be closed as dropped?**

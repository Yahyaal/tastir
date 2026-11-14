# Handover: review the duplicates work and guide the next agents (14 November 2026)

You are reviewing work another Claude session did on Tastir between 13 and 14 November 2026, and then writing guidance for the agents who come next. The repository is at `/home/yahya/Documents/projects/Tastir`, on `main`. Treat this as a review: read, run and judge; do not change code, tutorials or production unless the owner asks you to after reading your review.

## Read first

1. `CLAUDE.md`, then `docs/PROJECT.md` (the way in), `docs/WORKING-WITH-OWNER.md` (how the owner wants work shown, with the mistakes behind each rule) and `docs/patterns/LESSONS.md` (the last section, "Duplicates, places and families", is from this work).
2. `docs/NIGHT-REPORT-2026-11-14.md`, the report the owner read, and the first two items of `docs/patterns/QUEUE.md`.

Three owner rules matter most here. Every pattern, page or group you mention to the owner carries its own clickable link (`http://localhost:4200/#/...` on the dev server, `https://tastir-studio.vercel.app/#/...` in production), never only a name, number or file path; the owner has asked for this many times. Write in short connected sentences, each decision with its reason, and no lists of rejected options. Nothing is pushed or deployed without the owner's OK in chat.

## What was done

All of it is on `main` and deployed to https://tastir-studio.vercel.app (Vercel deploys on every push to `main`). The commits, oldest first, are `ab9531a` to `b966976`; `git log --oneline c6687c8..b966976` lists them.

- **A duplicates tool and page.** `tools/duplicates.mts` cuts every tutorial into pieces with the engine and compares them at three levels (same piece shapes; also the same share of the wall; also the same neighbours). It writes `apps/player/src/review/duplicates.json`, shown at http://localhost:4200/#/plan/duplicates (`apps/player/src/review/DuplicatesPlan.tsx`). It found 15 groups.
- **Palette slots in placement rules** (`51160b0`). Rules named hex colours, so Ben Youssef ignored every palette. Thirteen tutorials were converted to slots, with extra slots `e`, `f`, `g` (`packages/project-core/src/coloring.ts`, `placement.ts`) and the photo colours kept as `pattern.original`. `apps/player/src/app/placementPalette.spec.ts` guards it.
- **Places** (`ac3b7bd`, `6684c9c`). The same design in several buildings is now one tutorial with a `places` list: schema in `packages/schema/src/lib/tutorial.ts` and `places.ts` (`atPlace`), library expansion in `apps/player/src/app/library.ts` and `apps/player/src/build/catalog.tsx`, a "Seen at" switcher in `apps/player/src/app/Variations.tsx`. Ten tutorial files were merged into seven base tutorials (groups 1 to 7); their old addresses still open, for example https://tastir-studio.vercel.app/#/ben-youssef-star-rosettes/result. Each merged colouring was resampled onto the base tutorial's tile and compared piece by piece (0 differences reported). Comares, Gowhar Shad and Itimad now show turned by 45°, because they use the base construction.
- **A Repeat fix** (`5808774`, `rowBasis` in `apps/player/src/app/drawing.tsx`): Agra Fort band rows showed a large gap because the row vector pointed the wrong way on a wide tile.
- **Variations families with notes** (`b675fd2`, `e49501c`). Different designs built from the same pieces became families in `apps/player/src/app/variations.json`, each member with one sentence (`notes`): the eight-fold khatam (group 8), Charbagh (9), stars-crosses-pentagons (10), Khojent and Mosul (11), Bourgoin's octagons (12) and the ten-fold Çamlıca set (13). Groups 14 and 15 were already families.
- **Faster tests** (`04d7797`). The two frozen-engine equivalence specs moved out of `pnpm test` into `pnpm test:equivalence` (about 35 minutes); `pnpm test:affected` runs only the projects a change touches. The engine run fell from 23 minutes to about 7.

## Known open points

- `pnpm test:equivalence` has **not** been run since these changes. No engine geometry changed, but places and resampled colourings touch tutorials, so run it once.
- The browser test "bou-inania-rosette: stages open promptly…" fails at 1.5 to 1.8 s against a 1 s limit. It failed the same way before this work, while another project's Python job (`sq_phase7.py`) kept the load at 14 to 16. Check whether it passes on a quiet machine.
- The owner sees `paccard-222-rosette` and `paccard-222-rosette-ring` as one design in two colourings, and the same for `fes-najjarin-rosette` and `meknes-bou-inania-rosette`; the tool counted different pieces in each pair. Neither family has notes.
- The owner wants colourings they like (those rosettes among them) turned into palettes, because some current palettes look poor to them. This is the likely next piece of work.
- `docs/PROJECT.md` is stale in places: "Where things stand" is dated 12 October, and the queue's "Next goal" still names the Alhambra Tiling Search work, which is finished.

## What to review

1. **Correctness of the merges.** For each place, open the base and the place in the player and compare with the photo or source named in its credits. Check that the resampled colourings and the 45° turns are acceptable, that `credits` name the right sources for each place, and that `docs/patterns/STATUS.md` matches.
2. **The places design.** Is `atPlace` the right shape for the format (`docs/tutorial-format.md` documents it)? Look for gaps: search, the library filters (`browsing.ts`, `LibraryMenu.tsx`), share links, saved user designs, the studio and the assistant (`copyUpTo`, `tutorialOf` drop places; is that right everywhere a tutorial is copied?).
3. **The family decisions.** Are groups 9 to 13 sensibly grouped, and are the notes true to what the walls show? Is "one family per tutorial" still the right rule now that families mean two things (variations of one design, and designs sharing pieces)?
4. **The palette-slot conversion.** Does every converted tutorial still look like its photo under "The original", and do all palettes now recolour it?
5. **Tests.** Is anything important no longer in `pnpm test` now that equivalence is opt-in? Are the new specs strong enough, and is the 90 s limit on the library address test hiding a real slowdown?

Run checks one project at a time, with one worker, because the machine ran out of memory on 13 October: `pnpm typecheck`, `pnpm lint`, `pnpm nx run engine:test`, `pnpm nx run player:test`, then `pnpm test:browser`, then `pnpm test:equivalence`. Never `git stash` or check out other file versions while the dev server runs (`pnpm dev`, http://localhost:4200).

## What to deliver

Write your review to `docs/testing/review-duplicates-2026-11-14.md`: findings first, most serious first, each with the link that shows it and a recommended fix; then the results of the checks you ran; then **guidance for the next agents**, covering how to use the duplicates tool when adding tutorials, when to make a place versus a family, how to start the palette work, and which stale parts of `docs/PROJECT.md` and the queue's next goal should be rewritten (propose the text; let the owner approve it). Add the review to the notes page (`DOCS` in `apps/player/src/review/Notes.tsx`, and its file to the `import.meta.glob` list there) so the owner can open it at `http://localhost:4200/#/notes/...`. Commit only that document and the notes entry, on a branch named `review/duplicates`, and do not push.

When you finish, give the owner a few short lines in chat: what you found, the link to the review on the notes page, and the one decision you most need from them.

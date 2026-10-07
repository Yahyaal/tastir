# Your own patterns: the build log

This is the working log for building the plan at `#/plan` (written in `apps/player/src/review/Plan.tsx`): learners make their own patterns, by saving their own inking and colours, by copying a tutorial at any step, from nothing, and from building blocks. The owner approved the plan and its order on 6 October 2026 and asked for it to be built by two agents, a builder and a tester who uses the app like a person and reports what goes wrong.

**If work stopped (a usage limit, a crash), resume here:** take the first unticked task below, read its notes and the latest tester report at the bottom, and carry on. Every finished task is ticked, committed with its number in the message, and pushed.

## The owner's decisions (6 October 2026)

The phases go in the order below. Every user pattern is a true ruler and compass construction: the editor only lets you click points that exist, and there is no free drawing. Patterns are kept in the browser first, then as a file and a share link; accounts come later, with a server. Good user patterns may join the library after review on the review page, with a golden test and the maker named in the credits. We use the editor ourselves to make library tutorials.

## How the two agents work

The builder takes one task at a time, shows nothing to the owner until it works, runs `pnpm test`, `pnpm lint` and `pnpm typecheck`, commits with the task number (“User patterns 1.2: …”), pushes, ticks the task here and adds anything learned to the lessons at the bottom. The builder never runs `pnpm format` over the whole repo (it rewrites the tool JSON in `tools/review/`); it runs Prettier on the files it changed.

The tester starts its own dev server on a spare port (never the owner's on 4200), drives the app in headless Chromium with `playwright-core` from `~/.cache/tastir-tester/` (the browser is `~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`), and goes through each finished phase the way a learner would, from the home page, by clicking. It writes a dated report at the bottom of this file: what it tried, what worked, what was confusing or broken, with screenshots saved under `docs/review/user-patterns/` (ignored by git). The builder fixes what the report finds before moving on.

## Tasks

### Phase 1: My designs

- [x] **1.1 The design store.** `apps/player/src/app/designs.ts`: a design is `{ id, name, tutorial, inked (piece ids, or none for the tutorial's own inking), coloring, look, grout, created, updated }`, kept in localStorage under `tastir.designs`; reads and writes never throw (private windows). *Test:* save, list, rename, delete, round trip, a corrupt store reads as empty.
- [x] **1.2 Save from the player.** “Save as my design” at the ink and colour stages asks for a name in the page (no browser prompt). A design opened from its address `#/<tutorial>/design/<id>` starts at the wall with its inking and colours, and offers “Save” and “Save as new”. If its inked pieces no longer exist in the tutorial, it opens with the tutorial's own inking and says so. *Test:* re-ink and recolour, save, remount, open: the same pieces and colours.
- [x] **1.3 The shelf.** A “My designs” shelf above the library when there are any, each design drawn as its wall, with rename and delete (delete asks first). *Test:* the shelf lists saved designs, opens one, and deletes one only after confirming.

### Phase 2: the editor, from a copy

- [ ] **2.0 Inking along a line.** A format change so an ink path can name a line (or polygon side) and the two elements it runs between, so free inking can be written back as ink paths without marking steps. Update `docs/tutorial-format.md`, the schema and the engine; every tutorial's golden test still passes.
- [ ] **2.1 Picking a crossing by rule.** Engine: given two elements and the crossing clicked, the simplest pick rule that names it and no other (angle, nearest or farthest from O or a named point, inside or outside a circle), checked by evaluating. Also the step dependencies (which later steps are built on a step). *Test:* every point in the library's tutorials gets a rule that picks it back.
- [ ] **2.2 The editor's document.** A pure TypeScript model of a user tutorial being edited: add, change, delete and move steps; every edit re-evaluates; a broken step carries the engine's reason; removing the steps that depend on one. Auto-names and plain step text for each tool. *Test:* each operation, and a broken step after an edit upstream.
- [ ] **2.3 The editor page.** `#/edit/<id>`: the step list, the drawing with the tool bar (compass, same opening, opening from two points, touching, ruler, square to, parallel, halve an angle, polygon), clicks snap to existing points only, the step text is editable, undo and redo. *Test:* draw the first three steps of the star and cross by clicking.
- [ ] **2.4 Make my own copy from here.** On every step of the player; the copy keeps the steps so far and the credits, plus “based on” the original. *Test:* copy the star and cross at step 3, the editor opens with three steps.
- [ ] **2.5 Tile, ink, colour, play.** The tile tool (checks the tile can repeat), inking with symmetric toggling written as ink paths, colouring, and Play, which opens the pattern in the player like any tutorial. *Test:* the octagon-and-star example from the plan, played start to finish.
- [ ] **2.6 Library-grade files.** The editor can fill in what only library tutorials have (credits, photos, level, style) and computes the expected pieces, so we can make library tutorials in it. *Test:* a file saved from the editor passes the golden test.

### Phase 3: from nothing

- [ ] **3.1 New pattern.** “New pattern” opens the editor with only O and A.
- [ ] **3.2 Symmetry mode.** Off, 4, 6, 8, 12, 16: every new element is also repeated round the centre. *Test:* rebuild the eight-fold star and cross from nothing; its file passes the same golden test as ours.

### Phase 4: building blocks

- [ ] **4.1 The block format and insertion.** A block is a few steps with named inputs; inserting it fills the inputs from clicks and adds ordinary steps.
- [ ] **4.2 The starter shelf.** Divide a circle by 4, 6, 8, 12 and 16; the static and dynamic squares; a ring of touching circles; the square and hexagon tile round a circle; A. J. Lee's rosette.
- [ ] **4.3 Save my steps as a block.** *Test:* insert “Divide a circle into eight” on a drawn circle; its three steps appear, each undoable.

### Phase 5: share

- [ ] **5.1 File.** Download a pattern as a file and open one.
- [ ] **5.2 Link.** A share link that carries the whole pattern in the address. *Test:* the link opens the same pattern, wall and colours in another browser.
- [ ] **5.3 Send to the library.** Makes the library-ready file with the maker in its credits and explains how it reaches the review page.

## Lessons

- `pnpm format` rewrites the JSON in `tools/review/` (thousands of lines of line breaks), which then looks like real changes; run Prettier only on the files you changed. (6 October)
- The player steps on Space and the arrow keys from a window listener, so any text box in the player must be skipped there, or typing a design's name steps the tutorial. (6 October)
- A design's wall needs its inked pattern, which is slow for big tutorials, so the worker makes it: `useModel(json, inked)` sends the pieces with the tutorial and the worker applies `withInking` (model.ts) before replying. The player itself still re-inks on the main thread, as free inking always did. (6 October)

## Tester reports

(None yet.)

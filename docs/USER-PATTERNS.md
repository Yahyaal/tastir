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

- [x] **2.0 Inking along a line.** A format change so an ink path can name a line (or polygon side) and the two elements it runs between, so free inking can be written back as ink paths without marking steps. Update `docs/tutorial-format.md`, the schema and the engine; every tutorial's golden test still passes.
- [x] **2.1 Picking a crossing by rule.** Engine: given two elements and the crossing clicked, the simplest pick rule that names it and no other (angle, nearest or farthest from O or a named point, inside or outside a circle), checked by evaluating. Also the step dependencies (which later steps are built on a step). *Test:* every point in the library's tutorials gets a rule that picks it back.
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
- A pick rule must be checked against the crossings the engine sees, so `pickFor` (engine `picking.ts`) only proposes rules and then evaluates each with `crossingOf`, the same code a point step runs; `angle: 90` can pick a crossing at 45° when the other is at 225°, so the crossing's own round angle is tried first. (6 October)

## Tester reports

### Phase 1, tester report (6 October 2026)

I went through phase 1 as a learner, by clicking from the home page at 1280x800 and on a phone (390x844), with my own server on port 4351. On the eight-fold star and cross I used “Make your own” to ink the inner square, which turned the star into a square and four triangles, recoloured the pieces, saved the design as “Pointy star” and reloaded. On the Comares bath stars I re-inked a few lines and saved from the ink stage, then recoloured and pressed Save. On the Bou Inania rosette I recoloured and changed the wall style before saving. I then opened each design from the shelf, used Save and Save as new, renamed designs and deleted them. I also tried an empty name, a 300-character name, Escape, a design address that does not exist, a corrupt and a half-corrupt `tastir.designs`, storage whose `setItem` throws, storage that is really full, a page where reading localStorage throws, and designs whose inked lines no longer exist. Screenshots are in `docs/review/user-patterns/phase1/`.

Most of it works well, and I could not make the app crash. The save form sits in the page, starts with the tutorial's name selected and saves on Enter, and typing spaces in it does not step the tutorial. After saving, the address becomes `#/<tutorial>/design/<id>` and a clear line says where the design went (18). The shelf shows each design as its own wall, with my inking and colours drawn correctly for all three tutorials (19c, 36, 39), and the designs survive a reload. Opening a design lands on the wall with the right pieces, colours, palette and wall style, and the ink stage shows my inking (20, 21, 37, 40). From the shelf, the Comares design opened in about 0.2 s and the Bou Inania design in about 0.9 s. On the shelf, the Bou Inania wall took about 2.7 s to draw, with a striped placeholder and “Checking the tutorial…” in the meantime (35). Save updates the design in place and Save as new suggests “Pointy star (2)” and makes a second card. Delete asks inline (“This cannot be undone”, Delete in red, Keep it), Keep it keeps the design, and deleting the last design removes the shelf (27). An empty or blank name disables the Rename button. A corrupt or wrong-shaped store reads as no designs, and the good designs in a half-corrupt store still show. When storage cannot be read at all, the home page and the player still work. A stale design opens with the tutorial's own lines, keeps its colours, and explains why in orange (48). The phone layout has no sideways scroll, and the shelf, the opened design and Save as new all work there (56). I saw no console errors or page errors anywhere.

**Real bugs**

1. **Saving fails silently when the browser refuses to store.** To reproduce, block or fill storage (I made `setItem` throw, and in a second run I really filled the localStorage quota), go to the ink stage, press Save as my design, type a name and press Save. I expected a message saying the design could not be kept, for example “This browser would not save it (private window or storage full)”. Instead nothing happens: the form stays open, the address does not change and nothing explains why, so a learner presses Save again and again (45, 50). The app does not crash, which was promised, but a learner in a private window loses their work without knowing it.
2. **Escape does not close the rename box.** To reproduce, press Rename on a shelf card, type something and press Escape. I expected Escape to cancel, as Cancel does. The box stays open with the typed text, and only the Cancel button closes it (24).

**Suggestions**

3. A missing design is shown like a crash. Opening `#/eight-fold-star-and-cross/design/doesnotexist` shows the title “This pattern cannot be shown” and the reason in red monospace text on an empty page (41). The reason itself is good (“Designs are kept only in the browser they were made in”), but the page should look like an ordinary message and offer “Open the tutorial” beside “All patterns”. The same message appears when a real design id is put after the wrong tutorial, where “not saved in this browser” is not true.
4. Names have no length limit. A 303-character name is accepted and wraps to ten lines on the shelf card, which pushes its buttons down and breaks the grid (26). A limit of about 60 characters, or cutting the name to two lines with an ellipsis, would fix it.
5. The My design box is hard to find on big tutorials. At the colour stage it comes after every piece row, which is 14 rows on the Bou Inania rosette, so on a laptop and on a phone you must scroll the side panel to find Save (40, 56). An opened Comares bath design also shows the original photo first, which pushes the box further down (37). Putting My design above the colour list, or keeping the Save buttons in view, would help.
6. Nothing says when there are unsaved changes. After opening a design and recolouring, Save looks the same as before, and leaving through All patterns drops the changes without a word. A small “unsaved changes” note, or Save enabled only when something has changed, would make it clear.
7. A store that does not parse is overwritten on the next save. With a corrupt `tastir.designs`, the next save replaces it with a list holding only the new design. For random garbage this is fine, but if it ever happens because of a future format change, the learner's older designs are wiped silently. Keeping the unreadable value under a backup key before writing would be safer.
8. On a fresh visit the shelf is below the fold at 1280x800, under the hero (19). A returning learner has to scroll to find their designs, so a “My designs” link near the top would help.
9. Not phase 1, but seen while testing: the colour stage shows internal piece names such as “cross_arm”, “small_star”, “outer2” and “shield2” in the piece list and in the step text (34, 40).

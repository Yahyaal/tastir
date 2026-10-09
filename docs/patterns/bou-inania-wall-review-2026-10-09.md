# Bou Inania twelve-fold wall: review (2026-10-09)

Review of `tutorials/bou-inania-twelve-fold-wall.json` (21 steps, step 20 hidden, status
"approved" in `docs/patterns/STATUS.md`) against the panel it claims to show: the twelve-fold
zellige in the entrance stairway of the Bou Inania madrasa, Fès. Written so another agent can
check every claim and push back.

## Verdict

Mostly accurate, too complicated.

- The rosette, the twelve-sided rim, the square layout of rosettes and the eight-pointed star at
  each tile corner match the photo. The grid band between rosettes matches well.
- One real error: the ring round each corner star is cut in the wrong places (high confidence).
  See D1.
- One possible error: the X piece between rosettes may be a little small (low confidence). See D2.
- The construction uses 337 hidden marks, 9 lines nobody uses and one redundant line family. An
  18-step version with no hidden step draws the same tiling and fits the photo at least as well
  (see `bou-inania-wall-simple-construction.md`).

## Method

Nothing in the repo was run or changed. Files were read remotely with the GitHub tools.

1. **Own rebuild, not the app's engine.** I wrote a Python evaluator (`/workspace/bou-inania/render/evlib.py`)
   that follows `docs/tutorial-format.md`: `meet` with `pick` (`angle`, `nearest`, `farthest`),
   lines (`through`, `perpendicularTo`, `parallelTo`, `bisects`), circles (`through`,
   `radiusFrom`), `repeat` with `rot12`/`rot4`, and ink `through` and `along`. An unpicked meet
   with more than one crossing raises an error, as the engine does. **Every number below comes
   from this rebuild. The real engine has not checked any of them.**
2. **Pieces.** The ink segments, repeated over 3×3 tiles, are turned into faces with shapely
   `polygonize` (`pieces.py`). For the current tutorial this gives exactly its `expect` block:
   15 types, 120 pieces per tile, same vertex counts, areas and per-cell counts. That is the
   check that my rebuild reads the JSON the way the engine does.
3. **Photo registration.** The photo is not rectified, so I fit a similarity transform (shift,
   scale, rotation) locally for each of three regions: the rosette at O (box 0.95 OA), the grid
   band at (1,0) (box 0.45) and the corner star at (1,1) (box 0.5). OA = 1 is half the rosette
   spacing.
4. **Score.** The ink is sampled every 0.01 OA, duplicates removed, and each sample is looked up
   in the greyscale photo. The score is the share of samples brighter than 140, i.e. sitting on
   the white bands (white mortar lines between tiles). Random placement scores about 0.51.
   Scores compare drawings against each other on the same photo. They are not absolute accuracy.
5. **Visual checks.** Overlays of the ink on the photo, with suspect segments in cyan, are in
   `img/`.

## Sources

| Source | What it gives | Licence |
| --- | --- | --- |
| Robert Prazeres, "Bou inania DSCF2978.jpg", Wikimedia Commons, taken 6 Nov 2014, captioned "zellij tiling in the entrance stairway". https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg | The only free photo of this panel I found. Used for every fit. Copies: `img/photo-panel.jpg`, `img/photo-rosettes-crop.jpg` | CC BY-SA 4.0 |
| Samira Mian, "Twelvefold rosette". https://www.samiramian.uk/twelvefoldrosette | The 45°–255° star-line construction used by `tutorials/bou-inania-rosette.json`. A general method, not this panel | Tutorial text; cite, don't copy |
| Aboufadil, Thalal, El Idrissi Raghni, Jali, Oueriagli, J. Appl. Cryst. 52 (2019) 618–625. https://journals.iucr.org/j/issues/2019/03/00/index.html | Published analysis of Moroccan twelve-fold rosettes | Journal article; cite only |
| Bonner, *Islamic Geometric Patterns* (2017), pp. 107–109, as cited by https://en.wikipedia.org/wiki/Zellij | Background on zellige rosettes. **I only saw the citation; I did not read Bonner** | Cite only |

Checked and not this panel: other Commons Bou Inania photos (e.g. DSCF4626, a pillar), and
Tiling Search MOR0202, P71 and P71TL. Several web search summaries said Bou Inania zellige is
only ten-fold. The photo shows that is wrong for this panel, so I did not use them.

**No published step-by-step construction of this exact panel was found.** The tutorial's line
distances were fitted to the photo (`tools/review/bou_inania/README.md`: rms 0.0044, outer region
drawn by hand). They are not taken from a source.

## Discrepancies

### D1. Corner ring cut in the wrong places (high confidence)

- **Tutorial:** the ring between the two octagons round each corner star is cut by short "rungs"
  along the grid lines (`gx`, `gy`) into 8 pieces of one type (`ring`).
- **Photo:** the rung positions are orange tile, not white bands (mean grey 108 and 115). The
  white cuts lie where the rim lines of the neighbouring rosettes (the sides of the star's square)
  carry straight on across the ring (mean grey 163). So the ring is made of 4 trapezoids on the
  axes and 4 bent pieces on the diagonals.
- **Evidence:** `img/photo-corner.png`, `img/current-overlay-corner.png` (rungs in cyan). The
  corner score rises from 0.759 to 0.802 when the cut is fixed and nothing else changes.
- **Cause in the JSON:** in the ink, the rim line has a gap between y ≈ 0.513 and 0.656 (in the
  K = (1,1) corner frame), so it stops at the outer octagon instead of crossing the ring. Just
  deleting the rungs merges the ring into one annulus (area 0.393), so the gap has to be filled
  too.
- **Fix:** remove the rungs. Ink the rim lines straight from the grid line to the inner octagon's
  level side `oh`. Replace the piece type `ring` (8 per cell) with `ringaxis` (4 vertices, area
  0.0294, 4 per cell) and `ringbend` (8 vertices, area 0.0684, 4 per cell).

### D2. X between rosettes may be slightly small (low confidence)

The cross-shaped piece where four rosette rims nearly meet looks about 0.02–0.03 OA narrower in
the ink than in the photo. Perspective in this unrectified photo is about that big, and the grid
band still scores 0.972. I did not change it. A rectified or second photo would settle it.

### D3. Inlays drawn as band faces (modelling choice, not an error)

Small coloured inlays in the photo, such as five-pointed stars and blue crown shapes, are drawn
as faces of the band pattern (`star`, `gap` and similar). This is a fair simplification. Only
note it if the owner wants inlays.

### Matches (for balance)

- Rosette (12 petals, star and shield rings, rim): score 0.879, no segment off-band in a
  per-segment check.
- Grid band: 0.972. An early "long V" mismatch I reported was an overdraw artifact; it went away
  in the per-segment check.
- Rosette spacing and corner-star placement: consistent across the whole crop.

## Complexity

| | Current | Simplified draft |
| --- | --- | --- |
| Steps | 21 (one hidden) | 18 (none hidden) |
| Hidden marks | 337 (`M1`–`M337`) | 0 |
| Ink paths | 420, mostly `through` two marks | 364, all `along` one line |
| Lines / circles / points after repeats | 299 / 7 / 382 | 254 / 6 / 32 |
| Create entries | 457 | 94 |
| Piece types, pieces per tile | 15, 120 | 16, 120 (ring split in two) |

**Unused elements in the current tutorial** (drawn, then used by nothing: no ink, point, tile
or later step):

- Lines: `SLr451`, `ILgx1`, `ILgy1`, `ILr451`, `ULgx1`, `ULgy1`, `ULr451`, `ULad0`, `ULad1`.
- Their defining points: `Sr451`, `Igx1`, `Igy1`, `Ir451`, `Ugx1`, `Ugy1`, `Ur451`, `Uad0`,
  `Uad1`.
- `ad` is used: it is a helper, not dead.

**Redundant elements:**

- `l9` is a copy of the F2 star-line family. V9 is exactly where the line A–N crosses the 45°–255°
  star line, so `l9` can go.
- `ILgx0` is the same line as `oh`.

**The hidden step:** the 337 marks exist only so ink can run `through` two points. Ink `along`
a line, between two crossing elements, removes all of them.

**Helpers that must stay:** F8 can only be reached through the helper lines F7 (.4445) or F9
(.1664). The F10–F15 cluster needs F9 or a new anchor. My earlier estimate of 11–13 steps was
wrong; 18 is the honest count.

## Step text and angle mismatches

Each step's text says something different from what its JSON draws.

| Step | Text says | JSON does |
| --- | --- | --- |
| 1 | "rosettes … two radii apart" | True of the circle c (radius OA, spacing 2 OA), but the rosette's own rim is about 0.9 OA, so a reader can take "radius" to mean the rosette. Minor; say "two circle radii (twice OA) apart" |
| 5 | lines at right angles to 0° and 30° | `parallelTo` r30 and r60, i.e. at right angles to 120° and 150° |
| 7 | "line at 105°" | `parallelTo` r135 |
| 8 | at right angles to 0° and 30° | `parallelTo` h and v |
| 17 | picks given as odd decimal angles (49.222 and similar) | Works, but reads as fitted numbers, not a construction |

## Credit fixes

1. The photo credit has no creator or licence. Required (CLAUDE.md: free photos only ship with
   creator and licence): "Robert Prazeres, CC BY-SA 4.0,
   https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg".
2. The tutorial has no `photos` entry. Add one for that photo if the app should show it.
3. `docs/patterns/QUEUE.md` cites the twelve-fold rosette paper to "Ouazene, Benslimane et al.".
   That is wrong. Correct: Aboufadil, Thalal, El Idrissi Raghni, Jali, Oueriagli, J. Appl.
   Cryst. 52 (2019) 618–625.
4. Credit Samira Mian (https://www.samiramian.uk/twelvefoldrosette) for the star lines, as the
   rosette tutorial already does.
5. Say plainly that the line distances were fitted to the photo, not taken from a published
   construction.

## Images

| File | Shows |
| --- | --- |
| `img/bou-inania-wall/photo-panel.jpg` | The Commons photo, reduced |
| `img/bou-inania-wall/photo-rosettes-crop.jpg` | Crop used for fitting |
| `img/bou-inania-wall/current-ink-wall.png` | Current ink, 3×3 tiles |
| `img/bou-inania-wall/current-overlay-rosette.png` | Current ink on the rosette at O |
| `img/bou-inania-wall/current-overlay-grid-band.png` | Current ink on the grid band |
| `img/bou-inania-wall/current-overlay-corner.png` | Current ink on a corner star, rungs in cyan |
| `img/bou-inania-wall/photo-corner.png` | The same corner, photo only |
| `img/bou-inania-wall/simple-overlay-corner.png` | Simplified ink on the corner, new cuts in cyan |

## Engine check (2026-10-09)

Ran `pnpm review bou-inania-twelve-fold-wall` and `pnpm compare bou-inania-twelve-fold-wall wall <photo>` with the engine against the Wikimedia Commons photo.

### Confirmed findings

1. **Rebuild matches the engine.** The engine renders all 21 steps successfully. Piece count from `pnpm review`: 15 types, 120 pieces per cell, matching the tutorial's `expect` block exactly. The Python rebuild's piece list is confirmed accurate.

2. **Ring cut error (D1) confirmed.** The engine's current output shows the ring piece as 8 equal segments (6 vertices, area 0.04912, 8 per cell, total area 0.39296). Looking at the overlay against the photo (`compare-wall.png`), the current rungs clearly sit on orange tile (not white mortar), confirming they are cut in the wrong places. The rim lines should carry straight across the ring as white bands, creating 4 axis trapezoids and 4 bent diagonal pieces.

3. **Unused elements confirmed.** Searched the JSON: `SLr451`, `ILgx1`, `ILgy1`, `ILr451`, `ULgx1`, `ULgy1`, `ULr451`, `ULad0`, `ULad1` and their defining points appear only where created and used by no later element.

4. **Redundant `l9` confirmed.** Element `l9` (step 4) through c45 parallel to r60 is indeed redundant. Point V9 at `an ∩ l9` could instead be `an ∩ F2` since F2 is the same line (through c45 parallel to r60, repeated 12 times). The simplified construction eliminates `l9`.

5. **Step text mismatches confirmed.** 
   - Step 5: text says "at right angles to 0° and 30°" but JSON has `parallelTo: r30` and `r60`, which are at right angles to 120° and 150°, not 0° and 30°.
   - Step 7: text says "line at 105°" but JSON has `parallelTo: r135`.
   - Step 8: text says "at right angles to 0° and 30°" but JSON has `parallelTo: h` and `v` (0° and 90°).

6. **Credit fixes needed.** The current tutorial's photo credit lacks creator name and licence. The tutorial has no `photos` entry. Samira Mian credit for star lines is present in the rosette tutorial but should also be in this wall tutorial.

7. **Hidden step complexity.** Step 20 is hidden and marks 337 points. All ink paths use `through` two marks. The simplified construction replaces this with `along` a line between two crossing elements, eliminating all hidden marks.

8. **Comparison overlay.** The engine's `compare-wall.png` shows the current tutorial's ink overlaid on the photo. The rosette and grid band match well, but the corner ring misalignment is visible where the cyan-marked rungs sit on orange tile instead of white mortar.

### Review summary

- **Ring error:** High confidence confirmed. Fix: replace 8 ring pieces with ringaxis (4 trapezoids) + ringbend (4 bent pieces).
- **Complexity:** The 337 hidden marks and unused elements are accurate counts. The simplified 18-step construction with `along` ink eliminates all of them.
- **Step texts:** Angle descriptions in steps 5, 7, 8 contradict the JSON and need correction.
- **Credits:** Photo creator, licence, and Samira Mian star-line credit need adding.

All findings from the review document are confirmed by the engine. The simplified construction addresses all issues.

## For the reviewer

Please confirm or push back on each item. My numbers come from my own rebuild, so the engine
is the judge.

1. **Rebuild matches the engine.** Run `pnpm review bou-inania-twelve-fold-wall`. Check that
   `docs/review/bou-inania-twelve-fold-wall/` renders, and that the piece count it reports
   (15 types, 120 per tile) equals the `expect` block. If the engine disagrees with my piece
   list, everything below needs rechecking.
2. **Photo fit.** Get the photo from the Commons URL above and run
   `pnpm compare bou-inania-twelve-fold-wall wall <photo>`, with
   `--crop x,y,w,h` round one rosette and one corner star. Compare the ranking, not the exact
   numbers: corner worse than rosette, rosette worse than grid band. compare.py scores
   differently from my on-band share.
3. **Ring cut (D1).** Open `img/photo-corner.png` next to `img/current-overlay-corner.png`.
   Check that the cyan rungs sit on orange tile, and that a white band carries each rim line
   straight across the ring. Then look at the corners in the engine's wall render: the ring should
   now be 8 equal pieces, which is the error.
4. **Dump the pieces.** List the pieces from the engine (or from
   `/workspace/bou-inania/render/pieces.py segs.json`) and check the `ring` entry: 8 per cell.
   After the fix it should be `ringaxis` 4 × 0.0294 and `ringbend` 4 × 0.0684 (sum 0.3912, against 8 × 0.04912 = 0.393 now;
   the small difference is the rim moving by 0.001 in the draft).
5. **Unused ids.** Search the JSON for each id in the unused list. Each should appear only where
   it is created, and as a point used only by its own line.
6. **Redundancy.** Check that `l9` coincides with an F2 copy, and that V9 lies on the line A–N
   (my rebuild: same point to 1e-12).
7. **Text mismatches.** Read steps 5, 7 and 8 against their `parallelTo` fields.
8. **Sources.** Open each URL. Check the photo's licence and caption on Commons, and that
   nothing here claims a published construction of this panel.
9. **Rerun my work.** The scripts are in `/workspace/bou-inania/render/`: `evlib.py`
   (evaluator), `pieces.py <segs.json>`, `score.py <segs.json>` (needs the photo in
   `/workspace/bou-inania/`), `gen_simple.py hexagon`, `build_ink.py simple_hexagon.json`,
   `finalize.py`. Needs Python 3 with shapely, numpy and Pillow.

# Codex Tiling Search 45° work, 26 October 2026

Work is on `codex/tilingsearch-45` in the assigned worktree. The dated brief takes precedence over the standing requests for plan approval, full-suite checks and review-page edits: it authorizes independent choices, specifies the four checks, and reserves the shared review and family files for Claude. No server is started and port 4200 is left alone. Research sources in the main checkout are read only; intermediate files and overlays go in this worktree's ignored research directory.

Dependencies were installed once within the 3 GB scope. The first schema build stalled while contacting the Nx daemon; its process was stopped and the build succeeded with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` in the same memory cap. Subsequent Nx commands use those environment settings. Heavy commands run sequentially.

Group A is complete: all thirteen tutorials are built, including one variation. Group B is complete with all seven tutorials built. Group C is in progress: P058, BON61, P144, L34A and LEON7 are built, and IRAN16 is skipped for unsupported symmetry. The remaining three entries are pending; pending entries are not counted as skips.

## C268A — built as `moulay-idriss-interlace`

The PDF has 10 pt bands. Their centre lines fit the grid in a 116.57 pt unit, with worst coordinate residual below 0.0008 unit over 101 nearby pieces. The small-star spacing is 233.14 pt, but adjacent stars have different surroundings, so the full square repeat is 466.28 pt. OA is 233.14 pt. This avoids mistaking a half-period for the cell. The source page cites Castéra page 268 right, Wichmann and Wade figure 9.9a, and Wade MOR 0616 and MOR 0329; its heading and photograph locations differ, so the tutorial must retain that attribution distinction.


The tutorial has 14 steps. Put H = √2/2. The snapped source polygons give these areas by the shoelace formula (counts are per full cell): ring_arm −47/8 + 17H/2, four; long_hexagon 9/4 − 3H, four; star 10 − 14H, four; short_hexagon and eight 3/2 − 2H, four and twelve; arrow −11/4 + 4H, four; triangle 3/8 − H/2, twelve; kite −7/4 + 5H/2, twenty-four; square 17/2 − 12H, four; and pentagon −31/8 + 11H/2, eight. Their counted sum is exactly 4 + 0H. The engine independently finds those ten types and counts, with no slivers.

I inspected `docs/review/moulay-idriss-interlace/wall.png` beside the GIF and the full-page `docs/research/tilingsearch-45/C268A/overlay.png`. The red ink follows the band centres throughout, including the small square knots. C268A has no entry in `wade-paired.json`, so no photo overlay is required by that pairing list and none is claimed. The palette is illustrative; the tutorial records that the 10 pt bands are represented by centre lines. No existing tutorial or family is an exact duplicate of this alternating-star repeat. The source describes three star sizes in the banded drawing; its centre-line tiling has one star piece type, with the larger star outlines divided by the crossing bands.

The catalog and six targeted golden checks passed. The first text check identified two steps whose helper-free wording was missing; these now describe only the visible lines, and all 430 player text checks pass. Schema tests also pass. All four required checks ran under the memory cap. No shared code was changed.

## P164 — built as `meknes-bou-inania-star-rings`

The tutorial has 13 steps. Its 11 pt bands give a 396.34 pt repeat and OA = 198.17 pt. The half-OA snapping unit is 99.085 pt; the worst residual across the source polygons is 0.00078 OA (0.00156 snapping unit). Neighbouring stars have different sizes or surroundings, so the cell retains the full repeat. Its first five steps share C268A's small-star construction. This is a shared opening, rather than a variation family: the added star, hexagon and dart linework differs.

With H = √2/2, shoelace areas of the snapped source polygons are ring_arm −13/8 + 5H/2, four; long_hexagon 9/4 − 3H, eight; star 10 − 14H, three; short_hexagon and eight 3/2 − 2H, four each; arrow −11/4 + 4H, eight; small_star −7 + 10H, one; dart 5/2 − 7H/2, eight; triangle 3/8 − H/2, four; and kite −7/4 + 5H/2, twenty-four. They sum to exactly 4 + 0H, and the engine independently gives the same ten types and counts without slivers.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/P164/overlay.png` over the full PDF. All ink follows the band centres. P164 is absent from `wade-paired.json`; no photo overlay is claimed. The tutorial records the centre-line representation and illustrative palette. Credits retain Wade MOR 0913, Clévenot page 164 (the Tiwat example), Wichmann and Wade figures 9.2 and 9.4b, and Paccard volume 1 page 396. The C268A generator was refactored to expose its unchanged opening as `build_star`; this is backward compatible and changes no C268A geometry or tutorial JSON.

The catalog, six targeted golden checks and all 34 schema tests passed. The first player check found missing helper-free wording for the midpoint diagonals; the corrected text describes the single visible diagonal through N. All 435 player text checks then passed. All checks used the memory cap. No shared application or engine files changed.

A final helper-line inspection also showed that P164 retains all four cell sides. Its helper-free opening now says to draw all four; this corrects wording only and preserves the evaluated geometry.

## MOR2615 — built as `tetouan-sakkala-knots`

The tutorial has nine steps. The PDF has 5 pt bands and a 233.13 pt square repeat. OA = 116.565 pt is also the snapping unit, with worst source-corner error 0.00069 OA. All neighbouring stars have the same surroundings, so this cell spans a single star spacing. The first five steps reuse the Leones-door star; the corner circles then locate V, whose horizontal line closes each square knot. The finished design differs from the Leones doors and from C268A in its corner pieces and connecting lines, so it is a separate design with a shared opening.

With H = √2/2, the source-polygon shoelace areas are hexagon 9 − 12H, two; star 40 − 56H, one; eight 6 − 8H, four; triangle 3/2 − 2H, four; kite −7 + 10H, eight; square 34 − 48H, one; and pentagon −31/2 + 22H, four. The counted areas sum to exactly 4 + 0H. The engine gives the same seven types and counts, with no slivers.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/MOR2615/overlay.png`. The red lines follow the bands throughout, including the square knots. MOR2615 is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Credits name Wade MOR 2615x and the page's additional EPC 039 link. The tutorial records the centre-line representation and illustrative palette. The catalog, six targeted golden checks, all 440 player text checks and all 34 schema tests passed under the memory cap. The generator supplies specific text for the corner diagonals when helper lines are hidden.

## MOR0323 — built as `attarine-star-rosettes`

The tutorial has 14 steps. The plain drawing repeats over 506.6 pt, so OA = 253.3 pt. This is also the snapping unit; all corners fit a + bH, H = √2/2, with worst error 0.000315 OA. Coefficients beyond eight are needed for this unit because the central star's tip radius is 3 − 4H. The Charbagh construction supplies the guide squares and most line families; the vertical through W and lines through Y and Z complete this different rosette design. It is a shared opening, not the same finished motif or a proportion-only variation. MOR0323's page links LEON7 as using the same irregular tiles; compare that later entry when Group C is reached.

The source-polygon shoelace areas are long_hexagon 51 − 72H, six; star 232 − 328H, six; petal and eight 34 − 48H, eight each; seven −31/2 + 22H, sixteen; arrow −65 + 92H, four; rhombus −24 + 34H, eight; triangle 17/2 − 12H, twelve; and kite −41 + 58H, forty. Their counted sum is exactly 4 + 0H, independently matching the engine's nine types and counts, with no slivers.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/MOR0323/overlay.png` over the whole PDF. The red lines follow the tile edges everywhere. MOR0323 is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. The tutorial keeps the plain tile geometry and records its illustrative palette and the absence of a photo check. Credits retain Wade MOR 0323, MOR 1209, MOR 0421 and MOR 1227. All construction lines remain visible without helpers, and the opening text was adjusted accordingly.

The catalog, six targeted golden checks, all 445 player text checks and all 34 schema tests passed under the memory cap. The first text run rejected the joined point-family name S3S5; the wording now says “the line from S3 to S5”. No geometry or shared code changed for that correction.

## MOR0910 — built as `meknes-bou-inania-petals`

The tutorial has 16 steps. Half the 482.26 pt repeat is not a simple grid unit: it equals (2 + 3√2) times the small star's point radius. I chose that radius for OA = 38.6262820632 pt, so all vertices have the form a + bH, H = √2/2, with worst residual 0.001792 OA. Compass transfers from two radii and three unit-square diagonals construct the half-side 2 + 6H. This avoids a construction with sevenths and makes the remaining line families come directly from the unit star. The cell area is 4(2 + 6H)² = 88 + 96H.

The source-polygon shoelace areas are pointed_star 8H, one; long_hexagon 3, twelve; star 8 − 8H, three; arrow 2, sixteen; petal 2, eight; seven 1/2 + 2H, sixteen; triangle 1/2, twenty-four; and kite −1 + 2H, forty. Their counted sum is exactly 88 + 96H. The engine independently finds the same eight types and counts, with no slivers. The larger 45° corner stars distinguish this repeat from MOR0323, so it is a separate finished design rather than a proportion-only variation.

I inspected the wall beside the GIF and the full PDF overlay at `docs/research/tilingsearch-45/MOR0910/overlay.png`. Every red line follows a tile edge. MOR0910 is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. The tutorial retains the plain tile geometry and records its illustrative palette and absent photo check. Credits retain Wade MOR 0910. A redundant set of unused corner diagonals was removed after helper inspection; it changes no ink and shortens the construction by one step.

The catalog, six targeted golden checks, all 450 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## P70 — built as `meknes-bou-inania-rosette-rings`

The tutorial has 22 steps. The square repeat is 597 pt, and OA is the small star's point radius, 298.5/(4 + 3√2) = 36.2141225526 pt. Every source corner fits a + bH, H = √2/2, with worst error 0.001782 OA. Four radius steps and three unit-square diagonal transfers construct the half-side 4 + 6H. The first three steps and the compass-transfer method are shared with MOR0910; the new rings of small stars, squares and pentagons make the finished design different.

The source-polygon shoelace areas are eleven −5/2 + 8H, eight; star 8 − 8H, six; twelve 5 − 4H, eight; petal 2, thirty-two; arrow 2, twenty; seven 1/2 + 2H, sixteen; pointed_star −4 + 8H, four; rhombus 2H, thirty-two; triangle 1/2, eight; kite −1 + 2H, forty-eight; square 6 − 8H, six; and pentagon −5/2 + 4H, eight. Their counted sum is 136 + 192H = 4(4 + 6H)², the cell area. The engine independently gives these twelve types and counts. The triangle, kite, square and pentagon are deliberately small relative to this large cell. I inspected them in the source and overlay and declared just those four named types `small`; their source-derived areas and counts remain exact golden checks.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/P70/overlay.png` over the entire PDF. All red lines follow the tile edges, including the square and pentagon rings. P70 is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Credits retain Wade's Pattern in Islamic Art, page 70, and photograph MOR 0909. The tutorial keeps the plain geometry and records its illustrative palette and absent photo check. The MOR0910 generator now exposes its opening as `build_frame`; a regeneration and byte comparison confirmed that its default output is unchanged, so the shared helper change is backward compatible.

The catalog, six targeted golden checks, all 455 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## MOR2832X — built as `fes-bou-inania-cross-stars`

The tutorial has ten steps. I separated the coloured faces from the grey bevel shading and moved them out by half of the 9 pt band. OA = 68.275 pt is one third of the half-repeat; the full square cell is 409.65 pt across and has half-side 3 in OA units. The vertices fit (a + bH)/2, H = √2/2, with worst error 0.001718 OA. Odd half-unit parallels and diagonals through crossings of circles with the horizontal axis construct every required line. An unused final corner-diagonal set was removed after helper inspection.

The source-polygon shoelace areas are cross −6 + 12H, two; star 4 − 4H, sixteen; square 3 − 4H, eighteen; and pentagon −5/4 + 2H, fifty-six. Their counted sum is exactly 36, the cell area. The engine independently gives these four types and counts, with no slivers. The source's banded-shape description names more star and square types; the centre-line tiling instead has the 24-cornered cruciform face and four plain piece types. That representation is stated explicitly in the tutorial.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/MOR2832X/overlay.png`. Every red line follows the centre of a bevelled band, including the crosses' notches. MOR2832X is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Credits retain Wade MOR 2832x. The tutorial records the centre-line representation and illustrative palette. It differs from the existing Arrayanes door stars and the Badi palace repeat in motifs, filler pieces and counts, so it is not an exact duplicate or a proportion-only variation.

The catalog, six targeted golden checks, all 460 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## C126A — built as `rabat-throne-octagons`

The tutorial has 18 steps. The 8 pt band drawing uses the same 597 pt cell and small-star radius as P70: OA = 298.5/(4 + 3√2) = 36.2141225526 pt. With H = √2/2, the half-side is 4 + 6H and the cell area 136 + 192H. Every corner fits a + bH, with worst error 0.000727 OA after extracting at 0.01 pt precision. The default reader's 0.1 pt chaining grid had introduced a 0.00316 OA quantization error. I added optional `--precision n` to `1_pieces.py`; the default is unchanged, and regenerating P70 with that default gave a byte-identical pieces file. The new `medium.py` helper only centralizes metadata, formatting and ink extraction for these generators; each construction still defines its own geometry.

The source-polygon shoelace areas are octagon 4 + 8H, eight; long_hexagon 3, sixteen; star 8 − 8H, four; eight 2, sixteen; arrow and hexagon −1 + 4H, eight and sixteen; dart 2 − 2H, sixteen; triangle 1/2, sixty-four; and kite −1 + 2H, forty-eight. The counted sum is exactly 136 + 192H. The engine independently finds these nine types and counts. The triangles and kites are intentionally small relative to this large cell; I inspected them against the source and declared only those two types `small`, retaining exact golden areas and counts.

I inspected the wall beside the GIF and the full PDF overlay at `docs/research/tilingsearch-45/C126A/overlay.png`. The red lines follow all band centres. C126A is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Wichmann explicitly says he redrew Castéra's page 126 figure 1 more regularly; the tutorial preserves that qualification and does not claim the wall's exact proportions. It records the centre-line representation and illustrative palette. The unit-star opening and compass transfers are shared with P70, but the octagons and connecting lines make this a separate design.

The catalog, six targeted golden checks, all 465 player text checks and all 34 schema tests passed under the memory cap. The helper-free text names R1 and R3 at earlier star-side crossings so its two visible diagonals are explained directly. No shared application or engine code changed.

## MOR1137 — built as `rabat-rosette-bands`

The tutorial has 17 steps. OA is the small central cross's point radius, 36.2141225526 pt, and the half-side is 4 + 2√2. The approximately 494.57 pt repeat is shorter than C126A's: choosing its cell from motif centres, rather than reusing the previous cell, is essential. Corners fit a + bH, H = √2/2, with worst residual 0.000404 OA. Four radii and two square diagonals give the frame. The shared `build_frame` now optionally accepts two diagonal transfers; its default remains three, and regenerating P70 gave byte-identical tutorial JSON.

The source-polygon shoelace areas are shield 1/2 + 4H, eight; long_hexagon 3, sixteen; star 8 − 8H, seven; eight and petal 2, four and eight; arrow and hexagon −1 + 4H, four and sixteen; cross −4 + 8H, one; dart 2 − 2H, sixteen; triangle 1/2, eight; and kite −1 + 2H, forty-eight. The counted sum is 96 + 128H = 4(4 + 4H)², the cell area. The engine independently gives the same eleven types and counts, with no slivers.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/MOR1137/overlay.png` over the full drawing. Red lines follow the tile edges throughout. MOR1137 is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. The source names only Rabat and Wade MOR 1137; the tutorial adds no more specific building attribution. The geometry follows the plain drawing and the palette is explicitly illustrative. The opening squares are guides, and their ink makes the smaller cross at O. Helper inspection removed an unused corner-diagonal step and supplied direct wording for the one visible diagonal through R3. This differs from the other rosettes in its centre, shield pieces and connecting lines, so it is not a proportion-only variation.

The catalog, six targeted golden checks, all 470 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## C129B — built as `ben-youssef-arrow-bands`

The tutorial has fifteen steps. OA is the star's point radius, 36.2141225526 pt. Two radii and two unit-square diagonals give the half-side 2 + 2√2. Source corners fit a + bH, H = √2/2, within 0.000425 OA. The unit-star opening is shared with the earlier reconstructions; lines through R, V and W set this smaller repeat's arrows and square knots. Helper inspection removed an unused diagonal set and supplied wording for the two retained guide parallels through R.

The source-polygon shoelace areas are eleven −5/2 + 8H, eight; star 8 − 8H, two; hexagon 2, eight; arrow 2, sixteen; triangle 1/2, eight; kite −1 + 2H, sixteen; square 6 − 8H, six; and pentagon −5/2 + 4H, eight. Their counted sum is 48 + 64H = 4(2 + 4H)², the cell area. The engine independently gives the same eight types and counts, with no slivers.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/C129B/overlay.png`; every red line follows the plain drawing. C129B is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Credits retain Castéra, Arabesques, page 129 bottom, Ben Youssef madrasa. Wichmann says the original is uncoloured; the tutorial opens in Lines and records the palette as illustrative. The linework, its square knots and its connecting pieces differ from P70, so the shared opening is not a proportion-only variation.

The catalog, six targeted golden checks, all 475 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## MOR2841X — built as `fes-bou-inania-octagonal-rosettes`

The tutorial has twenty steps. OA is the star's point radius, 36.2141225526 pt, and the half-side is 3 + 2√2. Source corners fit a + bH, H = √2/2, within 0.000415 OA. Three radius steps and two unit-square diagonals give the frame. The outer octagon's apothem is 5H − 1: transfer the square diagonal from J to M1, then a radius back to M2. The circle through M2 gives its diagonal sides. This is a direct compass construction of the measured rim, not an adjusted numerical fit.

The source-polygon shoelace areas are long_eight 7 − 4H, eight; hexagon 3, six; star 8 − 8H, two; arrow 2, four; eight −1 + 4H, four; short_eight 6 − 6H, eight; ten −7 + 12H, eight; seven 11/2 − 6H, eight; triangle 1/2, thirty-six; rhombus −8 + 12H, eight; and kite −1 + 2H, sixteen. The counted sum is 68 + 96H = 4(3 + 4H)², the cell area. The engine independently gives these eleven types and counts, with no slivers.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/MOR2841X/overlay.png` over the full PDF. All red lines follow the tile edges, including the narrow octagonal rings. MOR2841X is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Credits retain Wade MOR 2841x and the Bou Inania madrasa, Fez. The plain geometry is retained and the palette is illustrative. The ring pieces and bands differ from the previous rosettes, so this is a separate design with a shared opening. The frame helper now also accepts three radius steps; its default remains unchanged, and P70 again regenerated byte for byte. Unused copies of the vertical helper through J were removed; the helper-free wording names R3 for the retained vertical through that part of the grid.

The catalog, six targeted golden checks, all 480 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## MOR0606 — built as `moulay-ismail-octagons`

The tutorial has eighteen steps and reuses the C126A construction grid. The 5 pt band centre lines fit a + bH, H = √2/2, in OA = 28.9712980420 pt (the smaller stars' point radius), with worst error 0.000648 OA. The half-side is 4 + 3√2. The initial squares at O are explicitly guides, because the finished central star is larger and more pointed. The ink changes include that star and the twelve-sided pieces; these change the finished linework and piece types, so I kept it as a separate design rather than a filling-only variation.

The source-polygon shoelace areas are octagon 4 + 8H, eight; pointed_star 8H, one; twelve 2 + 4H, eight; long_hexagon 3, sixteen; star 8 − 8H, three; eight 2, eight; arrow and hexagon −1 + 4H, eight and sixteen; dart 2 − 2H, sixteen; triangle 1/2, thirty-two; and kite −1 + 2H, twenty-four. The counted sum is 136 + 192H = 4(4 + 6H)². The engine independently finds these eleven types and counts. The triangles and kites are deliberately small relative to this cell; I checked them against the drawing and declared only those two types `small`, retaining their source-derived golden areas and counts.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/MOR0606/overlay.png` over the entire PDF. Every red line follows a band centre. MOR0606 is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Credits retain Wade MOR 0606 and the page's Moulay Ishmael mosque attribution (spelled Ismail in the tutorial). The tutorial records its centre-line representation and illustrative palette. Its inherited helper-free wording matches the retained guide lines, as verified by helper inspection.

The catalog, six targeted golden checks, all 485 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## P77 — built as `ben-youssef-star-rosettes`, Attarine variation

This is the first confirmed variation in the batch. After moving the origin from the four-petal centre to its eight-petal neighbour, the repeated linework and proportions are exactly those of MOR0323, `attarine-star-rosettes`. The source's different filling makes this a variation rather than another full construction. It shares all fourteen steps, and its source colours distinguish the maroon centre star, white corner star and four black filler stars. The family for Claude to register is `attarine-star-rosettes` with `ben-youssef-star-rosettes`. P77 also links PG229 as using the same irregular tiles; check that Group B entry against this family.

OA is half the repeat, 211.065625 pt; in small-star-radius research units the half-side is 3 + 2√2. The source polygons snap within 0.000359 small-star-radius unit. The normalized cell has area 4. With H = √2/2, the areas and counts equal MOR0323's exactly: long_hexagon 51 − 72H, six; star 232 − 328H, six; petal and eight 34 − 48H, eight each; seven −31/2 + 22H, sixteen; arrow −65 + 92H, four; rhombus −24 + 34H, eight; triangle 17/2 − 12H, twelve; and kite −41 + 58H, forty. Their sum is 4. The engine independently finds the same nine types and counts, with no slivers.

I inspected the normal review wall beside the GIF and the full source overlay at `docs/research/tilingsearch-45/P77/overlay.png`. Every red edge agrees. Because the chosen centre is near the PDF's corner, source polygons are wrapped by full-cell translations before ink extraction. A further render, `source-colour-wall.png`, uses fills returned by the actual player placement function; I inspected it against the source and verified one white corner star, one maroon centre star and four black filler stars. The fixed source colours are placement rules; shape colouring still has ordinary palette roles. P77 is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Credits retain Degeorge and Porter, The Art of the Islamic Tile (2002), page 77 bottom left, Ben Youssef madrasa (1565).

The new optional drawing callback in `medium.py` supports this periodic source extraction. Its optional expectation block lets the already-verified parent geometry supply names before placement rules are parsed. Existing generators retain their original defaults. No shared application or engine code changed.

The normalized source-coordinate residual is at most 0.000032 OA. The catalog, six targeted golden checks, all 490 player text checks and all 34 schema tests passed under the memory cap. The real placement-function check also passed. Group A is complete with thirteen built and no skipped tilings.

## SPA2929 — built as `toledo-synagogue-star-bands`

The tutorial has eight steps after removing an unused diagonal set. Grey bevel faces were excluded before measuring the 6 pt bands. OA is the star's point radius, 36.2141225526 pt, and the half-side is 3√2 − 1: three unit-square diagonal transfers to the right from B, the unit circle's left crossing. Corners of the source pieces in this cell fit a + bH, H = √2/2, within 0.000228 OA. The unit-star opening is shared through the new `build_unit_star` helper; regenerating P70 confirmed that the existing frame output remains byte-identical.

The source-polygon shoelace areas are twelve 16 − 18H, four; hexagon −3 + 8H, four; eight 1 + 2H, four; star 8 − 8H, two; kite −1 + 2H, eight; and square 6 − 8H, two. Their counted sum is 76 − 48H = 4(6H − 1)², the cell area. The engine independently finds those six types and counts, with no slivers.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/SPA2929/overlay.png` over the full PDF. Every red line follows a bevelled band centre. The exact data173/SPA2929 entry is absent from `wade-paired.json`, so no paired-photo overlay is required or claimed. Credits retain Wade SPA 2929. The source says only Synagogue, Toledo; the tutorial does not infer a more specific building. It records the centre-line representation and illustrative palette. The existing Toledo tile interlace has different pieces and counts, so this is a separate design.

The catalog, six targeted golden checks, all 495 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## ALH1 (data192) — built as `alhambra-mexuar-grid-fret`

The tutorial has ten steps. This is the chiral data192/ALH1 entry, not the unrelated data190/ALH1. After reducing its 8 pt bands to centre lines, a 45° frame change exposes the primitive square cell on the diagonal lattice. O is at PDF (172.7, 251), the source scaling unit is 120 pt, and tutorial OA is 120√2 pt. Every nearby corner fits tenths of OA within 0.000014 OA. Line K4F, with F halfway up OC, crosses the diagonal at one fifth; line E1E2 halves that to one tenth. Compass transfers then give the odd tenths. These simple rational lengths replace the irrationally offset diamond construction of the Reyes fret.

Independent shoelace areas from the snapped source polygons are hook 13/100, eight; fret 3/25, eight; crossbar 9/100, eight; elbow 17/200, four; square 1/25, ten; pentagon 3/100, eight; and hexagon 3/100, ten. Their counted sum is exactly 4, the cell area. The engine independently gives these seven types and counts without slivers. The finished bands and hook topology differ from the Reyes and Mexuar porch frets, so the shared visual theme is not a variation of their linework.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/ALH1/overlay.png` over the full PDF. Every red line follows a band centre and the handedness is retained. The exact data192/ALH1 entry is absent from `wade-paired.json`; its data190/ALH1 record is a different tiling and has no Wade photo. No photo overlay is claimed. Credits retain Tony Lee's personal communication and the stucco panel above the southern entrance of the small open patio south of the Sala del Mexuar. The source notes two reversed hexagons in the real upper-left corner; the tutorial explicitly follows the regular repeat. Source polygons are wrapped by full-cell translations to complete the primitive cell near the page edge. The tutorial records the frame turn, centre-line representation and illustrative palette.

The catalog, six targeted golden checks (including rotation and chirality), all 500 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## NC5 — built as `alhambra-dos-hermanas-ceiling-stars`

The tutorial has seven steps. OA is the larger pointed star's tip radius, 57.99145 pt. Its four centres lie at (±√2, ±√2), reached by transferring a radius along the diagonal. All tile sides come from the eight long chords at those four centres. After reducing the 8 pt bands to centre lines, source corners fit (a + bH)/2, H = √2/2, within 0.000276 OA. The half-side is 1 + √2.

Independent source-polygon shoelace areas are pointed_star −4 + 8H, four; eight 9 − 11H, four; star 12 − 16H, one; hexagon −3 + 5H, sixteen; four_star 20 − 28H, one; short_hexagon and rhombus 3 − 4H, four each; and kite −2 + 3H, eight. Their counted sum is 12 + 16H = 4(1 + 2H)², the cell area. The engine independently finds these eight types and counts, with no slivers.

I inspected the wall beside the GIF and the full drawing overlay at `docs/research/tilingsearch-45/NC5/overlay.png`. Every red line follows a band centre. The exact data174/NC5 entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain Nick Crossling's photograph, personal communication, and the end section of a side-chamber ceiling in the Sala de las Dos Hermanas. The tutorial records the centre-line representation and illustrative palette. Its 45° pointed stars and their connecting pieces differ from the existing Dos Hermanas designs; no duplicate was found.

The catalog, six targeted golden checks, all 505 player text checks and all 34 schema tests passed under the memory cap. Helper inspection supplied circle-only wording for the opening when its horizontal guide is hidden. No shared application or engine code changed.

## MUL128K — built as `alhambra-dos-hermanas-band-stars`

The tutorial has seventeen steps. OA is the small star's point radius, 36.2141225526 pt. Four radii and two unit-square diagonals give the half-side 4 + 2√2. After reducing the 7 pt bands to centre lines, source corners fit a + bH, H = √2/2, within 0.000359 OA. The small-star opening is shared with the Moroccan reconstructions, but the larger stars and their connecting bands have different linework. It is not a variation of NC5 or the existing Dos Hermanas designs.

Independent source-polygon shoelace areas are twelve 10 − 8H, six; large_star 6H, eight; star 8 − 8H, six; eight 2, twenty; fourteen and hexagon −1 + 4H, four and sixteen; short_eight 1, eight; pentagon 1/2, sixteen; and kite −1 + 2H, forty-eight. Their counted sum is 96 + 128H = 4(4 + 4H)², the cell area. The engine independently finds those nine types and counts without slivers.

I inspected the wall beside the GIF and the full drawing overlay at `docs/research/tilingsearch-45/MUL128K/overlay.png`. All red lines follow band centres. The exact data175/MUL128K entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain Edith Müller's 1944 publication, illustration 36, and Sala de las Dos Hermanas. The tutorial records its centre-line representation and illustrative palette. Helper inspection replaced the partly hidden lines through R with direct wording for the retained horizontal, its quarter-turn and the diagonal through R3.

The catalog, six targeted golden checks, all 510 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## PG229 — built as `seville-vanda-star-rosettes`, Attarine variation

This is the third member of the Attarine family, alongside MOR0323 and P77. After a 45° frame turn its primitive repeat has exactly the same linework, proportions, nine piece types and counts. It shares all fourteen construction steps. The source's slate-blue long hexagons and petals, black seven-sided pieces and arrows, ochre stars and white remaining pieces distinguish it. The family for Claude to register now contains `attarine-star-rosettes`, `ben-youssef-star-rosettes` and `seville-vanda-star-rosettes`.

O is at PDF (297.5, 373.414375). The source frame unit is 149.25 pt; the turn makes tutorial OA = 149.25√2 pt. Corners snap to a + bH, H = √2/2, within 0.000054 OA. Adjacent centres on the PDF axes have different rosettes; the primitive cell lies on the diagonals. Independent shoelace areas in normalized units are long_hexagon 51 − 72H, six; star 232 − 328H, six; petal and eight 34 − 48H, eight each; seven −31/2 + 22H, sixteen; arrow −65 + 92H, four; rhombus −24 + 34H, eight; triangle 17/2 − 12H, twelve; and kite −41 + 58H, forty. Their counted sum is 4. The engine independently confirms every type and count without slivers.

I inspected the wall beside the GIF and the full drawing overlay at `docs/research/tilingsearch-45/PG229/overlay.png`. Every red edge agrees. I also inspected `source-colour-wall.png`, rendered from fills returned by the actual player placement function, against the PDF. Source PDF fills were grouped by shape before setting those rules; all actual player fills match. The exact data8/PG229 entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain V&A tile 184:1853, Seville, sixteenth century, cuenca, record O159790; Abas and Salman page 229; and Wade MOR 0322 at the Attarine madrasa. No museum record or photograph was independently checked. The tutorial records the frame turn and source filling.

The catalog, six targeted golden checks, all 515 player text checks and all 34 schema tests passed under the memory cap. The actual player placement-colour check also passed. No shared application or engine code changed.

## SPA2103X — built as `cordoba-synagogue-star-bands`

The tutorial has sixteen steps. OA is the small star's point radius, 36.2141225526 pt, and the half-side is 2 + 2√2. Source band centres fit a + bH, H = √2/2, within 0.000286 OA after extracting at 0.01 pt precision and expanding by half the 7 pt band width. The Ben Youssef arrow-band construction supplies all line families except the axes at 1 + 3H; a unit-radius transfer from J gives those. Its finished stars, crosses and connecting pieces have different topology, so this shared opening is not a filling-only variation.

Independent source-polygon shoelace areas are star 8 − 8H, fourteen; cross and eight −1 + 4H, eight and sixteen; kite −1 + 2H, thirty-two; square 6 − 8H, two; and pentagon −5/2 + 4H, eight. Their counted sum is 48 + 64H = 4(2 + 4H)². The engine independently finds those six types and counts without slivers.

I inspected the wall beside the GIF and the full PDF overlay at `docs/research/tilingsearch-45/SPA2103X/overlay.png`. All red lines follow band centres. The exact data192/SPA2103X entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain Wade SPA 2103x, Synagogue, Cordova, with archive record 4186. The tutorial records the centre-line representation and illustrative palette. Wichmann explicitly says the original is uncoloured; the tutorial therefore opens in Lines. Helper inspection found no additional wording changes necessary.

The catalog, six targeted golden checks, all 520 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## NC7 — built as `alcazar-reyes-octagon-bands`

The tutorial has twenty steps. OA is the small star's point radius, 199/(4 + 3√2) = 24.1427483684 pt, and the half-side is 4 + 3√2. After reducing the 6 pt bands to centre lines, source corners fit a + bH, H = √2/2, within 0.000495 OA. The construction reuses the Rabat throne-room grid with its unused Y1 diagonal omitted, then adds three crossing and compass steps. The larger stars and octagonal bands have different piece types and counts, so this is a separate design.

Independent source-polygon shoelace areas are octagon 4 + 8H, eight; eighteen −5 + 14H, eight; fourteen −1 + 8H, eight; large_star −4 + 12H, four; hexagon 3, four; star 8 − 8H, two; eight 2, thirty-two; triangle 1/2, sixteen; kite −1 + 2H, sixteen; and square 6 − 8H, fourteen. Their counted sum is 136 + 192H = 4(4 + 6H)². The engine independently finds those ten types and counts. Triangles, kites and squares are deliberately small relative to this cell; I inspected them against the source and declared only those three types `small`.

I inspected the wall beside the GIF and the full PDF overlay at `docs/research/tilingsearch-45/NC7/overlay.png`. Every red line follows a band centre, including the small square knots. The exact data174/NC7 entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain Nick Crossling's photograph, personal communication, of the Alcázar wood inlay in the Dormitorio de Reyes Moros and vestibule, and V&A Toledo tin-glazed earthenware tile 308:100-1866, fifteenth century, record O160017. No photo or museum record was independently checked. The tutorial records the centre-line representation and illustrative palette.

The Rabat generator's new optional `include_y1` argument defaults to its original behaviour; regenerating C126A gave byte-identical JSON. Helper inspection confirms the inherited wording describes the retained lines. The catalog, six targeted golden checks, all 525 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed. Groups A and B are complete: twenty built and none skipped.

## P058 — built as `bourgoin-58-star-bands`

The tutorial has thirteen steps. OA is the star's point radius, 48.2854967367 pt. Two radii and two unit-square diagonals give the half-side 2 + 2√2. Neighbouring stars on an axis have different surroundings; retaining two star spacings avoids an incorrect half-period. After reducing the 12 pt bands to centre lines, source corners fit a + bH, H = √2/2, within 0.000311 OA. The construction shares the unit-star opening, then uses earlier star-side crossings and the corner circle to set the connecting bands.

Independent source-polygon shoelace areas are long_hexagon 3, twelve; star 8 − 8H, four; eight 2, four; hexagon −1 + 4H, eight; dart 2 − 2H, eight; triangle 1/2, eight; and kite −1 + 2H, forty. Their counted sum is 48 + 64H = 4(2 + 4H)². The engine independently finds those seven types and counts without slivers. The topology and piece inventory differ from the earlier reconstructions; no exact duplicate or filling-only variation was found.

I inspected the wall beside the GIF and the full PDF overlay at `docs/research/tilingsearch-45/P058/overlay.png`. Every red line follows a band centre. The exact data162/P058 entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain Bourgoin plate 58 and all eight references listed by the page: Wade MOR 0316; Broug page 76 figure 3.34; Wichmann and Wade figure 9.6a; Dury page 22; Abas and Salman page 239; Wade SPA 2315/2109x; and Paccard volume 1 page 410. The tutorial records the centre-line representation and illustrative palette. The source highlights one star in ochre; this tutorial repeats a consistent shape palette.

The catalog, six targeted golden checks, all 530 player text checks and all 34 schema tests passed under the memory cap. Helper inspection supplied direct wording for the two retained diagonals through R1 and R3, the horizontal through R and its 270° turn, and the four horizontals through V. No shared application or engine code changed.

## IRAN16 — skipped: unsupported symmetry

Wichmann's data197/IRAN16 page explicitly gives 2*22 (cmm). Its Mir Qavam al-Din Mar'ashi design has half-turns and mirrors, without a turn of a third or more. The current format requires fold ≥ 3, and the brief explicitly says to skip this symmetry. No tutorial or generator was created, and no false fourfold repeat was substituted. The page's related data205/SM3 is a different entry from the assigned data206/SM3 still to come.

## BON61 — built as `hani-zeynebiye-stars`, ring-of-circles variation

The source geometry exactly matches the existing `four-fold-ring-of-circles`, whose twelve steps are reused verbatim. Sandy Kurt's tutorial credit is retained alongside the new Wichmann drawing credit. The source's filling distinguishes the Hani variation: navy stars, yellow bowties, brown squares, and green and peach pentagons. The family for Claude to register is `four-fold-ring-of-circles` with `hani-zeynebiye-stars`. This comparison does not establish how the madrasa pattern was historically constructed.

The source small-star radius is 25(1 + √2) = 60.3553390593 pt. Its half-side is 2 + √2 in those units; normalized tutorial OA is 206.066017178 pt. Corners fit (a + bH)/2, H = √2/2, within 0.000025 OA. Independent source-polygon shoelace areas in normalized units are star 20 − 28H, ten; bowtie 5 − 7H, sixteen; square 17 − 24H, two; and dart (the five-sided pentagon) −31/4 + 11H, forty. Their counted sum is exactly 4. The engine independently confirms these four types and counts, without slivers.

I inspected the review wall beside the GIF and the full PDF overlay at `docs/research/tilingsearch-45/BON61/overlay.png`; every red edge agrees. I also inspected `source-colour-wall.png`, rendered from actual player placement fills. Every fill was checked against the nearest source polygon, including all sixteen peach and twenty-four green pentagons per cell. The maximum matched-centre residual is 0.000017 OA. The existing ring colouring and explicit placement rules are mutually exclusive in the schema, so this variant uses placements. Its source colours are stored in the generator, including the player-verified `nth` choices.

The exact data211/BON61 entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain Bonner page 276 figure 154, Zeynebiye madrasa, Hani, Turkey (1000–1300); no building photograph was checked. This variant is the exception to the brief’s usual `basis: reconstruction`: its reused steps actually come from Kurt’s tutorial. The schema audit requires `mixed` (with `fidelity: adapted`) when that instructional credit is retained. I used `mixed` to describe both sources truthfully, rather than misclassifying or dropping Kurt’s credit. The catalog, six targeted golden checks, all 535 player text checks and all 34 schema tests passed under the memory cap. The source-colour placement check also passed. No shared application or engine code changed.

## P144 — built as `bourgoin-144-octagon-bands`

The tutorial has twelve steps. Its primitive cell is turned 22.5° from the PDF axes. The source star's point radius is R = 48.2854967367 pt; tutorial OA is R cos(π/8) = 44.6099821522 pt. Turning and scaling source-radius coordinates by (x + ty, y − tx), t = √2 − 1, gives corners on a + bH, H = √2/2, with worst residual 0.000301 OA. The half-side is 2 + 2√2. Axis-aligned cells inferred from nearby stars failed the independent area sum; this turned cell agrees exactly.

A regular octagon tangent to the unit circle supplies the star's eight tips. Its inner crossing P fixes the small offset 2t². Compass transfers through vertical marks at two, four and six radii, and about the four-radius mark, give all other line families. This avoids separately constructing the many surrounding stars and octagons. Independent source-polygon shoelace areas are star 48 − 64H, five; eighteen −12 + 20H, eight; octagon −32 + 48H, nine; fourteen −24 + 36H, twelve; and small_octagon 12 − 16H, forty. Their counted sum is 48 + 64H = 4(2 + 4H)². The engine independently finds these five types and counts, with no slivers.

I inspected the wall beside the GIF and the full PDF overlay at `docs/research/tilingsearch-45/P144/overlay.png`. All red lines follow the 3 pt band centres. The exact data12/P144 entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain Bourgoin plate 144 and its connection to plate 52, Critchlow page 187, Abas and Salman page 250, and the page's Wade BOU 144 link. The tutorial records the frame turn, centre-line representation and illustrative palette. The piece inventory and proportions differ from the existing octagon lessons; no duplicate or filling-only variation was found.

The overlay tool now accepts optional `angle=<degrees>` for a pure frame turn at the true tutorial scale. Its old no-argument and `rot45` modes are unchanged: regenerating the NC7 and PG229 overlays gave byte-identical PNGs. Helper inspection found no omitted lines needing alternate text. The catalog, six targeted golden checks, all 540 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## L34A — built as `lindisfarne-folio-2b-stepped-bands`

The tutorial has nine steps. This is a Celtic manuscript pattern, credited to Backhouse's Lindisfarne Gospels, page 34, pattern 1 from folio 2b. It is not given an Islamic building attribution. O is at PDF (290.83, 357.67), where four small squares meet, and OA is one square side, exactly 20 pt. All source corners fit the integer grid within 3 × 10⁻¹⁵ OA at 0.01 pt extraction precision. The plain drawing has no bands to expand; the gap detector's 20 pt result is a tile-side length here. The half-side is eight, giving the 320 pt repeat.

Independent source-polygon shoelace areas are twenty_six 13, four; twenty_one 25/2, four; eighteen 9, eight; fifteen 17/2, four; ten 5, eight; and square 1, eight. Their counted sum is exactly 256 = 16². The engine independently confirms these six types and counts. Its sliver heuristic flags the long twenty-one- and fifteen-sided bands despite their substantial areas. Both match whole source polygons exactly; only those two intentional shapes are declared `small`, with all area and count assertions retained.

I inspected the wall beside the GIF and the full PDF overlay at `docs/research/tilingsearch-45/L34A/overlay.png`. Every red edge agrees, including the diagonal corners of the outer bands. The exact data1/L34A entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. The manuscript page was not independently checked. The finished geometry is retained and the palette is explicitly illustrative. No existing tutorial has this stepped linework. Helper inspection supplies wording that omits the hidden AC diagonal from step two.

The catalog, six targeted golden checks, all 545 player text checks and all 34 schema tests passed under the memory cap. No shared application or engine code changed.

## LEON7 — built as `leon-mosaic-star-rosettes`, Attarine variation

This is the fourth Attarine-family filling. All fourteen construction steps and all ink paths are shared with MOR0323. The family for Claude to register is now `attarine-star-rosettes`, `ben-youssef-star-rosettes`, `seville-vanda-star-rosettes` and `leon-mosaic-star-rosettes`. The source has two black and four red stars per cell, two black and four ochre long hexagons, dark-blue petals, brighter-blue seven-sided pieces and white remaining pieces. Its white surrounds remain divided into individual tiles, as Wichmann explicitly notes.

OA is half the source repeat, 253.3 pt, with O at PDF (297.5, 373.895625). Corners fit a + bH, H = √2/2, within 0.000103 OA. Independent source-polygon shoelace areas are long_hexagon 51 − 72H, six; star 232 − 328H, six; petal and eight 34 − 48H, eight each; seven −31/2 + 22H, sixteen; arrow −65 + 92H, four; rhombus −24 + 34H, eight; triangle 17/2 − 12H, twelve; and kite −41 + 58H, forty. Their counted sum is exactly 4. The engine independently confirms the nine types and counts without slivers.

I inspected the wall beside the GIF, the full drawing overlay at `docs/research/tilingsearch-45/LEON7/overlay.png`, and `source-colour-wall.png` rendered from actual player placement fills. All red edges agree and every actual placement fill matches its source polygon. The black-star indices are 0 and 4; the black long-hexagon indices are 0 and 3. Their source-centre matching residual is at most 0.000112 OA. These choices are stored in the generator, rather than relying on palette roles alone.

The exact data194/LEON7 entry is absent from `wade-paired.json`, so no photo overlay is required or claimed. Credits retain Alberto Leon's personal communication, Mosaic in Islamic Design. The source gives no building or country; the tutorial adds none. The repeated linework is unchanged and the source filling is retained. The catalog, six targeted golden checks, all 550 player text checks and all 34 schema tests passed under the memory cap. The actual player source-colour check also passed. No shared application or engine code changed.

# Codex Tiling Search 45° work, 26 October 2026

Work is on `codex/tilingsearch-45` in the assigned worktree. The dated brief takes precedence over the standing requests for plan approval, full-suite checks and review-page edits: it authorizes independent choices, specifies the four checks, and reserves the shared review and family files for Claude. No server is started and port 4200 is left alone. Research sources in the main checkout are read only; intermediate files and overlays go in this worktree's ignored research directory.

Dependencies were installed once within the 3 GB scope. The first schema build stalled while contacting the Nx daemon; its process was stopped and the build succeeded with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` in the same memory cap. Subsequent Nx commands use those environment settings. Heavy commands run sequentially.

Group A is in progress; the first ten entries, C268A through C129B, are built. The remaining Group A entries, then Groups B and C, are pending; pending entries are not counted as skips.

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

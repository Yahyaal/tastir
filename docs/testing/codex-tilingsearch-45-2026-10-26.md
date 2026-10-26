# Codex Tiling Search 45° work, 26 October 2026

Work is on `codex/tilingsearch-45` in the assigned worktree. The dated brief takes precedence over the standing requests for plan approval, full-suite checks and review-page edits: it authorizes independent choices, specifies the four checks, and reserves the shared review and family files for Claude. No server is started and port 4200 is left alone. Research sources in the main checkout are read only; intermediate files and overlays go in this worktree's ignored research directory.

Dependencies were installed once within the 3 GB scope. The first schema build stalled while contacting the Nx daemon; its process was stopped and the build succeeded with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` in the same memory cap. Subsequent Nx commands use those environment settings. Heavy commands run sequentially.

Group A is in progress; the first six entries, C268A through P70, are built. The remaining Group A entries, then Groups B and C, are pending; pending entries are not counted as skips.

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

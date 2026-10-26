# Codex Tiling Search 45° work, 26 October 2026

Work is on `codex/tilingsearch-45` in the assigned worktree. The dated brief takes precedence over the standing requests for plan approval, full-suite checks and review-page edits: it authorizes independent choices, specifies the four checks, and reserves the shared review and family files for Claude. No server is started and port 4200 is left alone. Research sources in the main checkout are read only; intermediate files and overlays go in this worktree's ignored research directory.

Dependencies were installed once within the 3 GB scope. The first schema build stalled while contacting the Nx daemon; its process was stopped and the build succeeded with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` in the same memory cap. Subsequent Nx commands use those environment settings. Heavy commands run sequentially.

Group A is in progress; C268A and P164 are built. The remaining Group A entries, then Groups B and C, are pending; pending entries are not counted as skips.

## C268A — built as `moulay-idriss-interlace`

The PDF has 10 pt bands. Their centre lines fit the grid in a 116.57 pt unit, with worst coordinate residual below 0.0008 unit over 101 nearby pieces. The small-star spacing is 233.14 pt, but adjacent stars have different surroundings, so the full square repeat is 466.28 pt. OA will be 233.14 pt. This avoids mistaking a half-period for the cell. The source page cites Castéra page 268 right, Wichmann and Wade figure 9.9a, and Wade MOR 0616 and MOR 0329; its heading and photograph locations differ, so the tutorial must retain that attribution distinction.


The tutorial has 14 steps. Put H = √2/2. The snapped source polygons give these areas by the shoelace formula (counts are per full cell): ring_arm −47/8 + 17H/2, four; long_hexagon 9/4 − 3H, four; star 10 − 14H, four; short_hexagon and eight 3/2 − 2H, four and twelve; arrow −11/4 + 4H, four; triangle 3/8 − H/2, twelve; kite −7/4 + 5H/2, twenty-four; square 17/2 − 12H, four; and pentagon −31/8 + 11H/2, eight. Their counted sum is exactly 4 + 0H. The engine independently finds those ten types and counts, with no slivers.

I inspected `docs/review/moulay-idriss-interlace/wall.png` beside the GIF and the full-page `docs/research/tilingsearch-45/C268A/overlay.png`. The red ink follows the band centres throughout, including the small square knots. C268A has no entry in `wade-paired.json`, so no photo overlay is required by that pairing list and none is claimed. The palette is illustrative; the tutorial records that the 10 pt bands are represented by centre lines. No existing tutorial or family is an exact duplicate of this alternating-star repeat. The source describes three star sizes in the banded drawing; its centre-line tiling has one star piece type, with the larger star outlines divided by the crossing bands.

The catalog and six targeted golden checks passed. The first text check identified two steps whose helper-free wording was missing; these now describe only the visible lines, and all 430 player text checks pass. Schema tests also pass. All four required checks ran under the memory cap. No shared code was changed.

## P164 — built as `meknes-bou-inania-star-rings`

The tutorial has 13 steps. Its 11 pt bands give a 396.34 pt repeat and OA = 198.17 pt. The half-OA snapping unit is 99.085 pt; the worst residual across the source polygons is 0.00078 OA (0.00156 snapping unit). Neighbouring stars have different sizes or surroundings, so the cell retains the full repeat. Its first five steps share C268A's small-star construction. This is a shared opening, rather than a variation family: the added star, hexagon and dart linework differs.

With H = √2/2, shoelace areas of the snapped source polygons are ring_arm −13/8 + 5H/2, four; long_hexagon 9/4 − 3H, eight; star 10 − 14H, three; short_hexagon and eight 3/2 − 2H, four each; arrow −11/4 + 4H, eight; small_star −7 + 10H, one; dart 5/2 − 7H/2, eight; triangle 3/8 − H/2, four; and kite −7/4 + 5H/2, twenty-four. They sum to exactly 4 + 0H, and the engine independently gives the same ten types and counts without slivers.

I inspected the wall beside the GIF and `docs/research/tilingsearch-45/P164/overlay.png` over the full PDF. All ink follows the band centres. P164 is absent from `wade-paired.json`; no photo overlay is claimed. The tutorial records the centre-line representation and illustrative palette. Credits retain Wade MOR 0913, Clévenot page 164 (the Tiwat example), Wichmann and Wade figures 9.2 and 9.4b, and Paccard volume 1 page 396. The C268A generator was refactored to expose its unchanged opening as `build_star`; this is backward compatible and changes no C268A geometry or tutorial JSON.

The catalog, six targeted golden checks and all 34 schema tests passed. The first player check found missing helper-free wording for the midpoint diagonals; the corrected text describes the single visible diagonal through N. All 435 player text checks then passed. All checks used the memory cap. No shared application or engine files changed.

A final helper-line inspection also showed that P164 retains all four cell sides. Its helper-free opening now says to draw all four; this corrects wording only and preserves the evaluated geometry.

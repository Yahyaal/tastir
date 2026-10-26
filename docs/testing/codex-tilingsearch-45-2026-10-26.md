# Codex Tiling Search 45° work, 26 October 2026

Work is on `codex/tilingsearch-45` in the assigned worktree. The dated brief takes precedence over the standing requests for plan approval, full-suite checks and review-page edits: it authorizes independent choices, specifies the four checks, and reserves the shared review and family files for Claude. No server is started and port 4200 is left alone. Research sources in the main checkout are read only; intermediate files and overlays go in this worktree's ignored research directory.

Dependencies were installed once within the 3 GB scope. The first schema build stalled while contacting the Nx daemon; its process was stopped and the build succeeded with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` in the same memory cap. Subsequent Nx commands use those environment settings. Heavy commands run sequentially.

Group A is in progress, starting with C268A. The remaining Group A entries, then Groups B and C, are pending; pending entries are not counted as skips.

## C268A — built as `moulay-idriss-interlace`

The PDF has 10 pt bands. Their centre lines fit the grid in a 116.57 pt unit, with worst coordinate residual below 0.0008 unit over 101 nearby pieces. The small-star spacing is 233.14 pt, but adjacent stars have different surroundings, so the full square repeat is 466.28 pt. OA will be 233.14 pt. This avoids mistaking a half-period for the cell. The source page cites Castéra page 268 right, Wichmann and Wade figure 9.9a, and Wade MOR 0616 and MOR 0329; its heading and photograph locations differ, so the tutorial must retain that attribution distinction.


The tutorial has 14 steps. Put H = √2/2. The snapped source polygons give these areas by the shoelace formula (counts are per full cell): ring_arm −47/8 + 17H/2, four; long_hexagon 9/4 − 3H, four; star 10 − 14H, four; short_hexagon and eight 3/2 − 2H, four and twelve; arrow −11/4 + 4H, four; triangle 3/8 − H/2, twelve; kite −7/4 + 5H/2, twenty-four; square 17/2 − 12H, four; and pentagon −31/8 + 11H/2, eight. Their counted sum is exactly 4 + 0H. The engine independently finds those ten types and counts, with no slivers.

I inspected `docs/review/moulay-idriss-interlace/wall.png` beside the GIF and the full-page `docs/research/tilingsearch-45/C268A/overlay.png`. The red ink follows the band centres throughout, including the small square knots. C268A has no entry in `wade-paired.json`, so no photo overlay is required by that pairing list and none is claimed. The palette is illustrative; the tutorial records that the 10 pt bands are represented by centre lines. No existing tutorial or family is an exact duplicate of this alternating-star repeat. The source describes three star sizes in the banded drawing; its centre-line tiling has one star piece type, with the larger star outlines divided by the crossing bands.

The catalog and six targeted golden checks passed. The first text check identified two steps whose helper-free wording was missing; these now describe only the visible lines, and all 430 player text checks pass. Schema tests also pass. All four required checks ran under the memory cap. No shared code was changed.

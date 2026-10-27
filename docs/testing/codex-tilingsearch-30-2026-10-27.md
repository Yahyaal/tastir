# Six- and twelve-fold Tiling Search work, 27 October 2026

Work is confined to `/home/yahya/Documents/projects/Tastir-codex-30`, on `codex/tilingsearch-30`. The approved brief authorizes implementation and the final branch push. It reserves the review, variations, queue, status and prompt files for Claude. Main-checkout research is read only. Intermediate files and overlays are in this worktree's ignored `docs/research/tilingsearch-30/`. No development server is started and port 4200 is left alone.

Dependencies were installed once and the schema build succeeded once, using `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`. Heavy commands run sequentially under the specified memory caps. All 39 PDFs have been read into polygons and their drawing sheets inspected. A source drawing match will be reported separately from a monument photograph match.

## Shared tools

`snap_grid3.py` adds an importable and command-line √3/2 grid reader beside the unchanged √2 reader. It accepts an explicit rational denominator, reports the worst coordinate residual, and keeps exact rational coefficients. Three standard-library tests pass, covering triangle and hexagon coordinates, negative coefficients, rational halves, source-frame conversion, radius selection and invalid options. Snapping alone does not prove the construction.

## Progress

No tutorial is complete yet. All 39 entries remain pending.

# Six- and twelve-fold Tiling Search work, 27 October 2026

Work is confined to `/home/yahya/Documents/projects/Tastir-codex-30`, on `codex/tilingsearch-30`. The approved brief authorizes implementation and the final branch push. It reserves the review, variations, queue, status and prompt files for Claude. Main-checkout research is read only. Intermediate files and overlays are in this worktree's ignored `docs/research/tilingsearch-30/`. No development server is started and port 4200 is left alone.

Dependencies were installed once and the schema build succeeded once, using `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`. Heavy commands run sequentially under the specified memory caps. All 39 PDFs have been read into polygons and their drawing sheets inspected. A source drawing match will be reported separately from a monument photograph match.

## Shared tools

`snap_grid3.py` adds an importable and command-line √3/2 grid reader beside the unchanged √2 reader. It accepts an explicit rational denominator, reports the worst coordinate residual, and keeps exact rational coefficients. Three standard-library tests pass, covering triangle and hexagon coordinates, negative coefficients, rational halves, source-frame conversion, radius selection and invalid options. Snapping alone does not prove the construction.

## Progress

CM022 and ASU2 are complete. The other 37 entries remain pending.

## CM022 — `alcazar-six-eight-stars`

This twelve-step p4m tutorial uses fold four and an eight-pointed star. O is at PDF (300.345625, 373.845625), with OA the full centre-line star radius, 25(1+√2) pt. With H=√2/2, the square cell half-side is H(1+5/√3). The source’s 15 pt bands are expanded by 7.5 pt before reading their centre lines. The unit-star opening is shared with the existing low-fold generators. A √3 compass transfer and two parallels through crossings locate the other lines. The worst expanded source-corner distance from the exact construction, including neighbouring copies for complete boundary pieces, is 0.00015603 OA.

Independent polygon shoelaces give six_star 2√3, twice; eight 8−3√3, four; four_star (38√3−58)/3, once; eight_star 8−4√2, once; arrow −3/2+√2+5√3/6, four; and kite 1−√3/3, four. Their counted sum is (56+20√3)/3=4H²(1+5/√3)², exactly the square cell area. The engine independently finds these six types and sixteen pieces, without slivers or off-construction ink endpoints.

I inspected the ink, the wall and the complete red PDF overlay at `docs/research/tilingsearch-30/CM022/overlay.png`. Every red line follows a band centre. The drawing’s three fill classes are retained by shape; the numeric palette is illustrative. CM022 is absent from `wade-paired.json`, and no building photograph was checked. Credits retain the page’s Cahier and Martin page 22, Wade SPA 2219 and SPA 2319, Rigby photograph 180 and Crossling inlay attribution. The source’s own monument descriptions differ, and are reported as its attributions. Comparison with existing tutorials and families found no duplicate or filling-only variant. The old six-fold tutorials have different piece inventories and arrangements.

The catalog prepared 187 previews. The six targeted golden checks and the targeted weave check passed. The specified combined filtered command failed only because interlace.spec.ts has a global afterAll requiring over 1000 followed band sections, which a single filtered design cannot supply. Running that entire file passed all 192 checks. The player text/helper checks passed all 940 assertions, including the ASU2 draft. The schema suite passed all 40 checks. A player run started while the full weave file was still running was stopped and then rerun sequentially; subsequent heavy checks remain serial. These checks used the 3 GB cap. No shared engine, schema, player or reserved file was changed.

## ASU2 — `salim-chishti-dodecagons`

This p6m tutorial has nine steps and fold six. O is at PDF (305.4016666667, 371), the central dodecagon’s centre. OA is its expanded radius, 45/(2sin15°)=86.9333243660 pt, and the hexagonal cell apothem is 1+sin15°. Its source faces are expanded by 6 pt, half the 12 pt bands. All 97 extracted source polygons fit the exact ideal vertex set and its lattice copies within 0.00009532 OA in Euclidean distance. The mixed √2/√3 expressions have small coefficients; no approximate length is shipped.

The first four steps reuse the existing Mian lesson’s twelve-division opening byte for byte. The dodecagon sides, a half-chord transfer and the six cell sides give all the ink. An independent pentagon shoelace uses (−√3/2,1/2), (−L,L/√3), (−2L+√3/2,1/2), (−2L+1,0) and (−1,0), with L=1+sin15°. Its area is (6√2+6√3−2√6−9)/12. Six of these and one dodecagon of area 3 sum exactly to 2√3L², the cell area. The engine independently finds both types and those counts without slivers or off-construction endpoints.

I inspected the ink, wall and the complete red overlay at `docs/research/tilingsearch-30/ASU2/overlay.png`. All source boundaries agree with our band centre lines. The source’s single fill class is retained by assigning both shapes the same palette slot. The numeric palette is illustrative. The page credits Aslam Qureshi’s photograph of Salim Chishti’s tomb, Fatehpur Sikri (1581 AD, 989 AH), supplied by personal communication; no photograph was independently checked. This is a separate design from the star and rosette lessons and the existing eight-fold Salim Chishti square lattice, with no duplicate or filling-only variant found.

The catalog prepared 188 previews. All six targeted golden checks, the full weave group, all 940 text/helper assertions and all 40 schema checks passed serially under 3 GB. The filter includes `weave` because of the global crossing-count assertion explained under CM022. No shared application or reserved file changed.

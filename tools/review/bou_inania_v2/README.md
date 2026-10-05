# Bou Inania rosette, simpler (owner, 2026-10-05)

Reference: the clear drawing `docs/12-rosette tutorial/bouinania-pattern.jpg` (by
@aslam.geometricpatterns). Centre (1024.5, 1011.5) px, unit R = 415 px (Samira Mian's outline
radius, found from her rosette lying on the bands).

1. `1_scan_big_circle.py`: scores sizes of a second rosette/outline against the bands; a
   twelve-sided outline at √3·R fits (90%).
2. `2_measure_bands.py`: exact band distances: big outline sides at √3·R·cos 15°, frame at 2R.
3. `3_piece_edges.py`: the edges of single coloured pieces (pentagon, small star, shield) as
   lines (direction, distance from O); band centres lie half a band width (0.045R) outside.
4. `4_candidate_lines.py '<sets>' out.png`: draws sets of twelve lines, keeps the pieces between
   crossings that lie on band centres, and marks the band left unexplained.

An automatic greedy choice of line sets overfits (tried, ten sets for 69%); choose sets from
piece edges instead.

# Bou Inania rosette, simpler (owner, 2026-10-05)

Reference: the clear drawing `docs/12-rosette tutorial/bouinania-pattern.jpg` (by
@aslam.geometricpatterns). Centre (1027, 1027.5) px (the frame's centre; a symmetry fit gave a wrong centre 16 px
higher), unit R = 367 px = Samira Mian's first circle (her rosette fits the inside exactly).
Big figure on the circle 2R·cos 15° (sides 1.866R); frame 2.29R.

1. `1_scan_big_circle.py`: scores sizes of a second rosette/outline against the bands; a
   twelve-sided outline at √3·R fits (90%).
2. `2_measure_bands.py`: exact band distances: big outline sides at √3·R·cos 15°, frame at 2R.
3. `3_piece_edges.py`: the edges of single coloured pieces (pentagon, small star, shield) as
   lines (direction, distance from O); band centres lie half a band width (0.045R) outside.
4. `4_candidate_lines.py '<sets>' out.png`: draws sets of twelve lines, keeps the pieces between
   crossings that lie on band centres, and marks the band left unexplained.

An automatic greedy choice of line sets overfits (tried, ten sets for 69%); choose sets from
piece edges instead.
5. `5_exact_sets.py`: the line sets exactly, each through a crossing of the sets before it
   (`sets.json`).
6. `6a_piece_network.py <out.json>`: the band-centre network from the coloured pieces offset
   by half a band (`network.json`). `6_choose_ink.py <drawing> ink.json [preview]`: ink = the
   stretches of the line sets that this network covers, decided by symmetry family, tiny
   gaps closed.
7. `gen_bou_inania_v2.py ink.json out.json`: the tutorial (draft kept here as
   `draft-bou-inania-rosette.json` until the small stars and slivers are fixed).

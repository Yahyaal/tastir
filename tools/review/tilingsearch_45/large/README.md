# Helpers from the large-panel pilot (batch 16, 26 October 2026)

Scratch scripts the batch 16 builder used on P008B, C126B and NC2, kept as they were for later large panels. They are not polished tools: read each before use and fix its paths.

- `missing.py`: for each line the drawing needs and the construction lacks, the crossings it runs through. This was the main tool for finding constructions.
- `inventory.py`: the drawing's piece types, areas and counts per cell, to compare with the library.
- `nc2lines.py`: lists the lines per direction in a turned frame (for drawings whose edges sit at 22.5° to the cell).
- `fillnth.py`, `cmpfills.py`: work out `nth` placement rules from Wichmann's colours and compare them with the player's fills.
- `plotq.py`: quick plots.

Beware: `crossings()` in `tools/review/bou_inania/gen_design_e.py` returns bogus points for two circles that do not meet.

Added by batch 17 (RAY7, L90, MOR0719, C176A, 26 October 2026):

- `greedy.py`: the line search behind those four. After the unit star (or the circle and its octagon), every missing line ran through a crossing of earlier lines, so a greedy plan of parallels, turned round O, built all but two of them; `../parallels.py` writes the plan as steps with their plain-English text.
- `fills.ts` (run with tsx and the workspace's source conditions) prints each piece's colour from the player's own placement function; `cmpslots.py` checks it against the drawing's fills.
- `hidden.ts` lists the lines each step hides when helper lines are off, for writing `textWithoutHelpers`.
- Find the repeat by matching pieces under translation before choosing the cell: C176A's small stars sit 437.78 pt apart but the repeat is 619.1 pt, and MOR0719's rosettes sit on a centred lattice.

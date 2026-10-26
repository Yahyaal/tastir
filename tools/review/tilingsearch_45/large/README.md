# Helpers from the large-panel pilot (batch 16, 26 October 2026)

Scratch scripts the batch 16 builder used on P008B, C126B and NC2, kept as they were for later large panels. They are not polished tools: read each before use and fix its paths.

- `missing.py`: for each line the drawing needs and the construction lacks, the crossings it runs through. This was the main tool for finding constructions.
- `inventory.py`: the drawing's piece types, areas and counts per cell, to compare with the library.
- `nc2lines.py`: lists the lines per direction in a turned frame (for drawings whose edges sit at 22.5° to the cell).
- `fillnth.py`, `cmpfills.py`: work out `nth` placement rules from Wichmann's colours and compare them with the player's fills.
- `plotq.py`: quick plots.

Beware: `crossings()` in `tools/review/bou_inania/gen_design_e.py` returns bogus points for two circles that do not meet.

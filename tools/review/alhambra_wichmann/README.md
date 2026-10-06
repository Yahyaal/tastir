# Alhambra panels from Brian Wichmann's Tiling Search

Tiling Search (tilingsearch.mit.edu, CC BY-NC-SA) draws each pattern as a vector PDF:
`https://tilingsearch.mit.edu/contents/<folder>/<id>.pdf` (and `.gif`). The Alhambra
entries found so far are `data187/AL1` and `data182/AL01`–`AL09`; `index.json` in
`docs/research/alhambra-wichmann/` lists their titles, geometry and references.

Run from `docs/research/alhambra-wichmann/`:

1. `1_pieces.py <name>`: the filled polygons of `<name>-vec.json` (written from the PDF
   with PyMuPDF, `page.get_drawings()`), as clean outlines: spikes drawn back and forth
   cancel, the rest is chained (`<name>-pieces.json`).
2. `2_centrelines.py <name> <n>`: the band width (gap between facing edges) and every
   piece moved out by half a band, in units of the star spacing / n
   (`<name>-centre.json`); use n = 2 for the tutorial frame.
3. `3_overlay_photo.py <dump.json> <out>`: the tutorial's ink over David Wade's photo of
   a carved panel with the same design (`photo-overlay.png`).

`gen_bath_stars.py <research dir> tutorials/alhambra-bath-stars.json` builds the Comares
bath stars (AL01), then `finish.py <dump.json> <tutorial>` writes the expect block.

Result (6 October), AL01: every band is a side of one of two eight-pointed stars made of
two squares, carried on: a large star on each grid point (two units apart) and a small
star at each corner of the cell. The radii are Rb = 1/(3 − √2) and Rs = 1 − Rb (matching
the drawing to 0.001); Rb is where the line from the corner (1, 1) to (0, −1) crosses the
22.5° line from O, and the small circle runs through the point on the cell side level with
the large star's top. Four pieces: the large star, a twelve-sided bar between two large
stars, a fourteen-sided cross arm (area √2 − 1) and the small star. Wade's photo MOR 0711
(a carved wooden panel, place not given) shows the same design; our lines run along its
bands. AL09 (Mexuar patio) is a further candidate.

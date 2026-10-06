# Alhambra panels from Brian Wichmann's Tiling Search

Tiling Search (tilingsearch.mit.edu, CC BY-NC-SA) draws each pattern as a vector PDF:
`https://tilingsearch.mit.edu/contents/<folder>/<id>.pdf` (and `.gif`). The Alhambra
entries found so far are `data187/AL1` and `data182/AL01`–`AL09`; `index.json` in
`docs/research/alhambra-wichmann/` lists their titles, geometry and references.

The location index (`https://tilingsearch.mit.edu/area/Spain.html`, one row per monument)
lists 129 Alhambra and Generalife entries; `alhambra-index.json` holds them with their
references, and `wade-paired.json` the 83 that cite a David Wade photo. Wade's photos are at
`https://patterninislamicart.com/image/original/<code>.jpg`, the code in lower case with an
underscore (`SPA 0204` → `spa_0204`, `SPA 0408x` → `spa_0408x`).

Run from `docs/research/alhambra-wichmann/`:

0. `0_vectors.py <name>` (with `uv run --with pymupdf`): `<name>-vec.json` from `<name>.pdf`.

1. `1_pieces.py <name> [--no-grey]`: the filled polygons of `<name>-vec.json` (written from the PDF
   with PyMuPDF, `page.get_drawings()`), as clean outlines: spikes drawn back and forth
   cancel, the rest is chained (`<name>-pieces.json`).
2. `2_centrelines.py <name> <n>`: the band width (gap between facing edges) and every
   piece moved out by half a band, in units of the star spacing / n
   (`<name>-centre.json`); use n = 2 for the tutorial frame.
3. `3_overlay_photo.py <dump.json> <out> [picks.json]`: the tutorial's ink over a photo,
   registered by a homography on motif centres (`photo-overlay.png`); without picks it
   uses Wade's MOR 0711 for the bath stars, `dado-picks.json` holds the dado's octagons.

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

J43A, the Comares dado (6 October): octagons on the grid, a long hexagon between each two,
and five squares in a cross at each corner. Every edge is a line at 0°, 45° or 90° set by
one length t, the half-diagonal of the corner square; the line from the corner (−1, 1)
through the diagonal's crossing with the circle meets the side x = 1 at 1 − t, so
t = 6 − 4√2 (drawing: 0.3428 ± 0.0005). `gen_comares_dado.py` then `finish_dado.py`
(the corner square, nth 0, is white as on the dado). Checked against Wade's SPA 0204.

Parked: AL09 (Mexuar patio, no photo found; the CC0 Cuarto Dorado zellige panel is a
different, non-repeating design) and AL1 (the banded star and cross, already in the library).

M060, the Sala de los Reyes (6 October): the same {8/3} star on a circle of radius ½ round
every grid point (grid 1), with the star's octagon; octagons and four-armed crosses alternate
like a chessboard at the centres. The crosses' notches are 45° lines at d = ½ − sin 22.5°
from the centre (the octagon's side marked inward from the star's point; drawing 0.1173).
`gen_reyes_stars.py` then `finish_reyes.py` (kites round the crosses dark, by nth).
Checked against Wade's SPA 0408x (`reyes-picks.json`): every piece lines up; the panel's
top two rows repeat instead of alternating, probably a repair.

CM052, the Sala de la Barca (6 October): the Comares bath design turned by 45°, with the small
star reduced to its square on the cell's sides. All diagonal lines are the bath's; the
horizontal and vertical ones near the corner sit at 1 ± Rs/2, through the middles of the small
square's sides. `gen_barca_stars.py` (reuses `gen_bath_stars.build`) then `finish_barca.py`.
Checked against Wade's SPA 1624x (`barca-picks.json`).

C55, the Patio de los Leones (6 October): a pinwheel (chiral). Stars of two squares with
R = 1/(2√2 − 1) (drawing 0.5471), frets on the diagonals of the unit grid (Wichmann draws it
turned by 45°). R comes from one line: from the circle's 45° point through (0, ½) to the 135°
diagonal. `gen_leones_fret.py` then `finish_leones.py`; checked against Wade's SPA 0218
(`leones-picks.json`, star centres refined by eight-fold self-similarity, kept only where it
scores above 0.55: lower scores land off the stars).

PG299, the Patio de los Arrayanes (6 October): Wichmann's proportions do not match Wade's
photo SPA 0111. On the real dado each large square is inscribed in the unit circle about its
cell corner (half-side 1/√2, Wichmann has 0.77) and each white band tile ends in a point, its
seams on the diagonals from the square's corner to the star's point. The tutorial follows the
photo and keeps Wichmann's star (half-side of its square (3 − √2)/7). Its ink is written
directly in `gen_arrayanes_squares.py` (no PDF needed); `finish_arrayanes.py`;
`arrayanes-picks.json` (stars found by edge template matching).

PG365, the Sala de los Reyes fret (6 October): chiral. Horizontal and vertical lines at odd
sixths of OA, diagonal lines in pairs x ± y = (2k + 1)/3 ± e with e = (1 − 1/√2)/3, the sides
of small diamonds at the thirds. `2_centrelines.py` was run with the 24-cornered crosses as
centres. `gen_reyes_fret.py` then `finish_reyes_fret.py`. Registration on Wade's SPA 0405x was
fitted to all 42 diamonds detected in the photo (template matching, then a search over scale,
offset and hand), which is far more reliable than reading centres by eye.

P069, the Sala de los Reyes twelve-pointed stars (6 October): stars on a triangular grid
(Wichmann's neighbours at 30° and 90°; turned by −30° for the tutorial). Every edge is one of
twelve lines round each star touching a circle of radius (√3 − 1)/4, or a side of the hexagon
through the circle's points at 0°, 60°…. `gen_reyes_dodecagram.py` (with a hexagon clipper)
then `finish_reyes_dodecagram.py`; checked against Wade's SPA 1908 (`reyes-dodec-picks.json`).
`3_overlay_photo.py` now repeats the tile by the dump's own cell vectors (hexagonal cells too).

P042 (Mirador de Lindaraja), parked 6 October: `gen_lindaraja_rosettes.py` builds Wichmann's
drawing exactly (each star two squares turned 22.5°, sides carried on; pieces match his to
0.001), but Wade's photo SPA 1009 shows a different panel: smaller stars, a lobed flower at each
cell corner, and pentagonal petals each touching one star and one flower (Wichmann's petals
join two stars). No tutorial until a photo of his panel is found.

SPA1416, the Salón de Comares framed stars (6 October): both stars are two squares of radius
R = 1 − 1/√2 (half-side a = R/√2); the frame round the star at O is at b = 2R − a (where the
diagonal through the star's point crosses the horizontal through its inner corner); small
diamonds on the cell sides with half-diagonal c = √2(R − a). `gen_comares_frames.py` then
`finish_comares_frames.py` (honey star at O by nth). Registration on Wade's SPA 1416 was fitted
by maximising the photo's brightness along our lines (the white bands), giving OA = 344 px.

CM026, a Generalife ceiling (parked 6 October): `gen_generalife_ceiling.py` builds Wichmann's
drawing exactly (octagon apothem 1/√2, corner stars of radius √2 − 1), but Wade's photo SPA 0305
shows each octagon inside a square frame and smaller relative to the grid, so the design does
not match the photo. Needs a photo of the drawn panel, or a reading of the ceiling itself.

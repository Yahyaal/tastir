# Design H2: minbar doors from Cairo (Metropolitan Museum 91.1.2064)

Source photo: the Met's public-domain image of the "Pair of Minbar Doors", Egypt, probably
Cairo, about 1325–30 (`DP235241.jpg`, 2542 × 4000), saved as
`docs/research/design-h2/met-qawsun-doors.jpg` (private). Fetch the image list with
`curl https://collectionapi.metmuseum.org/public/collection/v1/objects/444812`.

Run from `docs/research/design-h2/` with `uv run --with numpy --with scipy --with scikit-image
--with pillow python <script>`:

1. `1_composite.py`: one tile averaged over the two whole rosettes with six-fold symmetry
   and mirrors (`tile-composite.png`, ±1.3 units). Sharp: the design is six-fold.
2. `2_composite_d2.py`: the same with mirrors only. Blurry: the two door leaves meet on a
   seam through the rosette centres and are slightly offset, so keep to step 1.
3. `3_straight.py`: the panel straightened into the tutorial frame, unaveraged
   (`straight.png`, 300 px per unit, O at the upper rosette).
4. `4_inlays_folded.py`: the ivory-rimmed inlays fitted and folded into one fundamental
   triangle (noisy at the seam).
5. `5_band_lines.py`: band centrelines (`band-skeleton.png`) and straight runs at multiples
   of 15° (`band-runs.json`); folded by nearest rosette they give the star lines (0.20,
   normals every 30°) and the lines touching the circle.
6. `6_cells.py`: each inlay grown into the wood (watershed), so the borders are the joints
   (`cells.png`, `cells.json`). Read with care: a small inlay at a vertex (the
   five-pointed stars) gets a cell of its own and cuts the corners of its neighbours.
7. `7_compare.py <dump.json> <out>`: the photo beside the tutorial's ink, whole and
   between three rosettes, for the review page.

Result (5 October): the rosette is Samira Mian's first twelve-fold rosette (inner circle
tan 37.5°, star lines joining its points 150° apart, 0.1986 from O) on her hexagonal tile,
inked differently: a small star (points at 0.397) ringed by kites whose tips are her
inner-circle points; shields from each star point to the kites' tips, then out along the
15° lines to the points where the lines touching the circle at its twelve points meet
(1/cos 15° from O); each shield ends flat on one of those touching lines. Between three
rosettes this leaves an equilateral triangle, and each five-pointed star of the doors is
inlaid where five bands meet, at a corner of a triangle. `gen_minbar_doors.py` builds the
tutorial, `finish.py` writes its expect block.

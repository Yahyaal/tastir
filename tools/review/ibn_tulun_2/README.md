# A second Ibn Tulun window grille (parked)

Source photos: Wikimedia Commons, "Ibn Tulun Mosque window DSCF3561.jpg" and its
neighbours (DSCF3571 … DSCF3604), CC BY-SA 4.0, saved in `docs/research/ibn-tulun-2/`
(private). DSCF3561 (`w0.jpg`) is a design the library does not have: small six-pointed
star openings on a triangular lattice, a 60° rhombus at each midpoint between two stars,
and around each star six long openings, each lying across one side of the hexagon round
the star and pointing away from it; three of them meet round each triangle between the
hexagons, which reads as a cube. DSCF3603 (`w5.jpg`) is a hexagon-and-triangle band grid
filled with curved arcs, which needs curved ink; DSCF3600 is close to
`six-fold-star-and-hexagons`.

Run from `docs/research/ibn-tulun-2/` with `uv run --with numpy --with scipy --with
scikit-image --with pillow python <script>`:

1. `1_rectify.py`: matches one star opening, which also finds the cube centres; the
   matches form a fine triangular lattice (stars are every second point), and a
   homography is fitted to them (residual 2 px median).
2. `2_straight.py`: straightened grille (`straight.png`), turned 30° from the photo.
3. `3_composite.py`: six-fold average about every star; blurry, because the openings
   are deep and their inner walls shift with the viewing angle.
4. `4_edge_profile.py`, `5_front_edges.py`: folded edge histograms; too noisy to read the
   band widths.
6. `6_frontal.py n out.png`: the part of the grille near the camera's axis, straightened in
   the photo's own orientation (`frontal.png`); the clearest picture of the front faces.

Read so far (tutorial units, stars 2 apart, neighbours at 30°, 90°…): every front edge
runs at 0°, 60° or 120°; the star opening is a hexagram with points at radius about 1/3;
each rhombus has sides about 0.35 and its long diagonal along the line between the two
stars; each long opening is about 0.32 wide and runs from radius about 0.4 to 1.05. These
do not sit on one simple triangular grid, and there is no published construction to check
against. To resume: measure each opening's front outline on `frontal.png` by hand
(walls show on the upper side, so the lower edges of the white are front edges), fit the
band centre lines, and look for a construction that gives them.

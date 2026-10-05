# Design H1: the al-Maridani minbar (Cairo, 14th century)

Source photo: Wikimedia Commons, "Caïro. Amir al-Maridani-moskee Minbar Detail van het
houten maaswerk, GDE002950.jpg" (a lantern slide), saved in `docs/research/design-h/`
(private). A published construction of the same rosette: Samira Mian, "Twelvefold Islamic
Geometric Rosette" (samiramian.uk/twelvefoldrosette).

Run from `docs/research/design-h/` with `uv run --with numpy --with pillow python <script>`:

1. `1_rectify.py`: refines six rosette centres by twelve-fold self-similarity and fits a
   homography to the unit square grid they sit on (`homography.npy`).
2. `2_straighten.py`: `rectified.png`, the panel straightened.
3. `3_average_by_class4.py <0|1>`: four-fold averages of the two motifs, which alternate
   like a checkerboard (u + v even: twelve-pointed star; odd: twelve-sided centre).
4. `4_average_by_class12.py <0|1>`: twelve-fold averages. The star rosette is exactly
   twelve-fold out to its shield petals; the other motif is only four-fold.

So in the tutorial frame (rotate 45°, OA = half the distance between star rosettes) it has
Design E's layout: rosettes at (0, 0) and (2, 0), a four-fold motif at the corner (1, 1).

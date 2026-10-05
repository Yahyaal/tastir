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
5. `5_composite.py`: the tile in the tutorial frame (rosette at O, corner motif at (1, 1)):
   twelve-fold average inside r = 0.8, four-fold outside (`tile-composite.png`).
6. `6_joint_network.py`: the pattern lines are the joints between the pieces' frames.
   Pieces = inlaid pieces (white rims, filled) plus plain wooden pieces (smooth texture);
   the skeleton of what is left is the joint network (`mask2.png`, `skel2.npy`).
   (Brightness and texture-direction masks were tried first and do not separate frames
   from pieces in this woodwork.)
7. `7_joint_graph.py`: branches simplified into straight edges (`raw-segs.json`).
8. `8_symmetric_net.py`: corners clustered with the tile's four-fold symmetry and edges
   snapped to them (`fit4-in.json`, `fit4-in.png`). The rosette and its first ring come out
   clean; the corner motif region (r > 1.05) is still to do.

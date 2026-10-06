# Design H3: the minbar of the mosque of al-Nasir Muhammad, Cairo Citadel (1318–35)

Source photo: Wikimedia Commons, "Cairo, cittadella, moschea di an-nasr mohammed,
1318-1335, minbar, intarsi.JPG" by Sailko (CC BY 3.0), saved as
`docs/research/design-h3/nasir-minbar.jpg` (private).

Run from `docs/research/design-h3/` with `uv run --with numpy --with scipy --with pillow
python <script>`:

1. `1_rectify.py`: refines four rosette centres (twelve-fold self-similarity) and three
   motif centres between them (four-fold), and fits a homography from the tutorial frame
   (rosettes at (0, 0), (2, 0)…, motifs at (1, 1)…) to the photo (`homography.npy`;
   residuals 1–6 px).
2. `2_composite.py`: the tile averaged over thirteen rosette positions, twelve-fold inside
   r = 0.8 and four-fold outside (`tile-composite.png`).

Then `tools/review/design_h/10_overlay_tutorial.py` draws a tutorial's ink over it.

Result (5 October): the panel is the same design as the al-Maridani minbar (H1), that is
`mian-stellated-rosettes`: every inlay sits in one of its pieces, the corner octagon, the
small hexagons and chevrons, the five-pointed stars and the shields included. So it adds a
second real example to that tutorial rather than a new one.

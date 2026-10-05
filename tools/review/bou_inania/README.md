# Bou Inania wall (Design E): reading the photo

Run from `docs/research/bou-inania/` (private, not in git) with
`uv run --with numpy --with pillow --with scikit-image python <script>`, in order:

1. `1_rectify.py`: fits a homography from the rosette grid (spacing 1) to the photo and
   writes `rectified.png` (300 px per unit).
2. `2_closeups.py`: a straightened close-up `hires-u-v.png` (±0.75 units) of each rosette.
3. `3_centres.py`: refines each close-up's centre by rotational self-similarity.
4. `4_fit_and_average12.py`: refines centre and mirror axis with twelve-fold symmetry and
   averages the five clean rosettes into `avg12.png` (±0.55 units), which is sharp.
5. `5_average4.py`: the whole tile averaged with four-fold symmetry, `avg4.png` (±0.6 units).
6. `6_line_runs12.py`: band centrelines (skeleton) and, for lines whose normal is at 0° or
   15° from a twelve-fold axis, the stretches that follow a centreline (`runs12.json`).
7. `7_trace12.py`: merges neighbouring lines and draws the twelve-fold tracing.
8. `8_wedge12.py`: one 30° wedge of the tracing, each line numbered.
9. `9_explain_by_crossings.py`: greedily explains each traced line as passing through a
   crossing of earlier ones (only the first few choices are meaningful).

Findings are in `docs/patterns/QUEUE.md` under Design E.

Second pass (the band network itself, which works better than line search):

10. `10_band_graph12.py`: skeleton of the white bands in `avg12.png`, each branch walked and
    simplified into a polyline; vertices folded into one 15° wedge and clustered
    (`verts12.json`, 18 classes).
11. `11_snap_classes12.py`: snaps the polylines to those classes and lists the edge orbits.
12. `12_ideal_net12.py`: ideal positions with every core edge at a multiple of 15°, then
    adds long lines (three or more vertices) greedily while the fit stays within 0.0045
    of the photo (`ideal12b.json`).
13. `13_construction_order12.py`: checks that the net follows from one seed vertex by
    crossings of 15° lines through vertices already found, and prints the order.
14. `14_average_corners_edges.py`: averages every corner (four-fold) and every edge
    midpoint (mirror both ways) around the six fitted rosettes, each centre refined
    first (`corner-avg.png`, `edgeV-avg.png`, `edgeH-avg.png`, ±0.24 units). Slow (about
    an hour); run it in the background.
15. `15_stitch_tile.py`: stitches the rosette, corner and edge averages into one sharp
    tile, `tile-composite.png` (±0.6 units), the reference for the outer region.
16. `16_band_graph_tile.py`: the band network of the stitched tile, with the mask smoothed
    and dead-end spurs under 0.04 pruned (`raw-segsT.json`).
17. `17_snap_classes_tile.py`: folds it with the tile's four-fold symmetry and keeps edge
    orbits seen at least three times (`graphT.json`). It catches the corner stars and their
    octagon but not the orange ring or the grid-line bands, so the outer region is drawn by
    hand (next step).
18. `18_anchor_rosette.py`: ties the rosette to the tile and writes `ideal12e.json`. A copy
    of vertex class 9 lies on the line joining the edge midpoints (½, 0) and (0, ½), and
    another copy on the 75° line through the corner (½, ½); the rim vertex (class 13) is
    where the circle of radius √2/2 about a class-9 copy (through the copy half a tile away
    diagonally) meets the axis. The long line through classes 4, 6, 7 is dropped to keep
    the system exact. Every constraint holds to 1e-12; rms 0.0044 from the photo.
19. `19_rosette_build_order.py`: the order in which a tutorial can draw the rosette from
    those two anchors, each vertex the crossing of two 15° lines through vertices found.

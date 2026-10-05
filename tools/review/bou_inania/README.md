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

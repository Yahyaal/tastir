# Geometry notes

These are the lessons from building the Zellige Studio prototype and from trying to reconstruct real patterns. The first part is about method, the second lists bugs that already happened once, and the third records what is known about two patterns we want as tutorials.

## How these patterns are drawn

Two methods exist, and the app is built on the first.

**The hand method** is what tutorials teach. You draw a circle, divide it, and add more circles and lines. Every new line is ruled through two points where earlier circles or lines cross, and every new circle is centred on a crossing and sized by another crossing or by touching a line. Nothing is measured. Construction lines run across the whole drawing, and the pattern is picked out from them at the end by inking only some segments.

**The polygonal method** (Hankin, Bonner, Kaplan) lays down a grid of polygons and draws a motif inside each one. It is good for generating patterns by program, and the prototype uses it. It is not how people draw by hand, it tends to produce odd leftover pieces between motifs, and it gave results that did not look like real Moroccan work. Keep it out of the tutorial engine.

A useful test for any reconstruction: every line in the finished pattern must pass through at least two crossing points of the construction. When a line does not, a circle is missing from the construction.

## Bugs that already happened

**Lines that stop in mid-air.** In a rosette, each petal line must end where it meets its own mirror image. Trimming a line at "its n-th crossing with any other line" fails, because the other line may already have been cut short. Trim at the polygon's mirror lines instead (the spokes through corners and through edge midpoints), because a line always meets its reflection there.

**Stubs inside pieces.** After building the graph of segments, remove every vertex that has only one neighbour, and repeat until none are left. Otherwise loose line ends are drawn inside a piece.

**Edges that lie on top of each other.** When two tiles touch along an edge, their edges are collinear and overlap, and a crossing test finds no intersection. Split each of the two segments at the other's end points, or the face walk produces wrong pieces.

**Touching circles look like overlapping circles.** Two polygons that share an edge have circumscribed circles that overlap and inscribed circles that touch. When a construction says circles touch, check which circle it means before drawing.

**Octagons that point a corner at the centre.** Eight octagons with sides in the four directions (0°, 45°, 90°, 135°) around a centre touch it with corners, so their inscribed circles stop short of the centre circle by about 8% of their radius. This is geometry, not a bug, but it looks like a gap in the drawing.

**Piece types counted twice.** Group pieces by shape only (vertex count, area, perimeter, and side lengths if needed). Grouping by which motif a piece sits in makes identical shapes show up as different types.

**Slivers.** A piece with area / perimeter² below about 0.02, or with a tiny area, cannot be cut from tile. Flag it as a sign that the construction or the inking is wrong; do not ship it.

**Symmetric tiles, asymmetric results.** Any greedy matching of line ends must treat equal-cost choices symmetrically, or a symmetric tile gets a lopsided pattern.

**Tangency in floating point.** A tangent line meets a circle in one point, but the discriminant comes out as a tiny positive or negative number. Treat a discriminant within tolerance of zero as exactly one point.

## Known values for tests

With the main circle of radius 1 divided into 8 by a static and a dynamic square:

- The two squares cross at 8 points at distance √(2−√2) = 0.76537 from the centre, on the 22.5° rays.
- A circle centred on one of those crossings and touching the vertical and the 45° diagonal has radius 1 − 1/√2 = 0.29289. Eight of them form a ring in which neighbours touch.
- The lines through those circles' centres are at ±0.29289 (horizontal and vertical) and ±0.41421 (diagonal, measured along the axis). Two of them cross on the 67.5° ray; a circle there touching the vertical and the diagonal has radius 0.29289 × tan 22.5° = 0.12132.
- A circle about the centre that encloses that small circle and touches its far side has radius 0.43835 (used by `eight-fold-zellige`). Kurt's construction instead touches its near side, radius 0.19570.
- Star and cross: star area 2.34315, cross area 1.65685, cell area 4.

## Pattern research: the classic eight-fold zellige

Sandy Kurt publishes a free 19-step PDF tutorial for an eight-fold zellige (https://sandykurt.com/free-tutorials). Its drawings were downloaded on 4 October 2026 and show that the tutorial in `tutorials/eight-fold-zellige.json` is a different, simpler design, not a reconstruction of hers; both are kept (owner's decision). Her drawings also correct two values guessed below from the text: the step-9 circle touches the step-8 circle on its near side (radius 0.19570, not 0.43835), and the step-13 lines join ring-circle centres two apart. `tools/review/kurt8/kurt_geom.py` computes her construction exactly. `docs/research/eightfold-zellige-reconstruction.png` shows a reconstruction from the text alone.

Steps 1–10 and 17 are unambiguous and give the values above. Steps 11–16 are ambiguous from the words ("the intersection", "4 pairs of lines connecting the centres"), and the reconstruction of them is probably wrong. Steps 18–19 (inking, and the central rosette) depend on them.

For our own tutorial of this pattern, the construction must be worked out again from the geometry and checked against photos of real examples. Our step text and drawings must be our own, and if the final sequence follows this PDF closely it needs credit and, better, the author's permission.

## Pattern research: the Fès panel

`docs/research/fes-panel-photo.png` is the target: a 24-fold medallion ringed by eight 8-fold clusters, with eight 16-fold rosettes around them, repeating on a square grid. The photo is 1008 × 1184 px with the medallion centre at about (497, 583).

**What is established** (`fes-step1-circles.png` shows it over the photo):

1. A centre circle, divided into 16 by spokes.
2. Eight equal ring circles on the 22.5° spokes, each touching its neighbours and the centre circle. If their centres are at distance d, their radius is ρ = d·sin 22.5° and the centre circle's radius is R = d − ρ. In the photo d ≈ 250, so ρ ≈ 95.7 and R ≈ 154.3.
3. Eight rosette circles of radius R, each the mirror image of the centre circle across the line joining two neighbouring ring centres. Their centres are at distance 2d·cos 22.5° ≈ 462. The four on the axes sit halfway to the next medallion, so the panel repeats with period ≈ 924.

**What is established inside the ring circles** (`fes-steps-5-6-ring-lines.png`, `fes-step6-closeup.png`): draw 16 circles of radius ρ centred on the ring circle's own 16 division points. Lines in the four directions (0°, 45°, 90°, 135°) through pairs of their crossings sit at 0.131, 0.293, 0.541, 0.707 and 0.866 of ρ from the ring centre. Every edge of the 8-fold cluster in the photo lies on one of these (measured: 0.125, 0.29, 0.52–0.54, 0.72, 0.85).

**What is not known yet:** which segments of those lines are inked to make the cluster; the construction inside the rosettes (16 directions) and the medallion (24 directions); and the black stars and gold bands in the spaces between circles. Almost every edge outside the rosettes and medallion runs in one of the four directions, which suggests the cluster lines carry on across the gaps.

This pattern is a later tutorial, not a phase 0 or phase 1 target. It is recorded here so the work is not lost.

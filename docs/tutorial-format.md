# Tutorial format, v0

This is the first concrete version of the format the PRD describes. It is a proposal: task 0.4 turns it into a Zod schema, and names can change there if something reads better. The five rules below cannot change, because the whole product depends on them.

The complete worked example is `tutorials/eight-fold-star-and-cross.json`. Read it next to this page.

## The five rules

1. **No coordinates.** A tutorial never contains an x or y value. The only free things are the `given` points, and every other element is built from earlier ones, as with a compass and ruler.
2. **Only look backwards.** An element may reference only elements created in an earlier step, or earlier in the same step.
3. **Pick by rule, never by index.** When two elements meet in more than one point, the step says which point it means with a `pick` rule. "The second intersection" is not allowed, because its meaning depends on how the engine happens to order results.
4. **Ambiguity is an error.** If a `pick` still matches two points, or matches none, the engine stops with an error that names the step, the element and the candidates. It never guesses.
5. **One unit.** Every length is relative to the distance between the first two given points, so a tutorial has no scale.

## The frame

Every tutorial starts from two given points, `O` and `A`. They define the frame that `pick` rules use: `O` is the origin, the direction from `O` to `A` is 0°, and angles grow counter-clockwise with y pointing up. The player may place `O` and `A` anywhere on screen; angles are only ever used to choose between candidate points, never to position anything.

## Elements

Each entry in a step's `create` map is `"name": { "<kind>": { ... } }`.

| Kind | Forms | Meaning |
| --- | --- | --- |
| `point` | `{ "meet": [a, b], "pick": {...} }` | a point where elements `a` and `b` cross; `pick` is required when they cross more than once |
| `points` | `{ "meet": [a, b], "pick": { "all": "byAngle" } }` | every crossing, named `name.1`, `name.2`, … in counter-clockwise order starting from 0° |
| `line` | `{ "through": [p, q] }` | the line through two points |
| | `{ "through": p, "perpendicularTo": l }` | the perpendicular to `l` through `p` |
| | `{ "through": p, "parallelTo": l }` | the parallel to `l` through `p` |
| | `{ "through": q, "bisects": [p, q, r] }` | the bisector of the angle `p q r` at its vertex `q` |
| `circle` | `{ "centre": p, "through": q }` | centre `p`, passing through `q` |
| | `{ "centre": p, "radiusOf": c }` | centre `p`, same radius as circle `c` (the compass keeps its opening) |
| | `{ "centre": p, "radiusFrom": [q, r] }` | centre `p`, radius equal to the distance `q r` |
| | `{ "centre": p, "tangentTo": [x, ...] }` | centre `p`, just touching every listed line or circle; an error if no single radius does that |
| | `{ "centre": p, "tangentTo": [x, ...], "touch": "near" }` | the same, touching each listed circle on its `near` side (the side facing `p`) or its `far` side (going round it, so the new circle encloses it); needed when a circle can be touched both ways |
| `polygon` | `[p1, p2, ...]` | a closed polygon through the points in order; its sides are segments, and it can be used in `meet` |
| `repeat` | `{ "of": [names], "by": "rot8" }` | copies of the named elements under a symmetry about `O` (`rot3`, `rot4`, `rot5`, `rot6`, `rot8`, `rot10`, `rot12`, `rot16`, `mirror:<line>`); copies are named `name@1`, `name@2`, …; with `"distinct": true`, copies that land on the original or an earlier copy (a line through `O` turned by 180°) are left out and their names do not exist |

Lines are infinite for the purpose of `meet`. Polygon sides and inked paths are segments.

## Pick rules

| Rule | Chooses |
| --- | --- |
| `{ "angle": 45 }` | the candidate whose direction from `O` is closest to 45° in the frame; an error if two are equally close |
| `{ "nearest": "P" }` / `{ "farthest": "P" }` | the candidate nearest to, or farthest from, point `P` |
| `{ "inside": "c" }` / `{ "outside": "c" }` | the candidate inside or outside circle or polygon `c` |
| `{ "all": "byAngle" }` | all candidates, ordered counter-clockwise (only with `points`) |

Rules can be combined; all must hold.

## Steps

```json
{
  "id": 3,
  "text": "Halve each right angle to get the two diagonals.",
  "create": { "...": "..." },
  "highlight": ["h", "v"],
  "animate": "ruler"
}
```

`text` is what the learner reads. `highlight` lists earlier elements the step depends on, which the player flashes before drawing. `animate` is `compass`, `ruler` or `fade`.

A step with `"hidden": true` is evaluated like any other but never shown: the player skips it, never draws its elements and leaves it out of the step count. Use it only for a step that names the points the ink turns at, which the learner does not need to see; a new tutorial can usually ink `along` its lines instead (see Ink, below).

Helper lines are lines the ink never runs along: they only help find points. The player hides the ones nothing needs unless the learner turns on “Show helper lines” (the engine's `hiddenHelpers` decides which: a helper line stays when a point that a shown element, the ink or the tile relies on can be found no other way), and skips a step that would then draw nothing new. A step (or part) whose text describes lines that are hidden then, or refers to a skipped step, gives `"textWithoutHelpers"`: its text for a drawing without helper lines, in plain words that match what is shown. A test checks that every shown step making hidden helper lines, and every first shown step after a skipped one, has it.

A long step can be split into `parts` instead of having one `create`: each part has its own `text`, `create`, and optional `highlight` and `animate`, and the step's own `text` becomes the heading shown over each part. The player shows a part as “Step 11 · 2 of 4”, and Next and Back move one part at a time. Give each part one move (one new line and its copies, say), so the learner sees one thing happen at a time. A step has either `create` or `parts`, never both.

## Small pieces

A piece in `expect.pieces` may carry `"small": true` when it is small or thin on purpose, as in fine zellige. The golden test rejects every other sliver, so the flag only covers pieces the author has named and looked at.

## Chiral patterns

`"chiral": true` says the pattern turns into itself by 360°/`fold` but has no mirror symmetry, like a pinwheel. The golden test then checks the rotation only, and also checks that the mirror really is missing, so the flag cannot hide a broken mirror-symmetric pattern.

## Photos of the original

`photos` (optional) lists photos of the real pattern, which the player shows beside the wall when the learner presses "Compare with the original". Each has a `file`, a `caption`, the `creator`, the `license` and the `url` of its source. A free photo (public domain or Creative Commons) ships: `file` is its name in `apps/player/public/photos/`, and the caption says when it was cropped. A photo we may not ship has `"private": true`: `file` is its path under `docs/research/`, the dev server shows it, and the built app shows a placeholder with a link to the source until a free photo is found. The player's tests check that every free photo named exists and that nothing else is in the folder.

## Ink, pattern, expect

`ink.paths` lists the pattern lines. Each path goes `through` named points in order, and every pair of neighbouring points must lie on one existing line, circle or polygon side; the engine checks that. This is what stops a tutorial from inking a line that the construction never produced.

A path can instead run `along` one line or polygon and stop where it meets two other elements, so no step has to mark its ends: `{ "along": "L0", "from": "L36", "to": "L22" }` inks the piece of line `L0` between its crossings with `L36` and `L22`. Each end is the name of a point on the line, the name of an element that crosses it once, or `{ "cross": "c", "pick": { ... } }` when the element crosses it more than once, with the same pick rules as a `point` step. Along a polygon, both ends must lie on one of its sides. A missing or ambiguous end is an error naming the path, as for a step. This is how free inking is written back into a tutorial, and it replaces hidden steps that only mark the turning points.

`pattern.cell` names the polygon that repeats, and the wall is made by translating it edge to edge. It is a rectangle, a parallelogram whose copies also line up into a rectangle, or a hexagon whose opposite sides are equal and parallel. Six- and twelve-fold patterns use the hexagon: their rosettes sit on a triangular lattice, and the hexagon around `O` (with corners on the 30° directions, so its sides face the neighbouring rosettes) is how these patterns are drawn by hand. The hexagon repeats by sliding it onto the next hexagon side to side. Ink only inside the cell, and cover the whole of it; free inking offers only the construction inside the cell, so a cell that reaches beyond the construction (a rhombus with a corner at `O`, for instance) leaves the learner pieces they cannot ink. The optional `pattern.text` is what the learner reads when the player repeats the inked tile. `pattern.colors` gives the default palette key for each named piece. `pattern.look` sets how the wall is shown at first, as on the real pattern: `tiles` (separate tiles with grout, the default), `strapwork` (the lines as bands between the pieces, for carved wood and plaster and for Fès zellige), `interlace` (the same bands woven over and under at every crossing, as in lacería) or `lines`. `pattern.palette` names the preset palette to start from (Fès tile, Marrakech, Chefchaouen, Tétouan, Isfahan, Kashan, Alhambra).

`pattern.panel` optionally names a larger convex polygon that holds the cell, for a tile that carries a shared band on only two of its sides (Bou Inania). The ink stage traces this whole panel, with its band on every side, and its neighbours slide out overlapping it by a band; the engine fills the panel with the ink of the cell and its copies and joins pieces that run straight on. The cell stays the repeat: the wall, the pieces and the coloring are unchanged. A panel that is not convex or does not hold the whole cell is an error.

Some walls color pieces of the same shape differently by where they sit: the Comares bones are white when they lie across and black, teal or brown when they stand up, by column. The optional `pattern.placements` says how. `repeat` is how many cells along the cell's two slides the coloring repeats after (`[2, 2]` for the bones). Each rule in `rules` names a piece from `expect.pieces` and a color (a palette slot or a CSS color), and may narrow which pieces it colors by `turn` (the direction of the piece's long axis in degrees from the horizontal, matched within 3°; pieces with no long axis, such as squares and regular stars, never match a turn), `nth` (the piece's place among the cell's pieces of that shape, counted along the cell's second slide, then its first, by the piece's centre) and `cell` (which cell of the repeat, `[0, 0]` to `repeat` minus one). Later rules win over earlier ones, and pieces no rule matches keep their `pattern.colors` slot. None of these are coordinates: they name directions and counts, never positions.

`pattern.rings: true` colours the wall ring by ring, as real zellige is coloured, instead of by shape. The player finds the rosettes' centres (the regular stars with the most points), groups the pieces by how far they sit from the nearest centre, and gives each ring a role: the centre a spark, then outward a main colour, a second colour and white, and again. Neighbouring rosettes take turns between the palette's colour families (two on a square lattice, three on a hexagonal one), tiny pieces are black, pieces as far from two rosettes of different families are white or black, and two rings of one colour never touch. The roles take their colours from the palette's glazes, so `pattern.palette` should name a tradition palette (Marinid zellige, Alhambra, Timurid tile, Mamluk wood). Hand corrections go in `pattern.rings.colors`, which gives a whole shape (`"petal": "white"`) or one of its rings, counted out from the centre (`"petal@2": "second"`), a role: `white`, `black`, `main`, `second` or `spark`. A pattern with no rosette is coloured by shape as before, from `pattern.colors`. A tutorial colours by rings or by placements, not both.

A tutorial with a photo of the real pattern should open looking like it. `pattern.original` holds that look: `palette`, five colours picked from the photo in the slots `a`, `b`, `c`, `d` and `ground` that `pattern.colors` (and any placements) map the pieces to; `lines`, the colour of the grout or of the bands' edges; `band`, the colour of the strapwork bands; and `carved`, true for carved plaster or wood, which draws the lines and bands in relief. The player opens such a tutorial in this palette, offered first as "The original"; the presets stay available, and with them the lines and bands go back to dark lines and light bands. Colours are written as `#` and six lower-case hex digits. Pick the clean average colour of each kind of piece, not its stains or repairs, and where the photo shows only part of the pattern, take the rest from the tradition's palette.

```json
"placements": {
  "repeat": [2, 2],
  "rules": [
    { "piece": "bone", "turn": 90, "cell": [0, 0], "color": "a" },
    { "piece": "bone", "turn": 90, "cell": [1, 1], "color": "a" },
    { "piece": "bone", "turn": 90, "cell": [1, 0], "color": "c" },
    { "piece": "bone", "turn": 90, "cell": [0, 1], "color": "b" }
  ]
}
```

`expect` holds the golden values for the tutorial's test: how many piece types there are, and each type's vertex count, area (in units of OA²) and count per cell. A piece is named in `expect.pieces`, and `pattern.colors` uses those names.

## The worked example

`tutorials/eight-fold-star-and-cross.json` builds the classic star and cross in six steps: a circle, the horizontal and vertical, the two diagonals, the dynamic square, the static square, and the square tile around the circle. The ink path walks the outline of the two squares, turning at each of their eight crossings.

Its golden values were checked numerically: the eight crossings sit at distance 0.76537 from the centre (√(2−√2)), and the pattern has exactly two piece types, a 16-vertex star of area 2.34315 and a 16-vertex cross of area 1.65685, one of each per cell of area 4. The cross only becomes a whole piece across four neighbouring cells, which is why pieces are computed on a 3×3 neighbourhood.

## Not in v0

Curved ink (arcs), free inking by the user, per-step camera, and credits per step are all in the PRD and come in phase 1 or later. Leave room for them but do not build them in phase 0.

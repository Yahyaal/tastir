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
| `repeat` | `{ "of": [names], "by": "rot8" }` | copies of the named elements under a symmetry about `O` (`rot3`, `rot4`, `rot5`, `rot6`, `rot8`, `rot10`, `rot12`, `rot16`, `mirror:<line>`); copies are named `name@1`, `name@2`, … |

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

## Ink, pattern, expect

`ink.paths` lists the pattern lines. Each path goes `through` named points in order, and every pair of neighbouring points must lie on one existing line, circle or polygon side; the engine checks that. This is what stops a tutorial from inking a line that the construction never produced.

`pattern.cell` names the polygon that repeats, and the wall is made by translating it edge to edge. It is a rectangle, a parallelogram whose copies also line up into a rectangle, or a hexagon whose opposite sides are equal and parallel. Six- and twelve-fold patterns use the hexagon: their rosettes sit on a triangular lattice, and the hexagon around `O` (with corners on the 30° directions, so its sides face the neighbouring rosettes) is how these patterns are drawn by hand. The hexagon repeats by sliding it onto the next hexagon side to side. Ink only inside the cell, and cover the whole of it; free inking offers only the construction inside the cell, so a cell that reaches beyond the construction (a rhombus with a corner at `O`, for instance) leaves the learner pieces they cannot ink. The optional `pattern.text` is what the learner reads when the player repeats the inked tile. `pattern.colors` gives the default palette key for each named piece.

`expect` holds the golden values for the tutorial's test: how many piece types there are, and each type's vertex count, area (in units of OA²) and count per cell. A piece is named in `expect.pieces`, and `pattern.colors` uses those names.

## The worked example

`tutorials/eight-fold-star-and-cross.json` builds the classic star and cross in six steps: a circle, the horizontal and vertical, the two diagonals, the dynamic square, the static square, and the square tile around the circle. The ink path walks the outline of the two squares, turning at each of their eight crossings.

Its golden values were checked numerically: the eight crossings sit at distance 0.76537 from the centre (√(2−√2)), and the pattern has exactly two piece types, a 16-vertex star of area 2.34315 and a 16-vertex cross of area 1.65685, one of each per cell of area 4. The cross only becomes a whole piece across four neighbouring cells, which is why pieces are computed on a 3×3 neighbourhood.

## Not in v0

Curved ink (arcs), free inking by the user, per-step camera, and credits per step are all in the PRD and come in phase 1 or later. Leave room for them but do not build them in phase 0.

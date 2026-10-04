# Zellige Studio prototype

`zellige-studio.html` is a single-file prototype, about 1,500 lines, with no build step. Open it in a browser to see it run. It generates patterns with the polygonal method, which the new engine does not use, but several of its parts are exactly what the engine needs. Port them into `packages/engine` as typed, tested functions; do not copy the file's structure.

## Worth porting

| In the prototype | What it does | Where it goes |
| --- | --- | --- |
| `lineX`, `segX`, `rayX` | line, segment and ray intersections | task 0.2 |
| `arrangement(segs, snap, tidy)` | splits segments at crossings (with a spatial grid and the collinear-overlap fix), removes dangling ends, walks the closed faces, and optionally merges slivers | task 0.6 |
| the class keys in `build()` (vertex count, area, perimeter) | groups pieces into types by congruence | task 0.6 |
| the 3×3 neighbourhood in `build()` and `polygons()` | makes pieces that cross the cell edge whole | task 0.6 |
| `patternDef`, `patternBody` | tiles one cell infinitely with an SVG `<pattern>` | task 0.8, then phase 1 |
| `playDrawing()` | step animation with stroke-dash and the Web Animations API, pause, speed, step mode | phase 1 |
| `pieceAt`, `highlight`, the pointer and wheel handlers | maps the pointer into the cell to find the piece under it, highlights every copy, pans and zooms | phase 1 |
| `PALETTES`, `renderPalettes`, `glazeOf` | preset palettes, custom palettes, color per piece type | phase 1 |

## Leave behind

`TESS`, `polygons`, `motifLocal`, `motifSpec`, `rosetteGeom`, `infer` and `panelTemplate` implement the polygonal method (grids of polygons with a motif in each). They are useful to read for the rosette construction and the mirror-line trimming rule, both explained in `docs/geometry-notes.md`, but tutorials are built from circles and lines, so none of this belongs in the engine.

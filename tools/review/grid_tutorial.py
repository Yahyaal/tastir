#!/usr/bin/env python3
"""Builds a tutorial for a design drawn on a square grid with its diagonals,
the method behind many Alhambra panels (Martínez Vela, "La Alhambra con
regla y compás").

The design is given as unit segments between grid points (horizontal,
vertical or one-square diagonal), in grid units with O at the origin and
y pointing up. The script writes the shared opening steps (the grid built
by compass steps, its diagonals, the tile), names every grid point the ink
needs, merges collinear segments into ink paths, and leaves `expect` for
`pnpm review` to fill in.

Usage: grid_tutorial.py spec.json tutorials/<id>.json

spec.json: {"id", "title", "style", "level", "credits", "given", "radius",
            "tile": [[x, y], ...] corners in grid units (on grid lines),
            "segments": [[[x1, y1], [x2, y2]], ...], "ink_text", "pattern_text",
            "step_texts": {optional overrides}}
"""
import json
import sys
from fractions import Fraction


def name(prefix, k):
    return f"{prefix}{'m' if k < 0 else ''}{abs(k)}"


def build(spec):
    R = spec["radius"]  # grid lines run from -R to R either way
    segs = [tuple(map(tuple, s)) for s in spec["segments"]]
    steps = []

    steps.append({
        "id": 1,
        "text": "Rule a horizontal line through the centre and draw a small circle. Its radius is one square of the grid, and the compass keeps this opening for the whole construction.",
        "create": {"h": {"line": {"through": ["O", "A"]}},
                   "c": {"circle": {"centre": "O", "through": "A"}}},
        "animate": "compass",
    })

    # Step 2: points along the horizontal at every whole number of squares.
    create = {}
    prev = {1: "A", 0: "O"}
    create[name("X", -1)] = {"point": {"meet": ["c", "h"], "pick": {"angle": 180}}}
    prev[-1] = name("X", -1)
    for k in range(2, R + 1):
        for sgn in (1, -1):
            centre = prev[sgn * (k - 1)]
            cname = f"cx{name('', sgn * (k - 1))}"
            create[cname] = {"circle": {"centre": centre, "radiusOf": "c"}}
            create[name("X", sgn * k)] = {
                "point": {"meet": [cname, "h"], "pick": {"farthest": "O"}}}
            prev[sgn * k] = name("X", sgn * k)
    steps.append({
        "id": 2,
        "text": "Walk the compass along the horizontal: put the point where the circle crosses the line and mark the next crossing, again and again, both ways. The marks are one square apart.",
        "create": create, "highlight": ["c", "h"], "animate": "compass",
    })
    X = {k: ("O" if k == 0 else "A" if k == 1 else name("X", k)) for k in range(-R, R + 1)}

    # Step 3: the vertical, and points up and down it the same way.
    create = {"v": {"line": {"through": "O", "perpendicularTo": "h"}}}
    create[name("Y", 1)] = {"point": {"meet": ["c", "v"], "pick": {"angle": 90}}}
    create[name("Y", -1)] = {"point": {"meet": ["c", "v"], "pick": {"angle": 270}}}
    prevy = {0: "O", 1: name("Y", 1), -1: name("Y", -1)}
    for k in range(2, R + 1):
        for sgn in (1, -1):
            cname = f"cy{name('', sgn * (k - 1))}"
            create[cname] = {"circle": {"centre": prevy[sgn * (k - 1)], "radiusOf": "c"}}
            create[name("Y", sgn * k)] = {
                "point": {"meet": [cname, "v"], "pick": {"farthest": "O"}}}
            prevy[sgn * k] = name("Y", sgn * k)
    steps.append({
        "id": 3,
        "text": "Rule the vertical through the centre, at right angles to the horizontal, and walk the compass up and down it in the same way.",
        "create": create, "highlight": ["h"], "animate": "compass",
    })
    Y = {k: ("O" if k == 0 else name("Y", k)) for k in range(-R, R + 1)}

    # Step 4: the grid.
    create = {}
    for k in range(-R, R + 1):
        if k:
            create[name("V", k)] = {"line": {"through": X[k], "perpendicularTo": "h"}}
            create[name("H", k)] = {"line": {"through": Y[k], "perpendicularTo": "v"}}
    steps.append({
        "id": 4,
        "text": "Through every mark rule a line at right angles to its axis. The lines make a square grid.",
        "create": create, "highlight": ["h", "v"], "animate": "ruler",
    })
    V = {k: ("v" if k == 0 else name("V", k)) for k in range(-R, R + 1)}
    H = {k: ("h" if k == 0 else name("H", k)) for k in range(-R, R + 1)}

    # Step 5: diagonals x - y = k (through X[k], parallel to d1) and x + y = k.
    used_minus = {x - y for s in segs for (x, y) in s if s[0][0] != s[1][0] and s[0][1] != s[1][1]}
    create = {"d1": {"line": {"through": "O", "bisects": ["A", "O", Y[1]]}},
              "d2": {"line": {"through": "O", "bisects": [Y[1], "O", X[-1]]}}}
    for k in range(-2 * R, 2 * R + 1):
        if k == 0 or abs(k) > R:
            continue
        create[name("Dm", k)] = {"line": {"through": X[k], "parallelTo": "d1"}}
        create[name("Dp", k)] = {"line": {"through": X[k], "parallelTo": "d2"}}
    steps.append({
        "id": 5,
        "text": "Halve the right angles at the centre to get the two diagonals, and rule lines parallel to them through every mark on the horizontal. Every square of the grid now has both its diagonals.",
        "create": create, "highlight": ["h", "v"], "animate": "ruler",
    })
    Dm = {k: ("d1" if k == 0 else name("Dm", k)) for k in range(-R, R + 1)}
    Dp = {k: ("d2" if k == 0 else name("Dp", k)) for k in range(-R, R + 1)}

    # Grid points the ink needs, as crossings of a vertical and a horizontal.
    def gp(p):
        x, y = p
        return f"G{name('', x)}_{name('', y)}"

    pts = sorted({p for s in segs for p in s} | {tuple(c) for c in spec["tile"]})
    create = {gp(p): {"point": {"meet": [V[p[0]], H[p[1]]]}} for p in pts if p != (0, 0)}
    tile = [("O" if tuple(c) == (0, 0) else gp(tuple(c))) for c in spec["tile"]]
    create["tile"] = {"polygon": tile}
    steps.append({
        "id": 6,
        "text": spec.get("tile_text", "Mark the tile: the square whose corners are the centres of the four neighbouring repeats. The pattern inside it repeats edge to edge."),
        "create": create, "animate": "ruler",
    })

    # Merge collinear unit segments into maximal runs along each line.
    def line_of(a, b):
        if a[1] == b[1]:
            return ("H", a[1])
        if a[0] == b[0]:
            return ("V", a[0])
        return ("Dm", a[0] - a[1]) if (b[0] - a[0]) == (b[1] - a[1]) else ("Dp", a[0] + a[1])

    by_line = {}
    for a, b in segs:
        by_line.setdefault(line_of(a, b), []).append((a, b))
    paths = []
    for key, items in sorted(by_line.items()):
        kind = key[0]
        t = (lambda p: p[0]) if kind in ("H", "Dm", "Dp") else (lambda p: p[1])
        iv = sorted(tuple(sorted((a, b), key=t)) for a, b in items)
        runs = []
        for a, b in iv:
            if runs and runs[-1][-1] == a:
                runs[-1].append(b)
            else:
                runs.append([a, b])
        for r in runs:
            paths.append({"through": [("O" if p == (0, 0) else gp(p)) for p in (r[0], r[-1])]})

    return {
        "format": 0, "id": spec["id"], "title": spec["title"], "fold": spec.get("fold", 4),
        "style": spec["style"], "level": spec["level"], "credits": spec["credits"],
        "given": spec["given"], "steps": steps,
        "ink": {"text": spec["ink_text"], "paths": paths},
        "pattern": {"cell": "tile", "text": spec["pattern_text"], "palette": "Fès tile", "colors": {}},
        "expect": {"pieceTypes": 1, "pieces": [{"name": "x", "vertices": 3, "area": 1, "perCell": 1}]},
    }


if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    json.dump(build(spec), open(sys.argv[2], "w"))

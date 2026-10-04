#!/usr/bin/env python3
"""Builds a tutorial for an Alhambra design drawn on a square grid with
eight-pointed stars (Martínez Vela's second grid base): each star is two
squares, one on the grid and one turned 45°, the turned one found with a
circle through the four diagonal neighbours of the star's centre.

With O at a star centre and one grid square as the unit, the design's
lines are the grid lines x = k, y = k and the diagonals x ± y = 4j ± √2.

Usage: star_grid_tutorial.py spec.json tutorials/<id>.json
spec.json: {"id", "title", "style", "level", "credits", "given", "radius",
            "tile": [[x, y], ...], "segments": [[[x1, y1], [x2, y2]], ...]
            (grid units, y up, O at the origin), "ink_text", "pattern_text",
            "tile_text"}
"""
import json
import math
import sys

R2 = math.sqrt(2)
EPS = 1e-6


def nm(k):
    return f"{'m' if k < 0 else ''}{abs(k)}"


def build(spec):
    R = spec["radius"]
    segs = [tuple(tuple(p) for p in s) for s in spec["segments"]]
    steps = []

    steps.append({
        "id": 1,
        "text": "Rule a horizontal line through the centre and draw a small circle. Its radius is one square of the grid, and the compass keeps this opening while you build the grid.",
        "create": {"h": {"line": {"through": ["O", "A"]}},
                   "c": {"circle": {"centre": "O", "through": "A"}}},
        "animate": "compass",
    })
    X = {0: "O", 1: "A"}
    Y = {0: "O"}
    create = {"Xm1": {"point": {"meet": ["c", "h"], "pick": {"angle": 180}}},
              "v": {"line": {"through": "O", "perpendicularTo": "h"}},
              "Y1": {"point": {"meet": ["c", "v"], "pick": {"angle": 90}}},
              "Ym1": {"point": {"meet": ["c", "v"], "pick": {"angle": 270}}}}
    X[-1] = "Xm1"; Y[1] = "Y1"; Y[-1] = "Ym1"
    for k in range(2, R + 1):
        for sgn in (1, -1):
            for axis, P, line, letter in (("x", X, "h", "X"), ("y", Y, "v", "Y")):
                cn = f"c{axis}{nm(sgn * (k - 1))}"
                create[cn] = {"circle": {"centre": P[sgn * (k - 1)], "radiusOf": "c"}}
                pn = f"{letter}{nm(sgn * k)}"
                create[pn] = {"point": {"meet": [cn, line], "pick": {"farthest": "O"}}}
                P[sgn * k] = pn
    steps.append({
        "id": 2,
        "text": "Rule the vertical through the centre. Walk the compass along both lines, both ways, marking a point every square.",
        "create": create, "highlight": ["c", "h"], "animate": "compass",
    })

    create = {}
    V = {0: "v"}; H = {0: "h"}
    for k in range(-R, R + 1):
        if k:
            V[k] = f"V{nm(k)}"; H[k] = f"H{nm(k)}"
            create[V[k]] = {"line": {"through": X[k], "perpendicularTo": "h"}}
            create[H[k]] = {"line": {"through": Y[k], "perpendicularTo": "v"}}
    steps.append({
        "id": 3,
        "text": "Through every mark rule a line at right angles to its axis. The lines make a square grid.",
        "create": create, "highlight": ["h", "v"], "animate": "ruler",
    })

    # Which star diagonals the ink uses: x + y = c or x - y = c, c = 4j ± √2.
    def diag_of(a, b):
        if abs(a[1] - b[1]) < EPS or abs(a[0] - b[0]) < EPS:
            return None
        if abs((b[0] - a[0]) - (b[1] - a[1])) < EPS:
            return ("M", a[0] - a[1])
        return ("P", a[0] + a[1])

    def star_value(c):
        # c = e ± √2 with e an even number of squares: the turned square of
        # the star whose circle is centred on the horizontal at e.
        for e in range(-2 * R, 2 * R + 1, 2):
            for s in (1, -1):
                if abs(c - (e + s * R2)) < 1e-4:
                    return (e, s)
        raise SystemExit(f"diagonal at {c} is not e ± √2 with e even")

    vals = sorted({star_value(d[1]) for s in segs for d in [diag_of(*s)] if d})
    create = {"g11": {"point": {"meet": [V[1], H[1]]}},
              "s": {"circle": {"centre": "O", "through": "g11"}}}
    create["d1"] = {"line": {"through": "O", "bisects": ["A", "O", "Y1"]}}
    create["d2"] = {"line": {"through": "O", "bisects": ["Y1", "O", "Xm1"]}}
    S = {}
    for e, s in vals:
        if abs(e) > R:
            raise SystemExit(f"radius {R} is too small for a star circle at {e}")
        circ = "s" if e == 0 else f"s{nm(e)}"
        if e and circ not in create:
            create[circ] = {"circle": {"centre": X[e], "radiusOf": "s"}}
        pname = f"T{nm(e)}{'p' if s > 0 else 'n'}"
        if e == 0:
            pick = {"angle": 0 if s > 0 else 180}
        else:
            pick = {"farthest" if (s > 0) == (e > 0) else "nearest": "O"}
        create[pname] = {"point": {"meet": [circ, "h"], "pick": pick}}
        S[(e, s)] = pname
    star_lines = {}
    for (e, s), p in S.items():
        tag = f"{nm(e)}{'p' if s > 0 else 'n'}"
        star_lines[("P", e + s * R2)] = f"P{tag}"
        star_lines[("M", e + s * R2)] = f"M{tag}"
        create[f"P{tag}"] = {"line": {"through": p, "parallelTo": "d2"}}
        create[f"M{tag}"] = {"line": {"through": p, "parallelTo": "d1"}}
    steps.append({
        "id": 4,
        "text": spec.get("star_text", "Open the compass from the centre to the corner of a square diagonally next to it, and draw that circle: it passes through four grid corners. Where it crosses the horizontal, rule lines at 45° both ways. They form a square standing on its corner, which with the grid square around the centre makes an eight-pointed star."),
        "create": create, "highlight": ["g11"], "animate": "compass",
    })

    # Merge collinear pieces into runs, then name their ends.
    def line_key(a, b):
        if abs(a[1] - b[1]) < EPS:
            return ("H", round(a[1]))
        if abs(a[0] - b[0]) < EPS:
            return ("V", round(a[0]))
        k, c = diag_of(a, b)
        return (k, round(c, 6))

    by = {}
    for a, b in segs:
        by.setdefault(line_key(a, b), []).append((a, b))
    ends = []
    for key, items in sorted(by.items()):
        t = (lambda p: p[0]) if key[0] != "V" else (lambda p: p[1])
        iv = sorted((tuple(sorted((a, b), key=t)) for a, b in items), key=lambda s: t(s[0]))
        runs = []
        for a, b in iv:
            if runs and math.dist(runs[-1][1], a) < EPS:
                runs[-1][1] = b
            else:
                runs.append([a, b])
        ends += [tuple(r) for r in runs]

    def lines_through(p):
        out = []
        for k in range(-R, R + 1):
            if abs(p[0] - k) < EPS:
                out.append(V[k])
            if abs(p[1] - k) < EPS:
                out.append(H[k])
        for (kind, c), n in star_lines.items():
            if abs((p[0] + p[1] if kind == "P" else p[0] - p[1]) - c) < 1e-4:
                out.append(n)
        return out

    names = {}

    def pt(p):
        key = (round(p[0], 6), round(p[1], 6))
        if abs(p[0]) < EPS and abs(p[1]) < EPS:
            return "O"
        if key not in names:
            ls = lines_through(p)
            if len(ls) < 2:
                raise SystemExit(f"{p} is not a crossing of two construction lines")
            names[key] = (f"Q{len(names) + 1}", ls[:2])
        return names[key][0]

    tile = [pt(tuple(c)) for c in spec["tile"]]
    paths = [{"through": [pt(a), pt(b)]} for a, b in ends]
    create = {n: {"point": {"meet": ls}} for n, ls in names.values()}
    create["tile"] = {"polygon": tile}
    steps.append({
        "id": 5,
        "text": spec["tile_text"], "create": create, "animate": "fade",
    })
    return {
        "format": 0, "id": spec["id"], "title": spec["title"], "fold": 4,
        "style": spec["style"], "level": spec["level"], "credits": spec["credits"],
        "given": spec["given"], "steps": steps,
        "ink": {"text": spec["ink_text"], "paths": paths},
        "pattern": {"cell": "tile", "text": spec["pattern_text"], "palette": "Fès tile", "colors": {}},
        "expect": {"pieceTypes": 1, "pieces": [{"name": "x", "vertices": 3, "area": 1, "perCell": 1}]},
    }


if __name__ == "__main__":
    json.dump(build(json.load(open(sys.argv[1]))), open(sys.argv[2], "w"))

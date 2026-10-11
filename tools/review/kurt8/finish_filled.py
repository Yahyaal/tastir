"""Writes the expect block and the colors of kurt-eight-fold-zellige-filled
from its review dump, after gen_filled.py and `pnpm review`.

The middle drawn at the tile corner has the same piece shapes as the middle
of the wheel, so its own colors are placement rules: every piece within 0.6
of a tile corner (the middle reaches 0.592 to its bands' centres) gets the
corner color for its shape, by its place among the cell's pieces of that
shape (pattern.placements nth, counted as the player counts it).

  python3 tools/review/kurt8/finish_filled.py
  python3 tools/review/format_tutorial.py tutorials/kurt-eight-fold-zellige-filled.json
"""

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ID = "kurt-eight-fold-zellige-filled"
PATH = ROOT / "tutorials" / f"{ID}.json"
dump = json.load(open(ROOT / "docs" / "review" / ID / "dump.json"))

# The wheel keeps the plain wheel's colors; the middle at the corner takes
# the palette's other colors, so each of its shapes differs from the wheel's.
WHEEL = {"joint": "b", "octagon": "c", "star": "a", "rosette": "a", "petal": "b", "band": "c", "kite": "a"}
CORNER = {"octagon": "b", "star": "d", "rosette": "d", "petal": "ground", "band": "a", "kite": "d"}
SMALL = {"joint", "kite"}

names = [t["name"] for t in dump["types"]]
cell = dump["cell"]
(ox, oy), (ux, uy), (vx, vy) = cell["corners"][0], cell["u"], cell["v"]
det = ux * vy - uy * vx


def centre(poly):
    return (sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly))


def slides(c):
    dx, dy = c[0] - ox, c[1] - oy
    return ((dx * vy - dy * vx) / det, (ux * dy - uy * dx) / det)


pieces = [(names[p["type"]], centre(p["polygon"])) for p in dump["pieces"]]
at = [slides(c) for _, c in pieces]


def nth(i):
    a, b = at[i]
    return sum(
        1
        for k, (n, _) in enumerate(pieces)
        if n == pieces[i][0]
        and k != i
        and (at[k][1] < b - 1e-6 or (abs(at[k][1] - b) <= 1e-6 and at[k][0] < a))
    )


corners = [(x, y) for x, y in cell["corners"]]
rules = []
for i, (name, c) in enumerate(pieces):
    if min(math.hypot(c[0] - x, c[1] - y) for x, y in corners) < 0.6:
        rules.append({"piece": name, "nth": nth(i), "color": CORNER[name]})
rules.sort(key=lambda r: (list(CORNER).index(r["piece"]), r["nth"]))

t = json.load(open(PATH))
t["pattern"]["colors"] = WHEEL
t["pattern"]["placements"] = {"repeat": [1, 1], "rules": rules}
t["expect"] = {
    "note": (
        "Golden values in units of OA, computed by the engine. The middle drawn at the tile corner "
        "fills the space between four wheels exactly, so no ground is left and every shape is one of "
        "the wheel's own. The kites and the thin star between wheels are small by design."
    ),
    "pieceTypes": len(dump["types"]),
    "pieces": [
        {
            "name": ty["name"],
            "vertices": ty["vertices"],
            "area": ty["area"],
            "perCell": ty["perCell"],
            **({"small": True} if ty["name"] in SMALL else {}),
        }
        for ty in dump["types"]
    ],
    "cellArea": 4,
}
json.dump(t, open(PATH, "w"), indent=2, ensure_ascii=False)
print(f"{len(rules)} corner rules")

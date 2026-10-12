"""Builds tutorials/kurt-eight-fold-zellige-filled.json from the plain wheel.

The space between four wheels on the square tile is exactly the middle of a
wheel. So the filled wall is the plain wheel repeated on the standing square
of step 4 (half the square tile, turned 45°): each wheel's centre lands in
the space between four others, and the rings of neighbouring wheels overlap
on the same lines.

Every other wheel (the ones in the spaces of the square tiling) takes its
own colours for the middle: a 2 × 2 colour repeat, by cell and by place
in the cell. The cross where four wheels meet is filled by an octagon and
four bands like the wheel's own (step 19).

  python3 tools/review/kurt8/gen_filled.py
  python3 tools/review/format_tutorial.py tutorials/kurt-eight-fold-zellige-filled.json
"""

import copy
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "tutorials" / "kurt-eight-fold-zellige.json"
ID = "kurt-eight-fold-zellige-filled"
OUT = ROOT / "tutorials" / f"{ID}.json"

# The middle of the second set of wheels: colours the plain wheel does not
# use for these shapes.
WHEEL = {"octagon": "c", "star": "a", "rosette": "a", "petal": "b", "band": "c", "kite": "a"}
OTHER = {"octagon": "ground", "star": "d", "band": "a", "rosette": "d"}
SMALL = {"kite"}

src = json.load(open(SRC))
t = copy.deepcopy(src)
t["id"] = ID
t["title"] = "Eight-fold zellige wheel, filled"
# The two sets of wheels are coloured differently, so the coloured wall only
# turns into itself by a quarter turn about O.
t["fold"] = 4
t["verification"] = {
    "status": "unverified",
    "note": (
        "Sandy Kurt's wheel repeated so that each wheel's middle fills the space between four others, "
        "an idea of our own. It has not been matched to a historical panel."
    ),
}
t = {k: t[k] for k in ["format", "id", "title", "fold", "style", "level", "credits", "verification"] + [
    k for k in t if k not in ("format", "id", "title", "fold", "style", "level", "credits", "verification")
]}
t["credits"][0]["note"] = (
    "The wheel follows her nineteen steps and her finished drawing; repeating it so that the wheels "
    "overlap and fill the spaces between them is our own. The step text is our own."
)
last = t["steps"][-1]
assert last["id"] == 18
t["steps"][-1] = {
    "id": 18,
    "text": (
        "The tile is the standing square from step 4, with its corners at the ends of the horizontal "
        "and the vertical. Copies of it, side to side, put a wheel on every corner: each wheel's middle "
        "fills the space between four others, and the rings of neighbouring wheels run along the same lines."
    ),
    "create": {"tile": {"polygon": ["E", "N", "W", "Sp"]}},
    "highlight": ["E", "N", "W", "Sp"],
    "animate": "ruler",
}
# The space where four wheels meet (a cross) is filled by ruling on the four
# lines its notches run along: they close an octagon like the wheel's own in
# the middle, and what is left of each arm is one of the wheel's bands. Ruled
# at the tile's right corner, then turned to the other three corners.
t["steps"].append(
    {
        "id": 19,
        "text": (
            "Where four wheels meet there is still an empty cross. Through the two inner corners of the "
            "octagons that bite into it at the tile's right corner, rule the lines that carry their sides on "
            "into the cross: through each corner, one parallel to each of the two nearest lines through the "
            "centre at a sixteenth of a turn. Do the same at the other three corners of the tile."
        ),
        "create": {
            "jN1": {"line": {"through": "oK0_7", "parallelTo": "r0"}},
            "jN2": {"line": {"through": "oK0_7", "parallelTo": "r1"}},
            "jS2": {"line": {"through": "oK7_1", "parallelTo": "r2"}},
            "jS1": {"line": {"through": "oK7_1", "parallelTo": "r3"}},
            "joints": {"repeat": {"of": ["jN1", "jN2", "jS2", "jS1"], "by": "rot4"}},
        },
        "highlight": ["oK0_7", "oK7_1", "r0", "r1", "r2", "r3"],
        "animate": "ruler",
    }
)
# Each corner gets two sides of the octagon in the cross: the quarter of it
# inside the tile. The other quarters come from the neighbouring tiles.
for k in ["", "@1", "@2", "@3"]:
    t["ink"]["paths"] += [
        {"along": "jN2" + k, "from": "jN1" + k, "to": "jS2" + k},
        {"along": "jS2" + k, "from": "jN2" + k, "to": "jS1" + k},
    ]
t["ink"]["text"] = (
    "Go over the lines of the finished wheel: the octagons, the bands between them and the star in the "
    "middle. Then, at each corner of the tile, the two sides of the octagon in the cross."
)
t["pattern"]["cell"] = "tile"
t["pattern"]["text"] = (
    "Repeat the standing square side to side. The wheels overlap: each one's middle fills the space "
    "between four others, an octagon fills each cross where four wheels meet, and every other wheel has "
    "its middle in its own colours."
)
t["pattern"]["colors"] = WHEEL
t["pattern"].pop("placements", None)
json.dump(t, open(OUT, "w"), indent=2, ensure_ascii=False)

# Golden values and the rosette's place, from the engine.
with tempfile.TemporaryDirectory() as tmp:
    out = Path(tmp) / "dump.json"
    subprocess.run(
        ["npx", "tsx", "--conditions=@tastir/source", "tools/review/dump.ts", ID, str(out)],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    dump = json.load(open(out))
names = [ty["name"] for ty in dump["types"]]
cell = dump["cell"]
(ox, oy), (ux, uy), (vx, vy) = cell["corners"][0], cell["u"], cell["v"]
det = ux * vy - uy * vx


def slides(poly):
    cx = sum(p[0] for p in poly) / len(poly)
    cy = sum(p[1] for p in poly) / len(poly)
    dx, dy = cx - ox, cy - oy
    return ((dx * vy - dy * vx) / det, (ux * dy - uy * dx) / det), (cx, cy)


pieces = [(names[p["type"]], *slides(p["polygon"])) for p in dump["pieces"]]


def middle(name):
    """The places (nth) of the pieces of this shape in the wheel's middle:
    nth counts along the second slide, then the first, as the player does."""
    same = sorted((b, a, (cx * cx + cy * cy) ** 0.5) for n, (a, b), (cx, cy) in pieces if n == name)
    return [i for i, (_, _, r) in enumerate(same) if r < 0.65]


rules = []
for i, j in ((1, 0), (0, 1)):
    for name, colour in OTHER.items():
        for nth in middle(name):
            rules.append({"piece": name, "cell": [i, j], "nth": nth, "color": colour})
t["pattern"]["placements"] = {"repeat": [2, 2], "rules": rules}
t["expect"] = {
    "note": (
        "Golden values in units of OA, computed by the engine. The tile is half the plain wheel's, "
        "and every piece is one of the wheel's own: the cross where four wheels meet is an octagon and four "
        "bands. The kites are small by design."
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
    "cellArea": 2,
}
json.dump(t, open(OUT, "w"), indent=2, ensure_ascii=False)
print(f"{len(dump['types'])} piece types, {len(rules)} colour rules")

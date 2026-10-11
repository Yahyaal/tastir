"""Builds tutorials/kurt-eight-fold-zellige-filled.json from the plain wheel.

The gap between four wheels, at a corner of the square tile, is exactly the
middle of the wheel (everything out to the bands, 0.707 of OA from the
centre). Its centre is the mirror image of O across the side of the standing
square from E to N, so one step mirrors the elements the middle's ink runs
along, and the ink gets a mirrored copy of every path of the middle.

  npx tsx --conditions=@tastir/source tools/review/kurt8/medallion.ts > far.json
  python3 tools/review/kurt8/gen_filled.py far.json
  python3 tools/review/format_tutorial.py tutorials/kurt-eight-fold-zellige-filled.json
"""

import copy
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "tutorials" / "kurt-eight-fold-zellige.json"
OUT = ROOT / "tutorials" / "kurt-eight-fold-zellige-filled.json"
# Paths that stay within this distance of O make the middle of the wheel.
REACH = 0.708

far = json.load(open(sys.argv[1]))
# The plain wheel's elements as drawn (pnpm review kurt-eight-fold-zellige).
drawn = json.load(open(ROOT / "docs" / "review" / "kurt-eight-fold-zellige" / "dump.json"))
drawn = {e["name"]: e for e in drawn["steps"][-1]["elements"]}


def carries(name, a, b):
    """Whether element `name` has a straight side or line through points a and b."""
    e = drawn[name]
    pa, pb = drawn[a], drawn[b]
    if e["kind"] == "line":
        return all(
            abs((p["x"] - e["x"]) * e["dy"] - (p["y"] - e["y"]) * e["dx"]) < 1e-9 for p in (pa, pb)
        )
    if e["kind"] != "polygon":
        return False
    vs = e["vertices"]
    for (px, py), (qx, qy) in zip(vs, vs[1:] + vs[:1]):

        def on(r):
            cr = (qx - px) * (r["y"] - py) - (qy - py) * (r["x"] - px)
            return (
                abs(cr) < 1e-9
                and min(px, qx) - 1e-9 <= r["x"] <= max(px, qx) + 1e-9
                and min(py, qy) - 1e-9 <= r["y"] <= max(py, qy) + 1e-9
            )

        if on(pa) and on(pb):
            return True
    return False


src = json.load(open(SRC))
t = copy.deepcopy(src)

middle = [x["path"] for x in far if x["far"] < REACH]
paths = [src["ink"]["paths"][i] for i in middle]

kinds = {}
for step in src["steps"]:
    for parts in [step.get("create", {})] + [p["create"] for p in step.get("parts", [])]:
        for name, el in parts.items():
            kinds[name] = el

names = []


def use(name):
    if name not in names:
        names.append(name)


def end(v):
    if isinstance(v, str):
        use(v)
    else:
        use(v["cross"])
        for k in ("nearest", "farthest"):
            if k in v["pick"]:
                use(v["pick"][k])


for p in paths:
    if "along" in p:
        use(p["along"])
        end(p["from"])
        end(p["to"])
    else:
        pts = p["through"] + ([p["through"][0]] if p.get("closed") else [])
        for q in pts:
            use(q)
        # The side each pair runs along: a polygon side or a line through both.
        for a, b in zip(pts, pts[1:]):
            # Polygons first: an octagon's side is the line the ink means.
            ordered = sorted(drawn, key=lambda n: drawn[n]["kind"] != "polygon")
            carrier = next((n for n in ordered if carries(n, a, b)), None)
            if carrier is None:
                sys.exit(f"nothing carries {a}–{b}")
            use(carrier)


def mirrored(v):
    if isinstance(v, str):
        return v + "@1"
    if isinstance(v, list):
        return [mirrored(x) for x in v]
    if isinstance(v, dict):
        return {k: (x if k == "closed" else mirrored(x)) for k, x in v.items()}
    return v


t["id"] = "kurt-eight-fold-zellige-filled"
t["title"] = "Eight-fold zellige wheel, filled"
# The wall turns into itself by a quarter turn about O, not an eighth: the
# middle at the corner sits where an eighth turn finds the wheel's ring.
t["fold"] = 4
# Our own design: say so in the library, as for the other studies.
t["verification"] = {
    "status": "unverified",
    "note": (
        "Sandy Kurt's wheel with the space between four wheels filled by the middle of the wheel, "
        "an idea of our own. It has not been matched to a historical panel."
    ),
}
t["steps"].append(
    {
        "id": len(t["steps"]) + 1,
        "text": (
            "The gap at each corner of the tile, between four wheels, is exactly the middle of a wheel: "
            "the star, the eight octagons and the bands around them. Rule the side of the standing square "
            "from the right of the circle to the top, and draw the middle again as its mirror image across "
            "that line. Its centre lands on the corner of the tile."
        ),
        "create": {
            "mEN": {"line": {"through": ["E", "N"]}},
            "corner": {"repeat": {"of": names, "by": "mirror:mEN"}},
        },
        "textWithoutHelpers": (
            "The gap at each corner of the tile, between four wheels, is exactly the middle of a wheel: "
            "the star, the eight octagons and the bands around them. Draw the middle again around the "
            "corner of the tile, as the mirror image of the one at the centre."
        ),
        "highlight": ["E", "N", "t1"],
        "animate": "ruler",
    }
)
t["ink"] = {
    "text": (
        "Go over the lines of the finished wheel, then over the middle again at the corner of the tile: "
        "the octagons, the bands between them and the star."
    ),
    "paths": src["ink"]["paths"] + [mirrored(p) for p in paths],
}
t["pattern"]["text"] = (
    "Repeat the tile edge to edge. Neighbouring wheels meet at the corners of their large octagons, "
    "and the middle drawn at the corner fills the space between four wheels."
)
json.dump(t, open(OUT, "w"), indent=2, ensure_ascii=False)
print(f"{len(middle)} paths, {len(names)} elements mirrored")

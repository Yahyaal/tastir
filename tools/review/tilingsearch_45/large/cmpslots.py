"""cmpslots.py <fills.txt> <pieces.json> ox oy unit band slot=r,g,b ... [--rot deg]
Checks the player's fills (from fills.ts) against the source drawing's
colours: each piece's slot must be the one mapped to the nearest source
piece's fill. Pieces whose nearest source piece is far (off the page) are
counted, not judged."""
import json
import math
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import common as cm  # noqa: E402

args = [a for a in sys.argv[1:]]
rot = 0.0
if '--rot' in args:
    i = args.index('--rot')
    rot = math.radians(float(args[i + 1]))
    del args[i:i + 2]
lines = [ln.split() for ln in open(args[0]) if ln.strip()]
f = args[1]
ox, oy, u, band = map(float, args[2:6])
want = {}
for a in args[6:]:
    slot, rgb = a.split('=')
    want[tuple(float(v) for v in rgb.split(','))] = slot
src = json.load(open(f))
polys = cm.frame_pieces(f, (ox, oy), 2 * u, band)
if rot:
    polys = [[(x * math.cos(rot) - y * math.sin(rot), x * math.sin(rot) + y * math.cos(rot)) for x, y in Q] for Q in polys]


def vc(P):
    n = len(P)
    return (sum(q[0] for q in P) / n, sum(q[1] for q in P) / n)


sc = [(vc(Q), tuple(round(v, 2) for v in p['fill'])) for p, Q in zip(src, polys)]
bad = far = 0
for name, xy, slot in lines:
    x, y = map(float, xy.split(','))
    best = min(sc, key=lambda t: math.dist(t[0], (x, y)))
    if math.dist(best[0], (x, y)) > 0.05:
        far += 1
        continue
    if want.get(best[1]) != slot:
        bad += 1
        print('mismatch', name, round(x, 3), round(y, 3), slot, best[1])
print('checked', len(lines) - far, 'mismatches', bad, 'off the page', far)

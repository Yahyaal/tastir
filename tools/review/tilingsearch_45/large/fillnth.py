"""fillnth.py dump.json pieces.json ox oy unit band type... : for each dump piece type,
the source fill of the nearest source piece, grouped by the player's nth."""
import json, sys, math
from collections import defaultdict
sys.path.insert(0, '/home/yahya/Documents/projects/Tastir/.claude/worktrees/agent-a0638ace160955a10/tools/review/tilingsearch_45')
import common as cm
d = json.load(open(sys.argv[1])); f = sys.argv[2]
ox, oy, u, band = map(float, sys.argv[3:7])
src = json.load(open(f)); polys = cm.frame_pieces(f, (ox, oy), 2 * u, band)
def vc(P):
    n = len(P); return (sum(q[0] for q in P) / n, sum(q[1] for q in P) / n)
sc = [(vc(Q), tuple(round(v, 2) for v in p['fill'])) for p, Q in zip(src, polys)]
cell = d['cell']; U, V = cell['u'], cell['v']; det = U[0] * V[1] - U[1] * V[0]
for ti in map(int, sys.argv[7:]):
    ps = [p for p in d['pieces'] if p['type'] == ti]
    cs = [vc(p['polygon']) for p in ps]
    ab = [((c[0] * V[1] - c[1] * V[0]) / det, (U[0] * c[1] - U[1] * c[0]) / det) for c in cs]
    order = sorted(range(len(cs)), key=lambda i: (round(ab[i][1], 6), ab[i][0]))
    by = defaultdict(list)
    for n, i in enumerate(order):
        c = cs[i]
        best = min(sc, key=lambda t: math.dist(t[0], c))
        by[best[1]].append(n)
        if math.dist(best[0], c) > 0.01:
            print('  far', n, c, math.dist(best[0], c))
    print('type', ti, d['types'][ti]['vertices'], d['types'][ti]['area'], dict(by))

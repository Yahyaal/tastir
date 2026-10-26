"""cmpfills.py fills.txt pieces.json ox oy unit band slot=rgb...: check player fills against source fills."""
import json, sys, math
sys.path.insert(0, '/home/yahya/Documents/projects/Tastir/.claude/worktrees/agent-a0638ace160955a10/tools/review/tilingsearch_45')
import common as cm
lines = [l.split() for l in open(sys.argv[1])]
f = sys.argv[2]; ox, oy, u, band = map(float, sys.argv[3:7])
want = dict(a.split('=') for a in sys.argv[7:])
src = json.load(open(f)); polys = cm.frame_pieces(f, (ox, oy), 2 * u, band)
def vc(P):
    n = len(P); return (sum(q[0] for q in P) / n, sum(q[1] for q in P) / n)
sc = [(vc(Q), ','.join(str(round(v, 2)) for v in p['fill'])) for p, Q in zip(src, polys)]
bad = 0
for name, xy, slot in lines:
    x, y = map(float, xy.split(','))
    best = min(sc, key=lambda t: math.dist(t[0], (x, y)))
    ok = want.get(slot) == best[1]
    bad += not ok
    if not ok: print('mismatch', name, x, y, slot, best[1], round(math.dist(best[0], (x, y)), 4))
print('checked', len(lines), 'mismatches', bad)

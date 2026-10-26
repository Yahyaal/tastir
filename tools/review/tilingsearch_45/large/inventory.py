"""inventory.py <pieces.json> ox oy unit L [band] : piece types with centroid in the
half-open cell [-L, L)^2 (y up), exact areas as a + bH fits, and the area sum."""
import json, sys, math
from collections import Counter
f = sys.argv[1]; ox, oy, u, L = map(float, sys.argv[2:6])
band = float(sys.argv[6]) if len(sys.argv) > 6 else 0
sys.path.insert(0, '/home/yahya/Documents/projects/Tastir/.claude/worktrees/agent-a0638ace160955a10/tools/review/tilingsearch_45')
import common as cm
polys = cm.frame_pieces(f, (ox, oy), 2 * u, band)
H = math.sqrt(.5)
def area(Q): return abs(0.5 * sum(Q[i-1][0]*Q[i][1]-Q[i][0]*Q[i-1][1] for i in range(len(Q))))
def cen(Q):
    A = 0.5 * sum(Q[i-1][0]*Q[i][1]-Q[i][0]*Q[i-1][1] for i in range(len(Q))); cx = cy = 0
    for i in range(len(Q)):
        x0, y0 = Q[i-1]; x1, y1 = Q[i]; c = x0*y1-x1*y0; cx += (x0+x1)*c; cy += (y0+y1)*c
    return cx/(6*A), cy/(6*A)
def fit(v):
    best = None
    for b in range(-40, 41):
        a = round((v - b*H)*8)/8
        r = abs(v - a - b*H)
        if best is None or r < best[0] - 1e-6 or (abs(r-best[0]) < 1e-6 and abs(b) < abs(best[2])): best = (r, a, b)
    return best
cnt = Counter(); tot = 0
eps = 1e-3
for Q in polys:
    x, y = cen(Q)
    if -L - eps <= x < L - eps and -L - eps <= y < L - eps:
        A = area(Q); r, a, b = fit(A)
        cnt[(len(Q), a, b)] += 1; tot += A
for (n, a, b), c in sorted(cnt.items(), key=lambda t: -(t[0][1]+t[0][2]*H)):
    print(f'{n:3d} verts  area {a:+g} {b:+d}H = {a+b*H:.4f}  x{c}')
print('sum', round(tot, 4), 'cell', round(4*L*L, 4))

"""Lines of NC2 (offset pieces) in the frame turned by -22.5 deg, unit R, whose
edges lie in the axis-aligned (unturned) cell |x|,|y| <= L."""
import json, math, sys
from collections import defaultdict
ps = json.load(open(sys.argv[1])); ox, oy, R, Lpt = map(float, sys.argv[2:6])
H = math.sqrt(.5)
c, s = math.cos(math.radians(-22.5)), math.sin(math.radians(-22.5))
def snapv(v):
    return min(((abs(v - k - j * H), k, j) for j in range(-30, 31) for k in [round(v - j * H)]))
lines = defaultdict(float); worst = 0
for p in ps:
    Q = [((x - ox), -(y - oy)) for x, y in p['poly']]
    for i in range(len(Q)):
        a, b = Q[i - 1], Q[i]
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        if abs(m[0]) > Lpt + 1e-6 or abs(m[1]) > Lpt + 1e-6:
            continue
        A = ((c * a[0] - s * a[1]) / R, (s * a[0] + c * a[1]) / R)
        B = ((c * b[0] - s * b[1]) / R, (s * b[0] + c * b[1]) / R)
        d = (B[0] - A[0], B[1] - A[1])
        ang = round(math.degrees(math.atan2(d[1], d[0])) / 45) * 45 % 180
        n = {0: (0, 1), 45: (-H, H), 90: (-1, 0), 135: (-H, -H)}[ang]
        cc = A[0] * n[0] + A[1] * n[1]
        r, k, j = snapv(abs(cc)); worst = max(worst, r)
        lines[(ang, (k, j) if cc >= 0 else (-k, -j))] += math.dist(A, B)
print('worst', round(worst, 5))
for (ang, kj), ln in sorted(lines.items()):
    print(ang, kj, round(kj[0] + kj[1] * H, 4), 'len', round(ln, 2))

"""nth.py <dump.json> <type index>...: nth order (as the player counts it) and centres."""
import json, sys
d = json.load(open(sys.argv[1]))
cell = d['cell']
u, v = cell['u'], cell['v']
det = u[0] * v[1] - u[1] * v[0]
for ti in map(int, sys.argv[2:]):
    ps = [p for p in d['pieces'] if p['type'] == ti]
    def c(P):
        n = len(P); return (sum(q[0] for q in P) / n, sum(q[1] for q in P) / n)
    cs = [c(p['polygon']) for p in ps]
    def ab(p):
        return ((p[0] * v[1] - p[1] * v[0]) / det, (u[0] * p[1] - u[1] * p[0]) / det)
    at = [ab(p) for p in cs]
    order = sorted(range(len(cs)), key=lambda i: (round(at[i][1], 6), at[i][0]))
    print('type', ti, d['types'][ti])
    for n, i in enumerate(order):
        print('  nth', n, tuple(round(x, 3) for x in cs[i]))

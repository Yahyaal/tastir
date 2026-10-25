"""Moves every piece of a band drawing out by h (half the band, in PDF points)
and writes the result in the pieces format, ready for snap_grid.py.
Works when the bands have one width (BON36: h = 5). Drawings whose tiles were
shrunk about their own centres instead (P17) give bands of two widths.
Usage: offset_pieces.py <name>-pieces.json <h> <out.json>"""
import json, math, sys
ps = json.load(open(sys.argv[1])); h = float(sys.argv[2])
def edges(P):
    for i in range(len(P)):
        yield P[i], P[(i+1) % len(P)]
def offset(P, h):
    A = 0.5*sum(P[i-1][0]*P[i][1] - P[i][0]*P[i-1][1] for i in range(len(P)))
    s = 1 if A > 0 else -1
    lines = []
    for a, b in edges(P):
        L = math.dist(a, b); u = ((b[0]-a[0])/L, (b[1]-a[1])/L); nv = (s*u[1], -s*u[0])
        lines.append(((a[0]+h*nv[0], a[1]+h*nv[1]), u))
    out = []
    for i in range(len(lines)):
        (p1, u1), (p2, u2) = lines[i-1], lines[i]
        det = u1[0]*(-u2[1]) - u1[1]*(-u2[0])
        t = ((p2[0]-p1[0])*(-u2[1]) - (p2[1]-p1[1])*(-u2[0]))/det
        out.append((p1[0]+t*u1[0], p1[1]+t*u1[1]))
    return out
out = []
for p in ps:
    Q = offset(p['poly'], h)
    A = abs(0.5*sum(Q[i-1][0]*Q[i][1] - Q[i][0]*Q[i-1][1] for i in range(len(Q))))
    out.append({'fill': p['fill'], 'poly': Q, 'area': A, 'c': p['c']})
json.dump(out, open(sys.argv[3], 'w'))

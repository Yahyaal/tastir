"""Reads the pieces of a Tiling Search vector drawing: the filled polygons of
the PDF, cleaned (back-tracking spikes and collinear corners removed).
Usage: 1_pieces.py <name> [--no-grey]   (--no-grey drops grey fills, the bevels of drawn bands)   reads <name>-vec.json, writes <name>-pieces.json
Run from docs/research/alhambra-wichmann/."""
import json, math, sys
name = sys.argv[1]
segs = json.load(open(f'{name}-vec.json'))
def clean(P):
    P = [tuple(round(c, 2) for c in p) for p in P]
    changed = True
    while changed and len(P) > 2:
        changed = False
        out = []
        for p in P:
            if out and math.dist(out[-1], p) < 0.05: continue
            out.append(p)
        if len(out) > 1 and math.dist(out[0], out[-1]) < 0.05: out.pop()
        P = out
        n = len(P)
        for i in range(n):
            a, b, c = P[i-1], P[i], P[(i+1) % n]
            cr = (b[0]-a[0])*(c[1]-b[1]) - (b[1]-a[1])*(c[0]-b[0])
            if abs(cr) < 1e-3 * max(1, math.dist(a, b)*math.dist(b, c)):   # collinear or a spike
                P = P[:i] + P[i+1:]; changed = True; break
    return P
def chain(lines):
    """The outline from the drawing's segments: a segment drawn back and
    forth (a spike) cancels out, the rest is followed end to start."""
    key = lambda p: (round(p[0], 1), round(p[1], 1))
    segs = [(key(a), key(b)) for a, b in lines if key(a) != key(b)]
    from collections import Counter
    cnt = Counter(segs)
    left = []
    for a, b in segs:
        if cnt[(b, a)] and cnt[(a, b)]:
            m = min(cnt[(a, b)], cnt[(b, a)]); cnt[(a, b)] -= m; cnt[(b, a)] -= m
    for (a, b), n in cnt.items(): left += [(a, b)]*n
    if not left: return []
    nxt = {}
    for a, b in left: nxt.setdefault(a, []).append(b)
    start = left[0][0]; P = [start]; cur = nxt[start].pop()
    while cur != start and len(P) < 500:
        P.append(cur)
        if not nxt.get(cur): break
        cur = nxt[cur].pop()
    return P
pieces = []
for s in segs:
    if not s['fill'] or not s['lines']: continue
    if '--no-grey' in sys.argv and max(s['fill']) - min(s['fill']) < 0.05: continue   # grey: band shading, not a piece
    P = clean(chain(s['lines']))
    if len(P) < 3: continue
    A = 0.5*sum(P[i-1][0]*P[i][1] - P[i][0]*P[i-1][1] for i in range(len(P)))
    cx = sum(p[0] for p in P)/len(P); cy = sum(p[1] for p in P)/len(P)
    pieces.append({'fill': s['fill'], 'poly': P, 'area': abs(A), 'c': (cx, cy)})
json.dump(pieces, open(f'{name}-pieces.json', 'w'))
from collections import Counter
print(len(pieces), 'pieces; by corners and area:', Counter((len(p['poly']), round(p['area'])) for p in pieces).most_common(20))

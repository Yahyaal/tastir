"""Classify candidate pieces by the source's colours on either side of them."""
import json, math
from PIL import Image
from cordoba_model import *
src = Image.open('finished-drawing.png').convert('RGB'); px = src.load(); W, H = src.size
a = 178.8; s = a / S3; t = math.radians(30)
sat = lambda c: max(c) - min(c) > 60
def colour_class(c):
    if max(c) < 90: return 'K'
    return tuple(v // 50 for v in c)
def inter(A, B):
    den = A[0] * B[1] - A[1] * B[0]
    if abs(den) < 1e-12: return None
    return ((A[2] * B[1] - B[2] * A[1]) / den, (A[0] * B[2] - B[0] * A[2]) / den)
inside = lambda p: all(math.cos(math.radians(60 * k + 30)) * p[0] + math.sin(math.radians(60 * k + 30)) * p[1] <= S3 / 2 + 1e-9 for k in range(6))
copies = []
for i in range(-3, 5):
    for j in range(-3, 5):
        copies.append((299.6 + i * a + j * 89.4, 349.6 - j * 154.9))
def img(u, X, Y):
    return (X + (u[0] * math.cos(t) - u[1] * math.sin(t)) * s, Y - (u[0] * math.sin(t) + u[1] * math.cos(t)) * s)
def verdict(p, q):
    votes = []
    for X, Y in copies:
        A, B = img(p, X, Y), img(q, X, Y)
        L = math.dist(A, B)
        if L < 0.5: continue
        nx, ny = -(B[1] - A[1]) / L, (B[0] - A[0]) / L
        hits = tot = 0
        for k in range(1, 6):
            f = 0.2 + 0.6 * (k - 1) / 4
            x, y = A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f
            pts = [(x + nx * o, y + ny * o) for o in (-3, 0, 3)]
            if not all(4 < u < W - 4 and 4 < v < H - 4 for u, v in pts): continue
            cs = [px[int(round(u)), int(round(v))] for u, v in pts]
            if not any(sat(c) for c in cs): continue        # black-and-white half: skip
            tot += 1
            line_here = any(max(px[int(round(x)) + dx, int(round(y)) + dy]) < 100 for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            if line_here or colour_class(cs[0]) != colour_class(cs[2]): hits += 1
        if tot >= 3: votes.append(hits / tot > 0.7)
    return votes
names = list(lines); cands = []
for nm in names:
    ln = lines[nm]
    ps = [p for m in names if m != nm for p in [inter(ln, lines[m])] if p and inside(p)]
    ps = sorted({(round(p[0], 9), round(p[1], 9)) for p in ps}, key=lambda p: p[0] * ln[1] - p[1] * ln[0])
    for p, q in zip(ps, ps[1:]):
        if math.dist(p, q) > 1e-6: cands.append((p, q, nm))
def key(p, q):
    r = lambda u: (round(u[0], 5) + 0.0, round(u[1], 5) + 0.0)
    return frozenset((r(p), r(q)))
def orbit(p, q):
    out = []
    for m in (1, -1):
        for k in range(6):
            c, s_ = math.cos(math.radians(60 * k)), math.sin(math.radians(60 * k))
            f = lambda u: (c * u[0] - s_ * u[1] * m, s_ * u[0] + c * u[1] * m)
            out.append(key(f(p), f(q)))
    return out
votes = {}
for p, q, nm in cands:
    votes[key(p, q)] = verdict(p, q)
ink = []; undecided = 0
for p, q, nm in cands:
    vs = [v for k in orbit(p, q) for v in votes.get(k, [])]
    if not vs: undecided += 1; continue
    if sum(vs) > len(vs) / 2: ink.append((p, q, nm))
print(len(ink), 'inked;', undecided, 'pieces with no verdict in their whole orbit')
json.dump(ink, open('cordoba-ink-raw.json', 'w'))

import json, math, sys
from cordoba_model import *
pts = json.load(open('folded.json'))
grid = {}
for x, y in pts: grid.setdefault((round(x * 300), round(y * 300)), []).append((x, y))
TOL = float(sys.argv[1]) if len(sys.argv) > 1 else 0.008
def near(p, tol=TOL):
    gx, gy = round(p[0] * 300), round(p[1] * 300)
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            for q in grid.get((gx + dx, gy + dy), []):
                if math.dist(p, q) < tol: return True
    return False
def fold(p):
    t = math.radians(30); x = (p[0] * math.cos(t) - p[1] * math.sin(t)) / S3; y = (p[0] * math.sin(t) + p[1] * math.cos(t)) / S3
    best = None
    for i in range(-2, 3):
        for j in range(-2, 3):
            X, Y = i + 0.5 * j, 0.866025 * j
            dd = (x - X) ** 2 + (y - Y) ** 2
            if best is None or dd < best[0]: best = (dd, X, Y)
    x -= best[1]; y -= best[2]
    r = math.hypot(x, y); th = math.degrees(math.atan2(y, x)) % 60
    if th > 30: th = 60 - th
    return (r * math.cos(math.radians(th)), r * math.sin(math.radians(th)))
def inter(A, B):
    den = A[0] * B[1] - A[1] * B[0]
    if abs(den) < 1e-12: return None
    return ((A[2] * B[1] - B[2] * A[1]) / den, (A[0] * B[2] - B[0] * A[2]) / den)
inside = lambda p: all(math.cos(math.radians(60 * k + 30)) * p[0] + math.sin(math.radians(60 * k + 30)) * p[1] <= S3 / 2 + 1e-9 for k in range(6))
ink = []
names = list(lines)
for nm in names:
    ln = lines[nm]
    ps = [p for m in names if m != nm for p in [inter(ln, lines[m])] if p and inside(p)]
    ps = sorted({(round(p[0], 9), round(p[1], 9)) for p in ps}, key=lambda p: p[0] * ln[1] - p[1] * ln[0])
    for p, q in zip(ps, ps[1:]):
        if math.dist(p, q) < 1e-6: continue
        sm = [(p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f) for f in [0.15 + 0.7 * i / 8 for i in range(9)]]
        if sum(near(fold(u)) for u in sm) >= 8: ink.append((p, q, nm))
json.dump(ink, open('cordoba-ink-raw.json', 'w'))
print(len(ink), 'max r', max(max(math.hypot(*p), math.hypot(*q)) for p, q, _ in ink))

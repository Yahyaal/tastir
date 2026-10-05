"""Candidate lines of the Córdoba pattern in the tutorial frame (O at a
12-star, A at the next grid point, grid spacing 1, grid points at 0°, 60°...),
and classification of their segments against the folded drawing."""
import json, math
S3 = math.sqrt(3)
d = math.tan(math.radians(15)) / 2            # 0.13397: offset of the parallels
def L(th, c):                                  # line with direction th, n·p = c
    t = math.radians(th); return (-math.sin(t), math.cos(t), c)
def dirn(th): t = math.radians(th); return (math.cos(t), math.sin(t))
hexsites = [dirn(60 * k) for k in range(6)]
eight = [tuple(v * S3 / 2 for v in dirn(30 + 60 * k)) for k in range(6)]
lines = {}
def add(name, ln): lines[name] = ln
for th in (0, 60, 120):                        # pairs at hexagram sites and O
    n = L(th, 0)
    offs = sorted({round(n[0] * p[0] + n[1] * p[1], 9) for p in hexsites + [(0, 0)]})
    for o in offs:
        for s in (-d, 0, d):
            add(f'A{th}_{o + s:+.4f}', L(th, o + s))
for th in (30, 90, 150):                       # pairs at the 12-star
    for s in (-d, 0, d):
        add(f'B{th}_{s:+.4f}', L(th, s))
r8 = d * math.sqrt(2)
for k, e in enumerate(eight):                  # diamonds of the 8-stars
    ax = 30 + 60 * k
    for th in (ax + 45, ax - 45):
        n = L(th, 0); c = n[0] * e[0] + n[1] * e[1]
        for sgn in (1, -1):
            add(f'D{k}_{th % 180}_{sgn}', L(th, c + sgn * r8 * math.cos(math.radians(45))))

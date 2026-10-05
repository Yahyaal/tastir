"""Ink = edges between faces of different source colour (or with a dark line
between same-colour faces). Faces come from the engine's arrangement of all
candidate lines around the tile."""
import json, math, subprocess, os
from collections import Counter
from PIL import Image
from cordoba_model import *
ROOT = '../../..'
src = Image.open('finished-drawing.png').convert('RGB'); px = src.load(); W, H = src.size
a = 178.8; s = a / S3; t = math.radians(30)
copies = [(299.6 + i * a + j * 89.4, 349.6 - j * 154.9) for i in range(-3, 5) for j in range(-3, 5)]
def img(u, X, Y):
    return (X + (u[0] * math.cos(t) - u[1] * math.sin(t)) * s, Y - (u[0] * math.sin(t) + u[1] * math.cos(t)) * s)
sat = lambda c: max(c) - min(c) > 60
PAL = {'purple': (150, 93, 178), 'white': (255, 255, 255), 'light': (115, 193, 236), 'blue': (0, 92, 172), 'red': (187, 43, 77), 'yellow': (255, 206, 118)}
def cls(c):
    if max(c) < 90: return 'K'
    n, d_ = min(((n, sum((x - y) ** 2 for x, y in zip(c, v))) for n, v in PAL.items()), key=lambda z: z[1])
    return n if d_ < 40 * 40 * 3 else None
# lattice of 12-stars in the tutorial frame
L1 = (S3 * math.cos(math.radians(30)), S3 * math.sin(math.radians(30)))
L2 = (0.0, S3)
shifts = [(i * L1[0] + j * L2[0], i * L1[1] + j * L2[1]) for i in range(-2, 3) for j in range(-2, 3)]
cand_lines = set()
for nm, (A, B, C) in lines.items():
    for sx, sy in shifts:
        c = C + A * sx + B * sy
        if A < -1e-9 or (abs(A) < 1e-9 and B < 0): A2, B2, c2 = -A, -B, -c
        else: A2, B2, c2 = A, B, c
        cand_lines.add((round(A2, 6) + 0.0, round(B2, 6) + 0.0, round(c2, 6) + 0.0))
cand_lines = list(cand_lines)
RAD = 1.6
box = lambda p: math.hypot(*p) <= RAD + 1e-9
def inter(A, B):
    den = A[0] * B[1] - A[1] * B[0]
    if abs(den) < 1e-12: return None
    return ((A[2] * B[1] - B[2] * A[1]) / den, (A[0] * B[2] - B[0] * A[2]) / den)
# clip every line to the disc of radius RAD, cut at crossings
segs = []
for ln in cand_lines:
    off = ln[2]
    if abs(off) >= RAD: continue
    h = math.sqrt(RAD * RAD - off * off); f = (ln[0] * off, ln[1] * off); tt = (-ln[1], ln[0])
    ps = [(f[0] + tt[0] * h, f[1] + tt[1] * h), (f[0] - tt[0] * h, f[1] - tt[1] * h)]
    ps += [p for m in cand_lines if m is not ln for p in [inter(ln, m)] if p and box(p)]
    ps = sorted({(round(p[0], 9), round(p[1], 9)) for p in ps}, key=lambda p: p[0] * tt[0] + p[1] * tt[1])
    for p, q in zip(ps, ps[1:]):
        if math.dist(p, q) > 1e-7: segs.append((p, q, ln))
# close the disc with a 96-gon so the faces near the rim are closed
rim = [(RAD * math.cos(2 * math.pi * k / 96), RAD * math.sin(2 * math.pi * k / 96)) for k in range(96)]
raw = [[p[0], p[1], q[0], q[1]] for p, q, _ in segs] + [[*rim[k], *rim[(k + 1) % 96]] for k in range(96)]
out = subprocess.run(['tsx', '--conditions=@tastir/source', os.path.join(ROOT, 'tools/review/faces.ts')], input=json.dumps(raw), capture_output=True, text=True, cwd='.')
faces = json.loads(out.stdout)
print(len(segs), 'pieces,', len(faces), 'faces')
def label(face):
    cx = sum(p[0] for p in face) / len(face); cy = sum(p[1] for p in face) / len(face)
    votes = Counter()
    for X, Y in copies:
        for f in (0.0, 0.35):
            u = [(cx + (p[0] - cx) * f, cy + (p[1] - cy) * f) for p in face]
            for v in (u if f else [(cx, cy)]):
                x, y = img(v, X, Y)
                if not (8 < x < W - 8 and 8 < y < H - 8): continue
                c = px[int(round(x)), int(round(y))]
                if not any(sat(px[int(round(x)) + dx, int(round(y)) + dy]) for dx in (-6, 0, 6) for dy in (-6, 0, 6)): continue   # black-and-white half
                if max(c) < 90: continue
                k = cls(c)
                if k: votes[k] += 1
    return votes.most_common(1)[0][0] if votes else None
labels = [label(f) for f in faces]
R5 = lambda p: (round(p[0], 6), round(p[1], 6))
edge_faces = {}
for k, f in enumerate(faces):
    for i in range(len(f)):
        e = frozenset((R5(f[i]), R5(f[(i + 1) % len(f)])))
        edge_faces.setdefault(e, []).append(k)
def dark_line(p, q):
    v = []
    for X, Y in copies:
        A, B = img(p, X, Y), img(q, X, Y)
        if math.dist(A, B) < 2: continue
        ok = []
        for f_ in (0.25, 0.5, 0.75):
            x, y = A[0] + (B[0] - A[0]) * f_, A[1] + (B[1] - A[1]) * f_
            if not (8 < x < W - 8 and 8 < y < H - 8): break
            if not any(sat(px[int(x) + dx, int(y) + dy]) for dx in (-4, 0, 4) for dy in (-4, 0, 4)): break
            ok.append(min(max(px[int(round(x)) + dx, int(round(y)) + dy]) for dx in (-1, 0, 1) for dy in (-1, 0, 1)) < 70)
        else:
            v.append(all(ok))
    return v and sum(v) > len(v) / 2
inside = lambda p: all(math.cos(math.radians(60 * k + 30)) * p[0] + math.sin(math.radians(60 * k + 30)) * p[1] <= S3 / 2 + 1e-9 for k in range(6))
names = {canon: nm for nm, ln in lines.items() for canon in [(round(ln[0], 6) + 0.0, round(ln[1], 6) + 0.0, round(ln[2], 6) + 0.0), (round(-ln[0], 6) + 0.0, round(-ln[1], 6) + 0.0, round(-ln[2], 6) + 0.0)]}
decision = {}
unlabelled = 0
for p, q, ln in segs:
    if not (inside(p) and inside(q)): continue
    if names.get(ln) is None: continue
    fs = edge_faces.get(frozenset((R5(p), R5(q))), [])
    if len(fs) != 2: continue
    if False: pass
    la, lb = labels[fs[0]], labels[fs[1]]
    if la is None or lb is None:
        unlabelled += 1; decision[(p, q, ln)] = dark_line(p, q) if math.dist(p, q) * s >= 2 else None; continue
    decision[(p, q, ln)] = (la != lb) or bool(dark_line(p, q))
# An undecided piece between two inked pieces on the same line is inked.
per_line = {}
for (p, q, ln) in decision:
    per_line.setdefault(ln, []).append((p, q))
for ln, ps in per_line.items():
    ps.sort(key=lambda e: (e[0][0] + e[1][0]) * -ln[1] + (e[0][1] + e[1][1]) * ln[0])
    for i in range(1, len(ps) - 1):
        k = (ps[i][0], ps[i][1], ln)
        if decision[k] is None and decision[(ps[i - 1][0], ps[i - 1][1], ln)] and decision[(ps[i + 1][0], ps[i + 1][1], ln)]:
            decision[k] = True
key = lambda p, q: frozenset((R5(p), R5(q)))
by_key = {key(p, q): v for (p, q, ln), v in decision.items()}
def orbit(p, q):
    out = []
    for m in (1, -1):
        for k in range(6):
            c, s_ = math.cos(math.radians(60 * k)), math.sin(math.radians(60 * k))
            f = lambda u: (c * u[0] - s_ * u[1] * m, s_ * u[0] + c * u[1] * m)
            out.append(key(f(p), f(q)))
    return out
chosen = []
for (p, q, ln), v in decision.items():
    vs = [by_key[k] for k in orbit(p, q) if by_key.get(k) is not None]
    if vs and sum(vs) > len(vs) / 2: chosen.append((p, q, ln))
on_rim = lambda p: any(abs(math.cos(math.radians(60 * k + 30)) * p[0] + math.sin(math.radians(60 * k + 30)) * p[1] - S3 / 2) < 1e-6 for k in range(6))
while True:
    deg = Counter()
    for p, q, ln in chosen:
        deg[R5(p)] += 1; deg[R5(q)] += 1
    keep = [(p, q, ln) for p, q, ln in chosen if not (math.dist(p, q) < 0.05 and any(deg[R5(e)] == 1 and not on_rim(e) for e in (p, q)))]
    if len(keep) == len(chosen): break
    chosen = keep
ink = [(p, q, names[ln]) for p, q, ln in chosen]
print(len(ink), 'inked pieces after the symmetry vote and pruning;', unlabelled, 'next to an unlabelled face')
print(Counter(l for l in labels if l))
json.dump(ink, open('cordoba-ink-raw.json', 'w'))
if os.environ.get('DBG'):
    for (p, q, ln), v in decision.items():
        m = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
        if math.dist(m, (1, 0)) < 0.3:
            fs = edge_faces.get(frozenset((R5(p), R5(q))), [])
            print(names.get(ln), [round(x, 3) for x in p], [round(x, 3) for x in q], v, [labels[k] for k in fs])

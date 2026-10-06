"""Measures the ivory-rimmed inlays of straight.png, fits each with edges at
multiples of 15°, and folds every inlay with its edges into one fundamental
triangle of the six-fold pattern (O, the edge midpoint (1, 0), the triangle
centre (1, 1/√3)), by a lattice step to its nearest rosette and a turn or
mirror about it. Prints, per folded piece, its centre and each edge line as
(normal angle, distance from O). Run from docs/research/design-h2/."""
import json, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure
from skimage.morphology import remove_small_objects
rgb = np.asarray(Image.open('straight.png').convert('RGB')).astype(float)
im = rgb.mean(2); PX = 300; X0, Y0 = -1.3, 1.9
S3 = math.sqrt(3)
g = ndi.gaussian_filter(im, 1.0)
rim = remove_small_objects(g > np.percentile(g, 80), max_size=40)
inl = ndi.binary_opening(ndi.binary_fill_holes(ndi.binary_closing(rim, iterations=3)), iterations=2)
lab, n = ndi.label(inl)
def to_xy(r, c): return (X0 + c / PX, Y0 - r / PX)
def fold(p):
    """The D6 + lattice element taking p into the fundamental triangle, as a
    function on points and on directions."""
    # nearest rosette on the triangular lattice (2, 0), (1, √3)
    best = None
    for j in range(-4, 4):
        for i in range(-4, 4):
            c = (2 * i + j, S3 * j)
            dd = math.dist(c, p)
            if best is None or dd < best[0]: best = (dd, c)
    c = best[1]; q = (p[0] - c[0], p[1] - c[1])
    a = math.degrees(math.atan2(q[1], q[0])) % 360
    k = math.floor(a / 60); rot = -60 * k; a2 = a + rot
    mir = a2 > 30
    def T(x):
        x = (x[0] - c[0], x[1] - c[1])
        t = math.radians(rot); x = (x[0] * math.cos(t) - x[1] * math.sin(t), x[0] * math.sin(t) + x[1] * math.cos(t))
        if mir:  # mirror in the 30° line
            t = math.radians(60); x = (x[0] * math.cos(t) + x[1] * math.sin(t), x[0] * math.sin(t) - x[1] * math.cos(t))
        return x
    return T
out = []
for k in range(1, n + 1):
    comp = lab == k
    if comp.sum() < 150: continue
    cs = measure.find_contours(np.pad(comp, 1).astype(float), 0.5); c = max(cs, key=len) - 1
    pts = [to_xy(r, cc) for r, cc in c]
    cen = (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
    if abs(cen[0]) > 1.05 or cen[1] > 1.6 or cen[1] < -4.1: continue   # inside the panel
    T = fold(cen)
    P = np.array([T(p) for p in pts]); C = T(cen)
    poly = measure.approximate_polygon(np.array([[p[0], p[1]] for p in P]), tolerance=1.6 / PX)
    lines = []
    for i in range(len(poly) - 1):
        p, q = poly[i], poly[i + 1]; L = float(np.hypot(*(q - p)))
        if L < 0.04: continue
        a = round(math.degrees(math.atan2(q[1] - p[1], q[0] - p[0])) / 15) * 15
        nv = np.array([math.cos(math.radians(a + 90)), math.sin(math.radians(a + 90))])
        u = (q - p) / L; rel = P - p; al = rel @ u; pe = rel @ np.array([-u[1], u[0]])
        sel = (al > 0.15 * L) & (al < 0.85 * L) & (abs(pe) < 0.01)
        off = float(np.median(P[sel] @ nv)) if sel.sum() > 3 else float(p @ nv)
        side = 'in' if (np.array(C) @ nv) < off else 'out'   # inlay on O's side of the edge?
        na = (a + 90) % 360
        if na >= 180: na -= 180; off = -off
        lines.append((na, round(off, 4), side, round(L, 3)))
    out.append({'c': [round(C[0], 3), round(C[1], 3)], 'area': round(comp.sum() / PX / PX, 4), 'lines': lines})
json.dump(out, open('inlays-folded.json', 'w'))
for o in sorted(out, key=lambda o: (round(math.hypot(*o['c']), 1), o['c'][1])):
    print(o['c'], 'r', round(math.hypot(*o['c']), 3), 'area', o['area'], o['lines'])

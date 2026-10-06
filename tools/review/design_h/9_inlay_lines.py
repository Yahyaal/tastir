"""Reads the pattern lines from the inlays. Every carved piece is an inlay
framed by bands of equal width, so each inlay edge runs parallel to a pattern
line at half a band's width. This fits each inlay of one 45° wedge of
`tile-composite.png` with edges at multiples of 15°, moves each edge out by
half a band (W) and prints the line with its distance from O, from the corner
(1, 1) and from the next rosette (2, 0).

Usage: 9_inlay_lines.py [half band] [half composite width] [wedge degrees]

What it found (5 October): every line is one of Samira Mian's stellated-rosette
lines. Distance √3/2 with normals at 30° steps (the two hexagons' sides), about
0.177 with normals at 15° + 30° steps (the star lines), and 1 − √3/2 about the
small hexagons at (1, 1/√3).
"""
import json, math, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure
from skimage.morphology import remove_small_objects

# Optional arguments: half band width, half the composite's width, wedge angle.
W = float(sys.argv[1]) if len(sys.argv) > 1 else 0.055
HALF = float(sys.argv[2]) if len(sys.argv) > 2 else 1.2
WEDGE = float(sys.argv[3]) if len(sys.argv) > 3 else 45
im = np.asarray(Image.open('tile-composite.png')).astype(float); N = im.shape[0]; S = N/(2*HALF)
g = ndi.gaussian_filter(im, 1.0); loc = g - ndi.gaussian_filter(im, 15)
rim = remove_small_objects(loc > np.percentile(loc, 88), max_size=30)
inlaid = ndi.binary_opening(ndi.binary_fill_holes(ndi.binary_closing(rim, iterations=2)), iterations=1)
lab, n = ndi.label(inlaid)
out = []
for k in range(1, n+1):
    comp = lab == k
    if comp.sum() < 250: continue
    c = max(measure.find_contours(np.pad(comp, 1).astype(float), 0.5), key=len) - 1
    pts = np.array([((x-N/2)/S, (N/2-y)/S) for y, x in c]); cen = pts.mean(0)
    if not (cen[0] > -0.05 and cen[1] > -0.05 and math.degrees(math.atan2(cen[1], cen[0])) < WEDGE + 3 and math.hypot(*cen) < HALF - 0.05): continue
    poly = measure.approximate_polygon(c, tolerance=1.6)
    Pp = np.array([((x-N/2)/S, (N/2-y)/S) for y, x in poly[:-1]])
    for i in range(len(Pp)):
        p, q = Pp[i], Pp[(i+1) % len(Pp)]
        L = np.linalg.norm(q-p)
        if L < 0.03: continue
        a = round(math.degrees(math.atan2(q[1]-p[1], q[0]-p[0]))/15)*15
        nrm = np.array([math.cos(math.radians(a+90)), math.sin(math.radians(a+90))])
        u = (q-p)/L; rel = pts - p; along = rel @ u; perp = rel @ np.array([-u[1], u[0]])
        sel = (along > 0.15*L) & (along < 0.85*L) & (abs(perp) < 0.01)
        off = float(np.median(pts[sel] @ nrm)) if sel.sum() > 3 else float(p @ nrm)
        off += W if cen @ nrm < off else -W          # out to the band's centre
        na = (a + 90) % 360
        if na >= 180: na -= 180; off = -off
        t = math.radians(na); nv = (math.cos(t), math.sin(t))
        out.append({'normal': na, 'dO': off, 'd11': off - nv[0] - nv[1], 'd20': off - 2*nv[0], 'piece': cen.tolist()})
for o in sorted(out, key=lambda o: (o['normal'], o['dO'])):
    print(f"normal {o['normal']:4.0f}  from O {o['dO']:+.4f}  from (1,1) {o['d11']:+.4f}  from (2,0) {o['d20']:+.4f}   piece at ({o['piece'][0]:.2f}, {o['piece'][1]:.2f})")
json.dump(out, open('inlay-lines.json', 'w'))

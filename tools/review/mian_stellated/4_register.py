"""Registers a frame (centre of the four-rosette sheet = (1,1) in rosette
units) by maximising how much blue ink lies on the two rosette families."""
import numpy as np, math, json, sys
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
blue = (im[..., 2] > 150) & (im[..., 0] < 170) & (im[..., 1] < 140)
blue[:, :int(sys.argv[3])] = False                                  # left text panel
Ro = (3**.5/2)/math.cos(math.radians(15)); dA = Ro*math.tan(math.radians(37.5))*math.cos(math.radians(75))
L = []
for i in range(-1, 3):
    for j in range(-1, 3):
        for phi, d in ((15, dA), (0, 3**.5/2)):
            for k in range(12):
                a = math.radians(phi + 30*k); n = (math.cos(a), math.sin(a)); L.append((n[0], n[1], d + n[0]*2*i + n[1]*2*j))
ys, xs = np.nonzero(blue); pts = np.stack([xs, ys], 1)[::3].astype(float)
def score(cx, cy, S):
    X = (pts[:, 0] - cx)/S + 1; Y = (cy - pts[:, 1])/S + 1
    m = np.full(len(X), np.inf)
    for nx, ny, c in L: m = np.minimum(m, np.abs(X*nx + Y*ny - c))
    return (m*S < 2.5).mean()
H, W = blue.shape
CX, CY = float(sys.argv[6]), float(sys.argv[7])
best = None
for S in np.arange(float(sys.argv[4]), float(sys.argv[5]), 2):
    for cx in np.arange(CX - 6, CX + 7, 2):
        for cy in np.arange(CY - 6, CY + 7, 2):
            s = score(cx, cy, S)
            if best is None or s > best[0]: best = (s, cx, cy, S)
s, cx, cy, S = best
for st in (2, 1, 0.5):
    for _ in range(3):
        for dx in (-st, 0, st):
            for dy in (-st, 0, st):
                for dS in (-st, 0, st):
                    v = score(cx + dx, cy + dy, S + dS)
                    if v > best[0]: best = (v, cx + dx, cy + dy, S + dS)
        s, cx, cy, S = best
print('explained', round(s, 3), 'sheet centre', cx, cy, 'unit', S)
json.dump({'cx': cx - S, 'cy': cy + S, 'S': S}, open(sys.argv[2], 'w'))

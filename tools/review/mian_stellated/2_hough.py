"""Folded line search on the blue ink of frame 20, for one rosette (r < 1)
and for the space between rosettes."""
import numpy as np, math, sys, json
from PIL import Image
from scipy import ndimage as ndi
from scipy.signal import find_peaks
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
blue = (im[..., 2] > 150) & (im[..., 0] < 160) & (im[..., 1] < 130)
g = json.load(open(sys.argv[2]))
cx, cy, S = g['cx'], g['cy'], g['S']
ys, xs = np.nonzero(blue); X = (xs - cx)/S; Y = (cy - ys)/S
for (ox, oy) in ((0, 0), (2, 0), (0, 2), (2, 2)):
    pass
# fold all four rosettes onto (0,0)
Xs = []; Ys = []
for ox, oy in ((0, 0), (2, 0), (0, 2), (2, 2)):
    m = np.hypot(X - ox, Y - oy) < 0.98
    Xs.append(X[m] - ox); Ys.append(Y[m] - oy)
X0 = np.concatenate(Xs); Y0 = np.concatenate(Ys)
for phi in np.arange(0, 30, 2.5):
    ds = np.concatenate([np.abs(X0*math.cos(math.radians(phi + 30*k)) + Y0*math.sin(math.radians(phi + 30*k))) for k in range(12)])
    h, e = np.histogram(ds, bins=500, range=(0, 1)); h = ndi.gaussian_filter1d(h.astype(float), 1)
    pk, pr = find_peaks(h, prominence=h.max()*0.2, distance=5)
    c = (e[:-1] + e[1:])/2
    print(f'normal {phi:4.1f}+30k: peaks', [(round(c[p], 3), int(h[p])) for p in pk][:8])

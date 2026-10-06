"""Folded edge profile of the straightened grille: for edges whose normal is
at a multiple of 30°, the histogram of their distance from the nearest star
(tutorial units, stars 2 apart), split by normal class (0° or 30° from a
star-to-star direction) and by which way the brightness rises. Run from
docs/research/ibn-tulun-2/."""
import math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('straight.png').convert('L')).astype(float)
PX = 240.0; C = 960    # straight.png is 120 px per photo-frame unit = 240 per tutorial unit
g = ndi.gaussian_filter(im, 1.5); gy, gx = np.gradient(g); mag = np.hypot(gx, gy)
ys, xs = np.nonzero((mag > 6) & (im > 5))
X = (xs - C)/PX; Y = (C - ys)/PX
keep = np.hypot(X, Y) < 3.6; X, Y, ys, xs = X[keep], Y[keep], ys[keep], xs[keep]
w = mag[ys, xs]; phi = np.degrees(np.arctan2(-gy[ys, xs], gx[ys, xs]))   # direction of rising brightness
S3 = math.sqrt(3)
stars = np.array([(2*i + j, S3*j) for i in range(-4, 5) for j in range(-4, 5)])
d2 = (X[:, None] - stars[None, :, 0])**2 + (Y[:, None] - stars[None, :, 1])**2
k = np.argmin(d2, 1); rx = X - stars[k, 0]; ry = Y - stars[k, 1]
for cls in (0, 30):
    hist = {+1: np.zeros(1200), -1: np.zeros(1200)}
    for j in range(12):
        a = cls + 60*(j % 6) + (0 if j < 6 else 0)
        if j >= 6: break
        for s in (0, 180):
            n = math.radians(a + s); d = rx*math.cos(n) + ry*math.sin(n)
            dp = (phi - (a + s) + 180) % 360 - 180
            for sign, sel in ((+1, np.abs(dp) < 8), (-1, np.abs(np.abs(dp) - 180) < 8)):
                m = sel & (d > 0)
                np.add.at(hist[sign], np.clip((d[m]*500).astype(int), 0, 1199), w[m])
    for sign in (+1, -1):
        h = ndi.gaussian_filter1d(hist[sign], 3)
        pk = [(round(i/500, 3), round(float(h[i]))) for i in range(6, 600) if h[i] == h[i-6:i+7].max() and h[i] > 0.2*h[:600].max()]
        print('normal class', cls, 'brighter outward' if sign > 0 else 'brighter inward', pk)

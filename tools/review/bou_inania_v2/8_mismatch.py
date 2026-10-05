#!/usr/bin/env python3
"""Where the draft's ink and the drawing disagree: band centres of the
drawing with no ink near them (magenta) and ink that runs off the bands
(blue); matching ink in green. Usage: 8_mismatch.py <drawing> <ink.json> <out.png>"""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage.morphology import remove_small_holes, skeletonize
img = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
mx = img.max(2); mn = img.min(2); sat = (mx - mn) / (mx + 1)
pieces = (mx < 75) | ((sat > 0.35) & (mx > 50))
band = ~remove_small_holes(ndi.binary_opening(pieces, iterations=2), max_size=200)
dt = ndi.distance_transform_edt(band)
cx, cy, R, F = 1027.0, 1027.5, 369.6, 2.2618
ink = json.load(open(sys.argv[2]))
canvas = Image.new('L', (img.shape[1], img.shape[0]), 0); dc = ImageDraw.Draw(canvas)
P = lambda p: (cx + p[0] * R, cy - p[1] * R)
for a, b in ink: dc.line((P(a), P(b)), fill=1, width=24)
near_ink = np.asarray(canvas).astype(bool)
sk = skeletonize(dt >= 9)
yy, xx = np.mgrid[0:img.shape[0], 0:img.shape[1]]
inside = (np.abs(xx - cx) < (F - 0.03) * R) & (np.abs(yy - cy) < (F - 0.03) * R)
missing = sk & ~near_ink & inside
out = Image.fromarray(img.astype(np.uint8)); out = Image.blend(out, Image.new('RGB', out.size, 'white'), 0.55); d = ImageDraw.Draw(out)
off = on = 0
for a, b in ink:
    n = max(3, int(math.dist(a, b) * R / 4)); ok = 0
    for u in np.linspace(0.1, 0.9, n):
        x = a[0] + u * (b[0] - a[0]); y = a[1] + u * (b[1] - a[1]); ok += dt[int(round(cy - y * R)), int(round(cx + x * R))] >= 8
    good = ok / n > 0.7
    on += good; off += not good
    d.line((P(a), P(b)), fill=(0, 160, 0) if good else (0, 80, 255), width=6)
m = ndi.binary_dilation(missing, iterations=5)
o = np.asarray(out).copy(); o[m] = (230, 0, 200)
print('ink on bands', on, 'off bands', off, 'band centre without ink (px)', int(missing.sum()), 'of', int((sk & inside).sum()))
Image.fromarray(o).crop((int(cx - F * R) - 10, int(cy - F * R) - 10, int(cx + F * R) + 10, int(cy + F * R) + 10)).resize((1000, 1000)).save(sys.argv[3])

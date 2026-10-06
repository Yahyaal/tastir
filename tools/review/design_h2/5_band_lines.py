"""Band centrelines of the doors: the medial axis of the wood between the
ivory-rimmed inlays of straight.png. Then, for each direction at a multiple of
15°, the offsets where a long stretch of a line follows the medial axis. Each
stretch is folded into the six-fold frame of its nearest rosette and printed as
(normal angle, distance from that rosette). Run from docs/research/design-h2/."""
import json, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import remove_small_objects, skeletonize
rgb = np.asarray(Image.open('straight.png').convert('RGB')).astype(float)
im = rgb.mean(2); PX = 300; X0, Y0 = -1.3, 1.9; H, W = im.shape
S3 = math.sqrt(3)
g = ndi.gaussian_filter(im, 1.0)
rim = remove_small_objects(g > np.percentile(g, 80), max_size=40)
inl = ndi.binary_opening(ndi.binary_fill_holes(ndi.binary_closing(rim, iterations=3)), iterations=2)
yy, xx = np.mgrid[0:H, 0:W]; X = X0 + xx / PX; Y = Y0 - yy / PX
panel = (abs(X) < 0.99) & (Y < 1.70) & (Y > -4.1)
wood = ~inl & panel
sk = skeletonize(wood)
for _ in range(15):                                   # prune short spurs
    nb = ndi.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - 1
    sk &= ~(sk & (nb <= 1))
near = ndi.distance_transform_edt(~sk) <= 3
Image.fromarray((np.stack([inl * 120, sk * 255, panel * 60], 2)).astype(np.uint8)).save('band-skeleton.png')
def onl(x, y):
    c = np.round((x - X0) * PX).astype(int); r = np.round((Y0 - y) * PX).astype(int)
    ok = (c >= 0) & (c < W) & (r >= 0) & (r < H)
    v = np.zeros(len(x), bool); v[ok] = near[r[ok], c[ok]] & panel[r[ok], c[ok]]
    return v
t = np.arange(-6, 6, 1 / PX)
res = []
for k in range(12):
    a = math.radians(15 * k); d = (math.cos(a), math.sin(a)); n = (-d[1], d[0])
    for off in np.arange(-6, 6, 0.004):
        v = onl(off * n[0] + t * d[0], off * n[1] + t * d[1])
        if v.sum() < 30: continue
        i = 0
        while i < len(t):
            if v[i]:
                j = i
                gaps = 0
                while j + 1 < len(t) and (v[j + 1] or gaps < 6):
                    gaps = 0 if v[j + 1] else gaps + 1; j += 1
                L = t[j] - t[i]
                if L >= 0.15:
                    p = (off * n[0] + t[i] * d[0], off * n[1] + t[i] * d[1]); q = (off * n[0] + t[j] * d[0], off * n[1] + t[j] * d[1])
                    res.append((15 * k, round(float(off), 3), p, q, round(float(L), 3)))
                i = j + 1
            else:
                i += 1
json.dump(res, open('band-runs.json', 'w'))
print(len(res), 'runs')

"""Design H3, the minbar of the mosque of al-Nasir Muhammad in the Cairo
Citadel (Commons photo, see README.md). Refines the centres of the rosettes
(twelve-fold self-similarity) and of the four-fold motifs between them
(four-fold), then fits a homography from the tutorial frame (rosettes at
(0, 0), (2, 0), (0, 2)…, motifs at (1, 1)…) to the photo: homography.npy.
Run from docs/research/design-h3/."""
import json, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('nasir-minbar.jpg').convert('L')).astype(float)
im = ndi.gaussian_filter(im, 1.5)
def score(cx, cy, fold, R=260):
    ys, xs = np.mgrid[-R:R:4, -R:R:4]; m = (xs**2 + ys**2 < R*R) & (xs**2 + ys**2 > 25**2)
    xs, ys = xs[m], ys[m]; a = ndi.map_coordinates(im, [cy + ys, cx + xs], order=1)
    t = 2*math.pi/fold; xr = xs*math.cos(t) - ys*math.sin(t); yr = xs*math.sin(t) + ys*math.cos(t)
    return np.corrcoef(a, ndi.map_coordinates(im, [cy + yr, cx + xr], order=1))[0, 1]
def refine(cx, cy, fold):
    for st in (24, 8, 3, 1):
        while True:
            best = max((score(cx + dx, cy + dy, fold), cx + dx, cy + dy) for dx in (-st, 0, st) for dy in (-st, 0, st))
            if (best[1], best[2]) == (cx, cy): break
            cx, cy = best[1], best[2]
    return cx, cy, best[0]
# rough centres from the thumbnail (x 3.456), with their place in the tutorial frame
rough = [((260, 450), (0, 0), 12), ((500, 700), (2, 0), 12), ((260, 195), (-1, 1), 4),
         ((500, 450), (1, 1), 4), ((260, 700), (1, -1), 4), ((30, 690), (0, -2), 12), ((30, 210), (-2, 0), 12)]
pts = []
for (x, y), uv, fold in rough:
    cx, cy, s = refine(x*3.456, y*3.456, fold)
    print(uv, fold, round(cx, 1), round(cy, 1), round(s, 3)); pts.append((uv, (cx, cy), s))
json.dump([[list(uv), list(p), s] for uv, p, s in pts], open('centres.json', 'w'))
# homography (DLT) from frame to photo, using the centres that self-match well
A = []
for (u, v), (x, y), s in pts:
    if s < 0.3: continue
    A.append([-u, -v, -1, 0, 0, 0, x*u, x*v, x]); A.append([0, 0, 0, -u, -v, -1, y*u, y*v, y])
Hm = np.linalg.svd(np.array(A))[2][-1].reshape(3, 3); Hm /= Hm[2, 2]
np.save('homography.npy', Hm)
for (u, v), (x, y), s in pts:
    p = Hm @ [u, v, 1]; print((u, v), 'residual px', round(math.hypot(p[0]/p[2] - x, p[1]/p[2] - y), 1))

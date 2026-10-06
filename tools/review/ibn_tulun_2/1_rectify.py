"""Second Ibn Tulun grille (Commons, "Ibn Tulun Mosque window DSCF3561.jpg"):
finds the small six-pointed star openings by matching one of them, gives each
a place on a triangular lattice, and fits a homography from the tutorial frame
(stars at the lattice points, OA = half the distance between neighbours) to
the photo (homography.npy, stars.json). Run from docs/research/ibn-tulun-2/."""
import json, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.feature import match_template, peak_local_max
im = np.asarray(Image.open('w0.jpg').convert('L')).astype(float)
g = ndi.gaussian_filter(im, 1.0)
seed = (1497, 1330); R = 28
tpl = g[seed[1]-R:seed[1]+R, seed[0]-R:seed[0]+R]
cc = match_template(g, tpl, pad_input=True)
pk = peak_local_max(cc, min_distance=60, threshold_abs=0.55)
pts = np.array([(c, r) for r, c in pk], float)
print(len(pts), 'stars found')
# neighbour vectors from the seed: the two shortest independent ones
d = pts - np.array(seed); d = d[np.argsort(np.hypot(*d.T))][1:7]
a = d[np.argmin(np.abs(np.arctan2(d[:, 1], d[:, 0])))]            # roughly to the right
b = min(d, key=lambda v: abs(math.atan2(v[1], v[0]) + math.pi/2))  # roughly up
print('a', a, 'b', b)
# lattice index by local affine growth (handles perspective): BFS from the seed
idx = {0: (0, 0)}; pos = {(0, 0): 0}
order = [int(np.argmin(np.hypot(*(pts - np.array(seed)).T)))]
idx = {order[0]: (0, 0)}
queue = list(order)
while queue:
    i = queue.pop(0); (u, v) = idx[i]
    for (du, dv), vec in (((1, 0), a), ((-1, 0), -a), ((0, 1), b), ((0, -1), -b), ((1, 1), a + b), ((-1, -1), -a - b)):
        want = pts[i] + vec
        j = int(np.argmin(np.hypot(*(pts - want).T)))
        if np.hypot(*(pts[j] - want)) < 25 and j not in idx:
            idx[j] = (u + du, v + dv); queue.append(j)
print(len(idx), 'stars on the lattice')
# a and b should be 120° apart in the photo (b roughly up, a roughly to the right)
ang = math.degrees(math.acos(np.dot(a, b)/np.hypot(*a)/np.hypot(*b)))
print('angle between a and b in photo', round(ang, 1))
S3 = math.sqrt(3)
A, ff = [], []
for i, (u, v) in idx.items():
    # a and b are 120° apart: a -> (2, 0), b -> (-1, √3)
    X, Y = 2*u - v, S3*v
    x, y = pts[i]
    A.append([-X, -Y, -1, 0, 0, 0, x*X, x*Y, x]); A.append([0, 0, 0, -X, -Y, -1, y*X, y*Y, y]); ff.append((X, Y, x, y))
Hm = np.linalg.svd(np.array(A))[2][-1].reshape(3, 3); Hm /= Hm[2, 2]
res = [math.hypot(*(np.array([(Hm @ [X, Y, 1])[0]/(Hm @ [X, Y, 1])[2], (Hm @ [X, Y, 1])[1]/(Hm @ [X, Y, 1])[2]]) - [x, y])) for X, Y, x, y in ff]
print('residual px: median', round(float(np.median(res)), 1), 'max', round(max(res), 1))
np.save('homography.npy', Hm); json.dump([[X, Y, x, y] for X, Y, x, y in ff], open('stars.json', 'w'))

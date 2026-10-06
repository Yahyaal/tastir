"""One tile averaged over every star of the grille with six-fold symmetry and
mirrors, in the tutorial frame (O a star, neighbouring stars 2 apart, so the
photo frame of 1_rectify.py is scaled by 1/2): tile-composite.png, ±1.6 units,
1000 px. Run from docs/research/ibn-tulun-2/."""
import json, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('w0.jpg').convert('L')).astype(float); H, W = im.shape
Hm = np.load('homography.npy')
S3 = math.sqrt(3)
stars = [(4*i + 2*j, 2*S3*j) for i in range(-6, 7) for j in range(-6, 7)]
known = np.array([(X, Y, x, y) for X, Y, x, y in json.load(open('stars.json'))])
def near_data(X, Y):          # only use stars inside the area the lattice was fitted on
    return np.min(np.hypot(known[:, 0] - X, known[:, 1] - Y)) < 1.0
stars = [s for s in stars if near_data(*s)]
print(len(stars), 'stars used')
N = 1000; R = 1.6
g = np.linspace(-R, R, N); X, Y = np.meshgrid(g, -g)
acc = np.zeros((N, N)); cnt = np.zeros((N, N))
for sx, sy in stars:
    for k in range(6):
        for m in (1, -1):
            a = k*math.pi/3
            xr = X*math.cos(a) - m*Y*math.sin(a); yr = X*math.sin(a) + m*Y*math.cos(a)
            U = sx + 2*xr; V = sy + 2*yr
            ok = np.zeros_like(U, bool)
            p = Hm @ np.vstack([U.ravel(), V.ravel(), np.ones(U.size)])
            x = (p[0]/p[2]).reshape(N, N); y = (p[1]/p[2]).reshape(N, N)
            # keep to the fitted area: within 1.2 fine units of a known lattice point
            ok = (x > 0) & (x < W - 1) & (y > 0) & (y < H - 1)
            acc += ndi.map_coordinates(im, [y, x], order=1) * ok; cnt += ok
img = acc/np.maximum(cnt, 1)
print('samples min', cnt.min(), 'max', cnt.max())
Image.fromarray(img.clip(0, 255).astype(np.uint8)).save('tile-composite.png')

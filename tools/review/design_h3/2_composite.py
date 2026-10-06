"""The tile in the tutorial frame, averaged over every rosette of the photo:
twelve-fold inside r = 0.8, four-fold (with mirrors) outside
(tile-composite.png, ±1.2 units, 1000 px). Run from docs/research/design-h3/."""
import math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('nasir-minbar.jpg').convert('L')).astype(float); H, W = im.shape
Hm = np.load('homography.npy')
# the panel: inside the frame, left of the stair rail (photo x < 0.6 y + ...), above the base
def inside(x, y): return (x > 40) & (x < W - 30) & (y > 30) & (y < 3230) & (y > 0.95*x - 1100)
stars = [(0, 0), (2, 0), (0, -2), (-2, 0), (2, -2), (-2, 2), (0, 2), (4, 0), (2, 2), (-4, 0), (0, -4), (2, -4), (4, -2)]
N = 1000; R = 1.2
g = np.linspace(-R, R, N); X, Y = np.meshgrid(g, -g)
def avg(group):
    acc = np.zeros((N, N)); cnt = np.zeros((N, N))
    for (u0, v0) in stars:
        for a, m in group:
            xr = X*math.cos(a) - m*Y*math.sin(a); yr = X*math.sin(a) + m*Y*math.cos(a)
            p = Hm @ np.vstack([(u0 + xr).ravel(), (v0 + yr).ravel(), np.ones(N*N)])
            x = (p[0]/p[2]).reshape(N, N); y = (p[1]/p[2]).reshape(N, N)
            ok = inside(x, y)
            acc += ndi.map_coordinates(im, [y, x], order=1) * ok; cnt += ok
    return acc/np.maximum(cnt, 1), cnt
D4 = [(k*math.pi/2, m) for k in range(4) for m in (1, -1)]
D12 = [(k*math.pi/6, m) for k in range(12) for m in (1, -1)]
a4, c4 = avg(D4); a12, _ = avg(D12)
w = np.clip((0.80 - np.hypot(X, Y))/0.05, 0, 1)
print('min samples', c4.min())
Image.fromarray((a12*w + a4*(1 - w)).clip(0, 255).astype(np.uint8)).save('tile-composite.png')

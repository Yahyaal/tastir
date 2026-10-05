"""Lines through the blue ink of a registered frame that the rosette
families do not explain, as (normal angle about the sheet centre, distance)."""
import numpy as np, math, json, sys
from PIL import Image
from scipy import ndimage as ndi
from scipy.signal import find_peaks
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
blue = (im[..., 2] > 150) & (im[..., 0] < 170) & (im[..., 1] < 140)
blue[:, :int(sys.argv[3])] = False
g = json.load(open(sys.argv[2])); cx, cy, S = g['cx'], g['cy'], g['S']
Ro = (3**.5/2)/math.cos(math.radians(15)); dA = Ro*math.tan(math.radians(37.5))*math.cos(math.radians(75))
L = []
for i in range(-1, 3):
    for j in range(-1, 3):
        for phi, d in ((15, dA), (0, 3**.5/2)):
            for k in range(12):
                a = math.radians(phi + 30*k); n = (math.cos(a), math.sin(a)); L.append((n[0], n[1], d + n[0]*2*i + n[1]*2*j))
ys, xs = np.nonzero(blue); X = (xs - cx)/S; Y = (cy - ys)/S
m = np.full(len(X), np.inf)
for nx, ny, c in L: m = np.minimum(m, np.abs(X*nx + Y*ny - c))
r = m*S > 3
X, Y = X[r] - 1, Y[r] - 1                     # about the sheet centre (1, 1)
keep = (np.abs(X) < 1) & (np.abs(Y) < 1); X, Y = X[keep], Y[keep]
print('unexplained points', len(X))
for phi in [0, 7.5, 15, 22.5, 30, 37.5, 45]:
    ds = np.concatenate([np.abs(X*math.cos(math.radians(phi + 90*k)) + Y*math.sin(math.radians(phi + 90*k))) for k in range(4)] +
                        [np.abs(X*math.cos(math.radians(-phi + 90*k)) + Y*math.sin(math.radians(-phi + 90*k))) for k in range(4)])
    h, e = np.histogram(ds, bins=400, range=(0, 1)); h = ndi.gaussian_filter1d(h.astype(float), 1)
    pk, _ = find_peaks(h, prominence=max(h.max()*0.25, 5), distance=4); c = (e[:-1] + e[1:])/2
    print(f'normal ±{phi:4.1f}+90k:', [(round(c[p], 3), int(h[p])) for p in pk][:6])

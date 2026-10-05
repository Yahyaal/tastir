import numpy as np, math
from PIL import Image
from scipy import ndimage as ndi
from skimage.measure import find_contours, approximate_polygon
im = np.asarray(Image.open('bouinania-pattern.jpg').convert('RGB')).astype(float)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
cx, cy, R = 1024.5, 1011.5, 415.0
band = im.min(2) > 120
dt = ndi.distance_transform_edt(band)
yy, xx = np.mgrid[0:im.shape[0], 0:im.shape[1]]
X = (xx - cx)/R; Y = (cy - yy)/R
rr = np.hypot(X, Y); th = np.degrees(np.arctan2(Y, X)) % 360
w = np.percentile(dt[band & (rr < 1.6)], 99)*2/R
print('band width', round(w, 4), 'R')
masks = {'brown': (r > 90) & (r > b + 40) & (g < r - 15) & (g > 30),
         'green': (g > 70) & (g > r + 25) & (g > b + 25),
         'black': im.max(2) < 50}
def piece_at(mask, x, y):
    lab, n = ndi.label(mask); L = lab[int(round(cy - y*R)), int(round(cx + x*R))]
    return lab == L if L else None
def edges(m, name):
    c = max(find_contours(m.astype(float), 0.5), key=len)
    poly = approximate_polygon(c, tolerance=2.5)
    out = []
    for (y0, x0), (y1, x1) in zip(poly[:-1], poly[1:]):
        L = math.hypot(x1 - x0, y1 - y0)
        if L < 12: continue
        ang = math.degrees(math.atan2(-(y1 - y0), x1 - x0)) % 180
        nx, ny = -(-(y1 - y0))/L, (x1 - x0)/L
        px, py = (x0 - cx)/R, (cy - y0)/R
        dd = px*nx + py*ny
        if dd < 0: nx, ny, dd = -nx, -ny, -dd
        nang = math.degrees(math.atan2(ny, nx)) % 360
        out.append((round(ang, 1), round(nang, 1), round(dd, 4), round(L/R, 3)))
    print(name, 'edges: (line dir, normal dir, distance from O, length), all in R')
    for e in out: print('   ', e)
# one of each, near the 75° axis (between 60 and 90) and on the 90 axis
for name, col, (ang, rad) in (('brown pentagon', 'brown', (75, 1.18)), ('small black star', 'black', (90, 1.03)), ('green shield', 'green', (75, 1.55)), ('black between', 'black', (90, 1.33))):
    x, y = rad*math.cos(math.radians(ang)), rad*math.sin(math.radians(ang))
    m = piece_at(masks[col], x, y)
    if m is None: print(name, 'not found at', ang, rad); continue
    ys, xs = np.nonzero(m); print(name, 'area', round(m.sum()/R/R, 4), 'centre', round(float(np.hypot((xs.mean()-cx)/R, (cy-ys.mean())/R)), 3), round(float(np.degrees(np.arctan2(cy-ys.mean(), xs.mean()-cx))), 1))
    edges(m, name)

"""Cells of the doors' pattern: every inlay of straight.png grown into the wood
around it (watershed on the distance to the inlays), so each joint lies halfway
between two inlays. Prints the polygon of each cell near the upper rosette O,
in tutorial units, and writes cells.png. Run from docs/research/design-h2/."""
import json, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure, segmentation
from skimage.morphology import remove_small_objects
rgb = np.asarray(Image.open('straight.png').convert('RGB')).astype(float)
im = rgb.mean(2); PX = 300; X0, Y0 = -1.3, 1.9; H, W = im.shape
g = ndi.gaussian_filter(im, 1.0)
rim = remove_small_objects(g > np.percentile(g, 80), max_size=40)
inl = ndi.binary_opening(ndi.binary_fill_holes(ndi.binary_closing(rim, iterations=3)), iterations=2)
inl = remove_small_objects(inl, max_size=150)
yy, xx = np.mgrid[0:H, 0:W]; X = X0 + xx / PX; Y = Y0 - yy / PX
panel = (abs(X) < 0.985) & (Y < 1.70) & (Y > -4.1)
# the seam down the middle splits pieces in two: join the halves across it
seam = abs(X) < 0.03
inl2 = inl | (ndi.binary_dilation(inl, iterations=12) & seam & ndi.binary_dilation(inl & (X < 0), iterations=14) & ndi.binary_dilation(inl & (X > 0), iterations=14))
mark, n = ndi.label(inl2 & panel)
dist = ndi.distance_transform_edt(~inl2)
cells = segmentation.watershed(dist, mark, mask=panel)
bnd = segmentation.find_boundaries(cells)
v = (rgb * 0.6).astype(np.uint8); v[bnd] = (255, 255, 0)
Image.fromarray(v).save('cells.png')
out = []
for k in range(1, n + 1):
    m = cells == k
    if m.sum() < 200: continue
    c = max(measure.find_contours(np.pad(m, 1).astype(float), 0.5), key=len) - 1
    poly = measure.approximate_polygon(c, tolerance=2.5)
    P = [(round(X0 + q[1] / PX, 4), round(Y0 - q[0] / PX, 4)) for q in poly[:-1]]
    cy, cx = ndi.center_of_mass(m)
    out.append({'c': (round(X0 + cx / PX, 3), round(Y0 - cy / PX, 3)), 'area': round(m.sum() / PX / PX, 4), 'poly': P})
json.dump(out, open('cells.json', 'w'))
print(n, 'cells')

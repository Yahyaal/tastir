import numpy as np, math, json, sys
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage.measure import find_contours, approximate_polygon
from skimage.morphology import remove_small_holes
from shapely.geometry import Polygon
im = np.asarray(Image.open('bouinania-pattern.jpg').convert('RGB')).astype(float)
cx, cy, R = 1027.0, 1027.5, 367.0
mx = im.max(2); mn = im.min(2); sat = (mx - mn)/(mx + 1)
pieces = (mx < 75) | ((sat > 0.35) & (mx > 50))
pieces = ndi.binary_opening(pieces, iterations=2)
pieces = remove_small_holes(pieces, max_size=200)
yy, xx = np.mgrid[0:im.shape[0], 0:im.shape[1]]
inside = (np.abs(xx - cx) < 0.97*839.5) & (np.abs(yy - cy) < 0.97*839.5)
lab, n = ndi.label(pieces & inside)
hw = 21.0
polys = []
for k in range(1, n + 1):
    m = lab == k
    if m.sum() < 120: continue
    sl = ndi.find_objects(m.astype(int))[0]
    sub = np.pad(m[sl], 2)
    c = max(find_contours(sub.astype(float), 0.5), key=len)
    c = approximate_polygon(c, tolerance=1.5)
    pts = [((x + sl[1].start - 2 - cx)/R, (cy - (y + sl[0].start - 2))/R) for y, x in c]
    P = Polygon(pts)
    if not P.is_valid or P.area < 1e-4: continue
    Q = P.buffer(hw/R, join_style=2, mitre_limit=4)
    Q = Q.simplify(0.006)
    polys.append([list(p) for p in Q.exterior.coords[:-1]])
json.dump(polys, open(sys.argv[1], 'w'))
print(len(polys), 'pieces')
img = Image.new('RGB', (1000, 1000), 'white'); d = ImageDraw.Draw(img); s = 1000/4.7
for p in polys: d.polygon([(500 + x*s, 500 - y*s) for x, y in p], outline=(0, 0, 0))
img.save('/tmp/claude-1001/-home-yahya-Documents-projects-Tastir/50649b5a-b65a-41ae-9550-7d77efdce9e0/scratchpad/net.png')

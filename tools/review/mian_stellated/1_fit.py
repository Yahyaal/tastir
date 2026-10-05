"""Fits the stellated-rosette screenshot (frame 20, blue ink) with line
families in each rosette's frame (rosette circle radius 1, rosettes 2 apart)."""
import numpy as np, math, json, sys
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
blue = (im[..., 2] > 150) & (im[..., 0] < 160) & (im[..., 1] < 130)
dt = ndi.distance_transform_edt(~blue)
rho = math.tan(math.radians(37.5))
FAM = json.loads(sys.argv[2])        # [[phi, d, step], ...] in a rosette's frame
def lines(cx, cy, S):
    out = []
    for ox in range(-1, 3):
        for oy in range(-1, 3):
            for phi, d, stp in FAM:
                for k in range(int(round(360/stp))):
                    a = math.radians(phi + stp*k); out.append((math.cos(a), math.sin(a), d + math.cos(a)*2*ox + math.sin(a)*2*oy))
    return out
def score(cx, cy, S, L):
    tot = 0; n = 0
    for nx, ny, c in L:
        for u in np.linspace(-3, 3, 240):
            x = nx*c - ny*u; y = ny*c + nx*u
            if not (-1 <= x <= 3 and -1 <= y <= 3): continue
            px, py = cx + x*S, cy - y*S
            v = dt[int(round(py)), int(round(px))]; tot += (v < 2.5); n += 1
    return tot/max(n, 1)
best = None
for cx in np.arange(525, 535, 1.0):
    for cy in np.arange(552, 562, 1.0):
        for S in (168.5, 169.5, 170.5):
            pass
# centre from the image: rosette (0,0) is the lower-left rosette; find by symmetry of blue
ys, xs = np.nonzero(blue); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
S = (x1 - x0)/4; cx = x0 + S; cy = y1 - S
print('S', S, 'centre', cx, cy)
L = lines(cx, cy, S)
print('share of family lines on blue ink:', round(score(cx, cy, S, L), 3))
out = Image.fromarray(np.where(blue[..., None], [120, 120, 255], [255, 255, 255]).astype(np.uint8)); d = ImageDraw.Draw(out)
for nx, ny, c in L:
    pts = []
    for u in np.linspace(-3, 3, 600):
        x = nx*c - ny*u; y = ny*c + nx*u
        if -1 <= x <= 3 and -1 <= y <= 3: pts.append((cx + x*S, cy - y*S))
    if len(pts) > 1: d.line((pts[0], pts[-1]), fill=(255, 0, 0), width=1)
out.crop((x0 - 5, y0 - 5, x1 + 5, y1 + 5)).resize((1000, 1000)).save(sys.argv[3])
json.dump({'cx': cx, 'cy': cy, 'S': S}, open(sys.argv[3] + '.json', 'w'))

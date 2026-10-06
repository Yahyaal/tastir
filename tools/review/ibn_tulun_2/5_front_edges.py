"""Front edges of the openings. The grille is deep and seen from below-left,
so each opening shows its inner walls on its upper-left; the white edges that
face down-right are true front edges. This keeps those, folds them into one
30° wedge about the nearest star (six turns and the mirrors), and draws the
wedge (folded-edges.png) with the edges' normals binned by angle
(folded-edges.json). Run from docs/research/ibn-tulun-2/."""
import json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
im = np.asarray(Image.open('straight.png').convert('L')).astype(float)
PX = 240.0; C = 960; S3 = math.sqrt(3)
white = ndi.gaussian_filter((im > 232).astype(float), 1.2)
gy, gx = np.gradient(white); mag = np.hypot(gx, gy)
ys, xs = np.nonzero(mag > 0.12)
nx = -gx[ys, xs]/mag[ys, xs]; ny = gy[ys, xs]/mag[ys, xs]   # outward normal of the white, y up
X = (xs - C)/PX; Y = (C - ys)/PX
u = (1/math.sqrt(2), -1/math.sqrt(2))
keep = (nx*u[0] + ny*u[1] > 0.45) & (np.hypot(X, Y) < 3.2)
X, Y, nx, ny = X[keep], Y[keep], nx[keep], ny[keep]
stars = np.array([(2*i + j, S3*j) for i in range(-4, 5) for j in range(-4, 5)])
k = np.argmin((X[:, None] - stars[None, :, 0])**2 + (Y[:, None] - stars[None, :, 1])**2, 1)
rx, ry = X - stars[k, 0], Y - stars[k, 1]
th = np.arctan2(ry, rx); r = np.hypot(rx, ry)
rot = -np.floor(th / (math.pi/3)) * (math.pi/3)
c, s = np.cos(rot), np.sin(rot)
fx, fy = rx*c - ry*s, rx*s + ry*c; gnx, gny = nx*c - ny*s, nx*s + ny*c
mir = np.arctan2(fy, fx) > math.pi/6           # mirror in the 30° line
t = math.radians(60)
fx2 = np.where(mir, fx*math.cos(t) + fy*math.sin(t), fx); fy2 = np.where(mir, fx*math.sin(t) - fy*math.cos(t), fy)
nx2 = np.where(mir, gnx*math.cos(t) + gny*math.sin(t), gnx); ny2 = np.where(mir, gnx*math.sin(t) - gny*math.cos(t), gny)
N = 900; S = N/1.25
img = Image.new('RGB', (N, int(N*0.75)), 'white'); d = ImageDraw.Draw(img)
for xx, yy in zip(fx2, fy2):
    d.point((xx*S, img.height - yy*S), fill=(0, 0, 0))
d.line((0, img.height, N, img.height - N*math.tan(math.pi/6)), fill=(255, 0, 0))
for rr in (0.5, 1.0):
    d.arc((-rr*S, img.height - rr*S, rr*S, img.height + rr*S), 270, 360, fill=(0, 160, 0))
img.save('folded-edges.png')
json.dump([[float(a), float(b), float(c2), float(d2)] for a, b, c2, d2 in zip(fx2, fy2, nx2, ny2)], open('folded-edges.json', 'w'))
print(len(fx2), 'edge pixels folded')

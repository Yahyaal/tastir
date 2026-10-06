"""The frontal part of the grille (near the camera's axis, where the openings
show little of their inner walls), straightened in the photo's own orientation:
tutorial frame with a star at O and its neighbours at 30°, 90°, 150°… two
units away, so the rhombi sit at the midpoints straight above and below each
star. Draws a triangular grid of side 1/n over it.
Usage: 6_frontal.py n out.png  (from docs/research/ibn-tulun-2/)"""
import math, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
n = int(sys.argv[1]); out = sys.argv[2]
rgb = np.asarray(Image.open('w0.jpg').convert('RGB')).astype(float)
Hm = np.load('homography.npy'); Hi = np.linalg.inv(Hm)
p = Hi @ [1493, 1137, 1]; ox, oy = p[0]/p[2], p[1]/p[2]          # the frontal star, photo-frame units
S3 = math.sqrt(3)
v = round(oy/S3); u = round((ox + v)/2); ox, oy = 2*u - v, S3*v      # snapped to the fitted lattice
print('frontal star at lattice', (u, v), (ox, oy))
c30, s30 = math.cos(math.radians(30)), math.sin(math.radians(30))
def to_old(x, y):  # tutorial -> 1_rectify frame: scale 2, turn by +30°, shift to the star
    return ox + 2*(x*c30 - y*s30), oy + 2*(x*s30 + y*c30)
PX = 300; R = 1.6
g = np.arange(-R, R, 1/PX); X, Y = np.meshgrid(g, -g)
U, V = to_old(X, Y)
q = Hm @ np.vstack([U.ravel(), V.ravel(), np.ones(U.size)]); x = (q[0]/q[2]).reshape(X.shape); y = (q[1]/q[2]).reshape(X.shape)
img = Image.fromarray(np.stack([ndi.map_coordinates(rgb[:, :, k], [y, x], order=1) for k in range(3)], 2).clip(0, 255).astype(np.uint8))
img.save('frontal.png')
d = ImageDraw.Draw(img); W = img.width
h = math.sqrt(3)/2/n
for ang in (0, 60, 120):
    t = math.radians(ang); nv = (-math.sin(t), math.cos(t)); dv = (math.cos(t), math.sin(t))
    for k in range(-40, 41):
        off = k*h; p0 = (nv[0]*off, nv[1]*off)
        a = (p0[0] - 4*dv[0], p0[1] - 4*dv[1]); b = (p0[0] + 4*dv[0], p0[1] + 4*dv[1])
        col = (0, 90, 255) if k % n == 0 else (255, 0, 200)
        d.line((W/2 + a[0]*PX, W/2 - a[1]*PX, W/2 + b[0]*PX, W/2 - b[1]*PX), fill=col, width=1)
img.save(out)

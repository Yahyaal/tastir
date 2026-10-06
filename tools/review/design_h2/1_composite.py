"""Design H2, the Met minbar doors (91.1.2064): one sharp tile in the tutorial
frame (rosette at O, neighbours 2 apart, the 0° axis horizontal), averaged over
the two whole rosettes of the photo with six-fold symmetry and mirrors.
Run from docs/research/design-h2/; writes tile-composite.png (±1.3 units)."""
import math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('met-qawsun-doors.jpg').convert('L')).astype(float); H, W = im.shape
C = [(1262.0, 1230.0), (1275.0, 2691.0)]
vx, vy = C[1][0] - C[0][0], C[1][1] - C[0][1]
L = math.hypot(vx, vy); unit = L / (2 * math.sqrt(3))       # OA in pixels
tilt = math.atan2(vx, vy)                                     # photo's vertical vs ours
X0, X1, Y0, Y1 = 850, 1698, 505, 3505                         # inside the panel's frame
N = 1000; R = 1.3
g = np.linspace(-R, R, N); X, Y = np.meshgrid(g, -g)
acc = np.zeros((N, N)); cnt = np.zeros((N, N))
for cx, cy in C:
    for k in range(6):
        for m in (1, -1):
            a = k * math.pi / 3
            xr = X * math.cos(a) - m * Y * math.sin(a); yr = X * math.sin(a) + m * Y * math.cos(a)
            # tutorial (x right, y up) -> photo (x right, y down), turned by the tilt
            px = cx + unit * (xr * math.cos(tilt) + yr * math.sin(tilt))
            py = cy + unit * (xr * math.sin(tilt) - yr * math.cos(tilt))
            ok = (px > X0) & (px < X1) & (py > Y0) & (py < Y1)
            v = ndi.map_coordinates(im, [py, px], order=1)
            acc += v * ok; cnt += ok
img = acc / np.maximum(cnt, 1)
print('OA =', round(unit, 1), 'px; tilt', round(math.degrees(tilt), 2), '°; min samples', cnt.min())
Image.fromarray(img.clip(0, 255).astype(np.uint8)).save('tile-composite.png')

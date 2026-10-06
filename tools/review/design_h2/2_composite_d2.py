"""The doors' tile with only the mirrors the panel has (left-right and
up-down through each rosette), averaged over the panel's two whole rosettes: tile-d2.png, x in ±1.3 and y in ±2.0 units (OA = half the rosette
spacing), 300 px per unit. Run from docs/research/design-h2/."""
import math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('met-qawsun-doors.jpg').convert('L')).astype(float)
C0, C1 = (1262.0, 1230.0), (1275.0, 2691.0)
vx, vy = C1[0] - C0[0], C1[1] - C0[1]
unit = math.hypot(vx, vy) / (2 * math.sqrt(3)); tilt = math.atan2(vx, vy)
X0, X1, Y0, Y1 = 850, 1698, 505, 3505
S3 = math.sqrt(3)
# Only the two whole rosettes: the outer positions do not register, since the
# two door leaves are slightly offset from each other.
centres = [(0, 0), (0, -2 * S3)]
PX = 300; XR, YR = 1.3, 2.0
xs = np.arange(-XR, XR, 1 / PX); ys = np.arange(YR, -YR, -1 / PX)
X, Y = np.meshgrid(xs, ys)
acc = np.zeros(X.shape); cnt = np.zeros(X.shape)
for (u, v) in centres:
    for mx in (1, -1):
        for my in (1, -1):
            x = u + mx * X; y = v + my * Y
            px = C0[0] + unit * (x * math.cos(tilt) + y * math.sin(tilt))
            py = C0[1] + unit * (x * math.sin(tilt) - y * math.cos(tilt))
            ok = (px > X0) & (px < X1) & (py > Y0) & (py < Y1)
            acc += ndi.map_coordinates(im, [py, px], order=1) * ok; cnt += ok
print('min samples', cnt.min(), 'max', cnt.max())
Image.fromarray((acc / np.maximum(cnt, 1)).clip(0, 255).astype(np.uint8)).save('tile-d2.png')

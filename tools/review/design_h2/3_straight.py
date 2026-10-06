"""The doors' panel straightened into the tutorial frame (O = upper rosette,
OA = half the rosette spacing, y up), unaveraged: straight.png, x in ±1.3,
y from -4.4 to 1.9, PX px per unit. Run from docs/research/design-h2/."""
import math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('met-qawsun-doors.jpg').convert('RGB')).astype(float)
C0, C1 = (1262.0, 1230.0), (1275.0, 2691.0)
vx, vy = C1[0] - C0[0], C1[1] - C0[1]
unit = math.hypot(vx, vy) / (2 * math.sqrt(3)); tilt = math.atan2(vx, vy)
PX = 300
xs = np.arange(-1.3, 1.3, 1 / PX); ys = np.arange(1.9, -4.4, -1 / PX)
X, Y = np.meshgrid(xs, ys)
px = C0[0] + unit * (X * math.cos(tilt) + Y * math.sin(tilt))
py = C0[1] + unit * (X * math.sin(tilt) - Y * math.cos(tilt))
out = np.stack([ndi.map_coordinates(im[:, :, k], [py, px], order=1) for k in range(3)], 2)
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save('straight.png')

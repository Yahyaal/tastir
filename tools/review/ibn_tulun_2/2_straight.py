"""The grille straightened into the frame of the fine lattice (neighbouring
star or cube centres 2 apart): straight.png, x and y in ±W units around the
seed star, PX px per unit. Run from docs/research/ibn-tulun-2/."""
import math, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
rgb = np.asarray(Image.open('w0.jpg').convert('RGB')).astype(float)
Hm = np.load('homography.npy'); PX = 120; W = 8.0
g = np.arange(-W, W, 1/PX); X, Y = np.meshgrid(g, -g)
p = Hm @ np.vstack([X.ravel(), Y.ravel(), np.ones(X.size)]); x = (p[0]/p[2]).reshape(X.shape); y = (p[1]/p[2]).reshape(X.shape)
out = np.stack([ndi.map_coordinates(rgb[:, :, k], [y, x], order=1, cval=0) for k in range(3)], 2)
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save('straight.png')

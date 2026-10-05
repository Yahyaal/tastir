import numpy as np
from PIL import Image
imc = np.asarray(Image.open('maridani-detail.jpg').convert('RGB')).astype(float); H, W, _ = imc.shape
Hm = np.load('homography.npy')
def proj(u, v):
    p = Hm @ np.vstack([u, v, np.ones_like(u)]); return p[0]/p[2], p[1]/p[2]
N = 800
u = np.linspace(-0.5, 2.5, N); v = np.linspace(1.5, -1.5, N); U, V = np.meshgrid(u, v)
x, y = proj(U.ravel(), V.ravel())
x = np.clip(x, 0, W-1).astype(int); y = np.clip(y, 0, H-1).astype(int)
Image.fromarray(imc[y, x].reshape(N, N, 3).astype(np.uint8)).save('rectified.png')

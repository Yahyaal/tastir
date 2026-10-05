import numpy as np, math, json
from PIL import Image
imc = np.asarray(Image.open('maridani-detail.jpg').convert('L')).astype(float); H, W = imc.shape
Hm = np.load('homography.npy')
def proj(u, v):
    p = Hm @ np.vstack([u, v, np.ones_like(u)]); return p[0]/p[2], p[1]/p[2]
def samp(x, y):
    x = np.clip(x, 0, W-2); y = np.clip(y, 0, H-2); xi = x.astype(int); yi = y.astype(int); fx = x-xi; fy = y-yi
    return imc[yi,xi]*(1-fx)*(1-fy)+imc[yi,xi+1]*fx*(1-fy)+imc[yi+1,xi]*(1-fx)*fy+imc[yi+1,xi+1]*fx*fy
import sys
par = int(sys.argv[1])
cents = [c for c in [(0,1),(0,0),(1,0),(0,-1),(1,-1),(2,-1),(-1,0),(-1,-1),(-1,1),(1,1),(2,0),(-1,-2),(0,-2),(1,-2)] if (c[0]+c[1]) % 2 == par]
N = 700; R = 1.0
g = np.linspace(-R, R, N); GX, GY = np.meshgrid(g, -g)
acc = np.zeros((N, N)); cnt = np.zeros((N, N))
for (u, v) in cents:
    for k in range(4):
        for m in (1, -1):
            a = k*math.pi/2; X = GX*math.cos(a) - m*GY*math.sin(a); Y = GX*math.sin(a) + m*GY*math.cos(a)
            U = u + X; V = v + Y
            x, y = proj(U.ravel(), V.ravel()); x = x.reshape(N, N); y = y.reshape(N, N)
            ok = (U + V < 2.15) & (U > -0.95) & (V > -1.45) & (x > 2) & (x < W-3) & (y > 2) & (y < H-3)
            acc += samp(x, y)*ok; cnt += ok
img = acc/np.maximum(cnt, 1)
print('min samples in view', cnt.min())
Image.fromarray(img.clip(0,255).astype(np.uint8)).save(f'avg-class{par}.png')

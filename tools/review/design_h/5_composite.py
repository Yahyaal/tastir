import numpy as np, math
from PIL import Image
imc = np.asarray(Image.open('maridani-detail.jpg').convert('L')).astype(float); H, W = imc.shape
Hm = np.load('homography.npy')
def proj(u, v):
    p = Hm @ np.vstack([u, v, np.ones_like(u)]); return p[0]/p[2], p[1]/p[2]
def samp(x, y):
    x = np.clip(x, 0, W-2); y = np.clip(y, 0, H-2); xi = x.astype(int); yi = y.astype(int); fx = x-xi; fy = y-yi
    return imc[yi,xi]*(1-fx)*(1-fy)+imc[yi,xi+1]*fx*(1-fy)+imc[yi+1,xi]*(1-fx)*fy+imc[yi+1,xi+1]*fx*fy
stars = [(0,0),(1,-1),(-1,-1),(0,-2),(1,1),(-1,1),(2,0),(2,-2),(1,-3),(-1,-3)]
N = 1000; R = 1.2
g = np.linspace(-R, R, N); X, Y = np.meshgrid(g, -g)
def avg(group):
    acc = np.zeros((N, N)); cnt = np.zeros((N, N))
    for (u0, v0) in stars:
        for (a, m) in group:
            xr = X*math.cos(a) - m*Y*math.sin(a); yr = X*math.sin(a) + m*Y*math.cos(a)
            U = u0 + (xr - yr)/2; V = v0 + (xr + yr)/2
            x, y = proj(U.ravel(), V.ravel()); x = x.reshape(N, N); y = y.reshape(N, N)
            ok = (U + V < 2.15) & (U > -0.95) & (V > -2.3) & (x > 2) & (x < W-3) & (y > 2) & (y < H-3)
            acc += samp(x, y)*ok; cnt += ok
    return acc/np.maximum(cnt, 1), cnt
D4 = [(k*math.pi/2, m) for k in range(4) for m in (1, -1)]
D12 = [(k*math.pi/6, m) for k in range(12) for m in (1, -1)]
a4, c4 = avg(D4); a12, _ = avg(D12)
r = np.hypot(X, Y); w = np.clip((0.80 - r)/0.05, 0, 1)
img = a12*w + a4*(1 - w)
print('min samples', c4.min())
Image.fromarray(img.clip(0,255).astype(np.uint8)).save('tile-composite.png')

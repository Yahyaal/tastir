import numpy as np, math, json
from PIL import Image
im = np.asarray(Image.open('maridani-detail.jpg').convert('L')).astype(float); H, W = im.shape
x0, y0, sc = 0.23*1920, 0.07*1655, 1.248
disp = {'A': (240, 420, 0, 1), 'B': (240, 635, 0, 0), 'C': (450, 640, 1, 0), 'D': (240, 860, 0, -1), 'E': (450, 860, 1, -1), 'F': (660, 860, 2, -1)}
def samp(x, y):
    x = np.clip(x, 0, W-2); y = np.clip(y, 0, H-2); xi = x.astype(int); yi = y.astype(int); fx = x-xi; fy = y-yi
    return im[yi,xi]*(1-fx)*(1-fy)+im[yi,xi+1]*fx*(1-fy)+im[yi+1,xi]*(1-fx)*fy+im[yi+1,xi+1]*fx*fy
rng = np.random.default_rng(0); R = 110
r = np.sqrt(rng.uniform(0, R*R, 4000)); t = rng.uniform(0, 2*math.pi, 4000)
def score(cx, cy):
    b = samp(cx + r*np.cos(t), cy + r*np.sin(t)); s = 0
    for k in (1, 2, 3, 4, 6):
        a = t + k*math.pi/6; s += np.abs(b - samp(cx + r*np.cos(a), cy + r*np.sin(a))).mean()
    return s
cents = {}
for n, (dx, dy, u, v) in disp.items():
    cx, cy = x0 + dx*sc, y0 + dy*sc; best = (score(cx, cy), cx, cy)
    for st in (8, 4, 2, 1, 0.5):
        for _ in range(3):
            _, bx, by = best
            for ex in (-st, 0, st):
                for ey in (-st, 0, st):
                    s = score(bx+ex, by+ey)
                    if s < best[0]: best = (s, bx+ex, by+ey)
    cents[n] = (best[1], best[2], u, v); print(n, [round(x, 1) for x in best])
def fit_h(src, dst):
    A = []
    for (u, v), (x, y) in zip(src, dst):
        A.append([u,v,1,0,0,0,-x*u,-x*v,-x]); A.append([0,0,0,u,v,1,-y*u,-y*v,-y])
    return np.linalg.svd(np.array(A))[2][-1].reshape(3,3)
Hm = fit_h([(c[2], c[3]) for c in cents.values()], [(c[0], c[1]) for c in cents.values()])
def proj(u, v):
    p = Hm @ np.vstack([u, v, np.ones_like(u)]); return p[0]/p[2], p[1]/p[2]
xs, ys = proj(np.array([c[2] for c in cents.values()], float), np.array([c[3] for c in cents.values()], float))
print('residual px', np.round(np.hypot(xs - [c[0] for c in cents.values()], ys - [c[1] for c in cents.values()]), 1))
np.save('homography.npy', Hm); json.dump(cents, open('centres.json', 'w'))
imc = np.asarray(Image.open('maridani-detail.jpg').convert('RGB')).astype(float)
def sampc(x, y):
    x = np.clip(x, 0, W-2); y = np.clip(y, 0, H-2); xi = x.astype(int); yi = y.astype(int); fx = (x-xi)[..., None]; fy = (y-yi)[..., None]
    return imc[yi,xi]*(1-fx)*(1-fy)+imc[yi,xi+1]*fx*(1-fy)+imc[yi+1,xi]*(1-fx)*fy+imc[yi+1,xi+1]*fx*fy
# D12 average of the six rosettes, and D4 average of the square cell (corners = rosettes, so centre of 4 rosettes at (.5,.5))
N = 900; Rr = 0.6
g = np.linspace(-Rr, Rr, N); GX, GY = np.meshgrid(g, -g)
acc = np.zeros((N, N, 3))
for (cx, cy, u, v) in cents.values():
    for k in range(12):
        for m in (1, -1):
            a = k*math.pi/6; X = GX*math.cos(a) - m*GY*math.sin(a); Y = GX*math.sin(a) + m*GY*math.cos(a)
            x, y = proj((u + X).ravel(), (v + Y).ravel()); acc += sampc(x, y).reshape(N, N, 3)
Image.fromarray((acc/acc.max()*255).astype(np.uint8)).save('avg12.png')
# whole tile with D4 about rosette, using all rosettes as centres
N2 = 1000; R2 = 1.0
g = np.linspace(-R2, R2, N2); GX, GY = np.meshgrid(g, -g)
acc = np.zeros((N2, N2, 3)); cnt = np.zeros((N2, N2, 1))
for (cx, cy, u, v) in cents.values():
    for k in range(4):
        for m in (1, -1):
            a = k*math.pi/2; X = GX*math.cos(a) - m*GY*math.sin(a); Y = GX*math.sin(a) + m*GY*math.cos(a)
            x, y = proj((u + X).ravel(), (v + Y).ravel())
            ok = ((x > 5) & (x < W-5) & (y > 5) & (y < H-5)).reshape(N2, N2, 1)
            # mask the stair and railing: keep only below the diagonal edge of the panel (estimated)
            acc += sampc(x, y).reshape(N2, N2, 3)*ok; cnt += ok
Image.fromarray((acc/np.maximum(cnt, 1)).astype(np.uint8)).save('avg4.png')

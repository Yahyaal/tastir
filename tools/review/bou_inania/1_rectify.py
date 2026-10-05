import numpy as np, math, json
from PIL import Image
im = np.asarray(Image.open('../sixteen-fold-rosette/photo-bou-inania.jpg').convert('RGB')).astype(float)
H, W, _ = im.shape
c = json.load(open('centres-fine.json'))
pts = np.array([[p[1], p[2]] for p in c], float)
# lattice indices
idx = np.array([[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[-1,0],[3,0]], float)
# homography fit (DLT)
def fit_h(src, dst):
    A = []
    for (u,v),(x,y) in zip(src,dst):
        A.append([u,v,1,0,0,0,-x*u,-x*v,-x]); A.append([0,0,0,u,v,1,-y*u,-y*v,-y])
    _,_,Vt = np.linalg.svd(np.array(A)); return Vt[-1].reshape(3,3)
Hm = fit_h(idx, pts)
def proj(u, v):
    p = Hm @ np.vstack([u, v, np.ones_like(u)]); return p[0]/p[2], p[1]/p[2]
x,y = proj(idx[:,0], idx[:,1]); print('residual px', np.round(np.hypot(x-pts[:,0], y-pts[:,1]),1))
np.save('homography.npy', Hm)
def sample(x, y):
    x = np.clip(x, 0, W-2); y = np.clip(y, 0, H-2); x0 = x.astype(int); y0 = y.astype(int); fx = (x-x0)[...,None]; fy=(y-y0)[...,None]
    return (im[y0,x0]*(1-fx)*(1-fy)+im[y0,x0+1]*fx*(1-fy)+im[y0+1,x0]*(1-fx)*fy+im[y0+1,x0+1]*fx*fy)
# rectified image of the lattice region (y up in lattice = row index down in photo: v increases upward in photo since row y=380 is v=1)
S = 300
us = np.linspace(-1.5, 3.5, int(5*S)); vs = np.linspace(1.6, -0.6, int(2.2*S))
U, V = np.meshgrid(us, vs); x, y = proj(U.ravel(), V.ravel())
rect = sample(x, y).reshape(len(vs), len(us), 3)
Image.fromarray(rect.astype(np.uint8)).save('rectified.png')
# symmetric average: fold 16 rotations + mirror over the 8 rosettes, in lattice units
N = 600; R = 0.75
g = np.linspace(-R, R, N); GX, GY = np.meshgrid(g, -g)
acc = np.zeros((N, N, 3)); n = 0
for (u0, v0) in idx:
    for k in range(16):
        a = k*math.pi/8
        for m in (1, -1):
            X = GX*math.cos(a) - m*GY*math.sin(a); Y = GX*math.sin(a) + m*GY*math.cos(a)
            x, y = proj((u0+X).ravel(), (v0+Y).ravel())
            acc += sample(x, y).reshape(N, N, 3); n += 1
Image.fromarray((acc/n).astype(np.uint8)).save('sym-average.png')
# 4-fold only (keep the corner clusters), averaging rosettes only
acc = np.zeros((N, N, 3)); n = 0
for (u0, v0) in idx:
    for k in range(4):
        a = k*math.pi/2
        for m in (1, -1):
            X = GX*math.cos(a) - m*GY*math.sin(a); Y = GX*math.sin(a) + m*GY*math.cos(a)
            x, y = proj((u0+X).ravel(), (v0+Y).ravel())
            acc += sample(x, y).reshape(N, N, 3); n += 1
Image.fromarray((acc/n).astype(np.uint8)).save('sym4-average.png')

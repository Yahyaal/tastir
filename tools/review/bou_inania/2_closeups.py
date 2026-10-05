import numpy as np, math, json
from PIL import Image, ImageDraw
im = np.asarray(Image.open('../sixteen-fold-rosette/photo-bou-inania.jpg').convert('RGB')).astype(float)
H, W, _ = im.shape
Hm = np.load('homography.npy')
def proj(u, v):
    p = Hm @ np.vstack([u, v, np.ones_like(u)]); return p[0]/p[2], p[1]/p[2]
def sample(x, y):
    x = np.clip(x, 0, W-2); y = np.clip(y, 0, H-2); x0 = x.astype(int); y0 = y.astype(int); fx = (x-x0)[...,None]; fy=(y-y0)[...,None]
    return (im[y0,x0]*(1-fx)*(1-fy)+im[y0,x0+1]*fx*(1-fy)+im[y0+1,x0]*(1-fx)*fy+im[y0+1,x0+1]*fx*fy)
S = 300
res = json.load(open('rect-centres2.json'))
for (u, v, bx, by, ro) in res:
    # rect px -> lattice: u = bx/S - 1.5, v = 1.6 - by/S
    cu, cv = bx/S - 1.5, 1.6 - by/S
    N = 1000; R = 0.75
    g = np.linspace(-R, R, N); U, V = np.meshgrid(g, -g)
    x, y = proj((cu+U).ravel(), (cv+V).ravel())
    out = Image.fromarray(sample(x, y).reshape(N, N, 3).astype(np.uint8))
    out.save(f'hires-{u}-{v}.png')
    print(u, v, round(cu, 4), round(cv, 4))

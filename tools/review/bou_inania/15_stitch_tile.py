import numpy as np, math
from PIL import Image
def load(n): return np.asarray(Image.open(n).convert('RGB')).astype(float)
A12 = load('avg12.png'); R12 = 0.55
AC = load('corner-avg.png'); RC = 0.24
AE = load('edgeV-avg.png'); RE = 0.24
A4 = load('avg4.png'); R4 = 0.6
def samp(A, R, x, y):
    N = A.shape[0]; S = N/(2*R); px = N/2 + x*S; py = N/2 - y*S
    ok = (px >= 0) & (px < N-1) & (py >= 0) & (py < N-1)
    px = np.clip(px, 0, N-2); py = np.clip(py, 0, N-2); x0 = px.astype(int); y0 = py.astype(int); fx = (px-x0)[..., None]; fy = (py-y0)[..., None]
    return A[y0,x0]*(1-fx)*(1-fy)+A[y0,x0+1]*fx*(1-fy)+A[y0+1,x0]*(1-fx)*fy+A[y0+1,x0+1]*fx*fy, ok
M = 1200; H = 0.6
g = np.linspace(-H, H, M); X, Y = np.meshgrid(g, -g)
# fold into the 45° wedge of the tile (x >= y >= 0 after reflecting), keeping D4
fx = np.abs(X); fy = np.abs(Y)
# position relative to nearest lattice point: tile is periodic with period 1
def smooth(d, r0, r1): return np.clip((r1 - d)/(r1 - r0), 0, 1)
out = np.zeros((M, M, 3)); wsum = np.zeros((M, M, 1))
# rosette at nearest lattice point
for (cx, cy) in [(0,0),(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1)]:
    dx = X - cx; dy = Y - cy; d = np.hypot(dx, dy)
    w = smooth(d, 0.44, 0.48)[..., None]
    c, ok = samp(A12, R12, dx, dy); w = w*ok[..., None]
    out += c*w; wsum += w
for (cx, cy) in [(0.5,0.5),(-0.5,0.5),(0.5,-0.5),(-0.5,-0.5)]:
    dx = X - cx; dy = Y - cy; d = np.maximum(np.abs(dx), np.abs(dy))
    w = (smooth(d, 0.2, 0.23)*(np.hypot(X, Y) > 0.47))[..., None]
    c, ok = samp(AC, RC, dx, dy); w = w*ok[..., None]*(1 - np.minimum(wsum, 1))
    out += c*w; wsum += w
for (cx, cy, rot) in [(0.5,0,0),(-0.5,0,0),(0,0.5,1),(0,-0.5,1)]:
    dx = X - cx; dy = Y - cy
    if rot: dx, dy = dy, -dx
    d = np.maximum(np.abs(dx), np.abs(dy))
    w = smooth(d, 0.2, 0.23)[..., None]
    c, ok = samp(AE, RE, dx, dy); w = w*ok[..., None]*(1 - np.minimum(wsum, 1))
    out += c*w; wsum += w
c, ok = samp(A4, R4, X, Y); w = (1 - np.minimum(wsum, 1))*ok[..., None]
out += c*w; wsum += w
img = (out/np.maximum(wsum, 1e-6)).clip(0, 255).astype(np.uint8)
Image.fromarray(img).save('tile-composite.png'); print('ok')

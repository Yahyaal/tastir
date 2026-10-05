import numpy as np, math, json
from PIL import Image
cs = json.load(open('hires-centres.json'))
names = ['hires-0-0', 'hires-2-0', 'hires-0-1', 'hires-1-1', 'hires-2-1']
def load(n):
    img = np.asarray(Image.open(n + '.png').convert('RGB')).astype(float)
    return img
def samp(A, x, y):
    N = A.shape[0]; x = np.clip(x, 0, N-2); y = np.clip(y, 0, N-2); x0 = x.astype(int); y0 = y.astype(int); fx = x-x0; fy = y-y0
    if A.ndim == 3: fx = fx[..., None]; fy = fy[..., None]
    return A[y0,x0]*(1-fx)*(1-fy)+A[y0,x0+1]*fx*(1-fy)+A[y0+1,x0]*(1-fx)*fy+A[y0+1,x0+1]*fx*fy
rng = np.random.default_rng(3); r = np.sqrt(rng.uniform(0, 0.45**2, 6000)); t = rng.uniform(0, 2*math.pi, 6000)
fit = {}
for n in names:
    img = load(n); G = img.mean(2); N = G.shape[0]; S = N/1.5
    cx, cy, _ = cs[n]
    def sc(cx, cy, rot):
        X = N/2 + (cx + r*np.cos(t))*S; Y = N/2 - (cy + r*np.sin(t))*S
        b = samp(G, X, Y); s = 0
        for k in (1, 2, 3, 4, 6):
            a = t + k*math.pi/6; s += np.abs(b - samp(G, N/2 + (cx + r*np.cos(a))*S, N/2 - (cy + r*np.sin(a))*S)).mean()
        a = 2*rot - t; s += 2*np.abs(b - samp(G, N/2 + (cx + r*np.cos(a))*S, N/2 - (cy + r*np.sin(a))*S)).mean()
        return s
    best = None
    for r0 in (0, 7.5):
        b = (sc(cx, cy, math.radians(r0)), cx, cy, math.radians(r0))
        for st in (0.01, 0.005, 0.0025, 0.0012, 0.0006):
            for _ in range(3):
                _, x0, y0, ro = b
                for dx in (-st, 0, st):
                    for dy in (-st, 0, st):
                        for dr in (-st*0.5, 0, st*0.5):
                            s = sc(x0+dx, y0+dy, ro+dr)
                            if s < b[0]: b = (s, x0+dx, y0+dy, ro+dr)
        if best is None or b[0] < best[0]: best = b
    fit[n] = best[1:]
    print(n, round(best[0],1), [round(v,4) for v in best[1:3]], 'mirror deg', round(math.degrees(best[3]),2))
json.dump(fit, open('fit12.json','w'))
# folded average image, 12-fold + mirror, per rosette then summed
M = 900; R = 0.55
g = np.linspace(-R, R, M); GX, GY = np.meshgrid(g, -g)
acc = np.zeros((M, M, 3)); n_ = 0
for n in names:
    img = load(n); N = img.shape[0]; S = N/1.5; cx, cy, ro = fit[n]
    for k in range(12):
        for m in (1, -1):
            a = k*math.pi/6
            X0 = GX*math.cos(a) - m*GY*math.sin(a); Y0 = GX*math.sin(a) + m*GY*math.cos(a)
            X = X0*math.cos(ro) - Y0*math.sin(ro); Y = X0*math.sin(ro) + Y0*math.cos(ro)
            acc += samp(img, N/2 + (cx + X)*S, N/2 - (cy + Y)*S); n_ += 1
Image.fromarray((acc/n_).astype(np.uint8)).save('avg12.png')

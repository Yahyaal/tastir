import numpy as np, math, json
from PIL import Image
fit = json.load(open('fit12.json'))
def samp(A, x, y):
    N = A.shape[0]; ok = (x > 0) & (x < N-2) & (y > 0) & (y < N-2)
    x = np.clip(x, 0, N-2); y = np.clip(y, 0, N-2); x0 = x.astype(int); y0 = y.astype(int); fx = (x-x0)[..., None]; fy = (y-y0)[..., None]
    return A[y0,x0]*(1-fx)*(1-fy)+A[y0,x0+1]*fx*(1-fy)+A[y0+1,x0]*(1-fx)*fy+A[y0+1,x0+1]*fx*fy, ok
imgs = {n: np.asarray(Image.open(n + '.png').convert('RGB')).astype(float) for n in fit}
rng = np.random.default_rng(0)
def run(offsets, sym, R, out, M=700):
    rs = np.sqrt(rng.uniform(0, (0.8*R)**2, 3000)); ts = rng.uniform(0, 2*math.pi, 3000)
    g = np.linspace(-R, R, M); GX, GY = np.meshgrid(g, -g)
    acc = np.zeros((M, M, 3)); cnt = np.zeros((M, M, 1)); n = 0
    for name, (cx, cy, ro) in fit.items():
        A = imgs[name]; N = A.shape[0]; S = N/1.5; G = A.mean(2)
        P = lambda u, v: (N/2 + (cx + u)*S, N/2 - (cy + v)*S)
        for (u0, v0) in offsets:
            def score(u, v):
                a, ok = samp(G, *P(u + rs*np.cos(ts), v + rs*np.sin(ts)))
                s = 0
                for ang, m in sym[1:]:
                    b, ok2 = samp(G, *P(u + rs*np.cos(m*ts + ang), v + rs*np.sin(m*ts + ang)))
                    k = ok & ok2
                    if k.sum() < 500: return 1e9
                    s += np.abs(a - b)[k].mean()
                return s
            best = (score(u0, v0), u0, v0)
            if best[0] > 1e8: continue
            for st in (0.008, 0.003):
                for _ in range(2):
                    _, bu, bv = best
                    for du in (-st, 0, st):
                        for dv in (-st, 0, st):
                            s = score(bu+du, bv+dv)
                            if s < best[0]: best = (s, bu+du, bv+dv)
            _, bu, bv = best; n += 1
            for ang, m in sym:
                X = GX*math.cos(ang) - m*GY*math.sin(ang); Y = GX*math.sin(ang) + m*GY*math.cos(ang)
                s, ok = samp(A, *P(bu + X, bv + Y)); acc += s*ok[..., None]; cnt += ok[..., None]
            print(out, name, (u0, v0), 'refined', round(bu, 3), round(bv, 3), flush=True)
    Image.fromarray((acc/np.maximum(cnt, 1)).astype(np.uint8)).save(out)
D4 = [(k*math.pi/2, m) for k in range(4) for m in (1, -1)]
run([(0.5, 0.5), (-0.5, 0.5), (0.5, -0.5), (-0.5, -0.5)], D4, 0.24, 'corner-avg.png')
# edges: x = ±0.5 (vertical band) and y = ±0.5 (rotate into vertical frame)
D2 = [(0, 1), (math.pi, 1), (0, -1), (math.pi, -1)]
D2r = [(math.pi/2, 1), (-math.pi/2, 1), (math.pi/2, -1), (-math.pi/2, -1)]
run([(0.5, 0), (-0.5, 0)], D2, 0.24, 'edgeV-avg.png')
run([(0, 0.5), (0, -0.5)], D2r, 0.24, 'edgeH-avg.png')

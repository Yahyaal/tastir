import numpy as np, math, json
from PIL import Image
out = {}
for name in ('hires-1-0', 'hires-0-0', 'hires-2-0', 'hires-0-1', 'hires-1-1', 'hires-2-1'):
    img = np.asarray(Image.open(name + '.png').convert('L')).astype(float); N = img.shape[0]; R = 0.75; S = N/(2*R)
    def samp(x, y):
        x = np.clip(x, 0, N-2); y = np.clip(y, 0, N-2); x0 = x.astype(int); y0 = y.astype(int); fx = x-x0; fy = y-y0
        return img[y0,x0]*(1-fx)*(1-fy)+img[y0,x0+1]*fx*(1-fy)+img[y0+1,x0]*(1-fx)*fy+img[y0+1,x0+1]*fx*fy
    rng = np.random.default_rng(2); r = np.sqrt(rng.uniform(0, 0.45**2, 5000))*S; t = rng.uniform(0, 2*math.pi, 5000)
    def sc(cx, cy, rot):
        b = samp(cx + r*np.cos(t), cy - r*np.sin(t)); s = 0
        for k in (1, 2, 3, 4, 8):
            a = t + k*math.pi/8; s += np.abs(b - samp(cx + r*np.cos(a), cy - r*np.sin(a))).mean()
        a = 2*rot - t; s += 2*np.abs(b - samp(cx + r*np.cos(a), cy - r*np.sin(a))).mean()
        return s
    best = None
    for rot0 in (0.0, 11.25):
        b = (sc(N/2, N/2, math.radians(rot0)), N/2, N/2, math.radians(rot0))
        for st in (40, 20, 10, 5, 2.5, 1.2, 0.6):
            for _ in range(3):
                _, x0, y0, ro = b
                for dx in (-st, 0, st):
                    for dy in (-st, 0, st):
                        for dr in (-st*0.0015, 0, st*0.0015):
                            s = sc(x0+dx, y0+dy, ro+dr)
                            if s < b[0]: b = (s, x0+dx, y0+dy, ro+dr)
        print(name, rot0, round(b[0],1), round((b[1]-N/2)/S,4), round((N/2-b[2])/S,4), round(math.degrees(b[3]),2))
        if best is None or b[0] < best[0]: best = b
    out[name] = [(best[1]-N/2)/S, (N/2-best[2])/S, math.degrees(best[3])]
json.dump(out, open('hires-centres.json','w'))

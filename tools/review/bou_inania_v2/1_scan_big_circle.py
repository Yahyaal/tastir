import numpy as np, math
from PIL import Image
im = np.asarray(Image.open('bouinania-pattern.jpg').convert('RGB')).astype(float)
band = im.min(2) > 140
cx, cy, R = 1024.5, 1011.5, 420.0
rho = math.tan(math.radians(37.5)); dstar = rho*math.cos(math.radians(75)); ap = math.cos(math.radians(15))
def cover(fams, rlo=1.0, rhi=1.75):
    tot = hit = 0
    for nd, dist in fams:
        a = math.radians(nd); n = (math.cos(a), math.sin(a)); t = (-n[1], n[0])
        for u in np.linspace(-2.2, 2.2, 900):
            x = n[0]*dist + t[0]*u; y = n[1]*dist + t[1]*u
            r = math.hypot(x, y)
            if not (rlo < r < rhi) or max(abs(x), abs(y)) > 1.5: continue
            px, py = int(round(cx + x*R)), int(round(cy - y*R)); tot += 1; hit += band[py, px]
    return hit/max(tot, 1), tot
base = cover([(15+30*k, dstar) for k in range(12)])
print('random-ish baseline (inner star lines extended):', round(base[0], 3))
res = []
for s in np.arange(1.2, 2.3, 0.01):
    for rot in (0, 15):
        star = [((rot + 15 + 30*k) % 360, dstar*s) for k in range(12)]
        side = [((rot + 30*k) % 360, ap*s) for k in range(12)]
        cs, _ = cover(star); co, _ = cover(side)
        res.append((round(cs, 3), round(co, 3), round(float(s), 2), rot))
for k in (0, 1):
    print('best', 'star lines' if k == 0 else 'outline sides')
    for r in sorted(res, key=lambda r: -r[k])[:6]: print('  ', r)

import numpy as np, math
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open('bouinania-pattern.jpg').convert('RGB')).astype(float)
band = (im.min(2) > 140).astype(float)
cx, cy, R = 1024.5, 1011.5, 420.0
def prof(normals, lo, hi, umax, rmin=0):
    out = []
    for dist in np.arange(lo, hi, 0.0025):
        tot = hit = 0
        for nd in normals:
            a = math.radians(nd); n = (math.cos(a), math.sin(a)); t = (-n[1], n[0])
            for u in np.linspace(-umax, umax, 400):
                x = n[0]*dist + t[0]*u; y = n[1]*dist + t[1]*u
                if math.hypot(x, y) < rmin or max(abs(x), abs(y)) > 2.0: continue
                tot += 1; hit += band[int(round(cy - y*R)), int(round(cx + x*R))]
        out.append((hit/max(tot, 1), dist))
    # centre of the plateau above 0.8 max
    m = max(v for v, _ in out); top = [d for v, d in out if v > 0.85*m]
    return round(min(top), 4), round(max(top), 4), round((min(top) + max(top))/2, 4)
print('square sides of big 12-gon (normals 0/90):', prof([0, 90, 180, 270], 1.5, 1.8, 1.2))
print('slanted sides of big 12-gon (normals 30/60...):', prof([30, 60, 120, 150, 210, 240, 300, 330], 1.5, 1.8, 0.4))
print('outer frame (normals 0/90):', prof([0, 90, 180, 270], 1.85, 2.05, 1.9))
print('inner outline (normals 30k):', prof([30*k for k in range(12)], 0.85, 1.05, 0.25))

import numpy as np, math, json
from PIL import Image
from skimage.morphology import skeletonize, binary_dilation, disk
img = np.asarray(Image.open('avg12.png').convert('RGB')).astype(float)
M = img.shape[0]; R = 0.55; S = M/(2*R)
mx = img.max(2); mn = img.min(2); sat = (mx-mn)/(mx+1)
band = (mx > 150) & (sat < 0.25)
yy, xx = np.mgrid[0:M, 0:M]; rr = np.hypot(xx - M/2, yy - M/2)/S
band &= rr < 0.52
sk = skeletonize(band)
near = binary_dilation(sk, disk(int(0.006*S)))
Image.fromarray((np.stack([band*120, sk*255, near*80], 2)).astype(np.uint8)).save('skel12.png')
def at(x, y):
    i = int(round(M/2 - y*S)); j = int(round(M/2 + x*S))
    return near[i, j] if 0 <= i < M and 0 <= j < M else False
res = []
for phi in (0, 15):
    a = math.radians(phi); nx, ny = math.cos(a), math.sin(a); tx, ty = -ny, nx
    for d in np.arange(0, 0.5, 0.0025):
        st = 0.002; ss = np.arange(-0.5, 0.5, st)
        v = np.array([at(d*nx + s*tx, d*ny + s*ty) and math.hypot(d, s) < 0.5 for s in ss])
        # runs with >=90% coverage in a window, minimal length 0.05
        runs = []; i = 0
        while i < len(ss):
            if v[i]:
                j = i
                while j + 1 < len(ss) and (v[j+1] or (j + 3 < len(ss) and v[j+2:j+4].any())): j += 1
                if ss[j] - ss[i] >= 0.05: runs.append((round(ss[i],3), round(ss[j],3)))
                i = j + 1
            else: i += 1
        if runs:
            tot = sum(b - a for a, b in runs)
            res.append((phi, round(d, 4), round(tot, 3), runs))
json.dump(res, open('runs12.json', 'w'))
for r in res:
    if r[2] > 0.08: print(r[0], r[1], r[2], r[3])

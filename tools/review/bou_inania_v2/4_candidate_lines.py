import numpy as np, math, json, sys
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage.morphology import remove_small_holes
im = np.asarray(Image.open('bouinania-pattern.jpg').convert('RGB')).astype(float)
band = remove_small_holes(im.min(2) > 120, max_size=400)
dt = ndi.distance_transform_edt(band)
cx, cy, R = 1027.0, 1027.5, 367.0
S3 = math.sqrt(3); rho = math.tan(math.radians(37.5)); c15 = math.cos(math.radians(15))
SETS = json.loads(sys.argv[1]); out = sys.argv[2]; LIM = 2.28
L = []
for phi, d, n, col in SETS:
    for k in range(n):
        a = math.radians(phi + 360/n*k); L.append((math.cos(a), math.sin(a), d, tuple(col)))
segs = []
for (nx, ny, c, col) in L:
    tx, ty = -ny, nx; p0 = (nx*c, ny*c); ts = []
    for (mx, my, e, _) in L:
        det = nx*my - ny*mx
        if abs(det) < 1e-9: continue
        x = (c*my - e*ny)/det; y = (nx*e - mx*c)/det; ts.append((x - p0[0])*tx + (y - p0[1])*ty)
    ts = sorted(set(round(t, 7) for t in ts))
    for t1, t2 in zip(ts, ts[1:]):
        if t2 - t1 < 0.008: continue
        A = (p0[0] + t1*tx, p0[1] + t1*ty); B = (p0[0] + t2*tx, p0[1] + t2*ty)
        if max(abs(A[0]), abs(A[1]), abs(B[0]), abs(B[1])) > LIM + 1e-6: continue
        n = max(3, int((t2 - t1)*R/3)); ok = 0
        for u in np.linspace(0.1, 0.9, n):
            x = A[0] + u*(B[0]-A[0]); y = A[1] + u*(B[1]-A[1]); ok += dt[int(round(cy - y*R)), int(round(cx + x*R))] >= 7
        if ok/n > 0.85: segs.append((A, B, col))
# how much band centre is explained
from skimage.morphology import skeletonize
sk = skeletonize(dt >= 7)
img = Image.new('L', (band.shape[1], band.shape[0]), 0); dr = ImageDraw.Draw(img)
for A, B, _ in segs: dr.line((cx + A[0]*R, cy - A[1]*R, cx + B[0]*R, cy - B[1]*R), fill=1, width=13)
m = np.asarray(img).astype(bool)
yy, xx = np.nonzero(sk); X = (xx - cx)/R; Y = (cy - yy)/R; keep = (np.abs(X) < 2.24) & (np.abs(Y) < 2.24)
print('band centre explained:', round(m[yy[keep], xx[keep]].mean(), 3), 'segments', len(segs))
base = Image.open('bouinania-pattern.jpg').convert('RGB'); base = Image.blend(base, Image.new('RGB', base.size, 'white'), 0.6)
dr = ImageDraw.Draw(base)
for A, B, col in segs: dr.line((cx + A[0]*R, cy - A[1]*R, cx + B[0]*R, cy - B[1]*R), fill=col, width=7)
# unexplained band centre in magenta dots
for y_, x_ in zip(yy[keep][~m[yy[keep], xx[keep]]][::6], xx[keep][~m[yy[keep], xx[keep]]][::6]): dr.point((x_, y_), fill=(255, 0, 255))
base.resize((1000, 1000)).save(out)
json.dump([[A, B] for A, B, _ in segs], open(out.replace('.png', '.json'), 'w'))

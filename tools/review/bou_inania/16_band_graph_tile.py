import numpy as np, math, json
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize, remove_small_holes
from scipy import ndimage as ndi
img = np.asarray(Image.open('tile-composite.png').convert('RGB')).astype(float)
M = img.shape[0]; S = M/1.2
mx = img.max(2); mn = img.min(2); sat = (mx-mn)/(mx+1)
band = (mx > 150) & (sat < 0.25)
yy, xx = np.mgrid[0:M, 0:M]; rr = np.hypot(xx - M/2, yy - M/2)/S
band &= (np.abs(xx - M/2) < 0.59*S) & (np.abs(yy - M/2) < 0.59*S)
band = remove_small_holes(band, max_size=200)
band = ndi.binary_opening(band, iterations=2)
band = ndi.binary_closing(band, iterations=2)
sk = skeletonize(band)
# prune dead-end spurs shorter than 0.04 units, a few rounds
for _ in range(int(0.04*S)):
    nbr = ndi.convolve(sk.astype(int), np.ones((3,3), int), mode='constant') - 1
    ends = sk & (nbr <= 1)
    if not ends.any(): break
    sk = sk & ~ends
sk = skeletonize(sk)
nb = ndi.convolve(sk.astype(int), np.ones((3,3), int), mode='constant') - 1
junc = sk & (nb >= 3)
blobs = ndi.binary_dilation(junc, iterations=2)
lab, n = ndi.label(blobs)
jc = ndi.center_of_mass(junc, lab, range(1, n+1))
br = sk & ~blobs
blab, bn = ndi.label(br, structure=np.ones((3,3)))
U = lambda r, c: ((c - M/2)/S, (M/2 - r)/S)
def order(mask):
    ys, xs = np.nonzero(mask); P = set(zip(ys, xs))
    deg = {p: sum((p[0]+dy, p[1]+dx) in P for dy in (-1,0,1) for dx in (-1,0,1) if dy or dx) for p in P}
    ends = [p for p in P if deg[p] <= 1]
    if not ends: return None
    path = [ends[0]]; seen = {ends[0]}
    while True:
        y, x = path[-1]; nxt = None
        for dy in (-1,0,1):
            for dx in (-1,0,1):
                q = (y+dy, x+dx)
                if q in P and q not in seen: nxt = q; break
            if nxt: break
        if not nxt: break
        path.append(nxt); seen.add(nxt)
    return path
def dp(pts, tol):
    if len(pts) < 3: return [pts[0], pts[-1]]
    a, b = np.array(pts[0]), np.array(pts[-1]); ab = b - a; L = np.hypot(*ab) or 1e-9
    dists = [abs(ab[0]*(p[1]-a[1]) - ab[1]*(p[0]-a[0]))/L for p in pts]
    i = int(np.argmax(dists))
    if dists[i] > tol: return dp(pts[:i+1], tol)[:-1] + dp(pts[i:], tol)
    return [pts[0], pts[-1]]
polys = []
for b in range(1, bn+1):
    m = blab == b
    if m.sum() < 4: continue
    path = order(m)
    if not path: continue
    near = lambda p: [k for k in range(n) if math.hypot(p[0]-jc[k][0], p[1]-jc[k][1]) < 8]
    a = near(path[0]); z = near(path[-1])
    pts = [U(*p) for p in path]
    if a: pts = [U(*jc[a[0]])] + pts
    if z: pts = pts + [U(*jc[z[0]])]
    polys.append(dp(pts, 0.007))
segs = []
for pl in polys:
    for p, q in zip(pl, pl[1:]): segs.append((p, q))
json.dump(segs, open('raw-segsT.json', 'w'))
# vertices: all polyline vertices, folded and clustered
def fold(x, y):
    x, y = abs(x), abs(y)
    if y > x: x, y = y, x
    return (math.hypot(x, y), math.degrees(math.atan2(y, x)))
V = [fold(*p) for pl in polys for p in pl if max(abs(p[0]), abs(p[1])) < 0.56]
cl = []
for r, t in sorted(V):
    for c in cl:
        if abs(c[0]/c[2] - r) < 0.01 and abs(c[1]/c[2] - t)*math.pi/180*r < 0.01:
            c[0] += r; c[1] += t; c[2] += 1; break
    else: cl.append([r, t, 1])
cl = [(c[0]/c[2], c[1]/c[2], c[2]) for c in cl if c[2] >= 4]
for r, t, k in [c for c in cl if c[0] > 0.42]: print(f'r {r:.4f} t {t:6.2f} n {k:3d}  xy ({r*math.cos(math.radians(t)):.4f}, {r*math.sin(math.radians(t)):.4f})')
json.dump(cl, open('vertsT.json', 'w'))
out = Image.open('tile-composite.png').convert('RGB'); d = ImageDraw.Draw(out)
for p, q in segs: d.line((M/2 + p[0]*S, M/2 - p[1]*S, M/2 + q[0]*S, M/2 - q[1]*S), fill=(255, 0, 0), width=2)
out.save('raw-segsT.png')

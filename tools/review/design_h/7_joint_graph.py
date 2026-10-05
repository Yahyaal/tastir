import numpy as np, math, json
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
sk = np.load('skel2.npy'); N = sk.shape[0]; S = N/2.4
nb = ndi.convolve(sk.astype(int), np.ones((3,3), int), mode='constant') - 1
junc = sk & (nb >= 3)
blobs = ndi.binary_dilation(junc, iterations=2)
lab, n = ndi.label(blobs)
jc = ndi.center_of_mass(junc, lab, range(1, n+1))
br = sk & ~blobs
blab, bn = ndi.label(br, structure=np.ones((3,3)))
U = lambda r, c: ((c - N/2)/S, (N/2 - r)/S)
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
    ds = [abs(ab[0]*(p[1]-a[1]) - ab[1]*(p[0]-a[0]))/L for p in pts]
    i = int(np.argmax(ds))
    return dp(pts[:i+1], tol)[:-1] + dp(pts[i:], tol) if ds[i] > tol else [pts[0], pts[-1]]
segs = []
for b in range(1, bn+1):
    m = blab == b
    if m.sum() < 4: continue
    path = order(m)
    if not path: continue
    near = lambda p: [k for k in range(n) if math.hypot(p[0]-jc[k][0], p[1]-jc[k][1]) < 8]
    pts = [U(*p) for p in path]
    a = near(path[0]); z = near(path[-1])
    if a: pts = [U(*jc[a[0]])] + pts
    if z: pts = pts + [U(*jc[z[0]])]
    pl = dp(pts, 0.012)
    segs += list(zip(pl, pl[1:]))
json.dump(segs, open('raw-segs.json', 'w'))
def fold(p):
    x, y = abs(p[0]), abs(p[1]); return (x, y) if x >= y else (y, x)
V = [fold(p) for s in segs for p in s if max(abs(p[0]), abs(p[1])) < 1.08]
cl = []
for p in sorted(V):
    for c in cl:
        if math.dist((c[0]/c[2], c[1]/c[2]), p) < 0.02: c[0] += p[0]; c[1] += p[1]; c[2] += 1; break
    else: cl.append([p[0], p[1], 1])
cl = [(c[0]/c[2], c[1]/c[2], c[2]) for c in cl if c[2] >= 4]
for i, (x, y, k) in enumerate(cl): print(i, f'({x:.3f}, {y:.3f})  r {math.hypot(x,y):.3f}  angle {math.degrees(math.atan2(y,x)):5.1f}  n {k}')
json.dump(cl, open('verts.json', 'w'))
im = Image.open('tile-composite.png').convert('RGB'); d = ImageDraw.Draw(im)
for p, q in segs: d.line((N/2 + p[0]*S, N/2 - p[1]*S, N/2 + q[0]*S, N/2 - q[1]*S), fill=(255,0,0), width=2)
for x, y, k in cl: d.ellipse((N/2 + x*S - 5, N/2 - y*S - 5, N/2 + x*S + 5, N/2 - y*S + 5), outline=(0,255,0), width=2)
im.save('raw-segs.png')

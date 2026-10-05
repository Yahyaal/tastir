import json, math, numpy as np
from scipy.optimize import least_squares
cl = json.load(open('verts12.json'))
meas = {i: (cl[i][0]*math.cos(math.radians(cl[i][1])), cl[i][0]*math.sin(math.radians(cl[i][1]))) for i in range(len(cl))}
axis = {2: 'B', 3: 'A', 4: 'A', 10: 'B', 13: 'A'}
order = [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 10, 13]
def unpack(v):
    P = {}; i = 0
    for c in order:
        if c in axis:
            a = 0 if axis[c] == 'A' else math.radians(15); P[c] = (v[i]*math.cos(a), v[i]*math.sin(a)); i += 1
        else: P[c] = (v[i], v[i+1]); i += 2
    return P
def inst(P, c, k, sg):
    x, y = P[c]; r = math.hypot(x, y); t = math.atan2(y, x); a = math.radians(30*k) + sg*t; return (r*math.cos(a), r*math.sin(a))
E = [(2,3,0,1,150),(2,3,1,1,60),(3,4,0,1,0),(4,5,0,1,30),(5,6,0,1,60),(6,7,0,1,150),(7,8,0,1,0),(8,9,0,1,30),(9,10,0,1,75),(9,11,0,1,0),(11,12,0,1,105),(12,13,0,1,135)]
def edge_res(P):
    out = []
    for a, b, k, sg, d in E:
        p = inst(P, a, 0, 1); q = inst(P, b, k, sg); u = (math.cos(math.radians(d)), math.sin(math.radians(d)))
        out.append((q[0]-p[0])*u[1] - (q[1]-p[1])*u[0])
    return out
def groups(P, tol):
    V = []
    for c in order:
        for k in range(12):
            for sg in ((1,) if c in axis else (1, -1)): V.append(((c, k, sg), inst(P, c, k, sg)))
    G = []
    for d in range(0, 180, 15):
        a = math.radians(d); n = (-math.sin(a), math.cos(a))
        offs = sorted((p[0]*n[0] + p[1]*n[1], key) for key, p in V)
        i = 0
        while i < len(offs):
            j = i
            while j + 1 < len(offs) and offs[j+1][0] - offs[j][0] < tol: j += 1
            grp = offs[i:j+1]
            if len({g[1][0] for g in grp}) >= 3 and offs[j][0] - offs[i][0] < 2*tol:
                # canonicalise: keep groups whose line meets the wedge (offset >= 0, direction in sector) -> just dedupe by member classes and offset
                G.append((d, round(abs(sum(g[0] for g in grp)/len(grp)), 4), tuple(sorted({g[1][0] for g in grp})), [g[1] for g in grp]))
            i = j + 1
    uniq = {}
    for d, o, cls_, mem in G:
        uniq.setdefault((cls_, o), (d, mem))
    return uniq
v0 = []
for c in order: v0 += [math.hypot(*meas[c])] if c in axis else list(meas[c])
def fit(C, v):
    def resid(v, w):
        P = unpack(v); r = []
        for c in order: r += [P[c][0]-meas[c][0], P[c][1]-meas[c][1]]
        r += [w*x for x in edge_res(P)]
        for d, mem in C:
            a = math.radians(d); n = (-math.sin(a), math.cos(a))
            o = [inst(P, *m)[0]*n[0] + inst(P, *m)[1]*n[1] for m in mem]
            r += [w*(x - o[0]) for x in o[1:]]
        return np.array(r)
    for w in (10, 100, 1000, 1e4, 1e5): v = least_squares(resid, v, args=(w,), xtol=1e-15, ftol=1e-15, gtol=1e-15).x
    P = unpack(v); rms = math.sqrt(sum((P[c][0]-meas[c][0])**2 + (P[c][1]-meas[c][1])**2 for c in order)/len(order))
    return v, rms
v, rms = fit([], np.array(v0)); print('base rms', round(rms, 4))
C = []
for it in range(12):
    P = unpack(v); cand = groups(P, 0.006)
    best = None
    for (cls_, o), (d, mem) in cand.items():
        if any(set(mem) <= set(m2) for _, m2 in C): continue
        v2, r2 = fit(C + [(d, mem)], v)
        sc = r2 - 0.0005*len(cls_)
        if best is None or sc < best[0]: best = (sc, r2, d, mem, cls_, o, v2)
    if not best or best[1] > 0.0045: break
    _, r2, d, mem, cls_, o, v = best; C.append((d, mem))
    print(f'add line dir {d:3d}° offset {o} through classes {cls_}: rms {r2:.4f}')
P = unpack(v)
json.dump({'P': {str(c): P[c] for c in order}, 'C': C}, open('ideal12b.json', 'w'))
for c in order: print(c, tuple(round(x, 4) for x in P[c]))

import json, math
D = json.load(open('ideal12e.json')); P = {int(k): tuple(v) for k, v in D['P'].items()}; C = D['C']
axis = {2: 15, 3: 0, 4: 0, 10: 15, 13: 0}
E = [(2,3,0,1,150),(2,3,1,1,60),(3,4,0,1,0),(4,5,0,1,30),(5,6,0,1,60),(6,7,0,1,150),(7,8,0,1,0),(8,9,0,1,30),(9,10,0,1,75),(9,11,0,1,0),(11,12,0,1,105),(12,13,0,1,135)]
def inst(c, k, sg):
    if c == 'O': return (0.0, 0.0)
    x, y = P[c]; r = math.hypot(x, y); t = math.atan2(y, x); a = math.radians(30*k) + sg*t; return (r*math.cos(a), r*math.sin(a))
R = lambda p: (round(p[0], 6) + 0.0, round(p[1], 6) + 0.0)
cls_of = {}
for c in P:
    for k in range(12):
        for sg in (1, -1): cls_of[R(inst(c, k, sg))] = c
cls_of[(0.0, 0.0)] = 'O'
def sym(p, rot, m):
    x, y = p; y = m*y; a = math.radians(30*rot); return R((x*math.cos(a) - y*math.sin(a), x*math.sin(a) + y*math.cos(a)))
base = [([inst(a, 0, 1), inst(b, k, sg)], d) for a, b, k, sg, d in E] + [([inst(*m) for m in mem], d) for d, mem in C] + [([inst(c, 0, 1), (0.0, 0.0)], t) for c, t in axis.items()]
rels = set()
for mem, d in base:
    for rot in range(12):
        for m in (1, -1):
            rels.add((frozenset(sym(p, rot, m) for p in mem), (m*d + 30*rot) % 180))
def run(seeds):
    known = {(0.0, 0.0)} | {p for p, c in cls_of.items() if c in seeds}; kc = set(seeds); log = []
    ch = True
    while ch:
        ch = False
        for c in P:
            if c in kc: continue
            key = R(inst(c, 0, 1)); dirs = {}
            for S, d in rels:
                if key in S and (S - {key}) & known: dirs.setdefault(d, sorted({cls_of[p] for p in S if p != key and p in known}, key=str))
            if len(dirs) >= 2:
                kc.add(c); ch = True; log.append((c, list(dirs.items())[:2]))
                known |= {p for p, cc in cls_of.items() if cc == c}
    return kc, log
for n in (1,):
    sols = []
    import itertools
    for seeds in [(9, 13)]:
        kc, log = run(set(seeds))

        print('reached', sorted(kc), log)
        if len(kc) == len(P): sols.append((seeds, log))
    if sols:
        for seeds, log in sols[:3]:
            print('seeds', seeds); [print('   ', c, 'from', l) for c, l in log]
        break
    else: print('no solution with', n, 'seed(s)')

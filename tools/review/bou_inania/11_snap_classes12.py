import json, math
from PIL import Image, ImageDraw
segs = json.load(open('raw-segs12.json')); cl = json.load(open('verts12.json'))
def inst(c, k, sg):
    r, t, _ = cl[c]; a = math.radians(30*k + sg*t); return (r*math.cos(a), r*math.sin(a))
I = {}
for c in range(len(cl)):
    for k in range(12):
        for sg in ((1,) if cl[c][1] < 0.8 or cl[c][1] > 14.2 else (1, -1)):
            I[(c, k, sg)] = inst(c, k, sg)
def snap(p):
    best = min(I.items(), key=lambda kv: math.dist(kv[1], p))
    return best[0] if math.dist(best[1], p) < 0.014 else None
E = set()
for p, q in segs:
    a, b = snap(p), snap(q)
    if a and b and a != b: E.add(tuple(sorted((a, b))))
# canonical orbit key: express b relative to a in a's frame
def canon(a, b):
    out = []
    for (u, v) in ((a, b), (b, a)):
        ku, su = u[1], u[2]
        # map u to (c,0,+1): rotate by -ku, then mirror if su==-1
        kv = (v[1] - ku) % 12; sv = v[2]
        if su == -1: kv = (-kv) % 12; sv = -sv
        out.append((u[0], v[0], kv, sv))
    return min(out)
orb = {}
for a, b in E: orb.setdefault(canon(a, b), []).append((a, b))
print('vertex classes:'); [print(i, [round(x, 4) for x in c]) for i, c in enumerate(cl)]
print('edge orbits (class, class, rel sector, rel mirror): count')
for k, v in sorted(orb.items()): print(k, len(v))
json.dump([list(k) for k, v in orb.items() if len(v) >= 6], open('orbits12.json', 'w'))
im = Image.open('avg12.png').convert('RGB'); M = im.width; S = M/1.1; d = ImageDraw.Draw(im)
for k, v in orb.items():
    if len(v) < 6: continue
    for a, b in v:
        p, q = I[a], I[b]; d.line((M/2 + p[0]*S, M/2 - p[1]*S, M/2 + q[0]*S, M/2 - q[1]*S), fill=(255, 0, 0), width=2)
im.save('snap12.png')

import json, math, sys
from PIL import Image, ImageDraw
D = json.load(open('ideal12e.json')); P = {int(k): tuple(v) for k, v in D['P'].items()}
E = [(2,3,0,1),(2,3,1,1),(3,4,0,1),(4,5,0,1),(5,6,0,1),(6,7,0,1),(7,8,0,1),(8,9,0,1),(9,10,0,1),(9,11,0,1),(11,12,0,1),(12,13,0,1),(6,6,1,-1),(8,8,0,-1),(9,10,1,-1),(5,4,0,-1),(12,13,0,-1)]
def inst(c, k, sg):
    x, y = P[c]; r = math.hypot(x, y); t = math.atan2(y, x); a = math.radians(30*k) + sg*t; return (r*math.cos(a), r*math.sin(a))
segs = []
for a, b, k, sg in E:
    p, q = inst(a, 0, 1), inst(b, k, sg)
    for rot in range(12):
        for m in (1, -1):
            f = lambda z: (z[0]*math.cos(math.radians(30*rot)) - m*z[1]*math.sin(math.radians(30*rot)), z[0]*math.sin(math.radians(30*rot)) + m*z[1]*math.cos(math.radians(30*rot)))
            segs.append((f(p), f(q)))
json.dump(segs, open('rosetteE-segs.json', 'w'))
im = Image.open('tile-composite.png').convert('RGB'); M = im.width; S = M/1.2; d = ImageDraw.Draw(im)
for p, q in segs: d.line((M/2 + p[0]*S, M/2 - p[1]*S, M/2 + q[0]*S, M/2 - q[1]*S), fill=(255, 0, 0), width=3)
im.crop((int(M/2 - 0.5*S), int(M/2 - 0.5*S), int(M/2 + 0.5*S), int(M/2 + 0.5*S))).save('rosetteE-overlay.png')

import numpy as np, math, json
from PIL import Image, ImageDraw
res = json.load(open('runs12.json'))
# cluster consecutive d per phi, keep the member with the largest total
cl = []
for phi in (0, 15):
    rows = [r for r in res if r[0] == phi]
    cur = []
    for r in rows:
        if cur and r[1] - cur[-1][1] > 0.0026: cl.append(max(cur, key=lambda q: q[2])); cur = []
        cur.append(r)
    if cur: cl.append(max(cur, key=lambda q: q[2]))
keep = [c for c in cl if c[2] >= 0.09]
for c in keep: print(c[0], c[1], c[2], [(round(a,3), round(b,3)) for a, b in c[3]])
json.dump(keep, open('trace12.json', 'w'))
im = Image.open('avg12.png').convert('RGB'); M = im.width; S = M/1.1
ov = im.copy(); d = ImageDraw.Draw(ov); blank = Image.new('RGB', im.size, 'white'); db = ImageDraw.Draw(blank)
P = lambda x, y: (M/2 + x*S, M/2 - y*S)
for phi, dd, tot, runs in keep:
    for k in range(12):
        a = math.radians(phi + 30*k); nx, ny = math.cos(a), math.sin(a); tx, ty = -ny, nx
        for s0, s1 in runs:
            p = P(dd*nx + s0*tx, dd*ny + s0*ty); q = P(dd*nx + s1*tx, dd*ny + s1*ty)
            d.line((p, q), fill=(255, 0, 0), width=3); db.line((p, q), fill=(0, 0, 0), width=4)
sheet = Image.new('RGB', (2*M, M)); sheet.paste(ov, (0, 0)); sheet.paste(blank, (M, 0)); sheet.save('trace12.png')

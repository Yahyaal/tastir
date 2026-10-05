import math, json
from PIL import Image, ImageDraw, ImageFont
trace = json.load(open('trace12.json'))
im = Image.open('avg12.png').convert('RGB'); M = im.width; S = M/1.1
# region x 0..0.5, y -0.05..0.3 (wedge 0..30 deg)
x0, x1, y0, y1 = -0.02, 0.52, -0.06, 0.32; W = 1400; s = W/(x1 - x0); H = int((y1 - y0)*s)
c = im.crop((int(M/2 + x0*S), int(M/2 - y1*S), int(M/2 + x1*S), int(M/2 - y0*S))).resize((W, H), Image.LANCZOS)
c = Image.blend(c, Image.new('RGB', c.size, 'white'), 0.35)
d = ImageDraw.Draw(c)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except: font = None
P = lambda x, y: ((x - x0)*s, (y1 - y)*s)
cols = [(220,0,0),(0,140,0),(0,0,220),(200,0,200),(230,120,0),(0,150,150),(110,0,180),(150,120,0),(0,0,0)]
for i, (phi, dd, tot, runs) in enumerate(trace):
    col = cols[i % len(cols)]
    for k in range(12):
        a = math.radians(phi + 30*k); nx, ny = math.cos(a), math.sin(a); tx, ty = -ny, nx
        for s0, s1 in runs:
            p = (dd*nx + s0*tx, dd*ny + s0*ty); q = (dd*nx + s1*tx, dd*ny + s1*ty)
            d.line((P(*p), P(*q)), fill=col, width=3)
            mxp = ((p[0]+q[0])/2, (p[1]+q[1])/2); ang = math.degrees(math.atan2(mxp[1], mxp[0]))
            if -2 < ang < 32 and math.hypot(*mxp) < 0.52:
                d.text(P(*mxp), f'{i}', fill=col, font=font)
for a in (0, 15, 30):
    d.line((P(0, 0), P(0.52*math.cos(math.radians(a)), 0.52*math.sin(math.radians(a)))), fill=(120,120,120), width=1)
c.save('wedge12.png')
for i, t in enumerate(trace): print(i, t[0], t[1])

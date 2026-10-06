"""Draws the tutorial's ink over David Wade's photo of the carved panel
(wade-mor0711-original.jpg), with a homography fitted to the centres of the
large and small stars (picked from the photo at 900 px wide and refined by
eight-fold self-similarity): photo-overlay.png.
Usage: 3_overlay_photo.py <dump.json> <out dir> [<picks.json>]
picks.json: {"photo": file, "fold": n, "width": photo width the picks were read at,
             "picks": [[[x, y], [u, v]], ...], "crop": [x0, y0, x1, y1], "credit": text,
             "refine": false to use the picks as given (flat motifs do not self-match)}
(from docs/research/alhambra-wichmann/)"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
dump, outdir = sys.argv[1], sys.argv[2]
cfg = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {
    'photo': 'wade-mor0711-original.jpg', 'fold': 8, 'width': 900, 'crop': [280, 20, 1370, 1080],
    'credit': 'Carved panel (photo: David Wade)',
    'picks': [[[320, 180], [0, 0]], [[560, 180], [2, 0]], [[320, 410], [0, -2]], [[560, 410], [2, -2]],
              [[440, 295], [1, -1]], [[200, 295], [-1, -1]]]}
rgb = Image.open(cfg['photo']).convert('RGB'); k = rgb.width/cfg['width']
g = ndi.gaussian_filter(np.asarray(rgb.convert('L')).astype(float), 1.5)
def score(cx, cy, R=55):
    ys, xs = np.mgrid[-R:R:2, -R:R:2]; m = (xs**2 + ys**2 < R*R) & (xs**2 + ys**2 > 36)
    xs, ys = xs[m], ys[m]; a = ndi.map_coordinates(g, [cy + ys, cx + xs], order=1)
    t = 2*math.pi/cfg['fold']; xr = xs*math.cos(t) - ys*math.sin(t); yr = xs*math.sin(t) + ys*math.cos(t)
    return np.corrcoef(a, ndi.map_coordinates(g, [cy + yr, cx + xr], order=1))[0, 1]
def refine(x, y):
    for st in (8, 3, 1):
        while True:
            best = max((score(x + dx, y + dy), x + dx, y + dy) for dx in (-st, 0, st) for dy in (-st, 0, st))
            if (best[1], best[2]) == (x, y): break
            x, y = best[1], best[2]
    return x, y
picks = [(tuple(a), tuple(b)) for a, b in cfg['picks']]
A = []
for (x, y), (U, V) in picks:
    px, py = refine(x*k, y*k) if cfg.get('refine', True) else (x*k, y*k)
    A.append([-U, -V, -1, 0, 0, 0, px*U, px*V, px]); A.append([0, 0, 0, -U, -V, -1, py*U, py*V, py])
Hm = np.linalg.svd(np.array(A))[2][-1].reshape(3, 3); Hm /= Hm[2, 2]
def P(u, v):
    p = Hm @ [u, v, 1]; return p[0]/p[2], p[1]/p[2]
d = json.load(open(dump)); ink = d['ink']; cu, cv = d['cell']['u'], d['cell']['v']
over = rgb.copy(); dr = ImageDraw.Draw(over)
for i in range(-6, 7):
    for j in range(-6, 7):
        ox, oy = i*cu[0] + j*cv[0], i*cu[1] + j*cv[1]
        for a, b in ink:
            pa, pb = P(a[0] + ox, a[1] + oy), P(b[0] + ox, b[1] + oy)
            x0, y0, x1, y1 = cfg['crop']
            if all(x0 + 20 < c[0] < x1 - 20 and y0 + 10 < c[1] < y1 - 20 for c in (pa, pb)):
                dr.line((*pa, *pb), fill=(255, 40, 40), width=3)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 40)
box = tuple(cfg['crop'])
a, b = rgb.crop(box), over.crop(box)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', min(40, a.width // 14))
out = Image.new('RGB', (a.width*2 + 20, a.height + 60), 'white'); out.paste(a, (0, 60)); out.paste(b, (a.width + 20, 60))
dd = ImageDraw.Draw(out); dd.text((10, 8), cfg['credit'], font=font, fill='black'); dd.text((a.width + 30, 8), 'With our lines (red)', font=font, fill='black')
out.thumbnail((1600, 1600)); font = None; os.makedirs(outdir, exist_ok=True); out.save(os.path.join(outdir, 'photo-overlay.png'))

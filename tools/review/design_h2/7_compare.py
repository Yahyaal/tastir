"""Pictures for the review page: the straightened photo beside the same area
with the tutorial's ink over it, and a close-up of one five-pointed star.
Usage (from docs/research/design-h2/): 7_compare.py <dump.json> <out dir>"""
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFont
d = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
u, v = d['cell']['u'], d['cell']['v']
base = Image.open('straight.png').convert('RGB'); PX = 300; X0, Y0 = -1.3, 1.9
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 28)
def lines(im, x0, y1, k, col=(255, 40, 40), w=2):
    dr = ImageDraw.Draw(im)
    for i in range(-3, 4):
        for j in range(-4, 4):
            ox, oy = i*u[0] + j*v[0], i*u[1] + j*v[1]
            for p, q in d['ink']:
                dr.line(((p[0]+ox-x0)*k, (y1-p[1]-oy)*k, (q[0]+ox-x0)*k, (y1-q[1]-oy)*k), fill=col, width=w)
    return im
def view(x0, y0, x1, y1, size, ink):
    im = base.crop((round((x0-X0)*PX), round((Y0-y1)*PX), round((x1-X0)*PX), round((Y0-y0)*PX)))
    im = im.resize((size, round(size*(y1-y0)/(x1-x0))))
    return lines(im, x0, y1, size/(x1-x0)) if ink else im
def label(im, t):
    dr = ImageDraw.Draw(im); dr.rectangle((0, 0, im.width, 44), fill='white'); dr.text((10, 6), t, font=font, fill='black'); return im
def pair(a, b, name):
    o = Image.new('RGB', (a.width + b.width + 20, max(a.height, b.height)), 'white'); o.paste(a, (0, 0)); o.paste(b, (a.width + 20, 0)); o.save(os.path.join(out, name))
pair(label(view(-1.0, -0.6, 1.0, 1.75, 700, False), 'The doors (Met photo)'), label(view(-1.0, -0.6, 1.0, 1.75, 700, True), 'With our lines (red)'), 'photo-overlay.png')
pair(label(view(-0.6, 0.65, 0.6, 1.55, 700, False), 'Between three rosettes'), label(view(-0.6, 0.65, 0.6, 1.55, 700, True), 'With our lines'), 'photo-gap.png')

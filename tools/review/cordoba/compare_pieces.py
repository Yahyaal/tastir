import json, math, sys
from PIL import Image, ImageDraw
d = json.load(open('../../review/cordoba-synagogue/dump.json'))
src = Image.open('finished-drawing.png').convert('RGB'); W, H = src.size
im = Image.new('RGB', (W, H), 'white'); dr = ImageDraw.Draw(im)
S3 = math.sqrt(3); a = 178.8; s = a / S3; t = math.radians(30)
cols = [(255,200,80),(150,80,180),(30,90,170),(130,190,240),(200,40,70),(240,240,240),(60,160,90),(250,120,40),(0,0,0),(255,0,0),(0,255,0),(0,255,255),(255,0,255)]
for i in range(-3, 5):
    for j in range(-3, 5):
        X = 299.6 + i * a + j * 89.4; Y = 349.6 - j * 154.9
        f = lambda u: (X + (u[0] * math.cos(t) - u[1] * math.sin(t)) * s, Y - (u[0] * math.sin(t) + u[1] * math.cos(t)) * s)
        for p in d['pieces']:
            dr.polygon([f(q) for q in p['polygon']], fill=cols[p['type'] % len(cols)])
        for p, q in d['ink']:
            dr.line([f(p), f(q)], fill=(0, 0, 0), width=1)
box = (300, 190, 570, 520)
a_ = src.crop(box).resize((540, 660)); b_ = im.crop(box).resize((540, 660))
sh = Image.new('RGB', (1100, 660), 'white'); sh.paste(a_, (0, 0)); sh.paste(b_, (560, 0)); sh.save(sys.argv[1])

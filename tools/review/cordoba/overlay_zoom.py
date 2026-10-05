import json, math, sys
from PIL import Image, ImageDraw
ink = json.load(open(sys.argv[1]))
cx, cy, R = map(float, sys.argv[2:5])
src = Image.open('finished-drawing.png').convert('RGB')
Z = 5
crop = src.crop((int(cx - R), int(cy - R), int(cx + R), int(cy + R))).resize((int(2 * R * Z), int(2 * R * Z)), Image.NEAREST)
dr = ImageDraw.Draw(crop)
S3 = math.sqrt(3); a = 178.8; s = a / S3; t = math.radians(30)
for i in range(-3, 5):
    for j in range(-3, 5):
        X = 299.6 + i * a + j * 89.4; Y = 349.6 - j * 154.9
        for p, q, _ in ink:
            f = lambda u: ((X + (u[0] * math.cos(t) - u[1] * math.sin(t)) * s - (cx - R)) * Z, (Y - (u[0] * math.sin(t) + u[1] * math.cos(t)) * s - (cy - R)) * Z)
            dr.line([f(p), f(q)], fill=(0, 255, 0), width=2)
crop.save(sys.argv[5])

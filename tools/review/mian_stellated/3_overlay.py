"""Draws line families (rosette frame, copies at every rosette 2 apart) in
colours over frame 20 and marks blue ink they do not explain."""
import numpy as np, math, json, sys
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
blue = (im[..., 2] > 150) & (im[..., 0] < 160) & (im[..., 1] < 130)
g = json.load(open(sys.argv[2])); cx, cy, S = g['cx'], g['cy'], g['S']
FAM = json.loads(sys.argv[3]); out = sys.argv[4]
canvas = Image.new('L', (im.shape[1], im.shape[0]), 0); dc = ImageDraw.Draw(canvas)
vis = Image.fromarray(np.where(blue[..., None], [150, 150, 255], [255, 255, 255]).astype(np.uint8)); dv = ImageDraw.Draw(vis)
for phi, d, stp, col, ctr in FAM:
    centres = [(2*i, 2*j) for i in range(-1, 3) for j in range(-1, 3)] if ctr == 'rosette' else [(2*i + 1, 2*j + 1) for i in range(-1, 2) for j in range(-1, 2)]
    for ox, oy in centres:
        for k in range(int(round(360/stp))):
            a = math.radians(phi + stp*k); n = (math.cos(a), math.sin(a)); c = d + n[0]*ox + n[1]*oy
            A = (n[0]*c + n[1]*6, n[1]*c - n[0]*6); B = (n[0]*c - n[1]*6, n[1]*c + n[0]*6)
            P = lambda p: (cx + p[0]*S, cy - p[1]*S)
            dc.line((P(A), P(B)), fill=1, width=5); dv.line((P(A), P(B)), fill=tuple(col), width=1)
m = np.asarray(canvas).astype(bool)
un = blue & ~m
print('blue explained:', round(1 - un.sum()/blue.sum(), 3))
v = np.asarray(vis).copy(); v[un] = (0, 0, 0)
ys, xs = np.nonzero(blue)
Image.fromarray(v).crop((xs.min() - 5, ys.min() - 5, xs.max() + 5, ys.max() + 5)).resize((1000, 1000)).save(out)

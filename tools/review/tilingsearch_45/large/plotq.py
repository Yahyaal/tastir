"""plotq.py <pieces.json> ox oy unit L out.png [band] [turn]: the source pieces in the
tutorial frame over [-0.5, L+0.5]^2 (first quadrant), with a grid of H steps labelled."""
import sys, math
sys.path.insert(0, '/home/yahya/Documents/projects/Tastir/.claude/worktrees/agent-a0638ace160955a10/tools/review/tilingsearch_45')
import common as cm
from PIL import Image, ImageDraw
f = sys.argv[1]; ox, oy, u, L = map(float, sys.argv[2:6]); out = sys.argv[6]
band = float(sys.argv[7]) if len(sys.argv) > 7 else 0
polys = cm.frame_pieces(f, (ox, oy), 2 * u, band)
S = 110; lo = -1.0; hi = L + 1.0
W = int((hi - lo) * S)
im = Image.new('RGB', (W, W), 'white'); d = ImageDraw.Draw(im)
tr = lambda p: ((p[0] - lo) * S, (hi - p[1]) * S)
H = math.sqrt(.5)
# grid: a + bH for small a, b
for a in range(0, 12):
    for b in (0, 1, 2, 3, 4, 5, 6, 7):
        v = a + b * H
        if lo < v < hi and (a, b) in [(x, y) for x in range(0, 12) for y in (0, 1, 3, 5, 7)]:
            pass
for k in range(int(lo) - 1, int(hi) + 2):
    d.line([tr((k, lo)), tr((k, hi))], fill=(225, 225, 225))
    d.line([tr((lo, k)), tr((hi, k))], fill=(225, 225, 225))
    d.text(tr((k, lo + 0.1)), str(k), fill=(150, 150, 150))
    d.text(tr((lo + 0.05, k)), str(k), fill=(150, 150, 150))
for Q in polys:
    if all(lo - 2 < q[0] < hi + 2 and lo - 2 < q[1] < hi + 2 for q in Q):
        d.polygon([tr(q) for q in Q], outline=(0, 0, 0))
d.rectangle([tr((-L, L)), tr((L, -L))], outline=(255, 0, 0))
im.save(out)

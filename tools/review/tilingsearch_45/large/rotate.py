"""rotate.py in.json ox oy deg out.json : pieces moved so O is at (0,0), y flipped to up,
turned by deg (counter-clockwise), written back in pieces format with y down
again (so snap_grid with centre 0 0 works)."""
import json, sys, math
ps = json.load(open(sys.argv[1])); ox, oy, deg = map(float, sys.argv[2:5])
c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
out = []
for p in ps:
    Q = []
    for x, y in p['poly']:
        X, Y = x - ox, -(y - oy)
        X, Y = c * X - s * Y, s * X + c * Y
        Q.append((X, -Y))
    q = dict(p); q['poly'] = Q; out.append(q)
json.dump(out, open(sys.argv[5], 'w'))

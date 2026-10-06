#!/usr/bin/env python3
"""Names the pieces of the Sala de los Reyes stars, writes the expect block
from the engine's dump, and colours them as on the panel: the kites round the
crosses dark, those round the octagons pale. Same-shaped kites are told apart
by their place in the cell (nth), counted as the player counts them: from the
cell's first corner along its second slide, then its first.
Usage: finish_reyes.py <dump.json> tutorials/<id>.json"""
import json, math, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
def name(ty):
    v, a = ty['vertices'], ty['area']
    if v == 16: return 'cross', 'ground'
    if v == 6: return 'dart', 'b'
    if v == 8: return ('star', 'ground') if a > 0.2 else ('octagon', 'c')
    return ('kite', 'b') if a > 0.07 else ('small_kite', 'a')
pieces, colors, names = [], {}, []
for ty in d['types']:
    nm, c = name(ty); names.append(nm); colors[nm] = c
    pieces.append({'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']})
corners = d['cell']['corners']; o = corners[0]; u = d['cell']['u']; v = d['cell']['v']
det = u[0]*v[1] - u[1]*v[0]
def centre(p): return (sum(q[0] for q in p['polygon'])/len(p['polygon']), sum(q[1] for q in p['polygon'])/len(p['polygon']))
def ab(p):
    c = centre(p); dx, dy = c[0] - o[0], c[1] - o[1]
    return ((dx*v[1] - dy*v[0])/det, (u[0]*dy - u[1]*dx)/det)
kite = names.index('kite')
ks = [p for p in d['pieces'] if p['type'] == kite]
rules = []
for p in ks:
    a, b = ab(p)
    n = sum(1 for q in ks if q is not p and (ab(q)[1] < b - 1e-6 or (abs(ab(q)[1] - b) <= 1e-6 and ab(q)[0] < a)))
    cx, cy = centre(p)
    m = (round(cx), round(cy))
    if math.dist((cx, cy), m) > 0.45: m = min(((i, j) for i in range(-2, 3) for j in range(-2, 3)), key=lambda q: math.dist(q, (cx, cy)))
    if (m[0] + m[1]) % 2: rules.append({'piece': 'kite', 'nth': n, 'color': 'a'})
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
t['pattern']['placements'] = {'repeat': [1, 1], 'rules': sorted(rules, key=lambda r: r['nth'])}
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)
print(pieces); print(len(ks), 'kites,', len(rules), 'dark')

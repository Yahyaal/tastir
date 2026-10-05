#!/usr/bin/env python3
"""Names the pieces of the stellated-rosette tutorial and writes its expect
block from the engine's dump. Usage: finish.py <dump.json> tutorials/<id>.json"""
import json, math, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
def where(i):
    p = next(p for p in d['pieces'] if p['type'] == i)['polygon']
    x = abs(sum(q[0] for q in p) / len(p)); y = abs(sum(q[1] for q in p) / len(p))
    return math.hypot(x, y), math.hypot(x - 1, y - 1)
pieces, colors, used = [], {}, set()
for i, ty in enumerate(d['types']):
    r, k = where(i)
    if r < 0.05: nm, c = 'star', 'c'
    elif k < 0.05: nm, c = 'octagon', 'a'
    elif ty['vertices'] == 6 and ty['perCell'] == 4 and k < 0.6 and ty['area'] < 0.07 and ty['area'] > 0.05: nm, c = 'hexagon', 'd'
    elif r < 0.5: nm, c = 'petal', 'd'
    elif r < 0.95: nm, c = 'kite', 'b'
    else: nm, c = 'ground', 'ground'
    base, n = nm, 2
    while nm in used: nm = f'{base}{n}'; n += 1
    used.add(nm); colors[nm] = c
    e = {'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']}
    if ty['sliver']: e['small'] = True
    pieces.append(e); print(e, round(r, 3), round(k, 3))
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)

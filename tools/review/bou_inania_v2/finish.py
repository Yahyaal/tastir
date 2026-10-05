#!/usr/bin/env python3
"""Names the draft's pieces by where they sit and writes its expect block
(slivers marked small: they are the known mismatches, areas B and D).
Usage: finish.py <dump.json> tutorials/bou-inania-rosette.json"""
import json, math, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
pieces, colors, used = [], {}, set()
for i, ty in enumerate(d['types']):
    p = next(p for p in d['pieces'] if p['type'] == i)['polygon']
    c = (sum(q[0] for q in p) / len(p), sum(q[1] for q in p) / len(p)); r = math.hypot(*c)
    if r < 0.05: nm, col = 'star', 'b'
    elif ty['sliver']: nm, col = 'chip', 'ground'
    elif r < 0.6: nm, col = 'kite', 'a'
    elif r < 1.0: nm, col = 'petal', 'a'
    elif r < 1.25: nm, col = 'smallstar', 'a'
    elif r < 1.45: nm, col = 'pentagon', 'c'
    elif r < 1.85: nm, col = 'shield', 'b'
    else: nm, col = 'outer', 'd'
    base, n = nm, 2
    while nm in used: nm = f'{base}{n}'; n += 1
    used.add(nm); colors[nm] = col
    e = {'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']}
    if ty['sliver']: e['small'] = True
    pieces.append(e)
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
t['title'] = 'Bou Inania rosette, her way (draft)'
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(pieces), 'pieces')

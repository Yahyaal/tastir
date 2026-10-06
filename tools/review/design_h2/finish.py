#!/usr/bin/env python3
"""Names the pieces of the minbar-doors tutorial and writes its expect block
from the engine's dump. Usage: finish.py <dump.json> tutorials/<id>.json"""
import json, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
NAMES = {24: ('star', 'c'), 5: ('shield', 'a'), 4: ('kite', 'b'), 3: ('triangle', 'd')}
pieces, colors = [], {}
for ty in d['types']:
    nm, c = NAMES[ty['vertices']]
    colors[nm] = c
    e = {'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']}
    if ty['sliver']: e['small'] = True
    pieces.append(e); print(e)
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)

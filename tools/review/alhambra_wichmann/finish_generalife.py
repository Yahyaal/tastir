#!/usr/bin/env python3
"""Names the pieces of the Generalife ceiling and writes the expect block from
the engine's dump. Usage: finish_generalife.py <dump.json> tutorials/<id>.json"""
import json, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
def name(ty):
    if ty['vertices'] == 16: return 'star', 'c'
    if ty['vertices'] == 3: return 'triangle', 'c'
    return ('octagon', 'b') if ty['area'] > 1 else ('chevron', 'b')
pieces, colors = [], {}
for ty in d['types']:
    nm, c = name(ty); colors[nm] = c
    pieces.append({'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']})
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)
print(pieces)

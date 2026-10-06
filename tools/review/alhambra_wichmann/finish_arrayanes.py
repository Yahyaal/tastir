#!/usr/bin/env python3
"""Names the pieces of the Arrayanes squares and writes the expect block from
the engine's dump. Usage: finish_arrayanes.py <dump.json> tutorials/<id>.json"""
import json, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
NAMES = {4: ('square', 'c'), 14: ('band', 'ground'), 16: ('star', 'd')}
pieces, colors = [], {}
for ty in d['types']:
    nm, c = NAMES[ty['vertices']]; colors[nm] = c
    pieces.append({'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']})
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)
print(pieces)

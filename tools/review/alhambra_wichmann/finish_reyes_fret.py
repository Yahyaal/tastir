#!/usr/bin/env python3
"""Names the pieces of the Sala de los Reyes fret and writes the expect block
from the engine's dump. Usage: finish_reyes_fret.py <dump.json> tutorials/<id>.json"""
import json, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
NAMES = {22: ('bar', 'ground'), 24: ('cross', 'c'), 17: ('fret', 'c'), 16: ('small_cross', 'ground'), 4: ('diamond', 'a')}
pieces, colors = [], {}
for ty in d['types']:
    nm, c = NAMES[ty['vertices']]; colors[nm] = c
    pieces.append({'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']})
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)
print(pieces)

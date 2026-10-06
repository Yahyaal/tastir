#!/usr/bin/env python3
"""Names the pieces of the Comares dado, writes the expect block from the
engine's dump, and colours them as on the dado: white octagons, honey
hexagons, black squares, and the square at the cell corner (the first in the
player's count, nth 0) white.
Usage: finish_dado.py <dump.json> tutorials/<id>.json"""
import json, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
NAMES = {8: ('octagon', 'ground'), 6: ('hexagon', 'c'), 4: ('square', 'a')}
pieces, colors = [], {}
for ty in d['types']:
    nm, c = NAMES[ty['vertices']]
    colors[nm] = c
    pieces.append({'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']})
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
t['pattern']['placements'] = {'repeat': [1, 1], 'rules': [{'piece': 'square', 'nth': 0, 'color': 'ground'}]}
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)
print(pieces)

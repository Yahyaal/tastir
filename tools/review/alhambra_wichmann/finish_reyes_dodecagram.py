#!/usr/bin/env python3
"""Names the pieces of the Sala de los Reyes twelve-pointed stars and writes
the expect block, coloured as on the panel: black stars, honey and blue
six-sided pieces, white kites and hexagons.
Usage: finish_reyes_dodecagram.py <dump.json> tutorials/<id>.json"""
import json, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
def name(ty):
    v, a = ty['vertices'], ty['area']
    if v == 24: return 'star', 'a'
    if v == 4: return 'kite', 'ground'
    if a > 0.165: return 'honey', 'c'
    if a > 0.135: return 'blue', 'd'
    if a > 0.1: return 'hexagon', 'ground'
    return 'small_hexagon', 'ground'
pieces, colors = [], {}
for ty in d['types']:
    nm, c = name(ty); colors[nm] = c
    pieces.append({'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']})
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)
print(pieces)

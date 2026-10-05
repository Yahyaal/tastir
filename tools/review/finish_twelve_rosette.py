#!/usr/bin/env python3
"""Names the pieces of the twelve-fold rosette tutorials and writes their
expect block from the engine's dump (tools/review/dump.ts).

Usage: finish_twelve_rosette.py <dump.json> tutorials/<id>.json
"""
import json
import sys

dump, path = json.load(open(sys.argv[1])), sys.argv[2]
NAMES = {(24, 1): ('star', 'c'), (8, 1): ('cross', 'a'), (6, 12): ('outer', 'b'), (4, 12): ('petal', 'd'),
         (10, 4): ('bow', 'ground'), (10, 6): ('bow', 'ground'), (6, 2): ('kite', 'd')}
tut = json.load(open(path))
pieces, colors = [], {}
for ty in dump['types']:
    key = (ty['vertices'], ty['perCell'])
    if key == (6, 4):
        name, color = ('kite', 'd') if ty['area'] > 0.08 else ('wedge', 'a')
    else:
        name, color = NAMES[key]
    colors[name] = color
    e = {'name': name, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']}
    if ty['sliver']:
        e['small'] = True
    pieces.append(e)
tut['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
tut['pattern']['colors'] = colors
json.dump(tut, open(path, 'w'), ensure_ascii=False)

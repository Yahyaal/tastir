#!/usr/bin/env python3
"""Names the pieces of the Comares bath stars and writes the expect block from
the engine's dump. Usage: finish.py <dump.json> tutorials/<id>.json"""
import json, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
pieces, colors = [], {}
for ty in d['types']:
    if ty['vertices'] == 16:
        nm, c = ('star', 'a') if ty['area'] > 0.5 else ('small_star', 'c')
    elif ty['vertices'] == 12: nm, c = 'bar', 'b'
    else: nm, c = 'cross_arm', 'd'
    colors[nm] = c
    e = {'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']}
    if ty['sliver']: e['small'] = True
    pieces.append(e); print(e)
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)

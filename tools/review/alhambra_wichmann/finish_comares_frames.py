#!/usr/bin/env python3
"""Names the pieces of the Comares framed stars, writes the expect block, and
colours them as on the panel: teal ground pieces, black frame corners, and of
the two same-shaped stars the one at O honey, the one at the corner teal (told
apart by nth, counted as the player counts).
Usage: finish_comares_frames.py <dump.json> tutorials/<id>.json"""
import json, math, sys
d = json.load(open(sys.argv[1])); t = json.load(open(sys.argv[2]))
def name(ty):
    v, a = ty['vertices'], ty['area']
    if v == 18: return 'teal_star', 'b'
    if v == 16: return 'star', 'b'
    if v == 8: return ('teal_piece', 'b') if a > 0.12 else ('frame_corner', 'a')
    return ('diamond', 'b') if a < 0.032 else ('small_piece', 'b')
pieces, colors, names = [], {}, []
for ty in d['types']:
    nm, c = name(ty); names.append(nm); colors[nm] = c
    pieces.append({'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']})
o = d['cell']['corners'][0]; u = d['cell']['u']; v = d['cell']['v']; det = u[0]*v[1] - u[1]*v[0]
def ab(p):
    c = (sum(q[0] for q in p['polygon'])/len(p['polygon']), sum(q[1] for q in p['polygon'])/len(p['polygon']))
    dx, dy = c[0] - o[0], c[1] - o[1]
    return ((dx*v[1] - dy*v[0])/det, (u[0]*dy - u[1]*dx)/det), c
si = names.index('star')
ss = [p for p in d['pieces'] if p['type'] == si]
rules = []
for p in ss:
    (a, b), c = ab(p)
    n = sum(1 for q in ss if q is not p and (ab(q)[0][1] < b - 1e-6 or (abs(ab(q)[0][1] - b) <= 1e-6 and ab(q)[0][0] < a)))
    if math.hypot(*c) < 0.1: rules.append({'piece': 'star', 'nth': n, 'color': 'c'})
t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
t['pattern']['colors'] = colors
t['pattern']['placements'] = {'repeat': [1, 1], 'rules': rules}
json.dump(t, open(sys.argv[2], 'w'), ensure_ascii=False)
print(pieces, rules)

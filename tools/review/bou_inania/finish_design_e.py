#!/usr/bin/env python3
"""Names Design E's pieces, colors them as the photo and writes the expect
block (the golden test) from the engine's dump.

Usage: finish_design_e.py <dump.json> tutorials/bou-inania-twelve-fold-wall.json
"""
import json
import math
import sys

dump = json.load(open(sys.argv[1]))
tut = json.load(open(sys.argv[2]))


def where(t):
    """A piece type's place: the centre of one of its pieces, folded into the
    first eighth of the tile (OA = 1)."""
    pc = next(p for p in dump['pieces'] if p['type'] == t)
    n = len(pc['polygon'])
    x = abs(sum(q[0] for q in pc['polygon']) / n)
    y = abs(sum(q[1] for q in pc['polygon']) / n)
    return (max(x, y), min(x, y))


def name_of(t, typ):
    x, y = where(t)
    r = math.hypot(x, y)
    a = math.degrees(math.atan2(y, x))
    k = math.hypot(x - 1, y - 1)       # distance from the corner star
    v = typ['vertices']
    if r < 0.05:
        return 'centre', 'b'
    if k < 0.05:
        return 'cornerstar', 'b'
    if r < 0.25:
        return 'kite', 'a'
    if r < 0.45:
        return 'petal', 'a'
    if r < 0.6:
        return 'star', 'a'
    if r < 0.7:
        return 'pentagon', 'c'
    if r < 0.78 and a < 7.5:
        return 'shield', 'a'
    if r < 0.9 and abs(a - 15) < 7.5:
        return 'arrow', 'd'
    if abs(x - 1) < 1e-6 and y < 0.05:
        return 'cross', 'a'
    if abs(x - 1) < 1e-6 and v == 5 and k > 0.5:
        return 'arrowhead', 'a'
    if k < 0.35 and typ['area'] > 0.005:
        return ('arm', 'a') if v == 5 else ('diamond', 'a')
    if k < 0.5 and v == 6:
        return 'ring', 'c'
    return ('gap' if typ['area'] > 0.01 else 'chip'), 'ground'


# The photo's colors: black stars, petals and shields, orange pentagons and
# ring, blue arrows, teal centres, white for the rest.
COLORS = {'centre': 'b', 'cornerstar': 'b', 'petal': 'd', 'star': 'd', 'shield': 'd', 'kite': 'ground',
          'pentagon': 'a', 'ring': 'a', 'arrow': 'c', 'arrowhead': 'd', 'cross': 'd', 'arm': 'd',
          'diamond': 'ground', 'gap': 'ground', 'chip': 'ground'}
names = {}
pieces = []
for t, typ in enumerate(dump['types']):
    nm, slot = name_of(t, typ)
    assert nm not in names, (nm, t, where(t))
    names[nm] = slot
    e = {'name': nm, 'vertices': typ['vertices'], 'area': round(typ['area'], 5), 'perCell': typ['perCell']}
    if typ['sliver']:
        e['small'] = True
    pieces.append(e)
    print(t, nm, slot, typ['vertices'], typ['area'], typ['perCell'], 'small' if typ['sliver'] else '', where(t))
tut['pattern']['palette'] = 'Bou Inania'
tut['pattern']['colors'] = names
tut['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
json.dump(tut, open(sys.argv[2], 'w'), ensure_ascii=False)

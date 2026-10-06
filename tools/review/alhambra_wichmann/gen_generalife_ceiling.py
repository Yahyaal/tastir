#!/usr/bin/env python3
"""Builds the octagons and stars of a wooden ceiling in the Generalife
(Granada), drawn by Brian Wichmann in Tiling Search (data15/CM026) and
photographed by David Wade (SPA 0305): an octagon at each grid point, an
eight-pointed star at each corner of the cell, triangles and chevrons between,
all in interlaced bands.

Every band lies on one of four lines and their quarter turns: the side of the
octagon through the circle's diagonal point D, the line joining A and the top
of the circle, and two lines at 45° set off by KD = √2 − 1, the radius of the
corner stars.

Units: OA = 1, A halfway to the next octagon; the tile is the square cell.

Usage: gen_generalife_ceiling.py <research dir> tutorials/<id>.json
  (the research dir holds data15_CM026-centre.json from 2_centrelines.py, run
  with the large octagons as centres)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (crossings, circle_from, circle_through, el, ensure_point,  # noqa: E402
                          line_par, line_perp, line_through, meet, named_at, put,
                          repeat, step, steps)

sys.path.insert(0, os.path.dirname(__file__))
from gen_bath_stars import clip  # noqa: E402

S2 = math.sqrt(2)


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. An octagon sits at O and at every grid point two radii away; a star sits at each corner of the cell.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: the square cell. Rule its two diagonals through O.', highlight=['c', 'h'])
    line_perp('v', 'O', 'h')
    meet('P90', 'c', 'v', (0, 1))
    meet('P180', 'c', 'h', (-1, 0))
    meet('P270', 'c', 'v', (0, -1))
    line_perp('gx', 'A', 'h')
    line_perp('gxw', 'P180', 'h')
    line_perp('gy', 'P90', 'v')
    line_perp('gys', 'P270', 'v')
    meet('K', 'gx', 'gy', (1, 1))
    meet('K2', 'gxw', 'gy', (-1, 1))
    meet('K3', 'gxw', 'gys', (-1, -1))
    meet('K4', 'gx', 'gys', (1, -1))
    line_through('d45', 'O', 'K')
    line_through('d135', 'O', 'K2')

    step('Mark where the diagonal crosses the circle, at D, and rule the vertical through D: a side of the octagon. Join A to the top of the circle: a slanting side of the octagon, which runs on to the corner stars.', 'ruler', ['d45'])
    meet('D', 'c', 'd45', (1 / S2, 1 / S2))
    line_par('o1', 'D', 'v')
    line_through('o2', 'A', 'P90')

    step('Open the compass from D to the corner K: it is the radius of the corner stars. Mark it on the horizontal from O, at S, and carry S across A, at S2. Through S rule the line at 45° and through S2 the line at 135°: sides of the corner stars.', 'compass', ['D', 'K'])
    circle_from('cs', 'O', 'D', 'K')
    meet('S', 'cs', 'h', (S2 - 1, 0))
    circle_through('ca', 'A', 'S')
    meet('S2', 'ca', 'h', (3 - S2, 0))
    line_par('s1', 'S', 'd45')
    line_par('s2', 'S2', 'd135')

    step('Turn these four lines about O by quarter turns, so the cell has them on every side.')
    repeat('cp', ['o1', 'o2', 's1', 's2'], 'rot4')


def network(research):
    d = json.load(open(os.path.join(research, 'data15_CM026-centre.json')))
    lines = [n for n, (k, _) in el.items() if k == 'line']

    def snap(p):
        best = None
        for i, a in enumerate(lines):
            (q, u) = el[a][1]
            if abs((p[0] - q[0]) * u[1] - (p[1] - q[1]) * u[0]) > 0.006:
                continue
            for b in lines[i + 1:]:
                for c in crossings(a, b):
                    e = math.dist(c, p)
                    if e < 0.006 and (best is None or e < best[0]):
                        best = (e, c)
        return best[1] if best else None
    segs = set()
    for Q in d['pieces']:
        if max(abs(v) for q in Q for v in q) > 3:
            continue
        for i in range(len(Q)):
            for a, b in clip([(Q[i], Q[(i + 1) % len(Q)])]):
                sa, sb = snap(a), snap(b)
                assert sa and sb, ('corner off the construction', a, b)
                if math.dist(sa, sb) > 1e-6:
                    segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


def main():
    research, out = sys.argv[1], sys.argv[2]
    build()
    segs = network(research)
    step('Mark the corners of the pattern: every point where a band turns, crosses another or ends.', 'fade')
    names = {}
    for a, b in segs:
        for z in (a, b):
            k = (round(z[0], 7), round(z[1], 7))
            if k not in names:
                names[k] = named_at(z, 1e-7) or ensure_point(z, 'M')
    paths = [{'through': [names[(round(a[0], 7), round(a[1], 7))], names[(round(b[0], 7), round(b[1], 7))]]} for a, b in segs]
    step('The tile is the square cell.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'generalife-ceiling', 'title': 'Octagons and stars of a Generalife ceiling (Granada)', 'fold': 4,
        'style': 'Nasrid', 'level': 'beginner',
        'credits': [
            {'source': 'Tiling Search, data15/CM026: Generalife, Granada', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM026.html',
             'note': 'The design was read from his line drawing; the construction is ours.'},
            {'source': 'Photograph SPA 0305 (wooden ceiling, Generalife)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real ceiling, used to check the wall.'}],
        'given': {'O': 'The centre of an octagon.', 'A': 'Halfway from O to the next octagon.'},
        'steps': steps,
        'ink': {'text': 'Ink the bands: round each octagon, round each corner star, and across between them, all interlaced.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: octagons on the grid, stars where four cells meet, and triangles and chevrons between, held in interlaced bands.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

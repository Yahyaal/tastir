#!/usr/bin/env python3
"""Builds the carved fret of the Sala de los Reyes (Alhambra), drawn by Brian
Wichmann in Tiling Search (data8/PG365) and photographed by David Wade
(SPA 0405x): bars and hooked frets in a pinwheel round a cross at O, with a
small diamond at each crossing of the bands.

Every line is either horizontal or vertical at an odd multiple of 1/6 of OA,
or diagonal in pairs either side of the diagonals through the thirds: the
sides of small diamonds centred at (1/3, 0), (1, 0), (5/3, 0)… whose half
diagonal is e = (1 − 1/√2)/3. The diamond's corner nearest O is √2/6 from O,
where the circle about O through (1/6, 1/6) crosses the horizontal. The
pattern turns into itself by a quarter turn but has no mirror (chiral).
All 42 diamonds on Wade's photo fit the construction's diamonds, same hand.

Units: OA = 1, A halfway to the next cross; the tile is the square cell.

Usage: gen_reyes_fret.py <research dir> tutorials/<id>.json
  (the research dir holds data8_PG365-centre.json, from 2_centrelines.py run
  with the crosses (24-cornered pieces) as centres)
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
E = (1 - 1 / S2) / 3


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A cross will sit at O and at every point of the grid two radii away.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: the square cell. Rule its diagonal through O and the corner K.', highlight=['c', 'h'])
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

    step('Divide OA into thirds. Rule the line from the bottom corner K4 to the top of the circle: it crosses the diagonal at T, a third of the way to K. Rule a vertical and a horizontal through T; they meet the horizontal and vertical through O at D and D′, a third of OA from O.', 'ruler', ['K4', 'P90'])
    line_through('kp', 'K4', 'P90')
    meet('T', 'kp', 'd45', (1 / 3, 1 / 3))
    line_par('tv', 'T', 'v')
    line_par('th', 'T', 'h')
    meet('D', 'tv', 'h', (1 / 3, 0))
    meet('D2', 'th', 'v', (0, 1 / 3))

    step('Join D and D′: the line crosses the diagonal at S, a sixth of the way to K. Join A to the top of the circle: it crosses the diagonal halfway, at H. Draw the circle about H through S; it crosses the diagonal again at S′, five sixths of the way.', 'compass')
    line_through('dd', 'D', 'D2')
    meet('S', 'dd', 'd45', (1 / 6, 1 / 6))
    line_through('ap', 'A', 'P90')
    meet('H', 'ap', 'd45', (0.5, 0.5))
    circle_through('ch', 'H', 'S')
    meet('S5', 'ch', 'd45', (5 / 6, 5 / 6))

    step('Through S, H and S′ rule horizontals: the lines of the bands at a sixth, a half and five sixths of OA above O.')
    line_par('y1', 'S', 'h')
    line_par('y3', 'H', 'h')
    line_par('y5', 'S5', 'h')

    step('Draw the circle about O through S. Where it crosses the horizontal, at E1, is the inner corner of a small diamond centred at D. Draw the circle about D through E1: it marks the diamond’s outer corner E2.', 'compass', ['O', 'S'])
    circle_through('cs', 'O', 'S')
    meet('E1', 'cs', 'h', (S2 / 6, 0))
    circle_through('cd', 'D', 'E1')
    meet('E2', 'cd', 'h', (1 / 3 + E, 0))

    step('The same diamond sits round A and two thirds beyond it. Open the compass to DE1 and mark it either side of A; then put the compass on A and carry E1 and E2 across to the far side.', 'compass', ['A'])
    circle_from('ca', 'A', 'D', 'E1')
    meet('F1', 'ca', 'h', (1 - E, 0))
    meet('F2', 'ca', 'h', (1 + E, 0))
    circle_through('ca2', 'A', 'E2')
    meet('G1', 'ca2', 'h', (5 / 3 - E, 0))
    circle_through('ca3', 'A', 'E1')
    meet('G2', 'ca3', 'h', (5 / 3 + E, 0))

    step('Through each of the six marks rule the two lines at 45° to the horizontal: the sides of the diamonds, carried on as the slanting edges of the frets.')
    line_perp('d135', 'O', 'd45')
    names = []
    for p in ('E1', 'E2', 'F1', 'F2', 'G1', 'G2'):
        line_par(f'{p}a', p, 'd45')
        line_par(f'{p}b', p, 'd135')
        names += [f'{p}a', f'{p}b']

    step('Turn all these lines about O by quarter turns, so the cell has them in every direction.')
    repeat('cp', ['y1', 'y3', 'y5'] + names, 'rot4')


def network(research):
    d = json.load(open(os.path.join(research, 'data8_PG365-centre.json')))
    lines = [n for n, (k, _) in el.items() if k == 'line']

    def snap(p):
        best = None
        for i, a in enumerate(lines):
            (q, u) = el[a][1]
            if abs((p[0] - q[0]) * u[1] - (p[1] - q[1]) * u[0]) > 0.006:
                continue
            for b in lines[i + 1:]:
                for c in crossings(a, b):
                    dd = math.dist(c, p)
                    if dd < 0.006 and (best is None or dd < best[0]):
                        best = (dd, c)
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
    step('Mark the corners of the pattern: every point where a groove turns, crosses another or ends.', 'fade')
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
        'format': 0, 'id': 'alhambra-reyes-fret', 'title': 'Carved fret of the Sala de los Reyes (Alhambra)', 'fold': 4, 'chiral': True,
        'style': 'Nasrid', 'level': 'advanced',
        'credits': [
            {'source': 'Tiling Search, data8/PG365: Alhambra, Sala de los Reyes', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data8/PG365.html',
             'note': 'The design was read from his line drawing; the construction (sixths of OA and small diamonds found with the compass) is ours.'},
            {'source': 'Photograph SPA 0405x (carved plaster, Sala de los Reyes)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real panel, used to check the wall.'}],
        'given': {'O': 'The centre of a cross.', 'A': 'Halfway from O to the next cross.'},
        'steps': steps,
        'ink': {'text': 'Ink the grooves: the cross at O, the long bars and the hooked frets that turn round it, and the small diamonds where the bands cross.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: the frets lock into a pinwheel round each cross, with a small diamond at every crossing.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

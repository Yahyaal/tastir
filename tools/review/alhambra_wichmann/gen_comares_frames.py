#!/usr/bin/env python3
"""Builds the interlaced stars and frames of the Salón de Comares (Alhambra),
drawn by Brian Wichmann in Tiling Search (data174/SPA1416) and photographed by
David Wade (SPA 1416): an eight-pointed star in a square frame at each grid
point, a second star at each corner of the cell, small diamonds halfway
between, and white bands interlaced between them.

Both stars are two squares on a circle of radius R = 1 − 1/√2. The frame round
the star at O lies where the diagonal through the star's point crosses the
horizontal through its inner corner; the diamonds' half-diagonal is the
distance from that inner corner to the star's point.

Units: OA = 1, A halfway to the next framed star; the tile is the square cell.

Usage: gen_comares_frames.py <research dir> tutorials/<id>.json
  (the research dir holds data174_SPA1416-centre.json from 2_centrelines.py,
  run with the honey stars as centres)
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
R = 1 - 1 / S2
A_ = R / S2
B = 2 * R - A_
C = S2 * (R - A_)


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A framed star sits at O and at every grid point two radii away, and a plain star at each corner of the cell.', 'compass')
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

    step('Mark where the diagonal crosses the circle, at D, and drop a vertical from D to the horizontal, at E. Draw the circle about A through E, and the circle about O with the same radius: it is the circle of the stars, and it crosses the horizontal at T, the star’s point.', 'compass')
    meet('D', 'c', 'd45', (1 / S2, 1 / S2))
    line_perp('dv', 'D', 'h')
    meet('E', 'dv', 'h', (1 / S2, 0))
    circle_from('cs', 'O', 'E', 'A')
    meet('T', 'cs', 'h', (R, 0))

    step('The star is two squares in this circle. One has its corners on the horizontal and vertical: through T rule the two lines at 45°. The other has its corners on the diagonals: where the circle meets the diagonal, at Q, rule a vertical and a horizontal.', 'ruler', ['cs'])
    line_par('e1', 'T', 'd135')
    line_par('e2', 'T', 'd45')
    meet('Q', 'cs', 'd45', (A_, A_))
    line_par('x1', 'Q', 'v')

    step('The vertical through Q meets the 45° line through T at V, an inner corner of the star. Rule the horizontal through V; it meets the other line through T at F. The vertical through F is a side of the star’s frame.', 'ruler', ['Q', 'T'])
    meet('V', 'x1', 'e1', (A_, R - A_))
    line_par('vh', 'V', 'h')
    meet('F', 'vh', 'e2', (B, R - A_))
    line_par('fr', 'F', 'v')

    step('The stars at the corners of the cell, and the next framed stars, have the same lines. Drop Q onto the horizontal; open the compass from O to that foot and mark the distance either side of A, and carry T across A. The verticals and slanting lines through the marks belong to those stars.', 'compass', ['A'])
    meet('Qh', 'x1', 'h', (A_, 0))
    circle_from('cq', 'A', 'O', 'Qh')
    meet('Q1', 'cq', 'h', (1 - A_, 0))
    meet('Q2', 'cq', 'h', (1 + A_, 0))
    line_par('x2', 'Q1', 'v')
    line_par('x3', 'Q2', 'v')
    circle_through('ct', 'A', 'T')
    meet('T2', 'ct', 'h', (2 - R, 0))
    line_par('e3', 'T2', 'd135')

    step('A small diamond sits on each side of the cell. Open the compass from V to T and mark that distance either side of A: the diamond’s corners. Through them rule the lines at 45°.', 'compass', ['V', 'T'])
    circle_from('cc', 'A', 'V', 'T')
    meet('G1', 'cc', 'h', (1 - C, 0))
    meet('G2', 'cc', 'h', (1 + C, 0))
    line_par('g1', 'G1', 'd135')
    line_par('g2', 'G2', 'd135')

    step('Turn all these lines about O by quarter turns, so the cell has them on every side.')
    repeat('cp', ['e1', 'e2', 'x1', 'fr', 'x2', 'x3', 'e3', 'g1', 'g2'], 'rot4')


def network(research):
    d = json.load(open(os.path.join(research, 'data174_SPA1416-centre.json')))
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
        'format': 0, 'id': 'alhambra-comares-frames', 'title': 'Framed stars of the Salón de Comares (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'advanced',
        'credits': [
            {'source': 'Tiling Search, data174/SPA1416: Alhambra, Salón de Comares', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data174/SPA1416.html',
             'note': 'The design was read from his line drawing; the construction (one star circle, its frame and the diamonds found from the star’s own corners) is ours.'},
            {'source': 'Photograph SPA 1416 (zellige, Salón de Comares)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real panel, used to check the wall.'}],
        'given': {'O': 'The centre of a framed star.', 'A': 'Halfway from O to the next framed star.'},
        'steps': steps,
        'ink': {'text': 'Ink the bands: round each star, round the frame at O, round the small diamonds, and across between them, all interlaced.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: framed stars on the grid, plain stars at the corners, and diamonds on the sides, all held in interlaced bands.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

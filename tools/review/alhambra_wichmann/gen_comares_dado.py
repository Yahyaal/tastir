#!/usr/bin/env python3
"""Builds the zellige dado of the Salón de Comares (Alhambra): octagons on a
square grid, a long hexagon between each two neighbours, and at each corner of
the cell a small square ringed by four more. Drawn by Brian Wichmann in Tiling
Search (data5/J43A) and photographed by David Wade (SPA 0204).

Every edge lies on a line at 0°, 45° or 90° set by one length t, the
half-diagonal of the corner square. The line from the cell's corner (−1, 1)
through the point where the 45° diagonal crosses the circle meets the right
side of the cell at height 1 − t, which gives t = 6 − 4√2 = 0.3431; Wichmann's
drawing has 0.3428 ± 0.0005.

Units: OA = 1, A halfway to the next octagon; the tile is the square cell.

Usage: gen_comares_dado.py <research dir> tutorials/<id>.json
  (the research dir holds data5_J43A-pieces.json from 1_pieces.py)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (crossings, circle_through, el, ensure_point, line_par,  # noqa: E402
                          line_perp, line_through, meet, named_at, put, repeat, step, steps)

sys.path.insert(0, os.path.dirname(__file__))
from gen_bath_stars import clip  # noqa: E402

S2 = math.sqrt(2)
T = 6 - 4 * S2


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. An octagon will sit at O and at every point two radii away along the grid.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: the square cell. A small square will sit at each of its corners.', highlight=['c', 'h'])
    line_perp('v', 'O', 'h')
    meet('P0', 'c', 'h', (1, 0))
    meet('P180', 'c', 'h', (-1, 0))
    meet('P90', 'c', 'v', (0, 1))
    meet('P270', 'c', 'v', (0, -1))
    line_perp('gx', 'P0', 'h')
    line_perp('gxw', 'P180', 'h')
    line_perp('gy', 'P90', 'v')
    line_perp('gys', 'P270', 'v')
    meet('K', 'gx', 'gy', (1, 1))
    meet('K2', 'gxw', 'gy', (-1, 1))
    meet('K3', 'gxw', 'gys', (-1, -1))
    meet('K4', 'gx', 'gys', (1, -1))

    step('Rule the diagonal through O and the corner K, and mark where it crosses the circle. From the opposite corner of the top side, K2, rule a line through that mark: it meets the right side of the cell a little below K, at T.', 'ruler', ['K2'])
    line_through('d45', 'O', 'K')
    meet('D', 'c', 'd45', (1 / S2, 1 / S2))
    line_through('kd', 'K2', 'D')
    meet('T', 'kd', 'gx', (1, 1 - T))

    step('Draw the circle about K through T. It meets the top of the cell at U, as far from K as T is: KT is half the diagonal of the small square at the corner. Join T and U: a side of that square.', 'compass', ['K', 'T'])
    circle_through('ck', 'K', 'T')
    meet('U', 'ck', 'gy', (1 - T, 1))
    line_through('f1', 'T', 'U')

    step('Through U rule a vertical and through T a horizontal: the sides of the octagon and of the long hexagons. Through T and U rule lines parallel to the diagonal: the sides of the squares round the corner and the ends of the hexagons.', 'ruler', ['T', 'U'])
    line_par('x1', 'U', 'v')
    line_par('y1', 'T', 'h')
    line_par('e1', 'T', 'd45')
    line_par('e2', 'U', 'd45')

    step('Where the new vertical meets the lower diagonal line, and where the new horizontal meets the upper one, are two corners of the octagon. Join them: the octagon’s slanting side, which also closes the square below the corner one.')
    meet('V1', 'x1', 'e1', (1 - T, 1 - 2 * T))
    meet('V2', 'y1', 'e2', (1 - 2 * T, 1 - T))
    line_through('f2', 'V1', 'V2')

    step('Copy these lines to the other three corners of the cell, turning them about O.')
    repeat('cp', ['f1', 'x1', 'y1', 'e1', 'e2', 'f2'], 'rot4')


def network(research):
    """Wichmann's piece edges in tutorial units, clipped to the cell and each
    corner moved onto the crossing of the construction's lines it lies on."""
    ps = json.load(open(os.path.join(research, 'data5_J43A-pieces.json')))
    octs = [p for p in ps if len(p['poly']) == 8]
    c0 = min((p['c'] for p in octs), key=lambda c: math.dist(c, (306, 396)))
    u = sorted(math.dist(c0, p['c']) for p in octs if p['c'] != c0)[0] / 2
    lines = [n for n, (k, _) in el.items() if k == 'line']

    def snap(p):
        best = None
        for i, a in enumerate(lines):
            (q, d) = el[a][1]
            if abs((p[0] - q[0]) * d[1] - (p[1] - q[1]) * d[0]) > 0.01:
                continue
            for b in lines[i + 1:]:
                for c in crossings(a, b):
                    dd = math.dist(c, p)
                    if dd < 0.01 and (best is None or dd < best[0]):
                        best = (dd, c)
        return best[1] if best else None
    segs = set()
    for p in ps:
        Q = [((x - c0[0]) / u, -(y - c0[1]) / u) for x, y in p['poly']]
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
    step('Mark the corners of the pattern: every point where the outline of a tile turns.', 'fade')
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
        'format': 0, 'id': 'alhambra-comares-dado', 'title': 'Octagons and hexagons of the Comares dado (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'beginner',
        'credits': [
            {'source': 'Tiling Search, data5/J43A: Alhambra, Salón de Comares', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data5/J43A.html',
             'note': 'The design was read from his line drawing; the construction (one length found by a single line from a corner of the cell) is ours.'},
            {'source': 'Photograph SPA 0204 (zellige dado of the Salón de Comares)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real dado, used to check the wall.'}],
        'given': {'O': 'The centre of an octagon.', 'A': 'Halfway from O to the next octagon.'},
        'steps': steps,
        'ink': {'text': 'Ink the outline of each tile: the octagon, the halves of the long hexagons on the cell’s sides, and the squares at its corners.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: octagons on the grid, a long hexagon between each two, and five small squares in a cross where four cells meet.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

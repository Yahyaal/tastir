#!/usr/bin/env python3
"""Builds the stars and squares of a tile photographed by Alberto Leon, drawn
by Brian Wichmann in Tiling Search (data194/LEON10).

It is the design of the Patio de los Arrayanes squares (PG299,
alhambra-arrayanes-squares) with other proportions: the same small squares
touch the stars' points, joined by the same ten-sided bands, but here the
stars are large and the squares small. So it uses that tutorial's frame and
its first two steps (the square tile JKLN), copied from its JSON.

Read from the PDF (plain tiles, axis period 288.46 pt), every corner snapped
to the grid a + b·√2/2 (worst error 0.001 of OA) in the Arrayanes frame:
OA = period / (2√2), stars at O and two units away on the diagonals, squares
at J, K, L and N. The star at O is two squares of half-side a = 2 − √2.
Inside the tile every edge lies on a side of that star carried on to the
tile's sides; the next stars' sides fall in the neighbouring tiles.

Usage: gen_leon10_tile_stars.py <LEON10-pieces.json> tutorials/<id>.json
       pnpm review <id>
       gen_leon10_tile_stars.py finish docs/review/<id>/dump.json tutorials/<id>.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)
ID = 'leon-tile-stars'
UNIT = 288.46 / (2 * R2)
a = 2 - R2
HERE = os.path.dirname(os.path.abspath(__file__))
ARRAYANES = os.path.join(HERE, '..', '..', '..', 'tutorials', 'alhambra-arrayanes-squares.json')


def opening():
    """Steps 1 and 2 of the Arrayanes squares, built here for the helpers and
    then replaced by that tutorial's own JSON."""
    g.given()
    step('opening')
    put('c', 'circle', ((0, 0), 1.0), {})
    g.line_through('h', 'O', 'A')
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.meet('B', 'c', 'h', (-1, 0))
    g.meet('D', 'c', 'v', (0, -1))
    g.line_perp('gx', 'A', 'h')
    g.line_perp('gxw', 'B', 'h')
    g.line_perp('gy', 'C', 'v')
    g.line_perp('gys', 'D', 'v')
    g.meet('E', 'gx', 'gy', (1, 1))
    g.meet('F', 'gxw', 'gy', (-1, 1))
    g.meet('G', 'gxw', 'gys', (-1, -1))
    g.meet('H', 'gx', 'gys', (1, -1))
    g.line_through('d45', 'O', 'E')
    g.line_through('d135', 'O', 'F')
    g.circle_through('cd', 'O', 'E')
    g.meet('J', 'cd', 'h', (R2, 0))
    g.meet('K', 'cd', 'v', (0, R2))
    g.meet('L', 'cd', 'h', (-R2, 0))
    g.meet('N', 'cd', 'v', (0, -R2))
    g.line_through('w1', 'J', 'K')
    g.line_through('w2', 'K', 'L')
    g.line_through('w3', 'L', 'N')
    g.line_through('w4', 'N', 'J')


def build():
    opening()
    step('Draw a circle with centre A through J. It crosses the horizontal line at P. '
         'Draw a vertical line through P. Turn it round O by 90°, three times. '
         'The four lines make a square round O.', 'compass', ['A', 'J'])
    g.circle_through('ca', 'A', 'J')
    g.meet('P', 'ca', 'h', (a, 0))
    g.line_par('pv', 'P', 'v')
    g.repeat('pp', ['pv'], 'rot4')

    step('The vertical line through P crosses the line from O to E at Q. '
         'Draw a circle with centre O through Q. It crosses the horizontal line at R. '
         'Draw the line through R parallel to the line through J and K. Turn it round O by 90°, three times. '
         'These lines and the square round O make the star at O.', 'compass', ['P', 'd45'])
    g.meet('Q', 'pv', 'd45', (a, a))
    g.circle_through('cq', 'O', 'Q')
    g.meet('R', 'cq', 'h', (a * R2, 0))
    g.line_par('rd', 'R', 'w1')
    g.repeat('rp', ['rd'], 'rot4')


def drawing(pieces):
    """Wichmann's tiles in the frame, origin at the star nearest the middle of the page."""
    ps = [p for p in json.load(open(pieces)) if len(p['poly']) == 16]
    o = min((p['c'] for p in ps), key=lambda c: math.dist(c, (300, 300)))
    return cm.frame_pieces(pieces, o, 2 * UNIT, 0)


def network(polys):
    """cm.network for the diamond tile JKLN: clip in a frame turned by 45°."""
    rot = lambda p, s: ((p[0] + s * p[1]) / R2, (p[1] - s * p[0]) / R2)  # noqa: E731
    segs = set()
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > 3:
            continue
        for i in range(len(Q)):
            e = [(rot(Q[i], 1), rot(Q[(i + 1) % len(Q)], 1))]
            for a_, b_ in cm.clip(e, 1.0):
                sa, sb = cm.snap(rot(a_, -1)), cm.snap(rot(b_, -1))
                assert sa and sb, ('corner off the construction', a_, b_)
                if math.dist(sa, sb) > 1e-6:
                    segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    paths = cm.along_ink(network(drawing(pieces)))
    shared = json.load(open(ARRAYANES))['steps'][:2]
    # here the diagonals are helpers, so the part that draws them needs a text without them
    shared[1]['parts'][2]['textWithoutHelpers'] = (
        'Draw a circle with centre O through E. This circle crosses the horizontal line at J and L, '
        'and the vertical line at K and N.')
    steps = shared + cm.steps[1:]
    for i, s in enumerate(steps):
        s['id'] = i + 1
    steps.append({'id': len(steps) + 1, 'text': 'The square JKLN is the tile that repeats.',
                  'create': {'tile': {'polygon': ['J', 'K', 'L', 'N']}}, 'animate': 'fade'})
    tut = {
        'format': 0, 'id': ID,
        'title': 'Stars and squares of a tile photographed by Alberto Leon',
        'short': 'Leon tile stars', 'subtitle': 'Tile for sale, photo by Alberto Leon', 'fold': 4, 'star': 8,
        'style': 'Moroccan', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s LEON10 drawing, its corners snapped to exact '
                    'values. It is the design of the Patio de los Arrayanes squares with larger stars and smaller '
                    'squares, so it starts with the same steps. We devised the construction. The drawing gives no '
                    'steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. The place of the '
                       'tile is not known, and no photo of it was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data194/LEON10: Tile for sale', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data194/LEON10.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of a tile for sale, from a photo sent to him by Alberto '
                     'Leon. He links it with the Patio de los Arrayanes in the Alhambra. The construction is ours.'}],
        'given': {'O': 'The centre of a star.',
                  'A': 'The unit length. The next stars are two units from O on the lines at 45° through O.'},
        'steps': steps,
        'ink': {'text': 'Ink the star at O. Ink the sides of its outer square, carried on to the sides of the tile. '
                        'These lines close the small squares at J, K, L and N and the bands between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the tile side by side. A small square sits between each four stars, '
                            'touching their points, and bands with ten sides join the squares.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 1.608): ('star', 'b'), (10, 0.853): ('band', 'ground'), (4, 0.686): ('square', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)

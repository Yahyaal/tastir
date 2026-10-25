#!/usr/bin/env python3
"""Builds the wooden doors of the Patio de los Leones (Alhambra), drawn by
Brian Wichmann in Tiling Search (data164/A233): eight-pointed stars of two
squares, one at O and one at each corner of the square cell, all the same
size; arrows pointing at the stars on the grid, long hexagons between them,
kites and triangles.

Read from the PDF (star spacing 222.5 pt, band 12 pt), every corner snapped to
the grid a + b·√2/2 in units of half the star spacing (worst error 0.0013).
Wichmann draws the design turned by 45° from the doors: here it is turned
back, as on Wade's photo SPA 0424x, so that the hexagons lie along the cell's
axes and the tile is the square cell. Then every line is a side of the star
at O or of a corner star, carried on, and both stars have tip radius √2 − 1,
the distance from the corner K1 to F, where the circle crosses OK1. This is the
layout of the Comares bath stars (alhambra-bath-stars: a star at O and one at
each corner, every side carried on) with the two stars made equal.

Units: OA = 1, A halfway to the next star on the grid; the tile is the square cell.

Usage: gen_leones_door_stars.py <A233-pieces.json> tutorials/alhambra-leones-door-stars.json
       pnpm review alhambra-leones-door-stars
       gen_leones_door_stars.py finish docs/review/alhambra-leones-door-stars/dump.json tutorials/alhambra-leones-door-stars.json
(A233-pieces.json from 0_vectors.py and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)
R = R2 - 1          # the stars' tip radius
H = R2 / 2
DIRS = ((0, 'h'), (45, 'd45'), (90, 'v'), (135, 'd135'), (180, 'h'), (225, 'd45'), (270, 'v'), (315, 'd135'))


def star_points(prefix, circle, r):
    pts = []
    for i, (a, ln) in enumerate(DIRS):
        nm = f'{prefix}{i + 1}'
        g.meet(nm, circle, ln, (r * math.cos(math.radians(a)), r * math.sin(math.radians(a))))
        pts.append(nm)
    return pts


def two_squares(pts, prefix, texts):
    """The two squares of a star through pts (S1 to S8), as two parts of the
    current step; each side a full line."""
    st = cm.steps[-1]
    del st['create']
    st['parts'] = []
    for k, text in enumerate(texts):
        p = {'text': text, 'create': {}, 'animate': 'ruler'}
        st['parts'].append(p)
        g.cur = p
        for i in range(4):
            a, b = pts[k + 2 * i], pts[(k + 2 * i + 2) % 8]
            g.line_through(f'{prefix}{k}{i + 1}', a, b)


def square_texts(names, where):
    s = names
    return ['Draw a straight line through {0} and {2}, {2} and {4}, {4} and {6}, and {6} and {0}. '.format(*s) + where,
            'Draw a straight line through {1} and {3}, {3} and {5}, {5} and {7}, and {7} and {1}. '.format(*s) + where]


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw a circle with centre K1 through F. '
         'Draw a circle with centre O and the same radius.', 'compass', ['K1'])
    g.meet('F', 'c', 'd45', (H, H))
    g.circle_through('ck', 'K1', 'F')
    cm.circle_radius_of('cs', 'O', 'ck')

    step('Draw the line through O at 90° to the line from O to K1. '
         'The small circle with centre O crosses the four lines through O at S1 to S8.', 'ruler', ['cs'])
    g.line_perp('d135', 'O', 'd45')
    pts = star_points('S', 'cs', R)

    step('Draw the star at O as two squares.', 'ruler', ['cs'])
    two_squares(pts, 'q', square_texts(pts, 'Draw each line long, to the sides of the cell.'))

    step('The same star sits at each corner of the cell. Draw a vertical line through F. '
         'The circle with centre K1 crosses the vertical line through A at P. '
         'It crosses the horizontal line through C at Q. '
         'Draw a straight line through P and Q.', 'ruler', ['F', 'ck'])
    g.line_par('fv', 'F', 'v')
    g.meet('P', 'ck', 'gx', (1, 2 - R2))
    g.meet('Q', 'ck', 'gy', (2 - R2, 1))
    g.line_through('pq', 'P', 'Q')

    step('Turn the two lines of the last step round O by 90°, three times. '
         'They are sides of the stars at K1, K2, K3 and K4.')
    g.repeat('cp', ['fv', 'pq'], 'rot4')


def drawing(pieces):
    """Wichmann's band centre lines in the tutorial's frame."""
    ps = json.load(open(pieces))
    stars = sorted((p['c'] for p in ps if len(p['poly']) == 16), key=lambda c: math.dist(c, (297.5, 375.3)))
    origin = stars[0]
    period = min(math.dist(c, origin) for c in stars[1:])
    polys = cm.frame_pieces(pieces, origin, period, 12.0)
    # Turn his drawing by 45° and scale it by 1/√2: his neighbouring star
    # (2, 0) goes to the cell corner (1, -1).
    return [[((x + y) / 2, (y - x) / 2) for x, y in P] for P in polys]


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(drawing(pieces))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-leones-door-stars',
        'title': 'Stars and arrows of the Patio de los Leones doors (Alhambra)',
        'short': 'Leones door stars', 'subtitle': 'Patio de los Leones, Alhambra', 'fold': 4, 'star': 8,
        'style': 'Nasrid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s A233 drawing, its corners snapped to exact '
                    'values. We devised the construction: a star at O and one at each corner of the cell, both the '
                    'same size, and every line a side of one of them, carried on. The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 45°; it is turned back here, as the doors stand on David '
                       'Wade’s photo, so that the tile is the square cell. The compass steps, their order and the '
                       'named points are ours. The comparison with the drawing checks the finished lines, not how the '
                       'design was first laid out.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data164/A233: Alhambra, Patio de los Leones', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data164/A233.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of the wooden doors in the north-east corner of the Patio '
                     'de los Leones. He lists the same repeat on a Marrakesh leather binding (1256), on Toledo '
                     'tin-glazed ware and on the minaret of San Juan de los Reyes in Granada. The construction is ours.'},
            {'source': 'Photograph SPA 0424x (Patio de los Leones)', 'creator': 'David Wade',
             'url': 'https://patterninislamicart.com/', 'kind': 'photo',
             'note': 'The real doors, compared by eye with the wall: the same stars, hexagons, arrows and triangles.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the bands that carry the stars’ sides on. Each band turns where it '
                        'reaches the next star. They close the arrows, the long hexagons, the kites and the triangles.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every corner of every cell, '
                            'and a long hexagon joins each two stars along the lines.',
                    'palette': 'Alhambra', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.402): ('star', 'a'), (6, 0.515): ('hexagon', 'b'), (8, 0.314): ('arrow', 'c'),
         (4, 0.071): ('kite', 'ground'), (3, 0.086): ('triangle', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)

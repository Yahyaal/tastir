#!/usr/bin/env python3
"""Builds the stucco soffits of the Salón de Comares (Alhambra), drawn by
Brian Wichmann in Tiling Search (data187/AL1): interlaced eight-pointed stars,
one at O and one at each corner of the square cell, all the same size, with
arrows pointing at the stars on the grid and a large sixteen-sided ground
between them.

Read from the PDF (star spacing 204.81 pt, band 15 pt), every corner snapped
to the grid a + b·√2/2 in units of a quarter of the star spacing (worst error
0.0024). As with A233 (gen_leones_door_stars.py), Wichmann draws it turned by
45°; turned back, the tile is the square cell, every line is a side of the
star at O or of a corner star, carried on, and both stars have tip radius ½
(A233: √2 − 1). It is the same layout as the Patio de los Leones doors with
larger stars and fewer lines inked: the hexagons, kites and triangles there
are one ground piece here.

The tip radius ½ comes from H, where line AC crosses OK1: the vertical
through H crosses the horizontal at M, halfway to A.

Units: OA = 1, A halfway to the next star on the grid; the tile is the square cell.

Usage: gen_comares_soffit_stars.py <AL1-pieces.json> tutorials/alhambra-comares-soffit-stars.json
       pnpm review alhambra-comares-soffit-stars
       gen_comares_soffit_stars.py finish docs/review/alhambra-comares-soffit-stars/dump.json tutorials/alhambra-comares-soffit-stars.json
(AL1-pieces.json from 0_vectors.py and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_leones_door_stars import square_texts, star_points, two_squares  # noqa: E402

R = 0.5             # the stars' tip radius
H = math.sqrt(2) / 4


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a straight line through A and C. It crosses the line from O to K1 at H. '
         'Draw a vertical line through H. It crosses the horizontal line at M, halfway from O to A.',
         'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.meet('H', 'ac', 'd45', (0.5, 0.5))
    g.line_par('hv', 'H', 'v')
    g.meet('M', 'hv', 'h', (0.5, 0))

    step('Draw a circle with centre O through M. Draw a circle with centre K1 and the same radius.',
         'compass', ['M', 'K1'])
    g.circle_through('cs', 'O', 'M')
    cm.circle_radius_of('ck', 'K1', 'cs')

    step('Draw the line through O at 90° to the line from O to K1. '
         'The small circle with centre O crosses the four lines through O at S1 to S8.', 'ruler', ['cs'])
    g.line_perp('d135', 'O', 'd45')
    pts = star_points('S', 'cs', R)

    step('Draw the star at O as two squares.', 'ruler', ['cs'])
    two_squares(pts, 'q', square_texts(pts, 'Draw each line long, to the sides of the cell.'))

    step('The same star sits at each corner of the cell. '
         'The circle with centre K1 crosses the line from O to K1 at F. Draw a vertical line through F. '
         'The circle with centre K1 crosses the vertical line through A at P. '
         'It crosses the horizontal line through C at Q. Draw a straight line through P and Q.', 'ruler', ['ck'])
    g.meet('F', 'ck', 'd45', (1 - H, 1 - H))
    g.line_par('fv', 'F', 'v')
    g.meet('P', 'ck', 'gx', (1, 0.5))
    g.meet('Q', 'ck', 'gy', (0.5, 1))
    g.line_through('pq', 'P', 'Q')

    step('Turn the two lines of the last step round O by 90°, three times. '
         'They are sides of the stars at K1, K2, K3 and K4.')
    g.repeat('cp', ['fv', 'pq'], 'rot4')


def drawing(pieces):
    """Wichmann's band centre lines in the tutorial's frame."""
    ps = json.load(open(pieces))
    stars = sorted((p['c'] for p in ps if len(p['poly']) == 16 and p['area'] < 10000),
                   key=lambda c: math.dist(c, (297.5, 375.8)))
    origin = stars[0]
    period = min(math.dist(c, origin) for c in stars[1:])
    polys = cm.frame_pieces(pieces, origin, period, 15.0)
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
        'format': 0, 'id': 'alhambra-comares-soffit-stars',
        'title': 'Interlaced stars of the Comares soffits (Alhambra)',
        'short': 'Comares soffit stars', 'subtitle': 'Salón de Comares, Alhambra', 'fold': 4, 'star': 8,
        'style': 'Nasrid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s AL1 drawing, its corners snapped to exact '
                    'values. We devised the construction: a star at O and one at each corner of the cell, both the '
                    'same size, and every line a side of one of them, carried on. The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 45°; it is turned back here so that the tile is the '
                       'square cell. The compass steps, their order and the named points are ours. The comparison '
                       'with the drawing checks the finished lines, not how the design was first laid out. '
                       'No photo of the real soffits was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data187/AL1: Alhambra, Salón de Comares', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data187/AL1.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of the stucco soffits of the arches into the side alcoves '
                     'of the Salón de Comares, after Antonio Fernández-Puertas, The Alhambra, vol. I (1997), p. 384. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the bands that carry the stars’ sides on. They close the arrows that '
                        'point at the stars, and the large ground between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every corner of every cell, '
                            'and four arrows point at every other star.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.586): ('star', 'a'), (16, 0.914): ('ground', 'ground'), (8, 0.25): ('arrow', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)

#!/usr/bin/env python3
"""Builds the stars of the Patio de los Leones south gallery ceiling
(Alhambra), drawn by Brian Wichmann in Tiling Search (data190/SPA0508X) as a
repeat of the single motif over the entrance to the Sala de los Abencerrajes:
an eight-pointed star {8/3} at O ringed by eight long hexagons, the same star
on the cell's sides at (1, ±(√2 − 1)) and its turns, and a small four-pointed
star at each corner.

Read from the PDF: the drawing is bevelled, so its coloured tiles were moved
out by half the gap between them (8 pt) and every corner snapped to the grid
a + b·√2/2 in units of half the rosette spacing (215.4 pt, worst error 0.001
in units of a quarter of the spacing).

Every line is a side of one of the stars, carried on. Each star has tip
radius √2 − 1, the distance K1F (as in alhambra-leones-door-stars). The star
at Z = (1, √2 − 1) has tips at A and F. The lines that are not lines of the
star at O are the turns round O of six: FA, AN, PU and PT of the star at Z
(P = (1, 2(√2 − 1))), and VW and VX of the star at Y = (1, −(√2 − 1)).

Units: OA = 1; stars at O and on the cell's sides, a small four-pointed star
at each corner.

Usage: gen_leones_gallery_stars.py <SPA0508Xc-pieces.json> tutorials/alhambra-leones-gallery-stars.json
       pnpm review alhambra-leones-gallery-stars
       gen_leones_gallery_stars.py finish docs/review/alhambra-leones-gallery-stars/dump.json tutorials/alhambra-leones-gallery-stars.json
(SPA0508Xc-pieces.json: the coloured pieces of SPA0508X-pieces.json, from
0_vectors.py and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_leones_door_stars import star_points  # noqa: E402

R2 = math.sqrt(2)
R = R2 - 1
H = R2 / 2


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

    step('Draw the star at O.', 'ruler', ['cs'])
    st = cm.steps[-1]
    del st['create']
    st['parts'] = []
    for k in range(2):
        pairs = [(pts[i], pts[(i + 3) % 8]) for i in range(4 * k, 4 * k + 4)]
        text = 'Draw a straight line through {} and {}, {} and {}, {} and {}, and {} and {}.'.format(
            *[n for pq in pairs for n in pq])
        p = {'text': text, 'create': {}, 'animate': 'ruler'}
        st['parts'].append(p)
        g.cur = p
        for i, (a, b) in enumerate(pairs):
            g.line_through(f's{4 * k + i + 1}', a, b)

    step('Draw a circle with centre A and the same radius as the small circle. '
         'It crosses the vertical line through A at Z, above A, and at Y, below A.', 'compass', ['A'])
    cm.circle_radius_of('ca', 'A', 'cs')
    g.meet('Z', 'ca', 'gx', (1, R))
    g.meet('Y', 'ca', 'gx', (1, -R))

    step('Draw a circle with centre Z through A. It also goes through F. '
         'It crosses the vertical line through A again at P. '
         'It crosses the line through S6 and S1 at U, and the line through S2 and S5 at N. '
         'Draw a straight line through Z and F. It crosses the circle again at T.',
         'compass', ['Z'])
    cm.steps[-1]['textWithoutHelpers'] = (
        'Draw a circle with centre Z through A. It also goes through F. '
        'It crosses the vertical line through A again at P. '
        'It crosses the line through S6 and S1 at U, and the line through S2 and S5 at N. '
        'Mark T on the circle, opposite F.')
    g.circle_through('cz', 'Z', 'A')
    g.meet('P', 'cz', 'gx', (1, 2 * R))
    g.meet('U', 'cz', 's6', (1 - R * H, R - R * H))
    g.meet('N', 'cz', 's2', (1 + R * H, R + R * H))
    g.line_through('zf', 'Z', 'F')
    g.meet('T', 'cz', 'zf', (1 + R * H, R - R * H))

    step('Draw a circle with centre Y through A. It crosses the vertical line through A again at V. '
         'It crosses the circle with centre O through A at G. '
         'It crosses the line through S1 and S4 at X, above Y. '
         'Draw a straight line through G and Y. It crosses the circle again at W.',
         'compass', ['Y'])
    cm.steps[-1]['textWithoutHelpers'] = (
        'Draw a circle with centre Y through A. It crosses the vertical line through A again at V. '
        'It crosses the circle with centre O through A at G. '
        'It crosses the line through S1 and S4 at X, above Y. '
        'Mark W on the circle, opposite G.')
    g.circle_through('cy', 'Y', 'A')
    g.meet('V', 'cy', 'gx', (1, -2 * R))
    g.meet('G', 'cy', 'c', (H, -H))
    g.meet('X', 'cy', 's1', (1 - R * H, -R + R * H))
    g.line_through('gy_', 'G', 'Y')
    g.meet('W', 'cy', 'gy_', (1 + R * H, -R + R * H))

    step('Draw a straight line through F and A, A and N, P and U, and P and T. '
         'Draw a straight line through V and W, and V and X. They are sides of the stars at Z and Y.',
         'ruler', ['F', 'A', 'N', 'P', 'T', 'U', 'V', 'W', 'X'])
    for nm, a_, b_ in (('fa', 'F', 'A'), ('an', 'A', 'N'), ('pu', 'P', 'U'), ('pt', 'P', 'T'),
                       ('vw', 'V', 'W'), ('vx', 'V', 'X')):
        g.line_through(nm, a_, b_)

    step('Turn the six lines of the last step round O by 90°, three times.')
    g.repeat('cp', ['fa', 'an', 'pu', 'pt', 'vw', 'vx'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, (297.5, 376.9), 430.8, 8.0))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-leones-gallery-stars',
        'title': 'Stars of the Patio de los Leones south gallery (Alhambra)',
        'short': 'Leones gallery stars', 'subtitle': 'Patio de los Leones, Alhambra', 'fold': 4, 'star': 8,
        'style': 'Nasrid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s SPA0508X drawing, its corners snapped to '
                    'exact values. We devised the construction: every line is a side of an eight-pointed star of '
                    'tip radius √2 − 1, at O or on the sides of the cell, carried on. The drawing gives no steps.',
            'changes': 'Wichmann made the repeat from a single motif of the ceiling panel, so the wall is his and '
                       'ours, not the building’s. His bevelled bands are drawn as single lines along their '
                       'middles. The compass steps, their order and the named points are ours.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data190/SPA0508X: Alhambra, Patio de los Leones', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data190/SPA0508X.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, a repeat he made from the single motif of the central '
                     'ceiling panel in the south gallery of the Patio de los Leones, over the entrance arch to the '
                     'Sala de los Abencerrajes (1370–76). The construction is ours.'},
            {'source': 'Photograph SPA 0508x (Patio de los Leones)', 'creator': 'David Wade',
             'url': 'https://patterninislamicart.com/', 'kind': 'photo',
             'note': 'The ceiling panel, compared with our lines laid over the photo.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the side of the cell.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the bands that carry its sides on. They close the long hexagons '
                        'round the star and the stars on the sides of the cell. '
                        'They also close a small four-pointed star at each corner.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A small four-pointed star sits at every '
                            'corner, ringed by four stars.',
                    'palette': 'Alhambra', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.284): ('star', 'a'), (6, 0.151): ('long_hexagon', 'ground'), (6, 0.092): ('hexagon', 'b'),
         (4, 0.029): ('dart', 'c'), (8, 0.034): ('small_star', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)

#!/usr/bin/env python3
"""Builds the stars and octagons of Jules Bourgoin's plate 44, drawn by Brian
Wichmann in Tiling Search (data10/P044).

Read from the PDF (period 267.66 pt). The coloured pieces are drawn edge to
edge, so they are the tiles: no offset. With OA half the star spacing, every
corner snaps to the grid a + b·√2/2 (worst error 0.0005 of OA), and every
edge lies on one of two sets of lines at 22.5° to the axes:
the sides of the regular octagon at each cell corner, carried on. The
octagon's corners lie on a circle of radius √2 − 1 = K1E about the corner (E
where the unit circle crosses line OK1). Carried on, the sides of the four
octagons round O are the sides of the {8/3} star at O, and they close the
kites.

Usage: gen_bourgoin_star_octagons.py <P044-pieces.json> tutorials/bourgoin-star-octagons.json
       pnpm review bourgoin-star-octagons
       gen_bourgoin_star_octagons.py finish docs/review/bourgoin-star-octagons/dump.json tutorials/bourgoin-star-octagons.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R = math.sqrt(2) - 1
ORIGIN, PERIOD, BAND = (297.5, 374.7), 267.66, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The line from O to K1 crosses the circle at E. Draw a circle with centre K1 through E. '
         'Draw a line through K1 at 90° to the line from O to K1.', 'compass', ['K1', 'E'])
    g.meet('E', 'c', 'd45', (H, H))
    g.circle_through('ck', 'K1', 'E')
    g.line_perp('kp', 'K1', 'd45')

    step('The circle with centre K1 crosses the four lines through K1 at V1 to V7 and E. '
         'Join V1, V2, V3, V4, V5, E, V6 and V7 with straight lines to make an octagon. '
         'Turn the circle and the octagon round O by 90°, three times. '
         'The sides of the four octagons cross round O to make the star.', 'ruler', ['K1'])
    steps_ = cm.steps
    steps_[-1]['textWithoutHelpers'] = (
        'Draw a straight line through V3 and V4, V4 and V5, and V5 and E. '
        'Draw a straight line through E and V6, V6 and V7, and V7 and V1. '
        'Turn the lines round O by 90°, three times. '
        'They cross round O to make the star.')
    vs = []
    for i, (ln, k) in enumerate((('gy', 0), ('d45', 1), ('gx', 2), ('kp', 3), ('gy', 4), ('d45', 5), ('gx', 6), ('kp', 7))):
        p = (1 + R * math.cos(k * math.pi / 4), 1 + R * math.sin(k * math.pi / 4))
        if k == 5:
            vs.append('E')
            continue
        nm = f'V{len([v for v in vs if v != "E"]) + 1}'
        g.meet(nm, 'ck', ln, p)
        vs.append(nm)
    oct_lines = []
    for i in range(8):
        nm = f'oc{i}'
        g.line_through(nm, vs[i], vs[(i + 1) % 8])
        oct_lines.append(nm)
    g.repeat('ocr', ['ck'] + oct_lines, 'rot4')



def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'bourgoin-star-octagons',
        'title': 'Stars and octagons of Bourgoin’s plate 44',
        'short': 'Bourgoin stars and octagons', 'subtitle': 'Jules Bourgoin, plate 44', 'fold': 4, 'star': 8,
        'style': 'Islamic tilework', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P044 drawing of Bourgoin’s plate, its '
                    'corners snapped to exact values. We devised the construction: one radius, K1E, sets the octagon '
                    'at each corner, and every line is a side of an octagon, carried on: they make the star at O. '
                    'The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Bourgoin gives '
                       'no building, and no photo of a real wall was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data10/P044: Bourgoin, Plate 44', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data10/P044.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from plate 44 of Jules Bourgoin, Arabic '
                     'Geometrical Pattern and Design (1879; Dover reprint), and lists it on page 236 of S. J. Abas '
                     'and A. S. Salman, Symmetries of Islamic Geometrical Patterns (1995). The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the octagons at the corners, and carry their sides on. '
                        'They close the long pieces and the kites between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and an octagon '
                            'at every corner.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.284): ('star', 'b'), (8, 0.485): ('octagon', 'a'), (14, 0.565): ('long', 'ground'),
         (4, 0.121): ('kite', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)

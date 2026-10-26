#!/usr/bin/env python3
"""Builds the ceiling of the French Embassy, Cairo, drawn by Brian Wichmann in
Tiling Search (data208/FE1): the eight-fold star and cross with the lines left
out round every other cross, so that a cross and its four stars make one large
piece.

Read from the PDF (tiles edge to edge, outlined). In units of the stars' point
radius (OA = 36.21 pt) every corner snaps to the grid a + b·√2/2 (worst error
0.0025 of OA). The stars, of two squares on circles of radius 1, sit at the
points (odd, odd) and the crosses at (even, even), as in eight-fold-star-and-
cross. O is the centre of a large piece; the next large pieces sit at (4, 4)
and its turns, so the tile is the square K1 K2 K3 K4 with corners at the
crosses (4, 0), (0, 4), (−4, 0) and (0, −4), turned by 45°.

Construction. The vertical through A and the horizontal through C cross at E,
the centre of a star whose circle runs through A and C; it is drawn as two
squares and turned round O. The circle with centre E through O crosses line OE
again at G (2, 2); the circle with centre G through O crosses the horizontal
and the vertical at K1 and K2. The stars at (3, ±1) and (±1, 3) need two more
lines, each turned round O (found with find_crossings.py, FIND=<pieces.json>).

Usage: gen_cairo_embassy_stars.py <FE1-pieces.json> tutorials/cairo-embassy-stars.json
       pnpm review cairo-embassy-stars
       gen_cairo_embassy_stars.py finish docs/review/cairo-embassy-stars/dump.json tutorials/cairo-embassy-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import el, g, put, step  # noqa: E402
import gen_fatehpur_sikri_stars as fs  # noqa: E402

R2 = math.sqrt(2)
H = R2 / 2
ORIGIN, UNIT, BAND = (296.75, 372.5), 36.21, 0.0


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a vertical line through O.', 'ruler')
    g.line_through('h', 'O', 'A')
    g.line_perp('v', 'O', 'h')

    step('Draw a circle with centre O through A. It crosses the vertical line at C, above O. '
         'Draw a vertical line through A. Draw a horizontal line through C. They cross at E.', 'compass', ['A', 'C', 'E'])
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.meet('C', 'c', 'v', (0, 1))
    g.line_perp('ax', 'A', 'h')
    g.line_perp('cy', 'C', 'v')
    g.meet('E', 'ax', 'cy', (1, 1))

    step('Draw a circle with centre E through A. It passes through C. '
         'Draw a straight line through O and E. It crosses the circle at T1 and T2. '
         'Draw a line through E at 90° to line OE. It crosses the circle at T3 and T4.', 'compass', ['E'])
    g.circle_through('ce', 'E', 'A')
    g.line_through('oe', 'O', 'E')
    g.meet('T1', 'ce', 'oe', (1 + H, 1 + H))
    g.meet('T2', 'ce', 'oe', (1 - H, 1 - H))
    g.line_perp('ep', 'E', 'oe')
    g.meet('T3', 'ce', 'ep', (1 - H, 1 + H))
    g.meet('T4', 'ce', 'ep', (1 + H, 1 - H))
    g.meet('U1', 'ce', 'ax', (1, 2))
    g.meet('U2', 'ce', 'cy', (2, 1))

    step('Draw a straight line through A and C. Draw a straight line through U1 and U2. '
         'U1 and U2 are where the circle crosses the vertical line through A and the horizontal line through C. '
         'Draw a vertical line through each of T1 and T2.', 'ruler', ['U1', 'U2', 'T1', 'T2'])
    g.line_through('s1', 'A', 'C')
    g.line_through('s3', 'U1', 'U2')
    g.line_par('t1v', 'T1', 'v')
    g.line_par('t2v', 'T2', 'v')

    step('Turn the four lines of the last step round O by 90°, three times. '
         'They finish the star at E and make three more stars round O.', 'ruler', ['ce'])
    g.repeat('sr', ['s1', 's3', 't1v', 't2v'], 'rot4')
    step('The line through E at 90° to line OE crosses the vertical line through T2, turned, at W. '
         'Draw a horizontal line through W. Turn it round O by 90°, three times.', 'ruler', ['W'])
    g.meet('W', 'ep', 't2v@2', (H - 1, 3 - H))
    g.line_par('wh', 'W', 'h')
    g.repeat('wr', ['wh'], 'rot4')
    if os.environ.get('FIND'):
        import find_crossings
        find_crossings.report(cm.frame_pieces(os.environ['FIND'], ORIGIN, 2 * UNIT, BAND), hcell=4, reach=4.5)
        sys.exit()

    step('Draw a circle with centre E through O. It crosses line OE again at G. '
         'Draw a circle with centre G through O. It crosses the horizontal line at K1 and the vertical line at K2. '
         'Draw a circle with centre O through K1. It crosses the two lines again at K3 and K4.',
         'compass', ['G', 'K1', 'K2'])
    g.circle_through('co', 'E', 'O')
    g.meet('G', 'co', 'oe', (2, 2))
    g.circle_through('cg', 'G', 'O')
    g.meet('K1', 'cg', 'h', (4, 0))
    g.meet('K2', 'cg', 'v', (0, 4))
    g.circle_through('ck', 'O', 'K1')
    g.meet('K3', 'ck', 'h', (-4, 0))
    g.meet('K4', 'ck', 'v', (0, -4))


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tile = [el[k][1] for k in ('K1', 'K2', 'K3', 'K4')]
    segs = fs.network(cm.frame_pieces(pieces, ORIGIN, 2 * UNIT, BAND), tile, reach=5.5)
    paths = fs.along(segs, tile)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    tut = {
        'format': 0, 'id': 'cairo-embassy-stars',
        'title': 'Stars and crosses of the French Embassy ceiling, Cairo',
        'short': 'Cairo embassy stars', 'subtitle': 'French Embassy, Cairo', 'fold': 4, 'star': 8,
        'style': 'Mamluk', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s FE1 drawing, its corners snapped to exact '
                    'values. We devised the construction. It is the eight-fold star and cross: stars of two squares '
                    'stand round O, every side carried on, and the lines through W add the next stars. Round O and '
                    'round the tile’s corners the lines between the cross and its four stars are left out, so they '
                    'make one large piece. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'ceiling was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data208/FE1: French Embassy, Cairo', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data208/FE1.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Mercedes Volait, Maisons de France au '
                     'Caire (Cairo, 2012), page 55, plate 38 (a ceiling of the French Embassy, Cairo). '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a large piece made of a cross and four stars.',
                  'A': 'A point of the star at E, next to O.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange: the sides of the stars and crosses. '
                        'Leave out the lines between O and the four stars round it, and the same at each corner.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the tilted square tile side by side. A large piece sits at every centre and '
                            'every corner, with stars and crosses between them.',
                    'palette': 'Mamluk wood', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(48, 11.029): ('large', 'a'), (16, 2.343): ('star', 'a'), (16, 1.657): ('cross', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)

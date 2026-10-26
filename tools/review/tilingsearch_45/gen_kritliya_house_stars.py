#!/usr/bin/env python3
"""Builds the interlaced stars of the Kritliya House in Cairo (the
Gayer-Anderson Museum), drawn by Brian Wichmann in Tiling Search
(data186/KHC).

A band drawing (bands 15.0 pt wide), p4g. The stars, each two squares on a
circle of radius sin 22.5°, have only a quarter turn with their neighbours,
and the stars next to them are the mirror image, so the frame is turned by
45° from Wichmann's: O at a star, the cell's corners at the four nearest stars
and A at the small rhombus halfway between (OA = 189.29 pt). Every centre line
runs at 22.5°, 67.5°, 112.5° or 157.5°: the sides of the star at O, and lines
through four points on two circles of radius 1 − √2/2 about A and C. The
corners land within 0.001 of OA.

Usage: gen_kritliya_house_stars.py <KHC-pieces.json> tutorials/kritliya-house-stars.json
       pnpm review kritliya-house-stars
       gen_kritliya_house_stars.py finish docs/review/kritliya-house-stars/dump.json tutorials/kritliya-house-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R = 1 - H
S = math.sin(math.radians(22.5))
ORIGIN, PERIOD, BAND = (299.4, 375.5), 378.58, 15.0


def d(a):
    return (math.cos(math.radians(a)), math.sin(math.radians(a)))


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw the lines through O that halve the angles AOF '
         'and FOC.', 'ruler', ['A', 'F', 'C'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_bisect('b1', 'A', 'O', 'F')
    g.line_bisect('b2', 'F', 'O', 'C')

    step('Draw the line through C at 90° to the line that halves the angle AOF. It crosses that line at T. '
         'Draw the line through A at 90° to the line that halves the angle FOC. It crosses that line at U.',
         'ruler', ['b1', 'b2'])
    g.line_perp('ct', 'C', 'b1')
    g.meet('T', 'ct', 'b1', (S * d(22.5)[0], S * d(22.5)[1]))
    g.line_perp('at', 'A', 'b2')
    g.meet('U', 'at', 'b2', (S * d(67.5)[0], S * d(67.5)[1]))

    step('Draw a line through T parallel to line OU. Draw a line through U parallel to line OT.',
         'ruler', ['T', 'U'])
    g.line_par('s1', 'T', 'b2')
    g.line_par('s2', 'U', 'b1')

    step('Turn the lines through T and U round O by 90°, three times. They make the star at O.',
         'ruler', ['s1', 's2'])
    g.repeat('cp1', ['s1', 's2'], 'rot4')

    step('Draw a vertical line through F. It crosses the horizontal line at G. Draw a circle with centre A '
         'through G. Draw a circle with centre C and the same radius.', 'compass', ['F', 'A', 'C'])
    cm.steps[-1]['textWithoutHelpers'] = ('Draw a circle with centre A through G, the point on the horizontal line '
                                          'straight below F. Draw a circle with centre C and the same radius.')
    g.line_par('fv', 'F', 'v')
    g.meet('G', 'fv', 'h', (H, 0))
    g.circle_through('ca', 'A', 'G')
    cm.circle_radius_of('cc', 'C', 'ca')

    step('The circle with centre A crosses the vertical line through A at P, above A, and at E, below A. '
         'Draw lines through P and E parallel to line OU. The line through P crosses the circle again at Q.',
         'ruler', ['ca', 'gx'])
    g.meet('P', 'ca', 'gx', (1, R))
    g.meet('E', 'ca', 'gx', (1, -R))
    g.line_par('pl', 'P', 'b2')
    g.line_par('el', 'E', 'b2')
    g.meet('Q', 'ca', 'pl', (1 - R * H, -R * H))

    step('Draw a line through Q parallel to line OT. The circle with centre C crosses the horizontal line '
         'through C at M, left of C. Draw a line through M parallel to line OT.', 'ruler', ['Q', 'cc'])
    g.line_par('ql', 'Q', 'b1')
    g.meet('M', 'cc', 'gy', (-R, 1))
    g.line_par('ml', 'M', 'b1')

    step('Turn the lines through P, E, Q and M round O by 90°, three times.', 'ruler', ['pl', 'el', 'ql', 'ml'])
    g.repeat('cp2', ['pl', 'el', 'ql', 'ml'], 'rot4')

    # the line through P carried on from the cell above O (a half turn about C)
    step('The line through P, turned round O by 180°, crosses the horizontal line through C at N. '
         'Draw a circle with centre C through N. It crosses the horizontal line through C again at W. '
         'Draw a line through W parallel to line OU.', 'compass', ['pl@2', 'gy'])
    g.meet('N', 'pl@2', 'gy', (-0.4644660940672619, 1))
    g.circle_through('cn', 'C', 'N')
    g.meet('W', 'cn', 'gy', (0.4644660940672619, 1))
    g.line_par('wl', 'W', 'b2')

    step('Turn the line through W round O by 90°, three times.', 'ruler', ['wl'])
    g.repeat('cp3', ['wl'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = [[((x + y) * H, (y - x) * H) for x, y in Q] for Q in cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)]
    segs = cm.network(polys, reach=1.7)  # pieces cut by the page edge give false corners
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'kritliya-house-stars',
        'title': 'Interlaced stars of the Kritliya House (Cairo)',
        'short': 'Kritliya House stars', 'subtitle': 'Bayt al-Kritliya, Cairo', 'fold': 4, 'star': 8,
        'chiral': True, 'style': 'Ottoman', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s KHC drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction: the star at O, then four lines set by '
                    'two small circles, all turned round O. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws '
                       'the lines as interlaced bands; the tutorial draws their centre lines, turned by 45° so '
                       'that the stars next to O sit at the corners of the cell. No photo of the house was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data186/KHC: Kritiya House, Cairo', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data186/KHC.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of a panel in the Kritliya House (Gayer-Anderson '
                     'Museum), Cairo, by the fountain in the salamlik, after an Archnet photo; he also cites a '
                     'Thesaurus Islamicus photo from the house of Jamal al-Din al-Dhahabi, Cairo. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'The centre of a small rhombus, halfway from O to the next star of the same hand.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines that carry its sides on. '
                        'Ink the lines through P, E, Q, M and W and their turned copies. '
                        'They close the pieces between the stars.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. The bands run on from star to star and '
                            'weave over and under.',
                    'palette': 'Mamluk wood', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.343): ('star', 'a'), (4, 0.071): ('rhombus', 'a'), (10, 0.379): ('sail', 'a'),
         (10, 0.207): ('bone', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)

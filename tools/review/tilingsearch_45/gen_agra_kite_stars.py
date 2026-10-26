#!/usr/bin/env python3
"""Builds the stars and kite rosettes of a drawing from Agra, drawn by Brian
Wichmann in Tiling Search (data193/VA3, from a drawing in the Victoria and
Albert Museum).

Read from the PDF (a bevelled band drawing: the brown tiles, moved out by
half the 18 pt band, give the tiling), turned by 67.5° so that the stars
(252.4 pt apart) sit at O and on the axes at (±2, 0) and (0, ±2). Every
corner then lies on the grid a + b·√2/2 (worst error 0.001 of OA), and every
edge runs at 22.5°, 67.5°, 112.5° or 157.5°: the lines are the lines through
each corner of the cell in those four directions. Through K1 they halve the
angles OK1A and OK1C, so they run through E = (2 − √2, 0) and
G = (0, 2 − √2), found with circles of radius √2 − 1 (K1 to F) round A and
C; the other corners' lines are their turned copies.
They make an eight-pointed star at O (points at (√2/2, 1 − √2/2) and its
turns), an octagon between two stars at A, B, C and D, and eight kites round
each corner, Wichmann's eight-pointed star of kites.

Usage: gen_agra_kite_stars.py <VA3-pieces.json> tutorials/agra-kite-stars.json
       pnpm review agra-kite-stars
       gen_agra_kite_stars.py finish docs/review/agra-kite-stars/dump.json tutorials/agra-kite-stars.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD, BAND, TURN = (297.5, 377.4), 252.4, 18.0, 67.5
BROWN = (0.82, 0.58, 0.51)


def drawing(pieces):
    ps = [p for p in json.load(open(pieces)) if tuple(round(c, 2) for c in p['fill']) == BROWN]
    tmp = pieces.replace('-pieces.json', '-brown.json')
    json.dump(ps, open(tmp, 'w'))
    polys = cm.frame_pieces(tmp, ORIGIN, PERIOD, BAND)
    t = math.radians(TURN)
    return [[(x * math.cos(t) - y * math.sin(t), x * math.sin(t) + y * math.cos(t)) for x, y in Q] for Q in polys]


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw a circle with centre K1 through F. '
         'Draw circles with centres A and C and the same radius.', 'compass', ['F', 'K1'])
    g.meet('F', 'c', 'd45', (H, H))
    g.circle_through('ck', 'K1', 'F')
    cm.circle_radius_of('ca', 'A', 'ck')
    cm.circle_radius_of('cc', 'C', 'ck')

    step('The circle with centre A crosses the horizontal line at E. '
         'The circle with centre C crosses the vertical line at G. '
         'Draw a straight line through K1 and E. Draw a straight line through K1 and G.', 'ruler', ['E', 'G'])
    g.meet('E', 'ca', 'h', (2 - 2 * H, 0))
    g.meet('G', 'cc', 'v', (0, 2 - 2 * H))
    g.line_through('ka', 'K1', 'E')
    g.line_through('kc', 'K1', 'G')

    step('Turn the two lines round O by 90°, three times. They make the star at O.')
    g.repeat('kr', ['ka', 'kc'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(drawing(pieces))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'agra-kite-stars',
        'title': 'Stars and kite rosettes of a drawing from Agra',
        'short': 'Agra kite stars', 'subtitle': 'Agra, India', 'fold': 4, 'star': 8,
        'style': 'Mughal', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s VA3 drawing, its corners snapped to exact '
                    'values. Every line runs through a corner of the cell and halves an angle there, so the '
                    'construction is two lines through K1, turned round O; circles of radius K1F round A and C give '
                    'the second point of each. The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 67.5°; it is turned here so that the tile is the square '
                       'cell. The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as bevelled bands; the tutorial draws their centre lines. No photo was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data193/VA3: Agra, India', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data193/VA3.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from a drawing of Agra in the Victoria and '
                     'Albert Museum (IS.1052:17-1883, one of twenty-nine drawings), and lists the same design at '
                     'Rajah Birbal’s house, Fatehpur Sikri. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines that carry its sides on to the corners. They close the '
                        'octagons between the stars and the eight kites round each corner.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre, an octagon '
                            'between two stars, and eight kites round every corner.',
                    'palette': 'Timurid tile', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 1.373): ('star', 'a'), (8, 0.343): ('octagon', 'b'), (4, 0.243): ('kite', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)

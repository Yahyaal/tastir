#!/usr/bin/env python3
"""Builds the Seville tile panel in the V&A (1005:73 to 84-1884), drawn by
Brian Wichmann in Tiling Search (data183/RAY10): eight-pointed stars with
sharp (45°) points, each ringed by long hexagons, on a square grid.

Read from the PDF (plain tiles, no band). The stars are not all alike: the
stars ringed by eight hexagons sit 396.3 pt apart on the page's diagonals, and
the stars between them have only four. So the design is turned by 45° here
and OA is half that spacing (198.15 pt): a star ringed by hexagons at O, a
star at A (and the other side midpoints) and another kind at each corner.
Every corner then snaps to the grid (a + b·√2/2)/2 (worst error 0.0008 of OA).

Every star is the same: the eight lines touching a circle of radius
ρ = (1 − √2/2)/2 about its centre, two of each direction. With H = √2/2 the
lines are:
  - the star at O: x, y = ±ρ, through P, where line AK2 crosses the vertical
    through E; and x ± y = ±ρ√2, through R, where the circle with centre O
    through Q = (ρ, 0) crosses OK1;
  - the stars at A and the corners: x, y = ±(1 − ρ), through T, where the
    circle with centre A and radius ρ crosses the horizontal line; and
    x ± y = ±(1 ± ρ√2), through S1 and S2, where the circle with centre A
    and radius OG (G = (ρ√2, 0)) crosses the horizontal line;
  - x, y = ±s, s = (1 − ρ√2)·H, through V, where the circle with centre O
    through S1 crosses OK1. They close the hexagons round O.

Usage: gen_seville_tile_stars.py <RAY10-pieces.json> tutorials/seville-tile-stars.json
       pnpm review seville-tile-stars
       gen_seville_tile_stars.py finish docs/review/seville-tile-stars/dump.json tutorials/seville-tile-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
RHO = (1 - H) / 2
RT = RHO * math.sqrt(2)
S = (1 - RT) * H
ORIGIN, PERIOD, BAND = (329.3, 345.8), 396.3, 0.0


def drawing(pieces):
    """Wichmann's pieces in the frame, turned by 45°."""
    return [[((x - y) * H, (x + y) * H) for x, y in Q] for Q in cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)]


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at E. Draw a vertical line through E. '
         'Draw a straight line through A and K2. It crosses the vertical line through E at P. '
         'Draw a horizontal line through P. Turn it round O by 90°, three times.', 'ruler', ['E', 'P'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_par('ev', 'E', 'v')
    g.line_through('ak', 'A', 'K2')
    g.meet('P', 'ak', 'ev', (H, RHO))
    g.line_par('ph', 'P', 'h')
    g.repeat('php', ['ph'], 'rot4')

    step('One of the new lines crosses the horizontal line through O at Q. Draw a circle with centre O through Q. '
         'It crosses the line from O to K1 at R. Draw a line through R at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times. The eight lines make the star at O.', 'compass', ['Q', 'R'])
    g.meet('Q', 'ph@3', 'h', (RHO, 0))
    g.circle_through('cq', 'O', 'Q')
    g.meet('R', 'cq', 'd45', (RHO * H, RHO * H))
    g.line_perp('rd', 'R', 'd45')
    g.repeat('rdp', ['rd'], 'rot4')

    step('The line through R crosses the horizontal line through O at G. '
         'Draw a circle with centre A and radius OG. It crosses the horizontal line through O at S1 and S2. '
         'Draw a circle with centre A and the same radius as the circle through Q. '
         'It crosses the horizontal line through O at T, left of A.', 'compass', ['G', 'S1', 'S2', 'T'])
    g.meet('G', 'rd', 'h', (RT, 0))
    g.circle_from('cs', 'A', 'O', 'G')
    g.meet('S1', 'cs', 'h', (1 - RT, 0))
    g.meet('S2', 'cs', 'h', (1 + RT, 0))
    cm.circle_radius_of('ct', 'A', 'cq')
    g.meet('T', 'ct', 'h', (1 - RHO, 0))

    step('Draw a line through each of S1 and S2 at 90° to the line from O to K1. Draw a vertical line through T. '
         'Turn the three lines round O by 90°, three times. They make the stars at A and at the corners.',
         'ruler', ['S1', 'S2', 'T'])
    g.line_perp('s1d', 'S1', 'd45')
    g.line_perp('s2d', 'S2', 'd45')
    g.line_par('tv', 'T', 'v')
    g.repeat('stp', ['s1d', 's2d', 'tv'], 'rot4')

    step('Draw a circle with centre O through S1. It crosses the line from O to K1 at V. '
         'Draw a vertical line through V. Turn it round O by 90°, three times.', 'compass', ['S1', 'V'])
    g.circle_through('cv', 'O', 'S1')
    g.meet('V', 'cv', 'd45', (S, S))
    g.line_par('vv', 'V', 'v')
    g.repeat('vvp', ['vv'], 'rot4')


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
        'format': 0, 'id': 'seville-tile-stars',
        'title': 'Sharp stars of a Seville tile panel',
        'short': 'Seville tile stars', 'subtitle': 'Tile panel from Seville, V&A, London', 'fold': 4, 'star': 8,
        'style': 'Mudéjar', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s RAY10 drawing, its corners snapped to exact '
                    'values. We devised the construction. Every star is the same: eight lines touching a small '
                    'circle about its centre. The star at O comes first; the circles about A copy its lines to the '
                    'stars at A and at the corners, and one more circle about O gives the lines that close the '
                    'hexagons round O. The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 45°; it is turned back here so that the tile is the '
                       'square cell. The compass steps, their order and the named points are ours. The comparison '
                       'with the drawing checks the finished lines, not how the design was first laid out. The V&A '
                       'photo of the panel was not checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data183/RAY10: Seville tile, V & A', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data183/RAY10.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from the tin-glazed tile panel from Seville '
                     'in the Victoria and Albert Museum (1005:73 to 84-1884), shown in Anthony Ray, Spanish Pottery '
                     '1248–1898 (V&A, 2000), plate 73, and lists a drawing of the El Badi palace, Marrakesh, in '
                     'Robert Field, Geometric Patterns from Islamic Art and Architecture (Tarquin, 1998), page 26. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a star ringed by hexagons.',
                  'A': 'The centre of the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the stars at O, at A and at the corners. '
                        'Ink the hexagons round O and the lines that carry the stars’ sides on.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star ringed by eight hexagons sits at every '
                            'centre, and the stars between them have four.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.243): ('star', 'ground'), (6, 0.129): ('petal', 'a'), (8, 0.086): ('eight', 'c'),
         (6, 0.078): ('hexagon', 'b'), (4, 0.025): ('kite', 'd'), (3, 0.021): ('triangle', 'ground'),
         (4, 0.018): ('dart', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)

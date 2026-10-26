#!/usr/bin/env python3
"""Builds the carved border of the Bahramiye mosque, Aleppo, drawn by Brian
Wichmann in Tiling Search (data198/AJL1).

Read from the PDF (period 349.7 pt, band 9 pt), every band centre line
snapped to the grid a + b·√2/2 in units of OA (worst error 0.0003). O is a
star of two squares (tip radius R = √2 − 1, as in fatehpur-sikri-stars and
charbagh-stars, which use the same tiles); a small square sits at each corner.
With H = √2/2, every line is one of these, turned round O:
  - the star: x ± y = R through T, where line DE crosses the horizontal line,
    and x = 1 − H through Q, where the circle with centre O through T crosses OK1;
  - through the star's inner corner N = (1 − H, 3H − 2): y = 3H − 2 and x − y = 3 − 2√2;
  - y = H through E, and x + y = 1 (line AC);
  - where line DE crosses the star's sides: x = 5H − 3 through M, x − y = 5 − 3√2
    through L and x + y = 2√2 − 1 through J on the cell side;
  - on the line through E: x = 3 − 3H through P and x + y = 3√2 − 3 through V.
The drawing is copied one period across and down, because O sits near the
page's left edge.

Usage: gen_bahramiye_mosque_stars.py <AJL1-pieces.json> tutorials/bahramiye-mosque-stars.json
       pnpm review bahramiye-mosque-stars
       gen_bahramiye_mosque_stars.py finish docs/review/bahramiye-mosque-stars/dump.json tutorials/bahramiye-mosque-stars.json
       gen_bahramiye_mosque_stars.py report <AJL1-pieces.json>   (lines still missing)
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R2 = math.sqrt(2)
R = R2 - 1
ORIGIN, PERIOD, BAND = (132.7, 196.1), 349.7, 9.0


def drawing(pieces):
    """The pieces in the frame, with copies one period across and down (O sits
    near the page's left edge)."""
    ps = cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)
    return [[(x + 2 * i, y + 2 * j) for x, y in Q] for Q in ps for i in (-1, 0, 1) for j in (-1, 0, 1)]


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')
    step('The circle crosses the line from O to K1 at E. Draw a straight line through D and E. '
         'It crosses the horizontal line through O at T. Draw a circle with centre O through T. '
         'It crosses the line from O to K1 at Q.', 'compass', ['E', 'T', 'Q'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_through('de', 'D', 'E')
    g.meet('T', 'de', 'h', (R, 0))
    g.circle_through('ct', 'O', 'T')
    g.meet('Q', 'ct', 'd45', (R * H, R * H))

    step('Draw a line through T at 90° to the line from O to K1. Draw a vertical line through Q. '
         'Turn the two lines round O by 90°, three times. They make the star at O.', 'ruler', ['T', 'Q'])
    g.line_perp('td', 'T', 'd45')
    g.line_par('qv', 'Q', 'v')
    g.repeat('sp', ['td', 'qv'], 'rot4')

    step('The two lines cross at N, an inner corner of the star. Draw a horizontal line through N. '
         'Draw a line through N parallel to the line from O to K1. '
         'Draw a horizontal line through E. Draw a straight line through A and C. '
         'Turn the four lines round O by 90°, three times.', 'ruler', ['N', 'E'])
    g.meet('N', 'td', 'qv', (1 - H, 3 * H - 2))
    g.line_par('nh', 'N', 'h')
    g.line_par('nd', 'N', 'd45')
    g.line_par('eh', 'E', 'h')
    g.line_through('ac', 'A', 'C')
    g.repeat('np', ['nh', 'nd', 'eh', 'ac'], 'rot4')

    step('Line DE crosses two sides of the star at M and L. It crosses the top side of the cell at J. '
         'Draw a vertical line through M. Draw a line through L parallel to the line from O to K1. '
         'Draw a line through J at 90° to the line from O to K1. '
         'Turn the three lines round O by 90°, three times.', 'ruler', ['M', 'L', 'J'])
    g.meet('M', 'de', 'qv@1', (5 * H - 3, 1 - H))
    g.line_par('mv', 'M', 'v')
    g.meet('L', 'de', 'td@2', (3 - 2 * R2, R2 - 2))
    g.line_par('ld', 'L', 'd45')
    g.meet('J', 'de', 'gy', (2 * R2 - 2, 1))
    g.line_perp('jd', 'J', 'd45')
    g.repeat('mp', ['mv', 'ld', 'jd'], 'rot4')

    step('The horizontal line through E crosses the line through N parallel to the line from O to K1 at P. '
         'It crosses the vertical line through M at V. Draw a vertical line through P. '
         'Draw a line through V at 90° to the line from O to K1. '
         'Turn the two lines round O by 90°, three times.', 'ruler', ['P', 'V'])
    g.meet('P', 'eh', 'nd', (3 - 3 * H, H))
    g.meet('V', 'eh', 'mv', (5 * H - 3, H))
    g.line_par('pv', 'P', 'v')
    g.line_perp('vd', 'V', 'd45')
    g.repeat('pp', ['pv', 'vd'], 'rot4')


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
        'format': 0, 'id': 'bahramiye-mosque-stars',
        'title': 'Interlaced stars of the Bahramiye mosque, Aleppo',
        'short': 'Bahramiye mosque stars', 'subtitle': 'Bahramiye mosque, Aleppo', 'fold': 4, 'star': 8,
        'style': 'Ottoman', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s AJL1 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction. The star at O is two squares, found '
                    'with line DE; that line then crosses the star’s sides at M, L and J, which fix most of the '
                    'other lines, and the line through E fixes the rest. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws '
                       'the lines as interlaced bands; the tutorial draws their centre lines. No photo of the carving '
                       'was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data198/AJL1: Bahramiye Mosque, Aleppo', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data198/AJL1.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from a photo by Dick Osseman of the carved '
                     'border round the door arch of the Bahramiye mosque, Aleppo, and lists the same design at '
                     'Termez in L. I. Rempel, Arkhitekturnyi ornament Uzbekistana (Tashkent, 1961), page 209. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the star at O, the small square at each '
                        'corner and the bands that weave between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and a small '
                            'square at every corner.',
                    'palette': 'Mamluk wood', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.402): ('star', 'b'), (10, 0.172): ('ten', 'ground'), (8, 0.101): ('eight', 'a'),
         (4, 0.059): ('square', 'd'), (5, 0.056): ('pentagon', 'c')}

if __name__ == '__main__':
    if sys.argv[1] == 'report':
        import find_crossings
        build()
        find_crossings.report(drawing(sys.argv[2]))
    else:
        cm.run(main, NAMES)

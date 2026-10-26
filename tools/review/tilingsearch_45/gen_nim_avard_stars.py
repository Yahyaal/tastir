#!/usr/bin/env python3
"""Builds the stars and squares of the Nim Avard madrasa, Isfahan, drawn by
Brian Wichmann in Tiling Search (data16/F81), as a variant of the Mashhad
courtyard stars (mashhad-courtyard-stars, F82).

Read from the PDF (plain tiles, stars 273.2 pt apart on the axes, drawn in
the tutorial's frame, not turned), every corner snapped to the grid
a + b·√2/2 in units of half the star spacing (worst error 0.002 of OA). The
lines are those of the Mashhad design (the star of two squares at O on a
circle of radius √2/2, and the lines through P = (1 − √2/2, 0) parallel to
OK1, turned round O), with the lines through R = (1, √2/2) at 90° to OK1 of
the Qom design added: they cut each cross of the Mashhad design into a
square and four pentagons. So the tutorial copies the Mashhad construction
(gen_iran_court_stars.build), adds one step and inks along the lines.

Usage: gen_nim_avard_stars.py <F81-pieces.json> tutorials/nim-avard-stars.json
       pnpm review nim-avard-stars
       gen_nim_avard_stars.py finish docs/review/nim-avard-stars/dump.json tutorials/nim-avard-stars.json
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_iran_court_stars import COMMON_CONSTRUCTION, NAQSH, H, build  # noqa: E402

ORIGIN, PERIOD = (302.1, 375.5), 273.2


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build('mashhad-courtyard-stars')
    # the Mashhad steps end with the lines through P; F81 adds the lines through R (as in qom-atabaki-stars)
    step('The circle with centre A through P crosses the vertical line through A at R. '
         'Draw a line through R at 90° to the line from O to K1. Turn it round O by 90°, three times.',
         'ruler', ['cr'])
    g.meet('R', 'cr', 'gx', (1, H))
    g.line_perp('rd', 'R', 'd45')
    g.repeat('rdp', ['rd'], 'rot4')
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'nim-avard-stars',
        'title': 'Stars, squares and pentagons of the Nim Avard madrasa, Isfahan',
        'short': 'Nim Avard stars', 'subtitle': 'Nim Avard madrasa, Isfahan',
        'fold': 4, 'star': 8, 'style': 'Persian', 'level': 'beginner',
        'construction': dict(
            COMMON_CONSTRUCTION,
            note='The finished design was read from Brian Wichmann’s F81 drawing, its corners snapped to exact values. '
                 'It has the lines of the Mashhad courtyard design (F82), with more of them inked: each cross is cut '
                 'into a square and four pentagons. So it uses the same construction. The drawing gives no steps.',
            changes='The compass steps, their order and the named points are ours. The comparison with the drawing '
                    'checks the finished lines, not how the design was first laid out. No photo of the madrasa was '
                    'checked.'),
        'credits': [{
            'source': 'Tiling Search, data16/F81: Nim Avard Madrasah, Isfahan', 'creator': 'Brian Wichmann',
            'url': 'https://tilingsearch.mit.edu/HTML/data16/F81.html', 'kind': 'drawing',
            'note': 'The design was read from his drawing. He takes it from ' + NAQSH + ', volume 3, figure 81, page 37 '
                    '(the Nim Avard madrasa, Isfahan), and lists the same design at the tomb of Nasr ibn Ali in Uzgen '
                    '(Jay Bonner, Islamic Geometric Patterns, page 31), the Friday mosque and the Masjid-e Ali in '
                    'Isfahan (Arthur Upham Pope, A Survey of Persian Art) and the shrine of Darb-e Imam, Isfahan '
                    '(Eric Broug, Islamic Geometric Design, page 71). The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines that carry the diamonds’ sides on. They close the '
                        'ten-sided pieces, and the squares and pentagons round each corner of the cell.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre. A square sits at '
                            'every corner, with four pentagons round it.',
                    'palette': 'Timurid tile', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 1.172): ('star', 'a'), (10, 0.414): ('ten', 'ground'), (4, 0.172): ('square', 'b'),
         (5, 0.164): ('pentagon', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)

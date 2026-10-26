#!/usr/bin/env python3
"""Builds the interlaced stars of the Charbagh madrasa, Isfahan, drawn by
Brian Wichmann in Tiling Search (data9/A7).

Read from the PDF (a band drawing, band 13 pt, stars 466.3 pt apart on the
axes, drawn in the tutorial's frame), the bands' centre lines put with O at a
star and the square cell's corners at the next stars. Every centre line snaps
to the grid a + b·√2/2 in units of half the star spacing (worst error 0.0011
of OA). The stars at O and at the corners are those of the Leones doors
(alhambra-leones-door-stars): two squares of tip radius √2 − 1, every side
carried on, so the tutorial reuses its steps 1 to 6. Three more kinds of line
make the rest (found with find_crossings.py):
  - through V, where the vertical through F crosses the corner star's side
    PQ (V = (√2/2, 3 − 3√2/2)): a horizontal line, and a line parallel to
    OK1 (it runs through the inner corner of the star at O);
  - the straight line through A and C;
  - through W, where the horizontal through V crosses line AC, a line
    parallel to OK1;
each turned round O. Pieces per cell: two stars, a black ten-sided piece at
A and at C, eight ten-sided and eight eight-sided pieces, twelve pentagons
and four small squares.

Usage: gen_charbagh_stars.py <A7-pieces.json> tutorials/charbagh-stars.json
       pnpm review charbagh-stars
       gen_charbagh_stars.py finish docs/review/charbagh-stars/dump.json tutorials/charbagh-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
import gen_leones_door_stars as leones  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD, BAND = (302.1, 375.5), 466.3, 13.0


def build():
    leones.build()
    step('The vertical line through F crosses line PQ at V. Draw a horizontal line through V. '
         'Draw a line through V parallel to the line from O to K1.', 'ruler', ['V'])
    g.meet('V', 'fv', 'pq', (H, 3 - 3 * H))
    g.line_par('vh', 'V', 'h')
    g.line_par('vd', 'V', 'd45')

    step('Draw a straight line through A and C. It crosses the horizontal line through V at W. '
         'Draw a line through W parallel to the line from O to K1.', 'ruler', ['A', 'C', 'W'])
    g.line_through('ac', 'A', 'C')
    g.meet('W', 'vh', 'ac', (3 * H - 2, 3 - 3 * H))
    g.line_par('wd', 'W', 'd45')

    step('Turn the four lines of the last two steps round O by 90°, three times.')
    g.repeat('vp', ['vh', 'vd', 'ac', 'wd'], 'rot4')


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
        'format': 0, 'id': 'charbagh-stars',
        'title': 'Interlaced stars of the Charbagh madrasa, Isfahan',
        'short': 'Charbagh stars', 'subtitle': 'Charbagh madrasa, Isfahan', 'fold': 4, 'star': 8,
        'style': 'Persian', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s A7 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction. Its stars are those of the Leones doors '
                    'of the Alhambra, at O and at each corner, so it starts with their steps; lines through V and W '
                    'and the lines AC, CB, BD and DA make the rest. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines. No photo of the madrasa '
                       'was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data9/A7: Charbagh Madrasah, Isfahan', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data9/A7.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Mahmood Maher al-Naqsh, Design and '
                     'execution of drawing in Iranian tilework (Reza Abbasi Museum, 1983), volume 4 (the Charbagh '
                     'madrasa, Isfahan), and lists the same design in the Tashkent scrolls (Gülru Necipoğlu, The '
                     'Topkapı Scroll, figure 12) and at the Golestan palace, Tehran. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines that carry its sides on, with the lines through V and W. '
                        'They close the ten-sided pieces, the eight-sided pieces, the pentagons and the small squares.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and every corner, '
                            'and a ten-sided piece halfway between two stars.',
                    'palette': 'Timurid tile', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.402): ('star', 'a'), (10, 0.172): ('black_ten', 'd'), (10, 0.142): ('ten', 'ground'),
         (8, 0.101): ('eight', 'b'), (5, 0.056): ('pentagon', 'c'), (4, 0.059): ('square', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)

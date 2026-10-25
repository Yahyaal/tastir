#!/usr/bin/env python3
"""Builds the crosses and arrows of a private house in Casablanca, drawn by
Brian Wichmann in Tiling Search (data164/P269C3, after Castéra, Arabesques,
page 269, 3c).

Read from the PDF (plain tiles, star spacing 244.8 pt), every corner snapped
to the grid a + b·√2/2 in units of half the spacing (worst error 0.0004 of
OA). A cross with four diagonal arms sits at O; four arrows point from it to
A, B, C and D, where they meet the arrows of the next crosses tip to tip; the
rest of the cell is one sixteen-sided ground round each corner. Every edge
lies on one of three sets of lines: the square A, B, C, D; the small square
of half-side 1 − √2/2 through the point where the vertical through E crosses
line AC; and four diagonals through the point V where the 22.5° line meets
that small square.

Units: OA = 1, A halfway to the next cross; the tile is the square cell.

Usage: gen_casablanca_house_crosses.py <P269C3-pieces.json> tutorials/casablanca-house-crosses.json
       pnpm review casablanca-house-crosses
       gen_casablanca_house_crosses.py finish docs/review/casablanca-house-crosses/dump.json tutorials/casablanca-house-crosses.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
PERIOD = 244.8
S = 1 - H                      # half-side of the small square
T = math.tan(math.pi / 8)


def origin(pieces):
    """The centre of the cross nearest the middle of the page."""
    ps = [p for p in json.load(open(pieces)) if len(p['poly']) == 16 and p['area'] < 10000]
    return min((p['c'] for p in ps), key=lambda c: math.dist(c, (300, 300)))


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a straight line through A and C. Turn it round O by 90°, three times. '
         'The four lines make a square with corners A, B, C and D.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.repeat('acp', ['ac'], 'rot4')

    step('The circle crosses the line from O to K1 at E. Draw a vertical line through E. '
         'It crosses the line through A and C at F. Draw a horizontal line through F. '
         'Turn it round O by 90°, three times. The four lines make a small square round O.', 'ruler', ['c', 'd45'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_par('ev', 'E', 'v')
    g.meet('F', 'ev', 'ac', (H, S))
    g.line_par('fh', 'F', 'h')
    g.repeat('fp', ['fh'], 'rot4')

    step('Draw the line through O that halves the angle AOE. '
         'It crosses the right side of the small square at V. '
         'Draw the line through V parallel to the line from O to K1. Turn it round O by 90°, three times.',
         'ruler', ['A', 'E'])
    g.line_bisect('b22', 'A', 'O', 'E')
    g.meet('V', 'b22', 'fh@3', (S, S * T))
    g.line_par('vd', 'V', 'd45')
    g.repeat('vp', ['vd'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, origin(pieces), PERIOD, 0))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'casablanca-house-crosses',
        'title': 'Crosses and arrows of a house in Casablanca',
        'short': 'Casablanca crosses', 'subtitle': 'Private house, Casablanca', 'fold': 4, 'star': 8,
        'style': 'Moroccan', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P269C3 drawing, its corners snapped to exact '
                    'values. We devised the construction. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. The real panel is '
                       'richly ornamented with double bands; the drawing, and so this tutorial, leaves that out. '
                       'No photo of the house was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data164/P269C3: Private home, Casablanca', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data164/P269C3.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after J.-M. Castéra’s Arabesques: Decorative Art in Morocco '
                     '(1999), page 269, figure 3c (a private house in Casablanca, shown without its ornament). He also '
                     'cites Robert Field’s Geometric Patterns from Islamic Art and Architecture (1998), page 23, for '
                     'the Kubadabad Palace in Turkey. The construction is ours.'}],
        'given': {'O': 'The centre of a cross.', 'A': 'Halfway from O to the next cross on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the cross at O, with its four diagonal arms. Ink the four arrows that point from it to '
                        'A, B, C and D. What is left round each corner of the cell is one large piece.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. The arrows of neighbouring crosses touch tip '
                            'to tip, and a large piece fills the space round each corner.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.284): ('cross', 'b'), (8, 0.343): ('arrow', 'a'), (16, 2.343): ('ground', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)

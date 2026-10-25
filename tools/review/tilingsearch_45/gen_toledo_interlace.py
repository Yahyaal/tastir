#!/usr/bin/env python3
"""Builds the interlaced design of a Toledo tile (V&A 308:75-1866, about
1475-1500), drawn by Brian Wichmann in Tiling Search (data183/RAY12).

Read from the PDF (spacing of the large stars 291.5 pt on the diagonal, band
16 pt), every band centre line snapped to the grid a + b·√2/2 in units of
half the star spacing (worst error 0.0021 of OA). Wichmann draws it turned by
45°; turned back, the tile is the square cell with a large star at O and a
smaller star at each corner. Every line is one of:
  - a side of the star at O: the star of the Patio de los Leones doors
    (alhambra-leones-door-stars), two squares on a circle of radius √2 − 1;
  - a diagonal side of the same star at each corner (line PQ there);
  - the square x, y = ±3(1 − √2/2), through R, where the horizontal through F
    crosses PQ;
  - the diamond through A, B, C and D.
So the opening steps are the Leones doors' construction.

Units: OA = 1, A halfway to the next large star on the horizontal line; the tile is the square cell.

Usage: gen_toledo_interlace.py <RAY12-pieces.json> tutorials/toledo-tile-interlace.json
       pnpm review toledo-tile-interlace
       gen_toledo_interlace.py finish docs/review/toledo-tile-interlace/dump.json tutorials/toledo-tile-interlace.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_leones_door_stars import build as leones  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD, BAND = (300.4, 373.9), 291.46, 16.0


def build():
    leones()
    step('Draw a straight line through A and C. Turn it round O by 90°, three times. '
         'The four lines make a square with corners A, B, C and D.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.repeat('acp', ['ac'], 'rot4')
    step('Draw a horizontal line through F. It crosses the line through P and Q at R. '
         'Draw a vertical line through R. Turn it round O by 90°, three times.', 'ruler', ['F', 'pq'])
    g.line_par('fh', 'F', 'h')
    g.meet('R', 'fh', 'pq', (3 - 3 * H, H))
    g.line_par('rv', 'R', 'v')
    g.repeat('rp', ['rv'], 'rot4')


def drawing(pieces):
    """Wichmann's band centre lines, turned by 45° into the tutorial's frame."""
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)
    return [[((x + y) * H, (y - x) * H) for x, y in P] for P in polys]


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(drawing(pieces))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'toledo-tile-interlace',
        'title': 'Interlaced stars of a Toledo tile',
        'short': 'Toledo tile interlace', 'subtitle': 'Toledo tile, V&A', 'fold': 4, 'star': 8,
        'style': 'Mudéjar', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s RAY12 drawing, its corners snapped to exact '
                    'values. We devised the construction: the star of the Patio de los Leones doors at O and at each '
                    'corner of the cell, a square through R and the diamond through A, B, C and D. The drawing gives '
                    'no steps.',
            'changes': 'Wichmann draws the design turned by 45°; it is turned back here so that the tile is the square '
                       'cell. The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'tile was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data183/RAY12: Toledo tile, V&A', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data183/RAY12.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of a tin-glazed earthenware tile from Toledo, about '
                     '1475-1500 (Victoria and Albert Museum 308:75-1866; Anthony Ray, Spanish Pottery 1248-1898, '
                     '2000, p. 331). The construction is ours.'}],
        'given': {'O': 'The centre of a large eight-pointed star.',
                  'A': 'Halfway from O to the next large star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the bands that carry the stars’ sides on. They close the small stars at '
                        'the corners and the pieces between the stars.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A large star sits at every centre and a '
                            'smaller one at every corner.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.402): ('star', 'a'), (8, 0.343): ('shield', 'b'), (16, 0.284): ('cross', 'a'),
         (8, 0.201): ('arrow', 'c'), (8, 0.142): ('link', 'ground'), (4, 0.071): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)

#!/usr/bin/env python3
"""Builds the interlaced stars of the Alcázar of Seville, drawn by Brian
Wichmann in Tiling Search (data173/SPA2215, after David Wade's photo SPA 2215).

Read from the PDF (star spacing 233.2 pt, band 15 pt), every band centre line
snapped to the grid a + b·√2/2 in units of half the star spacing (worst error
0.0011 of OA). Every line is a side of the star at O or of the same star at a
cell corner, carried on: exactly the lines of the Patio de los Leones doors
(alhambra-leones-door-stars, A233), so this tutorial is that one's variant and
shares all its construction steps. Only the ink differs: the large star at O
is the eight-pointed {8/3} star, its sides carried on to where they cross, so
the kites round the Leones star join it, and the stars at the corners stay
two squares.

Units: OA = 1, A halfway to the next star on the horizontal line; the tile is the square cell.

Usage: gen_alcazar_interlaced_stars.py <SPA2215-pieces.json> tutorials/alcazar-interlaced-stars.json
       pnpm review alcazar-interlaced-stars
       gen_alcazar_interlaced_stars.py finish docs/review/alcazar-interlaced-stars/dump.json tutorials/alcazar-interlaced-stars.json
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import put, step  # noqa: E402
from gen_leones_door_stars import build  # noqa: E402


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, (299.8, 376.5), 233.2, 15.0))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alcazar-interlaced-stars',
        'title': 'Interlaced stars of the Alcázar of Seville',
        'short': 'Alcázar interlaced stars', 'subtitle': 'Alcázar, Seville', 'fold': 4, 'star': 8,
        'style': 'Mudéjar', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s SPA2215 drawing, its corners snapped to exact '
                    'values. Its lines are those of the Patio de los Leones doors: a star at O and one at each corner '
                    'of the cell, both the same size, every side carried on. We reused that construction; the drawing '
                    'gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the drawing '
                       'checks the finished lines, not how the design was first laid out. No photo of the real '
                       'panel was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data173/SPA2215: Alcázar, Seville', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data173/SPA2215.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after David Wade’s photograph SPA 2215 of the Alcázar of '
                     'Seville. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the large star at O with its sides carried on to their crossings. Ink the bands that carry '
                        'the stars’ sides on. They close the small stars at the corners, the long hexagons, the arrows '
                        'and the triangles.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A large star sits at every centre and a small '
                            'one at every corner. A long hexagon joins each two large stars.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.971): ('large_star', 'a'), (16, 0.402): ('small_star', 'b'), (6, 0.515): ('hexagon', 'c'),
         (8, 0.314): ('arrow', 'd'), (3, 0.086): ('triangle', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)

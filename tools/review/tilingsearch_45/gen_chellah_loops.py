#!/usr/bin/env python3
"""Builds the interlaced loops of the Chellah minaret, Rabat, drawn by Brian
Wichmann in Tiling Search (data15/CM014). It is the design of the Alhambra
Museum loops (RE3559, alhambra-museum-loops), with the same construction and
ink: moved out by half a band (25 pt) his pieces land on the same centre
lines (cross 1.2427, star 0.5857, square 0.0858 of OA², as in RE3559). Only
the colouring differs: one band colour, dark crosses and pale stars, after
Castéra's colour plate.

Usage: gen_chellah_loops.py <CM014-pieces.json> tutorials/chellah-minaret-loops.json
       pnpm review chellah-minaret-loops
       gen_chellah_loops.py finish docs/review/chellah-minaret-loops/dump.json tutorials/chellah-minaret-loops.json
(CM014-pieces.json from 0_vectors.py and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import put, step  # noqa: E402
from gen_alhambra_museum_loops import NAMES, build  # noqa: E402,F401


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = cm.frame_pieces(pieces, (301.5, 206.0), 338.0, 25.0)
    paths = cm.along_ink(cm.network(polys))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'chellah-minaret-loops', 'title': 'Interlaced loops of the Chellah minaret (Rabat)',
        'short': 'Chellah loops', 'subtitle': 'Chellah mosque minaret, Rabat', 'fold': 4,
        'style': 'Marinid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CM014 drawing. It is the design of the '
                    'Alhambra Museum loops, built the same way: the straight bands pass where a circle of radius '
                    'one half, or its mirror image, crosses the diagonal. The drawing gives no steps.',
            'changes': 'The compass operations, step order and named crossings are our reconstruction. '
                       'Wichmann’s colours follow Castéra’s plate of the minaret; no photo of the minaret was '
                       'available to check the lines.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data15/CM014: Minaret of Chellah Mosque, Rabat', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM014.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, coloured after J.-M. Castéra’s Arabesques (page 103, '
                     'the Chellah minaret). He lists the same repeat in the Alhambra Museum (RE3559), at San Juan de '
                     'los Reyes in Toledo, on a stucco ceiling in the Bardo, Tunis, and on Moroccan zellige. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a loop.', 'A': 'The centre of an eight-pointed star between four loops.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the bands. Each band makes a square loop with a notch in every side. '
                        'The loops link with their neighbours.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Put copies of the square cell side by side. Each loop weaves over and '
                                            'under its four neighbours.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


if __name__ == '__main__':
    cm.run(main, {(24, 1.243): ('cross', 'd'), (16, 0.586): ('star', 'b'), (4, 0.086): ('square', 'ground')})

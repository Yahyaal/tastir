#!/usr/bin/env python3
"""E41 of data18 (Tiling Search data18/E41, Alhambra, Sala del Mexuar dado),
batch T4, 27 October 2026: the dado's sixteen-pointed rosettes, a variant of
`alhambra-mexuar-vestibule-rosettes` (data208/E41).

Reading the drawing: pieces separated by white bands 8 pt wide, rosettes
257.47 pt apart along each axis (the same lattice and page scale as the
vestibule drawing). Moved out by half a band, every one of the 72 lines the
drawing needs inside the tile is a line of the vestibule construction
(worst offset 0.0004 of OA), so the construction is shared step for step.
The only difference is the ink: the dado leaves out the sixteen short lines
that close the tiny kites round each rosette's star, so the star is larger
(area 0.0592 in place of 0.0320 + 16 × 0.0017). David Wade's photo SPA 1917
of the dado agrees: the blue star at the centre and the corners touches the
white bands with no tiny kites round it.

Usage: gen_alhambra_mexuar_dado_rosettes.py <E41-data18-pieces.json> tutorials/alhambra-mexuar-dado-rosettes.json
       pnpm review alhambra-mexuar-dado-rosettes
       gen_alhambra_mexuar_dado_rosettes.py finish <dump.json>   (prints the piece types)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
import gen_alhambra_mexuar_vestibule_rosettes as ves  # noqa: E402
from common import step  # noqa: E402

ORIGIN, HALF, BAND = (297.5, 372.378), 257.47, 8.0

# (vertices, area) -> (name, palette slot, small); slots follow the photo:
# a black petals, b ochre stars, c blue, d green, ground the white bands' ground
NAMES = {(6, 0.03319): ('petal', 'a', False), (32, 0.05918): ('rosette_star', 'c', True),
         (12, 0.01941): ('twelve', 'd', False), (16, 0.01889): ('star', 'b', False),
         (10, 0.01757): ('ten', 'd', False), (14, 0.01599): ('fourteen', 'c', False),
         (8, 0.01511): ('eight', 'c', False), (6, 0.01443): ('hexagon', 'd', False),
         (4, 0.00683): ('kite', 'c', False), (4, 0.00334): ('small_kite', 'b', True)}
COUNTS = {'petal': 16, 'rosette_star': 1, 'twelve': 6, 'star': 5, 'ten': 16, 'fourteen': 4, 'eight': 4,
          'hexagon': 40, 'kite': 16, 'small_kite': 32}


def tutorial(pieces):
    ves.build()
    cm.snap.__defaults__ = (0.002,)
    polys = cm.frame_pieces(pieces, ORIGIN, 2 * HALF, BAND)
    paths = cm.along_ink(cm.network(polys, hcell=1.0, reach=3, diamond=True))
    step('Join A, C, B and D to mark the tile that repeats.', 'fade')
    cm.put('tile', 'polygon', None, {'polygon': ['A', 'C', 'B', 'D']})
    expect = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm], **({'small': True} if sm else {})}
        for (v, a), (nm, _, sm) in NAMES.items()]}
    return {
        'format': 0, 'id': 'alhambra-mexuar-dado-rosettes',
        'title': 'Sixteen-pointed rosettes of the Sala del Mexuar dado, Alhambra',
        'short': 'Mexuar dado rosettes', 'subtitle': 'Sala del Mexuar, north wall dado, Alhambra, Granada',
        'given': {'O': 'The centre of a rosette.', 'A': 'The centre of the eight-pointed star halfway to the next rosette.'},
        'fold': 4, 'star': 16, 'style': 'Moroccan', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Wichmann’s E41 drawing of the Sala del Mexuar dado (data18), '
                    'by the centre lines of its white bands. Every one of its lines is a line of the Mexuar '
                    'vestibule ceiling design (data208/E41), to within 0.0004 of OA, so this tutorial shares that '
                    'construction step for step. The dado inks fewer lines: the sixteen short lines that close the '
                    'tiny kites round each rosette’s star are left out, so the star is larger. The drawing gives no '
                    'steps; we devised the construction.',
            'changes': 'The compass steps, their order and the named points are ours. The lines are the centre '
                       'lines of the drawing’s bands. David Wade’s photograph SPA 1917 of the dado agrees with the '
                       'drawing: our lines run along its white bands, and its stars at the rosettes touch the bands '
                       'with no tiny kites round them. Colours follow the photograph: black petals, ochre stars, '
                       'blue and green pieces.',
            'reviewed': '2026-10-27'},
        'credits': [{
            'source': 'Tiling Search, data18/E41: Alhambra, Sala del Mexuar',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data18/E41.html',
            'note': 'Read from his finished drawing, not construction instructions. The pattern is the ceramic '
                    'mosaic dado of the north wall of the Sala del Mexuar. He cites David Wade’s photograph SPA 1917, '
                    'Bonner’s Islamic Geometric Patterns (page 297, figure 185b) and Escher’s Alhambra sketches '
                    '(page 41).'}],
        'photos': [{
            'file': 'alhambra-wichmann/wade-spa_1917.jpg',
            'caption': 'The tiled dado of the Sala del Mexuar, Alhambra (photo SPA 1917).',
            'creator': 'David Wade', 'license': 'All rights reserved',
            'url': 'https://patterninislamicart.com/', 'private': True}],
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They are the middles of the white bands.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Alhambra', 'look': 'strapwork',
                    'colors': {nm: slot for nm, slot, _ in NAMES.values()},
                    'text': 'Put copies of the tile side by side, corner to corner. A rosette sits at the centre of '
                            'every tile, and an eight-pointed star at every corner.'},
        'expect': expect}


if __name__ == '__main__':
    if sys.argv[1] == 'finish':
        d = json.load(open(sys.argv[2]))
        for t in d['types']:
            print((t['vertices'], round(t['area'], 5)), t['perCell'], t['sliver'])
    else:
        tut = tutorial(sys.argv[1])
        cm.write(tut, sys.argv[2])
        print(len(cm.steps), 'steps;', len(tut['ink']['paths']), 'ink paths')

#!/usr/bin/env python3
"""Builds the tile mosaic inside the niches of the arch into the Sala de la
Barca (Alhambra), drawn by Brian Wichmann in Tiling Search (data9/H153, 218
pieces): blue eight-pointed stars turning round a white sixteen-sided piece,
with black eight-sided pieces, green and ochre six-sided pieces, white
four-pointed stars and white kites. Plate 153 of Humbert. The group is p4g: the
four-fold centres are the four-pointed stars, not the white pieces, whose
surroundings have only half turns and diagonal mirrors, and the tile's corners
are the mirror images of O.

Read from the PDF (plain tiles edge to edge). With O at a four-pointed star and
A at the white piece (OA = 206.06 pt, a star's edge e = 25 pt = OA/(4 + 3√2)),
every corner lies on lines at 3/2 − √2, 1/2 and √2 − 1/2 from O, the same
distances on the axes and the diagonals, and the diagonals at 3/2 − √2 from K1,
inside the corners.

Areas in e²: star 8 + 4√2, white piece 4 + 4√2, black 6 + 4√2, six-sided
5 + 4√2, four-pointed star 4, kite 1 + √2.

Usage: gen_alhambra_barca_niche_stars.py <H153-pieces.json> tutorials/alhambra-barca-niche-stars.json
       pnpm review alhambra-barca-niche-stars
       gen_alhambra_barca_niche_stars.py finish docs/review/alhambra-barca-niche-stars/dump.json tutorials/alhambra-barca-niche-stars.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

ORIGIN, PERIOD = (357.9, 229.3), 412.12
R2 = math.sqrt(2)
AX1 = 1.5 - R2       # the first axis line
TURN = 'Turn it round O by 90°, three times.'
TURN8 = 'Turn it round O by 45°, seven times.'
OK = 'the line through O and K1'


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a line through each of A, B, C and D at 90° to its line from O. '
        'These four lines cross at K1, K2, K3 and K4. Draw a straight line through O and K1.')

    step(f'Draw a circle with centre A through O. It crosses the first circle at G and H. '
         f'Draw a straight line through G and H. {TURN8}', 'compass')
    g.circle_through('cA', 'A', 'O')
    g.meet('G', 'c', 'cA', (0.5, math.sqrt(3) / 2))
    g.meet('H', 'c', 'cA', (0.5, -math.sqrt(3) / 2))
    g.line_through('mid', 'G', 'H')
    g.repeat('midr', ['mid'], 'rot8')

    step(f'The first circle crosses {OK} at E. Draw the line through O that halves the angle AOE. '
         f'It crosses line GH at T. Draw a line through T parallel to {OK}. {TURN}')
    cm.steps[-1]['textWithoutHelpers'] = (
        f'The first circle crosses {OK} at E. Draw the line through O that halves the angle AOE. '
        f'It crosses line GH at T. Draw a line through T parallel to {OK}. '
        'Turn it round O by 90°. Keep only the turned line.')
    g.meet('E', 'c', 'd45', (R2 / 2, R2 / 2))
    g.line_bisect('r22', 'A', 'O', 'E')
    g.meet('T', 'mid', 'r22', (0.5, (R2 - 1) / 2))
    g.line_par('d1', 'T', 'd45')
    g.repeat('d1r', ['d1'], 'rot4')

    step(f'Line OT crosses the line through T, turned by 90°, at P. '
         f'Draw a horizontal line through P. {TURN8}')
    g.meet('P', 'r22', 'd1@1', ((R2 - 1) / 2, AX1))
    g.line_par('a1', 'P', 'h')
    g.repeat('a1r', ['a1'], 'rot8')

    step(f'The horizontal line through P, turned by 270°, crosses line OA at S. '
         f'Draw a circle with centre A and radius OS. It crosses line OA at W, left of A. '
         f'Draw a vertical line through W. {TURN8}', 'compass')
    g.meet('S', 'a1@6', 'h', (AX1, 0))
    g.circle_from('cAS', 'A', 'O', 'S')
    g.meet('W', 'cAS', 'h', (1 - AX1, 0))
    g.line_perp('a3', 'W', 'h')
    g.repeat('a3r', ['a3'], 'rot8')

    step(f'The vertical line through A crosses the horizontal line through P, turned by 225°, at Q. '
         f'Draw a line through Q at 90° to {OK}. {TURN}')
    g.meet('Q', 'gx', 'a1@5', (1, 1 - AX1 * R2))
    g.line_perp('d3', 'Q', 'd45')
    g.repeat('d3r', ['d3'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0.0))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-barca-niche-stars',
        'title': 'Turning stars in the niches of the Sala de la Barca (Alhambra)',
        'short': 'Sala de la Barca niche stars', 'subtitle': 'Sala de la Barca, Alhambra',
        'fold': 4, 'chiral': True, 'star': 8, 'style': 'Nasrid', 'region': 'Alhambra and Nasrid Spain', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s H153 drawing, its corners snapped to exact '
                    'values. The drawing gives no steps; we devised the construction.',
            'changes': 'The compass steps, their order and the named points are ours. No photograph confirms this '
                       'design: Wade’s photograph of the panel is taken at an angle, so we built it from Wichmann’s '
                       'drawing alone. The colours follow the drawing; its dark green is shown in the palette’s teal.',
            'reviewed': '2026-11-01'},
        'credits': [
            {'source': 'Tiling Search, data9/H153: Alhambra, Sala de la Barca', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data9/H153.html', 'kind': 'drawing',
             'note': 'Read from his finished drawing, not construction instructions. His reference is Plate 153 of '
                     'Claude Humbert, Islamic Ornamental Design: the tile mosaic inside the niches of the arch '
                     'from the Patio de los Arrayanes into the Sala de la Barca. The construction is ours.'}],
        'given': {'O': 'The centre of a white four-pointed star.', 'A': 'The centre of the next white sixteen-sided piece.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the small star at O, the blue stars and the white pieces. '
                        'They also make the black and six-sided pieces and the kites.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A four-pointed star sits at the centre and at the '
                            'corners of every tile. A white piece sits at the middle of every side.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.201): ('star', 'd'), (16, 0.142): ('white_piece', 'ground'), (8, 0.172): ('black_piece', 'a'),
         (6, 0.157): ('six_sided', 'c'), (8, 0.059): ('four_point_star', 'ground'), (4, 0.036): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
    if sys.argv[1] == 'finish':
        # Wichmann's green six-sided pieces (nth counted by the player); the others are ochre.
        t = json.load(open(sys.argv[3]))
        t['pattern']['placements'] = {'repeat': [1, 1], 'rules': [
            {'piece': 'six_sided', 'nth': n, 'color': 'b'} for n in (2, 3, 4, 5)]}
        cm.write(t, sys.argv[3])

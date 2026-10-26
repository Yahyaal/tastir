#!/usr/bin/env python3
"""Builds the tile panel in the Alhambra museum drawn by Brian Wichmann in
Tiling Search (data159/P008B, from John Rigby's photograph): a large {8/3}
star at O, small stars of two squares at the middles of the sides and at the
corners, with blue twelve-sided pieces, black long hexagons, octagons, kites
and triangles between.

Read from the PDF (plain tiles edge to edge, 2 pt grey outlines; 1_pieces.py
--precision 2). With O at a large star and A at the next small star
(OA = 139.881 pt, half the star spacing 279.762 pt) every corner snaps to the
grid (a + b·√2)/4; in units of the small star's point radius r = OA/(2 + 2√2)
the worst error is 0.0003 r. The lines are exactly those of the Arrayanes
porch ceiling (ALHAMK) and the Nasrid textile: with s = (2 − √2)/4 the axis
and diagonal lines lie at s, 3s, 1 − 3s and 1 − s from O. Only the ink
differs: the porch ceiling's star at O and its eight kites become one large
star with 45° points.
Areas in units of r², with H = √2/2: large star 8H (one), small star 8 − 8H (three), twelve-sided piece −1 + 6H
(eight), long hexagon 3 (four), octagon 2 (twelve: four black, eight white),
short octagon 1 (eight), triangle 1/2 (eight), kite −1 + 2H (sixteen);
together 48 + 64H = 4(2 + 4H)², the cell.

Usage: gen_alhambra_museum_pointed_stars.py <P008B-pieces.json> tutorials/alhambra-museum-pointed-stars.json
       pnpm review alhambra-museum-pointed-stars
       gen_alhambra_museum_pointed_stars.py finish docs/review/alhambra-museum-pointed-stars/dump.json tutorials/alhambra-museum-pointed-stars.json
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import put, step  # noqa: E402
import gen_nasrid_textile_stars as textile  # noqa: E402

ORIGIN, PERIOD = (298.866, 374.296), 279.762


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    textile.build(corner_diagonals=True)
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0.0))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-museum-pointed-stars',
        'title': 'Pointed stars of a tile panel in the Alhambra museum',
        'short': 'Alhambra museum pointed stars', 'subtitle': 'Alhambra museum, Granada',
        'fold': 4, 'star': 8, 'style': 'Nasrid', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P008B drawing, its corners snapped to exact '
                    'values. We devised the construction. Its lines are exactly those of the Arrayanes porch ceiling '
                    'and the Nasrid textile stars, so the construction is the same; only the inked pieces differ. '
                    'The star at O and the eight kites round it become one large star with sharp points. '
                    'The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. The colours follow '
                       'Wichmann’s drawing, which he took from the original; no photograph was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data159/P008B: Granada museum', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data159/P008B.html', 'kind': 'drawing',
             'note': 'Read from his finished drawing, not construction instructions. His reference is a photograph '
                     'by John Rigby of a tile panel in the Alhambra museum, Granada (personal communication); '
                     'he took the colours from the original and left out the decoration on the star. '
                     'He links it to the Patio de los Arrayanes. The construction is ours.'}],
        'given': {'O': 'The centre of a large eight-pointed star.', 'A': 'The centre of the next small star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the large star at O and the small stars. '
                        'They also make the long hexagons, the twelve-sided pieces, the octagons, the kites and the triangles.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A large star sits at the centre of every tile. '
                            'A small star sits at every corner and at the middle of every side.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {},
                    # Wichmann's colours: the four octagons beside the star at the corner are black like the
                    # long hexagons, the eight round the large star white (nth counted by the player).
                    'placements': {'repeat': [1, 1], 'rules': [
                        {'piece': 'octagon', 'nth': n, 'color': 'c'} for n in (0, 1, 10, 11)]}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.243): ('large_star', 'a'), (12, 0.139): ('twelve', 'b'), (6, 0.129): ('hexagon', 'c'),
         (16, 0.101): ('star', 'a'), (8, 0.086): ('octagon', 'ground'), (8, 0.043): ('small_octagon', 'ground'),
         (3, 0.021): ('triangle', 'ground'), (4, 0.018): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)

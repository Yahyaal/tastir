#!/usr/bin/env python3
"""Builds the carved door of the Royal Palace Museum, Fès, drawn by Brian
Wichmann in Tiling Search (data152/C101, after Castéra): eight-pointed stars
of two squares on a square grid, a rosette of eight petals round every other
star and chevrons round the stars between.

Read from the PDF (tiles edge to edge, no bands). With O at a rosette's star
and A at the next star (OA = 233.1 pt), the chevron stars sit at the corners
(±1, ±1) and every corner snaps to the grid a + b·√2/2 (worst error 0.0007 of
OA). Every line runs at 0°, 45° or 90°:
  the stars of two squares on every grid point: x = n ± p, y = n ± p and
  x ± y = n ± q, with p = (2 − √2)/4 and q = p√2 = (√2 − 1)/2 (the star's
  point radius);
  x = ±w, y = ±w with w = (3√2 − 2)/4: the petal's tip (w, w) lies on the
  circle about O through the next star's inner point (1 − q, 0);
  x ± y = ±3/2: through E (1 − p, 1 − p − q), a corner of the chevron.
p: the line from R (−√2/2, −√2/2) to M (1, √2/2) crosses the horizontal at (p, 0).

Usage: gen_fes_palace_door_stars.py <C101-pieces.json> tutorials/fes-palace-door-stars.json
       pnpm review fes-palace-door-stars
       gen_fes_palace_door_stars.py finish docs/review/fes-palace-door-stars/dump.json tutorials/fes-palace-door-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)
H = R2 / 2
PP = (2 - R2) / 4
Q = PP * R2
W = (3 * R2 - 2) / 4
ORIGIN, PERIOD, BAND = (297.5, 374.2), 466.2, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The line through O and K1 crosses the circle at P and R. Draw a horizontal line through P. '
         'It crosses the vertical line through A at M. Draw a straight line through R and M. '
         'It crosses the horizontal line through O at T.', 'ruler', ['P', 'R', 'M', 'T'])
    g.meet('P', 'c', 'd45', (H, H))
    g.meet('R', 'c', 'd45', (-H, -H))
    g.line_par('ph', 'P', 'h')
    g.meet('M', 'ph', 'gx', (1, H))
    g.line_through('rm', 'R', 'M')
    g.meet('T', 'rm', 'h', (PP, 0))

    step('Draw a circle with centre O through T. Draw a vertical line through T. '
         'Turn the vertical line round O by 90°, three times. The four lines make a small square.',
         'compass', ['T'])
    g.circle_through('ct', 'O', 'T')
    g.line_par('tv', 'T', 'v')
    g.repeat('sq', ['tv'], 'rot4')

    step('Two sides of the small square cross at Q, on the line through O and K1. '
         'Draw a circle with centre O through Q. It crosses the horizontal line through O at S. '
         'Draw a line through S at 90° to the line through O and K1. '
         'Turn it round O by 90°, three times. The star at O is finished.', 'compass', ['Q', 'S'])
    g.meet('Q', 'tv', 'tv@1', (PP, PP))
    g.circle_through('cq', 'O', 'Q')
    g.meet('S', 'cq', 'h', (Q, 0))
    g.line_perp('sd', 'S', 'd45')
    g.repeat('sdr', ['sd'], 'rot4')

    step('Draw a circle with centre A and the same radius as the circle through T. '
         'It crosses the horizontal line through O at U, left of A. '
         'Draw a circle with centre A and the same radius as the circle through Q. '
         'It crosses the horizontal line through O at V and X. V is left of A.', 'compass', ['U', 'V', 'X'])
    g.circle_from('ca', 'A', 'O', 'T')
    g.meet('U', 'ca', 'h', (1 - PP, 0))
    g.circle_from('cb', 'A', 'O', 'S')
    g.meet('V', 'cb', 'h', (1 - Q, 0))
    g.meet('X', 'cb', 'h', (1 + Q, 0))

    step('Draw a vertical line through U. Draw a line through each of V and X at 90° to the line through O and K1. '
         'Turn the three lines round O by 90°, three times. They make the stars next to O.', 'ruler', ['U', 'V', 'X'])
    g.line_par('uv', 'U', 'v')
    g.line_perp('vd', 'V', 'd45')
    g.line_perp('xd', 'X', 'd45')
    g.repeat('nb', ['uv', 'vd', 'xd'], 'rot4')

    step('Draw a circle with centre O through V. It crosses the line through O and K1 at G. '
         'Draw a vertical line through G. The line through S, turned, crosses the vertical line through A at N. '
         'It crosses the vertical line through U at E. Draw a line through each of N and E at 90° to the line through '
         'O and K1.', 'compass', ['G', 'N', 'E'])
    g.circle_through('cv', 'O', 'V')
    g.meet('G', 'cv', 'd45', (W, W))
    g.line_par('gv', 'G', 'v')
    g.meet('N', 'sd@3', 'gx', (1, 1 - Q))
    g.meet('E', 'sd@3', 'uv', (1 - PP, 1 - PP - Q))
    g.line_perp('nd', 'N', 'd45')
    g.line_perp('ed', 'E', 'd45')

    step('Turn the three new lines through G, N and E round O by 90°, three times.', 'ruler', ['G', 'N', 'E'])
    g.repeat('fr', ['gv', 'nd', 'ed'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'fes-palace-door-stars',
        'title': 'Stars and rosettes of a door in the Royal Palace Museum, Fès',
        'short': 'Fès palace door stars', 'subtitle': 'Royal Palace Museum, Fès', 'fold': 4, 'star': 8,
        'style': 'Moroccan', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s C101 drawing, its corners snapped to exact '
                    'values. We devised the construction. A star of two squares sits on every point of a square '
                    'grid, and every line runs across, up or at 45°. The tips of the rosette’s petals lie on the '
                    'circle about O through the inner points of the next stars. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'door was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data152/C101: Royal Palace Museum, Fez, Morocco', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data152/C101.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Jean-Marc Castéra, Arabesques: '
                     'Decorative Art in Morocco, page 101 (a carved wooden door in the Royal Palace Museum, Fès), '
                     'and lists it in Degeorge and Porter, in Paccard (volume 1, page 210) and in David Wade’s '
                     'photo SPA 2505 (Alcázar, Seville). The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star in a rosette.', 'A': 'The centre of the next star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the stars, the petals of the rosette '
                        'round O and the chevrons round the stars at the corners.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A rosette sits at every centre, and a star '
                            'ringed by chevrons at every corner.',
                    'palette': 'Marinid zellige', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(9, 0.143): ('nine', 'ground'), (6, 0.129): ('petal', 'b'), (16, 0.101): ('star', 'a'),
         (6, 0.086): ('chevron', 'c'), (6, 0.078): ('hexagon', 'a'), (8, 0.078): ('eight', 'ground'),
         (4, 0.025): ('kite', 'ground'), (3, 0.021): ('triangle', 'c'), (4, 0.018): ('small_kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)

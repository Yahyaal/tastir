#!/usr/bin/env python3
"""F207 (Tiling Search data153/F207, Salim Chishti's tomb, Fatehpur Sikri,
a pierced marble screen), ten-fold batch T1.

Reading the drawing (27 October 2026): pieces edge to edge; decagons on a
centred rectangular lattice (cmm), 550.58 by 757.8 pt, the decagon's radius
64.72 pt. Turned by −90° so that a corner of the decagon lies on OA, with OA
the decagon's radius, the repeat is the rectangle |x| <= W, |y| <= H with
W = 2φ√5·cos 36° = 5.8541 and H = W·tan 36° = 4.2533, decagons at its corners.
Every edge lies on one of 25 lines of a decagon of the lattice: the five
lines through its centre and its corners, the ten lines of its sides, and
the ten lines of the sides of the decagon of radius √5 about it (drawing
within 0.001).

Use: gen_salim_chishti_decagons.py <F207-pieces.json> tutorials/salim-chishti-decagons.json,
pnpm review salim-chishti-decagons, then
gen_salim_chishti_decagons.py finish <dump.json> <tutorial.json>.
Lab: gen_salim_chishti_decagons.py lab <F207-pieces.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap10_t1 as s10  # noqa: E402

ORIGIN, UNIT, TURN = (304.34, 368.78), 64.72, -90.0
S5, PHI = s10.S5, s10.PHI
W = 2 * PHI * S5 * math.cos(math.radians(36))
H = W * math.tan(math.radians(36))


def at(r, deg):
    t = math.radians(deg)
    return (r * math.cos(t), r * math.sin(t))


def S(j):
    """The line of the decagon's side from corner j to corner j + 1 (A is 0)."""
    return 's%d' % (j % 10)


def T(j):
    """The line through P(j + 1) and P(j + 2)."""
    return 't%d' % (j % 10)


def build():
    s10.opening()
    step('Draw a straight line through B and G, C and H, D and J, and E and K. '
         'With the horizontal line, they cross at O and run through the ten points.', 'ruler')
    for nm, a, b in [('rB', 'B', 'G'), ('rC', 'C', 'H'), ('rD', 'D', 'J'), ('rE', 'E', 'K')]:
        g.line_through(nm, a, b)
    step('Draw a straight line through A and B, B and C, and on round the circle to K and A. '
         'These lines carry the sides of the decagon.', 'ruler')
    for j in range(10):
        g.line_through(S(j), 'ABCDEFGHJK'[j], 'ABCDEFGHJK'[(j + 1) % 10])
    step('Draw a circle with centre O whose radius is the distance from Q to R. '
         'It crosses the lines through O at P1 to P10, with P1 on the horizontal line beyond A.', 'compass', ['Q', 'R'])
    g.circle_from('cP', 'O', 'Q', 'R')
    rad = ['h', 'rB', 'rC', 'rD', 'rE']
    for i in range(10):
        g.meet(f'P{i + 1}', 'cP', rad[i % 5], at(S5, 36 * i))
    step('Draw a straight line through P1 and P2, P2 and P3, and on round the circle to P10 and P1. '
         'These lines carry the sides of a larger decagon.', 'ruler')
    for j in range(10):
        g.line_through(T(j), 'P%d' % (j + 1), 'P%d' % ((j + 1) % 10 + 1))
    step('The line through P3 and P4 crosses the line through P10 and P1 at T1. '
         'Draw a circle with centre O through T1. '
         'It crosses the line through B and G again at T3. It crosses the line through E and K at T2 and T4. '
         'Draw a circle with centre T1 through O. It crosses the line through B and G at N1. '
         'Draw a circle with centre O through N1. It crosses the lines through O at N2, N3 and N4.', 'compass')
    g.meet('T1', T(2), T(9), at(PHI + 2, 36))
    g.circle_through('cT0', 'O', 'T1')
    g.meet('T2', 'cT0', 'rE', at(PHI + 2, 144))
    g.meet('T3', 'cT0', 'rB', at(PHI + 2, 216))
    g.meet('T4', 'cT0', 'rE', at(PHI + 2, 324))
    g.circle_through('cT', 'T1', 'O')
    g.meet('N1', 'cT', 'rB', (W, H))
    g.circle_through('cN', 'O', 'N1')
    g.meet('N2', 'cN', 'rE', (-W, H))
    g.meet('N3', 'cN', 'rB', (-W, -H))
    g.meet('N4', 'cN', 'rE', (W, -H))
    step('Draw a straight line through N1 and N2, and N3 and N4. '
         'Draw a straight line through N1 and N4, and N2 and N3. They are the sides of the tile.', 'ruler')
    cm.steps[-1]['textWithoutHelpers'] = ('Draw a straight line through N1 and N2, and N3 and N4. '
                                          'They are the top and bottom sides of the tile.')
    g.line_through('kt', 'N1', 'N2')
    g.line_through('kb', 'N3', 'N4')
    g.line_through('kr', 'N1', 'N4')
    g.line_through('kl', 'N2', 'N3')
    step('Draw a line through N1 parallel to line CH, and one through N3. '
         'Draw a line through N2 parallel to line DJ, and one through N4.', 'ruler')
    g.line_par('n1', 'N1', 'rC')
    g.line_par('n3', 'N3', 'rC')
    g.line_par('n2', 'N2', 'rD')
    g.line_par('n4', 'N4', 'rD')
    step('Draw the decagons at the corners of the tile.')
    del cm.steps[-1]['create']
    cm.steps[-1]['parts'] = []

    def part(text):
        g.cur = {'text': text, 'create': {}, 'animate': 'ruler'}
        cm.steps[-1]['parts'].append(g.cur)
    pts = 'ABCDEFGHJK'
    for k, (tp, rad, j0) in enumerate([('T1', 'rB', 0), ('T2', 'rE', 3), ('T3', 'rB', 5), ('T4', 'rE', 8)]):
        a, b, c = pts[j0], pts[(j0 + 1) % 10], pts[(j0 + 2) % 10]
        p, q, r = j0 + 1, (j0 + 1) % 10 + 1, (j0 + 2) % 10 + 1
        part('Draw a line through %s at 90° to line %s. ' % (tp, 'BG' if rad == 'rB' else 'EK')
             + 'Mirror in it the lines through %s and %s, %s and %s, P%d and P%d, and P%d and P%d. ' % (a, b, b, c, p, q, q, r)
             + 'The new lines run round N%d as the first ones run round O.' % (k + 1))
        g.cur['textWithoutHelpers'] = (
            'Copy round N%d the lines through %s and %s, %s and %s, ' % (k + 1, a, b, b, c)
            + 'P%d and P%d, and P%d and P%d.' % (p, q, q, r))
        g.line_perp('m' + tp, tp, rad)
        g.repeat('mir%d' % (k + 1), [S(j0), S(j0 + 1), T(j0), T(j0 + 1)], 'mirror:m' + tp)
    step('The line through N1 parallel to line CH crosses a side of the decagon round N1 at X. '
         'Draw a horizontal line through X. Turn it round O by 180°.', 'ruler')
    g.meet('X', 'n1', S(0) + '@1', (W - math.cos(math.radians(72)), H - math.sin(math.radians(72))))
    g.line_par('x', 'X', 'h')
    g.repeat('xr', ['x'], 'rot2')


def drawing(pieces):
    return s10.frame(pieces, ORIGIN, UNIT, TURN)


def lab():
    build()
    polys = drawing(sys.argv[2])
    nd = s10.need(polys, W, H)
    print('needed', len(nd))
    for (k, o), ln in sorted(nd):
        print('  %5.1f° %.4f %s len %.2f %s' % (k * 18, o, s10.fit5(o)[:3], ln, s10.have((k, o)) or '-'))
    s10.finder(nd, W, H)


SPEC = {
    'id': 'salim-chishti-decagons', 'title': 'Decagons of Salim Chishti’s tomb (Fatehpur Sikri)',
    'short': 'Salim Chishti decagons', 'subtitle': 'Tomb of Salim Chishti, Fatehpur Sikri',
    'code': 'F207', 'folder': 'data153', 'cell': (W, H), 'style': 'Mughal', 'level': 'intermediate',
    'look': 'strapwork', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a decagon, at a half-turn point of the pattern.',
              'A': 'A corner of the decagon, to the right of O. OA is the decagon’s radius.'},
    'note': 'The finished design was read from Wichmann’s F207 drawing, whose pieces are drawn edge to edge. '
            'The decagons sit at the centre and the corners of a rectangle whose sides are in the ratio of '
            '1 to tan 36°. Every line is one of 25 lines about a decagon: the five lines through its centre and '
            'its corners, the lines of its ten sides, and the lines of the sides of the decagon of radius √5 about '
            'it (drawing within 0.001 of OA). The decagons at the tile’s corners get their lines by mirroring '
            'those about O.',
    'changes': 'Colours follow the shapes; the screen itself is white marble with no colour. No photograph was checked.',
    'references': 'His reference is Dominique Clévenot, Ornament and Decoration in Islamic Architecture '
                  '(Thames & Hudson, 2000), page 148, figure 207: a pierced marble screen of Salim Chishti’s tomb, '
                  'Fatehpur Sikri (1571), photographed by Gérard Degeorge.',
    'ink': 'Ink the lines picked out in orange. They close the decagons, the pentagons and the kites.',
    'repeat': 'Put copies of the rectangular tile side by side. A decagon sits at the centre and at every corner.',
}
NAMES = {(10, 2.939): ('decagon', 'c'), (5, 1.522): ('petal', 'a'), (5, 3.286): ('pentagon', 'b'),
         (5, 2.510): ('gable', 'd'), (4, 1.123): ('kite', 'ground')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)

#!/usr/bin/env python3
"""S31A (Tiling Search data9/S31A, Mirza Akber's Persian decoration, sheet
31), ten-fold batch T1.

Reading the drawing (27 October 2026): pieces edge to edge. Ten-pointed
stars, each two regular pentagons (radius 76.93 pt, OA), sit in columns
651.84 pt apart, 211.8 pt apart down a column, the next column shifted by
half that. The group is pmg: a mirror along each row of stars, glides
between the columns, so the stars of the next column are the half-turns of
those of this one about the points halfway between. The cell is |x| <= W,
|y| <= H with W = φ³ = 2 + √5 and H = tan 54°, stars at O and the corners.
fold 1: O at a star, OA along its mirror.

Use: gen_mirza_akber_31_stars.py <S31A-pieces.json> tutorials/mirza-akber-31-stars.json,
pnpm review mirza-akber-31-stars, then
gen_mirza_akber_31_stars.py finish <dump.json> <tutorial.json>.
Lab: gen_mirza_akber_31_stars.py lab <S31A-pieces.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap10_t1 as s10  # noqa: E402

ORIGIN, UNIT, TURN = (296.25, 374.86), 76.93, 0.0
S5, PHI = s10.S5, s10.PHI
W = PHI ** 3
H = math.tan(math.radians(54))
PTS = 'ABCDEFGHJK'


def at(r, deg):
    t = math.radians(deg)
    return (r * math.cos(t), r * math.sin(t))


def build():
    s10.opening()
    step('Draw a straight line through A and C, B and D, and on round the circle to K and B. '
         'These ten lines make the ten-pointed star.', 'ruler')
    for j in range(10):
        g.line_through('s%d' % j, PTS[j], PTS[(j + 2) % 10])
    step('The lines through B and D, and H and K, cross the horizontal line at Z. '
         'Draw a circle with centre A through Z, and one with centre Z through A. '
         'They cross at U1 and U2. Draw a straight line through U1 and U2. '
         'Turn it round O by 36°, nine times. These lines are the far sides of the pentagons round the star.',
         'compass')
    z = PHI * PHI
    g.meet('Z', 's1', 'h', (z, 0))
    g.circle_through('cAZ', 'A', 'Z')
    g.circle_through('cZA', 'Z', 'A')
    rr = z - 1
    hh = math.sqrt(rr * rr - (rr / 2) ** 2)
    g.meet('U1', 'cAZ', 'cZA', ((1 + z) / 2, hh))
    g.meet('U2', 'cAZ', 'cZA', ((1 + z) / 2, -hh))
    g.line_through('f', 'U1', 'U2')
    g.repeat('fr', ['f'], 'rot10')
    step('The line through A and C crosses the vertical line through O at T1. '
         'The line through J and A crosses it at T2. '
         'Draw a horizontal line through T1, and one through T2.', 'ruler')
    g.meet('T1', 's0', 'v', (0, H))
    g.meet('T2', 's8', 'v', (0, -H))
    g.line_par('kt', 'T1', 'h')
    g.line_par('kb', 'T2', 'h')
    step('The line through A and C crosses the line through K and B at X. '
         'Draw a straight line through O and X. '
         'It crosses the horizontal line through T1 at N1, and the one through T2 at N3.', 'ruler')
    r = math.cos(math.radians(36)) / math.cos(math.radians(18))
    g.meet('X', 's0', 's9', at(r, 18))
    g.line_through('d', 'O', 'X')
    g.meet('N1', 'd', 'kt', (W, H))
    g.meet('N3', 'd', 'kb', (-W, -H))
    step('Draw a vertical line through N1, and one through N3. They cross the horizontal lines at N2 and N4. '
         'N1, N2, N3 and N4 are the corners of the tile.', 'ruler')
    g.line_perp('kr', 'N1', 'h')
    g.line_perp('kl', 'N3', 'h')
    g.meet('N2', 'kl', 'kt', (-W, H))
    g.meet('N4', 'kr', 'kb', (W, -H))
    # The stars at the tile's corners: their lines, as parallels through
    # crossings on the tile's top side (where each meets its mirror image
    # about the star above O), mirrored in the horizontal line.
    step('The line through F and H crosses the top side of the tile at P1. '
         'The line through J and A crosses it at P2. '
         'Draw a line through P1 parallel to line DF, and a line through P2 parallel to line AC. '
         'Mirror the two new lines in the horizontal line through O.', 'ruler')
    g.meet('P1', 's5', 'kt', (-2, H))
    g.meet('P2', 's8', 'kt', (2, H))
    g.line_par('g1', 'P1', 's3')
    g.line_par('g2', 'P2', 's0')
    g.repeat('g12', ['g1', 'g2'], 'mirror:h')
    step('The far side of the pentagon at G crosses the top side of the tile at P3. '
         'The far side of the pentagon at K crosses it at P4. '
         'Draw a line through P3 parallel to line DF, and a line through P4 parallel to line AC. '
         'Mirror the two new lines in the horizontal line through O.', 'ruler')
    g.meet('P3', 'f@6', 'kt', (-(1 + S5), H))
    g.meet('P4', 'f@9', 'kt', (1 + S5, H))
    g.line_par('g3', 'P3', 's3')
    g.line_par('g4', 'P4', 's0')
    g.repeat('g34', ['g3', 'g4'], 'mirror:h')
    step('Line OX crosses the line through P2 at P5, and the line through P4 at P6. '
         'Draw a vertical line through P5, and one through P6. Turn the two lines round O by 180°.', 'ruler')
    g.meet('P5', 'd', 'g2', (1.5 * PHI, 1.5 * PHI * math.tan(math.radians(18))))
    g.meet('P6', 'd', 'g4', (2 + S5 - math.cos(math.radians(36)), (2 + S5 - math.cos(math.radians(36))) * math.tan(math.radians(18))))
    g.line_perp('g5', 'P5', 'h')
    g.line_perp('g6', 'P6', 'h')
    g.repeat('g56', ['g5', 'g6'], 'rot2')


def refs():
    out = {}
    for j in range(10):
        (q, u) = cm.el['s%d' % j][1]
        out.setdefault(s10.key_of(q, u)[0], 's%d' % j)
    return out


def drawing(pieces):
    """The strip left of O, as drawn, and its mirror image right of O (the
    drawing's own strip right of O is irregular; see the notes)."""
    out = []
    for Q in s10.frame(pieces, ORIGIN, UNIT, TURN):
        cx = sum(v[0] for v in Q) / len(Q)
        if cx < -1e-3:
            out.append(Q)
            out.append([(-x, y) for x, y in reversed(Q)])
        elif cx < 1e-3:
            out.append(Q)
    return out


def lab():
    build()
    polys = drawing(sys.argv[2])
    nd = s10.need(polys, W, H)
    print('needed', len(nd))
    for (k, o), ln in sorted(nd):
        print('  %5.1f° %8.4f len %.2f %s' % (k * 18, o, ln, s10.have((k, o)) or '-'))
    s10.finder(nd, W, H, tol=2e-3)
    if '--greedy' in sys.argv:
        print(s10.greedy(nd, W, H, refs(), tol=2e-3))


SPEC = {
    'id': 'mirza-akber-31-stars', 'title': 'Ten-pointed stars of Mirza Akber’s sheet 31',
    'short': 'Mirza Akber 31 stars', 'subtitle': 'Mirza Akber, Persian decoration, sheet 31',
    'code': 'S31A', 'folder': 'data9', 'cell': (W, H), 'style': 'Persian', 'level': 'advanced',
    'look': 'interlace', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a ten-pointed star, at a half-turn point of the pattern.',
              'A': 'A point of the star, to the right of O. OA is the star’s radius.'},
    'note': 'The finished design was read from Wichmann’s S31A drawing, whose pieces are drawn edge to edge. '
            'Each ten-pointed star is two regular pentagons; a ring of ten regular pentagons sits on its points, '
            'and the far sides of those pentagons are the only other lines a star needs. The stars sit at the '
            'centre and the corners of a rectangle 2(2 + √5) by 2 tan 54° in units of the star’s radius '
            '(drawing within 0.0006). The stars at the tile’s corners get their lines from crossings on the '
            'tile’s top side.',
    'changes': 'Wichmann’s drawing has two strips between its columns of stars, and only the left one is '
               'symmetric (a glide down its middle, as his pmg needs); the right strip has the same pentagons '
               'but green pieces where the left one has its crosses and octagons, and fits no symmetry. We build '
               'the left strip on both sides of every column, so the stars have both mirrors (cmm). '
               'Colours follow the shapes. No photograph was checked.',
    'references': 'His reference is sheet 31 of The Persian Decoration of Mirza Akber (1898), Victoria and '
                  'Albert Museum, National Art Library; his page also links David Wade’s photograph MA 009.',
    'ink': 'Ink the lines picked out in orange. They close the stars, the pentagons, the octagons and the crosses.',
    'repeat': 'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at every corner.',
}
NAMES = {(20, 2.629): ('star', 'c'), (10, 0.750): ('cross', 'a'), (8, 0.727): ('octagon', 'ground'),
         (5, 0.476): ('pentagon', 'b'), (4, 0.162): ('rhombus', 'd')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)

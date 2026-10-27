#!/usr/bin/env python3
"""P183 (Tiling Search data12/P183, Bourgoin plate 183), ten-fold batch T3.

Reading the drawing (27 October 2026): pieces edge to edge, cmm. Ten-pointed
stars (two regular pentagons, radius 61.57 pt, OA) sit in columns 521.5 pt
apart, 169.46 pt apart down a column, the next column shifted by half that,
with decagons between the columns. The cell is |x| <= W, |y| <= H with
W = φ³ = 2 + √5 and H = tan 54°, stars at O and the corners: the frame of
`mirza-akber-31-stars` (S31A), whose opening this shares. Every line runs at a
multiple of 18° through crossings of the star's lines.

Lab: gen_bourgoin_183_stars.py lab <P183-pieces.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap10_t1 as s10  # noqa: E402
import snap10_t2 as t2  # noqa: E402

ORIGIN, UNIT, TURN = (296.5, 374.07), 61.57, 0.0
S5, PHI = s10.S5, s10.PHI
W = PHI ** 3
H = math.tan(math.radians(54))
PTS = 'ABCDEFGHJK'


def at(r, deg):
    t = math.radians(deg)
    return (r * math.cos(t), r * math.sin(t))


def seeds():
    t2.opening()
    step('Draw a straight line through A and C, B and D, and on round the circle to K and B. '
         'These ten lines make the ten-pointed star.', 'ruler')
    for j in range(10):
        nm = 's%d' % j
        g.line_through(nm, PTS[j], PTS[(j + 2) % 10])
        (q, u) = cm.el[nm][1]
        t2.REF.setdefault(t2.key_of(q, u)[0], nm)
        t2.DESC[nm] = 'line %s%s' % (PTS[j], PTS[(j + 2) % 10])
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
    cm.steps[-1]['textWithoutHelpers'] = (
        'The lines through B and D, and H and K, cross the horizontal line at Z. '
        'Draw a circle with centre A through Z, and one with centre Z through A. '
        'They cross at U1 and U2. Draw a straight line through U1 and U2. '
        'Turn it round O to the points B, C, D, E, G, H, J and K. '
        'These lines are the far sides of the pentagons round the star.')
    t2.DESC['f'] = 'the pentagon’s far side beyond A'
    for j in range(1, 10):
        t2.DESC['f@%d' % j] = 'the pentagon’s far side beyond %s' % PTS[j]
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
    t2.DESC.update({'kt': 'the top side of the tile', 'kb': 'the bottom side of the tile',
                    'kr': 'the right side of the tile', 'kl': 'the left side of the tile', 'd': 'line OX'})
    step('Draw a straight line through A and D, F and J, B and E, and G and K. '
         'Draw a straight line through C and F, and H and A.', 'ruler')
    for nm, a, b in [('r1', 'A', 'D'), ('r2', 'F', 'J'), ('r3', 'B', 'E'), ('r4', 'G', 'K'),
                     ('r5', 'C', 'F'), ('r6', 'H', 'A')]:
        g.line_through(nm, a, b)
        (q, u) = cm.el[nm][1]
        t2.REF.setdefault(t2.key_of(q, u)[0], nm)
        t2.DESC[nm] = 'line %s%s' % (a, b)
    t2.radial(['C', 'D'])


def drawing(pieces):
    return s10.frame(pieces, ORIGIN, UNIT, TURN)


def lab():
    seeds()
    polys = drawing(sys.argv[2])
    nd = t2.need(polys, W, H)
    print('needed', len(nd), 'missing', len(t2.missing(nd)))
    print(t2.plan(polys, W, H, reach=float(os.environ.get('REACH', 1.01)), tol=2e-3))


PLAN = [('P1', 'kt', 'r5', (0.894427, 1.376382), 3, False), ('P2', 's1', 'f', (1.809017, 0.262866), 9, False),
        ('P3', 's8', 'f', (1.809017, 1.113516), 3, False), ('P4', 's2', 'kt', (1.618034, 1.376382), 1, False),
        ('P5', 'f', 'm4', (1.809017, 0.788597), 5, False), ('P6', 'oC', 'm5', (0.256231, 0.788597), 3, False),
        ('P7', 'kt', 'm4b', (2.512461, 1.376382), 1, False), ('P8', 'kt', 'm6b', (3.236068, 1.376382), 2, False),
        ('P9', 'd', 'm8', (3.427051, 1.113516), 0, False)]


def build():
    seeds()
    t2.write_plan(PLAN)
    last = cm.steps[-1]
    last['text'] = last['text'].replace('Reflect the new line in the horizontal line through O. Turn all of them round O by 180°.',
                                        'Turn it round O by 180°.')


SPEC = {
    'id': 'bourgoin-183-stars', 'title': 'Ten-pointed stars and decagons of Bourgoin’s plate 183',
    'short': 'Bourgoin 183 stars', 'subtitle': 'J. Bourgoin, Arabic Geometrical Pattern and Design, plate 183',
    'code': 'P183', 'folder': 'data12', 'cell': (W, H), 'style': 'Persian', 'level': 'advanced',
    'look': 'tiles', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a ten-pointed star, at a half-turn point of the pattern.',
              'A': 'A point of the star, to the right of O. OA is the star’s radius.'},
    'note': 'The finished design was read from Wichmann’s P183 drawing, whose pieces are drawn edge to edge. '
            'Each ten-pointed star is two regular pentagons. The stars stand in columns, with regular decagons '
            'between the columns. The stars sit at the centre and the corners of a rectangle 2(2 + √5) by '
            '2 tan 54° in units of the star’s radius (drawing within 0.002), the frame of Mirza Akber’s sheet 31, '
            'whose opening this shares. Every other line is a parallel to a line of the star through a crossing '
            'of earlier lines.',
    'changes': 'Colours follow his drawing, by shape. No photograph was checked.',
    'references': 'His reference is J. Bourgoin, Arabic Geometrical Pattern and Design (1879; Dover reprint), '
                  'plate 183, with no known building; his page also links David Wade’s photograph BOU 183.',
    'ink': 'Ink the lines picked out in orange. They close the stars, the decagons, the pentagons and the pieces '
           'between them.',
    'repeat': 'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at every corner.',
}
NAMES = {(20, 2.629): ('star', 'c'), (10, 1.123): ('decagon', 'b'), (16, 0.679): ('sixteen_sided', 'ground'),
         (5, 0.476): ('pentagon', 'b'), (6, 0.398): ('hexagon', 'a'), (7, 0.234): ('heptagon', 'ground'),
         (4, 0.162): ('kite', 'ground')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)

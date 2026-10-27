#!/usr/bin/env python3
"""SHAF10 (Tiling Search data199/SHAF10, a door of the shrine of the
Imamzadeh Ismail, Isfahan; Shafai, page 71), ten-fold batch T3.

Reading the drawing (27 October 2026): pieces edge to edge, pmm. Ten-pointed
stars (two regular pentagons, radius 61.557 pt, OA) on the mirror crossings,
in rows 274.17 pt apart along a row; the next row, 298.79 pt away, is shifted
by half that and its stars have other surroundings. Turned by 90° so that a
point of the star lies on OA, the cell is |x| <= W, |y| <= H with W = 3φ and
H = φ·tan 54°, stars at O and the corners and a pentagonal rosette on each
side of O along the horizontal mirror. Every edge is parallel to a line of
the star, and every line runs through crossings of earlier lines (drawing
within 0.001 of OA).

Use: gen_isfahan_imamzadeh_stars.py <SHAF10-pieces.json> tutorials/isfahan-imamzadeh-ismail-stars.json,
pnpm review isfahan-imamzadeh-ismail-stars, then
gen_isfahan_imamzadeh_stars.py finish <dump.json> <tutorial.json>.
Lab: gen_isfahan_imamzadeh_stars.py lab <SHAF10-pieces.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap10_t1 as s10  # noqa: E402
import snap10_t2 as t2  # noqa: E402

ORIGIN, UNIT, TURN = (304.05, 224.72), 61.557, 90.0
S5, PHI = s10.S5, s10.PHI
W = 3 * PHI
H = PHI * math.tan(math.radians(54))
PTS = 'ABCDEFGHJK'


def chords(text, pairs, prefix):
    step(text, 'ruler')
    for i, (a, b) in enumerate(pairs):
        nm = '%s%d' % (prefix, i)
        g.line_through(nm, a, b)
        (q, u) = cm.el[nm][1]
        t2.REF.setdefault(t2.key_of(q, u)[0], nm)
        t2.DESC[nm] = 'line %s%s' % (a, b)


def seeds():
    t2.opening()
    chords('Draw a straight line through A and C, B and D, and on round the circle to K and B. '
           'These ten lines make the ten-pointed star.', [(PTS[j], PTS[(j + 2) % 10]) for j in range(10)], 's')
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
    t2.DESC['f'] = 'the pentagon’s far side beyond A'
    for j in range(1, 10):
        t2.DESC['f@%d' % j] = 'the pentagon’s far side beyond %s' % PTS[j]
    chords('Draw a straight line through A and D, F and J, B and E, and G and K. '
           'Draw a straight line through C and F, and H and A.',
           [('A', 'D'), ('F', 'J'), ('B', 'E'), ('G', 'K'), ('C', 'F'), ('H', 'A')], 'r')
    t2.radial(['B', 'C', 'D', 'E'])


def drawing(pieces):
    """The drawing, and its mirror image in the vertical through O (the page
    stops 3.65 OA to the left of O, inside the tile)."""
    polys = s10.frame(pieces, ORIGIN, UNIT, TURN)
    return polys + [[(-x, y) for x, y in Q] for Q in polys]


def lab():
    seeds()
    polys = drawing(sys.argv[2])
    nd = t2.need(polys, W, H)
    print('needed', len(nd), 'missing', len(t2.missing(nd)))
    print(t2.plan(polys, W, H, reach=float(os.environ.get('REACH', 1.01)), tol=2e-3))
    names = cm.lines()
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            for p in cm.crossings(a, b):
                if abs(p[0] - W) < 1e-6 and abs(p[1]) < 3:
                    print('on the right side', a, b, p)
                if abs(p[1] - H) < 1e-6 and abs(p[0]) < 5:
                    print('on the top side', a, b, p)


PLAN = [('P1', 'r0', 'oB', (0.5, 0.363271), 6, False), ('P2', 's8', 'r2', (1.427051, 0.587785), 0, False),
        ('P3', 'oB', 'm2', (1.427051, 1.036813), 4, False), ('P4', 's2', 'r5', (3.927051, 2.126627), 2, False),
        ('P5', 'r2', 'm1b', (-2.427051, 0.587785), 0, False), ('P6', 'r0', 'm3', (-1.927051, 2.126627), 8, False),
        ('P7', 'r2', 'm6', (-3.045085, 0.587785), 0, False), ('P8', 'f@2', 'r2', (4.045085, 0.587785), 0, False),
        ('P9', 's0', 's1', (0.5, 0.688191), 1, False), ('P10', 'r4', 'm9', (0.394427, 1.013111), 4, False),
        ('P11', 'h', 'm9', (0.723607, 0.0), 4, False), ('P12', 's1', 'm11b', (1.67082, 0.307768), 2, False),
        ('P13', 'f@9', 'm11b', (2.703444, 0.643288), 0, False), ('P14', 'oC', 'm1', (0.072949, 0.224514), 3, False),
        ('P15', 's5', 'm14', (-2.545085, 2.126627), 6, False), ('P16', 'r0', 'r2', (0.190983, 0.587785), 4, False),
        ('P17', 'r2', 'm16b', (3.809017, 0.587785), 2, False), ('P18', 'r1', 'm16', (-3.427051, 1.763356), 0, False)]


def near(a, b, p):
    return min(cm.crossings(a, b), key=lambda c: math.dist(c, p))


def build():
    seeds()
    t2.write_plan(PLAN)
    for st in cm.steps:
        if st.get('text', '').endswith('Draw a vertical line through P8. Reflect the new line in the horizontal '
                                       'line through O. Turn all of them round O by 180°.'):
            st['text'] = st['text'].replace('Reflect the new line in the horizontal line through O. '
                                            'Turn all of them round O by 180°.', 'Turn it round O by 180°.')
    step('The line through P4 crosses the mirror image of the line through P17 at V. '
         'Draw a vertical line through V. Turn it round O by 180°. '
         'Line DF crosses the pentagon’s far side beyond B at Y. '
         'Draw a horizontal line through Y. Turn it round O by 180°. '
         'The four lines cross at N1, N2, N3 and N4, the corners of the tile.', 'ruler')
    g.meet('V', 'm4', 'm17b', near('m4', 'm17b', (W, 0.8507)))
    g.line_par('kr', 'V', 'v')
    g.repeat('krr', ['kr'], 'rot2')
    g.meet('Y', 's3', 'f@1', near('s3', 'f@1', (0.618, H)))
    g.line_par('kt', 'Y', 'h')
    g.repeat('ktr', ['kt'], 'rot2')
    tail = 'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.'
    for i, new in WITHOUT.items():
        st = cm.steps[i - 1]
        if i == 7:
            st['textWithoutHelpers'] = new
            continue
        assert st['text'].endswith(tail), (i, st['text'])
        st['textWithoutHelpers'] = st['text'][:-len(tail)] + new
    g.meet('N1', 'kr', 'kt', (W, H))
    g.meet('N2', 'kr@1', 'kt', (-W, H))
    g.meet('N3', 'kr@1', 'kt@1', (-W, -H))
    g.meet('N4', 'kr', 'kt@1', (W, -H))


WITHOUT = {
    7: 'The lines through B and D, and H and K, cross the horizontal line at Z. '
       'Draw a circle with centre A through Z, and one with centre Z through A. They cross at U1 and U2. '
       'Draw the far side of the pentagon at each of B, C, D, E, G, H, J and K. '
       'Each is the line through U1 and U2, turned round O.',
    13: 'Reflect the line through P9 in the horizontal line through O. Turn the vertical lines round O by 180°.',
    14: 'Reflect the new lines in the horizontal line through O. '
        'Turn the line through P10 and its mirror image round O by 180°.',
    15: 'Reflect the new lines in the horizontal line through O. '
        'Turn the lines through P12 and P13 and the mirror image of the first round O by 180°.',
    16: 'Reflect the new lines in the horizontal line through O. '
        'Turn the line through P15 and its mirror image round O by 180°. '
        'Turn the mirror image of the line through P16 round O by 180°.',
}

SPEC = {
    'id': 'isfahan-imamzadeh-ismail-stars', 'title': 'Ten-pointed stars of the Imamzadeh Ismail, Isfahan',
    'short': 'Imamzadeh Ismail stars', 'subtitle': 'Shrine of the Imamzadeh Ismail, Isfahan, Iran',
    'code': 'SHAF10', 'folder': 'data199', 'cell': (W, H), 'style': 'Persian', 'level': 'advanced',
    'look': 'strapwork', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a ten-pointed star, where two mirrors of the pattern cross.',
              'A': 'A point of the star, to the right of O. OA is the star’s radius.'},
    'note': 'The finished design was read from Wichmann’s SHAF10 drawing, whose pieces are drawn edge to edge. '
            'Each ten-pointed star is two regular pentagons. The stars sit at the centre and the corners of a '
            'rectangle 6φ by 2φ·tan 54° in units of the star’s radius, and the stars at the corners have other '
            'neighbours than the one at O; a pentagonal rosette of five hexagons round a pentagon sits on each '
            'side of O. Every edge is parallel to a line of the star (drawing within 0.001 of OA), and each '
            'line is drawn through a crossing of earlier lines.',
    'changes': 'Colours follow his drawing, by shape. The original is a carved door; no photograph was checked.',
    'references': 'His reference is Javad Shafai, On Decoration in Persian Architecture and Wood Carving '
                  '(Tehran, 1977), page 71: a door of the shrine of the Imamzadeh Ismail, Isfahan, Iran.',
    'ink': 'Ink the lines picked out in orange. They close the stars, the pentagons and the pieces between them.',
    'repeat': 'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at every corner.',
}
NAMES = {(20, 2.629): ('star', 'c'), (10, 0.750): ('ten_sided', 'ground'), (8, 0.727): ('octagon', 'd'),
         (5, 0.476): ('pentagon', 'a'), (6, 0.465): ('hexagon', 'b'), (6, 0.295): ('small_hexagon', 'ground'),
         (4, 0.162): ('kite', 'ground')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)

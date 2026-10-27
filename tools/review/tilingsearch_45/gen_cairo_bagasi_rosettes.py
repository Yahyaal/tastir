#!/usr/bin/env python3
"""B153, Barsbay al-Bagasi, Cairo (Tiling Search data188/B153), sixteen-fold
batch S2. A band drawing: bands of width 8 pt, so the pieces are moved out
by half a band to the bands' centre lines first.

Reading the drawing (27 October 2026, tools/review/tilingsearch_45/snap16_s2.py):
every edge runs at a multiple of 11.25°, and the lines come in bundles of
parallels one strip apart, d = 19.85 pt. OA is that strip, d.
- The cell's half-side is L = 6.5 + 3√2 (213.245 pt / d = 10.74282; 6.5 + 3√2
  = 10.74264).
- Strips of two lines run through O at 22.5°, 67.5°…, at 0.5 and 1.5 from O;
  four lines run along each side of the cell, at L ± 0.5 and L ± 1.5.
- Sixteen lines through the middles M of the cell's sides (at 33.75° to the
  side) and their parallels one strip either side.
- The star at O is sixteen lines touching a circle of radius s = 2.02922
  (40.28 pt), each at 90° to a line through O at a multiple of 22.5°; s is a
  free length in the drawing. Two star lines two apart cross 3(√3 − 1) from O,
  where the circle with centre R (3√2 on the horizontal) and radius 6 crosses
  the 135° line, so s = 3(√3 − 1)·cos 22.5° = 2.02899, 0.005 pt from the drawing.
- A second, narrower strip, e = s·sin 22.5° (0.7765, drawing 15.41 pt / d =
  0.77632), frames the octagons at the corners: the lines L − 0.5 − e and the
  turned L + 0.5 + e, and the 22.5° line through their crossing, which in the
  drawing all meet at one point.
Every other line runs through a crossing of these, found by the greedy plan
(lab mode: gen_cairo_bagasi_rosettes.py lab <pieces.json>).

Use: gen_cairo_bagasi_rosettes.py <pieces.json> <tutorial.json>, then pnpm review,
then gen_cairo_bagasi_rosettes.py finish <dump.json> <tutorial.json>.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap16_s2 as s16  # noqa: E402

R2 = math.sqrt(2)
L = 6.5 + 3 * R2
ORIGIN, UNIT, BAND = (297.96, 373.29), 19.85, 8.0


def seeds():
    """Everything up to the greedy plan."""
    s16.opening(odd=True)
    # the cell: L - 0.5 = 6 + 3√2 on the horizontal line, by the compass
    step('Draw a circle with centre A through O. It crosses the horizontal line at B1. '
         'Draw a circle with centre B1 through A. It crosses the horizontal line at B2. '
         'Draw a circle with centre O through B2. It crosses the vertical line at B3, and the horizontal line at B4.',
         'compass')
    g.circle_through('k1', 'A', 'O')
    g.meet('B1', 'k1', 'h', (2, 0))
    g.circle_through('k2', 'B1', 'A')
    g.meet('B2', 'k2', 'h', (3, 0))
    g.circle_through('k3', 'O', 'B2')
    g.meet('B3', 'k3', 'v', (0, 3))
    g.meet('B4', 'k3', 'h', (-3, 0))
    step('Draw a vertical line through B2. Draw a horizontal line through B3. They cross at Q. '
         'Draw a circle with centre O through Q. It crosses the horizontal line at R.', 'compass')
    g.line_perp('x3', 'B2', 'h')
    g.line_perp('y3', 'B3', 'v')
    g.meet('Q', 'x3', 'y3', (3, 3))
    g.circle_through('k4', 'O', 'Q')
    g.meet('R', 'k4', 'h', (3 * R2, 0))
    step('Open the compass from B4 to B2. Draw a circle with this opening and centre R. '
         'It crosses the horizontal line at E, on the right. '
         'Open the compass from O to A. Draw a circle with this opening and centre E. '
         'It crosses the horizontal line at F and G.', 'compass')
    g.circle_from('k5', 'R', 'B4', 'B2')
    g.meet('E', 'k5', 'h', (6 + 3 * R2, 0))
    g.put('kE', 'circle', (g.P('E'), 1.0), {'circle': {'centre': 'E', 'radiusOf': 'c'}})
    g.meet('F', 'kE', 'h', (L + 0.5, 0))
    g.meet('G', 'kE', 'h', (L - 1.5, 0))
    step('Draw a circle with the same opening and centre F. It crosses the circle with centre E at J1 and J2.',
         'compass')
    g.put('kF', 'circle', (g.P('F'), 1.0), {'circle': {'centre': 'F', 'radiusOf': 'c'}})
    g.meet('J1', 'kE', 'kF', (L, math.sqrt(.75)))
    g.meet('J2', 'kE', 'kF', (L, -math.sqrt(.75)))
    step('Draw a straight line through J1 and J2. It crosses the horizontal line at M. '
         'Turn the new line round O by 90°, three times. '
         'The four lines make a square with corners K1, K2, K3 and K4.')
    g.line_through('xl', 'J1', 'J2')
    g.meet('M', 'xl', 'h', (L, 0))
    g.repeat('xr', ['xl'], 'rot4')
    for i, (a, b, x, y) in enumerate((('xl', 'xl@1', 1, 1), ('xl@1', 'xl@2', -1, 1),
                                      ('xl@2', 'xl@3', -1, -1), ('xl@3', 'xl', 1, -1))):
        g.meet(f'K{i + 1}', a, b, (x * L, y * L))
    step('Draw vertical lines through G, E and F. Turn the three new lines round O by 45°, seven times.')
    for nm, p in (('xg', 'G'), ('xe', 'E'), ('xf', 'F')):
        g.line_perp(nm, p, 'h')
    g.repeat('xr8', ['xg', 'xe', 'xf'], 'rot8')
    # the strips through O at 22.5°: lines 0.5 and 1.5 from O
    step('Open the compass from M to E. Draw a circle with this opening and centre O. '
         'It crosses the 112.5° line through O at N1. '
         'Open the compass from M to G. Draw a circle with this opening and centre O. '
         'It crosses the 112.5° line through O at N2. '
         'Draw lines through N1 and N2 parallel to the 22.5° line through O. '
         'Turn the two new lines round O by 45°, seven times.', 'compass')
    g.circle_from('k6', 'O', 'M', 'E')
    g.circle_from('k7', 'O', 'M', 'G')
    t = math.radians(112.5)
    g.meet('N1', 'k6', 'r2@2', (0.5 * math.cos(t), 0.5 * math.sin(t)))
    g.meet('N2', 'k7', 'r2@2', (1.5 * math.cos(t), 1.5 * math.sin(t)))
    g.line_par('sa', 'N1', 'r2')
    g.line_par('sb', 'N2', 'r2')
    g.repeat('sr', ['sa', 'sb'], 'rot8')
    # the star: the circle with centre R crosses the 135° line through O at Z,
    # 3(√3 − 1) from O, where two star lines two apart cross
    step('The circle with centre R crosses the 135° line through O at Z. '
         'Draw a line through Z at 90° to the 112.5° line through O. '
         'Turn it round O by 22.5°, fifteen times. These sixteen lines make the star at O.')
    zr = 3 * (math.sqrt(3) - 1)
    g.meet('Z', 'k5', 'd135', (-zr * math.sqrt(.5), zr * math.sqrt(.5)))
    g.line_perp('t', 'Z', 'r2@2')
    g.repeat('tr', ['t'], 'rot16')
    for j in range(16):
        s16.DESC['t' if j == 0 else f't@{j}'] = 'a star line'
    # the narrow strip e = s·sin 22.5°: the vertical line through the star
    # line's touching point W on the 112.5° line
    step('The new line through Z crosses the 112.5° line through O at W. '
         'Draw a vertical line through W. Turn it round O by 90°, three times.')
    t = math.radians(112.5)
    s0 = zr * math.cos(math.pi / 8)
    g.meet('W', 't', 'r2@2', (s0 * math.cos(t), s0 * math.sin(t)))
    g.line_perp('xw', 'W', 'h')
    g.repeat('xwr', ['xw'], 'rot4')
    step('Draw lines through E and F parallel to the 135° line through O. '
         'Turn the two new lines round O by 90°, three times.')
    g.line_par('ue', 'E', 'd135')
    g.line_par('uf', 'F', 'd135')
    g.repeat('ur', ['ue', 'uf'], 'rot4')
    e = s0 * math.sin(math.pi / 8)
    step('The 135° line through F crosses the vertical line through W, turned by 90°, at X1. '
         'Draw a vertical line through X1. Turn it round O by 45°, seven times. '
         'The 135° line through E crosses the vertical line through W, turned by 270°, at X2. '
         'Draw a vertical line through X2. Turn it round O by 90°, three times.')
    g.meet('X1', 'uf', 'xw@1', (L + 0.5 + e, -e))
    g.line_perp('xx', 'X1', 'h')
    g.repeat('xxr', ['xx'], 'rot8')
    g.meet('X2', 'ue', 'xw@3', (L - 0.5 - e, e))
    g.line_perp('xa', 'X2', 'h')
    g.repeat('xar', ['xa'], 'rot4')
    step('Draw a line through M parallel to the 112.5° line through O.')
    g.line_par('pm', 'M', 'r2@2')


DESCS = {
    'xl': 'the vertical line through M', 'xg': 'the vertical line through G',
    'xe': 'the vertical line through E', 'xf': 'the vertical line through F', 'sa': 'the 22.5° line through N1',
    'sb': 'the 22.5° line through N2', 'xw': 'the vertical line through W', 'ue': 'the 135° line through E',
    'uf': 'the 135° line through F', 'xx': 'the vertical line through X1', 'pm': 'the 112.5° line through M',
    'xa': 'the vertical line through X2', 'h': 'the horizontal line through O', 'v': 'the vertical line through O',
    'd45': 'the 45° line through O', 'd135': 'the 135° line through O'}
ORDERS = {'xl': 4, 'xg': 8, 'xe': 8, 'xf': 8, 'sa': 8, 'sb': 8, 'xw': 4, 'ue': 4, 'uf': 4, 'xx': 8,
          'xa': 4, 't': 16}
# the greedy plan (lab): (point, line, line, where, direction k, turn, point already named)
PLAN = [
    ('P1', 'd45', 'pm', (7.596194, 7.596194), 7, 16, False),
    ('M', 'h', 'xl', (10.742641, 0.0), 2, 8, True),
    ('P2', 'sa@4', 'ue', (7.625324, 2.617317), 7, 16, False),
    ('P3', 'xl', 'm3@3', (10.742641, 1.202571), 3, 16, False),
    ('P4', 'xl@1', 'pm', (6.292893, 10.742641), 14, 8, False),
    ('P5', 'xa@2', 'xx@5', (-9.466184, -7.531388), 2, 8, False),
]


WITHOUT = {
    2: 'Draw a vertical line through O. It crosses the circle at S5. '
       'Draw the line through O that halves the angle between the horizontal and the vertical line. '
       'It crosses the circle at S3. Draw a line through O at 90° to it. '
       'Draw a line through O at 112.5° to the horizontal line.',
    9: 'Draw vertical lines through G and E. Turn the two new lines round O by 45°, seven times. '
       'Draw four lines at 45° to the axes, each as far from O as F.',
    12: 'The new line through Z crosses the 112.5° line through O at W. '
        'Draw a horizontal line above O, as far from O as W is from the vertical line.',
    13: 'Draw a line through E parallel to the 135° line through O.',
    14: 'Draw four more lines at 45° to the axes, a little farther from O than those through F. '
        'The line through E crosses the new horizontal line at X2. '
        'Draw a vertical line through X2. Turn it round O by 90°, three times.',
}


def build():
    seeds()
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    s16.write_plan(PLAN, size=2)
    for st in cm.steps:
        if st['id'] in WITHOUT:
            st['textWithoutHelpers'] = WITHOUT[st['id']]
    # the first shown step after the skipped step 3 (all helper lines)
    st = cm.steps[3]
    st['textWithoutHelpers'] = st['text']


def lab():
    import json
    seeds()
    polys = cm.frame_pieces(sys.argv[2], ORIGIN, 2 * UNIT, BAND)
    s16.HAVE_TOL[0] = 2e-3
    nd = s16.need(polys, L)
    left = s16.missing(nd)
    print('needed', len(nd), 'missing', len(left))
    pl = s16.plan(polys, L, tol=4e-4, verbose=True)
    print(json.dumps(pl))
    s = 40.28 / UNIT
    targets = {'s': s, 'T': s / math.cos(math.radians(56.25)), 'inner': s * R2,
               'ring2': s / math.cos(math.radians(22.5)), 'ring6': s / math.cos(math.radians(67.5)),
               'ring3': s / math.cos(math.radians(33.75)), 'ring1': s / math.cos(math.radians(11.25))}
    hits = []
    for sc, a, b, p in s16.crossings(L * 1.2, True):
        r = math.hypot(*p)
        for nm, v in targets.items():
            if abs(r - v) < 0.002:
                hits.append((round(abs(r - v), 5), nm, a, b, (round(p[0], 4), round(p[1], 4)), round(sc, 2)))
    for h in sorted(hits)[:25]:
        print(h)


SPEC = {
    'id': 'cairo-bagasi-rosettes', 'title': 'Rosettes of Barsbay al-Bagasi (Cairo)',
    'short': 'Barsbay al-Bagasi rosettes', 'subtitle': 'Barsbay al-Bagasi, Cairo',
    'code': 'B153', 'folder': 'data188', 'frame': (ORIGIN, UNIT, BAND, L), 'star': 16,
    'style': 'Mamluk',
    'given': {'O': 'The centre of a sixteen-pointed star.',
              'A': 'One strip from O: the distance between two neighbouring parallel bands.'},
    'note': 'The finished design was read from Wichmann’s B153 drawing, a sixteen-pointed star on a square '
            'tile with an octagon at each corner, its bands drawn as parallel strips. Every edge runs at a '
            'multiple of 11.25°. The tile’s half-side is 6.5 + 3√2 strips (drawing: 10.7428), and every line but '
            'the star’s runs through a crossing of the strips, the tile’s sides and the lines through their '
            'middles. The star’s size is free in the drawing (2.0292 strips from O to each star line); we draw '
            'it through a crossing already on the board, 3(√3 − 1) cos 22.5° = 2.0290 strips from O. A narrower '
            'strip round the corner octagons is the star’s radius times sin 22.5°.',
    'changes': 'The bands follow their centre lines; the band width is not drawn. The star is 0.0002 strips '
               '(0.005 pt in the drawing) smaller than Wichmann’s. Colours follow his drawing in the Mamluk '
               'wood palette. No photograph was checked.',
    'references': 'His reference is the Thesaurus Islamicus (Barsbay al-Bagasi and Amir Sulayman, Cairo, '
                  '1456).',
    'look': 'interlace',
    'ink': 'Ink the lines picked out in orange. They close the star, the octagons and the pieces between the strips.',
    'small': {'long_arm', 'arm'},
    'palette': 'Mamluk wood',
    'repeat': 'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every '
              'tile, and an octagon at each corner.',
}
NAMES = {(32, 32.711): ('star', 'c'), (24, 21.758): ('long_arm', 'ground'), (18, 13.465): ('arm', 'ground'),
         (8, 9.609): ('octagon', 'b'), (10, 6.885): ('wide_ten', 'ground'), (10, 6.375): ('ten', 'ground'),
         (12, 5.617): ('twelve', 'ground'), (6, 3.615): ('petal', 'b'), (4, 1.733): ('kite', 'b'),
         (6, 1.654): ('hexagon', 'b'), (4, 1.439): ('dart', 'b')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        import medium
        medium.run(build, SPEC, NAMES)

#!/usr/bin/env python3
"""B153A, Bourgoin's plate 153 (Tiling Search data188/B153A), sixteen-fold
batch S2: Bourgoin's drawing of the Barsbay al-Bagasi design (B153,
gen_cairo_bagasi_rosettes.py), drawn as tiles edge to edge. Every line of
B153's band centre lines is a line here, in the same frame (OA one strip,
19.85 pt), so it shares that whole construction; Bourgoin adds a few lines
round the star, which change the pieces round it.

Use: gen_bourgoin_153_rosettes.py <pieces.json> <tutorial.json>, then pnpm review,
then gen_bourgoin_153_rosettes.py finish <dump.json> <tutorial.json>;
gen_bourgoin_153_rosettes.py lab <pieces.json> runs the greedy plan.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap16_s2 as s16  # noqa: E402
import gen_cairo_bagasi_rosettes as b153  # noqa: E402

L, ORIGIN, UNIT = b153.L, b153.ORIGIN, b153.UNIT
PLAN = [('P6', 'xl', 'sa@4', (10.742641, 3.908551), 14, 8, False)]


def corner_lines():
    """Bourgoin's extra lines by the corner octagons: through the point of
    the 45° line half the octagon's radius beyond its corner V, at 22.5°."""
    step('The 157.5° line through P4 crosses its copy turned by 315° at V, a corner of the octagon. '
         'Draw a circle with centre V through K1. It crosses the 45° line through O at V2. '
         'Draw a circle with centre V2 through V. It crosses the circle with centre V at J3 and J4. '
         'Draw a straight line through J3 and J4. It crosses the 45° line through O at V3. '
         'Draw a line through V3 parallel to the 22.5° line through O. '
         'Turn it round O by 45°, seven times.', 'compass')
    c1, s1 = math.cos(math.pi / 8), math.sin(math.pi / 8)
    r = L * (c1 - 2 * s1) / c1                      # the octagon's radius
    h = math.sqrt(.5)
    t = L - r * h
    g.meet('V', 'm5', 'm5@7', (t, t))
    g.circle_through('kv', 'V', 'K1')
    g.meet('V2', 'kv', 'd45', (t - r * h, t - r * h))
    g.circle_through('kv2', 'V2', 'V')
    mid = t - r * h / 2
    off = r * math.sqrt(3) / 2
    g.meet('J3', 'kv', 'kv2', (mid - off * h, mid + off * h))
    g.meet('J4', 'kv', 'kv2', (mid + off * h, mid - off * h))
    g.line_through('jl', 'J3', 'J4')
    g.meet('V3', 'jl', 'd45', (mid, mid))
    g.line_par('vl', 'V3', 'r2')
    g.repeat('vlr', ['vl'], 'rot8')
    s16.DESC['vl'] = 'the 22.5° line through V3'
    s16.ORDER['vl'] = 8


def build():
    b153.build()
    corner_lines()
    if PLAN:
        s16.write_plan(PLAN, size=2)


def lab():
    b153.build()
    corner_lines()
    polys = cm.frame_pieces(sys.argv[2], ORIGIN, 2 * UNIT, 0)
    nd = s16.need(polys, L)
    print('needed', len(nd), 'missing', len(s16.missing(nd)))
    s16.PSTART[0] = 6
    tol = float(os.environ.get('TOL', '4e-4'))
    pl = s16.plan(polys, L, tol=tol, verbose=True, circles=bool(os.environ.get('CIRCLES')))
    print(json.dumps(pl))


SPEC = dict(b153.SPEC)
SPEC.update({
    'id': 'bourgoin-153-rosettes', 'title': 'Rosettes of Bourgoin’s plate 153',
    'short': 'Bourgoin 153 rosettes', 'subtitle': 'Bourgoin, Les arts arabes, plate 153',
    'code': 'B153A', 'frame': (ORIGIN, UNIT, 0, L),
    'note': 'The finished design was read from Wichmann’s B153A drawing of Bourgoin’s plate 153, the design '
            'of Barsbay al-Bagasi (B153) drawn as tiles. Every line of that design is a line here, so its whole '
            'construction is shared; more lines round the star, each through a crossing of earlier lines, '
            'change the pieces round it.',
    'changes': 'The colours follow Wichmann’s drawing in the Mamluk wood palette. No photograph was checked.',
    'references': 'His reference is Jules Bourgoin, Les arts arabes (Morel, Paris, 1873), figure 58 '
                  '(al-Fadawiyya, Cairo).',
    'look': 'tiles',
})
SPEC['small'] = {'arm', 'sixteen', 'small_hexagon', 'small_kite'}
SPEC['ink'] = 'Ink the lines picked out in orange. They close the star, the octagons and the pieces between them.'
NAMES = {(32, 32.711): ('star', 'c'), (18, 13.465): ('arm', 'ground'), (8, 9.609): ('octagon', 'b'),
         (10, 7.586): ('big_ten', 'ground'), (10, 6.885): ('wide_ten', 'ground'), (10, 6.375): ('ten', 'ground'),
         (10, 5.71): ('narrow_ten', 'ground'), (16, 5.316): ('sixteen', 'ground'), (6, 3.615): ('petal', 'b'),
         (4, 1.733): ('kite', 'b'), (6, 1.654): ('hexagon', 'b'), (4, 1.439): ('dart', 'b'),
         (6, 0.875): ('small_hexagon', 'b'), (4, 0.3): ('small_kite', 'b')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        import medium
        medium.run(build, SPEC, NAMES)

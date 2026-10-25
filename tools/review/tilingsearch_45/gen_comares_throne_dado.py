#!/usr/bin/env python3
"""Builds the black and white tile mosaic on the jambs of the throne alcove
window in the Salón de Comares (Alhambra), drawn by Brian Wichmann in Tiling
Search (data150/F219) after Fernández-Puertas: a white eight-pointed star at
O and a black one at each corner of the square cell, the same size, ringed by
kites, hexagons, octagons and twelve-sided pieces.

Read from the PDF (star spacing 466.2 pt), every corner snapped to the grid
a + b·√2/2 in units of a quarter of the star spacing (worst error 0.0009).
In those units the cell is the square |x|, |y| <= 2 and the stars have tip
radius √2 − 1, as in the Patio de los Leones doors (gen_leones_door_stars.py),
whose star, kites and hexagons are the ring round O here. Every line is a side
of the star at O, of a corner star, or of a star at N1 (2, 0) and its turns
that is not inked itself (x ± y = 2 ± (√2 − 1)), carried on, except the
vertical lines x = ±(3√2/2 − 1), which pass through the point V where the
circle about O through T, the tip of the star at N1, crosses OE.
Lines found in the drawing: |x| or |y| = 1 − √2/2, 3√2/2 − 1, 1 + √2/2;
|x ± y| = √2 − 1, 3 − √2, 1 + √2, 5 − √2.

Units: OA = 1, a quarter of the way from O to the next star; the tile is the
square through the four corner stars.

Usage: gen_comares_throne_dado.py <F219-pieces.json> tutorials/alhambra-comares-throne-dado.json
       pnpm review alhambra-comares-throne-dado
       gen_comares_throne_dado.py finish docs/review/alhambra-comares-throne-dado/dump.json tutorials/alhambra-comares-throne-dado.json
(F219-pieces.json from 0_vectors.py and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_leones_door_stars import square_texts, star_points, two_squares  # noqa: E402

R2 = math.sqrt(2)
R = R2 - 1          # the stars' tip radius
H = R2 / 2


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.line_through('h', 'O', 'A')

    step('Draw a vertical line through O. It crosses the circle at B. '
         'Draw a vertical line through A. Draw a horizontal line through B. They cross at E. '
         'Draw a straight line through O and E.', 'ruler', ['c', 'h'])
    g.line_perp('v', 'O', 'h')
    g.meet('B', 'c', 'v', (0, 1))
    g.line_perp('ga', 'A', 'h')
    g.line_perp('gb', 'B', 'v')
    g.meet('E', 'ga', 'gb', (1, 1))
    g.line_through('d45', 'O', 'E')

    step('The circle crosses line OE at F. Draw a circle with centre E through F. '
         'Draw a circle with centre O and the same radius.', 'compass', ['E'])
    g.meet('F', 'c', 'd45', (H, H))
    g.circle_through('ce', 'E', 'F')
    cm.circle_radius_of('cs', 'O', 'ce')

    step('Draw the line through O at 90° to line OE. '
         'The small circle with centre O crosses the four lines through O at S1 to S8.', 'ruler', ['cs'])
    g.line_perp('d135', 'O', 'd45')
    pts = star_points('S', 'cs', R)

    step('Draw the star at O as two squares.', 'ruler', ['cs'])
    two_squares(pts, 'q', square_texts(pts, 'Draw each line long.'))

    step('Draw a circle with centre A through O. It crosses the horizontal line again at N1. '
         'Draw a circle with centre O through N1. It crosses the two lines through O at N1, N2, N3 and N4.',
         'compass', ['A'])
    g.circle_through('cao', 'A', 'O')
    g.meet('N1', 'cao', 'h', (2, 0))
    g.circle_through('cn', 'O', 'N1')
    g.meet('N2', 'cn', 'v', (0, 2))
    g.meet('N3', 'cn', 'h', (-2, 0))
    g.meet('N4', 'cn', 'v', (0, -2))

    step('Draw a vertical line through each of N1 and N3. Draw a horizontal line through each of N2 and N4. '
         'These lines make the square tile, with corners K1, K2, K3 and K4.', 'ruler', ['N1', 'N2', 'N3', 'N4'])
    g.line_perp('tE', 'N1', 'h')
    g.line_perp('tW', 'N3', 'h')
    g.line_perp('tN', 'N2', 'v')
    g.line_perp('tS', 'N4', 'v')
    g.meet('K1', 'tE', 'tN', (2, 2))
    g.meet('K2', 'tN', 'tW', (-2, 2))
    g.meet('K3', 'tW', 'tS', (-2, -2))
    g.meet('K4', 'tS', 'tE', (2, -2))

    step('The same star sits at each corner of the tile.', 'compass', ['K1'])
    st = cm.steps[-1]
    del st['create']
    st['parts'] = []

    def part(text, animate='ruler', highlight=None):
        p = {'text': text, 'create': {}, 'animate': animate}
        if highlight:
            p['highlight'] = highlight
        st['parts'].append(p)
        g.cur = p

    part('Draw a circle with centre K1 and the same radius as the small circle. '
         'It crosses the vertical line through N1 at P. It crosses the horizontal line through N2 at Q. '
         'Draw a straight line through P and Q.', 'compass', ['K1', 'cs'])
    cm.circle_radius_of('ck', 'K1', 'cs')
    g.meet('P', 'ck', 'tE', (2, 2 - R))
    g.meet('Q', 'ck', 'tN', (2 - R, 2))
    g.line_through('pq', 'P', 'Q')
    part('The line through S2 and S8 crosses the horizontal line at W. Draw a circle with centre A through W. '
         'It crosses the horizontal line again at X. Draw a vertical line through X.', 'compass', ['S2', 'S8'])
    g.meet('W', 'q14', 'h', (1 - H, 0))
    g.circle_through('cw', 'A', 'W')
    g.meet('X', 'cw', 'h', (1 + H, 0))
    g.line_par('xv', 'X', 'v')

    step('Draw a circle with centre N1 and the same radius as the small circle. '
         'It crosses the horizontal line at T and U. T is nearer to O. '
         'Draw a line through each of T and U parallel to the line through S1 and S3.', 'compass', ['N1', 'S1', 'S3'])
    cm.circle_radius_of('cn1', 'N1', 'cs')
    g.meet('T', 'cn1', 'h', (2 - R, 0))
    g.meet('U', 'cn1', 'h', (2 + R, 0))
    g.line_par('tl', 'T', 'q01')
    g.line_par('ul', 'U', 'q01')

    step('Draw a circle with centre O through T. It crosses line OE at V. Draw a vertical line through V.',
         'compass', ['T'])
    g.circle_through('ct', 'O', 'T')
    g.meet('V', 'ct', 'd45', ((3 - R2) / R2, (3 - R2) / R2))
    g.line_par('vv', 'V', 'v')

    step('Turn the lines of the last three steps round O by 90°, three times.')
    g.repeat('cp', ['pq', 'xv', 'tl', 'ul', 'vv'], 'rot4')


def drawing(pieces):
    """Wichmann's tiles in the tutorial's frame (OA = a quarter of the star spacing)."""
    ps = json.load(open(pieces))
    stars = sorted((p['c'] for p in ps if len(p['poly']) == 16), key=lambda c: math.dist(c, (297.5, 374.2)))
    origin = stars[0]
    period = min(math.dist(c, origin) for c in stars[1:]) / R2
    return cm.frame_pieces(pieces, origin, period, 0)


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = drawing(pieces)
    # The tile is |x|, |y| <= 2: clip in half units.
    segs = network2(polys)
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-comares-throne-dado',
        'title': 'Black and white stars of the Comares throne alcove (Alhambra)',
        'short': 'Comares throne alcove', 'subtitle': 'Salón de Comares, Alhambra', 'fold': 4, 'star': 8,
        'style': 'Nasrid', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s F219 drawing, its corners snapped to exact '
                    'values. We devised the construction: a star at O and one at each corner of the tile, the same '
                    'size, and nearly every line a side of a star, carried on. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. '
                       'No photo of the real mosaic was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data150/F219: Alhambra, Salón de Comares', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data150/F219.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of the tile mosaic on the jambs of the double window in '
                     'the throne alcove of the Salón de Comares, in its original black and white, after Antonio '
                     'Fernández-Puertas, The Alhambra, vol. I (1997), p. 417, fig. 219. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'A quarter of the way from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines round it, out to the stars at the corners of the tile. '
                        'They close the kites, hexagons, octagons and twelve-sided pieces between the stars.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A white star sits at the middle of each '
                            'tile and a black star at each corner.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


def network2(polys):
    """cm.network for the tile |x|, |y| <= 2."""
    segs = set()
    for P in polys:
        if max(abs(v) for q in P for v in q) > 5:
            continue
        for i in range(len(P)):
            for a, b in cm.clip([(P[i], P[(i + 1) % len(P)])], 2.0):
                sa, sb = cm.snap(a), cm.snap(b)
                assert sa and sb, ('corner off the construction', a, b, sa, sb)
                if math.dist(sa, sb) > 1e-6:
                    segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


# Wichmann's colours: black stars at the corners, kites, octagons and the
# hexagons on the tile's sides; white star at O, the eight hexagons round it
# and the twelve-sided pieces.
NAMES = {(16, 0.402): ('star', 'a'), (4, 0.071): ('kite', 'a'), (8, 0.556): ('octagon', 'a'),
         (6, 0.515): ('hexagon', 'ground'), (12, 0.686): ('cross', 'ground'), (12, 0.657): ('boat', 'ground')}
# Counted along the tile from a corner: the corner star is the first star,
# the four hexagons on the tile's two near sides are the 1st, 2nd, 3rd and 11th.
PLACEMENTS = {'repeat': [1, 1], 'rules': [
    {'piece': 'star', 'nth': 1, 'color': 'ground'},
    *({'piece': 'hexagon', 'nth': n, 'color': 'a'} for n in (0, 1, 2, 10))]}

if __name__ == '__main__':
    cm.run(main, NAMES)
    if sys.argv[1] == 'finish':
        t = json.load(open(sys.argv[3]))
        t['pattern']['placements'] = PLACEMENTS
        cm.write(t, sys.argv[3])

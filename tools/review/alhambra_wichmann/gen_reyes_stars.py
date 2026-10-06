#!/usr/bin/env python3
"""Builds the zellige of the Sala de los Reyes (Alhambra): eight-pointed
{8/3} stars on a square grid, each on a circle of radius half the grid, with
an octagon at the centre of every other star and a four-armed cross at the
rest. Drawn by Brian Wichmann in Tiling Search (data9/M060) and photographed
by David Wade (SPA 0408x).

Every motif is the same star: the circle divided into eight, each point joined
to the one three places round (the star) and to its neighbour (the octagon
round it). The crosses differ only at their centres, where four lines at 45°
cut notches. The notch lies as far inside the centre as the octagon's side is
shorter than the radius: open the compass to a side, put it on the star's
point and mark inwards along the axis. This gives 1/2 − sin 22.5° = 0.1173 of
the grid; Wichmann's drawing has 0.1173 ± 0.0003.

Units: OA = 1 is the grid, from the octagon at O to the cross at A; the tile is
the square from octagon to octagon, (±1, ±1).

Usage: gen_reyes_stars.py <research dir> tutorials/<id>.json
  (the research dir holds data9_M060-pieces.json from 1_pieces.py)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (crossings, circle_from, circle_through, el, ensure_point,  # noqa: E402
                          line_par, line_perp, line_through, meet, named_at, put,
                          repeat, step, steps)

sys.path.insert(0, os.path.dirname(__file__))
from gen_bath_stars import clip  # noqa: E402

R = 0.5
D = R - 2 * R * math.sin(math.pi / 8)


def circle_r(name, c, ref):
    put(name, 'circle', (g.P(c), el[ref][1][1]), {'circle': {'centre': c, 'radiusOf': ref}})


def star(tag, c, circle, axes):
    """The eight points of `circle` about `c` on the four axes, then the star
    and octagon lines joining them. axes: {angle: line} for 0, 45, 90, 135."""
    cx, cy = g.P(c)
    pts = []
    for k in range(8):
        a = 45 * k
        meet(f'{tag}{k}', circle, axes[a % 180], (cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a))))
        pts.append(f'{tag}{k}')
    names = []
    for k in range(8):
        line_through(f'{tag}s{k}', pts[k], pts[(k + 3) % 8])
        line_through(f'{tag}o{k}', pts[k], pts[(k + 1) % 8])
        names += [f'{tag}s{k}', f'{tag}o{k}']
    return names


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A star will sit at O, at A and at every point of the square grid one radius apart.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: they meet at the corners of the tile, where more octagons sit. Rule the two diagonals through O and the corners.', highlight=['c', 'h'])
    line_perp('v', 'O', 'h')
    meet('P90', 'c', 'v', (0, 1))
    meet('P180', 'c', 'h', (-1, 0))
    meet('P270', 'c', 'v', (0, -1))
    line_perp('gx', 'A', 'h')
    line_perp('gxw', 'P180', 'h')
    line_perp('gy', 'P90', 'v')
    line_perp('gys', 'P270', 'v')
    meet('K', 'gx', 'gy', (1, 1))
    meet('K2', 'gxw', 'gy', (-1, 1))
    meet('K3', 'gxw', 'gys', (-1, -1))
    meet('K4', 'gx', 'gys', (1, -1))
    line_through('d45', 'O', 'K')
    line_through('d135', 'O', 'K2')

    step('Halve OA: draw the circle about A through O, and join the two points where it crosses the first circle. Where that line meets the horizontal is the midpoint M. Draw the circle about O through M: the circle of the star at O.', 'compass')
    circle_through('cA', 'A', 'O')
    meet('W1', 'c', 'cA', (0.5, math.sqrt(3) / 2))
    meet('W2', 'c', 'cA', (0.5, -math.sqrt(3) / 2))
    line_through('mid', 'W1', 'W2')
    meet('M', 'mid', 'h', (0.5, 0))
    circle_through('cs', 'O', 'M')

    step('Mark the eight points where this circle meets the horizontal, the vertical and the diagonals. Join each point to the one three places round: an eight-pointed star. Join each point to its neighbour too: the octagon round the star.', 'ruler', ['cs'])
    star('Q', 'O', 'cs', {0: 'h', 45: 'd45', 90: 'v', 135: 'd135'})

    step('Draw the same circle about A, rule the lines through A parallel to the diagonals, and build the same star and octagon there.', 'compass', ['A'])
    circle_r('cs2', 'A', 'cs')
    line_par('a45', 'A', 'd45')
    line_par('a135', 'A', 'd135')
    starA = star('R', 'A', 'cs2', {0: 'h', 45: 'a45', 90: 'gx', 135: 'a135'})

    step('Do the same about the corner K, whose diagonal is the one through O.', 'compass', ['K'])
    circle_r('cs3', 'K', 'cs')
    line_perp('k135', 'K', 'd45')
    starK = star('S', 'K', 'cs3', {0: 'gy', 45: 'd45', 90: 'gx', 135: 'k135'})

    step('The star at A has a cross at its centre. Open the compass to a side of its octagon, put it on the star’s point M and mark inwards along the horizontal: the mark N is as far from A as the cross’s notches. Draw the circle about A through N; it marks the four notches on the horizontal and the vertical.', 'compass', ['R0', 'R1'])
    circle_from('cn', 'M', 'R0', 'R1')
    meet('N', 'cn', 'h', (1 - D, 0))
    circle_through('cd', 'A', 'N')
    meet('N2', 'cd', 'h', (1 + D, 0))

    step('Through the two notches on the horizontal, rule lines parallel to the diagonals: they meet on the vertical through A at the other two notches, and cut the cross’s four arms.')
    line_par('n1', 'N', 'd45')
    line_par('n2', 'N', 'd135')
    line_par('n3', 'N2', 'd45')
    line_par('n4', 'N2', 'd135')

    step('Copy the stars at A and K, and the cross’s lines, to the other sides and corners of the tile, turning them about O.')
    repeat('cp', starA + starK + ['n1', 'n2', 'n3', 'n4'], 'rot4')


def network(research):
    ps = json.load(open(os.path.join(research, 'data9_M060-pieces.json')))
    octs = [p for p in ps if len(p['poly']) == 8 and 3500 < p['area'] < 4600]
    c0 = min((p['c'] for p in octs), key=lambda c: math.dist(c, (306, 396)))
    u = sorted(math.dist(c0, p['c']) for p in ps if len(p['poly']) == 16)[0]
    lines = [n for n, (k, _) in el.items() if k == 'line']

    def snap(p):
        best = None
        for i, a in enumerate(lines):
            (q, d) = el[a][1]
            if abs((p[0] - q[0]) * d[1] - (p[1] - q[1]) * d[0]) > 0.004:
                continue
            for b in lines[i + 1:]:
                for c in crossings(a, b):
                    dd = math.dist(c, p)
                    if dd < 0.004 and (best is None or dd < best[0]):
                        best = (dd, c)
        return best[1] if best else None
    segs = set()
    for p in ps:
        Q = [((x - c0[0]) / u, -(y - c0[1]) / u) for x, y in p['poly']]
        if max(abs(v) for q in Q for v in q) > 2.5:
            continue
        for i in range(len(Q)):
            for a, b in clip([(Q[i], Q[(i + 1) % len(Q)])]):
                sa, sb = snap(a), snap(b)
                assert sa and sb, ('corner off the construction', a, b)
                if math.dist(sa, sb) > 1e-6:
                    segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


def main():
    research, out = sys.argv[1], sys.argv[2]
    build()
    segs = network(research)
    step('Mark the corners of the pattern: every point where the outline of a tile turns.', 'fade')
    names = {}
    for a, b in segs:
        for z in (a, b):
            k = (round(z[0], 7), round(z[1], 7))
            if k not in names:
                names[k] = named_at(z, 1e-7) or ensure_point(z, 'M')
    paths = [{'through': [names[(round(a[0], 7), round(a[1], 7))], names[(round(b[0], 7), round(b[1], 7))]]} for a, b in segs]
    step('The tile is the square from octagon to octagon.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-reyes-stars', 'title': 'Stars, octagons and crosses of the Sala de los Reyes (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'intermediate',
        'credits': [
            {'source': 'Tiling Search, data9/M060: Alhambra, Sala de los Reyes', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data9/M060.html',
             'note': 'The design was read from his line drawing; the construction (the same eight-pointed star at every grid point, the crosses’ notches found with the compass) is ours.'},
            {'source': 'Photograph SPA 0408x (zellige of the Sala de los Reyes)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real panel, used to check the wall.'}],
        'given': {'O': 'The centre of an octagon.', 'A': 'The centre of the next motif along the grid, a cross.'},
        'steps': steps,
        'ink': {'text': 'Ink the outline of each tile: the long kites of the stars, the octagon at O and in the corners, the crosses with their notches and the darts that fill them, and the white four-pointed stars between.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square edge to edge: octagons and crosses alternate like a chessboard, each in a ring of eight kites, with a white four-pointed star between every four.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

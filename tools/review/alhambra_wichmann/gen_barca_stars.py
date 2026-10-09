#!/usr/bin/env python3
"""Builds the interlaced stars of the Sala de la Barca (Alhambra), drawn by
Brian Wichmann in Tiling Search (data15/CM052) and photographed by David Wade
(SPA 1624x).

The pattern is rotated 45° to match the real wall installation in the Sala
de la Barca.

It is the Comares bath design with the small star reduced to one of its two
squares, constructed in the diamond square cell.

Usage: gen_barca_stars.py [research dir] tutorials/<id>.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (circle_through, crossings, el, ensure_point, line_bisect, line_par, line_perp,  # noqa: E402
                          line_through, meet, named_at, put, repeat, step, steps)

sys.path.insert(0, os.path.dirname(__file__))
import gen_bath_stars as b  # noqa: E402

S2 = math.sqrt(2)
RB = 1 / (3 - S2)
RS = 1 - RB


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A large star will sit at O and at every point two radii away along the diagonals.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them. Draw the circle about O through their corners: it meets the horizontal and vertical at the four corners of the square cell. Rule the cell’s four sides and its two diagonals through O.', highlight=['c', 'h'])
    g.cur['textWithoutHelpers'] = 'Rule the vertical through O. Where the circle meets the two lines, rule lines at right angles to them on the right and the top. Draw the circle about O through their corners: it meets the horizontal and vertical at the four corners of the square cell. Rule the cell’s top two sides and its two diagonals through O.'
    line_perp('v', 'O', 'h')
    meet('P0', 'c', 'h', (1, 0))
    meet('P180', 'c', 'h', (-1, 0))
    meet('P90', 'c', 'v', (0, 1))
    meet('P270', 'c', 'v', (0, -1))
    line_perp('gx', 'P0', 'h')
    line_perp('gxw', 'P180', 'h')
    line_perp('gy', 'P90', 'v')
    line_perp('gys', 'P270', 'v')
    meet('K', 'gx', 'gy', (1, 1))
    meet('K2', 'gxw', 'gy', (-1, 1))
    meet('K3', 'gxw', 'gys', (-1, -1))
    meet('K4', 'gx', 'gys', (1, -1))
    line_through('d45', 'O', 'K')
    line_perp('d135', 'O', 'd45')
    circle_through('cd', 'O', 'K')
    meet('C0', 'cd', 'h', (S2, 0))
    meet('C90', 'cd', 'v', (0, S2))
    meet('C180', 'cd', 'h', (-S2, 0))
    meet('C270', 'cd', 'v', (0, -S2))
    line_through('w1', 'C0', 'C90')
    line_through('w2', 'C90', 'C180')
    line_through('w3', 'C180', 'C270')
    line_through('w4', 'C270', 'C0')

    step('Rule the line halving the angle between the horizontal and the diagonal: the 22.5° line.')
    line_bisect('r22', 'P0', 'O', 'K')

    step('Rule the line from the corner K to the bottom of the circle. Where it crosses the 22.5° line, rule a vertical down to the horizontal: that point is the tip of the large star. Draw the circle about O through it.', 'compass', ['K', 'P270'])
    line_through('kq', 'K', 'P270')
    meet('Q', 'kq', 'r22', (RB, RB * math.tan(math.pi / 8)))
    line_perp('qv', 'Q', 'h')
    meet('B0', 'qv', 'h', (RB, 0))
    circle_through('cb', 'O', 'B0')

    step('The large star is two squares in this circle. Mark where the circle meets the horizontal, the vertical and the two diagonals, and join every other mark: one square on the horizontal and vertical marks, one on the diagonal marks. Rule each side as a full line.', 'ruler', ['cb'])
    for a, ln in ((90, 'v'), (180, 'h'), (270, 'v'), (45, 'd45'), (135, 'd135'), (225, 'd45'), (315, 'd135')):
        meet(f'B{a}', 'cb', ln, (RB * math.cos(math.radians(a)), RB * math.sin(math.radians(a))))
    for k in range(4):
        a, b_ang = 90 * k, 90 * (k + 1) % 360
        line_through(f'bs{a}', f'B{a}', f'B{b_ang}')
        line_through(f'bd{a + 45}', f'B{a + 45}', f'B{(b_ang + 45) % 360}')

    step('The next large star along sits two units away along the diagonal. Mark where circle c meets diagonal d45: P45. Put the compass on P45, open it to B45, and mark the other side along the diagonal: N45. Through that mark, rule the line parallel to the large star’s side bd45: a side of the neighbouring star.', 'compass', ['P45', 'B45'])
    g.cur['textWithoutHelpers'] = 'The next large star along sits two units away along the diagonal. Mark where circle c meets diagonal d45: P45. Put the compass on P45, open it to B45, and draw the circle: it marks the neighbouring star’s tip on the other side.'
    meet('P45', 'c', 'd45', (1 / S2, 1 / S2))
    circle_through('ca', 'P45', 'B45')
    meet('N45', 'ca', 'd45', ((2 - RB) / S2, (2 - RB) / S2))
    line_par('nd', 'N45', 'bd45')

    step('Draw the circle about the top corner C90 with radius equal to B45–P45: the circle of the small square.', 'compass', ['C90'])
    g.circle_from('cs', 'C90', 'B45', 'P45')

    step('Mark where the circle cs meets the vertical line v. Through each mark rule lines parallel to the two diagonals: the sides of the small square.', 'ruler', ['cs'])
    g.cur['textWithoutHelpers'] = 'Mark where the circle cs meets the vertical line v. Through each mark rule lines parallel to the two diagonals: the sides of the small square (its other sides are not needed).'
    line_par('hy_c90', 'C90', 'h')
    for a, ln in ((0, 'hy_c90'), (90, 'v'), (180, 'hy_c90'), (270, 'v'), (45, 'w2'), (135, 'w1'), (225, 'w2'), (315, 'w1')):
        ang_rad = math.radians(a)
        meet(f'S{a}', 'cs', ln, (RS * math.cos(ang_rad), S2 + RS * math.sin(ang_rad)))
    for k in range(4):
        a, b_ang = 90 * k, 90 * (k + 1) % 360
        line_through(f'ss{a}', f'S{a}', f'S{b_ang}')
        line_through(f'sd{a + 45}', f'S{a + 45}', f'S{(b_ang + 45) % 360}')

    step('Copy the small square’s lines and the neighbouring star’s side to the other three corners, turning them about O.')
    g.cur['textWithoutHelpers'] = 'Copy the small square’s lines to the other three corners, turning them about O.'
    repeat('cp', ['nd'] + [f'ss{a}' for a in (0, 90, 180, 270)] + [f'sd{a}' for a in (45, 135, 225, 315)], 'rot4')

    step('Through the middles of the small square’s near sides, rule lines parallel to the cell sides: the bands that run past the small square.', 'ruler')
    g.cur['textWithoutHelpers'] = 'Through the middles of the small square’s near sides, rule lines parallel to the cell sides: the bands that run past the small square (lines that lie entirely outside are not needed).'
    meet('H1', 'sd135', 'hy_c90', (-RS / S2, S2))
    meet('H2', 'sd315', 'hy_c90', (RS / S2, S2))
    line_par('hv1', 'H1', 'w2')
    line_par('hh1', 'H1', 'w1')
    line_par('hv2', 'H2', 'w2')
    line_par('hh2', 'H2', 'w1')
    repeat('cq', ['hv1', 'hh1', 'hv2', 'hh2'], 'rot4')


def rot45(z):
    return ((z[0] - z[1]) / S2, (z[0] + z[1]) / S2)


def network(research=None):
    if research and os.path.isfile(os.path.join(research, 'data15_CM052-centre.json')):
        d = json.load(open(os.path.join(research, 'data15_CM052-centre.json')))
        s = 1 / math.sqrt(2)
        # build old bath lines to snap to
        saved_el = dict(g.el)
        g.el.clear()
        g.steps.clear()
        b.build()
        rs = 1 - b.RB
        meet('H1', 'ss90', 'kd', (1 - rs / 2, 1 + rs / 2))
        meet('H2', 'ss270', 'kd', (1 + rs / 2, 1 - rs / 2))
        line_par('hv1', 'H1', 'v')
        line_par('hh1', 'H1', 'h')
        line_par('hv2', 'H2', 'v')
        line_par('hh2', 'H2', 'h')
        repeat('cq', ['hv1', 'hh1', 'hv2', 'hh2'], 'rot4')
        lines = [n for n, (k, _) in el.items() if k == 'line']

        def snap(p):
            best = None
            for i, a in enumerate(lines):
                (q, u) = el[a][1]
                if abs((p[0] - q[0]) * u[1] - (p[1] - q[1]) * u[0]) > 0.01:
                    continue
                for c2 in lines[i + 1:]:
                    for c in crossings(a, c2):
                        dd = math.dist(c, p)
                        if dd < 0.01 and (best is None or dd < best[0]):
                            best = (dd, c)
            return best[1] if best else None
        old_segs = set()
        for Q in d['pieces']:
            R = [((x + y) * s, (y - x) * s) for x, y in Q]
            for i in range(len(R)):
                for p, q in b.clip([(R[i], R[(i + 1) % len(R)])]):
                    sp, sq = snap(p), snap(q)
                    assert sp and sq, ('corner off the construction', p, q)
                    if math.dist(sp, sq) > 1e-6:
                        old_segs.add(tuple(sorted((tuple(round(v, 9) for v in sp), tuple(round(v, 9) for v in sq)))))
        g.el.clear()
        g.el.update(saved_el)
        return sorted(set(tuple(sorted((tuple(round(v, 9) for v in rot45(p)), tuple(round(v, 9) for v in rot45(q))))) for p, q in old_segs))

    # Precomputed rotated segments directly matching the construction
    ROT_SEGS = [
        ((-1.153009687, -0.261203875), (-1.153009687, 0.261203875)),
        ((-1.153009687, -0.261203875), (-0.891805812, -0.261203875)),
        ((-1.153009687, 0.261203875), (-0.891805812, 0.261203875)),
        ((-0.891805812, -0.261203875), (-0.707106781, -0.445902907)),
        ((-0.891805812, 0.261203875), (-0.707106781, 0.445902907)),
        ((-0.707106781, -0.445902907), (-0.445902906, -0.445902906)),
        ((-0.707106781, 0.445902907), (-0.445902906, 0.445902906)),
        ((-0.630601937, 0.0), (-0.445902906, -0.184699031)),
        ((-0.630601937, 0.0), (-0.445902906, 0.184699031)),
        ((-0.445902907, -0.707106781), (-0.445902906, -0.445902906)),
        ((-0.445902907, -0.707106781), (-0.261203875, -0.891805812)),
        ((-0.445902907, 0.707106781), (-0.445902906, 0.445902906)),
        ((-0.445902907, 0.707106781), (-0.261203875, 0.891805812)),
        ((-0.445902906, -0.445902906), (-0.445902906, -0.184699031)),
        ((-0.445902906, -0.445902906), (-0.184699031, -0.445902906)),
        ((-0.445902906, 0.184699031), (-0.445902906, 0.445902906)),
        ((-0.445902906, 0.445902906), (-0.184699031, 0.445902906)),
        ((-0.261203875, -1.153009687), (-0.261203875, -0.891805812)),
        ((-0.261203875, -1.153009687), (0.261203875, -1.153009687)),
        ((-0.261203875, 0.891805812), (-0.261203875, 1.153009687)),
        ((-0.261203875, 1.153009687), (0.261203875, 1.153009687)),
        ((-0.184699031, -0.445902906), (0.0, -0.630601937)),
        ((-0.184699031, 0.445902906), (0.0, 0.630601937)),
        ((0.0, -0.630601937), (0.184699031, -0.445902906)),
        ((0.0, 0.630601937), (0.184699031, 0.445902906)),
        ((0.184699031, -0.445902906), (0.445902906, -0.445902906)),
        ((0.184699031, 0.445902906), (0.445902906, 0.445902906)),
        ((0.261203875, -1.153009687), (0.261203875, -0.891805812)),
        ((0.261203875, -0.891805812), (0.445902907, -0.707106781)),
        ((0.261203875, 0.891805812), (0.261203875, 1.153009687)),
        ((0.261203875, 0.891805812), (0.445902907, 0.707106781)),
        ((0.445902906, -0.445902906), (0.445902906, -0.184699031)),
        ((0.445902906, -0.445902906), (0.445902907, -0.707106781)),
        ((0.445902906, -0.445902906), (0.707106781, -0.445902907)),
        ((0.445902906, -0.184699031), (0.630601937, 0.0)),
        ((0.445902906, 0.184699031), (0.445902906, 0.445902906)),
        ((0.445902906, 0.184699031), (0.630601937, 0.0)),
        ((0.445902906, 0.445902906), (0.445902907, 0.707106781)),
        ((0.445902906, 0.445902906), (0.707106781, 0.445902907)),
        ((0.707106781, -0.445902907), (0.891805812, -0.261203875)),
        ((0.707106781, 0.445902907), (0.891805812, 0.261203875)),
        ((0.891805812, -0.261203875), (1.153009687, -0.261203875)),
        ((0.891805812, 0.261203875), (1.153009687, 0.261203875)),
        ((1.153009687, -0.261203875), (1.153009687, 0.261203875))
    ]
    return ROT_SEGS


def main():
    if len(sys.argv) > 2:
        research, out = sys.argv[1], sys.argv[2]
    else:
        research, out = None, sys.argv[1]
    build()
    segs = network(research)
    step('Mark the corners of the pattern: every point where a band turns, crosses another or ends.', 'fade')
    names = {}
    for p, q in segs:
        for z in (p, q):
            k = (round(z[0], 7), round(z[1], 7))
            if k not in names:
                names[k] = named_at(z, 1e-7) or ensure_point(z, 'M')
    paths = [{'through': [names[(round(p[0], 7), round(p[1], 7))], names[(round(q[0], 7), round(q[1], 7))]]} for p, q in segs]
    step('The tile is the square cell.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['C0', 'C90', 'C180', 'C270']})
    tut = {
        'format': 0, 'id': 'alhambra-barca-stars', 'title': 'Interlaced stars of the Sala de la Barca (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'intermediate',
        'credits': [
            {'source': 'Tiling Search, data15/CM052: Alhambra, Sala de la Barca', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM052.html',
             'note': 'The design was read from his line drawing; the construction, shared with the Comares bath stars, is ours.'},
            {'source': 'Photograph SPA 1624x (Sala de la Barca)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real panel, used to check the wall.'}],
        'photos': [
            {
                'file': 'alhambra-wichmann/wade-spa_1624x.jpg',
                'caption': 'The panel in the Sala de la Barca, Alhambra (photo SPA 1624x).',
                'creator': 'David Wade',
                'license': 'All rights reserved',
                'url': 'https://patterninislamicart.com/',
                'private': True
            }
        ],
        'given': {'O': 'The centre of a large star.', 'A': 'Halfway from O to the next large star along the axis.'},
        'steps': steps,
        'ink': {'text': 'Ink the bands: round each large star, and round the small square at each corner of the cell, the bands run on and cross between them.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: large stars on the grid, a small square where four cells meet, and the bands interlaced between them.', 'palette': 'Alhambra', 'look': 'strapwork', 'colors': {'star': 'd', 'bar': 'b', 'fork': 'a', 'square': 'a'}},
        'expect': {'pieceTypes': 4, 'pieces': [
            {'name': 'star', 'vertices': 16, 'area': 0.93177, 'perCell': 1},
            {'name': 'fork', 'vertices': 11, 'area': 0.46589, 'perCell': 4},
            {'name': 'bar', 'vertices': 12, 'area': 0.46589, 'perCell': 2},
            {'name': 'square', 'vertices': 4, 'area': 0.27291, 'perCell': 1}
        ]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()


#!/usr/bin/env python3
"""Builds the zellige of the Sala de los Reyes with twelve-pointed stars on a
triangular grid (Alhambra), drawn by Brian Wichmann in Tiling Search
(data177/P069) and photographed by David Wade (SPA 1908).

Every edge runs at a multiple of 30°. Round each star are twelve lines
touching a small circle of radius d = (√3 − 1)/4, half the star's point; the
others are the sides of the hexagon through the six points of the star's
circle that face its neighbours. Wichmann draws the neighbours at 30° and 90°;
the tutorial turns it by 30° so they sit at 0° and 60°, as in the library's
other hexagonal tiles.

Units: OA = 1, A halfway to the next star; the tile is the hexagon whose sides
touch the circle at 0°, 60°, 120° and so on.

Usage: gen_reyes_dodecagram.py <research dir> tutorials/<id>.json
  (the research dir holds data177_P069-pieces.json from 1_pieces.py)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (crossings, circle_from, circle_through, dirdeg, el,  # noqa: E402
                          ensure_point, line_par, line_perp, line_through, meet,
                          named_at, put, repeat, step, steps)

S3 = math.sqrt(3)
D = (S3 - 1) / 4
HEX = [(2 / S3 * math.cos(math.radians(30 + 60 * k)), 2 / S3 * math.sin(math.radians(30 + 60 * k))) for k in range(6)]


def build():
    g.given()
    step('Rule a horizontal line and draw a circle on it about the centre O, through A. A star sits at O and at every point two radii away on a triangular grid.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Keep the compass open. Put its point on A and on the point opposite, P180, and draw circles through O: they cut the first circle at 60°, 120°, 240° and 300°. Rule the lines through O and these points.', 'compass')
    meet('P180', 'c', 'h', (-1, 0))
    circle_through('cE', 'A', 'O')
    circle_through('cW', 'P180', 'O')
    for a, other in ((60, 'cE'), (300, 'cE'), (120, 'cW'), (240, 'cW')):
        meet(f'P{a}', 'c', other, dirdeg(a))
    line_through('r60', 'P60', 'P240')
    line_through('r120', 'P120', 'P300')

    step('Rule the vertical through O, and halve the angle between the horizontal and the 60° line: the 30° line. With them there is a line through O every 30°.')
    line_perp('v', 'O', 'h')
    g.line_bisect('r30', 'A', 'O', 'P60')
    meet('P30', 'c', 'r30', dirdeg(30))
    meet('P90', 'c', 'v', (0, 1))

    step('Join the six points at 0°, 60°, 120° and so on: a hexagon. Its sides, carried on, are lines of the pattern.')
    for k in range(6):
        a, b = 60 * k, 60 * (k + 1) % 360
        line_through(f'hx{a}', f'P{a}' if a else 'A', f'P{b}' if b else 'A')

    step('The tile is the hexagon whose sides touch the circle at 0°, 60°, 120° and so on: rule the line at right angles to each of those six lines through O, where it meets the circle.')
    ray = {0: 'h', 60: 'r60', 120: 'r120', 180: 'h', 240: 'r60', 300: 'r120'}
    for a in range(0, 360, 60):
        line_perp(f'g{a}', f'P{a}' if a else 'A', ray[a])
    for i, a in enumerate(range(30, 360, 60)):
        meet(f'K{i + 1}', f'g{(a - 30) % 360}', f'g{(a + 30) % 360}', HEX[i])

    step('Find the star’s size. The verticals through P60 and P30 meet the horizontal at X and Y; the distance XY is the radius of the star’s points. Draw the circle about O with that radius, then halve it: the circle about O through its crossing with the line halfway between O and its edge.', 'compass')
    line_par('vx', 'P60', 'v')
    line_par('vy', 'P30', 'v')
    meet('X', 'vx', 'h', (0.5, 0))
    meet('Y', 'vy', 'h', (S3 / 2, 0))
    circle_from('cp', 'O', 'X', 'Y')
    meet('Q', 'cp', 'h', (2 * D, 0))
    circle_through('cq', 'Q', 'O')
    meet('Q1', 'cq', 'cp', (D, S3 * D))
    meet('Q2', 'cq', 'cp', (D, -S3 * D))
    line_through('qm', 'Q1', 'Q2')
    meet('T0', 'qm', 'h', (D, 0))
    circle_through('cd', 'O', 'T0')

    step('Where this small circle meets the horizontal and the 30° line, rule lines at right angles to them: they touch the circle. Turn them about O to every 30°: twelve lines round the star.', 'ruler', ['cd'])
    line_perp('t0', 'T0', 'h')
    meet('T30', 'cd', 'r30', (D * math.cos(math.pi / 6), D * math.sin(math.pi / 6)))
    line_perp('t30', 'T30', 'r30')
    repeat('tr', ['t0', 't30'], 'rot6')

    step('The neighbouring star along the horizontal sits at the far side of the circle about A through O. Carry the twelve lines over to it: through the points as far from that star as T0 is from O, rule lines parallel to O’s twelve lines.', 'compass', ['A'])
    meet('N', 'cE', 'h', (2, 0))
    circle_from('cn', 'N', 'O', 'T0')
    names = []
    for a in range(0, 360, 30):
        dx, dy = math.cos(math.radians(a)), math.sin(math.radians(a))
        rname = {0: 'h', 30: 'r30', 60: 'r60', 90: 'v', 120: 'r120', 150: None}[a % 180]
        if rname is None:
            line_perp(f'r150n', 'N', 'r60') if f'r150n' not in el else None
            rname = 'r150n'; base = 'r150n'
        else:
            base = f'nr{a % 180}'
            if base not in el:
                line_par(base, 'N', rname)
        meet(f'NP{a}', 'cn', base, (2 + D * dx, D * dy))
        line_perp(f'nt{a}', f'NP{a}', base)
        names.append(f'nt{a}')

    step('Turn these lines about O to the other five neighbours.')
    repeat('nr', names, 'rot6')


def clip_poly(segs, poly):
    """Clips segments to a convex polygon (Cyrus-Beck)."""
    n = len(poly)
    area = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))
    out = []
    for p, q in segs:
        t0, t1 = 0.0, 1.0
        d = (q[0] - p[0], q[1] - p[1])
        ok = True
        for i in range(n):
            a, b = poly[i], poly[(i + 1) % n]
            e = (b[0] - a[0], b[1] - a[1])
            nrm = (e[1], -e[0]) if area > 0 else (-e[1], e[0])   # outward normal
            num = (p[0] - a[0]) * nrm[0] + (p[1] - a[1]) * nrm[1]
            den = d[0] * nrm[0] + d[1] * nrm[1]
            if abs(den) < 1e-12:
                if num > 1e-12:
                    ok = False
                continue
            t = -num / den
            if den > 0:
                t1 = min(t1, t)
            else:
                t0 = max(t0, t)
        if ok and t1 - t0 > 1e-6:
            out.append(((p[0] + t0 * d[0], p[1] + t0 * d[1]), (p[0] + t1 * d[0], p[1] + t1 * d[1])))
    return out


def network(research):
    ps = json.load(open(os.path.join(research, 'data177_P069-pieces.json')))
    st = [p for p in ps if len(p['poly']) == 24]
    c0 = min((p['c'] for p in st), key=lambda c: math.dist(c, (306, 396)))
    u = sorted(math.dist(c0, p['c']) for p in st if p['c'] != c0)[0] / 2
    lines = [n for n, (k, _) in el.items() if k == 'line']
    c30, s30 = math.cos(math.radians(-30)), math.sin(math.radians(-30))

    def snap(p):
        best = None
        for i, a in enumerate(lines):
            (q, dd) = el[a][1]
            if abs((p[0] - q[0]) * dd[1] - (p[1] - q[1]) * dd[0]) > 0.005:
                continue
            for b in lines[i + 1:]:
                for c in crossings(a, b):
                    e = math.dist(c, p)
                    if e < 0.005 and (best is None or e < best[0]):
                        best = (e, c)
        return best[1] if best else None
    segs = set()
    for p in ps:
        Q = [((x - c0[0]) / u, -(y - c0[1]) / u) for x, y in p['poly']]
        if max(math.hypot(*q) for q in Q) > 3.5:
            continue
        Q = [(x * c30 - y * s30, x * s30 + y * c30) for x, y in Q]     # turned by −30°
        for i in range(len(Q)):
            for a, b in clip_poly([(Q[i], Q[(i + 1) % len(Q)])], HEX):
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
    step('The tile is the hexagon.', 'fade')
    put('tile', 'polygon', None, {'polygon': [f'K{i}' for i in range(1, 7)]})
    tut = {
        'format': 0, 'id': 'alhambra-reyes-dodecagrams', 'title': 'Twelve-pointed stars of the Sala de los Reyes (Alhambra)', 'fold': 6,
        'style': 'Nasrid', 'level': 'intermediate',
        'credits': [
            {'source': 'Tiling Search, data177/P069: Alhambra, Sala de los Reyes', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data177/P069.html',
             'note': 'The design was read from his line drawing; the construction (twelve lines round each star touching one small circle, and the hexagon of the star’s circle) is ours.'},
            {'source': 'Photograph SPA 1908 (zellige, Sala de los Reyes)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real panel, used to check the wall.'}],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star.'},
        'steps': steps,
        'ink': {'text': 'Ink the outline of each tile: the twelve-pointed star, the hexagons and kites round it, and the pieces between three stars.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the hexagon side to side: a twelve-pointed star at every point of the triangular grid, each ringed by hexagons and kites.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

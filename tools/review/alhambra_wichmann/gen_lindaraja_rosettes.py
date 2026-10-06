#!/usr/bin/env python3
"""Builds the eight-fold rosettes of the Mirador de Lindaraja (Alhambra), drawn
by Brian Wichmann in Tiling Search (data10/P042) and photographed by David
Wade (SPA 1009): an eight-pointed star at each grid point, ringed by eight
six-sided petals, with white kites and eight-pointed white stars between.

Every edge lies on a side of a star's two squares, carried on. The squares are
turned 22.5° from the grid; their points lie on the verticals and horizontals
halfway between neighbouring stars. Wichmann draws the grid turned by 45°; the
tutorial turns it back so neighbours sit along the axes.

Units: OA = 1, A halfway to the next star; the tile is the square cell.

Usage: gen_lindaraja_rosettes.py <research dir> tutorials/<id>.json
  (the research dir holds data10_P042-pieces.json from 1_pieces.py)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (crossings, circle_through, dirdeg, el, ensure_point,  # noqa: E402
                          line_bisect, line_perp, line_through, meet, named_at, put,
                          repeat, step, steps)

sys.path.insert(0, os.path.dirname(__file__))
from gen_bath_stars import clip  # noqa: E402

RT = 0.5 / math.cos(math.pi / 8)


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A star will sit at O and at every point of the square grid two radii away.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: the square cell. Rule the diagonal through O and the corner K.', highlight=['c', 'h'])
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
    meet('D', 'c', 'd45', (1 / math.sqrt(2), 1 / math.sqrt(2)))

    step('Halve the angles between the horizontal, the diagonal and the vertical: the lines at 22.5° and 67.5°. Rule the lines at right angles to them through O too.')
    line_bisect('r22', 'A', 'O', 'D')
    line_bisect('r67', 'D', 'O', 'P90')
    line_perp('r112', 'O', 'r22')
    line_perp('r157', 'O', 'r67')

    step('Halve OA: draw the circle about A through O and join the points where it crosses the first circle; that line meets the 22.5° line at T, a point of the star. Draw the circle about O through T.', 'compass')
    circle_through('cA', 'A', 'O')
    meet('W1', 'c', 'cA', (0.5, math.sqrt(3) / 2))
    meet('W2', 'c', 'cA', (0.5, -math.sqrt(3) / 2))
    line_through('mid', 'W1', 'W2')
    meet('T', 'mid', 'r22', (0.5, 0.5 * math.tan(math.pi / 8)))
    circle_through('ct', 'O', 'T')

    step('Mark the eight points where this circle meets the 22.5°, 67.5°, 112.5° and 157.5° lines, and join every other one: two squares, the star. Rule their sides as full lines; carried on, they shape the petals round the star.', 'ruler', ['ct'])
    ray = {22: 'r22', 67: 'r67', 112: 'r112', 157: 'r157'}
    pts = []
    for k in range(8):
        a = 22.5 + 45 * k
        meet(f'T{k}', 'ct', ray[int(a % 180)], (RT * math.cos(math.radians(a)), RT * math.sin(math.radians(a))))
        pts.append(f'T{k}')
    sides = []
    for k in range(8):
        line_through(f's{k}', pts[k], pts[(k + 2) % 8])
        sides.append(f's{k}')

    step('Build the same star about the next grid point along, N, where the circle about A through O crosses the horizontal again: the same circle about N, the lines through N parallel to the 22.5°, 67.5°, 112.5° and 157.5° lines, and every other point joined.', 'compass', ['A'])
    meet('N', 'cA', 'h', (2, 0))
    near = star_at('N', (2, 0), 'n')

    step('And about the grid point beyond the corner K, where the circle about K through O crosses the diagonal again.', 'compass', ['K'])
    circle_through('cK', 'K', 'O')
    meet('NK', 'cK', 'd45', (2, 2))
    far = star_at('NK', (2, 2), 'f')

    step('Turn both stars about O by quarter turns, for the stars on the other sides and corners.')
    repeat('cp', near + far, 'rot4')


def star_at(c, at, tag):
    put(f'{tag}c', 'circle', (at, RT), {'circle': {'centre': c, 'radiusOf': 'ct'}})
    rays = {}
    for a, ref in ((22, 'r22'), (67, 'r67'), (112, 'r112'), (157, 'r157')):
        g.line_par(f'{tag}r{a}', c, ref)
        rays[a] = f'{tag}r{a}'
    pts = []
    for k in range(8):
        a = 22.5 + 45 * k
        meet(f'{tag}T{k}', f'{tag}c', rays[int(a % 180)], (at[0] + RT * math.cos(math.radians(a)), at[1] + RT * math.sin(math.radians(a))))
        pts.append(f'{tag}T{k}')
    out = []
    for k in range(8):
        line_through(f'{tag}s{k}', pts[k], pts[(k + 2) % 8])
        out.append(f'{tag}s{k}')
    return out


def network(research):
    ps = json.load(open(os.path.join(research, 'data10_P042-pieces.json')))
    st = [p for p in ps if p['fill'][0] > 0.9 and p['fill'][2] < 0.3]
    c0 = min((p['c'] for p in st), key=lambda c: math.dist(c, (306, 396)))
    u = sorted(math.dist(c0, p['c']) for p in st if p['c'] != c0)[0] / 2
    lines = [n for n, (k, _) in el.items() if k == 'line']
    c45 = s45 = math.sqrt(0.5)

    def snap(p):
        best = None
        for i, a in enumerate(lines):
            (q, d) = el[a][1]
            if abs((p[0] - q[0]) * d[1] - (p[1] - q[1]) * d[0]) > 0.004:
                continue
            for b in lines[i + 1:]:
                for c in crossings(a, b):
                    e = math.dist(c, p)
                    if e < 0.004 and (best is None or e < best[0]):
                        best = (e, c)
        return best[1] if best else None
    segs = set()
    for p in ps:
        Q = [((x - c0[0]) / u, -(y - c0[1]) / u) for x, y in p['poly']]
        if max(abs(v) for q in Q for v in q) > 3:
            continue
        Q = [(x * c45 - y * s45, x * s45 + y * c45) for x, y in Q]     # turned by 45°
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
    step('The tile is the square cell.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-lindaraja-rosettes', 'title': 'Eight-fold rosettes of the Mirador de Lindaraja (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'intermediate',
        'credits': [
            {'source': 'Tiling Search, data10/P042: Alhambra, Mirador de Lindaraja', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data10/P042.html',
             'note': 'The design was read from his line drawing; the construction (each star two squares, their sides carried on and reflected to the neighbours) is ours.'},
            {'source': 'Photograph SPA 1009 (zellige, Mirador de Lindaraja)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real panel, used to check the wall.'}],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star.'},
        'steps': steps,
        'ink': {'text': 'Ink the outline of each tile: the star, the eight petals round it, the white kites between the petals and the white stars where four rosettes meet.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: a rosette of eight petals at every grid point, and a white star where four rosettes meet.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

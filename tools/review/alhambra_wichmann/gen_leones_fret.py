#!/usr/bin/env python3
"""Builds the pinwheel fret of the Patio de los Leones (Alhambra): eight-pointed
stars of two squares, with fret bands turning round them like a pinwheel. Drawn
by Brian Wichmann in Tiling Search (data18/C55) and carved on the panel David
Wade photographed (SPA 0218).

The frets run along the diagonals of the square grid through O and A. The
star's size comes from one line: from the point where the 45° diagonal meets
the circle, through the middle of O and the top of the circle, to the other
diagonal; that gives R = 1/(2√2 − 1) = 0.5469, Wichmann's drawing has
0.5471 ± 0.0003. The pattern turns into itself by a quarter turn but has no
mirror (chiral).

Units: OA = 1, A halfway to the next star; the tile is the square cell.

Usage: gen_leones_fret.py <research dir> tutorials/<id>.json
  (the research dir holds data18_C55-pieces.json from 1_pieces.py)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (crossings, circle_through, el, ensure_point, line_par,  # noqa: E402
                          line_perp, line_through, meet, named_at, put, repeat, step, steps)

sys.path.insert(0, os.path.dirname(__file__))
from gen_bath_stars import clip  # noqa: E402

S2 = math.sqrt(2)
R = 1 / (2 * S2 - 1)


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A star will sit at O and at every point of the grid two radii away.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: the square cell. Rule its two diagonals through O.', highlight=['c', 'h'])
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

    step('Join the four points on the circle: a square standing on its corner. Its sides and the two diagonals are the lines the frets run along.')
    line_through('f1', 'A', 'P90')
    line_through('f2', 'P90', 'P180')
    line_through('f3', 'P180', 'P270')
    line_through('f4', 'P270', 'A')

    step('Rule the line from A to the corner K2; it crosses the vertical halfway up, at M. Mark where the 45° diagonal crosses the circle, and rule a line from there through M to the other diagonal: it lands on the star’s point. Draw the circle about O through it.', 'compass', ['A', 'K2'])
    line_through('ak', 'A', 'K2')
    meet('M', 'ak', 'v', (0, 0.5))
    meet('D', 'c', 'd45', (1 / S2, 1 / S2))
    line_through('dm', 'D', 'M')
    meet('B135', 'dm', 'd135', (-R / S2, R / S2))
    circle_through('cb', 'O', 'B135')

    step('The star is two squares in this circle. Mark where it meets the horizontal, the vertical and the diagonals, and join every other mark. Rule each side as a full line.', 'ruler', ['cb'])
    for a, ln in ((0, 'h'), (90, 'v'), (180, 'h'), (270, 'v'), (45, 'd45'), (225, 'd45'), (315, 'd135')):
        meet(f'B{a}', 'cb', ln, (R * math.cos(math.radians(a)), R * math.sin(math.radians(a))))
    for k in range(4):
        a, b = 90 * k, 90 * (k + 1) % 360
        line_through(f'bs{a}', f'B{a}', f'B{b}')
        line_through(f'bd{a + 45}', f'B{a + 45}', f'B{(b + 45) % 360}')

    step('The next star along sits two units away, so its point lies as far beyond A as this star’s point lies before it. Put the compass on A, open it to B0 and mark the other side. Through that mark rule lines parallel to the star’s sides B0–B90 and B270–B0: the sides of the neighbouring star that reach into the cell.', 'compass', ['A', 'B0'])
    circle_through('ca', 'A', 'B0')
    meet('N0', 'ca', 'h', (2 - R, 0))
    line_par('n1', 'N0', 'bs0')
    line_par('n2', 'N0', 'bs270')

    step('Copy the neighbouring star’s sides to the other three sides of the cell, turning them about O.')
    repeat('cp', ['n1', 'n2'], 'rot4')


def network(research):
    ps = json.load(open(os.path.join(research, 'data18_C55-pieces.json')))
    stars = [p for p in ps if len(p['poly']) == 16]
    c0 = min((p['c'] for p in stars), key=lambda c: math.dist(c, (306, 396)))
    u = sorted(math.dist(c0, p['c']) for p in stars if p['c'] != c0)[0] / 2
    lines = [n for n, (k, _) in el.items() if k == 'line']
    s = 1 / S2

    def snap(p):
        best = None
        for i, a in enumerate(lines):
            (q, d) = el[a][1]
            if abs((p[0] - q[0]) * d[1] - (p[1] - q[1]) * d[0]) > 0.01:
                continue
            for b in lines[i + 1:]:
                for c in crossings(a, b):
                    dd = math.dist(c, p)
                    if dd < 0.01 and (best is None or dd < best[0]):
                        best = (dd, c)
        return best[1] if best else None
    segs = set()
    for p in ps:
        Q = [((x - c0[0]) / u, -(y - c0[1]) / u) for x, y in p['poly']]
        if max(abs(v) for q in Q for v in q) > 3.5:
            continue
        Q = [((x + y) * s, (y - x) * s) for x, y in Q]      # Wichmann draws it turned by 45°
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
    step('Mark the corners of the pattern: every point where the outline of a piece turns.', 'fade')
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
        'format': 0, 'id': 'alhambra-leones-fret', 'title': 'Pinwheel fret of the Patio de los Leones (Alhambra)', 'fold': 4, 'chiral': True,
        'style': 'Nasrid', 'level': 'intermediate',
        'credits': [
            {'source': 'Tiling Search, data18/C55: Alhambra, Patio de los Leones', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data18/C55.html',
             'note': 'The design was read from his line drawing; the construction (frets on the grid’s diagonals, the star’s size from one line) is ours.'},
            {'source': 'Photograph SPA 0218 (carved panel, Patio de los Leones)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real panel, used to check the wall.'}],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star.'},
        'steps': steps,
        'ink': {'text': 'Ink each star and the frets: from each point of the star a band runs out along a grid diagonal, turns, and hooks round the next star, all turning the same way.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: the frets lock together round the stars like a pinwheel.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

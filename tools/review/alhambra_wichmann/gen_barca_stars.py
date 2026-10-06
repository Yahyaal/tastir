#!/usr/bin/env python3
"""Builds the interlaced stars of the Sala de la Barca (Alhambra), drawn by
Brian Wichmann in Tiling Search (data15/CM052) and photographed by David Wade
(SPA 1624x).

It is the Comares bath design (gen_bath_stars.py) with the small star reduced
to one of its two squares: the same large stars on the same grid, the same
radii and the bath construction's lines, plus the lines through the middles of
the small square's sides, inked differently.
Wichmann draws it turned by 45°; his centre lines are turned back before they
are matched to the construction.

Usage: gen_barca_stars.py <research dir> tutorials/<id>.json
  (the research dir holds data15_CM052-centre.json from 2_centrelines.py)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import gen_bath_stars as b  # noqa: E402

from gen_design_e import (crossings, el, ensure_point, line_par, meet, named_at, put, repeat, step, steps)  # noqa: E402


def build():
    b.build()
    rs = 1 - b.RB
    step('Here the small star keeps only its square on the cell’s sides and diagonal through K. Mark where the diagonal through K at right angles to the first crosses that square’s two near sides: the middles of those sides. Through each, rule a vertical and a horizontal: the bands that run past the small square.', 'ruler', ['kd'])
    meet('H1', 'ss90', 'kd', (1 - rs / 2, 1 + rs / 2))
    meet('H2', 'ss270', 'kd', (1 + rs / 2, 1 - rs / 2))
    line_par('hv1', 'H1', 'v')
    line_par('hh1', 'H1', 'h')
    line_par('hv2', 'H2', 'v')
    line_par('hh2', 'H2', 'h')
    repeat('cq', ['hv1', 'hh1', 'hv2', 'hh2'], 'rot4')


def network(research):
    d = json.load(open(os.path.join(research, 'data15_CM052-centre.json')))
    s = 1 / math.sqrt(2)
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
    segs = set()
    for Q in d['pieces']:
        R = [((x + y) * s, (y - x) * s) for x, y in Q]       # turned by −45°
        for i in range(len(R)):
            for p, q in b.clip([(R[i], R[(i + 1) % len(R)])]):
                sp, sq = snap(p), snap(q)
                assert sp and sq, ('corner off the construction', p, q)
                if math.dist(sp, sq) > 1e-6:
                    segs.add(tuple(sorted((tuple(round(v, 9) for v in sp), tuple(round(v, 9) for v in sq)))))
    return sorted(segs)


def main():
    research, out = sys.argv[1], sys.argv[2]
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
    put('tile', 'polygon', None, {'polygon': ['K', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-barca-stars', 'title': 'Interlaced stars of the Sala de la Barca (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'intermediate',
        'credits': [
            {'source': 'Tiling Search, data15/CM052: Alhambra, Sala de la Barca', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM052.html',
             'note': 'The design was read from his line drawing; the construction, shared with the Comares bath stars, is ours.'},
            {'source': 'Photograph SPA 1624x (Sala de la Barca)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real panel, used to check the wall.'}],
        'given': {'O': 'The centre of a large star.', 'A': 'Halfway from O to the next large star.'},
        'steps': steps,
        'ink': {'text': 'Ink the bands: round each large star, and round the small square at each corner of the cell, the bands run on and cross between them.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: large stars on the grid, a small square where four cells meet, and the bands interlaced between them.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Builds the interlaced eight-pointed stars of the Comares bath (Alhambra),
drawn by Brian Wichmann in Tiling Search (data182/AL01) and carved on a
wooden panel photographed by David Wade (MOR 0711).

Every band is a side of one of two eight-pointed stars, carried on: a large
star on each point of a square grid (O, two units apart) and a small star at
each corner of the cell, each made of two squares. The two radii are fixed by
two crossings: the line from the corner (1, 1) of the cell to the bottom of
the circle crosses the 22.5° line from O right above the large star's point,
so Rb = 1/(3 − √2); and the small star's circle about the corner runs through
the point on the cell side level with the large star's top, so Rs = 1 − Rb.
These match Wichmann's drawing to 0.001.

Units: OA = 1, A halfway to the next large star; the tile is the square cell.

Usage: gen_bath_stars.py <research dir> tutorials/<id>.json
  (the research dir holds data182_AL01-centre.json from 2_centrelines.py)
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (circle_through, crossings, dirdeg, el, ensure_point,  # noqa: E402
                          line_bisect, line_par, line_perp, line_through, meet,
                          named_at, put, repeat, step, steps)

S2 = math.sqrt(2)
RB = 1 / (3 - S2)
RS = 1 - RB


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A large star will sit at O and at every point two radii away along the grid.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: the square cell. A small star will sit at each of its corners.', highlight=['c', 'h'])
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

    step('Rule the diagonal through O and the corner K, the diagonal at right angles to it, and the line halving the angle between the horizontal and the diagonal: the 22.5° line.')
    line_through('d45', 'O', 'K')
    line_perp('d135', 'O', 'd45')
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
        a, b = 90 * k, 90 * (k + 1) % 360
        line_through(f'bs{a}', f'B{a}', f'B{b}')
        line_through(f'bd{a + 45}', f'B{a + 45}', f'B{(b + 45) % 360}')

    step('The next large star along sits two units away, so its tip lies as far beyond A as this star’s tip lies before it. Put the compass on A, open it to the tip, and mark the other side. Through that mark, rule the line parallel to the large star’s side B0–B90: a side of the neighbouring star that crosses this cell.', 'compass', ['A', 'B0'])
    circle_through('ca', 'P0', 'B0')
    meet('N0', 'ca', 'h', (2 - RB, 0))
    line_par('nd', 'N0', 'bs0')

    step('Rule the horizontal through the top of the large star; it meets the right side of the cell. Draw the circle about the corner K through that point: the circle of the small star.', 'compass', ['B90', 'gx'])
    line_par('tb', 'B90', 'h')
    meet('T', 'tb', 'gx', (1, RB))
    circle_through('cs', 'K', 'T')

    step('The small star is two squares in its circle too. Mark where it meets the two sides of the cell through K and the two diagonals through K, and join every other mark. Rule each side as a full line.', 'ruler', ['cs'])
    line_perp('kd', 'K', 'd45')
    pts = {}
    for a, ln in ((0, 'gy'), (90, 'gx'), (180, 'gy'), (270, 'gx'), (45, 'd45'), (135, 'kd'), (225, 'd45'), (315, 'kd')):
        meet(f'S{a}', 'cs', ln, (1 + RS * math.cos(math.radians(a)), 1 + RS * math.sin(math.radians(a))))
    for k in range(4):
        a, b = 90 * k, 90 * (k + 1) % 360
        line_through(f'ss{a}', f'S{a}', f'S{b}')
        line_through(f'sd{a + 45}', f'S{a + 45}', f'S{(b + 45) % 360}')

    step('Copy the small star’s lines and the neighbouring star’s side to the other three corners, turning them about O.')
    repeat('cp', ['nd'] + [f'ss{a}' for a in (0, 90, 180, 270)] + [f'sd{a}' for a in (45, 135, 225, 315)], 'rot4')


def snap_network(research):
    """Wichmann's band centre lines (from 2_centrelines.py), each corner moved
    onto the crossing of the construction's lines it lies on."""
    d = json.load(open(os.path.join(research, 'data182_AL01-centre.json')))
    lines = [n for n, (k, _) in el.items() if k == 'line']
    def snap(p):
        best = None
        for i, a in enumerate(lines):
            (q, u) = el[a][1]
            if abs((p[0] - q[0]) * u[1] - (p[1] - q[1]) * u[0]) > 0.01:
                continue
            for b in lines[i + 1:]:
                for c in crossings(a, b):
                    dd = math.dist(c, p)
                    if dd < 0.01 and (best is None or dd < best[0]):
                        best = (dd, c)
        return best[1] if best else None
    segs = set()
    for Q in d['pieces']:
        for i in range(len(Q)):
            for a, b in clip([(Q[i], Q[(i + 1) % len(Q)])]):
                sa, sb = snap(a), snap(b)
                assert sa and sb, ('corner off the construction', a, b)
                if math.dist(sa, sb) > 1e-6:
                    segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


def clip(segs, h=1.0):
    out = []
    for p, q in segs:
        t0, t1 = 0.0, 1.0
        dx, dy = q[0] - p[0], q[1] - p[1]
        for dv, pv in ((dx, p[0]), (dy, p[1])):
            for sg in (1, -1):
                a_, b_ = sg * dv, h - sg * pv
                if abs(a_) < 1e-12:
                    if b_ < -1e-12:
                        t1 = -1
                    continue
                t = b_ / a_
                if a_ > 0:
                    t1 = min(t1, t)
                else:
                    t0 = max(t0, t)
        if t1 - t0 > 1e-6:
            out.append(((p[0] + t0 * dx, p[1] + t0 * dy), (p[0] + t1 * dx, p[1] + t1 * dy)))
    return out


def main():
    research, out = sys.argv[1], sys.argv[2]
    build()
    segs = snap_network(research)
    step('Mark the corners of the pattern: every point where a band turns, crosses another or ends.', 'fade')
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
        'format': 0, 'id': 'alhambra-bath-stars', 'title': 'Interlaced stars of the Comares bath (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'intermediate',
        'credits': [
            {'source': 'Tiling Search, data182/AL01: Alhambra, Baño Real (Comares bath)', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data182/AL01.html',
             'note': 'The design was read from his line drawing; the construction (each band a side of one of two eight-pointed stars, their sizes found by two crossings) is ours.'},
            {'source': 'Photograph MOR 0711 (carved wooden panel)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The same design on a real panel, used to check the wall.'}],
        'given': {'O': 'The centre of a large star.', 'A': 'Halfway from O to the next large star.'},
        'steps': steps,
        'ink': {'text': 'Ink the bands: each runs along a side of a large or a small star, crossing the others, and turns where it meets the next star.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: large stars on the grid, small stars at the corners, and the bands interlaced between them.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

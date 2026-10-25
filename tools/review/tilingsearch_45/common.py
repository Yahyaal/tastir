"""Shared helpers for the Tiling Search 45° tutorials: the construction
helpers of gen_design_e, a circle touching a line, the band centre lines of a
Wichmann PDF in the tutorial's frame, and ink written `along` the
construction's lines.

Frame: O at a centre of four-fold turning, A halfway to the next such centre,
so the square cell has its corners at (±1, ±1) and area 4.
"""
import json
import math
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402,F401
from gen_design_e import (crossings, el, put, P, step, steps)  # noqa: E402,F401


def circle_tangent(name, c, line):
    """Circle with centre c touching a line."""
    (q, d) = el[line][1]
    cc = P(c)
    r = abs((cc[0] - q[0]) * d[1] - (cc[1] - q[1]) * d[0])
    put(name, 'circle', (cc, r), {'circle': {'centre': c, 'tangentTo': [line]}})


def circle_radius_of(name, c, other):
    put(name, 'circle', (P(c), el[other][1][1]), {'circle': {'centre': c, 'radiusOf': other}})


def cell_square(text, text_without=None):
    """Steps 1 and 2 shared by every square-cell tutorial here: the
    horizontal, the circle, the vertical, the cell K1..K4 and line OK1."""
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.line_through('h', 'O', 'A')
    step(text, 'ruler', ['c', 'h'])
    if text_without:
        steps[-1]['textWithoutHelpers'] = text_without
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.meet('B', 'c', 'h', (-1, 0))
    g.meet('D', 'c', 'v', (0, -1))
    g.line_perp('gx', 'A', 'h')
    g.line_perp('gxw', 'B', 'h')
    g.line_perp('gy', 'C', 'v')
    g.line_perp('gys', 'D', 'v')
    g.meet('K1', 'gx', 'gy', (1, 1))
    g.meet('K2', 'gxw', 'gy', (-1, 1))
    g.meet('K3', 'gxw', 'gys', (-1, -1))
    g.meet('K4', 'gx', 'gys', (1, -1))
    g.line_through('d45', 'O', 'K1')


# ---- reading the drawing ------------------------------------------------------

def frame_pieces(pieces_json, origin, period, band):
    """Wichmann's pieces moved out by half a band (their centre lines), in the
    frame: origin (PDF points) at O, period/2 points to OA, y up."""
    ps = json.load(open(pieces_json))
    unit = period / 2

    def offset(Q, hh):
        A = 0.5 * sum(Q[i - 1][0] * Q[i][1] - Q[i][0] * Q[i - 1][1] for i in range(len(Q)))
        sg = 1 if A > 0 else -1
        ls = []
        for i in range(len(Q)):
            a, b = Q[i], Q[(i + 1) % len(Q)]
            L = math.dist(a, b)
            u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L)
            nv = (sg * u[1], -sg * u[0])
            ls.append(((a[0] + hh * nv[0], a[1] + hh * nv[1]), u))
        out = []
        for i in range(len(ls)):
            (p1, u1), (p2, u2) = ls[i - 1], ls[i]
            det = u1[0] * (-u2[1]) - u1[1] * (-u2[0])
            if abs(det) < 1e-9:
                continue
            t = ((p2[0] - p1[0]) * (-u2[1]) - (p2[1] - p1[1]) * (-u2[0])) / det
            out.append((p1[0] + t * u1[0], p1[1] + t * u1[1]))
        return out
    res = []
    for p in ps:
        Q = offset(p['poly'], band / 2) if band else p['poly']
        res.append([((x - origin[0]) / unit, -(y - origin[1]) / unit) for x, y in Q])
    return res


def clip(segs, hcell=1.0, vcell=None):
    """The parts of segs inside the cell |x| <= hcell, |y| <= vcell (vcell
    defaults to hcell: the square cell)."""
    vcell = hcell if vcell is None else vcell
    out = []
    for p, q in segs:
        t0, t1 = 0.0, 1.0
        dx, dy = q[0] - p[0], q[1] - p[1]
        for dv, pv, hc in ((dx, p[0], hcell), (dy, p[1], vcell)):
            for sg in (1, -1):
                a_, b_ = sg * dv, hc - sg * pv
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


def lines():
    return [n for n, (k, _) in el.items() if k == 'line']


def on_line(p, n, tol=1e-7):
    (q, u) = el[n][1]
    return abs((p[0] - q[0]) * u[1] - (p[1] - q[1]) * u[0]) < tol


def snap(p, tol=0.006):
    """The crossing of two construction lines nearest p (within tol)."""
    best = None
    ls = [n for n in lines() if on_line(p, n, tol)]
    for i, a in enumerate(ls):
        for b in ls[i + 1:]:
            for c in crossings(a, b):
                dd = math.dist(c, p)
                if dd < tol and (best is None or dd < best[0]):
                    best = (dd, c)
    return best[1] if best else None


def network(polys, vcell=None, hcell=1.0, reach=3):
    """Every edge of the drawing inside the cell, its ends snapped onto the
    construction. Fails loudly on a corner the construction does not make."""
    segs = set()
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > reach:
            continue
        for i in range(len(Q)):
            for a, b in clip([(Q[i], Q[(i + 1) % len(Q)])], hcell, vcell):
                sa, sb = snap(a), snap(b)
                assert sa and sb, ('corner off the construction', a, b, sa, sb)
                if math.dist(sa, sb) > 1e-6:
                    segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


def along_ink(segs):
    """Merges the edges into runs along one construction line each and writes
    them as `along` ink paths whose ends are lines crossing there."""
    order = {n: i for i, n in enumerate(el)}
    runs = {}
    for a, b in segs:
        ls = [n for n in lines() if on_line(a, n) and on_line(b, n)]
        assert ls, ('edge on no line', a, b)
        n = min(ls, key=order.get)
        (q, u) = el[n][1]
        ta = (a[0] - q[0]) * u[0] + (a[1] - q[1]) * u[1]
        tb = (b[0] - q[0]) * u[0] + (b[1] - q[1]) * u[1]
        runs.setdefault(n, []).append(tuple(sorted((ta, tb))))
    paths = []
    for n in sorted(runs, key=order.get):
        iv = sorted(runs[n])
        merged = [list(iv[0])]
        for s0, s1 in iv[1:]:
            if s0 <= merged[-1][1] + 1e-7:
                merged[-1][1] = max(merged[-1][1], s1)
            else:
                merged.append([s0, s1])
        (q, u) = el[n][1]
        for s0, s1 in merged:
            ends = []
            for s in (s0, s1):
                p = (q[0] + s * u[0], q[1] + s * u[1])
                cands = [m for m in lines() if m != n and on_line(p, m)
                         and abs(el[m][1][1][0] * u[1] - el[m][1][1][1] * u[0]) > 1e-6]
                assert cands, ('run end on no crossing line', n, p)
                ends.append(min(cands, key=order.get))
            paths.append({'along': n, 'from': ends[0], 'to': ends[1]})
    return paths


def write(tut, out):
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), '..', 'format_tutorial.py'), out], check=True)


def finish(dump_json, tut_json, names):
    """Writes the expect block from the engine's dump. `names` maps
    (vertices, area rounded to 3 places) to (piece name, palette slot)."""
    d = json.load(open(dump_json))
    t = json.load(open(tut_json))
    pieces, colors = [], {}
    for ty in d['types']:
        nm, c = names[(ty['vertices'], round(ty['area'], 3))]
        colors[nm] = c
        pieces.append({'name': nm, 'vertices': ty['vertices'], 'area': round(ty['area'], 5), 'perCell': ty['perCell']})
    t['expect'] = {'pieceTypes': len(pieces), 'pieces': pieces}
    t['pattern']['colors'] = colors
    write(t, tut_json)
    print(pieces)


def run(main, names):
    """`gen_x.py <pieces.json> <tutorial.json>` builds; `gen_x.py finish <dump.json> <tutorial.json>` finishes."""
    if sys.argv[1] == 'finish':
        finish(sys.argv[2], sys.argv[3], names)
    else:
        main()

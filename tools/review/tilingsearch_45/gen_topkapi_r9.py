#!/usr/bin/env python3
"""Builds the Topkapı scroll pinwheel (Tiling Search data19/R9, the scroll's
page 318, figure 61): eight-pointed stars of two squares, each ringed by four
pentagons in alternate notches and four bent eight-sided "boots" in the
others, turning one way (p4, no mirror).

Reading. Wichmann draws every tile with a raised border; joining each tile
to its border pieces gives an edge-to-edge tiling whose every edge is 1 or √2
(60 pt). Snapped to the grid a + b·√2/2 every corner fits to 0.0013 of an
edge. The stars sit on the lattice (3 + 2√2, 1), (−1, 3 + 2√2) in edges.

Construction (OA = 1, A a point of the star at O, s = √2/2). The drawing's
lines near the star make a set with full mirror symmetry (the star's two
squares x, y = ±s and x ± y = ±1 carried on, the diamonds x ± y = ±(√2 ± 1),
and x or y = 1 + s, 3s − 1, 1 − s and x ± y = 4s − 1 from the next stars);
only the ink turns one way. Inside the tile through the four-fold centres
(1, √2), (−√2, 1), ... every edge lies on just twelve of them: the star's
eight lines and the small diamond x ± y = ±(√2 − 1), whose corners Z are where
the circles with centre A through B (radius √2) cross the lines through O.
The same circles cross the diamond's sides again at the tile's corners K.
The ink is every edge of the snapped drawing inside the tile, written as
`along` runs of these lines.

First: bevel_tiles.py <research dir> (joins each tile to its border).
Usage: gen_topkapi_r9.py <research dir with R9-tiles.json> tutorials/topkapi-scroll-pinwheel.json
"""
import json
import math
import sys

S2 = math.sqrt(2)
s = S2 / 2
E = S2 - 1          # one edge of the drawing, in OA

el = {}             # name -> (kind, geometry)
order = []


def add(name, kind, geom):
    assert name not in el, name
    el[name] = (kind, geom)
    order.append(name)


def P(n):
    return el[n][1]


def line_through(n, a, b):
    pa, pb = P(a), P(b)
    add(n, 'line', (pa, (pb[0] - pa[0], pb[1] - pa[1])))
    return {'line': {'through': [a, b]}}


def line_perp(n, p, l):
    d = el[l][1][1]
    add(n, 'line', (P(p), (-d[1], d[0])))
    return {'line': {'through': p, 'perpendicularTo': l}}


def line_par(n, p, l):
    add(n, 'line', (P(p), el[l][1][1]))
    return {'line': {'through': p, 'parallelTo': l}}


def line_bis(n, a, o, b):
    po, pa, pb = P(o), P(a), P(b)
    ua = norm((pa[0] - po[0], pa[1] - po[1])); ub = norm((pb[0] - po[0], pb[1] - po[1]))
    add(n, 'line', (po, (ua[0] + ub[0], ua[1] + ub[1])))
    return {'line': {'through': o, 'bisects': [a, o, b]}}


def circle(n, c, p):
    add(n, 'circle', (P(c), math.dist(P(c), P(p))))
    return {'circle': {'centre': c, 'through': p}}


def norm(v):
    L = math.hypot(*v)
    return (v[0] / L, v[1] / L)


def crossings(a, b):
    ka, ga = el[a]; kb, gb = el[b]
    if ka == 'circle' and kb == 'line':
        ka, ga, kb, gb = kb, gb, ka, ga
    if ka == 'line' and kb == 'line':
        (p, d), (q, e) = ga, gb
        det = d[0] * (-e[1]) - d[1] * (-e[0])
        if abs(det) < 1e-12:
            return []
        t = ((q[0] - p[0]) * (-e[1]) - (q[1] - p[1]) * (-e[0])) / det
        return [(p[0] + t * d[0], p[1] + t * d[1])]
    if ka == 'line' and kb == 'circle':
        (p, d), (c, r) = ga, gb
        u = norm(d)
        f = (p[0] - c[0], p[1] - c[1])
        b = f[0] * u[0] + f[1] * u[1]
        disc = b * b - (f[0] ** 2 + f[1] ** 2 - r * r)
        if disc < -1e-12:
            return []
        h = math.sqrt(max(disc, 0))
        return [(p[0] + (-b + k) * u[0], p[1] + (-b + k) * u[1]) for k in (h, -h)]
    raise ValueError((a, b))


def angle(p):
    return math.degrees(math.atan2(p[1], p[0])) % 360


def meet(n, a, b, want):
    """The crossing of a and b nearest `want`, picked by angle when needed."""
    cs = crossings(a, b)
    best = min(cs, key=lambda c: math.dist(c, want))
    assert math.dist(best, want) < 1e-6, (n, cs, want)
    add(n, 'point', best)
    spec = {'meet': [a, b]}
    if len(cs) > 1:
        other = [c for c in cs if c is not best][0]
        ang = round(angle(best))
        assert abs(((angle(other) - ang + 180) % 360) - 180) > 5, n
        spec['pick'] = {'angle': ang}
    return {'point': spec}


def rot(p, k):
    c, sn = round(math.cos(k * math.pi / 2)), round(math.sin(k * math.pi / 2))
    return (c * p[0] - sn * p[1], sn * p[0] + c * p[1])


def repeat(names):
    for n in names:
        kind, (p, d) = el[n]
        for k in (1, 2, 3):
            add(f'{n}@{k}', kind, (rot(p, k), rot(d, k)))
    return {'repeat': {'of': names, 'by': 'rot4'}}


def build():
    add('O', 'point', (0.0, 0.0)); add('A', 'point', (1.0, 0.0))
    st = []
    c = {'h': line_through('h', 'O', 'A'), 'c': circle('c', 'O', 'A')}
    st.append({'id': 1, 'text': 'Draw a horizontal straight line through O and A. Draw a circle with centre O through A.',
               'create': c, 'animate': 'compass'})
    c = {'v': line_perp('v', 'O', 'h'),
         'B': meet('B', 'c', 'v', (0, 1)), 'C': meet('C', 'c', 'h', (-1, 0)), 'D': meet('D', 'c', 'v', (0, -1)),
         'd1': line_bis('d1', 'A', 'O', 'B'), 'd2': line_bis('d2', 'B', 'O', 'C'),
         'E': meet('E', 'c', 'd1', (s, s)), 'F': meet('F', 'c', 'd2', (-s, s)),
         'G': meet('G', 'c', 'd1', (-s, -s)), 'H': meet('H', 'c', 'd2', (s, -s))}
    st.append({'id': 2, 'text': 'Draw a vertical line through O. It crosses the circle at B and D. The horizontal line crosses it at A and C. '
                                'Draw the line through O that halves the angle AOB. Draw the line through O that halves the angle BOC. '
                                'They cross the circle at E, F, G and H.',
               'create': c, 'highlight': ['h'], 'animate': 'ruler'})
    c = {}
    for n, a, b in [('AB', 'A', 'B'), ('BC', 'B', 'C'), ('CD', 'C', 'D'), ('DA', 'D', 'A'),
                    ('EF', 'E', 'F'), ('FG', 'F', 'G'), ('GH', 'G', 'H'), ('HE', 'H', 'E')]:
        c[n] = line_through(n, a, b)
    st.append({'id': 3, 'text': 'Draw a straight line through A and B, B and C, C and D, and D and A. '
                                'Draw a straight line through E and F, F and G, G and H, and H and E. '
                                'The two squares make the star.',
               'create': c, 'highlight': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], 'animate': 'ruler'})
    r = S2
    c = {'cA': circle('cA', 'A', 'B'), 'Z3': meet('Z3', 'cA', 'h', (1 - r, 0)),
         'cB': circle('cB', 'B', 'C'), 'Z4': meet('Z4', 'cB', 'v', (0, 1 - r)),
         'cC': circle('cC', 'C', 'D'), 'Z1': meet('Z1', 'cC', 'h', (r - 1, 0)),
         'cD': circle('cD', 'D', 'A'), 'Z2': meet('Z2', 'cD', 'v', (0, r - 1))}
    st.append({'id': 4, 'text': 'Draw a circle with centre A through B. It crosses the horizontal line at Z3, just past O. '
                                'Draw a circle with centre B through C. It crosses the vertical line at Z4, just past O. '
                                'Draw a circle with centre C through D. It crosses the horizontal line at Z1. '
                                'Draw a circle with centre D through A. It crosses the vertical line at Z2.',
               'create': c, 'highlight': ['A', 'B', 'C', 'D'], 'animate': 'compass'})
    c = {}
    for n, a, b in [('Z12', 'Z1', 'Z2'), ('Z23', 'Z2', 'Z3'), ('Z34', 'Z3', 'Z4'), ('Z41', 'Z4', 'Z1')]:
        c[n] = line_through(n, a, b)
    c['K1'] = meet('K1', 'cA', 'Z23', (1, S2))
    c['K2'] = meet('K2', 'cB', 'Z34', (-S2, 1))
    c['K3'] = meet('K3', 'cC', 'Z41', (-1, -S2))
    c['K4'] = meet('K4', 'cD', 'Z12', (S2, -1))
    st.append({'id': 5, 'text': 'Draw a straight line through Z1 and Z2, Z2 and Z3, Z3 and Z4, and Z4 and Z1. '
                                'The line through Z2 and Z3 crosses the circle with centre A again at K1. '
                                'The line through Z3 and Z4 crosses the circle with centre B again at K2. '
                                'The line through Z4 and Z1 crosses the circle with centre C again at K3. '
                                'The line through Z1 and Z2 crosses the circle with centre D again at K4.',
               'create': c, 'highlight': ['Z1', 'Z2', 'Z3', 'Z4'], 'animate': 'ruler'})
    add('tile', 'poly', [P('K1'), P('K2'), P('K3'), P('K4')])
    st.append({'id': 6, 'text': 'Join K1, K2, K3 and K4 to mark the tile that repeats.',
               'create': {'tile': {'polygon': ['K1', 'K2', 'K3', 'K4']}}, 'highlight': ['K1', 'K2', 'K3', 'K4'],
               'animate': 'fade'})
    return st


# --- the drawing --------------------------------------------------------------

def drawing_edges(research):
    """Edges of Wichmann's tiles near the star at the page centre, in OA."""
    H = S2 / 2
    ts = json.load(open(f'{research}/R9-tiles.json'))
    ox, oy, u = 297.5, 380.7, 60.0

    def sn(v):
        best = None
        for b in range(-20, 21):
            a = round(v - b * H); rr = abs(v - a - b * H)
            if best is None or rr < best[0]:
                best = (rr, a + b * H)
        return best
    edges = set()
    for t in ts:
        if math.dist(t['c'], (ox, oy)) > 330:
            continue
        Q = []
        for x, y in t['poly']:
            (rx, X), (ry, Y) = sn((x - ox) / u), sn(-(y - oy) / u)
            if max(rx, ry) > 0.01:
                break
            Q.append((round(X * E, 9), round(Y * E, 9)))
        else:
            for i in range(len(Q)):
                edges.add(tuple(sorted((Q[i], Q[(i + 1) % len(Q)]))))
    return edges


def clip(seg, poly):
    """The part of a segment inside a convex polygon (counter-clockwise)."""
    (a, b) = seg
    t0, t1 = 0.0, 1.0
    d = (b[0] - a[0], b[1] - a[1])
    for i in range(len(poly)):
        p, q = poly[i], poly[(i + 1) % len(poly)]
        n = (-(q[1] - p[1]), q[0] - p[0])          # inward normal
        num = (a[0] - p[0]) * n[0] + (a[1] - p[1]) * n[1]
        den = d[0] * n[0] + d[1] * n[1]
        if abs(den) < 1e-12:
            if num < -1e-9:
                return None
            continue
        t = -num / den
        if den > 0:
            t0 = max(t0, t)
        else:
            t1 = min(t1, t)
    if t1 - t0 < 1e-7:
        return None
    return ((a[0] + t0 * d[0], a[1] + t0 * d[1]), (a[0] + t1 * d[0], a[1] + t1 * d[1]))


def on_line(p, n):
    q, d = el[n][1]
    u = norm(d)
    return abs((p[0] - q[0]) * u[1] - (p[1] - q[1]) * u[0]) < 1e-7


def ink():
    poly = el['tile'][1]
    lines = [n for n in order if el[n][0] == 'line']
    segs = []
    for e in drawing_edges(sys.argv[1]):
        cseg = clip(e, poly)
        if cseg:
            segs.append(cseg)
    # group by carrying line, merge touching runs
    runs = {}
    for a, b in segs:
        ln = [n for n in lines if on_line(a, n) and on_line(b, n)]
        assert ln, ('edge on no construction line', a, b)
        runs.setdefault(ln[0], []).append((a, b))
    paths = []
    for n, ss in runs.items():
        q, d = el[n][1]; u = norm(d)
        par = lambda p: (p[0] - q[0]) * u[0] + (p[1] - q[1]) * u[1]
        iv = sorted(tuple(sorted((par(a), par(b)))) for a, b in ss)
        merged = []
        for lo, hi in iv:
            if merged and lo <= merged[-1][1] + 1e-7:
                merged[-1][1] = max(merged[-1][1], hi)
            else:
                merged.append([lo, hi])
        for lo, hi in merged:
            ends = []
            for t in (lo, hi):
                p = (q[0] + t * u[0], q[1] + t * u[1])
                ends.append(end_ref(n, p, lines))
            paths.append({'along': n, 'from': ends[0], 'to': ends[1]})
    return paths


def end_ref(n, p, lines):
    for m in order:
        if el[m][0] == 'point' and math.dist(el[m][1], p) < 1e-7:
            return m
    for m in lines:
        if m != n and on_line(p, m) and crossings(n, m):
            return m
    # on the tile's side: name the crossing by its direction from O
    poly = el['tile'][1]
    cands = []
    for i in range(4):
        a, b = poly[i], poly[(i + 1) % 4]
        q, d = el[n][1]
        e = (b[0] - a[0], b[1] - a[1])
        det = d[0] * (-e[1]) - d[1] * (-e[0])
        if abs(det) < 1e-12:
            continue
        t = ((a[0] - q[0]) * (-e[1]) - (a[1] - q[1]) * (-e[0])) / det
        x = (q[0] + t * d[0], q[1] + t * d[1])
        w = ((x[0] - a[0]) * e[0] + (x[1] - a[1]) * e[1]) / (e[0] ** 2 + e[1] ** 2)
        if -1e-9 <= w <= 1 + 1e-9:
            cands.append(x)
    assert any(math.dist(c, p) < 1e-7 for c in cands), ('end off the tile', n, p)
    ang = round(angle(p), 1)
    others = [c for c in cands if math.dist(c, p) > 1e-7]
    assert all(abs(((angle(c) - ang + 180) % 360) - 180) > 3 for c in others), (n, p)
    return {'cross': 'tile', 'pick': {'angle': ang}}


def main():
    steps = build()
    paths = ink()
    tut = {
        'format': 0, 'id': 'topkapi-scroll-pinwheel',
        'title': 'Pinwheel of stars from the Topkapı scroll',
        'short': 'Topkapı scroll pinwheel', 'subtitle': 'Topkapı scroll, Istanbul',
        'fold': 4, 'star': 8, 'chiral': True, 'style': 'Timurid / Persian', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s R9 drawing of the scroll’s figure, its corners snapped to exact values. '
                    'We devised the construction; the drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. '
                       'The comparison with the drawing checks the finished lines, not how the scroll’s designer laid them out.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data19/R9: Topkapı scroll, page 318, figure 61', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data19/R9.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of the figure in Gülru Necipoğlu’s The Topkapı Scroll (1995); the construction is ours.'}],
        'given': {'O': 'The centre of a star.', 'A': 'A point of that star.'},
        'steps': steps,
        'ink': {'text': 'Ink the lines picked out in orange. They run along the sides of the star at O. '
                        'Some of them carry on to the side of the tile. '
                        'Four short lines run in from K1, K2, K3 and K4.',
                'paths': paths},
        'pattern': {
            'cell': 'tile',
            'text': 'Put copies of the tilted tile side by side. Each star has a pentagon in every other notch. '
                    'A bent boot fills each of the other notches. Four boots turn round each corner of the tile.',
            'palette': 'Timurid tile',
            'colors': {'star': 'a', 'boot': 'ground', 'pentagon': 'b'},
        },
        'expect': {
            'note': 'Star 8 − 4√2, boot 2 − √2, pentagon 2√2 − 2.5, cell 6.',
            'pieceTypes': 3,
            'pieces': [{'name': 'star', 'vertices': 16, 'area': 2.34315, 'perCell': 1},
                       {'name': 'boot', 'vertices': 8, 'area': 0.58579, 'perCell': 4},
                       {'name': 'pentagon', 'vertices': 5, 'area': 0.32843, 'perCell': 4}],
            'cellArea': 6,
        },
    }
    json.dump(tut, open(sys.argv[2], 'w'), ensure_ascii=False, indent=2)
    print(len(steps), 'steps,', len(order), 'elements,', len(paths), 'ink runs')


if __name__ == '__main__':
    main()

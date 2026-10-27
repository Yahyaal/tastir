"""Ten-direction helpers for the ten-fold batch T1 (F207, BON15, SIVAS4,
S31A, 27 October 2026), usable by the later ten-fold batches.

Ten-fold drawings repeat on rectangles (pmm, cmm, pm), so the tutorial has
fold 2 (or 1), O at the centre of a ten-pointed star or decagon and the
cell a rectangle |x| <= W, |y| <= H about O. Their edges run at multiples of
18°, and a line is a key (k, o): direction k·18° (k = 0..9), offset o = n·p
with n = (−sin, cos) of the direction.

- `frame(pieces, origin, unit, turn)`: Wichmann's pieces in the tutorial's
  frame (O at origin, OA = unit PDF points, turned by `turn` degrees, y up).
- `fit5(v)`: v as (a + b√5)/c with small whole numbers, and the error.
- `need(polys, W, H)`, `missing(nd)`: the lines the drawing needs inside
  the cell, and those the construction lacks.
- `opening()`: steps 1–5 of `ten-pointed-star-decagon-rect` (the circle at O
  through A divided into ten at A, B, C, D, E, F, G, H, J, K, with A at 0°),
  plus Q, the second point where the circle with centre M crosses the
  horizontal line (OQ = φ, OR = 1/φ, so RQ = √5).
- `finder(nd, reach)`: for each missing line, the crossings of earlier lines
  it runs through (the main tool for finding the next step).
- `run(build, spec, names, drawing)`: like `medium.run`, for a rectangular
  cell with corners N1..N4 and fold 2 (or spec['fold']).
"""
import json
import math
import sys

import common as cm
from common import g, put, step

S5 = math.sqrt(5)
PHI = (1 + S5) / 2
DEG = 18.0


def frame(pieces_json, origin, unit, turn=0.0):
    ps = json.load(open(pieces_json))
    c, s = math.cos(math.radians(turn)), math.sin(math.radians(turn))
    out = []
    for p in ps:
        Q = []
        for x, y in p['poly']:
            X, Y = (x - origin[0]) / unit, -(y - origin[1]) / unit
            Q.append((X * c - Y * s, X * s + Y * c))
        out.append(Q)
    return out


def fit5(v, cs=(1, 2, 4, 5, 8, 10, 20), bmax=12):
    best = None
    for c in cs:
        for b in range(-bmax, bmax + 1):
            a = round(v * c - b * S5)
            e = abs((a + b * S5) / c - v)
            sc = e + 2e-5 * (abs(a) + abs(b) + c)
            if best is None or sc < best[0]:
                best = (sc, a, b, c, e)
    return best[1:]


def key_of(p, d):
    ang = math.degrees(math.atan2(d[1], d[0])) % 180
    k = round(ang / DEG) % 10
    t = math.radians(k * DEG)
    return k, p[0] * -math.sin(t) + p[1] * math.cos(t)


def same(a, b, tol=2e-3):
    return a[0] == b[0] and abs(a[1] - b[1]) < tol


def need(polys, W, H, minlen=0.01):
    out = []
    reach = 3 * max(W, H)
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > reach:
            continue
        for i in range(len(Q)):
            for a, b in cm.clip([(Q[i], Q[(i + 1) % len(Q)])], W, H):
                if math.dist(a, b) < minlen:
                    continue
                kk = key_of(a, (b[0] - a[0], b[1] - a[1]))
                for e in out:
                    if same(e[0], kk):
                        e[1] += math.dist(a, b)
                        break
                else:
                    out.append([kk, math.dist(a, b)])
    return out


def have(key, tol=2e-3):
    for nm in cm.lines():
        (q, u) = cm.el[nm][1]
        if same(key_of(q, u), key, tol):
            return nm
    return None


def missing(nd):
    return [(k, l) for k, l in nd if not have(k)]


def finder(nd, W, H, circles=True, tol=1e-6, show=6):
    """Prints each missing line with the crossings it runs through."""
    names = [n for n, (kind, _) in cm.el.items() if kind == 'line' or (circles and kind == 'circle')]
    xs = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            ka, kb = cm.el[a][0], cm.el[b][0]
            if ka == 'circle' and kb == 'circle':
                (c1, r1), (c2, r2) = cm.el[a][1], cm.el[b][1]
                dd = math.dist(c1, c2)
                if dd < 1e-9 or dd > r1 + r2 + 1e-9 or dd < abs(r1 - r2) - 1e-9:
                    continue
            try:
                for p in cm.crossings(a, b):
                    if abs(p[0]) <= W * 1.3 and abs(p[1]) <= H * 1.3:
                        xs.append((a, b, p))
            except (ZeroDivisionError, ValueError):
                pass
    for (k, o), ln in missing(nd):
        t = math.radians(k * DEG)
        nv = (-math.sin(t), math.cos(t))
        hits = [(a, b, p) for a, b, p in xs if abs(p[0] * nv[0] + p[1] * nv[1] - o) < tol]
        pts = []
        for a, b, p in hits:
            if not any(math.dist(p, q) < 1e-6 for q, _ in pts):
                pts.append((p, (a, b)))
        print('missing %5.1f° off %.4f %s len %.2f: %d crossings' % (k * DEG, o, fit5(o)[:3], ln, len(pts)),
              [((round(p[0], 3), round(p[1], 3)), ab) for p, ab in pts[:show]])


def _crossings(W, H, circles=False):
    names = [n for n, (kind, _) in cm.el.items() if kind == 'line' or (circles and kind == 'circle')]
    xs = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            if cm.el[a][0] == 'circle' and cm.el[b][0] == 'circle':
                continue
            try:
                for p in cm.crossings(a, b):
                    if abs(p[0]) <= W + 1e-9 and abs(p[1]) <= H + 1e-9:
                        xs.append((a, b, p))
            except (ZeroDivisionError, ValueError):
                pass
    return xs


def greedy(nd, W, H, refs, mirror='h', tol=1e-6, prefix='g', pletter='P', start=1, verbose=True, maxn=60):
    """Draws each missing line as a parallel to refs[k] (a line at k·18°)
    through a crossing of earlier lines inside the cell, with its mirror
    image in `mirror` (None for none). Prefers crossings of lines made
    early (no copies) and near O. Returns the plan as a list of
    (point, a, b, where, k, line name)."""
    out = []
    n = start
    while len(out) < maxn:
        xs = _crossings(W, H)
        best = None
        for (k, o), ln in missing(nd):
            t = math.radians(k * DEG)
            nv = (-math.sin(t), math.cos(t))
            for a, b, p in xs:
                err = abs(p[0] * nv[0] + p[1] * nv[1] - o)
                if err > tol:
                    continue
                s = 3 * (('@' in a) + ('@' in b)) + 0.05 * math.hypot(*p) + (a.startswith(prefix) + b.startswith(prefix))
                if best is None or s < best[0]:
                    best = (s, k, a, b, p)
        if best is None:
            break
        _, k, a, b, p = best
        pname = g.named_at(p)
        if not pname:
            pname = '%s%d' % (pletter, n)
            while pname in cm.el:
                n += 1
                pname = '%s%d' % (pletter, n)
            n += 1
            g.meet(pname, a, b, p)
        lname = '%s%d' % (prefix, len(out) + 1)
        g.line_par(lname, pname, refs[k])
        if mirror:
            (q, u) = cm.el[lname][1]
            (mq, mu) = cm.el[mirror][1]

            def refl(x):
                f = (x[0] - mq[0]) * mu[0] + (x[1] - mq[1]) * mu[1]
                return (2 * (mq[0] + f * mu[0]) - x[0], 2 * (mq[1] + f * mu[1]) - x[1])
            q2, r2 = refl(q), refl((q[0] + u[0], q[1] + u[1]))
            if not have(key_of(q2, (r2[0] - q2[0], r2[1] - q2[1])), 1e-7):
                g.repeat(lname + 'm', [lname], 'mirror:' + mirror)
        out.append((pname, a, b, (round(p[0], 6), round(p[1], 6)), k, lname))
        if verbose:
            print('add %5.1f° through %s = %s x %s at (%.4f, %.4f)' % (k * DEG, pname, a, b, p[0], p[1]))
    if verbose:
        print('still missing:', [(k * DEG, round(o, 4)) for (k, o), _ in missing(nd)])
    return out


# ---- the opening ------------------------------------------------------------------

def opening(first=None):
    """Steps 1–5 of the ten-pointed star tutorial: the decagon points A..K
    (A at 0°, counter-clockwise, no I), with Q at −φ on the horizontal."""
    g.given()
    step(first or 'Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.line_through('h', 'O', 'A')
    g.meet('F', 'c', 'h', (-1, 0))
    step('Draw a vertical line through O. It crosses the circle at N and S.', 'ruler', ['c', 'h'])
    g.line_perp('v', 'O', 'h')
    g.meet('N', 'c', 'v', (0, 1))
    g.meet('S', 'c', 'v', (0, -1))
    step('Draw a circle with centre F through O. F is where the horizontal line crosses the circle on the left. '
         'The new circle crosses the first circle at Y1 and Y2. '
         'Draw a straight line through Y1 and Y2. It crosses the horizontal line at M, halfway from O to F.',
         'compass', ['F'])
    g.circle_through('cW', 'F', 'O')
    g.meet('Y1', 'c', 'cW', (-.5, math.sqrt(3) / 2))
    g.meet('Y2', 'c', 'cW', (-.5, -math.sqrt(3) / 2))
    g.line_through('m', 'Y1', 'Y2')
    g.meet('M', 'm', 'h', (-.5, 0))
    step('Draw a circle with centre M through N. It crosses the horizontal line at R and Q. '
         'The distance OR is a tenth of the way round the circle.', 'compass', ['M'])
    g.circle_through('cM', 'M', 'N')
    g.meet('R', 'cM', 'h', (1 / PHI, 0))
    g.meet('Q', 'cM', 'h', (-PHI, 0))
    step('Draw a circle with centre A whose radius is the distance from O to R. It crosses the circle at B and K. '
         'Draw circles of the same size round the circle, each centred where the last one crosses it. '
         'They mark C, D, E, G, H and J. The circle is now cut into ten.', 'compass', ['R'])
    names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']

    def at(i):
        t = math.radians(36 * i)
        return (math.cos(t), math.sin(t))
    g.circle_from('cF0', 'A', 'O', 'R')
    g.meet('B', 'c', 'cF0', at(1))
    g.meet('K', 'c', 'cF0', at(9))
    for i, (cn, nn) in enumerate([('B', 'C'), ('C', 'D'), ('D', 'E')]):
        g.circle_from(f'cF{i + 1}', cn, 'O', 'R')
        g.meet(nn, 'c', f'cF{i + 1}', at(i + 2))
    for i, (cn, nn) in enumerate([('K', 'J'), ('J', 'H'), ('H', 'G')]):
        g.circle_from(f'cF{9 - i}', cn, 'O', 'R')
        g.meet(nn, 'c', f'cF{9 - i}', at(8 - i))
    return names


# ---- writing ---------------------------------------------------------------------

def run(build, spec, names, drawing):
    if sys.argv[1] == 'finish':
        cm.finish(sys.argv[2], sys.argv[3], names)
        tut = json.load(open(sys.argv[3]))
        for piece in tut['expect']['pieces']:
            if piece['name'] in spec.get('small', ()):
                piece['small'] = True
        cm.write(tut, sys.argv[3])
        return
    pieces, out = sys.argv[1:3]
    build()
    W, H = spec['cell']
    polys = drawing(pieces)
    paths = cm.along_ink(cm.network(polys, hcell=W, vcell=H, reach=3 * max(W, H)))
    if not spec.get('tile_made'):
        step('Join N1, N2, N3 and N4 to mark the tile that repeats.', 'fade')
        put('tile', 'polygon', None, {'polygon': ['N1', 'N2', 'N3', 'N4']})
    tut = {'format': 0, **{key: spec[key] for key in ['id', 'title', 'short', 'subtitle']}}
    tut.update({
        'fold': spec.get('fold', 2), 'star': spec.get('star', 10),
        'style': spec.get('style', 'Persian'), 'level': spec.get('level', 'advanced'),
        'given': spec['given'],
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': spec['note'] + ' The drawing gives no steps; we devised the construction.',
            'changes': 'The compass steps, their order and the named points are ours. ' + spec['changes'],
            'reviewed': '2026-10-27'},
        'credits': [{
            'source': f"Tiling Search, {spec['folder']}/{spec['code']}: {spec['subtitle']}",
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': f"https://tilingsearch.mit.edu/HTML/{spec['folder']}/{spec['code']}.html",
            'note': 'Read from his finished drawing, not construction instructions. ' + spec['references']}],
        'steps': cm.steps,
        'ink': {'text': spec.get('ink', 'Ink the lines picked out in orange.'), 'paths': paths},
        'pattern': {'cell': 'tile', 'palette': spec.get('palette', 'Timurid tile'),
                    'look': spec.get('look', 'tiles'), 'colors': {},
                    'text': spec.get('repeat', 'Put copies of the rectangular tile side by side.')},
        'expect': spec.get('expect', {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]})})
    if spec.get('woven') is False:
        tut['pattern']['woven'] = False
    if spec.get('chiral'):
        tut['chiral'] = True
    if spec.get('star', 10) is None:
        tut.pop('star')
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')

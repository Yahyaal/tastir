"""Ten-direction helpers for the ten-fold batch T2 (F66B, SM28, SM6, 27 October
2026): the lines of a drawing whose edges run at multiples of 18°, an opening
that divides the circle at O into ten (the classic golden-section
construction of `ten-pointed-star-decagon-rect`), and a greedy plan that draws
every missing line as a parallel to a line of the opening, through a crossing
of earlier lines, with its copies under the pattern's symmetry about O (a
half turn and the mirror in the horizontal line: pmm or cmm with O on both
mirrors).

A line is a key (k, o): its normal at k·18° (k = 0..9), offset o = n·p.
The frame: O at a star centre, OA = 1, y up; the cell is |x| <= HX, |y| <= HY.
"""
import math
import os

import common as cm
from common import g, put, step

R5 = math.sqrt(5)


# ---- keys -------------------------------------------------------------------

def key_of(p, d):
    ang = (math.degrees(math.atan2(d[1], d[0])) + 90) % 360
    k = round(ang / 18) % 20
    t = math.radians(k * 18)
    o = math.cos(t) * p[0] + math.sin(t) * p[1]
    if k >= 10:
        return k - 10, -o
    return k, o


def same(a, b, tol=2e-3):
    return a[0] == b[0] and abs(a[1] - b[1]) < tol


def norm(k, o):
    k %= 20
    return (k - 10, -o) if k >= 10 else (k, o)


def orbit(key):
    """The key's copies under the half turn and the mirror in the horizontal."""
    k, o = key
    out = []
    for kk in (norm(k, o), norm(k, -o), norm(-k, o), norm(-k, -o)):
        if not any(same(kk, x, 1e-9) for x in out):
            out.append(kk)
    return out


# ---- the drawing --------------------------------------------------------------

def need(polys, HX, HY, minlen=0.01):
    """[key, length] of the drawing's edges inside the cell."""
    out = []
    for Q in polys:
        if max(abs(q[0]) for q in Q) > 3 * HX or max(abs(q[1]) for q in Q) > 3 * HY:
            continue
        for i in range(len(Q)):
            for a, b in cm.clip([(Q[i], Q[(i + 1) % len(Q)])], HX, HY):
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


HAVE_TOL = [2e-3]


def have(key, tol=None):
    tol = HAVE_TOL[0] if tol is None else tol
    for nm in cm.lines():
        (q, u) = cm.el[nm][1]
        if same(key_of(q, u), key, tol):
            return nm
    return None


def missing(nd):
    return [k for k, _ in nd if not have(k)]


# ---- the opening ----------------------------------------------------------------

REF = {}         # normal index k -> a line of the opening at that direction
DESC = {}        # line name -> words, for the plan's sentences
LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']


def opening():
    """Steps 1–5: the circle at O through A divided into ten at A, B, C, D,
    E, F, G, H, J and K (A at 0°, B at 36°, …), as in
    ten-pointed-star-decagon-rect."""
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A. '
         'It crosses the horizontal line again at F.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.line_through('h', 'O', 'A')
    g.meet('F', 'c', 'h', (-1, 0))
    step('Draw a vertical line through O. It crosses the circle at N.', 'ruler', ['c', 'h'])
    g.line_perp('v', 'O', 'h')
    g.meet('N', 'c', 'v', (0, 1))
    step('Draw a circle with centre F through O. It crosses the first circle at Y1 and Y2. '
         'Draw a straight line through Y1 and Y2. It crosses the horizontal line at M, halfway from O to F.',
         'compass', ['F'])
    g.circle_through('cW', 'F', 'O')
    s3 = math.sqrt(3) / 2
    g.meet('Y1', 'c', 'cW', (-.5, s3))
    g.meet('Y2', 'c', 'cW', (-.5, -s3))
    g.line_through('m', 'Y1', 'Y2')
    g.meet('M', 'm', 'h', (-.5, 0))
    step('Draw a circle with centre M through N. It crosses the horizontal line at R.', 'compass', ['M'])
    g.circle_through('cM', 'M', 'N')
    g.meet('R', 'cM', 'h', ((R5 - 1) / 2, 0))
    step('Draw a circle with centre A and opening from O to R. It crosses the circle at B and K. '
         'Draw circles of the same size round the circle, each centred where the last one crosses it. '
         'They mark C, D, E, G, H and J. The circle is now cut into ten.', 'compass', ['R'])
    pt = lambda i: (math.cos(math.radians(36 * i)), math.sin(math.radians(36 * i)))
    g.circle_from('cF0', 'A', 'O', 'R')
    g.meet('B', 'c', 'cF0', pt(1))
    g.meet('K', 'c', 'cF0', pt(9))
    for i, (cen, nm) in enumerate([('B', 'C'), ('C', 'D'), ('D', 'E')]):
        g.circle_from(f'cF{i + 1}', cen, 'O', 'R')
        g.meet(nm, 'c', f'cF{i + 1}', pt(i + 2))
    for i, (cen, nm) in enumerate([('K', 'J'), ('J', 'H'), ('H', 'G')]):
        g.circle_from(f'cF{9 - i}', cen, 'O', 'R')
        g.meet(nm, 'c', f'cF{9 - i}', pt(8 - i))
    DESC['h'] = 'the horizontal line through O'
    DESC['v'] = 'the vertical line through O'
    REF[0] = 'v'
    REF[5] = 'h'


def radial(names):
    """Straight lines through O and the given decagon points (their copies
    through the opposite points are the same lines)."""
    ws = [f'O and {n}' for n in names]
    step('Draw a straight line through ' + (', '.join(ws[:-1]) + ', and ' + ws[-1] if len(ws) > 1 else ws[0]) + '.')
    for nm in names:
        i = LETTERS.index(nm)
        ln = f'o{nm}'
        g.line_through(ln, 'O', nm)
        k = (2 * i + 5) % 10
        REF.setdefault(k, ln)
        DESC[ln] = f'line O{nm}'


def star_lines(text=None):
    """The ten lines at 90° to OA, OB, … through A, B, …: two pentagons
    making a ten-pointed star with tips at A's direction."""
    step(text or 'Draw a line through A at 90° to the horizontal line. Turn it round O by 36°, nine times. '
         'These ten lines touch the circle at A, B, C and on round, and make the ten-pointed star.', 'ruler')
    g.line_perp('t', 'A', 'h')
    g.repeat('tr', ['t'], 'rot10')
    for j in range(10):
        nm = 't' if j == 0 else f't@{j}'
        DESC[nm] = f'the star line through {LETTERS[j]}'
        REF.setdefault((2 * j) % 10, nm)


# ---- symmetric copies ---------------------------------------------------------------

def _same_line(a, b, eps=1e-7):
    (p, d), (q, e) = a, b
    if abs(d[0] * e[1] - d[1] * e[0]) > eps:
        return False
    return abs((q[0] - p[0]) * d[1] - (q[1] - p[1]) * d[0]) < eps


def _exists(geom):
    return any(_same_line(cm.el[n][1], geom) for n in cm.lines())


def _rot2(geom):
    (p, d) = geom
    return ((-p[0], -p[1]), (-d[0], -d[1]))


def _mir(geom):
    (p, d) = geom
    return ((p[0], -p[1]), (d[0], -d[1]))


def copies(name, items):
    """The copies of lines under the half turn about O and the mirror in the
    horizontal line through O. items: (line, point, k), each line drawn
    through the point parallel to REF[k]. A name can be repeated only once and
    a copy's copy cannot be named, so the mirror image of each line is drawn
    as a line of its own, through the mirror image of its point (a repeat of
    the point), and then all of them are turned by 180°."""
    pts, lines_, made = [], [], []
    for l, p, k in items:
        lines_.append(l)
        if _exists(_mir(cm.el[l][1])):
            continue
        assert '@' not in p, p
        if abs(g.P(p)[1]) < 1e-9:
            pm = p
        else:
            pm = p + '@1'
            if pm not in cm.el and p not in pts:
                pts.append(p)
        made.append((l + 'b', pm, (-k) % 10))
    if pts:
        g.cur['create'][name + 'p'] = {'repeat': {'of': pts, 'by': 'mirror:h'}}
        for p in pts:
            x, y = g.P(p)
            cm.el[p + '@1'] = ('point', (x, -y))
    for lb, pm, km in made:
        g.line_par(lb, pm, REF[km])
        lines_.append(lb)
    rot, out = [], list(lines_)
    for l in lines_:
        if not _exists(_rot2(cm.el[l][1])):
            rot.append(l)
            cm.el[l + '@1'] = ('line', _rot2(cm.el[l][1]))
            out.append(l + '@1')
    if rot:
        g.cur['create'][name + 'r'] = {'repeat': {'of': rot, 'by': 'rot2'}}
    return out


# ---- the plan ---------------------------------------------------------------------

LINES = {}       # plan line -> (point, k)
PLAN_PREFIX = 'm'


def describe(n):
    if n in DESC:
        return DESC[n]
    base, _, j = n.partition('@')
    if j:
        return 'the turned copy of ' + describe(base)
    if base in LINES:
        return f'the line through {LINES[base][0]}'
    if base.endswith('b') and (base[:-1] in DESC or base[:-1] in LINES):
        return 'the mirror image of ' + describe(base[:-1])
    raise KeyError(n)


def crossings(HX, HY, reach=1.01):
    names = cm.lines()
    out = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            for p in cm.crossings(a, b):
                if abs(p[0]) <= HX * reach + 1e-9 and abs(p[1]) <= HY * reach + 1e-9:
                    s = 3 * ('@' in a) + 3 * ('@' in b) + 0.3 * (p[1] < -1e-9) + 0.3 * (p[0] < -1e-9) \
                        + 0.01 * math.hypot(*p)
                    out.append((s, a, b, p))
    out.sort(key=lambda t: t[0])
    return out


def plan(polys, HX, HY, reach=1.01, extra=(), tol=1e-6, verbose=True, maxn=60, helpers=True):
    """Greedy: each missing line through a crossing of drawn lines, as a
    parallel to the opening's line at its angle. Returns (point, a, b, where, k, old)."""
    nd = need(polys, HX, HY) + [[k, 1.0] for k in extra]
    out = []
    while len(out) < maxn:
        xs = crossings(HX, HY, reach)
        best = None
        for key in missing(nd):
            t = math.radians(key[0] * 18)
            nv = (math.cos(t), math.sin(t))
            for s, a, b, p in xs:
                err = abs(p[0] * nv[0] + p[1] * nv[1] - key[1])
                if err > tol:
                    continue
                if best is None or s < best[0]:
                    best = (s, key, a, b, p)
                break
        if best is None and helpers:
            hs = helper_search(nd, HX, HY, reach, tol, top=0)
            if hs:
                h = hs[0]
                p = cm.crossings(h[1], h[2])
                p = min(p, key=lambda c: math.dist(c, h[3]))
                best = (0, ((h[4] // 18) % 10, None), h[1], h[2], p)
                if verbose:
                    print('helper line', h)
        if best is None:
            break
        s, key, a, b, p = best
        old = g.named_at(p)
        n = 1
        while f'P{n}' in cm.el:
            n += 1
        pname = old or f'P{n}'
        if not old:
            g.meet(pname, a, b, p)
        lname = f'{PLAN_PREFIX}{len(LINES) + 1}'
        g.line_par(lname, pname, REF[key[0]])
        LINES[lname] = (pname, key[0])
        copies(lname + 'c', [(lname, pname, key[0])])
        out.append((pname, a, b, (round(p[0], 6), round(p[1], 6)), key[0], bool(old)))
        if verbose:
            print('add', key[0] * 18, key[1] and round(key[1], 4), 'through', pname, a, b, (round(p[0], 4), round(p[1], 4)))
    left = missing(nd)
    if verbose:
        print('still missing:', [(k * 18, round(o, 4)) for k, o in left])
    return out


def helper_search(nd, HX, HY, reach=1.01, tol=2e-3, top=15):
    """Helper lines that unlock missing ones: a line at a multiple of 18°
    through a crossing, which crosses an existing line on a missing line.
    Prints the best (fewest copies, nearest O)."""
    xs = crossings(HX, HY, reach)
    names = cm.lines()
    miss = missing(nd)
    found = []
    seen = set()
    for s, a, b, p in xs:
        for k in range(10):
            if have(key_of(p, (-math.sin(math.radians(k * 18)), math.cos(math.radians(k * 18))))):
                continue
            t = math.radians(k * 18)
            d = (-math.sin(t), math.cos(t))
            for nm in names:
                (q, u) = cm.el[nm][1]
                det = d[0] * (-u[1]) - d[1] * (-u[0])
                if abs(det) < 1e-9:
                    continue
                tt = ((q[0] - p[0]) * (-u[1]) - (q[1] - p[1]) * (-u[0])) / det
                x = (p[0] + tt * d[0], p[1] + tt * d[1])
                if abs(x[0]) > HX * reach or abs(x[1]) > HY * reach:
                    continue
                if any(math.dist(x, c[3]) < 1e-6 for c in xs[:0]):
                    continue
                for key in miss:
                    tk = math.radians(key[0] * 18)
                    if key[0] * 18 % 180 == (k * 18 + 90) % 180:
                        continue
                    if abs(math.cos(tk) * x[0] + math.sin(tk) * x[1] - key[1]) < tol:
                        sig = (round(p[0], 4), round(p[1], 4), k, key)
                        if sig in seen:
                            continue
                        seen.add(sig)
                        found.append((s + 0.01 * math.hypot(*x), a, b, (round(p[0], 4), round(p[1], 4)), k * 18,
                                      nm, (round(x[0], 4), round(x[1], 4)), (key[0] * 18, round(key[1], 4))))
    found.sort(key=lambda f: f[0])
    for f in found[:top]:
        print('helper', f)
    return found


def write_plan(entries, size=3):
    """Writes plan entries as steps of at most `size` lines (a new step when an
    entry uses a line of the step being filled)."""
    groups, curg, made = [], [], set()
    n0 = len(LINES)
    for i, e in enumerate(entries):
        uses = {e[1].split('@')[0], e[2].split('@')[0]}
        uses |= {u[:-1] for u in uses if u.endswith('b')}
        if curg and (len(curg) >= size or uses & made):
            groups.append(curg)
            curg, made = [], set()
        curg.append(e)
        made.add(f'{PLAN_PREFIX}{n0 + i + 1}')
    if curg:
        groups.append(curg)
    for grp in groups:
        sents, draws, names = [], [], []
        for pt, a, b, want, k, old in grp:
            if not old and not g.named_at(want):
                da, db = describe(a), describe(b)
                sents.append(f'{da[0].upper()}{da[1:]} crosses {db} at {pt}.')
            ref = REF[k]
            if ref == 'h':
                draws.append(f'Draw a horizontal line through {pt}.')
            elif ref == 'v':
                draws.append(f'Draw a vertical line through {pt}.')
            else:
                draws.append(f'Draw a line through {pt} parallel to {DESC[ref]}.')
        tail = ['Reflect the new line in the horizontal line through O.' if len(grp) == 1 else
                'Reflect the new lines in the horizontal line through O.',
                'Turn all of them round O by 180°.']
        step(' '.join(sents + draws + tail))
        for pt, a, b, want, k, old in grp:
            if not g.named_at(want):
                g.meet(pt, a, b, want)
            lname = f'{PLAN_PREFIX}{len(LINES) + 1}'
            g.line_par(lname, pt, REF[k])
            LINES[lname] = (pt, k)
            names.append((lname, pt, k))
        copies(f'{PLAN_PREFIX}c{len(LINES)}', names)


# ---- the tutorial ---------------------------------------------------------------------

def run(build, spec, names, drawing):
    """`gen.py <pieces.json> <tutorial.json>` builds; `gen.py finish <dump.json>
    <tutorial.json>` writes the expect block and colours from the engine's dump."""
    import json
    import sys
    if sys.argv[1] == 'finish':
        cm.finish(sys.argv[2], sys.argv[3], names)
        if spec.get('small'):
            tut = json.load(open(sys.argv[3]))
            for piece in tut['expect']['pieces']:
                if piece['name'] in spec['small']:
                    piece['small'] = True
            cm.write(tut, sys.argv[3])
        return
    pieces, out = sys.argv[1:3]
    build()
    HX, HY = spec['cell']
    polys = drawing(pieces)
    paths = cm.along_ink(cm.network(polys, hcell=HX, vcell=HY, reach=3 * max(HX, HY)))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': spec['id'], 'title': spec['title'], 'short': spec['short'],
        'subtitle': spec['subtitle'], 'fold': spec.get('fold', 2), 'star': 10,
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
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    if spec.get('woven') is False:
        tut['pattern']['woven'] = False
    if spec.get('placements'):
        tut['pattern']['placements'] = spec['placements']
    if os.path.exists(out):
        old = json.load(open(out))
        if old.get('expect', {}).get('pieces', [{}])[0].get('name') != 'x':
            tut['expect'] = old['expect']
            tut['pattern']['colors'] = old['pattern'].get('colors', {})
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')



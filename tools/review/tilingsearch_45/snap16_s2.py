"""Sixteen-direction helpers for the sixteen-fold batch S2 (EGY1019, B153, B153A,
AJL7, 27 October 2026): the lines of a drawing whose edges run at multiples of
11.25°, an opening that divides the circle at O into sixteen (and the sixteen
lines through O at 11.25° steps), and a greedy plan that draws every missing
line as a parallel to a line through O, through a crossing of earlier lines,
turned round O as far as the drawing allows (rot4, rot8 or rot16).

The 45° tools (large/greedy.py, parallels.py) know four directions and name
lines by them; here a line is named by its angle to the horizontal ("the
67.5° line through P5"), and turns are by 90°, 45° or 22.5°.

A line is a key (k, o): direction k·11.25° (k = 0..15), offset o = n·p with
n = (−sin, cos) of the direction. The square cell is |x|, |y| <= L, with O at
a four-fold centre, so the drawing is symmetric under the turns by 90° and
the mirror in the horizontal; every new line is added with all its turns.
"""
import math

import common as cm
from common import g, put, step

DEG = 11.25
TURN = {4: 'by 90°, three times', 8: 'by 45°, seven times', 16: 'by 22.5°, fifteen times'}


def angle_word(k):
    a = (k % 16) * DEG
    return ('%g' % a) + '°'


# ---- keys -------------------------------------------------------------------

def key_of(p, d):
    ang = math.degrees(math.atan2(d[1], d[0])) % 180
    k = round(ang / DEG) % 16
    t = math.radians(k * DEG)
    return k, p[0] * -math.sin(t) + p[1] * math.cos(t)


def norm(k, o):
    k %= 32
    if k >= 16:
        return k - 16, -o
    return k, o


def turned(key, j, n):
    """The key turned round O by j·360/n degrees."""
    k, o = key
    return norm(k + j * 32 // n, o)


def mirrored(key):
    k, o = key
    return norm(-k, -o)


def same(a, b, tol=2e-3):
    return a[0] == b[0] and abs(a[1] - b[1]) < tol


def orbit(key, n=4, mirror=True):
    out = []
    for base in ([key, mirrored(key)] if mirror else [key]):
        for j in range(n):
            kk = turned(base, j, n)
            if not any(same(kk, x, 1e-9) for x in out):
                out.append(kk)
    return out


# ---- the drawing --------------------------------------------------------------

def need(polys, L, reach=None, minlen=0.01):
    """{key: length} of the drawing's edges inside the cell |x|, |y| <= L."""
    reach = reach or 3 * L
    out = []
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > reach:
            continue
        for i in range(len(Q)):
            for a, b in cm.clip([(Q[i], Q[(i + 1) % len(Q)])], L, L):
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


def have(key, tol=None):
    tol = HAVE_TOL[0] if tol is None else tol
    for nm in cm.lines():
        (q, u) = cm.el[nm][1]
        if same(key_of(q, u), key, tol):
            return nm
    return None


HAVE_TOL = [2e-3]


def missing(nd):
    return [k for k, _ in nd if not have(k)]


def crossings(reach, circles=False):
    names = [n for n, (kind, _) in cm.el.items() if kind == 'line' or (circles and kind == 'circle')]
    out = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            ka, kb = cm.el[a][0], cm.el[b][0]
            if ka == 'circle' and kb == 'circle':
                (c1, r1), (c2, r2) = cm.el[a][1], cm.el[b][1]
                dd = math.dist(c1, c2)
                if dd < 1e-9 or dd > r1 + r2 + 1e-9 or dd < abs(r1 - r2) - 1e-9:
                    continue
            try:
                xs = cm.crossings(a, b)
            except (ZeroDivisionError, ValueError):
                continue
            for p in xs:
                if abs(p[0]) <= reach and abs(p[1]) <= reach:
                    out.append((score(a, b, p), a, b, p))
    out.sort(key=lambda t: t[0])
    return out


PLAN_PREFIX = 'm'
ERRW = 2.0


def score(a, b, p):
    s = 0
    for n in (a, b):
        s += 3 * ('@' in n) + 2 * (cm.el[n][0] == 'circle') + (n.startswith('_'))
    s += 0.3 * (p[1] < -1e-9) + 0.3 * (p[0] < -1e-9) + 0.01 * math.hypot(*p)
    return s


# ---- the opening ----------------------------------------------------------------

REF = {}         # direction k -> the line through O at that angle
POINTNAME = {}   # line through O -> the point on the circle that names it
DESC = {}        # line name -> words, for the plan's sentences


def repeat_distinct(name, of, by):
    """Copies of lines through O under rot<n>, leaving out those that land on
    an earlier one (the engine's `distinct`)."""
    n = int(by[3:])
    made = []
    for o in of:
        (p, d) = cm.el[o][1]
        seen = [math.atan2(d[1], d[0]) % math.pi]
        for i in range(1, n):
            t = 2 * math.pi * i / n
            dd = (d[0] * math.cos(t) - d[1] * math.sin(t), d[0] * math.sin(t) + d[1] * math.cos(t))
            q = (p[0] * math.cos(t) - p[1] * math.sin(t), p[0] * math.sin(t) + p[1] * math.cos(t))
            a = math.atan2(dd[1], dd[0]) % math.pi
            if any(abs((a - s + math.pi / 2) % math.pi - math.pi / 2) < 1e-9 for s in seen) and abs(p[0]) + abs(p[1]) < 1e-12:
                continue
            seen.append(a)
            cm.el[f'{o}@{i}'] = ('line', (q, dd))
            made.append(f'{o}@{i}')
    g.cur['create'][name] = {'repeat': {'of': of, 'by': by, 'distinct': True}}
    return made


def opening(odd=True, star=None, star_text=None):
    """Steps 1–3 (4 with odd): the circle at O through A divided into sixteen
    at S1..S16 by eight lines through O; with odd, eight more lines through O
    halving those angles, crossing the circle at U1..U16. With star (a list
    of k), the lines through S<k+1> at 90° to its line from O, turned by
    22.5° fifteen times: the sixteen star lines t (t@j at S<j+1>)."""
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.line_through('h', 'O', 'A')
    step('Draw a vertical line through O. It crosses the circle at S5. '
         'Draw the line through O that halves the angle between the horizontal and the vertical line. '
         'It crosses the circle at S3. Draw a line through O at 90° to it. '
         'Draw the line through O that halves the angle between the horizontal line and the line through S3. '
         'It crosses the circle at S2. Turn this line round O by 45°, three times. '
         'The lines through O cross the circle at S1 to S16, with S1 at A.', 'ruler', ['c', 'h'])
    g.line_perp('v', 'O', 'h')
    g.meet('S5', 'c', 'v', (0, 1))
    g.line_bisect('d45', 'A', 'O', 'S5')
    g.meet('S3', 'c', 'd45', (math.sqrt(.5), math.sqrt(.5)))
    g.line_bisect('r2', 'A', 'O', 'S3')
    g.meet('S2', 'c', 'r2', (math.cos(math.pi / 8), math.sin(math.pi / 8)))
    repeat_distinct('r2r', ['r2'], 'rot8')
    # d135 as the turn of d45 is not made: name the remaining lines through O
    # by the points they cross. S1..S16 at (i - 1) * 22.5°.
    radial = {0: 'h', 4: 'v', 2: 'd45', 1: 'r2', 3: 'r2@1', 5: 'r2@2', 7: 'r2@3'}
    # d135 (k=12) is missing: make it as the perpendicular to d45 in the same step.
    g.line_perp('d135', 'O', 'd45')
    radial[6] = 'd135'
    for i in range(16):
        nm = f'S{i + 1}'
        if nm in cm.el:
            continue
        t = math.radians(22.5 * i)
        g.meet(nm, 'c', radial[i % 8], (math.cos(t), math.sin(t)))
    for j, ln in radial.items():
        REF[2 * j] = ln
        POINTNAME[ln] = f'S{j + 1}'
        DESC[ln] = 'the ' + angle_word(2 * j) + ' line through O'
    if odd:
        step('Draw the line through O that halves the angle between the horizontal line and the line through S2. '
             'It crosses the circle at U1. '
             'Turn this line round O by 22.5°, seven times. '
             'These lines cross the circle at U1 to U16, halfway between the earlier points.', 'ruler')
        g.line_bisect('r1', 'A', 'O', 'S2')
        repeat_distinct('r1r', ['r1'], 'rot16')
        for j in range(8):
            ln = 'r1' if j == 0 else f'r1@{j}'
            REF[2 * j + 1] = ln
            DESC[ln] = 'the ' + angle_word(2 * j + 1) + ' line through O'
        for i in range(16):
            t = math.radians(11.25 + 22.5 * i)
            j = i % 8
            g.meet(f'U{i + 1}', 'c', 'r1' if j == 0 else f'r1@{j}', (math.cos(t), math.sin(t)))
    if star is not None:
        step(star_text or 'Draw a line through S1 at 90° to the horizontal line. Turn it round O by 22.5°, '
             'fifteen times. These are the sixteen star lines, one through each point S.', 'ruler')
        g.line_perp('t', 'S1', 'h')
        g.repeat('tr', ['t'], 'rot16')
        for j in range(16):
            DESC['t' if j == 0 else f't@{j}'] = f'the star line at S{j + 1}'


# ---- the plan ---------------------------------------------------------------------

LINES = {}       # plan line -> (point, k, n)


def describe(n):
    base, _, j = n.partition('@')
    if n in DESC:
        return DESC[n]
    if base in DESC and not j:
        return DESC[base]
    if base in LINES:
        pt, k, order = LINES[base]
        d = f'the {angle_word(k)} line through {pt}'
        return d + (f', turned by {360 / order * int(j):g}°,' if j else '')
    if base in DESC:
        order = ORDER.get(base, 16)
        return DESC[base] + f', turned by {360 / order * int(j):g}°,'
    raise KeyError(n)


ORDER = {'t': 16}


def best_turn(key, nd):
    """The largest turn group whose copies of key the drawing all needs."""
    for n in (16, 8):
        if all(any(same(x, k) for k, _ in nd) or have(x) for x in orbit(key, n, mirror=False)):
            return n
    return 4


def plan(polys, L, reach=None, circles=False, extra=(), verbose=True, pletter='P', maxn=200, skip=(), tol=1e-6):
    """Greedy: each missing line through an existing crossing, as a parallel
    to the line through O at its angle, through a new point P<n>; returns the
    plan as (point, a, b, where, k, turn, old)."""
    reach = reach or L * 1.01
    nd = need(polys, L) + [[k, 1.0] for k in extra]
    out = []
    while len(out) < maxn:
        xs = crossings(reach, circles)
        best = None
        for key in missing(nd):
            if any(same(key, s) for s in skip):
                continue
            t = math.radians(key[0] * DEG)
            nv = (-math.sin(t), math.cos(t))
            for s, a, b, p in xs:
                err = abs(p[0] * nv[0] + p[1] * nv[1] - key[1])
                if err > tol:
                    continue
                s2 = s + err / max(tol, 1e-9) * ERRW
                if best is None or s2 < best[0]:
                    best = (s2, key, a, b, p)
        if best is None:
            break
        s, key, a, b, p = best
        add(key, a, b, p, nd, out, pletter, verbose)
    left = missing(nd)
    if verbose:
        print('still missing:', [(k, round(o, 4)) for k, o in left if not any(same((k, o), s) for s in skip)])
    return out


def add(key, a, b, p, nd, out, pletter='P', verbose=True):
    n = best_turn(key, nd)
    old = g.named_at(p)
    if old:
        pname = old
    else:
        pname = f'{pletter}{sum(1 for e in out if not e[6]) + PSTART[0]}'
        while pname in cm.el:
            PSTART[0] += 1
            pname = f'{pletter}{sum(1 for e in out if not e[6]) + PSTART[0]}'
        g.meet(pname, a, b, p)
    lname = f'{PLAN_PREFIX}{len(LINES) + 1}'
    g.line_par(lname, pname, REF[key[0]])
    LINES[lname] = (pname, key[0], n)
    ORDER[lname] = n
    g.repeat(lname + 'r', [lname], f'rot{n}')
    out.append((pname, a, b, (round(p[0], 6), round(p[1], 6)), key[0], n, bool(old)))
    if verbose:
        print('add', key[0] * DEG, round(key[1], 4), 'through', pname, a, b, (round(p[0], 4), round(p[1], 4)), 'rot', n)


PSTART = [1]


def emit(entries, heading=None):
    """One step per entry list: the sentences for the plan's lines (call
    after the elements are made, with steps already open)."""
    raise NotImplementedError


def reset_plan():
    LINES.clear()


# ---- writing a plan as steps --------------------------------------------------------

def write_plan(plan_entries, size=3):
    """Writes the plan as steps (a new step at most every `size` entries, or
    when an entry needs a line of the step being filled), creating the
    elements as it goes. plan_entries: (point, a, b, where, k, turn, old)."""
    groups, cur, made = [], [], set()
    n0 = len(LINES)
    for i, e in enumerate(plan_entries):
        uses = {e[1].split('@')[0], e[2].split('@')[0]}
        if cur and (len(cur) >= size or uses & made or e[5] != cur[0][5]):
            groups.append(cur)
            cur, made = [], set()
        cur.append(e)
        made.add(f'{PLAN_PREFIX}{n0 + i + 1}')
    if cur:
        groups.append(cur)
    for grp in groups:
        sents, seen = [], set()
        pending = []
        for e in grp:
            pt, a, b, want, k, order, old = e
            if not old and pt not in seen and not g.named_at(want):
                da, db = describe(a), describe(b)
                sents.append(f'{da[0].upper()}{da[1:]} crosses {db} at {pt}.'.replace(',, ', ', ').replace(',, crosses', ', crosses'))
                seen.add(pt)
            pending.append(e)
        draws = []
        made = []
        for e in pending:
            pt, a, b, want, k, order, old = e
            ref = REF[k]
            refw = 'horizontal line' if k == 0 else 'vertical line' if k == 8 else None
            if refw:
                draws.append(f'Draw a {refw} through {pt}.')
            else:
                draws.append(f'Draw a line through {pt} parallel to the {angle_word(k)} line through O.')
        tail = f'Turn it round O {TURN[grp[0][5]]}.' if len(grp) == 1 else \
            f'Turn the new lines round O {TURN[grp[0][5]]}.'
        step(' '.join(sents + draws + [tail]))
        for e in pending:
            pt, a, b, want, k, order, old = e
            if not g.named_at(want):
                g.meet(pt, a, b, want)
            lname = f'{PLAN_PREFIX}{len(LINES) + 1}'
            g.line_par(lname, pt, REF[k])
            LINES[lname] = (pt, k, order)
            ORDER[lname] = order
            made.append(lname)
        g.repeat(f'{PLAN_PREFIX}r{len(LINES)}', made, f'rot{grp[0][5]}')

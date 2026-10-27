"""Ten-direction helpers for batch T4 (MIR1, TOP1, 27 October 2026), built on
snap10_t2: the same keys, opening and greedy plan, for patterns whose only
symmetry through O is the mirror in the horizontal line (fold 1, pmg with O
at a star on a mirror), or the mirror and the half turn (fold 2, as in
snap10_t2), chosen by `SYM`.

- `pentagons()`: the ten chords AC, CE, … and BD, DF, … of the circle
  divided into ten (two regular pentagons, the ten-pointed star whose sides
  run at odd multiples of 18°), registered as the reference lines for their
  directions.
- `copies(name, items)`: the mirror images of new lines in the horizontal
  line through O (and, when SYM['rot2'], their half turns).
- `plan(...)`, `write_plan(...)`: snap10_t2's greedy plan with these copies.
"""
import math

import common as cm
import snap10_t2 as s2
from common import g, step

SYM = {'rot2': False}
LET = s2.LETTERS


def pentagons(text=None):
    step(text or 'Join A, C, E, G and J with straight lines. Join B, D, F, H and K with straight lines. '
         'The two pentagons make a ten-pointed star.', 'ruler')
    for i in range(10):
        a, b = LET[i], LET[(i + 2) % 10]
        nm = f'p{a}{b}'
        g.line_through(nm, a, b)
        # the chord's normal points to the decagon point between a and b
        k = (2 * (i + 1)) % 10
        s2.REF.setdefault(k, nm)
        s2.DESC[nm] = f'line {a}{b}'


def describe(n):
    """snap10_t2.describe, naming the direction of a plan line drawn through
    a point that other lines also pass through (O, A, …)."""
    base, _, j = n.partition('@')
    core = base[:-1] if base.endswith('b') and base[:-1] in s2.LINES else base
    if core in s2.LINES and not s2.LINES[core][0].startswith('P'):
        pt, k = s2.LINES[core]
        mirrored_here = core != base and abs(g.P(pt)[1]) < 1e-9
        if mirrored_here:
            k = (-k) % 10
        d = f'the line through {pt} parallel to {s2.DESC.get(s2.REF[k], "")}'
        if s2.REF[k] == 'h':
            d = f'the horizontal line through {pt}'
        elif s2.REF[k] == 'v':
            d = f'the vertical line through {pt}'
        if core != base and not mirrored_here:
            d = 'the mirror image of ' + d
        if j:
            d = 'the turned copy of ' + d
        return d
    return s2.describe(n).replace('the turned copy of the mirror image of', 'the turned mirror image of')


def _mir(geom):
    (p, d) = geom
    return ((p[0], -p[1]), (d[0], -d[1]))


def copies(name, items):
    """Mirror images in the horizontal line through O of lines drawn through
    a point parallel to a reference line (and their half turns about O when
    SYM['rot2'])."""
    pts, lines_, made = [], [], []
    for l, p, k in items:
        lines_.append(l)
        if s2._exists(_mir(cm.el[l][1])):
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
        g.line_par(lb, pm, s2.REF[km])
        lines_.append(lb)
    out = list(lines_)
    if SYM['rot2']:
        rot = []
        for l in lines_:
            if not s2._exists(s2._rot2(cm.el[l][1])):
                rot.append(l)
                cm.el[l + '@1'] = ('line', s2._rot2(cm.el[l][1]))
                out.append(l + '@1')
        if rot:
            g.cur['create'][name + 'r'] = {'repeat': {'of': rot, 'by': 'rot2'}}
    return out


def plan(polys, HX, HY, reach=1.01, tol=1e-6, verbose=True, maxn=80, skip=(), helpers=False, htol=2e-3):
    """Greedy: each missing line through a crossing of drawn lines, as a
    parallel to the reference line at its angle, with its copies. With
    helpers, when no missing line runs through a crossing, a helper line
    (snap10_t2.helper_search) that crosses a drawn line on a missing one."""
    nd = s2.need(polys, HX, HY)
    out = []
    while len(out) < maxn:
        xs = s2.crossings(HX, HY, reach)
        best = None
        for key in s2.missing(nd):
            if any(s2.same(key, s) for s in skip):
                continue
            t = math.radians(key[0] * 18)
            nv = (math.cos(t), math.sin(t))
            for s, a, b, p in xs:
                if abs(p[0] * nv[0] + p[1] * nv[1] - key[1]) > tol:
                    continue
                if best is None or s < best[0]:
                    best = (s, key, a, b, p)
                break
        if best is None and helpers:
            hs = [h for h in s2.helper_search(nd, HX, HY, reach, htol, top=0) if ((h[4] // 18) % 10) in s2.REF]
            if hs:
                h = hs[0]
                p = min(cm.crossings(h[1], h[2]), key=lambda c: math.dist(c, h[3]))
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
        lname = f'{s2.PLAN_PREFIX}{len(s2.LINES) + 1}'
        g.line_par(lname, pname, s2.REF[key[0]])
        s2.LINES[lname] = (pname, key[0])
        copies(lname + 'c', [(lname, pname, key[0])])
        out.append((pname, a, b, (round(p[0], 6), round(p[1], 6)), key[0], bool(old)))
        if verbose:
            print('add', key[0] * 18, key[1] and round(key[1], 4), 'through', pname, a, b, (round(p[0], 4), round(p[1], 4)))
    left = s2.missing(nd)
    if verbose:
        print('still missing:', [(k * 18, round(o, 4)) for k, o in left])
    return out


def write_plan(entries, size=3):
    """Writes plan entries as steps of at most `size` lines (a new step when an
    entry uses a line of the step being filled)."""
    groups, curg, made = [], [], set()
    n0 = len(s2.LINES)
    for i, e in enumerate(entries):
        # an entry may use a line drawn earlier in the same step, but not
        # its copies, which are made at the end of the step
        uses = {n.split('@')[0][:-1] if n.split('@')[0].endswith('b') else n.split('@')[0]
                for n in (e[1], e[2]) if '@' in n or n.split('@')[0].endswith('b')}
        if curg and (len(curg) >= size or uses & made):
            groups.append(curg)
            curg, made = [], set()
        curg.append(e)
        made.add(f'{s2.PLAN_PREFIX}{n0 + i + 1}')
    if curg:
        groups.append(curg)
    for grp in groups:
        sents, names = [], []
        n1 = len(s2.LINES)
        for j, (pt, a, b, want, k, old) in enumerate(grp):
            if not old and not g.named_at(want) and not any(e[0] == pt for e in grp[:j]):
                da, db = describe(a), describe(b)
                sents.append(f'{da[0].upper()}{da[1:]} crosses {db} at {pt}.')
            ref = s2.REF[k]
            if ref == 'h':
                sents.append(f'Draw a horizontal line through {pt}.')
            elif ref == 'v':
                sents.append(f'Draw a vertical line through {pt}.')
            else:
                sents.append(f'Draw a line through {pt} parallel to {s2.DESC[ref]}.')
            # name the new line now, so later entries of the step can describe it
            s2.LINES[f'{s2.PLAN_PREFIX}{n1 + j + 1}'] = (pt, k)
        for j in range(len(grp)):
            del s2.LINES[f'{s2.PLAN_PREFIX}{n1 + j + 1}']
        tail = ['Reflect the new line in the horizontal line through O.' if len(grp) == 1 else
                'Reflect the new lines in the horizontal line through O.']
        if SYM['rot2']:
            tail.append('Turn all of them round O by 180°.')
        step(' '.join(sents + tail))
        for pt, a, b, want, k, old in grp:
            if not g.named_at(want):
                g.meet(pt, a, b, want)
            lname = f'{s2.PLAN_PREFIX}{len(s2.LINES) + 1}'
            g.line_par(lname, pt, s2.REF[k])
            s2.LINES[lname] = (pt, k)
            names.append((lname, pt, k))
        copies(f'{s2.PLAN_PREFIX}c{len(s2.LINES)}', names)

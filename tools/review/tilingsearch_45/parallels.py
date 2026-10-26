"""Parallels through crossings, for the large 45° panels of batch 17.

Most lines of these panels are carried on from the unit star at O: each new
line runs through a crossing of two earlier lines, parallel to one of the four
lines through O, and is turned round O by 90° three times. A plan lists them as
(point, line a, line b, where, direction), found with the batch's lab script
(a greedy search over the drawing's missing lines; see the generators). `emit`
writes the steps and their plain-English text from such a plan.

Line names understood by `describe`: the unit star of
gen_meknes_bou_inania_petals.build_unit_star (h, v, d45, d135, ax, cy, and the
star's sides q01..q14), the frame of build_frame (gx, gy, gxw, gys), the
plan's own lines (m<n>) and their copies (name@j).
"""
import math

import common as cm
from common import g, step

DIRWORD = {'h': 'horizontal line', 'v': 'vertical line'}
FIXED = {'h': 'the horizontal line through O', 'v': 'the vertical line through O', 'd45': 'line OE',
         'd135': 'the line from S4 to S8', 'ax': 'the vertical line through A', 'cy': 'the horizontal line through C',
         'gx': 'the vertical line through T1', 'gy': 'the horizontal line through T2',
         'gxw': 'the vertical line through T3', 'gys': 'the horizontal line through T4'}
EXTRA = {}       # more names, set by a generator


def star_side(n):
    k, i = int(n[1]), int(n[2]) - 1
    a = k + 2 * i
    return f'the line from S{a + 1} to S{(a + 2) % 8 + 1}'


def new_line(point, ref):
    if ref in DIRWORD:
        return f'the {DIRWORD[ref]} through {point}'
    if ref == 'd135':
        return f'the line through {point} at 90° to line OE'
    return f'the line through {point} parallel to {FIXED[ref]}'


LINES = {}       # plan line name -> (point, ref)


def describe(n):
    base, _, j = n.partition('@')
    if base in EXTRA:
        d = EXTRA[base]
    elif base in FIXED:
        d = FIXED[base]
    elif base[0] == 'q' and len(base) == 3:
        d = star_side(base)
    elif base in LINES:
        d = new_line(*LINES[base][:2])
    else:
        raise KeyError(n)
    order = LINES[base][2] if base in LINES else ORDER.get(base, 4)
    return d + (f', turned by {360 // order * int(j)}°,' if j else '')


ORDER = {}       # copies' turn for lines not in the plan (rot8 repeats)
TURN = {4: 'by 90°, three times', 8: 'by 45°, seven times'}


def emit(groups, prefix='m', heading=None):
    """One step per group of plan entries (point, a, b, want, ref[, ...])."""
    for grp in groups:
        sents, made, meets, seen = [], [], [], set()
        order = int((grp[0][5] if len(grp[0]) > 5 else 'rot4')[3:])
        for e in grp:
            pt, a, b, want, ref = e[:5]
            if not g.named_at(want) and pt not in seen:
                da, db = describe(a), describe(b)
                sents.append(f'{da[0].upper()}{da[1:]} crosses {db} at {pt}.'.replace(',, ', ', '))
                meets.append((pt, a, b, want))
                seen.add(pt)
            name = f'{prefix}{len(LINES) + 1}'
            LINES[name] = (pt, ref, order)
            made.append((name, pt, ref))
        draws = []
        for name, pt, ref in made:
            if ref in DIRWORD:
                draws.append(f'Draw a {DIRWORD[ref]} through {pt}.')
            else:
                draws.append(f'Draw a {new_line(pt, ref)[4:]}.')
        tail = f'Turn it round O {TURN[order]}.' if len(made) == 1 else \
            f'Turn the new lines round O {TURN[order]}.'
        step(' '.join(sents + draws + [tail]))
        for pt, a, b, want in meets:
            g.meet(pt, a, b, want)
        for name, pt, ref in made:
            g.line_par(name, pt, ref)
        g.repeat(f'{prefix}r{len(LINES)}', [nm for nm, _, _ in made], f'rot{order}')


def group(plan, size=3):
    """Splits a plan into steps of up to `size` entries, starting a new step
    where an entry needs a line made in the step being filled."""
    out, cur, made = [], [], set()
    n = len(LINES)
    for e in plan:
        uses = {e[1].split('@')[0], e[2].split('@')[0]}
        by = e[5] if len(e) > 5 else 'rot4'
        if cur and (len(cur) >= size or uses & made or by != (cur[0][5] if len(cur[0]) > 5 else 'rot4')):
            out.append(cur)
            cur, made = [], set()
        cur.append(e)
        n += 1
        made.add(f'm{n}')
    if cur:
        out.append(cur)
    return out


def placements(fills, names):
    """Placement rules from the drawing's colours: `fills` maps a piece name
    to {slot: [nth, ...]} for the shapes coloured more than one way; the slot
    in `names` (the shape's own colour) needs no rule."""
    own = {nm: slot for nm, slot in names.values()}
    rules = []
    for nm, by in fills.items():
        for slot, nths in by.items():
            if slot != own[nm]:
                rules += [{'piece': nm, 'nth': n, 'color': slot} for n in nths]
    return {'repeat': [1, 1], 'rules': rules}


def check_words(steps, limit=20):
    """Sentences over the word limit, which the player's text test rejects."""
    bad = []
    for s in steps:
        texts = [s.get('text', '')] + [p['text'] for p in s.get('parts', [])]
        for t in texts:
            for sen in t.replace('°,', '° ,').split('. '):
                if len(sen.split()) > limit:
                    bad.append((s['id'], sen))
    return bad

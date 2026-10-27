"""Helpers of the ten-fold batch T3 (P183, SHAF10, MIR17, MIR26; 27 October
2026), on top of snap10_t2's greedy plan.

`without(hidden)`: writes textWithoutHelpers for every step of a
snap10_t2.write_plan plan that leaves helper lines out. `hidden` is the set
of names the player hides with helper lines off (from hidden_t2.sh, pasted
into the generator). For each line of the step it says which of the line and
its copies (mirror image in the horizontal line, turned copies) are drawn,
and it keeps a crossing sentence only when both its lines are drawn.
"""
import common as cm
import snap10_t2 as t2

MIRROR = 'the horizontal line through O'


def _draw(pt, k):
    ref = t2.REF[k]
    if ref == 'h':
        return f'a horizontal line through {pt}'
    if ref == 'v':
        return f'a vertical line through {pt}'
    return f'a line through {pt} parallel to {t2.DESC[ref]}'


def _line_text(name, hidden):
    pt, k = t2.LINES[name]
    d = _draw(pt, k)
    el = cm.el
    own = name not in hidden
    has = lambda n: n in el and n not in hidden  # noqa: E731
    mir = has(name + 'b')
    rot = has(name + '@1')
    mrot = has(name + 'b@1')
    out = []
    if own:
        out.append(f'Draw {d}.')
        if mir and rot and mrot:
            out.append(f'Reflect it in {MIRROR}. Turn both round O by 180°.')
        else:
            if mir:
                out.append(f'Reflect it in {MIRROR}.')
            if rot:
                out.append('Turn it round O by 180°.')
            if mrot:
                out.append('Turn its mirror image round O by 180°.' if mir else
                           'Draw the turn round O by 180° of its mirror image, but not the mirror image.')
    else:
        if mir:
            out.append(f'Draw only the mirror image of {d}.')
            if mrot:
                out.append('Turn that mirror image round O by 180°.')
            if rot:
                out.append(f'Draw the turn round O by 180° of {d}.')
        elif rot or mrot:
            if rot:
                out.append(f'Draw only the turn round O by 180° of {d}.')
            if mrot:
                out.append('Draw the turn round O by 180° of its mirror image.')
    return out


def without(hidden):
    for st in cm.steps:
        cr = st.get('create', {})
        lines = [n for n in cr if n in t2.LINES]
        if not lines:
            continue
        made = set(cr)
        for n in cr:
            rep = cr[n].get('repeat') if isinstance(cr[n], dict) else None
            if rep:
                for m in rep['of']:
                    made.add(m + '@1')
        made |= {n + 'b' for n in lines} | {n + 'b@1' for n in lines} | {n + '@1' for n in lines}
        if not any(n in hidden for n in made if n in cm.el and cm.el[n][0] == 'line'):
            continue
        sents = []
        for n, spec in cr.items():
            if isinstance(spec, dict) and 'point' in spec and n not in hidden:
                a, b = spec['point']['meet']
                if a not in hidden and b not in hidden:
                    da, db = t2.describe(a), t2.describe(b)
                    sents.append(f'{da[0].upper()}{da[1:]} crosses {db} at {n}.')
        for n in lines:
            sents += _line_text(n, hidden)
        st['textWithoutHelpers'] = ' '.join(sents)

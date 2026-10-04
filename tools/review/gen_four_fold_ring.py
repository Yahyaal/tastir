"""Generates the four-fold ring of circles tutorial from Sandy Kurt's final
drawing, classified into ff-ink.json. Usage: gen_four_fold_ring.py <out.json>
The result has placeholder expect values; copy its steps and ink into
tutorials/four-fold-ring-of-circles.json."""
import json, math

import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..') + '/'
S = ROOT + 'docs/research/four-fold-model/'  # ff-ink.json: Kurt's drawing classified
sc = json.load(open(ROOT + 'tutorials/eight-fold-star-and-cross.json'))
rho = 1 - 1 / math.sqrt(2)
a = rho / math.sqrt(2)
r8 = math.sqrt(2 - math.sqrt(2))

# Known points of the star-and-cross steps (frame: O origin, A=(1,0)).
P = {'O': (0, 0), 'E': (1, 0), 'N': (0, 1), 'W': (-1, 0), 'S': (0, -1),
     'NE': (math.sqrt(.5),) * 2, 'NW': (-math.sqrt(.5), math.sqrt(.5)),
     'SW': (-math.sqrt(.5),) * 2, 'SE': (math.sqrt(.5), -math.sqrt(.5)),
     'c1': (1, 1), 'c2': (-1, 1), 'c3': (-1, -1), 'c4': (1, -1)}
for k in range(8):
    t = math.radians(22.5 + 45 * k)
    P[f'k.{k+1}'] = (r8 * math.cos(t), r8 * math.sin(t))
centres = ['O', 'c1', 'c2', 'c3', 'c4'] + [f'k.{k+1}' for k in range(8)]
circ = {'k.1': 'ring1'}
for i, c in enumerate(centres):
    if c != 'k.1':
        circ[c] = 'ring_' + c.replace('.', '')

def ang(p): return math.degrees(math.atan2(p[1], p[0])) % 360
def dist(p, q): return math.hypot(p[0] - q[0], p[1] - q[1])

def pick_for(target, cands):
    """A pick rule that chooses target among cands with the best margin."""
    best = None
    for rule in [('angle',)] + [(k, n) for k in ('nearest', 'farthest') for n in P]:
        if rule[0] == 'angle':
            if math.hypot(*target) < 1e-6: continue
            want = round(ang(target))
            score = lambda q: abs(((ang(q) - want + 180) % 360) - 180) if math.hypot(*q) > 1e-6 else 999
            spec = {'angle': want}
        else:
            ref = P[rule[1]]
            score = (lambda q, r=ref: dist(q, r)) if rule[0] == 'nearest' else (lambda q, r=ref: -dist(q, r))
            spec = {rule[0]: rule[1]}
        st = score(target)
        others = [score(q) for q in cands if dist(q, target) > 1e-6]
        if not others: return None
        margin = min(others) - st
        if rule[0] == 'angle': margin = margin / 360  # comparable scale: angle margin in turns
        if best is None or margin > best[0]: best = (margin, spec)
    assert best[0] > 0.02, (target, best)
    return best[1]

def circle_line(c, r, n_deg, d):
    """Crossings of circle (c, r) with the line x cos n + y sin n = d."""
    n = (math.cos(math.radians(n_deg)), math.sin(math.radians(n_deg)))
    off = d - (c[0] * n[0] + c[1] * n[1]); h2 = r * r - off * off
    foot = (c[0] + n[0] * off, c[1] + n[1] * off); t = (-n[1], n[0]); h = math.sqrt(max(h2, 0))
    return [(foot[0] + t[0] * h, foot[1] + t[1] * h), (foot[0] - t[0] * h, foot[1] - t[1] * h)]

ink = json.load(open(S + 'ff-ink.json'))
ink = [s for s in ink if not (s[2][0] in (0, 90) and abs(abs(s[2][1]) - 1) < 1e-6)]
need = sorted(set((s[2][0], s[2][1]) for s in ink))

# One small circle that makes each needed line, and the helper through it.
lines = {}       # (n, d) -> name
pt_dir, line_dir, end_dir = {}, {}, {}
steps_helpers, steps_points, steps_lines = {}, {}, {}
for n, d in need:
    made = False
    for c in centres:
        cx, cy = P[c]
        if n in (0, 90):          # side of the circle's lying square: through its diagonal points
            base = cx if n == 0 else cy
            for sgn in (1, -1):
                if abs(base + sgn * a - d) < 1e-4:
                    hel = []
                    for dn, dname in ((135, 'd1'), (45, 'd2')):
                        hname = f'{dname}_{c.replace(".", "")}'
                        hd = (cx * math.cos(math.radians(dn)) + cy * math.sin(math.radians(dn)))
                        if c == 'O': hname = dname
                        else: steps_helpers[hname] = {'line': {'through': c, 'parallelTo': dname}}
                        hel.append((hname, dn, hd))
                    pts = []
                    for hname, dn, hd in hel:
                        cands = circle_line((cx, cy), rho, dn, hd)
                        tgt = [q for q in cands if abs((q[0] if n == 0 else q[1]) - d) < 1e-4][0]
                        pname = f'q{len(steps_points)}'
                        rule = pick_for(tgt, cands)
                        steps_points[pname] = {'point': {'meet': [circ[c], hname], 'pick': rule}}
                        P[pname] = tgt; pts.append(pname); pt_dir[pname] = n
                    made = True
        else:                     # side of its standing square: through its points on the axes
            s45 = (cx * math.cos(math.radians(n)) + cy * math.sin(math.radians(n)))
            for sgn in (1, -1):
                if abs(s45 + sgn * a - d) < 1e-4:
                    pts = []
                    for an, aname in ((0, 'h'), (90, 'v')):
                        hname = f'{aname}_{c.replace(".", "")}'
                        hd = cx if an == 0 else cy
                        if c == 'O': hname = aname
                        elif abs(hd) < 1e-9: hname = aname
                        else: steps_helpers[hname] = {'line': {'through': c, 'parallelTo': aname}}
                        # helper "h_c" is horizontal through c: normal 90; "v_c" vertical: normal 0
                        hn = 90 if aname == 'h' else 0
                        hdist = cy if aname == 'h' else cx
                        cands = circle_line((cx, cy), rho, hn, hdist)
                        nn = (math.cos(math.radians(n)), math.sin(math.radians(n)))
                        tgt = [q for q in cands if abs(q[0] * nn[0] + q[1] * nn[1] - d) < 1e-4][0]
                        pname = f'q{len(steps_points)}'
                        steps_points[pname] = {'point': {'meet': [circ[c], hname], 'pick': pick_for(tgt, cands)}}
                        P[pname] = tgt; pts.append(pname); pt_dir[pname] = n
                    made = True
        if made:
            lname = f'L{len(lines)}'
            steps_lines[lname] = {'line': {'through': pts}}; line_dir[lname] = n
            lines[(n, d)] = lname
            break
    assert made, (n, d)

frame = {(0, 1.0): 'tE', (0, -1.0): 'tW', (90, 1.0): 'tN', (90, -1.0): 'tS'}
def line_name(n, d):
    for (fn, fd), nm in frame.items():
        if fn == n and abs(fd - d) < 1e-4: return nm
    for (ln, ld), nm in lines.items():
        if ln == n and abs(ld - d) < 1e-4: return nm
    return None
allL = dict(lines); allL.update(frame)

def on(n, d, p): return abs(p[0] * math.cos(math.radians(n)) + p[1] * math.sin(math.radians(n)) - d) < 1e-4

# Merge the inked segments on each line into runs, and name their ends.
ends = {}
def end_name(n, d, p):
    key = (round(p[0], 6), round(p[1], 6))
    if key in ends: return ends[key]
    for nm, q in P.items():
        if dist(p, q) < 1e-7 and not nm.startswith('q'):
            ends[key] = nm; return nm
    for (m, e), nm in allL.items():
        if (m, e) != (n, d) and m != n and on(m, e, p):
            pname = f'x{len(ends)}'
            ends[key] = pname
            steps_ends[pname] = {'point': {'meet': [line_name(n, d), nm]}}; end_dir[pname] = n
            P[pname] = p
            return pname
    raise SystemExit(f'no line crosses {(n, d)} at {p}')
steps_ends = {}
paths = []
for (n, d) in need:
    segs = [(s[0], s[1]) for s in ink if (s[2][0], s[2][1]) == (n, d)]
    t = (-math.sin(math.radians(n)), math.cos(math.radians(n)))
    proj = lambda p: p[0] * t[0] + p[1] * t[1]
    iv = sorted(tuple(sorted((proj(A), proj(B)))) + ((A, B) if proj(A) <= proj(B) else (B, A),) for A, B in segs)
    runs = []
    for lo, hi, (A, B) in iv:
        if runs and abs(runs[-1][1] - lo) < 1e-6:
            runs[-1] = (runs[-1][0], hi, runs[-1][2], B)
        else:
            runs.append((lo, hi, A, B))
    for lo, hi, A, B in runs:
        paths.append({'through': [end_name(n, d, A), end_name(n, d, B)]})

st = json.loads(json.dumps(sc['steps']))
st[5]['text'] = ('Draw the square that just touches the circle: a line at right angles to the horizontal at each side, '
                 'and at right angles to the vertical at the top and bottom. This square is the tile that will repeat.')
ring = {'ring1': {'circle': {'centre': 'k.1', 'tangentTo': ['h', 'd1']}}}
for c in centres:
    if c != 'k.1': ring[circ[c]] = {'circle': {'centre': c, 'radiusOf': 'ring1'}}
st.append({'id': 7, 'text': 'Put the compass on the crossing of the two squares just above the horizontal on the right, and open it until the circle just touches the horizontal and the diagonal. Keep that opening and draw the same small circle on the other seven crossings, on the centre, and on the four corners of the tile.',
           'create': ring, 'highlight': ['k', 'h', 'd1'], 'animate': 'compass'})
st.append({'id': 8, 'text': 'Through the middle of every small circle, rule lines parallel to the horizontal, the vertical and the two diagonals. Each small circle is now divided into eight.',
           'create': steps_helpers, 'highlight': ['h', 'v', 'd1', 'd2'], 'animate': 'ruler'})
WORDS = {90: ('lying', 'horizontal'), 0: ('lying', 'vertical'), 45: ('standing', 'slanting up to the left'), 135: ('standing', 'slanting up to the right')}
for n in (90, 0, 45, 135):
    sq, way = WORDS[n]
    create = {k: v for k, v in steps_points.items() if pt_dir[k] == n}
    create.update({k: v for k, v in steps_lines.items() if line_dir[k] == n})
    st.append({'text': f'Now the {way} sides of the {sq} squares, one inside every small circle. Mark where each circle cuts the line through its middle that the side needs, and rule the side right across the tile; neighbouring circles often share the same long line.',
               'create': create, 'animate': 'ruler'})
for group, text in (((90, 0), 'Mark where the horizontal and vertical lines meet the other lines at the turns of the pattern.'),
                    ((45, 135), 'Mark where the slanting lines meet the other lines at the turns of the pattern.')):
    st.append({'text': text, 'create': {k: v for k, v in steps_ends.items() if end_dir[k] in group}, 'animate': 'fade'})
for i, s in enumerate(st): s['id'] = i + 1
t = {'format': 0, 'id': 'four-fold-ring-of-circles', 'title': 'Mughal jali', 'fold': 4, 'style': 'Mughal', 'level': 'advanced',
     'credits': [{'source': '4fold Pattern Tutorial', 'creator': 'Sandy Kurt', 'url': 'https://sandykurt.com/free-tutorials',
                  'note': 'The ring of small circles touching the axes and diagonals, a lying and a standing square in each, and the choice of lines to ink follow this tutorial; our steps group the drawing differently and the text is our own.',
                  'steps': [7, 8, 9, 10]}],
     'given': sc['given'], 'steps': st,
     'ink': {'text': 'Go over the lattice lines that form the pattern: around the centre an eight-pointed star, around it a ring of crossed bands, and in the corners the start of the next star.', 'paths': paths},
     'pattern': {'cell': 'cell', 'text': 'Repeat the tile edge to edge. The corners of four tiles close into another eight-pointed star, and the bands cross between the stars as in a carved stone screen.', 'palette': 'Fès tile', 'colors': {}},
     'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
import sys
json.dump(t, open(sys.argv[1], 'w'))
print(len(lines), 'lines', len(steps_points), 'points', len(steps_ends), 'ends', len(paths), 'paths')

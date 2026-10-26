#!/usr/bin/env python3
"""Builds the interlaced stars of Rajah Birbal's house, Fatehpur Sikri, drawn
by Brian Wichmann in Tiling Search (data175/IND01): p4g, four stars turning
round each centre of four-fold turning, the next centres turning the other way.

Read from the PDF (a band drawing, band 10 pt). O is the centre of four
octagons that turn round each other; the next such centres, 244.7 pt away on
the page's axes, turn the other way. The stars are those of the Itimad
al-Daula drawing (F78, the same tiles in the same PDF scale): turned by 22.5°
and put in units of OA = 174.85 pt, every corner snaps to the grid
a + b·√2/2 (worst error 0.0006 of OA), and every line is a side of a star of
two squares with tip radius R = √2 − 1, carried on.

Construction (OA = 1). The star at Z = (√2/2, 2R − √2/2): Q = (R, R) is one
tip; its square has sides x = R, x = 1, y = 2R − 1 and y = R, the last added
by the turn; its other square has its tips on the circle with centre Z
through Q, on the horizontal through Z and the vertical through F. Four such
stars turn round O. K1, the next centre of four-fold turning (at 22.5°), is
where the circle with centre Z through O crosses the line OK1 again (the line
through Z that halves the angle W2 Z Q is a mirror of the pattern taking O to
K1). The stars that turn the other way round K1 to K4 need only four more
lines, each turned round O: through K1 parallel to OF, and through N (on the
circle with centre E and the vertical through A) and M (on the vertical
through P and the line W1 W2), found with find_crossings.py (run with
FIND=<pieces.json>). The tile is the square K1 K2 K3 K4, tilted by 22.5°.

Usage: gen_fatehpur_sikri_stars.py <IND01-pieces.json> tutorials/fatehpur-sikri-stars.json
       pnpm review fatehpur-sikri-stars
       gen_fatehpur_sikri_stars.py finish docs/review/fatehpur-sikri-stars/dump.json tutorials/fatehpur-sikri-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import el, g, put, step  # noqa: E402

R2 = math.sqrt(2)
R = R2 - 1
H = R2 / 2
ORIGIN, UNIT, BAND, TURN = (265.8, 347.25), 174.85, 10.0, 22.5
ZX, ZY = H, 2 * R - H


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.line_through('h', 'O', 'A')

    step('Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
         'Draw the line through O that halves the angle AOC. It crosses the circle at F. '
         'Draw a vertical line through A. It crosses the line through O and F at E.', 'ruler', ['c', 'h'])
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.meet('B', 'c', 'h', (-1, 0))
    g.meet('D', 'c', 'v', (0, -1))
    g.line_bisect('d45', 'A', 'O', 'C')
    g.meet('F', 'c', 'd45', (H, H))
    g.line_perp('gx', 'A', 'h')
    g.meet('E', 'gx', 'd45', (1, 1))

    step('Draw a circle with centre E through F. Draw a circle with centre O and the same radius. '
         'It crosses the horizontal line at P, right of O. '
         'Draw a vertical line through P. It crosses the line through O and F at Q.', 'compass', ['E', 'P', 'Q'])
    g.circle_through('ck', 'E', 'F')
    cm.circle_radius_of('cs', 'O', 'ck')
    g.meet('P', 'cs', 'h', (R, 0))
    g.line_par('pv', 'P', 'v')
    g.meet('Q', 'pv', 'd45', (R, R))

    step('Draw a line through Q at 90° to line OF. It crosses the vertical line through A at G. '
         'Draw a horizontal line through G. '
         'Draw a vertical line through F. It crosses the line through Q at Z, the centre of a star.',
         'ruler', ['Q', 'G', 'Z'])
    g.line_perp('qd', 'Q', 'd45')
    g.meet('G', 'qd', 'gx', (1, 2 * R - 1))
    g.line_par('gh', 'G', 'h')
    g.line_par('fv', 'F', 'v')
    g.meet('Z', 'fv', 'qd', (ZX, ZY))

    step('Draw a circle with centre Z through Q. Draw a horizontal line through Z. '
         'It crosses the circle at W1 and W3. The vertical line through F crosses it at W2 and W4. '
         'Join W1, W2, W3 and W4 with straight lines.', 'compass', ['Z', 'Q'])
    g.circle_through('cz', 'Z', 'Q')
    g.line_par('zh', 'Z', 'h')
    g.meet('W1', 'cz', 'zh', (ZX + R, ZY))
    g.meet('W2', 'cz', 'fv', (ZX, ZY + R))
    g.meet('W3', 'cz', 'zh', (ZX - R, ZY))
    g.meet('W4', 'cz', 'fv', (ZX, ZY - R))
    g.line_through('w12', 'W1', 'W2')
    g.line_through('w23', 'W2', 'W3')
    g.line_through('w34', 'W3', 'W4')
    g.line_through('w41', 'W4', 'W1')

    star = ['pv', 'gx', 'gh', 'w12', 'w23', 'w34', 'w41']
    step('The vertical lines through P and A and the horizontal line through G are sides of the star at Z. '
         'Turn them and the four lines of the last step round O by 90°, three times. '
         'Four stars now turn round O.', 'ruler')
    turned = g.repeat('zr', star, 'rot4')

    step('Draw the line through O that halves the angle AOF. '
         'Draw a circle with centre Z through O. It crosses the last line again at K1.', 'ruler', ['Z', 'K1'])
    g.line_bisect('t', 'A', 'O', 'F')
    g.circle_through('co', 'Z', 'O')
    k = 2 * ZX * math.cos(math.radians(22.5)) + 2 * ZY * math.sin(math.radians(22.5))
    g.meet('K1', 'co', 't', (k * math.cos(math.radians(22.5)), k * math.sin(math.radians(22.5))))

    step('Draw a line through O at 90° to the line through O and K1. '
         'Draw a circle with centre O through K1. It crosses the two lines at K2, K3 and K4.',
         'compass', ['K1'])
    cm.steps[-1]['textWithoutHelpers'] = ('Draw a circle with centre O through K1. '
                                          'K2, K3 and K4 lie on it, each a quarter turn on from the last.')
    g.line_perp('tp', 'O', 't')
    g.circle_through('ckk', 'O', 'K1')
    for i, nm, ln in ((1, 'K2', 'tp'), (2, 'K3', 't'), (3, 'K4', 'tp')):
        a = math.radians(22.5 + 90 * i)
        g.meet(nm, 'ckk', ln, (k * math.cos(a), k * math.sin(a)))

    step('Draw a line through K1 parallel to line OF. Turn it round O by 90°, three times. '
         'The four lines run through K1, K2, K3 and K4.', 'ruler', ['K1'])
    g.line_par('kd', 'K1', 'd45')
    g.repeat('kdr', ['kd'], 'rot4')

    step('The circle with centre E crosses the vertical line through A at N. '
         'Draw a horizontal line through N. Draw a line through N parallel to the line through W1 and W2. '
         'The vertical line through P crosses the line through W1 and W2 at M. Draw a horizontal line through M. '
         'Turn the three lines round O by 90°, three times.', 'ruler', ['N', 'M'])
    g.meet('N', 'ck', 'gx', (1, 1 - R))
    g.line_par('nh', 'N', 'h')
    g.line_par('nd', 'N', 'w12')
    g.meet('M', 'pv', 'w12', (R, 2 * R))
    g.line_par('mh', 'M', 'h')
    g.repeat('nr', ['nh', 'nd', 'mh'], 'rot4')
    if os.environ.get('FIND'):
        import find_crossings
        tile = [el[k][1] for k in ('K1', 'K2', 'K3', 'K4')]
        segs = []
        for Q in drawing(os.environ['FIND']):
            if max(abs(v) for q in Q for v in q) > 3:
                continue
            for i in range(len(Q)):
                cs = clip_poly((Q[i], Q[(i + 1) % len(Q)]), tile)
                if cs:
                    segs.append([cs[0], cs[1]])
        find_crossings.report(segs, hcell=1.5, reach=1.5)
        sys.exit()


# ---- the drawing, clipped to the tilted tile ---------------------------------

def drawing(pieces):
    c, s = math.cos(math.radians(TURN)), math.sin(math.radians(TURN))
    polys = cm.frame_pieces(pieces, ORIGIN, 2 * UNIT, BAND)
    return [[(x * c - y * s, x * s + y * c) for x, y in Q] for Q in polys]


def clip_poly(seg, poly):
    (a, b) = seg
    t0, t1 = 0.0, 1.0
    d = (b[0] - a[0], b[1] - a[1])
    for i in range(len(poly)):
        p, q = poly[i], poly[(i + 1) % len(poly)]
        n = (-(q[1] - p[1]), q[0] - p[0])
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


def network(polys, tile):
    segs = set()
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > 3:
            continue
        for i in range(len(Q)):
            cs = clip_poly((Q[i], Q[(i + 1) % len(Q)]), tile)
            if not cs:
                continue
            a, b = cs
            sa, sb = snap(a, tile), snap(b, tile)
            assert sa and sb, ('corner off the construction', a, b, sa, sb)
            if math.dist(sa, sb) > 1e-6:
                segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


def on_side(p, tile):
    for i in range(4):
        a, b = tile[i], tile[(i + 1) % 4]
        cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
        if abs(cr) / math.dist(a, b) < 1e-7:
            return True
    return False


def snap(p, tile, tol=0.006):
    s = cm.snap(p, tol)
    if s:
        return s
    # a point on the tile's side: the nearest crossing of a line with the side
    for n in cm.lines():
        if cm.on_line(p, n, tol):
            for i in range(4):
                a, b = tile[i], tile[(i + 1) % 4]
                (q, u) = el[n][1]
                e = (b[0] - a[0], b[1] - a[1])
                det = u[0] * (-e[1]) - u[1] * (-e[0])
                if abs(det) < 1e-12:
                    continue
                t = ((a[0] - q[0]) * (-e[1]) - (a[1] - q[1]) * (-e[0])) / det
                x = (q[0] + t * u[0], q[1] + t * u[1])
                if math.dist(x, p) < tol:
                    return x
    return None


def along(segs, tile):
    order = {n: i for i, n in enumerate(el)}
    runs = {}
    for a, b in segs:
        ls = [n for n in cm.lines() if cm.on_line(a, n) and cm.on_line(b, n)]
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
                cands = [m for m in cm.lines() if m != n and cm.on_line(p, m)
                         and abs(el[m][1][1][0] * u[1] - el[m][1][1][1] * u[0]) > 1e-6]
                if cands:
                    ends.append(min(cands, key=order.get))
                else:
                    assert on_side(p, tile), ('run end on no crossing line', n, p)
                    ang = math.degrees(math.atan2(p[1], p[0])) % 360
                    ends.append({'cross': 'tile', 'pick': {'angle': round(ang, 1)}})
            paths.append({'along': n, 'from': ends[0], 'to': ends[1]})
    return paths


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tile = [el[k][1] for k in ('K1', 'K2', 'K3', 'K4')]
    segs = network(drawing(pieces), tile)
    paths = along(segs, tile)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', len([n for n in cm.lines() if n not in used]), 'of', len(cm.lines()))
    tut = {
        'format': 0, 'id': 'fatehpur-sikri-stars',
        'title': 'Interlaced stars of Rajah Birbal’s house, Fatehpur Sikri',
        'short': 'Fatehpur Sikri stars', 'subtitle': 'Rajah Birbal’s house, Fatehpur Sikri', 'fold': 4, 'star': 8,
        'chiral': True, 'style': 'Mughal', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s IND01 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction. Every line is a side of a star of two '
                    'squares, carried on. Four stars turn round O; the line through Z that halves the angle W2ZQ '
                    'is a mirror of the pattern, which gives the stars that turn the other way round each corner '
                    'of the tile. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines, turned by 22.5° so that the '
                       'stars stand upright. No photo of the house was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data175/IND01: Fatehpur Sikri', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data175/IND01.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Andreas Volwahsen, Islamisches Indien '
                     '(Fribourg, 1991), page 31 (a carved pilaster of Rajah Birbal’s house, Fatehpur Sikri, 1571), '
                     'and lists the same design in the Tashkent scrolls (Gülru Necipoğlu, The Topkapı Scroll, '
                     'figure 12). The construction is ours.'}],
        'given': {'O': 'The centre round which four stars turn.',
                  'A': 'A point that sets the size: the stars’ points lie √2 − 1 from their centres.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange: the sides of the stars, carried on until they reach '
                        'another star. They close the eight-sided pieces and the pentagons.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the tilted square tile side by side. Four stars turn one way round each '
                            'centre and the other way round each corner.',
                    'palette': 'Timurid tile', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.402): ('star', 'a'), (8, 0.101): ('eight', 'b'), (5, 0.056): ('pentagon', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)

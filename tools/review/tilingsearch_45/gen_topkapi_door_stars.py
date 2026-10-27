#!/usr/bin/env python3
"""TOP1 (Tiling Search data198/TOP1, a door of the Topkapı Palace, Istanbul;
Broug, Islamic Geometric Design, figure 5.94), ten-fold batch T4,
27 October 2026.

Reading the drawing: pieces drawn edge to edge (red and white), pmm,
repeating on a rectangle 245.87 by 756.71 pt. Ten-pointed stars (points at
radius R = 27.49 pt, inner corners at R tan 36°) sit at the half-turn centres
where the mirrors cross, in rows; O is a star's centre and OA = R (A a point
of the star), so the star's sides are the ten chords AD, BE, … of the circle
divided into ten. Every edge runs at a multiple of 36°. The cell is
|x| <= 2√5, |y| <= 10 tan 54°.

Use: gen_topkapi_door_stars.py lab <TOP1-pieces.json>
     gen_topkapi_door_stars.py <TOP1-pieces.json> tutorials/topkapi-door-stars.json
     gen_topkapi_door_stars.py finish <dump.json> tutorials/topkapi-door-stars.json
"""
import json
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
import snap10_t1 as s1  # noqa: E402
import snap10_t2 as s2  # noqa: E402
import snap10_t4 as s4  # noqa: E402
from common import g, step  # noqa: E402

ORIGIN, UNIT = (297.947, 372.376), 27.4894
R5 = math.sqrt(5)
PHI = (1 + R5) / 2
HX = 2 * R5
HY = 10 * math.tan(math.radians(54))
LET = s2.LETTERS
s4.SYM['rot2'] = True


def drawing(pieces):
    polys = s1.frame(pieces, ORIGIN, UNIT, 0.0)
    return [[(x + i * 2 * HX, y + j * 2 * HY) for x, y in Q] for Q in polys for i in (-1, 0, 1) for j in (-1, 0, 1)]


def star():
    step('Draw a straight line through A and D, B and E, and C and F. '
         'Draw a straight line through D and G, E and H, and F and J. '
         'Draw a straight line through G and K, H and A, J and B, and K and C. '
         'These ten lines make the ten-pointed star.', 'ruler')
    for i in range(10):
        a, b = LET[i], LET[(i + 3) % 10]
        nm = f's{a}{b}'
        g.line_through(nm, a, b)
        s2.DESC[nm] = f'line {a}{b}'


def seeds():
    s2.opening()
    s2.radial(['B', 'C', 'D', 'E'])
    s2.DESC['m'] = 'the line through Y1 and Y2'
    star()


def reset():
    cm.el.clear()
    cm.steps.clear()
    s2.LINES.clear()
    s2.REF.clear()
    s2.DESC.clear()


def search(pieces, verbose=False):
    seeds()
    polys = drawing(pieces)
    entries = s4.plan(polys, HX, HY, tol=float(os.environ.get('TOL', 1e-3)), verbose=verbose, helpers=True,
                      htol=float(os.environ.get('TOL', 1e-3)))
    return entries, s2.missing(s2.need(polys, HX, HY))


def exact(o):
    """o/sin 36° as a + b√5 when it is one, else None."""
    v = o / math.sin(math.radians(36))
    for b in range(-60, 61):
        a = v - b * R5
        if abs(a - round(a)) < 1e-7:
            return round(a), b
    return None


def lab():
    entries, left = search(sys.argv[2], True)
    print(len(entries), 'plan lines;', len(left), 'missing')
    for nm in cm.lines():
        (q, u) = cm.el[nm][1]
        k, o = s2.key_of(q, u)
        if k % 2 and exact(o) is None:
            print('not exact', nm, k * 18, o)



def up(t):
    return t[0].upper() + t[1:]


def on(fixed, axis, val):
    """A crossing of two drawn lines (no turned copies) with coordinate
    `axis` equal to val, nearest the middle."""
    L = [n for n in cm.lines() if '@' not in n]
    best = None
    for i, a in enumerate(L):
        for b in L[i + 1:]:
            for p in cm.crossings(a, b):
                if abs(p[axis] - val) < 1e-7 and abs(p[1 - axis]) <= fixed:
                    sc = abs(p[1 - axis]) - 0.001 * (p[1 - axis] > 0)
                    if best is None or sc < best[0]:
                        best = (sc, a, b, p)
    return best[1:]


def tile():
    a1, b1, t1 = on(HY, 0, HX)
    a2, b2, t2 = on(HX, 1, HY)
    step(up(s4.describe(a1)) + ' crosses ' + s4.describe(b1) + ' at T. Draw a vertical line through T. ' +
         up(s4.describe(a2)) + ' crosses ' + s4.describe(b2) + ' at U. Draw a horizontal line through U. '
         'They cross at K1. Turn the two new lines round O by 180°. '
         'They make the tile, with corners K1, K2, K3 and K4.')
    g.meet('T', a1, b1, t1)
    g.meet('U', a2, b2, t2)
    g.line_par('side', 'T', 'v')
    g.line_par('top', 'U', 'h')
    g.meet('K1', 'side', 'top', (HX, HY))
    g.repeat('frame', ['top', 'side'], 'rot2')
    g.meet('K2', 'side@1', 'top', (-HX, HY))
    g.meet('K3', 'side@1', 'top@1', (-HX, -HY))
    g.meet('K4', 'side', 'top@1', (HX, -HY))


def build(pieces):
    entries, left = search(pieces)
    assert not left, left
    reset()
    seeds()
    s4.write_plan(entries, size=int(os.environ.get('SIZE', 5)))
    tile()
    without()


TURN = 'Turn all of them round O by 180°.'


def without():
    """Texts for the steps whose helper lines (or some of their copies) the
    player hides when helper lines are off (listed by hidden_t2.sh)."""
    def sub(i, old, new):
        t = cm.steps[i - 1].get('textWithoutHelpers', cm.steps[i - 1]['text'])
        assert old in t, (i, old)
        cm.steps[i - 1]['textWithoutHelpers'] = t.replace(old, new)
    od = 'Draw a line through %s parallel to line OD. '
    sub(11, TURN, 'Turn all of them round O by 180°, except the line through P13 and its mirror image.')
    sub(15, TURN, 'Turn all of them round O by 180°, except the line through P33 and its mirror image.')
    sub(17, od % 'P42', '')
    sub(17, TURN, 'Turn all of them round O by 180°, except the line through P40 and its mirror image. '
        'Reflect a line through P42 parallel to line OD in the vertical line through O.')
    sub(18, od % 'P44', '')
    sub(18, TURN, TURN + ' Turn a line through P44 parallel to line OD round O by 180°. '
        'Reflect the turned line in the horizontal line through O.')


SPEC = {
    'id': 'topkapi-door-stars', 'title': 'Ten-pointed stars of a Topkapı Palace door, Istanbul',
    'short': 'Topkapı door stars', 'subtitle': 'Door, Topkapı Palace, Istanbul',
    'code': 'TOP1', 'folder': 'data198', 'style': 'Ottoman', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a ten-pointed star.',
              'A': 'A point of the star, to the right of O.'},
    'note': 'The finished design was read from Wichmann’s TOP1 drawing, whose pieces are drawn edge to edge. '
            'O is the centre of a ten-pointed star whose sides are the ten lines AD, BE, CF and on round, and '
            'OA is the radius of its points. The repeat is a rectangle of half-sides 2√5 and 10 tan 54° (in OA), '
            'with stars at its centre and corners and on rows between. Every line runs at a multiple of 36°, '
            'and every offset is sin 36° times a + b√5 with whole numbers a and b (drawing within 0.0002 of OA).',
    'changes': 'Wichmann draws the pieces red and white; our colours keep his red pieces in the warm slots and his white '
               'ones in the light slots. No photograph was checked.',
    'references': 'His reference is Eric Broug, Islamic Geometric Design (Thames & Hudson, 2013), page 160, '
                  'figure 5.94 (a door of the Topkapı Palace, Istanbul).',
    'ink': 'Ink the lines picked out in orange. They close the stars, the pentagons and the pieces between them.',
    'repeat': 'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at each '
              'corner of every tile.',
}
NAMES = {(14, 2.959): ('fourteen', 'a'), (20, 2.245): ('star', 'c'), (10, 1.98): ('ten_sided', 'a'),
         (9, 1.439): ('nine_sided', 'a'), (6, 1.314): ('hexagon', 'ground'), (5, 1.255): ('pentagon', 'b'),
         (6, 1.229): ('long_hexagon', 'ground'), (8, 1.123): ('eight_sided', 'd'),
         (6, 0.984): ('red_hexagon', 'd'), (6, 0.78): ('bowtie', 'a'), (6, 0.588): ('small_hexagon', 'd'),
         (4, 0.555): ('rhombus', 'c'), (4, 0.363): ('dart', 'd')}
SMALL = ('dart',)


def run():
    if sys.argv[1] == 'finish':
        d = json.load(open(sys.argv[2]))
        for t in d['types']:
            print((t['vertices'], round(t['area'], 3)), t['perCell'], t['sliver'])
        if NAMES:
            cm.finish(sys.argv[2], sys.argv[3], NAMES)
            tut = json.load(open(sys.argv[3]))
            for piece in tut['expect']['pieces']:
                if piece['name'] in SMALL:
                    piece['small'] = True
            cm.write(tut, sys.argv[3])
        return
    pieces, out = sys.argv[1:3]
    build(pieces)
    spec = SPEC
    polys = drawing(pieces)
    paths = cm.along_ink(cm.network(polys, hcell=HX, vcell=HY, reach=3 * max(HX, HY)))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    cm.put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': spec['id'], 'title': spec['title'], 'short': spec['short'],
        'subtitle': spec['subtitle'], 'fold': 2, 'star': 10, 'style': spec['style'], 'level': 'advanced',
        'given': spec['given'],
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': spec['note'] + ' The drawing gives no steps; we devised the construction.',
            'changes': 'The compass steps, their order and the named points are ours. ' + spec['changes'],
            'reviewed': '2026-10-27'},
        'credits': [{
            'source': f"Tiling Search, {spec['folder']}/{spec['code']}: Topkapi Palace door",
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': f"https://tilingsearch.mit.edu/HTML/{spec['folder']}/{spec['code']}.html",
            'note': 'Read from his finished drawing, not construction instructions. ' + spec['references']}],
        'steps': cm.steps,
        'ink': {'text': spec['ink'], 'paths': paths},
        'pattern': {'cell': 'tile', 'palette': spec['palette'], 'look': 'tiles', 'colors': {},
                    'text': spec['repeat']},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    if os.path.exists(out):
        old = json.load(open(out))
        if old.get('expect', {}).get('pieces', [{}])[0].get('name') != 'x':
            tut['expect'] = old['expect']
            tut['pattern']['colors'] = old['pattern'].get('colors', {})
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')


if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        run()

#!/usr/bin/env python3
"""MIR1 (Tiling Search data214/MIR1, Çamlıca mosque, Istanbul, Wichmann's
completion of a window shutter), ten-fold batch T4, 27 October 2026.

Reading the drawing: pieces drawn edge to edge, pmg, repeating on a
rectangle 402.87 by 523.61 pt. Shallow ten-pointed stars (points at radius R,
inner corners at 0.85 R) sit on the horizontal mirrors, two to a cell; the
half turns are at the small blue octagons between them. O is a star's centre
on a mirror and OA = R = 47.553 pt (A a point of the star), so the star's
sides are the ten chords AC, CE, … of the circle divided into ten (two
pentagons). Every edge runs at an odd multiple of 18°, and every line offset
is (a + b√5)/20 exactly, within 0.0016 of OA of the drawing (after fitting O
and OA). The cell is |x| <= 2 + √5, |y| <= φ/sin 36°; the other star of the
cell sits at (2φ, φ/sin 36°), the half turn at X = (φ, φ/(2 sin 36°)).

The plan is snap10_t2's greedy search with mirror copies only (fold 1,
snap10_t4), with helper lines where no missing line runs through a crossing.

Use: gen_camlica_mosque_stars.py lab <MIR1-pieces.json>
     gen_camlica_mosque_stars.py <MIR1-pieces.json> tutorials/camlica-mosque-stars.json
     gen_camlica_mosque_stars.py finish <dump.json> tutorials/camlica-mosque-stars.json
"""
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

ORIGIN, UNIT = (23.394, 241.487), 47.553
R5 = math.sqrt(5)
PHI = (1 + R5) / 2
HX = 2 + R5
HY = 2 * PHI / math.sin(math.radians(36))


def drawing(pieces):
    """The drawing's pieces in the frame, with their copies one repeat
    left and right (the page starts just left of O)."""
    polys = s1.frame(pieces, ORIGIN, UNIT, 0.0)
    return [[(x + i * 2 * HX, y + j * 2 * HY) for x, y in Q] for Q in polys for i in (-1, 0, 1) for j in (-1, 0, 1)]


def seeds():
    s2.opening()
    s4.pentagons()
    s2.radial(['B', 'C', 'D', 'E'])
    s2.DESC['m'] = 'the line through Y1 and Y2'


def reset():
    cm.el.clear()
    cm.steps.clear()
    s2.LINES.clear()
    s2.REF.clear()
    s2.DESC.clear()


def search(pieces):
    seeds()
    polys = drawing(pieces)
    entries = s4.plan(polys, HX, HY, tol=2e-3, helpers=True, verbose='lab' in sys.argv)
    assert not s2.missing(s2.need(polys, HX, HY))
    return entries


def up(t):
    return t[0].upper() + t[1:]


def tile():
    t = (HX, 0)
    tl = [n for n in cm.lines() if cm.on_line(t, n) and n != 'h'][0]
    old = g.named_at(t)
    k1 = [n for n in cm.lines() if cm.on_line((HX, HY), n)][0]
    first = ('Draw a vertical line through %s. ' % old) if old else \
        ('%s crosses the horizontal line through O at T. Draw a vertical line through T. ' % up(s4.describe(tl)))
    step(first + 'It crosses ' + s4.describe(k1) + ' at K1. Draw a horizontal line through K1. '
         'Turn the two new lines round O by 180°. They make the tile, with corners K1, K2, K3 and K4.')
    if not old:
        g.meet('T', tl, 'h', t)
    g.line_par('side', old or 'T', 'v')
    g.meet('K1', 'side', k1, (HX, HY))
    g.line_par('top', 'K1', 'h')
    g.repeat('frame', ['top', 'side'], 'rot2')
    g.meet('K2', 'side@1', 'top', (-HX, HY))
    g.meet('K3', 'side@1', 'top@1', (-HX, -HY))
    g.meet('K4', 'side', 'top@1', (HX, -HY))


def build(pieces):
    entries = search(pieces)
    reset()
    seeds()
    s4.write_plan(entries, size=int(os.environ.get('SIZE', 5)))
    tile()


def lab():
    entries = search(sys.argv[2])
    print(len(entries), 'plan lines')


SPEC = {
    'id': 'camlica-mosque-stars', 'title': 'Ten-pointed stars of the Çamlıca mosque shutter, Istanbul',
    'short': 'Çamlıca mosque stars', 'subtitle': 'Çamlıca mosque, Istanbul, a completed window shutter',
    'code': 'MIR1', 'folder': 'data214', 'style': 'Ottoman', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a ten-pointed star, on a horizontal mirror of the pattern.',
              'A': 'A point of the star, to the right of O, on that mirror.'},
    'note': 'The finished design was read from Wichmann’s MIR1 drawing, whose pieces are drawn edge to edge. '
            'O is the centre of a ten-pointed star whose sides are the ten lines AC, CE, … and BD, DF, …: two '
            'regular pentagons. The pattern has mirrors through the stars and half turns between them, but no '
            'half turn about a star, so it is checked by its mirror only. The repeat is a rectangle of '
            'half-sides 2 + √5 and φ/sin 36° (in OA, φ the golden ratio), with a second star on its top and '
            'bottom sides. Every line runs at an odd multiple of 18°, and every offset is (a + b√5)/20 '
            '(drawing within 0.0016 of OA).',
    'changes': 'Wichmann marks this drawing as his possible completion of a partial panel, a window shutter of '
               'the Çamlıca mosque; we build the completed pattern his drawing shows. His drawing of the shutter '
               'itself (MIR11, data213), a strip that repeats only along its length, lies exactly on our lines: '
               'every one of its edges is an edge of the completion. Colours follow the shapes. '
               'No photograph was checked.',
    'references': 'His reference is a drawing sent by Mirosław Majewski (Çamlıca mosque, Istanbul, Turkey: '
                  'a possible completion).',
    'ink': 'Ink the lines picked out in orange. They close the stars, the pentagons and the pieces between them.',
    'repeat': 'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre of every '
              'tile and halfway along its top and bottom sides.',
}
NAMES = {(20, 2.629): ('star', 'c'), (10, 0.75): ('ten_sided', 'ground'), (8, 0.727): ('octagon', 'c'),
         (5, 0.476): ('pentagon', 'b'), (6, 0.465): ('hexagon', 'd'), (6, 0.295): ('bowtie', 'a'),
         (4, 0.162): ('kite', 'a')}
SMALL = ('kite',)


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
        'subtitle': spec['subtitle'], 'fold': 1, 'star': 10, 'style': spec['style'], 'level': 'advanced',
        'given': spec['given'],
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': spec['note'] + ' The drawing gives no steps; we devised the construction.',
            'changes': 'The compass steps, their order and the named points are ours. ' + spec['changes'],
            'reviewed': '2026-10-27'},
        'credits': [{
            'source': f"Tiling Search, {spec['folder']}/{spec['code']}: Camlica Mosque, Istanbul - Completion?",
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

#!/usr/bin/env python3
"""SM6 (Tiling Search data206/SM6, Friday Mosque, Fatehpur Sikri; E. W.
Smith, The Moghul Architecture of Fathpur-Sikri, part 4, plate XXVII),
ten-fold batch T2. SM28 (same plate) is the same design with a smaller
decagon and no ring of pentagons: gen_fatehpur_masjid_small_decagons.py
builds it as this tutorial's variant, sharing the opening.

Reading the drawing (27 October 2026): pieces drawn edge to edge (the red
bands are strokes over the edges, not gaps). cmm: decagons of side 30 pt on a
centred rectangular lattice, 298.8 pt across and 205.6 pt up to the next
row's decagon. O at the decagon (294.34, 366.63) pt; OA is the decagon's
inradius (46.165 pt), so its sides touch the circle through A at A, B, C, ….
Every edge's normal is at a multiple of 36°, and every line is, about some
decagon centre, at offset 0 (through the centre), 1 (a side of the decagon)
or φ = (1 + √5)/2: through O, offsets 0, ±1, ±φ, ±2φ, ±(φ + 2), ±φ³ (drawing
within 0.001 of OA). The cell is the rectangle |x| <= 2φ, |y| <= 2φ tan 54°
with decagons at its centre and its corners.
Use: gen_fatehpur_masjid_decagons.py lab <pieces.json>
     gen_fatehpur_masjid_decagons.py <pieces.json> tutorials/fatehpur-masjid-decagons.json
     gen_fatehpur_masjid_decagons.py finish <dump.json> <tutorial.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
import snap10_t2 as s10  # noqa: E402
from common import g, step  # noqa: E402

ORIGIN, UNIT = (294.34, 366.63), 46.165
R5 = math.sqrt(5)
PHI = (1 + R5) / 2
HX, HY = 2 * PHI, 2 * PHI * math.tan(math.radians(54))


def drawing(pieces, origin=ORIGIN):
    polys = cm.frame_pieces(pieces, origin, 2 * UNIT, 0)
    return polys + [[(-x, y) for x, y in Q] for Q in polys]


def seeds():
    s10.opening()
    s10.star_lines('Draw a line through A at 90° to the horizontal line. Turn it round O by 36°, nine times. '
                   'These ten lines touch the circle at A, B, C and on round. They make the decagon.')
    step('Turn the vertical line round O by 36°, four times. '
         'These four lines and the vertical line run through the corners of the decagon.')
    # the vertical line exists: its turns by 36° are the other four
    g.cur['create']['vr'] = {'repeat': {'of': ['v'], 'by': 'rot10', 'distinct': True}}
    for i in range(1, 5):
        t = math.radians(90 + 36 * i)
        cm.el[f'v@{i}'] = ('line', ((0.0, 0.0), (math.cos(t), math.sin(t))))
    s10.DESC.update({'v@1': 'the line through O at 126°', 'v@2': 'the line through O at 162°',
                     'v@3': 'the line through O at 18°', 'v@4': 'the line through O at 54°'})
    step('The lines through A and D cross at P. The lines through C and K cross at Q. '
         'Draw a straight line through P and Q. Turn it round O by 36°, nine times. '
         'These ten lines make the outer ring.',
         'ruler', ['A', 'D', 'C', 'K'])
    g.meet('P', 't', 't@3', (1, 1 / math.tan(math.radians(36))))
    g.meet('Q', 't@2', 't@9', (PHI, 0.5257311))
    g.line_through('f', 'P', 'Q')
    g.repeat('fr', ['f'], 'rot10')
    for j in range(10):
        s10.DESC['f' if j == 0 else f'f@{j}'] = 'line PQ' if j == 0 else 'a line of the outer ring'


def lab():
    seeds()
    polys = drawing(sys.argv[2])
    nd = s10.need(polys, HX, HY)
    print('needed', len(nd), sorted((k[0] * 18, round(k[1], 4)) for k, _ in nd))
    print(s10.plan(polys, HX, HY, reach=float(os.environ.get('REACH', 1.01)), tol=2e-3))


def par(name, point, ref, k):
    g.line_par(name, point, ref)
    return (name, point, k)


T54 = math.tan(math.radians(54))


def build():
    seeds()
    rest()
    cm.steps[8]['textWithoutHelpers'] = (
        'The line through C crosses the horizontal line at P1. Draw a vertical line through P1. '
        'It crosses the line through O at 54° at K1. Turn the vertical line round O by 180°. '
        'K1, K2, K3 and K4 are the corners of the tile.')


def rest():
    step('The line through C crosses the horizontal line at P1. Draw a vertical line through P1. '
         'It crosses the line through O at 54° at K1. Draw a horizontal line through K1. '
         'Turn both new lines round O by 180°. The four lines make the tile, with corners K1, K2, K3 and K4.')
    g.meet('P1', 'h', 't@2', (2 * PHI, 0))
    g.line_par('side', 'P1', 'v')
    g.meet('K1', 'side', 'v@4', (HX, HY))
    g.line_par('top', 'K1', 'h')
    g.repeat('frame', ['side', 'top'], 'rot2')
    g.meet('K2', 'side@1', 'top', (-HX, HY))
    g.meet('K3', 'side@1', 'top@1', (-HX, -HY))
    g.meet('K4', 'side', 'top@1', (HX, -HY))
    S36 = 1 / math.sin(math.radians(36))
    step('The right side of the tile crosses line PQ at P2, and the mirror image of line PQ at P3. '
         'Draw a line through P2 parallel to the line through E. '
         'Draw a line through P3 parallel to the line through B. '
         'Turn both new lines round O by 180°.')
    g.meet('P2', 'side', 'f', (2 * PHI, -S36))
    g.meet('P3', 'side', 'f@8', (2 * PHI, S36))
    s10.copies('c1', [par('m1', 'P2', 't@4', 8), par('m1x', 'P3', 't@1', 2)])
    step('The lines through A and E cross at P4. Draw a line through P4 parallel to the line through C. '
         'It crosses line PQ at P5. Draw a line through P5 parallel to the line through D. '
         'It crosses the line through A at P6. Draw a line through P6 parallel to the line through C. '
         'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.')
    g.meet('P4', 't', 't@4', (1, 2 * PHI * math.sin(math.radians(72))))
    new = [par('m2', 'P4', 't@2', 4)]
    g.meet('P5', 'm2', 'f', (-1 / PHI, 3.6034146))
    new += [par('m3', 'P5', 't@3', 6)]
    g.meet('P6', 'm3', 't', (1, 4.1291456))
    new += [par('m4', 'P6', 't@2', 4)]
    s10.copies('c2', new)
    step('The line through O at 54° crosses the line through P3 parallel to the line through B at P7. '
         'Draw a vertical line through P7. '
         'The right side of the tile crosses the line through K at P8. '
         'Draw a line through P8 parallel to the line through B. '
         'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.')
    g.meet('P7', 'v@4', 'm1x', (R5, 3.0776835))
    new = [par('m5', 'P7', 'v', 0)]
    g.meet('P8', 't@9', 'side', (2 * PHI, 2.7527638))
    new += [par('m6', 'P8', 't@1', 2)]
    s10.copies('c3', new)

SPEC = {
    'id': 'fatehpur-masjid-decagons', 'title': 'Decagons and pentagons of the Friday Mosque, Fatehpur Sikri',
    'short': 'Fatehpur Sikri decagons', 'subtitle': 'Friday Mosque, Fatehpur Sikri, India',
    'code': 'SM6', 'folder': 'data206', 'cell': (HX, HY), 'style': 'Mughal', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a decagon.',
              'A': 'A point to the right of O. The decagon’s sides touch the circle through A.'},
    'note': 'The finished design was read from Wichmann’s SM6 drawing, whose pieces are drawn edge to edge. '
            'O is the centre of a regular decagon and OA its inradius. The decagons sit at the centre and the '
            'corners of a rectangle of half-sides 2φ and 2φ tan 54° (in OA, φ the golden ratio). Every line runs '
            'parallel to a side of the decagon, and, about some decagon’s centre, passes through it, along a side '
            'or at φ from it (drawing within 0.001 of OA).',
    'changes': 'Colours follow the shapes: Wichmann draws the kites dark green and the rest white, with the '
               'lines as red bands. No photograph was checked.',
    'references': 'His reference is E. W. Smith, The Moghul Architecture of Fathpur-Sikri, part 4 (1896), '
                  'plate XXVII (Friday Mosque). He notes that Bourgoin’s plate 175 is the same pattern without '
                  'some ornament.',
    'ink': 'Ink the lines picked out in orange. They close the decagons, the pentagons and the kites.',
    'repeat': 'Put copies of the rectangular tile side by side. A decagon sits at the centre and at each corner '
              'of every tile.',
}
NAMES = {(10, 3.249): ('decagon', 'c'), (5, 1.902): ('pentagon', 'ground'), (5, 1.453): ('pentagon_short', 'd'),
         (5, 0.727): ('ring_pentagon', 'a'), (4, 0.65): ('kite', 'b')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)

#!/usr/bin/env python3
"""SM28 (Tiling Search data206/SM28, Friday Mosque, Fatehpur Sikri; the same
plate of Smith as SM6), ten-fold batch T2: SM6's design with a smaller
decagon and no ring of pentagons round it, built as the variant of
`fatehpur-masjid-decagons` (gen_fatehpur_masjid_decagons.py), sharing its
opening, its outer ring and its tile.

Reading the drawing (27 October 2026): the same lattice as SM6 (298.8 pt
across), O at the decagon (295.28, 367.93) pt and the same unit (46.165 pt,
SM6's decagon inradius). Every line is SM6's but for the decagons: their
sides are at 0.6994 ± 0.0004 of OA from the centre (0.7 of SM6's; the
corner decagon's at 2φ² − that), and the lines along SM6's decagon sides
are gone. No crossing of the design gives 0.6994: the small decagon's sides
are drawn through W, where two circles of the opening cross (the circle
with centre M through N and the circle with centre D), at 0.69928 of OA.
Use: gen_fatehpur_masjid_small_decagons.py lab <pieces.json>
     gen_fatehpur_masjid_small_decagons.py <pieces.json> tutorials/fatehpur-masjid-small-decagons.json
     gen_fatehpur_masjid_small_decagons.py finish <dump.json> <tutorial.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
import gen_fatehpur_masjid_decagons as big  # noqa: E402
import snap10_t2 as s10  # noqa: E402
from common import g, step  # noqa: E402

ORIGIN = (295.28, 367.93)
HX, HY = big.HX, big.HY


def drawing(pieces):
    return big.drawing(pieces, ORIGIN)


RHO = 0.6992761  # set exactly from W in seeds()


def dn(j):
    j %= 10
    return 'd' if j == 0 else f'd@{j}'


def seeds():
    big.seeds(small=True)
    big.tile()
    step('The circle with centre M crosses the circle with centre D at W. '
         'Draw a line through W parallel to the line through B. Turn it round O by 36°, nine times. '
         'These ten lines make the small decagon, with corners V1 to V10.', 'ruler', ['M', 'D'])
    g.meet('W', 'cM', 'cF3', (0.2883951, 0.7927378))
    g.line_par('d', 'W', 't@1')
    g.repeat('dr', ['d'], 'rot10')
    global RHO
    w = g.P('W')
    RHO = w[0] * math.cos(math.radians(36)) + w[1] * math.sin(math.radians(36))
    r = RHO / math.cos(math.radians(18))
    for i in range(10):
        t = math.radians(18 + 36 * i)
        g.meet(f'V{i + 1}', dn(i - 1), dn(i), (r * math.cos(t), r * math.sin(t)))


def par(name, point, ref, k):
    g.line_par(name, point, ref)
    return (name, point, k)


def build():
    seeds()
    PHI, S36 = big.PHI, 1 / math.sin(math.radians(36))
    step('The right side of the tile crosses line PQ at P2, and the mirror image of line PQ at P3. '
         'Draw a line through P2 parallel to the line through E. '
         'Draw a line through P3 parallel to the line through B. '
         'Turn both new lines round O by 180°.')
    g.meet('P2', 'side', 'f', (2 * PHI, -S36))
    g.meet('P3', 'side', 'f@8', (2 * PHI, S36))
    s10.copies('c1', [par('m1', 'P2', 't@4', 8), par('m1x', 'P3', 't@1', 2)])
    yw = (RHO - 2 * PHI * math.cos(math.radians(36))) / math.sin(math.radians(36))
    step('The right side of the tile crosses the line through W at P4, and its mirror image at P5. '
         'Draw a line through P4 parallel to the line through E. '
         'Draw a line through P5 parallel to the line through B. '
         'Draw a line through K1 parallel to the line through D. It crosses the new line through P5 at P6. '
         'Draw a vertical line through P6. '
         'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.')
    g.meet('P4', 'side', 'd', (2 * PHI, yw))
    g.meet('P5', 'side', 'd@8', (2 * PHI, -yw))
    new = [par('m2', 'P4', 't@4', 8), par('m2x', 'P5', 't@1', 2), par('m3', 'K1', 't@3', 6)]
    g.meet('P6', 'm3', 'm2x', (2 * PHI - RHO, 4.2268571))
    new += [par('m4', 'P6', 'v', 0)]
    s10.copies('c2', new)
    step('The right side of the tile crosses the line through K at P7. '
         'Draw a line through P7 parallel to the line through C. '
         'The line through K1 parallel to the line through D crosses the line through V4 and V5 at P8. '
         'Draw a line through P8 parallel to the line through C. '
         'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.')
    g.meet('P7', 't@9', 'side', (2 * PHI, 2.7527638))
    new = [par('m5', 'P7', 't@2', 4)]
    g.meet('P8', 'm3', 'd@3', (2.1046148, 4.0864337))
    new += [par('m6', 'P8', 't@2', 4)]
    s10.copies('c3', new)
    cm.steps[5]['textWithoutHelpers'] = (
        'Draw a line through A at 90° to the horizontal line. '
        'Draw a line through each of C, D and K at 90° to its line from O.')
    cm.steps[8]['textWithoutHelpers'] = (
        'The line through C crosses the horizontal line at P1. Draw a vertical line through P1. '
        'It crosses the line through O at 54° at K1. Turn the vertical line round O by 180°. '
        'K1, K2, K3 and K4 are the corners of the tile.')


def lab():
    seeds()
    polys = drawing(sys.argv[2])
    nd = s10.need(polys, HX, HY)
    print('needed', len(nd), sorted((k[0] * 18, round(k[1], 4)) for k, _ in nd))
    print(s10.plan(polys, HX, HY, reach=float(os.environ.get('REACH', 1.01)), tol=2e-3))


SPEC = {
    'id': 'fatehpur-masjid-small-decagons', 'title': 'Small decagons of the Friday Mosque, Fatehpur Sikri',
    'short': 'Fatehpur Sikri small decagons', 'subtitle': 'Friday Mosque, Fatehpur Sikri, India',
    'code': 'SM28', 'folder': 'data206', 'cell': (HX, HY), 'style': 'Mughal', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a decagon.',
              'A': 'A point to the right of O. The lines of the big decagon touch the circle through A.'},
    'note': 'The finished design was read from Wichmann’s SM28 drawing, whose pieces are drawn edge to edge. '
            'It is the design of his SM6 (Fatehpur Sikri decagons) with a smaller decagon and no ring of '
            'pentagons round it, so it shares that tutorial’s opening, outer ring and tile: O is the centre of a '
            'decagon, OA the inradius of SM6’s larger one, and the decagons sit at the centre and the corners of '
            'a rectangle of half-sides 2φ and 2φ tan 54°. Every other line matches the drawing within 0.001 of OA.',
    'changes': 'In the drawing the small decagon’s sides are 0.6994 of OA from its centre (0.7 of SM6’s), a length '
               'no crossing of the design gives. We draw them through W, where two circles of the opening cross, '
               'at 0.6993: the pieces match the drawing within 0.0004 of OA. Colours follow the shapes, not his '
               'drawing (dark green kites, the rest white, red bands). No photograph was checked.',
    'references': 'His reference is E. W. Smith, The Moghul Architecture of Fathpur-Sikri, part 4 (1896), '
                  'plate XXVII (Friday Mosque). He notes that Bourgoin’s plate 175 is the same pattern without '
                  'some ornament, and that SM6 is the version with a ring of pentagons.',
    'ink': 'Ink the lines picked out in orange. They close the decagons, the pentagons and the kites.',
    'repeat': 'Put copies of the rectangular tile side by side. A decagon sits at the centre and at each corner '
              'of every tile.',
}
NAMES = {(10, 1.589): ('decagon', 'c'), (5, 1.902): ('pentagon', 'ground'), (5, 1.453): ('pentagon_short', 'd'),
         (5, 0.893): ('ring_pentagon', 'a'), (4, 0.65): ('kite', 'b')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)

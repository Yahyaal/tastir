#!/usr/bin/env python3
"""E41, Alhambra, Mexuar patio, vestibule ceiling (Tiling Search data208/E41):
sixteen-pointed rosettes on a centred square lattice, eight-pointed stars
between them, all interlaced.

Read from the PDF: bands 6 pt wide, rosettes 257.47 pt apart along each axis
(P, half the spacing of rosettes in a row). Frame: O at a rosette, A at the
eight-pointed star halfway to the next rosette in the row, so OA = P and the
rosettes sit at O and at (±1, ±1); the repeating tile is the square ACBD
with corners on the axes, which holds one rosette.

What fixes the proportions (P = 1, worst error 2e-5 against the drawing):
- every star, the rosettes' sixteen-pointed ones and the eight-pointed ones,
  has its sides at the same distance d from its centre;
- a rosette's ring (sixteen lines at distance r round it) is made of the
  neighbouring rosette's star sides: r + d = F, the distance from O to the
  line through the corner rosette R parallel to the 22.5° ray (F = 0.5412);
- r − d = |AT|, where T, on the cell side AC and the 22.5° ray, is the centre
  of an eight-pointed star turned by 22.5°: |AT| = √2 − 1.
So d = (F − |AT|)/2 = 0.06349 and r = (F + |AT|)/2 = 0.47770. The upright
stars at A have caps at (2√2 − 1)d, the mirror image of the star's side in
its point. No three of the drawing's lines meet in a point, so the
construction marks d with the compass (a midpoint) and carries every family
by turning round O, by mirroring in the tile side AC (O's rosette onto R's)
and with the compass set to d.

Usage: gen_alhambra_mexuar_vestibule_rosettes.py <E41-pieces.json> tutorials/alhambra-mexuar-vestibule-rosettes.json
       pnpm review alhambra-mexuar-vestibule-rosettes
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402

H = math.sqrt(.5)
R2 = math.sqrt(2)
S16 = math.sqrt(2 + R2)
F = S16 * (1 - H)
D0 = (F - (R2 - 1)) / 2
RING = (F + (R2 - 1)) / 2
TAU = 2 * math.sin(math.pi / 8)
ORIGIN, HALF, BAND = (297.6853, 371.9309), 257.4656, 6.0


def dirv(a, r=1.0):
    return (r * math.cos(math.radians(a)), r * math.sin(math.radians(a)))


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    g.circle_through('c', 'O', 'A')
    g.line_through('h', 'O', 'A')

    step('Draw a vertical line through O. It crosses the circle at C, at the top, and D, at the bottom. '
         'The horizontal line crosses the circle at B, on the left. '
         'Draw a vertical line through A. Draw a horizontal line through C. They cross at R. '
         'Draw a straight line through O and R.')
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.meet('D', 'c', 'v', (0, -1))
    g.meet('B', 'c', 'h', (-1, 0))
    g.line_perp('ax', 'A', 'h')
    g.line_perp('cy', 'C', 'v')
    g.meet('R', 'ax', 'cy', (1, 1))
    g.line_through('d45', 'O', 'R')

    step('Draw the line through O that halves the angle AOR. Draw the line through O at 90° to it. '
         'Draw a straight line through A and C. It crosses the first new line at T.')
    g.line_bisect('t1', 'A', 'O', 'R')
    g.line_perp('t3', 'O', 't1')
    g.line_through('ac', 'A', 'C')
    g.meet('T', 'ac', 't1', (H, 1 - H))

    step('Draw a line through R parallel to line OT. It crosses the line through O at 90° to line OT at G. '
         'Draw a circle with centre O and radius AT. It crosses line OG at K.', 'compass')
    g.line_par('rl', 'R', 't1')
    g.meet('G', 'rl', 't3', dirv(112.5, F))
    g.circle_from('ck', 'O', 'A', 'T')
    g.meet('K', 'ck', 't3', dirv(112.5, R2 - 1))

    step('Draw a circle with centre K through G. Draw a circle with centre G through K. '
         'They cross at J1 and J2. Draw a straight line through J1 and J2. It crosses line OG at Q.', 'compass')
    g.circle_through('ckg', 'K', 'G')
    g.circle_through('cgk', 'G', 'K')
    mid = dirv(112.5, RING)
    off = math.sqrt(3) / 2 * (F - (R2 - 1))
    g.meet('J1', 'ckg', 'cgk', (mid[0] + off * math.cos(math.radians(22.5)), mid[1] + off * math.sin(math.radians(22.5))))
    g.meet('J2', 'ckg', 'cgk', (mid[0] - off * math.cos(math.radians(22.5)), mid[1] - off * math.sin(math.radians(22.5))))
    g.line_through('jj', 'J1', 'J2')
    g.meet('Q', 'jj', 't3', mid)

    step('Draw a circle with centre O and radius QG. It crosses line OG at X. '
         'Draw lines through X and through Q at 90° to line OG. Turn them round O by 22.5°, fifteen times.', 'compass')
    g.circle_from('cd', 'O', 'Q', 'G')
    g.meet('X', 'cd', 't3', dirv(112.5, D0))
    g.line_perp('sx', 'X', 't3')
    g.line_perp('sq', 'Q', 't3')
    g.repeat('sr', ['sx', 'sq'], 'rot16')

    step('Draw a circle with centre G and radius OX. It crosses line OG at E, beyond G. '
         'Draw a line through E at 90° to line OG. Turn it round O by 45°, seven times.', 'compass')
    g.circle_from('ce', 'G', 'O', 'X')
    g.meet('E', 'ce', 't3', dirv(112.5, F + D0))
    g.line_perp('se', 'E', 't3')
    g.repeat('ser', ['se'], 'rot8')

    step('Draw a circle with centre T and radius OX. It crosses line OT at U and V. '
         'Draw lines through U and V at 90° to line OT. Turn them round O by 45°, seven times.', 'compass')
    g.circle_from('ct', 'T', 'O', 'X')
    g.meet('U', 'ct', 't1', dirv(22.5, TAU - D0))
    g.meet('V', 'ct', 't1', dirv(22.5, TAU + D0))
    g.line_perp('su', 'U', 't1')
    g.line_perp('sv', 'V', 't1')
    g.repeat('suvr', ['su', 'sv'], 'rot8')

    step('Draw a circle with centre A and radius OX. It crosses line AC at Y, and the horizontal line at N, '
         'left of A. Draw a line through Y parallel to line OR. Draw a vertical line through N. '
         'Turn the two new lines round O by 90°, three times.', 'compass')
    g.circle_from('ca', 'A', 'O', 'X')
    g.meet('Y', 'ca', 'ac', (1 - D0 * H, D0 * H))
    g.meet('N', 'ca', 'h', (1 - D0, 0))
    g.line_par('sy', 'Y', 'd45')
    g.line_perp('sn', 'N', 'h')
    g.repeat('synr', ['sy', 'sn'], 'rot4')

    step('The line through Y crosses the horizontal line at W. Draw a circle with centre W through N. '
         'It crosses the horizontal line at M, left of W. Draw a vertical line through M. '
         'Turn it round O by 90°, three times.', 'compass')
    g.meet('W', 'sy', 'h', (1 - R2 * D0, 0))
    g.circle_through('cw', 'W', 'N')
    g.meet('M', 'cw', 'h', (1 - (2 * R2 - 1) * D0, 0))
    g.line_perp('sm', 'M', 'h')
    g.repeat('smr', ['sm'], 'rot4')

    ring_v = [n for n in cm.lines() if n.startswith('sq') and cm.on_line((RING, 0.3), n) and cm.on_line((RING, -0.3), n)][0]
    step('The ring of sixteen lines round O crosses the horizontal line at P, right of O. '
         'Draw a circle with centre O and radius PA. It crosses line OR at Z. '
         'Draw a line through Z at 90° to line OR. Turn it round O by 90°, three times.', 'compass')
    g.meet('P', ring_v, 'h', (RING, 0))
    g.circle_from('cz', 'O', 'P', 'A')
    g.meet('Z', 'cz', 'd45', ((1 - RING) * H, (1 - RING) * H))
    g.line_perp('sz', 'Z', 'd45')
    g.repeat('szr', ['sz'], 'rot4')


# (vertices, area) -> (name, palette slot, small)
NAMES = {(6, 0.03319): ('petal', 'a', False), (32, 0.03203): ('rosette_star', 'd', False),
         (12, 0.01941): ('twelve', 'c', False), (16, 0.01889): ('star', 'b', False),
         (10, 0.01757): ('ten', 'c', False), (14, 0.01599): ('fourteen', 'a', False),
         (8, 0.01511): ('eight', 'b', False), (6, 0.01443): ('hexagon', 'ground', False),
         (4, 0.00683): ('kite', 'd', False), (4, 0.00334): ('small_kite', 'c', True),
         (4, 0.0017): ('tiny_kite', 'd', True)}
COUNTS = {'petal': 16, 'rosette_star': 1, 'twelve': 6, 'star': 5, 'ten': 16, 'fourteen': 4, 'eight': 4,
          'hexagon': 40, 'kite': 16, 'small_kite': 32, 'tiny_kite': 16}


def tutorial(pieces):
    build()
    cm.snap.__defaults__ = (0.002,)
    polys = cm.frame_pieces(pieces, ORIGIN, 2 * HALF, BAND)
    paths = cm.along_ink(cm.network(polys, hcell=1.0, reach=3, diamond=True))
    step('Join A, C, B and D to mark the tile that repeats.', 'fade')
    cm.put('tile', 'polygon', None, {'polygon': ['A', 'C', 'B', 'D']})
    expect = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm], **({'small': True} if sm else {})}
        for (v, a), (nm, _, sm) in NAMES.items()]} if NAMES else \
        {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}
    return {
        'format': 0, 'id': 'alhambra-mexuar-vestibule-rosettes',
        'title': 'Sixteen-pointed rosettes of the Mexuar vestibule ceiling, Alhambra',
        'short': 'Mexuar vestibule rosettes', 'subtitle': 'Mexuar patio, vestibule ceiling, Alhambra, Granada',
        'given': {'O': 'The centre of a rosette.', 'A': 'The centre of the eight-pointed star halfway to the next rosette.'},
        'fold': 4, 'star': 16, 'style': 'Moroccan', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Wichmann’s E41 drawing, an interlace of bands, by their centre '
                    'lines. Every star, sixteen-pointed or eight-pointed, has its sides at one distance d from its '
                    'centre. A rosette’s ring of sixteen lines is made of the next rosettes’ star sides, and the ring '
                    'lies |AT| further out than the star’s sides, where T is the turned star on the tile’s side. '
                    'These two facts fix d, marked here with the compass as half of KG. No three lines of the '
                    'drawing meet in one point, so every other family is carried by the compass set to d, by turning '
                    'round O, or by the tile’s mirror. The drawing gives no steps; we devised the construction.',
            'changes': 'The compass steps, their order and the named points are ours. The lines are the centre '
                       'lines of the drawing’s bands; the over-and-under weave is drawn by the player’s interlace '
                       'look. No photograph of this ceiling was available to check: the Wade photograph paired with '
                       'E41 in our research (SPA 1917, the Sala del Mexuar dado) shows a different design, with '
                       'narrower sixteen-pointed stars.',
            'reviewed': '2026-10-27'},
        'credits': [{
            'source': 'Tiling Search, data208/E41: Alhambra, Mexuar patio, vestibule ceiling',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data208/E41.html',
            'note': 'Read from his finished drawing, not construction instructions. He cites a photograph by Nick '
                    'Crossling of the vestibule ceiling in the Mexuar patio, and figure 8.5 of Wichmann and Wade, '
                    'Islamic Design: a Mathematical Approach (2017).'}],
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They are the middles of the interlaced bands.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Alhambra', 'look': 'interlace',
                    'colors': {nm: slot for nm, slot, _ in NAMES.values()},
                    'text': 'Put copies of the tile side by side, corner to corner. A rosette sits at the centre of '
                            'every tile, and an eight-pointed star at every corner.'},
        'expect': expect}


if __name__ == '__main__':
    import json
    if sys.argv[1] == 'finish':
        d = json.load(open(sys.argv[2]))
        for t in d['types']:
            print((t['vertices'], round(t['area'], 5)), t['perCell'], t['sliver'])
    else:
        tut = tutorial(sys.argv[1])
        cm.write(tut, sys.argv[2])
        print(len(cm.steps), 'steps;', len(tut['ink']['paths']), 'ink paths')

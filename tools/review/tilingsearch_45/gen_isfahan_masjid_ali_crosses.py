#!/usr/bin/env python3
"""Builds the stars and crosses of the Masjid-e Ali, Isfahan (1522), drawn
twice by Brian Wichmann in Tiling Search from David Wade's photo IRA 1329.

data189/IRA1329 (period 289.7 pt on the diagonal, band 6 pt) is drawn turned by
45°: it is turned back here, so that stars and crosses alternate along the
rows as on the portal in the photo. data172/IRA1329 (band 7 pt) is the same
design in that frame (OA = 96.5 pt) without the small squares: its lines are
the same except x, y = ±(1 − 3t), so it is built as a variant (`plain`).
Moved out by half a band, every corner snaps to the grid a + b·√2/2 (worst
error 0.0006 of OA). With t = (2 − √2)/4 every line is one of:
  - x, y = ±t and ±(1 − t), through P (the opening of the Nishapur madrasa
    stars: the line from K1 through E crosses line AC at P);
  - x ± y = ±√2/2 through F, the foot of E on the horizontal line, and
    x ± y = ±(2 − √2/2) through J, where the circle with centre B through F
    meets the horizontal line again;
  - x, y = ±√2/4, through M, where the line through F crosses line OK1, and
    x ± y = ±1/2 through N, where the horizontal through M crosses x = −t;
  - x, y = ±(1 − 3t), through R, where the line through F crosses x = −t
    (the small squares; not in the plain variant).

Units: OA = 1, A at the cross halfway to the next star on the horizontal line;
the tile is the square cell.

Usage: gen_isfahan_masjid_ali_crosses.py <IRA1329-pieces.json> tutorials/isfahan-masjid-ali-crosses.json
       gen_isfahan_masjid_ali_crosses.py --plain <data172 IRA1329-pieces.json> tutorials/isfahan-masjid-ali-crosses-plain.json
       pnpm review <id>
       gen_isfahan_masjid_ali_crosses.py finish docs/review/<id>/dump.json tutorials/<id>.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
HH = (2 - math.sqrt(2)) / 4
S1 = HH * math.sqrt(2)
M0 = math.sqrt(2) / 4
PLAIN = '--plain' in sys.argv
if PLAIN:
    sys.argv.remove('--plain')
ORIGIN, PERIOD, BAND = ((299.8, 373.3), 193.04, 7.0) if PLAIN else ((300.9, 374.4), 289.7, 6.0)


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a straight line through O and K2. It crosses the circle at E. '
         'Draw a straight line through K1 and E. Draw a straight line through A and C. '
         'It crosses the line through K1 and E at P.', 'ruler', ['K2', 'E', 'P'])
    g.line_through('d135', 'O', 'K2')
    g.meet('E', 'c', 'd135', (-H, H))
    g.line_through('ke', 'K1', 'E')
    g.line_through('ac', 'A', 'C')
    g.meet('P', 'ac', 'ke', (HH, 1 - HH))

    step('Draw a vertical line through P. Draw a horizontal line through P. '
         'Turn the two lines round O by 90°, three times.', 'ruler', ['P'])
    g.line_par('pv', 'P', 'v')
    g.line_par('ph', 'P', 'h')
    g.repeat('pp', ['pv', 'ph'], 'rot4')

    step('Draw a vertical line through E. It crosses the horizontal line at F. '
         'Draw a line through F parallel to line AC. '
         'Draw a circle with centre B through F. It crosses the horizontal line at J, to the left of B. '
         'Draw a line through J parallel to line AC.', 'compass', ['E', 'F', 'B', 'J'])
    g.line_par('ev', 'E', 'v')
    g.meet('F', 'ev', 'h', (-H, 0))
    g.line_par('fl', 'F', 'ac')
    g.circle_through('cb', 'B', 'F')
    g.meet('J', 'cb', 'h', (-2 + H, 0))
    g.line_par('jl', 'J', 'ac')

    step('The line through F crosses the line from O to K1 at M. '
         'It crosses the vertical line through P2 at R. P2 is the copy of P below O. '
         'Draw a vertical line and a horizontal line through M. Draw a horizontal line through R.',
         'ruler', ['M', 'R'])
    if PLAIN:
        cm.steps[-1]['text'] = ('The line through F crosses the line from O to K1 at M. '
                                'P2 is the copy of P below O. '
                                'Draw a vertical line and a horizontal line through M.')
        cm.steps[-1]['highlight'] = ['M']
    g.meet('M', 'fl', 'd45', (-M0, -M0))
    put('P2', 'point', (-HH, -(1 - HH)), {'point': {'meet': ['pv@2', 'ph@2']}})
    g.line_par('mv', 'M', 'v')
    g.line_par('mh', 'M', 'h')
    if not PLAIN:
        g.meet('R', 'fl', 'pv@2', (-HH, -(H - HH)))
        g.line_par('rh', 'R', 'h')

    step('The horizontal line through M crosses the vertical line through P2 at N. '
         'Draw a line through N parallel to line AC. '
         'Turn the lines through F, J, M, R and N round O by 90°, three times.', 'ruler', ['N'])
    if PLAIN:
        cm.steps[-1]['text'] = cm.steps[-1]['text'].replace('M, R and N', 'M and N')
    g.meet('N', 'mh', 'pv@2', (-HH, -M0))
    g.line_par('nl', 'N', 'ac')
    g.repeat('fr', ['fl', 'jl', 'mv', 'mh'] + ([] if PLAIN else ['rh']) + ['nl'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)
    if not PLAIN:
        polys = [[((x + y) * H, (y - x) * H) for x, y in Q] for Q in polys]
    if os.environ.get("REPORT"):
        import find_crossings
        find_crossings.report(polys)
        return
    segs = cm.network(polys)
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    src = 'data172/IRA1329' if PLAIN else 'data189/IRA1329'
    tut = {
        'format': 0, 'id': 'isfahan-masjid-ali-crosses' + ('-plain' if PLAIN else ''),
        'title': 'Stars and crosses of the Masjid-e Ali, Isfahan' + (' (without squares)' if PLAIN else ''),
        'short': 'Masjid-e Ali crosses' + (' (plain)' if PLAIN else ''), 'subtitle': 'Masjid-e Ali, Isfahan',
        'fold': 4, 'star': 8, 'style': 'Safavid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s ' + src + ' drawing, its corners '
                    'snapped to exact values. We devised the construction: one line from K1 through E fixes P, and '
                    'every line is drawn through P, F, J, M, N' + ('' if PLAIN else ' or R') + '. '
                    'The drawing gives no steps.',
            'changes': ('The compass steps, their order and the named points are ours. The comparison with the '
                        'drawing checks the finished lines, not how the design was first laid out. Wichmann draws '
                        'white bands over the lines; the tutorial draws the lines. '
                        + ('Wichmann’s second drawing of the same portal leaves out the small squares; this '
                           'variant follows it. ' if PLAIN else
                           'Wichmann draws the design turned by 45°; it is turned back here, as on the portal. ')
                        + 'His drawing was compared by eye with David Wade’s photo IRA 1329 (stars and crosses in '
                        'rows, with small square panels of square Kufic in the crosses and the ground); no '
                        'overlay was made, because the portal is curved.'),
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, ' + src + ': Masjid-e Ali, Isfahan', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/' + src + '.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from David Wade’s photo IRA 1329 '
                     '(Masjid-e Ali, Isfahan, Iran, 1522), on patterninislamicart.com. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'The centre of a cross, halfway to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the crosses at A, B, C and D. ' + ('' if PLAIN else 'Ink the small '
                        'squares round each corner of the cell. ') + 'The lines through F, J, M and N '
                        'close the pieces between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. Stars and crosses take turns along every '
                            'row.',
                    'palette': 'Timurid tile', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.586): ('star', 'b'), (18, 0.5): ('ground', 'ground'), (12, 0.293): ('bar', 'a'), (5, 0.143): ('arm', 'a'),
         (4, 0.086): ('square', 'c'), (4, 0.043): ('small_square', 'c'), (16, 0.657): ('cross', 'a'),
         (14, 0.543): ('ground', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)

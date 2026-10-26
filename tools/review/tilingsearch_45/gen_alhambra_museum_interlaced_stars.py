#!/usr/bin/env python3
"""Builds the interlaced stars of a Nasrid panel in the Alhambra Museum (John
Rigby's photo 8a), drawn by Brian Wichmann in Tiling Search (data159/P008A).

Read from the PDF (band 7.0 pt, star spacing along the axes 213.1 pt = 2 OA,
pieces moved out by half a band). The corners do not fit the grid
a + b·√2/2 in OA (error 0.012) but do in units of the star's point radius
r = 1/(2√2 − 1) (error 0.002): the star of the Leones fret
(alhambra-leones-fret), found the same way. With O at a star and the same
star at each corner of the square cell, every line is one of:
  - the star's square x, y = ±s, s = r/√2, through P, where the line from E
    (on the circle and line OK1) through M = (0, 1/2) crosses line OK2;
  - the star's diamond x ± y = ±r, through T on the circle with centre O
    through P;
  - x ± y = ±2s, through H = (s, s);
  - x, y = ±(r − s), through U, where the diamond's side crosses y = s;
  - the corner star's square x, y = ±(1 − s), through Q, where line AC
    crosses y = s;
  - the corner star's diamond x ± y = ±(2 − r), through Z on the circle with
    centre K1 and radius r.
The two stars are the same, but only the star at O has the lines x ± y = ±2s
and x, y = ±(r − s) round it.

Usage: gen_alhambra_museum_interlaced_stars.py <P008A-pieces.json> tutorials/alhambra-museum-interlaced-stars.json
       pnpm review alhambra-museum-interlaced-stars
       gen_alhambra_museum_interlaced_stars.py finish docs/review/alhambra-museum-interlaced-stars/dump.json tutorials/alhambra-museum-interlaced-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step, steps  # noqa: E402

R2 = math.sqrt(2)
RR = 1 / (2 * R2 - 1)
SS = RR / R2
ORIGIN, PERIOD, BAND = (297.5, 374.89), 213.1, 7.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')
    step('Draw a straight line through O and K2. Draw a straight line through K2 and A. '
         'It crosses the vertical line at M, halfway up.', 'ruler', ['K2', 'M'])
    g.line_through('d135', 'O', 'K2')
    g.line_through('k2a', 'K2', 'A')
    g.meet('M', 'k2a', 'v', (0, 0.5))
    step('The circle crosses the line from O to K1 at E. Draw a straight line through E and M. '
         'It crosses the line from O to K2 at P. Draw a horizontal line through P. '
         'Turn it round O by 90°, three times. The four lines make the square of the star.', 'ruler', ['E', 'P'])
    steps[-1]['textWithoutHelpers'] = ('The circle crosses the line from O to K1 at E. '
                                       'The line from E through M crosses the line from O to K2 at P. '
                                       'Draw a horizontal line through P. Turn it round O by 90°, three times. '
                                       'The four lines make the square of the star.')
    g.meet('E', 'c', 'd45', (1 / R2, 1 / R2))
    g.line_through('em', 'E', 'M')
    g.meet('P', 'em', 'd135', (-SS, SS))
    g.line_par('ph', 'P', 'h')
    g.repeat('php', ['ph'], 'rot4')
    step('Draw a circle with centre O through P. It crosses the horizontal line at T. '
         'Draw a line through T parallel to the line from O to K2. Turn it round O by 90°, three times. '
         'The lines make the star at O.', 'compass', ['T'])
    g.circle_through('cp', 'O', 'P')
    g.meet('T', 'cp', 'h', (RR, 0))
    g.line_par('td', 'T', 'd135')
    g.repeat('tdp', ['td'], 'rot4')
    step('The horizontal line through P crosses the line from O to K1 at H. '
         'Draw a line through H parallel to the line from O to K2. Turn it round O by 90°, three times.',
         'ruler', ['H'])
    g.meet('H', 'ph', 'd45', (SS, SS))
    g.line_par('hd', 'H', 'd135')
    g.repeat('hdp', ['hd'], 'rot4')
    step('The line through T crosses the horizontal line through P at U. Draw a vertical line through U. '
         'Turn it round O by 90°, three times.', 'ruler', ['U'])
    g.meet('U', 'td', 'ph', (RR - SS, SS))
    g.line_par('uv', 'U', 'v')
    g.repeat('uvp', ['uv'], 'rot4')
    step('Draw a straight line through A and C. It crosses the horizontal line through P at Q. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times. '
         'The lines make the squares of the stars at the corners.', 'ruler', ['Q'])
    steps[-1]['textWithoutHelpers'] = ('The line from A to C crosses the horizontal line through P at Q. '
                                       'Draw a vertical line through Q. Turn it round O by 90°, three times. '
                                       'The lines make the squares of the stars at the corners.')
    g.line_through('ac', 'A', 'C')
    g.meet('Q', 'ac', 'ph', (1 - SS, SS))
    g.line_par('qv', 'Q', 'v')
    g.repeat('qvp', ['qv'], 'rot4')
    step('Draw a circle with centre K1 and the same radius as the circle through P. '
         'It crosses the vertical line through A at Z, below K1. '
         'Draw a line through Z parallel to the line from O to K2. Turn it round O by 90°, three times. '
         'The lines make the stars at the corners.', 'compass', ['K1', 'Z'])
    cm.circle_radius_of('ck', 'K1', 'cp')
    g.meet('Z', 'ck', 'gx', (1, 1 - RR))
    g.line_par('zd', 'Z', 'd135')
    g.repeat('zdp', ['zd'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)
    if '--find' in sys.argv:
        import find_crossings
        find_crossings.report(polys)
        return
    segs = cm.network(polys)
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-museum-interlaced-stars',
        'title': 'Interlaced stars of a Nasrid panel in the Alhambra Museum',
        'short': 'Alhambra Museum interlaced stars', 'subtitle': 'Alhambra Museum, Granada', 'fold': 4, 'star': 8,
        'style': 'Nasrid', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P008A drawing, its band centre lines snapped '
                    'to exact values. We devised the construction: one line from E through M fixes the star, as in '
                    'the Leones fret, and every other line comes from it. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. The panel itself '
                       'was not checked: no free photo of it was found.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data159/P008A: John Rigby’s photo 8a', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data159/P008A.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, made from a photograph by John Rigby of a Nasrid panel in '
                     'the Alhambra Museum, Granada. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the side of the square tile on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O, the stars at the corners and the bands that join them. '
                        'They close the long pieces and the small squares.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits in the middle and at every '
                            'corner, with a long piece between each two.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.701): ('star', 'a'), (18, 0.474): ('eighteen', 'b'), (12, 0.248): ('long_piece', 'c'),
         (4, 0.051): ('square', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)

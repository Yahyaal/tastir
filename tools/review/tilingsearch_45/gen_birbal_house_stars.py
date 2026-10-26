#!/usr/bin/env python3
"""Builds the north porch ceiling of Rajah Birbal's house, Fatehpur Sikri,
drawn by Brian Wichmann in Tiling Search (data185/P94): eight-pointed stars of
two squares at O and at the corners, yellow eight-sided pieces, grey
pentagons and green hexagons between them.

Read from the PDF, a drawing of bevelled bands 15 pt wide whose coloured tiles
are also drawn as outlines; the outlines, moved out by half a band, are the
tiles. The stars sit on a square grid turned by 22.5° on the page, and a star's
diagonal neighbour is not like it (the stars next to O along the page's grid
are the other kind), so the drawing is turned by 22.5° here and OA is half the
spacing of like stars (139.97 pt): a star at O and one at each corner.

Then every edge runs at 22.5° to the axes, and every line is one of:
  - the sixteen lines through A, B, C and D at 22.5° and 67.5° to the axes;
    the star's sides are among them (the line through D at 67.5° runs along
    a side of the star at O);
  - the eight lines through N = (√2 − 1, 0), where that line crosses the
    horizontal, and its turns, at 22.5° to the horizontal.
At the side midpoints (A) Wichmann draws a tiny square with uneven bevels; the
lines meet there in a point, and the gap left between the yellow and green
pieces becomes two thin white triangles meeting at A.

Usage: gen_birbal_house_stars.py <P94-vec.json> tutorials/birbal-house-stars.json
       pnpm review birbal-house-stars
       gen_birbal_house_stars.py finish docs/review/birbal-house-stars/dump.json tutorials/birbal-house-stars.json
"""
import json
import math
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R2 = math.sqrt(2)
T22 = math.radians(22.5)
ORIGIN, PERIOD, BAND, TURN = (297.5, 376.0), 2 * 139.97, 15.0, 22.5


def drawing(vec):
    """The coloured tiles' outlines (paths drawn without a fill), moved out by
    half a band and turned by 22.5°."""
    out = []
    for d in json.load(open(vec)):
        if d['fill'] is None and d['lines']:
            pts = [d['lines'][0][0]] + [ln[1] for ln in d['lines']]
            if math.dist(pts[0], pts[-1]) < 0.1:
                pts = pts[:-1]
            out.append({'poly': pts})
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as f:
        json.dump(out, f)
    polys = cm.frame_pieces(f.name, ORIGIN, PERIOD, BAND)
    os.unlink(f.name)
    c, s = math.cos(math.radians(TURN)), math.sin(math.radians(TURN))
    return [[(c * x - s * y, s * x + c * y) for x, y in Q] for Q in polys]


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at E. Draw the line through O that halves the angle AOE. '
         'Draw the line through O that halves the angle EOC.', 'ruler', ['E'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_bisect('b1', 'A', 'O', 'E')
    g.line_bisect('b2', 'E', 'O', 'C')

    step('Draw two lines through A parallel to the two new lines. '
         'Draw two lines through A at 90° to the two new lines. '
         'Turn the four lines round O by 90°, three times.', 'ruler', ['A'])
    g.line_par('a1', 'A', 'b1')
    g.line_par('a2', 'A', 'b2')
    g.line_perp('a3', 'A', 'b1')
    g.line_perp('a4', 'A', 'b2')
    g.repeat('ap', ['a1', 'a2', 'a3', 'a4'], 'rot4')
    cm.steps[-1]['textWithoutHelpers'] = (
        'Draw four lines through A, at 22.5° and at 67.5° to the horizontal line. '
        'Turn the four lines round O by 90°, three times.')

    step('The line through D parallel to the line that halves the angle EOC crosses the horizontal line at N. '
         'Draw a line through N parallel to the line that halves the angle AOE. '
         'Draw a line through N at 90° to the line that halves the angle EOC. '
         'Turn the two lines round O by 90°, three times.', 'ruler', ['N'])
    dl = [n for n in ('a2@1', 'a2@2', 'a2@3', 'a4@1', 'a4@2', 'a4@3') if abs(cm.crossings(n, 'v')[0][1] + 1) < 1e-9
          and abs(math.atan2(*reversed(cm.el[n][1][1])) % math.pi - math.radians(67.5)) < 1e-9]
    assert len(dl) == 1, dl
    g.meet('N', dl[0], 'h', (R2 - 1, 0))
    g.line_par('n1', 'N', 'b1')
    g.line_perp('n2', 'N', 'b2')
    g.repeat('np', ['n1', 'n2'], 'rot4')
    cm.steps[-1]['textWithoutHelpers'] = (
        'The line through D at 67.5° to the horizontal line crosses the horizontal line at N. '
        'Draw two lines through N at 22.5° to the horizontal line. '
        'Turn the two lines round O by 90°, three times.')


def main():
    vec, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(drawing(vec))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'birbal-house-stars',
        'title': 'Stars of Rajah Birbal’s house, Fatehpur Sikri',
        'short': 'Birbal’s house stars', 'subtitle': 'Rajah Birbal’s house, Fatehpur Sikri', 'fold': 4, 'star': 8,
        'style': 'Mughal', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P94 drawing. We devised the construction. '
                    'Every line runs at 22.5° to the cell’s sides: sixteen lines through A, B, C and D, and eight '
                    'through N and its turns, the inner corners of the star at O. The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 22.5°; it is turned here so that the tile is the square '
                       'cell. Where four pieces meet at A his drawing has a tiny square with uneven bevels; here the '
                       'lines meet in a point, and the gap becomes two thin white triangles. The compass steps, '
                       'their order and the named points are ours. No photo of the ceiling was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data185/P94: Fatehpur Sikri, Rajah Birbal’s House', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data185/P94.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from E. W. Smith, The Moghul Architecture '
                     'of Fathpur-Sikri (Archaeological Survey of India, 1896), part 2, plate X (the north porch '
                     'ceiling of Rajah Birbal’s house), and lists the same design in Jay Bonner, Islamic Geometric '
                     'Patterns (Springer, 2017), page 276, figure 153 (the mihrab of the Malik mosque, Kerman) and '
                     'in a photo by M. Sakkal of the Junblat house, Aleppo. The construction is ours.'}],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the stars at O and at the corners, the '
                        'eight-sided pieces, the pentagons and the hexagons between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and every '
                            'corner.',
                    'palette': 'Timurid tile', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.686): ('star', 'b'), (8, 0.172): ('eight', 'a'), (6, 0.101): ('hexagon', 'c'),
         (5, 0.096): ('pentagon', 'ground'), (4, 0.021): ('kite', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)

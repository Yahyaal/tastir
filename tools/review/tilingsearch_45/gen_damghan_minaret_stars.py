#!/usr/bin/env python3
"""Builds the star and square grid of the minaret of the Friday mosque,
Damghan, drawn by Brian Wichmann in Tiling Search (data211/BON47).

Read from the PDF (plain tiles edge to edge, a star at the page centre, cell
478 pt). In units of OA = 84.5 pt every corner snaps to the grid a + b·√2/2
(worst error 0.0006 of OA) and the cell is 4√2 wide: the star at O is the
classic star of two squares on the circle through A, and the square cell has
its corners at K1 = (2√2, 2√2) and its copies.

Usage: gen_damghan_minaret_stars.py <BON47-pieces.json> tutorials/damghan-minaret-stars.json
       pnpm review damghan-minaret-stars
       gen_damghan_minaret_stars.py finish docs/review/damghan-minaret-stars/dump.json tutorials/damghan-minaret-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import el, g, put, step  # noqa: E402
import gen_leones_door_stars as leones  # noqa: E402

R2 = math.sqrt(2)
H = R2 / 2
L = 2 * R2          # half the cell
ORIGIN, UNIT, BAND = (297.5, 376.6), 84.5, 0.0


def build_star(w=True):
    """Steps 1 to 6, shared with Bourgoin's plate 64 (gen_bourgoin_plate64.py):
    the star at O and the lines through V, P and W, turned round O."""
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.line_through('h', 'O', 'A')
    step('Draw a vertical line through O. Draw the line through O that halves the angle between the two lines. '
         'Draw the line through O at 90° to it. The four lines cross the circle at S1 to S8.', 'ruler', ['c'])
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.line_bisect('d45', 'A', 'O', 'C')
    g.line_perp('d135', 'O', 'd45')
    pts = leones.star_points('S', 'c', 1.0)
    step('Draw the star at O as two squares.', 'ruler', ['c'])
    leones.two_squares(pts, 'q', leones.square_texts(pts, 'Draw each line long.'))
    step('The line through S1 and S3 crosses the line through S2 and S4 at V. '
         'Draw a vertical line through V. Draw a line through V parallel to the line through O and S2. '
         'The line through S7 and S1 crosses the line through S2 and S4, carried on, at P. Draw a vertical line through P. '
         'Draw a line through P parallel to the line through O and S4.', 'ruler', ['V', 'P'])
    g.meet('V', 'q01', 'q11', (1 - H, H))
    g.line_par('vv', 'V', 'v')
    g.line_par('vd', 'V', 'd45')
    g.meet('P', 'q04', 'q11', (1 + H, H))
    g.line_par('pv', 'P', 'v')
    g.line_par('pd', 'P', 'd135')
    step('Turn the four lines of the last step round O by 90°, three times.')
    g.repeat('vr', ['vv', 'vd', 'pv', 'pd'], 'rot4')
    if not w:
        return
    step('The slanting line through V crosses the line through S8 and S2 at W. Draw a horizontal line through W. '
         'Turn it round O by 90°, three times.', 'ruler', ['W'])
    g.meet('W', 'vd', 'q14', (H, 3 * H - 1))
    g.line_par('wh', 'W', 'h')
    g.repeat('wr', ['wh'], 'rot4')


def build():
    build_star()
    step('The line through S7 and S1, carried on, crosses the horizontal line through W at X. '
         'Draw a line through X parallel to the line through O and S4. It crosses the line through S2 and S4, carried on, at Y. '
         'Draw a vertical line through Y. Turn the two lines round O by 90°, three times.', 'ruler', ['X', 'Y'])
    g.meet('X', 'q04', 'wh', (3 * H, 3 * H - 1))
    g.line_par('xd', 'X', 'd135')
    g.meet('Y', 'xd', 'q11', (5 * H - 1, H))
    g.line_par('yv', 'Y', 'v')
    g.repeat('xr', ['xd', 'yv'], 'rot4')

    step('Open the compasses from O to P. Draw a circle with centre X and this radius. It crosses the line through O and S2, carried on, at K1, far from O. '
         'Draw a vertical line through K1. Turn it round O by 90°, three times. '
         'The four lines make the square cell, with corners K1, K2, K3 and K4.',
         'compass', ['X', 'P', 'K1'])
    g.circle_from('cx', 'X', 'O', 'P')
    g.meet('K1', 'cx', 'd45', (L, L))
    g.line_par('kv', 'K1', 'v')
    g.repeat('kr', ['kv'], 'rot4')
    g.meet('K2', 'kv@2', 'kv@1', (-L, L))
    g.meet('K3', 'kv@2', 'kv@3', (-L, -L))
    g.meet('K4', 'kv', 'kv@3', (L, -L))
    if os.environ.get('FIND'):
        import find_crossings
        find_crossings.report(cm.frame_pieces(os.environ['FIND'], ORIGIN, 2 * UNIT, BAND), hcell=L, reach=3.2)
        sys.exit()


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, 2 * UNIT, BAND), hcell=L, reach=4)
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'damghan-minaret-stars',
        'title': 'Star and squares of the Friday mosque minaret, Damghan',
        'short': 'Damghan minaret stars', 'subtitle': 'Friday mosque, Damghan', 'fold': 4, 'star': 8,
        'style': 'Seljuk', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s BON47 drawing, its corners snapped to exact '
                    'values. We devised the construction. The star at O is the classic star of two squares; every '
                    'other line runs through a crossing of the star’s lines carried on (V, P, W, X and Y), and the '
                    'cell’s corner K1 lies four times as far from O as the star’s point S2. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'minaret was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data211/BON47: Friday Mosque, Damghan', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data211/BON47.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Jay Bonner, Islamic Geometric Patterns '
                     '(Springer, 2017), page 268, figure 142 (the minaret of the Friday mosque, Damghan, 1080). '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of the eight-pointed star.', 'A': 'A point of the star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines picked out in orange. '
                        'They close the long pieces round the star, the kites and the rows of small squares.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and a small '
                            'square at every corner, with rows of squares between them.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 2.343): ('star', 'd'), (7, 0.843): ('long_piece', 'ground'), (8, 0.586): ('eight', 'c'),
         (4, 0.485): ('square', 'a'), (4, 0.343): ('small_square', 'd'), (5, 0.328): ('kite', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)

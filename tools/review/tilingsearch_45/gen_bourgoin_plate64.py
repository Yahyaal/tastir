#!/usr/bin/env python3
"""Builds Bourgoin's plate 64 (stars, octagons and fourteen-sided pieces),
drawn by Brian Wichmann in Tiling Search (data11/P064); Wichmann lists it on
carved stucco from Rey and at the Sari Han (Wade's TUR 0626).

Read from the PDF (tiles edge to edge). The lines run at 0°, 45°, 90° and
135° on the page but the stars repeat along directions at 67.5° and −22.5°:
the tile is a square tilted by 22.5°. In units of the star's point radius
(OA = 60.36 pt) every corner snaps to the grid a + b·√2/2 (worst error
0.001 of OA). The star at O is the classic star of two squares on the circle
through A; the large octagons sit at the tile's corners K1 = (1, 1 + √2) and
its turns. The star and the lines through V, P and W are those of the Damghan
minaret (gen_damghan_minaret_stars.py, steps 1 to 6); the rest were found with
find_crossings.py (FIND=<pieces.json>).

Usage: gen_bourgoin_plate64.py <P064-pieces.json> tutorials/bourgoin-plate-64.json
       pnpm review bourgoin-plate-64
       gen_bourgoin_plate64.py finish docs/review/bourgoin-plate-64/dump.json tutorials/bourgoin-plate-64.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import el, g, put, step  # noqa: E402
import gen_damghan_minaret_stars as dm  # noqa: E402
import gen_fatehpur_sikri_stars as fs  # noqa: E402

R2 = math.sqrt(2)
H = R2 / 2
ORIGIN, UNIT, BAND = (297.5, 375.04), 60.36, 0.0
KS = ((1, 1 + R2), (-1 - R2, 1), (-1, -1 - R2), (1 + R2, -1))


def build():
    dm.build_star(w=False)
    step('Draw a vertical line through A. Draw the line through O that halves the angle at O between S2 and S3. '
         'The two lines cross at K1. Draw a line through O at 90° to the line through O and K1. '
         'Draw a circle with centre O through K1. It crosses the two lines through O at K2, K3 and K4.',
         'compass', ['K1'])
    cm.steps[-1]['textWithoutHelpers'] = ('Mark K1, a corner of the tile, above A. Draw a circle with centre O '
                                          'through K1. Mark K2, K3 and K4 on it, each a quarter turn on from the last.')
    g.line_perp('ax', 'A', 'h')
    g.line_bisect('t', 'S2', 'O', 'S3')
    g.meet('K1', 'ax', 't', KS[0])
    g.line_perp('tp', 'O', 't')
    g.circle_through('ck', 'O', 'K1')
    g.meet('K2', 'ck', 'tp', KS[1])
    g.meet('K3', 'ck', 't', KS[2])
    g.meet('K4', 'ck', 'tp', KS[3])
    if os.environ.get('FIND'):
        import find_crossings
        tile = KS
        segs = []
        for Q in cm.frame_pieces(os.environ['FIND'], ORIGIN, 2 * UNIT, BAND):
            if max(abs(v) for q in Q for v in q) > 5:
                continue
            for i in range(len(Q)):
                cs = fs.clip_poly((Q[i], Q[(i + 1) % len(Q)]), tile)
                if cs:
                    segs.append([cs[0], cs[1]])
        find_crossings.report(segs, hcell=3, reach=3)
        sys.exit()


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tile = [el[k][1] for k in ('K1', 'K2', 'K3', 'K4')]
    segs = fs.network(cm.frame_pieces(pieces, ORIGIN, 2 * UNIT, BAND), tile, reach=5)
    paths = fs.along(segs, tile)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    tut = {
        'format': 0, 'id': 'bourgoin-plate-64',
        'title': 'Stars and octagons of Bourgoin’s plate 64',
        'short': 'Bourgoin plate 64', 'subtitle': 'Jules Bourgoin, plate 64', 'fold': 4, 'star': 8,
        'style': 'Seljuk', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P064 drawing, its corners snapped to exact '
                    'values. We devised the construction. The star at O is the classic star of two squares, and every '
                    'other line runs through a crossing of its lines carried on (V and P), as in the Damghan minaret. '
                    'The large octagons sit at the corners of a square tile turned by 22.5°. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of a '
                       'real panel was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data11/P064: Bourgoin, Plate 64', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data11/P064.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from plate 64 of Jules Bourgoin, Arabic '
                     'Geometrical Pattern and Design (1879; Dover reprint), and lists it on carved stucco from Rey '
                     '(twelfth century, Tehran Museum), at the Sari Han on the Aksaray to Kayseri road (David '
                     'Wade’s photo TUR 0626) and under an inscription in the al-Azhar mosque, Cairo. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'A point of the star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines picked out in orange. '
                        'They close the small octagons round the star, the long pieces and the large octagons.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the tilted square tile side by side. A star sits at every centre and a large '
                            'octagon at every corner.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 2.343): ('star', 'ground'), (8, 1.657): ('octagon', 'a'), (14, 1.243): ('long_piece', 'ground'),
         (8, 0.586): ('small_octagon', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)

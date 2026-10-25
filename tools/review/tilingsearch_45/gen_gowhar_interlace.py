#!/usr/bin/env python3
"""Builds the interlaced star and cross of the mosque of Gowhar Shad,
Mashhad, drawn by Brian Wichmann in Tiling Search (data15/CM066B), as a
variant of eight-fold-star-and-cross.

Read from the PDF (bands 40 pt wide, stars 241.44 pt apart on the diagonal):
the band centre lines, snapped to the grid a + b·√2/2 in units of half the
star spacing (worst error 0.0009 of OA) and turned by 45°, are exactly the
sides of the star of two squares with points on the circle through A, the
flat square's sides carried on to the sides of the tile. They cut each cross
of eight-fold-star-and-cross into a square and four pentagons. So the
tutorial copies that tutorial's steps 1 to 5, carries the flat square's sides
on, and copies its tile step.

Usage: gen_gowhar_interlace.py tutorials/mashhad-gowhar-interlace.json
       pnpm review mashhad-gowhar-interlace
       gen_gowhar_interlace.py finish docs/review/mashhad-gowhar-interlace/dump.json tutorials/mashhad-gowhar-interlace.json
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402

PARENT = 'tutorials/eight-fold-star-and-cross.json'


def main():
    out = sys.argv[1]
    p = json.load(open(PARENT))
    steps = copy.deepcopy(p['steps'][:5])
    steps.append({
        'id': 6,
        'text': 'Draw a straight line through NE and NW, NW and SW, SW and SE, and SE and NE. '
                'Draw each line long. They carry the sides of the flat square on.',
        'create': {'fN': {'line': {'through': ['NE', 'NW']}}, 'fW': {'line': {'through': ['NW', 'SW']}},
                   'fS': {'line': {'through': ['SW', 'SE']}}, 'fE': {'line': {'through': ['SE', 'NE']}}},
        'highlight': ['NE', 'NW', 'SW', 'SE'], 'animate': 'ruler'})
    tile = copy.deepcopy(p['steps'][5])
    tile['id'] = 7
    steps.append(tile)
    paths = copy.deepcopy(p['ink']['paths'])
    # the flat square's sides from each corner to the tile's sides
    for line, a, b in (('fN', 'NE', 'tE'), ('fN', 'NW', 'tW'), ('fW', 'NW', 'tN'), ('fW', 'SW', 'tS'),
                       ('fS', 'SW', 'tW'), ('fS', 'SE', 'tE'), ('fE', 'SE', 'tS'), ('fE', 'NE', 'tN')):
        paths.append({'along': line, 'from': a, 'to': b})
    tut = {
        'format': 0, 'id': 'mashhad-gowhar-interlace',
        'title': 'Interlaced star and cross of the Gowhar Shad mosque, Mashhad',
        'short': 'Gowhar Shad interlace', 'subtitle': 'Mosque of Gowhar Shad, Mashhad', 'fold': 4, 'star': 8,
        'style': 'Timurid', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CM066B drawing, the centre lines of its bands '
                    'snapped to exact values. They are the lines of the eight-fold star and cross, with the flat '
                    'square’s sides carried on to the sides of the tile, so the construction is that one. The drawing '
                    'gives no steps.',
            'changes': 'Wichmann draws the design turned by 45°; it is turned here so that the tile is the square '
                       'round the circle. The comparison with the drawing checks the finished lines, not how the '
                       'design was first laid out. No photo of the mosque was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data15/CM066B: Mosque of Gowhar, Mashhad', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM066B.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He cites A. U. Pope’s photo 269 for the mosque of Gowhar '
                     'Shad, Mashhad (1418), and lists the same design from Balkh, the minaret of Jam, Cairo, Gubbio, '
                     'Agra, Samarkand, Lahore, Seville and Aleppo. The construction is ours.'}],
        'given': p['given'],
        'steps': steps,
        'ink': {'text': 'Ink the outline of the two squares, turning at each of the eight points where they cross. '
                        'Then ink the flat square’s sides on from each corner to the sides of the tile. '
                        'They cut each cross into a square and four pentagons.',
                'paths': paths},
        'pattern': {'cell': 'cell',
                    'text': 'Put copies of the tile side by side. Neighbouring stars touch at their points. The lines '
                            'carried on from the stars weave over and under each other.',
                    'palette': 'Timurid tile', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(steps), 'steps,', len(paths), 'ink paths')


NAMES = {(16, 2.343): ('star', 'a'), (5, 0.328): ('pentagon', 'b'), (4, 0.343): ('square', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)

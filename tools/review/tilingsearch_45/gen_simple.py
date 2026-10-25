#!/usr/bin/env python3
"""Writes the small Tiling Search 45° tutorials of batch 2 (25 October 2026):

  shah-i-zinda-octagons   F254L  regular octagons touching corner to corner,
                                 four-pointed stars between them
  qaytbay-floor-octagons  W2     the same octagons with a small octagon inside
                                 each star (a variant sharing steps 1 to 5)
  sircali-stars           BON36  eight-pointed {8/3} stars touching at their
                                 diagonal points, on a diamond tile

Each design was read from Brian Wichmann's vector drawing and every vertex
snapped to the grid a + b·√2/2 (snap_grid.py here); the numbers below are
the exact values the drawings gave. OA = 1 throughout.

Usage: gen_simple.py [tutorials dir]   (default: tutorials/)
then:  python3 tools/review/format_tutorial.py tutorials/<id>.json
"""
import json
import os
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else 'tutorials'

TS = 'https://tilingsearch.mit.edu/HTML/'


def line(*pts):
    return {'line': {'through': list(pts)}}


def perp(p, l):
    return {'line': {'through': p, 'perpendicularTo': l}}


def bis(a, o, b):
    return {'line': {'through': o, 'bisects': [a, o, b]}}


def circ(c, p):
    return {'circle': {'centre': c, 'through': p}}


def meet(a, b, **pick):
    spec = {'meet': [a, b]}
    if pick:
        spec['pick'] = pick
    return {'point': spec}


def construction(code):
    return {
        'basis': 'reconstruction',
        'fidelity': 'not-applicable',
        'note': f'The finished design was read from Brian Wichmann’s {code} drawing, its corners snapped to exact values. '
                'We devised the construction; the drawing gives no steps.',
        'changes': 'The compass steps, their order and the named points are ours. '
                   'The comparison with the drawing checks the finished lines, not how the design was first laid out.',
        'reviewed': '2026-10-25',
    }


# --- Octagons (F254L) and its variant (W2) -------------------------------------

def octagon_steps():
    return [
        {'id': 1, 'text': 'Draw a horizontal straight line through O and A. Draw a circle with centre O through A.',
         'create': {'h': line('O', 'A'), 'c': circ('O', 'A')}, 'animate': 'compass'},
        {'id': 2, 'text': 'Draw a vertical line through O. The two lines cross the circle at A, B, C and D.',
         'create': {'v': perp('O', 'h'),
                    'B': meet('c', 'v', angle=90), 'C': meet('c', 'h', angle=180), 'D': meet('c', 'v', angle=270)},
         'highlight': ['h'], 'animate': 'ruler'},
        {'id': 3, 'text': 'Draw the line through O that halves the angle AOB. Draw the line through O that halves the angle BOC. '
                          'They cross the circle at E, F, G and H.',
         'create': {'d1': bis('A', 'O', 'B'), 'd2': bis('B', 'O', 'C'),
                    'E': meet('c', 'd1', angle=45), 'F': meet('c', 'd2', angle=135),
                    'G': meet('c', 'd1', angle=225), 'H': meet('c', 'd2', angle=315)},
         'highlight': ['A', 'B', 'C'], 'animate': 'ruler'},
        {'id': 4, 'text': 'Join A, E, B, F, C, G, D and H with straight lines. This makes the octagon.',
         'create': {'oct': {'polygon': ['A', 'E', 'B', 'F', 'C', 'G', 'D', 'H']}},
         'highlight': ['A', 'E', 'B', 'F', 'C', 'G', 'D', 'H'], 'animate': 'ruler'},
        {'id': 5, 'text': 'Draw a vertical line through A. Draw a vertical line through C. '
                          'Draw a horizontal line through B. Draw a horizontal line through D. '
                          'The four lines make a square with corners K1, K2, K3 and K4. Join them to mark the tile that repeats.',
         'create': {'tE': perp('A', 'h'), 'tW': perp('C', 'h'), 'tN': perp('B', 'v'), 'tS': perp('D', 'v'),
                    'K1': meet('tE', 'tN'), 'K2': meet('tN', 'tW'), 'K3': meet('tW', 'tS'), 'K4': meet('tS', 'tE'),
                    'tile': {'polygon': ['K1', 'K2', 'K3', 'K4']}},
         'highlight': ['A', 'B', 'C', 'D'], 'animate': 'ruler'},
    ]


OCT_PATH = {'closed': True, 'through': ['A', 'E', 'B', 'F', 'C', 'G', 'D', 'H']}


def shah_i_zinda():
    return {
        'format': 0, 'id': 'shah-i-zinda-octagons',
        'title': 'Octagons and stars of the Shah-i-Zinda (Samarkand)',
        'short': 'Octagons and stars', 'subtitle': 'Shah-i-Zinda, Samarkand',
        'fold': 4, 'style': 'Timurid', 'level': 'beginner',
        'construction': construction('F254L'),
        'credits': [
            {'source': 'Tiling Search, data147/F254L: Shah-i-Zinda, Samarkand', 'creator': 'Brian Wichmann',
             'url': TS + 'data147/F254L.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing; the construction is ours. '
                     'He lists the same design at Nur al-Din’s mosque in Hama (1163), the Eşrefoğlu mosque in Beyşehir, '
                     'Amir Shaykhu’s stone floor in Cairo and the shrine of Sheikh Safi in Ardabil.'},
            {'source': 'Photograph TRA 0301 (tile panel, Shah-i-Zinda, Samarkand)', 'creator': 'David Wade',
             'url': 'https://patterninislamicart.com/', 'kind': 'photo',
             'note': 'The real panel, compared by eye with the wall: regular octagons touching at their corners.'},
        ],
        'given': {'O': 'The centre of an octagon.', 'A': 'A corner of that octagon, where it touches the next one.'},
        'steps': octagon_steps(),
        'ink': {'text': 'Ink the octagon: from A through E, B and on round, back to A.', 'paths': [OCT_PATH]},
        'pattern': {
            'cell': 'tile',
            'text': 'Put copies of the square tile side by side. The octagons touch at their corners, '
                    'and a four-pointed star closes between every four of them.',
            'palette': 'Timurid tile',
            'colors': {'octagon': 'a', 'star': 'b'},
        },
        'expect': {
            'note': 'Octagon 2√2, star 4 − 2√2, cell 4.',
            'pieceTypes': 2,
            'pieces': [{'name': 'octagon', 'vertices': 8, 'area': 2.82843, 'perCell': 1},
                       {'name': 'star', 'vertices': 8, 'area': 1.17157, 'perCell': 1}],
            'cellArea': 4,
        },
    }


def qaytbay():
    steps = octagon_steps()
    steps += [
        # The small octagon's sides carry on the large octagon's sides past
        # their corners: line BE reaches the tile's side at R, line AE at T.
        {'id': 6, 'text': 'Draw a straight line through B and E. It crosses the vertical line through A at R. '
                          'Draw a straight line through A and E. It crosses the horizontal line through B at T.',
         'create': {'sRE': line('B', 'E'), 'R': meet('sRE', 'tE'),
                    'sET': line('A', 'E'), 'T': meet('sET', 'tN')},
         'highlight': ['A', 'B', 'E'], 'animate': 'ruler'},
        {'id': 7, 'text': 'Turn the lines through R and T round O by 90°, three times. This copies them to K2, K3 and K4.',
         'create': {'cp': {'repeat': {'of': ['sRE', 'sET'], 'by': 'rot4'}}},
         'highlight': ['sRE', 'sET'], 'animate': 'ruler'},
    ]
    small = [
        {'along': 'sRE', 'from': 'R', 'to': 'E'}, {'along': 'sET', 'from': 'E', 'to': 'T'},
        {'along': 'sRE@1', 'from': 'tN', 'to': 'F'}, {'along': 'sET@1', 'from': 'F', 'to': 'tW'},
        {'along': 'sRE@2', 'from': 'tW', 'to': 'G'}, {'along': 'sET@2', 'from': 'G', 'to': 'tS'},
        {'along': 'sRE@3', 'from': 'tS', 'to': 'H'}, {'along': 'sET@3', 'from': 'H', 'to': 'tE'},
    ]
    return {
        'format': 0, 'id': 'qaytbay-floor-octagons',
        'title': 'Octagons of the Qaytbay madrasa floor (Cairo)',
        'short': 'Qaytbay floor octagons', 'subtitle': 'Qaytbay madrasa, Cairo',
        'fold': 4, 'style': 'Mamluk', 'level': 'beginner',
        'construction': construction('W2'),
        'credits': [
            {'source': 'Tiling Search, data202/W2: mosaic floor, Qaytbay madrasa', 'creator': 'Brian Wichmann',
             'url': TS + 'data202/W2.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing; the construction is ours. He also lists it at the Qalawun complex '
                     'in Cairo, the Friday mosque of Yazd and in James Wild’s Cairo sketchbook (V&A E.3839:170-1938).'},
        ],
        'given': {'O': 'The centre of a large octagon.', 'A': 'A corner of that octagon, where it touches the next one.'},
        'steps': steps,
        'ink': {
            'text': 'Ink the large octagon. Ink the two sides of the small octagon at each corner of the tile.',
            'paths': [OCT_PATH] + small,
            'parts': [
                {'text': 'Ink the large octagon: from A through E, B and on round, back to A.', 'paths': 1},
                {'text': 'Ink from R to E and from E to T. These are two sides of the small octagon at K1.', 'paths': 2},
                {'text': 'Ink the same two lines at K2, K3 and K4.', 'paths': 6},
            ],
        },
        'pattern': {
            'cell': 'tile',
            'text': 'Put copies of the square tile side by side. The large octagons touch at their corners. '
                    'A small octagon sits where four tiles touch, with a dart on each side of it.',
            'palette': 'Mamluk wood',
            'colors': {'octagon': 'a', 'small_octagon': 'c', 'dart': 'b'},
        },
        'expect': {
            'note': 'Large octagon 2√2, small octagon 6√2 − 8, dart 3 − 2√2, cell 4.',
            'pieceTypes': 3,
            'pieces': [{'name': 'octagon', 'vertices': 8, 'area': 2.82843, 'perCell': 1},
                       {'name': 'small_octagon', 'vertices': 8, 'area': 0.48528, 'perCell': 1},
                       {'name': 'dart', 'vertices': 4, 'area': 0.17157, 'perCell': 4}],
            'cellArea': 4,
        },
    }


# --- Sırçalı stars (BON36) ----------------------------------------------------

def sircali():
    T = lambda k: f'T{(k - 1) % 8 + 1}'
    lines = {f'L{k}': line(T(k), T(k + 3)) for k in range(1, 9)}
    pts = {f'P{k}': meet(f'L{k}', f'L{(k - 3) % 8 + 1}') for k in range(1, 9)}
    star = []
    for k in range(1, 9):
        star += [T(k), f'P{k}']
    steps = [
        {'id': 1, 'text': 'Draw a horizontal straight line through O and A. Draw a circle with centre O through A.',
         'create': {'h': line('O', 'A'), 'c': circ('O', 'A')}, 'animate': 'compass'},
        {'id': 2, 'text': 'Draw a vertical line through O. It crosses the circle at B and D. The horizontal line crosses it at A and C. '
                          'Draw a vertical line through A. Draw a vertical line through C. '
                          'Draw a horizontal line through B. Draw a horizontal line through D. '
                          'The four lines make a square with corners T2, T4, T6 and T8.',
         'create': {'v': perp('O', 'h'),
                    'B': meet('c', 'v', angle=90), 'C': meet('c', 'h', angle=180), 'D': meet('c', 'v', angle=270),
                    'gE': perp('A', 'h'), 'gW': perp('C', 'h'), 'gN': perp('B', 'v'), 'gS': perp('D', 'v'),
                    'T2': meet('gE', 'gN'), 'T4': meet('gN', 'gW'), 'T6': meet('gW', 'gS'), 'T8': meet('gS', 'gE')},
         'highlight': ['h'], 'animate': 'ruler'},
        {'id': 3, 'text': 'Draw a circle with centre O through T2. It crosses the horizontal line at T1 and T5. '
                          'It crosses the vertical line at T3 and T7. T1 to T8 are the points of the star.',
         'create': {'s': circ('O', 'T2'),
                    'T1': meet('s', 'h', angle=0), 'T3': meet('s', 'v', angle=90),
                    'T5': meet('s', 'h', angle=180), 'T7': meet('s', 'v', angle=270)},
         'highlight': ['T2'], 'animate': 'compass'},
        {'id': 4, 'text': 'The star joins each point to the point three places on.',
         'parts': [
             {'text': 'Draw a straight line through T1 and T4, T2 and T5, T3 and T6, and T4 and T7.',
              'create': {k: lines[k] for k in ['L1', 'L2', 'L3', 'L4']}, 'animate': 'ruler'},
             {'text': 'Draw a straight line through T5 and T8, T6 and T1, T7 and T2, and T8 and T3. '
                      'The lines cross at P1 to P8, the inner corners of the star.',
              'create': {**{k: lines[k] for k in ['L5', 'L6', 'L7', 'L8']}, **pts}, 'animate': 'ruler'},
         ]},
        {'id': 5, 'text': 'Draw a circle with centre A through O. It crosses the horizontal line again at E. '
                          'Draw circles with centres B, C and D through O. They cross the lines through O again at F, G and H. '
                          'Join E, F, G and H to mark the tile that repeats.',
         'create': {'cA': circ('A', 'O'), 'cB': circ('B', 'O'), 'cC': circ('C', 'O'), 'cD': circ('D', 'O'),
                    'E': meet('cA', 'h', farthest='O'), 'F': meet('cB', 'v', farthest='O'),
                    'G': meet('cC', 'h', farthest='O'), 'H': meet('cD', 'v', farthest='O'),
                    'tile': {'polygon': ['E', 'F', 'G', 'H']}},
         'highlight': ['A', 'B', 'C', 'D'], 'animate': 'compass'},
    ]
    return {
        'format': 0, 'id': 'sircali-stars',
        'title': 'Eight-pointed stars of the Sırçalı madrasa (Konya)',
        'short': 'Sırçalı stars', 'subtitle': 'Sırçalı madrasa, Konya',
        'fold': 4, 'star': 8, 'style': 'Seljuk', 'level': 'beginner',
        'construction': construction('BON36'),
        'credits': [
            {'source': 'Tiling Search, data211/BON36: Sırçalı madrasa, Konya', 'creator': 'Brian Wichmann',
             'url': TS + 'data211/BON36.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing (after Jay Bonner, Islamic Geometric Patterns, 2017, fig. 125a); '
                     'the construction is ours.'},
        ],
        'given': {'O': 'The centre of a star.', 'A': 'Any point to the right of O. Neighbouring stars are 2 OA away along each line.'},
        'steps': steps,
        'ink': {'text': 'Ink the star: from T1 through P1, T2, P2 and on round, back to T1.',
                'paths': [{'closed': True, 'through': star}]},
        'pattern': {
            'cell': 'tile',
            'text': 'Put copies of the diamond tile side by side. Neighbouring stars touch at their slanting points. '
                    'The space between four stars closes into a cross with notched arms.',
            'palette': 'Timurid tile',
            'colors': {'star': 'a', 'cross': 'ground'},
        },
        'expect': {
            'note': 'Star 8(√2 − 1), cross 8 − 8(√2 − 1), cell 8.',
            'pieceTypes': 2,
            'pieces': [{'name': 'cross', 'vertices': 16, 'area': 4.68629, 'perCell': 1},
                       {'name': 'star', 'vertices': 16, 'area': 3.31371, 'perCell': 1}],
            'cellArea': 8,
        },
    }


for t in (shah_i_zinda(), qaytbay(), sircali()):
    p = os.path.join(OUT, t['id'] + '.json')
    json.dump(t, open(p, 'w'), ensure_ascii=False, indent=2)
    print('wrote', p)

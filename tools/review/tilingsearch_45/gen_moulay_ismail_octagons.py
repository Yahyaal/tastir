#!/usr/bin/env python3
"""MOR0606. Read with 1_pieces.py --precision 2. Usage: this script
<pieces.json> <tutorial.json>, then finish <dump.json> <tutorial.json>.
Band 5 pt; small-star radius OA=28.9712980420 pt; half-side 4+3*sqrt(2).
Every source corner fits a+b*sqrt(2)/2 within 0.000648 OA. The construction
is the C126A grid; this drawing inks different parts of it.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
import medium
import gen_rabat_throne_octagons as rt


def build():
    rt.build()
    cm.steps[2]['text'] = 'Draw two guide squares.'


SPEC = {**rt.SPEC,
    'id': 'moulay-ismail-octagons', 'title': 'Octagons and pointed stars of the Moulay Ismail mosque (Fez)',
    'short': 'Moulay Ismail octagons', 'subtitle': 'Moulay Ismail mosque, Fez',
    'code': 'MOR0606', 'folder': 'data172', 'frame': ((300.796875, 372.366875), 28.97129804204265, 5, rt.L),
    'given': {'O': 'The centre of a large pointed star.', 'A': 'Sets the point radius of the smaller stars.'},
    'note': 'The finished design was read from Wichmann’s MOR0606 vector drawing. Its band centre lines '
            'were snapped to the square-root-of-two grid in small-star-radius units. '
            'It uses the same construction grid as the Rabat throne-room octagons, '
            'but inks different runs to form the pointed centre star and the twelve-sided pieces.',
    'changes': 'The 5 pt bands are represented by their centre lines. The initial squares at O are guides '
               'for the finished larger star. The palette is illustrative; no photograph was checked.',
    'references': 'His reference is David Wade photograph MOR 0606 of the Moulay Ishmael mosque, Fez '
                  '(the page dates the example to 1437). The tutorial uses the Ismail spelling of the same source attribution.',
    'ink': 'Ink the lines picked out in orange. They close the pointed star, the octagons and the twelve-sided pieces.',
}
NAMES = {(8, 9.657): ('octagon', 'ground'), (16, 5.657): ('pointed_star', 'd'),
         (12, 4.828): ('twelve', 'b'), (6, 3.0): ('long_hexagon', 'a'),
         (16, 2.343): ('star', 'd'), (8, 2.0): ('eight', 'c'),
         (6, 1.828): ('hexagon', 'a'), (8, 1.828): ('arrow', 'c'),
         (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'c'), (4, .414): ('kite', 'ground')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)

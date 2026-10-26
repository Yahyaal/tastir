#!/usr/bin/env python3
"""P77 is the Attarine rosette geometry shifted to another centre and
coloured differently. It shares every construction step. Extract with
1_pieces.py --precision 2. Usage: this script <pieces.json> <tutorial.json>,
then finish <dump.json> <tutorial.json>.
The source's four-petal star is at (299.205625,372.705625); moving O to
its eight-petal neighbour (88.14,161.64) gives the Attarine frame. Its
half-period is 211.065625 pt. Wrap source pieces by full cell translations
to read a whole cell where that centre is near the edge of the PDF.
"""
import json
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
import medium
import gen_attarine_star_rosettes as attarine

ORIGIN, UNIT = (88.14, 161.64), 211.065625


def drawing(pieces):
    raw = cm.frame_pieces(pieces, ORIGIN, 2*UNIT, 0)
    return [[(x+2*i, y+2*j) for x, y in polygon]
            for polygon in raw for i in (-1, 0, 1) for j in (-1, 0, 1)]


SPEC = {
    'id': 'ben-youssef-star-rosettes', 'title': 'Star rosettes of the Ben Youssef madrasa (Marrakesh)',
    'short': 'Ben Youssef star rosettes', 'subtitle': 'Ben Youssef madrasa, Marrakesh',
    'code': 'P77', 'folder': 'data205', 'frame': (ORIGIN, UNIT, 0, 1),
    'given': {'O': 'The centre of an eight-petal rosette.', 'A': 'Halfway to the next rosette on the horizontal line.'},
    'note': 'The finished design was read from Wichmann’s P77 drawing. Its exact tile shapes, areas and '
            'counts agree with the Attarine star rosettes after shifting the centre. '
            'This variation shares all of that tutorial’s construction steps. '
            'The repeat and proportions are the same; the source’s filling distinguishes this version.',
    'changes': 'The source is shifted to place an eight-petal rosette at O, matching the Attarine opening. '
               'The repeated geometry is unchanged. Colours are read from the vector drawing: '
               'the centre star is maroon, the corner star white and the filler stars black. '
               'No photograph was checked.',
    'references': 'His reference is Degeorge and Porter, The Art of the Islamic Tile '
                  '(2002), page 77 bottom left, Ben Youssef madrasa, Marrakesh (1565). '
                  'His page links PG229 as using the same irregular tiles.',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'expect': json.load(open(os.path.join(os.path.dirname(__file__), '../../../tutorials/attarine-star-rosettes.json')))['expect'],
    'placements': {'repeat': [1, 1], 'rules': [
        {'piece': 'star', 'nth': 0, 'color': '#ffffff'},
        {'piece': 'star', 'nth': 4, 'color': '#5e0d12'}]},
}
NAMES = {(16, .069): ('star', 'a'), (6, .088): ('long_hexagon', 'a'),
         (6, .059): ('petal', 'a'), (8, .059): ('eight', 'ground'),
         (7, .056): ('seven', 'c'), (8, .054): ('arrow', 'b'),
         (4, .042): ('rhombus', 'ground'), (3, .015): ('triangle', 'ground'),
         (4, .012): ('kite', 'ground')}
SOURCE_COLORS = {'star': '#000000', 'long_hexagon': '#000000', 'petal': '#000000',
                 'eight': '#ffffff', 'seven': '#404284', 'arrow': '#385c33',
                 'rhombus': '#ffffff', 'triangle': '#ffffff', 'kite': '#ffffff'}
SPEC['placements']['rules'] = ([{'piece': name, 'color': color} for name, color in SOURCE_COLORS.items()]
                                + SPEC['placements']['rules'])
if __name__ == '__main__':
    medium.run(attarine.build, SPEC, NAMES, drawing=drawing)

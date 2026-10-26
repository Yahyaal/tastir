#!/usr/bin/env python3
"""PG229 is the Attarine rosette geometry turned 45 degrees and recoloured.
Extract precision 2. Source frame unit149.25 pt; rotating via (x+y,y-x)/2
makes OA=149.25sqrt(2) pt, the primitive half-period. Corners fit a+bH
within 0.000054 OA. Usage: this script pieces.json tutorial.json; then
finish dump.json tutorial.json. Overlay with period298.5 and rot45.
"""
import json
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
import medium
import gen_attarine_star_rosettes as attarine


def drawing(pieces):
    return [[((x+y)/2,(y-x)/2) for x,y in q]
            for q in cm.frame_pieces(pieces,(297.5,373.414375),298.5,0)]


SPEC={'id':'seville-vanda-star-rosettes','title':'Star rosettes of a Seville tile (V&A)',
    'short':'Seville tile rosettes','subtitle':'Seville tile, Victoria and Albert Museum',
    'code':'PG229','folder':'data8','frame':((297.5,373.414375),149.25,0,1),
    'style':'Spanish','palette':'Alhambra',
    'given':{'O':'The centre of an eight-petal rosette.','A':'Halfway to the next rosette on the horizontal line.'},
    'note':'The finished design was read from Wichmann’s PG229 drawing. Turning the frame by 45 degrees '
           'reveals the same primitive repeat, exact proportions and tile network as the Attarine star rosettes. '
           'This variation shares every construction step. Its source filling distinguishes this version.',
    'changes':'The frame is turned by 45 degrees to match the Attarine opening. The repeated linework is unchanged. '
              'The source colours are retained as placement rules: ochre stars, slate-blue petals and long hexagons, '
              'black seven-sided pieces and arrows, and white remaining pieces. No photograph was checked.',
    'references':'His references are Abas and Salman, Symmetries of Islamic Geometrical Patterns (1995), page 229; '
                 'V&A tile 184:1853, Seville, sixteenth century, cuenca, coloured as in the original; '
                 'and Wade MOR 0322, Attarine madrasa, Fez. His page links the V&A record O159790 and the related MOR0323 drawing.',
    'expect':json.load(open(os.path.join(os.path.dirname(__file__),'../../../tutorials/attarine-star-rosettes.json')))['expect'],
    'placements':{'repeat':[1,1],'rules':[]},
    'ink':'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.'}
COLORS={'star':'#bf8033','long_hexagon':'#668099','petal':'#668099','eight':'#ffffff',
        'seven':'#000000','arrow':'#000000','rhombus':'#ffffff','triangle':'#ffffff','kite':'#ffffff'}
SPEC['placements']['rules']=[{'piece':name,'color':color} for name,color in COLORS.items()]
if __name__=='__main__':medium.run(attarine.build,SPEC,attarine.NAMES,drawing=drawing)

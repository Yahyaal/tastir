#!/usr/bin/env python3
"""BON61 is a filling variation of four-fold-ring-of-circles.
The existing twelve-step construction is reused verbatim, with its tutorial
credit retained. Source OA=206.066017178pt; half-unit a+bH grid residual
0.000025 OA. Read precision2, no band. Usage: this script <out.json>.
Pass an optional placements.json as second argument to override the default
source filling. The default peach indices were verified through player nthOf.
"""
import copy
import json
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
ROOT=os.path.join(os.path.dirname(__file__),'../../..')
BASE=os.path.join(ROOT,'tutorials/four-fold-ring-of-circles.json')


def build(placements=None):
    t=copy.deepcopy(json.load(open(BASE)))
    t.update({'id':'hani-zeynebiye-stars','title':'Stars of the Zeynebiye madrasa (Hani)',
              'short':'Hani Zeynebiye stars','subtitle':'Zeynebiye madrasa, Hani, Turkey','style':'Turkish','star':8})
    t['construction']={'basis':'mixed','fidelity':'adapted','reviewed':'2026-10-26',
        'note':'The finished design was read from Wichmann’s BON61 drawing. Its exact geometry and tile counts '
               'match the existing Four-fold ring of circles, whose twelve steps from Sandy Kurt’s credited tutorial '
               'are reused verbatim. The drawing gives no steps; the comparison establishes the geometric match, '
               'not a historical construction for the madrasa.',
        'changes':'The existing ring-of-circles construction is reused. The source drawing’s navy stars, yellow bowties, '
                  'green and peach pentagons, and brown squares distinguish this filling variation. '
                  'No photograph or monument match was independently checked.'}
    t['credits'].insert(0,{'source':'Tiling Search, data211/BON61: Zeynebiye madrasah, Hani, Turkey',
        'creator':'Brian Wichmann','kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data211/BON61.html',
        'note':'Read from his finished drawing, not construction instructions. His reference is Jay Bonner, '
               'Islamic Geometric Patterns (2016), page 276, figure 154, Zeynebiye madrasa, Hani, Turkey (1000–1300). '
               'Its geometry matches the separately credited Sandy Kurt construction.'})
    t['pattern']['text']='Put copies of the square tile side by side. The ring of stars repeats between the small squares.'
    t['pattern']['look']='tiles'
    t['pattern'].pop('rings',None)
    t['pattern']['placements']=placements or {'repeat':[1,1],'rules':[
        {'piece':name,'color':color} for name,color in
        {'star':'#004080','bowtie':'#ffe680','dart':'#00bf00','square':'#ab4f17'}.items()]
        + [{'piece':'dart','nth':n,'color':'#f8c499'}
           for n in [1,4,10,11,12,13,14,15,21,24,29,31,32,33,34,36]]}
    t['expect'].pop('note',None)
    return t


if __name__=='__main__':
    cm.write(build(json.load(open(sys.argv[2])) if len(sys.argv)>2 else None),sys.argv[1])

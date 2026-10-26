#!/usr/bin/env python3
"""LEON7 is a filling variation of the Attarine star rosettes, sharing all
fourteen construction steps. Precision2 pieces; O=(297.5,373.895625),
OA=253.3pt. Exact a+bH residual0.000103 OA. Usage: this script pieces.json
 tutorial.json; then finish dump.json tutorial.json. Source colours and
player-verified nth choices are retained as placement rules.
"""
import json
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import medium
import gen_attarine_star_rosettes as attarine

SPEC={'id':'leon-mosaic-star-rosettes','title':'Star rosettes of Alberto Leon’s mosaic design',
    'short':'Leon mosaic rosettes','subtitle':'Mosaic in Islamic Design, from Alberto Leon',
    'code':'LEON7','folder':'data194','frame':((297.5,373.895625),253.3,0,1),
    'style':'Islamic','palette':'Alhambra',
    'given':{'O':'The centre of an eight-petal rosette.','A':'Halfway to the next rosette on the horizontal line.'},
    'note':'The finished design was read from Wichmann’s LEON7 drawing. Its primitive repeat, tile network '
           'and exact proportions match the Attarine star rosettes. This filling variation shares all fourteen '
           'construction steps, alongside the Ben Youssef and Seville versions.',
    'changes':'The repeated geometry is unchanged. The source’s red and black stars, blue petals and seven-sided pieces, '
              'ochre and black long hexagons, and white remaining pieces distinguish this version. '
              'The white surround remains divided into the source’s individual tiles. No photograph was checked.',
    'references':'His reference is Alberto Leon, personal communication, Mosaic in Islamic Design. '
                 'The page gives no building or country, and notes that the white surround of the black khatem '
                 'is formed from several white tiles. It links P77 as a design using the same irregular tiles.',
    'expect':json.load(open(os.path.join(os.path.dirname(__file__),'../../../tutorials/attarine-star-rosettes.json')))['expect'],
    'placements':{'repeat':[1,1],'rules':[]},
    'ink':'Ink the lines picked out in orange. They close the rosettes, the stars and the separate pieces between them.'}
COLORS={'star':'#c7000f','long_hexagon':'#db8f26','petal':'#050870','eight':'#ffffff','seven':'#213df2',
        'arrow':'#ffffff','rhombus':'#ffffff','triangle':'#ffffff','kite':'#ffffff'}
SPEC['placements']['rules']=([{'piece':name,'color':color} for name,color in COLORS.items()]
    + [{'piece':name,'nth':n,'color':'#000000'}
       for name,indices in [('star',[0,4]),('long_hexagon',[0,3])] for n in indices])
if __name__=='__main__':medium.run(attarine.build,SPEC,attarine.NAMES)

#!/usr/bin/env python3
"""W85: the unit twelve-pointed star of three squares and a √2-apothem cell.

O=(297.5,375.09)pt, OA=30(3+√3)/√2pt; frame turns15°.
Read only black faces and expand them4.5pt, half the9pt band. The blue
ribbon polygons are rendering details, not extra tiles. The unchanged
opening of IND0403 constructs every ink carrier; the square diagonal
sets the hexagonal repeat. The default look is strapwork, as requested.
"""
import math
import sys

import common as cm
from common import g,step
from gen_agra_twelve_six_stars import build as star, frame
from hexagonal import network

UNIT=30*(3+math.sqrt(3))/math.sqrt(2)
L=math.sqrt(2)


def build():
    star(opening_only=True)
    step('Draw a vertical line through A. Draw a horizontal line through D. They cross at P1. '
         'Draw a circle with centre O through P1. It crosses the horizontal line at N, right of A.', 'compass')
    g.line_par('ax','A','v');g.line_par('dy','D','h');g.meet('P1','ax','dy',(1,1))
    g.circle_through('repeatCircle','O','P1');g.meet('N','repeatCircle','h',(L,0))
    cell=frame('N',L)
    cm.steps[3]['textWithoutHelpers'] = (
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    cm.steps[6]['textWithoutHelpers'] = (
        'P1 is where the vertical through A crosses the horizontal through D. '
        'Draw a circle with centre O through P1. It crosses the horizontal line at N, right of A.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,375.09),2*UNIT,9,keep=lambda p:max(p['fill'])<.01)
    c,s=math.cos(math.pi/12),math.sin(math.pi/12)
    return [[(c*x+s*y,c*y-s*x) for x,y in p] for p in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();paths=cm.along_ink(network(drawing(pieces),cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    tut={'format':0,'id':'mexuar-twelve-star-bands','title':'Twelve-pointed star bands of the Mexuar patio, Alhambra',
        'short':'Mexuar twelve-star bands','subtitle':'Mexuar patio, Alhambra',
        'fold':6,'star':12,'style':'Nasrid','level':'intermediate',
        'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s W85 drawing. The drawing gives no steps. '
                   'The unit star of three squares shares IND0403’s opening. '
                   'The unit-square diagonal fixes the hexagonal repeat; these lines supply every boundary.',
            'changes':'The frame turns15°. The black faces are expanded by4.5pt to recover the9pt band centre lines. '
                      'The ribbon facets are replaced by one strapwork band. The compass steps, order and named points are ours. '
                      'The palette and band colour are illustrative; no monument photograph was independently checked.',
            'reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data18/W85: Alhambra, Mexuar patio','creator':'Brian Wichmann','kind':'drawing',
            'url':'https://tilingsearch.mit.edu/HTML/data18/W85.html',
            'note':'The page cites Wade page85 and SPA1914 for the Mexuar patio, and Field page62 top left, '
                   'the vestibule behind the south wall’s east door. It also records Lee figure10 (Kharraqan), '
                   'Singer page102 (Turkish enamel), O’Kane page79 (Salar and Sangar al-Gawli), '
                   'Topkapi EH762 folio412 (Baghdad Koran), Wade EGY1111 (Qalawun), '
                   'Bonner page243 figure108a (Sultaniyya), Wichmann and Wade figure14.5c, '
                   'Cahier page30, Broug page52 (Herat), Paccard volume2 page193 (Marrakesh), '
                   'and photographs of Shakhrisabz, the Saadian Tombs and Junblat House. These are his attributions.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Alhambra','colors':{},
            'text':'Put copies of the hexagonal tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    inventory=[('star',24,6-2*math.sqrt(3),1),('pentagon',5,3-3*math.sqrt(3)/2,6),
               ('kite',4,2*math.sqrt(3)/3-1,12),('triangle',3,7*math.sqrt(3)/2-6,2)]
    tut['expect']={'pieceTypes':4,'cellArea':round(4*math.sqrt(3),5),
        'note':'Star6−2√3; six pentagons3−3√3/2; twelve kites2√3/3−1; two triangles7√3/2−6. '
               'Their counted areas sum exactly to4√3, the hexagonal cell area.',
        'pieces':[{'name':name,'vertices':n,'area':round(area,5),'perCell':count}
                  for name,n,area,count in inventory]}
    tut['pattern']['colors']={name:'a' for name,_,_,_ in inventory}
    cm.write(tut,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

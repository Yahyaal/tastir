#!/usr/bin/env python3
"""P092: two turned hexagons, expanded2pt to the4pt band centres.

O=(297.5,374.2454166667)pt; OA=20(2+√3)pt; frame turns30°.
Apothem3(√3−1), a horizontal family at3−√3/2 and its crossing
with the right cell side construct the whole pattern.
"""
import math
import sys
import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening,LETTERS
from gen_agra_twelve_six_stars import frame
from hexagonal import network

UNIT=20*(2+math.sqrt(3))
L=3*(math.sqrt(3)-1)


def build():
    opening()
    step('Draw the two hexagons that make the twelve-pointed star.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(2):
        names=[LETTERS[k+2*i] for i in range(6)]
        part={'text':' '.join(f'Draw a straight line through {names[i]} and {names[(i+1)%6]}.' for i in range(6)),
              'create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in range(6):g.line_through(f'st{k+2*i}',names[i],names[(i+1)%6])
    step('Draw a circle with centre O and opening AE. It crosses the horizontal line at N1, right of A.', 'compass')
    g.circle_from('root3','O','A','E');g.meet('N1','root3','h',(math.sqrt(3),0))
    step('Draw a circle with centre N1 and opening OA. It crosses the horizontal line at N2, towards O. '
         'Draw a circle with centre N2 through O. It crosses that line again at N3, right of N2.', 'compass')
    g.circle_from('difference','N1','O','A');g.meet('N2','difference','h',(math.sqrt(3)-1,0))
    g.circle_through('double','N2','O');g.meet('N3','double','h',(2*(math.sqrt(3)-1),0))
    step('Draw a circle with centre N3 and opening from O to N2. '
         'It crosses the horizontal line at N4, right of N3.', 'compass')
    g.circle_from('triple','N3','O','N2');g.meet('N4','triple','h',(L,0))
    cell=frame('N4',L)
    step('Draw a circle with centre A through O. It crosses the horizontal line at N5, right of A. '
         'Draw a circle with centre N5 and opening OA. It crosses that line at N6, right of N5.', 'compass')
    g.circle_through('two','A','O');g.meet('N5','two','h',(2,0))
    g.circle_from('three','N5','O','A');g.meet('N6','three','h',(3,0))
    step('Draw a vertical line through B. It crosses the horizontal line at N7. '
         'Draw a circle with centre N6 and opening from O to N7. '
         'It crosses that line at N8, towards O. Draw a circle with centre O through N8. '
         'It crosses the vertical line at N9, above O.', 'compass')
    g.line_par('bv','B','v');g.meet('N7','bv','h',(math.sqrt(3)/2,0))
    g.circle_from('height','N6','O','N7');g.meet('N8','height','h',(3-math.sqrt(3)/2,0))
    g.circle_through('heightCircle','O','N8');g.meet('N9','heightCircle','v',(0,3-math.sqrt(3)/2))
    step('Draw a horizontal line through N9. Turn it round O by 60°, five times.')
    g.line_par('yh','N9','h');g.repeat('yhCopies',['yh'],'rot6')
    step('The right tile side crosses the line through N9 turned by 300° at Q. '
         'Draw a line through Q parallel to line OC. Turn it round O by 60°, five times.')
    g.meet('Q','frame','yh@5',(L,2*math.sqrt(3)-3))
    g.line_par('gl0','Q','r60');g.repeat('copies0',['gl0'],'rot6')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,374.2454166667),2*UNIT,4)
    c,s=math.cos(math.pi/6),math.sin(math.pi/6)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();paths=cm.along_ink(network(drawing(pieces),cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'bourgoin-92-twelve-stars','title':'Twelve-pointed stars of Bourgoin’s Plate 92',
       'short':'Bourgoin 92 twelve-stars','subtitle':'Bourgoin, Plate92; examples in Cairo',
       'fold':6,'star':12,'style':'Egyptian','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its full point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s P092 drawing. The drawing gives no steps. '
                  'Two turned hexagons make the twelve-pointed star. Compass transfers set the hexagonal repeat '
                  'and one height; a parallel through a crossing completes the mesh.',
           'changes':'The 4pt bands are represented by their centre lines. The teaching frame turns30°. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No monument photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data11/P092: Bourgoin Plate92','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data11/P092.html',
           'note':'The page cites Creswell, volume2, Plate52c, al-Zahir Baybars, Cairo, northwest end of transept(1266–69AD,664–67AH); Hessemer, page36, Qalawun, Cairo, wall decoration(1284–85AD,682–83AH); Abas and Salman, page165; and Bourgoin, Plate92. It links Wade BOU092. No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    s=math.sqrt(3)
    inventory=[('twelve_star',24,12*s-18,1,'c'),('six_star',12,63*s-108,2,'d'),
        ('four_star',8,66*s-114,3,'d'),('hexagon',6,(153-87*s)/4,12,'b'),
        ('kite',4,s-1.5,12,'ground'),('small_kite',4,(9-5*s)/4,12,'a')]
    t['expect']={'pieceTypes':6,'cellArea':round(72*s-108,5),
        'note':'The42 counted source-polygon shoelaces sum exactly to72√3−108=2√3[3(√3−1)]².',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

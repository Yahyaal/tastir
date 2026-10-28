#!/usr/bin/env python3
"""DS1: Qalawun star knots, 10pt bands expanded5pt.

O=(297.5,373.9091666667)pt; OA=20(3+√3)/√2pt; frame turns15°.
The hexagonal apothem is3√2−√6. The inner height is√6−√2/2.
"""
import math
import sys
import common as cm
from common import g,step
from gen_agra_twelve_six_stars import build as star,frame
from hexagonal import network

UNIT=20*(3+math.sqrt(3))/math.sqrt(2)
L=3*math.sqrt(2)-math.sqrt(6)


def build():
    star(opening_only=True)
    step('The first circle crosses the line at 45° from OA at P1, above O. '
         'Draw a circle with centre O and opening AE. It crosses that line at P2, above O. '
         'Draw vertical lines through P1 and P2. They cross the horizontal line at N1 and N2.', 'compass')
    g.meet('P1','c','r45',(math.sqrt(2)/2,math.sqrt(2)/2))
    g.circle_from('root3','O','A','E');g.meet('P2','root3','r45',(math.sqrt(6)/2,math.sqrt(6)/2))
    for p,n,x in [('P1','N1',math.sqrt(2)/2),('P2','N2',math.sqrt(6)/2)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    step('Draw a circle with centre N1 through O. It crosses the horizontal line again at N3, right of N1. '
         'Draw a circle with centre N3 and opening from O to N1. '
         'It crosses that line at N4, right of N3.', 'compass')
    g.circle_through('double','N1','O');g.meet('N3','double','h',(math.sqrt(2),0))
    g.circle_from('triple','N3','O','N1');g.meet('N4','triple','h',(3*math.sqrt(2)/2,0))
    step('Draw a circle with centre N4 and opening from O to N2. '
         'It crosses the horizontal line at N5, towards O. '
         'Draw a circle with centre N5 through O. It crosses that line again at N6, right of N5.', 'compass')
    g.circle_from('difference','N4','O','N2');g.meet('N5','difference','h',(L/2,0))
    g.circle_through('apothem','N5','O');g.meet('N6','apothem','h',(L,0))
    cell=frame('N6',L)
    step('Draw a circle with centre N2 through O. It crosses the horizontal line again at N7, right of N2. '
         'Draw a circle with centre N7 and opening from O to N1. '
         'It crosses that line at N8, towards O.', 'compass')
    g.circle_through('twiceRoot','N2','O');g.meet('N7','twiceRoot','h',(math.sqrt(6),0))
    g.circle_from('height','N7','O','N1');g.meet('N8','height','h',(math.sqrt(6)-math.sqrt(2)/2,0))
    step('Draw a circle with centre O through N8. It crosses the vertical line at N9, above O. '
         'Draw a horizontal line through N9. Turn it round O by 60°, five times.', 'compass')
    g.circle_through('heightCircle','O','N8');g.meet('N9','heightCircle','v',(0,math.sqrt(6)-math.sqrt(2)/2))
    g.line_par('yh','N9','h');g.repeat('yhCopies',['yh'],'rot6')
    step('The right tile side crosses the line through N9 turned by 300° at Q. '
         'Draw a line through Q parallel to line OC. Turn it round O by 60°, five times.')
    g.meet('Q','frame','yh@5',(L,2*math.sqrt(2)-math.sqrt(6)))
    g.line_par('gl0','Q','r60');g.repeat('copies0',['gl0'],'rot6')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,373.9091666667),2*UNIT,10)
    c,s=math.cos(math.pi/12),math.sin(math.pi/12)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();paths=cm.along_ink(network(drawing(pieces),cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'qalawun-twelve-star-knots','title':'Twelve-star knots of Qalawun’s mausoleum',
       'short':'Qalawun twelve-star knots','subtitle':'Qalawun mausoleum, Cairo',
       'fold':6,'star':12,'style':'Egyptian','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its full point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s DS1 drawing. The drawing gives no steps. '
                  'Three squares make the twelve-pointed star. Compass transfers set the hexagonal repeat '
                  'and one height; a parallel through a crossing completes the mesh.',
           'changes':'The 10pt bands are represented by their centre lines. The teaching frame turns15°. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No monument photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data184/DS1: Qalawun mausoleum','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data184/DS1.html',
           'note':'The page cites an email from B. O’Kane, Qalawun, Cairo, Egypt, through personal communication; and Daud Sutton, Islamic Design, page17(2007). No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    s=math.sqrt(3)
    inventory=[('twelve_star',24,6-2*s,1,'a'),('six_star',12,42*s-72,2,'a'),
        ('four_star',8,44*s-76,3,'a'),('hexagon',6,(51-29*s)/2,12,'ground'),
        ('kite',4,2*s/3-1,12,'ground')]
    t['expect']={'pieceTypes':5,'cellArea':round(48*s-72,5),
        'note':'The30 counted source-polygon shoelaces sum exactly to48√3−72=2√3(3√2−√6)².',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

#!/usr/bin/env python3
"""P141: plain eight-type mesh; OA=20(1+√3)pt; frame turns15°.

O=(297.5,373.3795833333)pt. L=2√2+√3−1, D=(1+√2+√6)/2,
X=(L−D)/3. Carrier distancesD (rot12), X,3X,L−X (rot6).
"""
import math
import sys
import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening
from gen_agra_twelve_six_stars import frame,REF
from hexagonal import network

UNIT=20*(1+math.sqrt(3))
L=2*math.sqrt(2)+math.sqrt(3)-1
D=(1+math.sqrt(2)+math.sqrt(6))/2
X=(L-D)/3


def build(opening_only=False):
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line. '
         'The circle’s twelve points on these lines are S1 to S12, counted round it.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    for i in range(12):
        a=15+30*i;g.meet(f'S{i+1}','c',REF[a%180],g.dirdeg(a))
    step('Draw the four triangles that make the twelve-pointed star.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(4):
        names=[f'S{k+1+4*i}' for i in range(3)]
        part={'text':f'Draw a straight line through {names[0]} and {names[1]}, {names[1]} and {names[2]}, '
              f'and {names[2]} and {names[0]}.','create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in range(3):g.line_through(f'st{k+4*i}',names[i],names[(i+1)%3])
    if opening_only:return None
    step('The first circle crosses the line at 45° from OA at P1, above O. '
         'Draw a circle with centre O and opening AE. It crosses that line at P2, above O. '
         'Draw vertical lines through C, P1 and P2. They cross the horizontal line at N1, N2 and N3.', 'compass')
    g.meet('P1','c','r45',(math.sqrt(2)/2,math.sqrt(2)/2))
    g.circle_from('root3','O','A','E');g.meet('P2','root3','r45',(math.sqrt(6)/2,math.sqrt(6)/2))
    for p,n,x in [('C','N1',.5),('P1','N2',math.sqrt(2)/2),('P2','N3',math.sqrt(6)/2)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    step('Draw a circle with centre N1 and opening from O to N2. '
         'It crosses the horizontal line at N4, right of N1. '
         'Draw a circle with centre N4 and opening from O to N3. '
         'It crosses that line at N5, right of N4.', 'compass')
    g.circle_from('sum1','N1','O','N2');g.meet('N4','sum1','h',((1+math.sqrt(2))/2,0))
    g.circle_from('sum2','N4','O','N3');g.meet('N5','sum2','h',(D,0))
    step('Draw a circle with centre N2 through O. It crosses the horizontal line again at N6, right of N2. '
         'Draw a circle with centre N6 through O. It crosses that line again at N7, right of N6.', 'compass')
    g.circle_through('root2','N2','O');g.meet('N6','root2','h',(math.sqrt(2),0))
    g.circle_through('twiceRoot2','N6','O');g.meet('N7','twiceRoot2','h',(2*math.sqrt(2),0))
    step('Draw a circle with centre N7 and opening AE. '
         'It crosses the horizontal line at N8, right of N7. '
         'Draw a circle with centre N8 and opening OA. '
         'It crosses that line at N9, towards O.', 'compass')
    g.circle_from('sum3','N7','A','E');g.meet('N8','sum3','h',(L+1,0))
    g.circle_from('difference','N8','O','A');g.meet('N9','difference','h',(L,0))
    cell=frame('N9',L)
    step('Draw a vertical line through N5. Turn it round O by 30°, eleven times.')
    g.line_par('dv','N5','v');g.repeat('ds',['dv'],'rot12')
    step('Draw a circle with centre N9 and opening from O to N5. '
         'It crosses the horizontal line at N10, towards O. '
         'Draw a vertical line through N10. Turn it round O by 60°, five times.', 'compass')
    g.circle_from('threeX','N9','O','N5');g.meet('N10','threeX','h',(3*X,0))
    g.line_par('threeXv','N10','v');g.repeat('threeXs',['threeXv'],'rot6')
    step('Draw a circle with centre A through O. It crosses the horizontal line at N11, right of A. '
         'Draw a circle with centre N11 and opening OA. It crosses that line at N12, right of N11. '
         'Draw a circle with centre O through N10. It crosses the vertical line at P3, above O.', 'compass')
    g.circle_through('two','A','O');g.meet('N11','two','h',(2,0))
    g.circle_from('three','N11','O','A');g.meet('N12','three','h',(3,0))
    g.circle_through('projectionCircle','O','N10');g.meet('P3','projectionCircle','v',(0,3*X))
    step('Draw a straight line through N12 and P3. Draw a line through A parallel to it. '
         'It crosses the vertical line at P4. Draw a circle with centre O through P4. '
         'It crosses the horizontal line at N13, right of O. '
         'Draw a vertical line through N13. Turn it round O by 60°, five times.', 'compass')
    g.line_through('intercept','N12','P3');g.line_par('third','A','intercept');g.meet('P4','third','v',(0,X))
    g.circle_through('xCircle','O','P4');g.meet('N13','xCircle','h',(X,0))
    g.line_par('xv','N13','v');g.repeat('xs',['xv'],'rot6')
    step('Draw a circle with centre N9 and opening from O to N13. '
         'It crosses the horizontal line at N14, towards O. '
         'Draw a vertical line through N14. Turn it round O by 60°, five times.', 'compass')
    g.circle_from('otherX','N9','O','N13');g.meet('N14','otherX','h',(L-X,0))
    g.line_par('yv','N14','v');g.repeat('ys',['yv'],'rot6')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    cm.steps[6]['textWithoutHelpers']=(
        'The first circle crosses the line at 45° from OA at P1, above O. '
        'Draw a circle with centre O and opening AE. It crosses that line at P2, above O. '
        'N2 is where the vertical through P1 crosses the horizontal line. '
        'Draw vertical lines through C and P2. They cross the horizontal line at N1 and N3.')
    cm.steps[14]['textWithoutHelpers']=(
        'Draw a line through A parallel to the line from N12 to P3. '
        'It crosses the vertical line at P4. Draw a circle with centre O through P4. '
        'It crosses the horizontal line at N13, right of O. '
        'Draw a vertical line through N13. Turn it round O by 60°, five times.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,373.3795833333),2*UNIT,0)
    c,s=math.cos(math.pi/12),math.sin(math.pi/12)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();paths=cm.along_ink(network(drawing(pieces),cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'bourgoin-141-mixed-stars','title':'Mixed stars of Bourgoin’s Plate 141',
       'short':'Bourgoin 141 mixed stars','subtitle':'Bourgoin, Plate141',
       'fold':6,'star':12,'style':'Islamic','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s P141 drawing. The drawing gives no steps. '
                  'Four triangles, compass sums and a third-part construction fix the repeat and parallel families.',
           'changes':'Plain polygon boundaries are retained. The teaching frame turns15°. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No historical photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data12/P141: Bourgoin Plate141','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data12/P141.html',
           'note':'The page cites O’Kane, page197, the minbar of al-Mu’ini, Damietta, Egypt(1400–55AD,802–59AH); Critchlow, page130, noting that its structure differs from Wichmann’s drawing; Abas and Salman, page206; and Bourgoin, Plate141. It links Wade BOU141. No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s,t6=math.sqrt(2),math.sqrt(3),math.sqrt(6)
    inventory=[('twelve_star',24,3*s-3,1,'ground'),('kite',4,(3-s)/4,12,'c'),
        ('hexagon',6,(1-r+t6)/2,12,'b'),('small_hexagon',6,-1.5+1.5*r+s-5*t6/6,12,'c'),
        ('eight',8,-20/3+5*r+25*s/6-25*t6/9,12,'d'),
        ('four_star',8,46-32*r-26*s+56*t6/3,3,'a'),
        ('three_star',6,-4+3*r+5*s/2-5*t6/3,12,'c'),
        ('six_star',12,-8+6*r+5*s-10*t6/3,2,'ground')]
    t['expect']={'pieceTypes':8,'cellArea':round(-12+24*r+24*s-8*t6,5),
        'note':'The66 counted source-polygon shoelaces sum exactly to2√3(2√2+√3−1)².',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

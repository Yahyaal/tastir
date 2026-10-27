#!/usr/bin/env python3
"""MIR24: Fathabad fragments,6pt bands expanded3pt, square frame.

O=(297.5,374.6375)pt. OA is one full regular-hexagon side,
195.4835/[3(1+√3)]≈23.85064234pt. L=3+3√3.
The twelve-star radius is3+√3−√6/2, the eight-star radius√6/2,
and the six-star radius√3. The regular-hexagon unit keeps coefficients small.
"""
import math
import sys
import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening
from gen_agra_twelve_six_stars import REF
from hexagonal import network,clip_poly

L=3+3*math.sqrt(3)
UNIT=195.4835/L
R=3+math.sqrt(3)-math.sqrt(6)/2


def build():
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    step('Draw a circle with centre O and opening AE. It crosses the horizontal line at N1, right of A. '
         'It crosses the line at 45° from OA at P1, above O. '
         'Draw a vertical line through P1. It crosses the horizontal line at N2.', 'compass')
    g.circle_from('root3','O','A','E');g.meet('N1','root3','h',(math.sqrt(3),0))
    g.meet('P1','root3','r45',(math.sqrt(6)/2,math.sqrt(6)/2))
    g.line_par('p1v','P1','v');g.meet('N2','p1v','h',(math.sqrt(6)/2,0))
    step('Draw a circle with centre A through O. It crosses the horizontal line at N3, right of A. '
         'Draw a circle with centre N3 and opening OA. It crosses that line at N4, right of N3.', 'compass')
    g.circle_through('two','A','O');g.meet('N3','two','h',(2,0))
    g.circle_from('three','N3','O','A');g.meet('N4','three','h',(3,0))
    step('Draw a circle with centre N4 and opening from O to N1. '
         'It crosses the horizontal line at N5, right of N4. '
         'Draw a circle with centre N5 and opening from O to N2. '
         'It crosses that line at N6, towards O. Draw a circle with centre O through N6.', 'compass')
    g.circle_from('starSum','N4','O','N1');g.meet('N5','starSum','h',(3+math.sqrt(3),0))
    g.circle_from('starDifference','N5','O','N2');g.meet('N6','starDifference','h',(R,0))
    g.circle_through('starCircle','O','N6')
    step('The larger circle crosses the horizontal and vertical lines, and lines OB, OC, OE and FM. '
         'Its twelve division points are S1 to S12, counted round O.')
    for i in range(12):
        a=30*i;g.meet(f'S{i+1}','starCircle',REF[a%180],(R*math.cos(math.radians(a)),R*math.sin(math.radians(a))))
    step('Draw the three squares that make the twelve-pointed star.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(3):
        pts=[f'S{k+1+3*i}' for i in range(4)]
        part={'text':f'Draw a straight line through {pts[0]} and {pts[1]}, {pts[1]} and {pts[2]}, '
              f'{pts[2]} and {pts[3]}, and {pts[3]} and {pts[0]}.','create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in range(4):g.line_through(f'st{k+3*i}',pts[i],pts[(i+1)%4])
    step('Draw a circle with centre N1 through O. It crosses the horizontal line again at N7, right of N1. '
         'Draw a circle with centre N7 and opening from O to N1. '
         'It crosses that line at N8, right of N7. '
         'Draw a circle with centre N4 and opening from O to N8. '
         'It crosses that line at N9, right of N4.', 'compass')
    g.circle_through('twiceRoot3','N1','O');g.meet('N7','twiceRoot3','h',(2*math.sqrt(3),0))
    g.circle_from('threeRoot3','N7','O','N1');g.meet('N8','threeRoot3','h',(3*math.sqrt(3),0))
    g.circle_from('apothem','N4','O','N8');g.meet('N9','apothem','h',(L,0))
    step('Draw a vertical line through N9. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners T1 to T4.')
    g.line_par('frame','N9','v');g.repeat('frames',['frame'],'rot4')
    cell=[(L,L),(-L,L),(-L,-L),(L,-L)]
    for i,p in enumerate(cell):g.meet(f'T{i+1}','frame' if i==0 else f'frame@{i}',f'frame@{i+1}' if i<3 else 'frame',p)
    step('Draw a vertical line through B. It crosses the horizontal line at N10. '
         'Draw a circle with centre N1 and opening from O to N10. '
         'It crosses that line at N11, right of N1. '
         'Draw a circle with centre N4 and opening from O to N11. '
         'It crosses that line at N12, right of N4.', 'compass')
    g.line_par('bv','B','v');g.meet('N10','bv','h',(math.sqrt(3)/2,0))
    g.circle_from('oneHalfRoot3','N1','O','N10');g.meet('N11','oneHalfRoot3','h',(1.5*math.sqrt(3),0))
    g.circle_from('middleSum','N4','O','N11');g.meet('N12','middleSum','h',(3+1.5*math.sqrt(3),0))
    step('Draw a circle with centre N9 and opening from O to N10. '
         'It crosses the horizontal line at N13, towards O. '
         'Draw a circle with centre N9 through O. It crosses that line again at N14, right of N9. '
         'Draw a circle with centre N14 and opening from O to N2. '
         'It crosses that line at N15, towards O.', 'compass')
    g.circle_from('cornerAxis','N9','O','N10');g.meet('N13','cornerAxis','h',(L-math.sqrt(3)/2,0))
    g.circle_through('doubleL','N9','O');g.meet('N14','doubleL','h',(2*L,0))
    g.circle_from('cornerDiagonal','N14','O','N2');g.meet('N15','cornerDiagonal','h',(2*L-math.sqrt(6)/2,0))
    step('Draw a vertical line through N13. Turn it round O by 90°, three times.')
    g.line_par('cornerXV','N13','v');g.repeat('cornerXs',['cornerXV'],'rot4')
    step('Draw a line through N15 parallel to the line at 45° from OA. Turn it round O by 90°, three times.')
    g.line_par('cornerDI','N15','r45');g.repeat('cornerDs',['cornerDI'],'rot4')
    for i,n in enumerate(['N12','N11','N10']):
        step(f'Draw a vertical line through {n}. Turn it round O by 30°, eleven times.')
        g.line_par(f'carrier{i}',n,'v');g.repeat(f'carriers{i}',[f'carrier{i}'],'rot12')
    plan=[('r165','cornerXV',60,
           'The line at 165° from OA crosses the vertical through N13 at Q1, below O. '
           'Draw a line through Q1 parallel to line OC.'),
          ('r150','cornerXV',30,
           'Line FM crosses the vertical through N13 at Q2, below O. '
           'Draw a line through Q2 parallel to line OB.'),
          ('frame','carrier2@8',30,
           'The right tile side crosses the vertical through N10 turned by 240° at Q3. '
           'Draw a line through Q3 parallel to line OB.'),
          ('r135','gl2',60,
           'The line at 135° from OA crosses the new line at Q4, below O. '
           'Draw a line through Q4 parallel to line OC.')]
    for i,(a,b,angle,text) in enumerate(plan):
        step(text+' Turn it round O by 90°, three times.')
        g.meet(f'Q{i+1}',a,b,g.crossings(a,b)[0]);g.line_par(f'gl{i}',f'Q{i+1}',REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot4')
    cm.steps[4]['textWithoutHelpers']=(
        'Draw the line through O that halves angle BOC. Draw a line through O at 90° to it. '
        'Draw the line through O at 165° from OA.')
    for index,n in [(17,'N11'),(18,'N10')]:
        cm.steps[index]['textWithoutHelpers']=(
            f'Turn the vertical through {n} round O by 30°, 60°, 120°, 150°, 210°, 240°, 300° and 330°.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(297.5,374.6375),2*UNIT,6)


def main():
    pieces,out=sys.argv[1:3];cell=build();edges=[]
    for q in drawing(pieces):
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'fathabad-mixed-stars','title':'Mixed stars of the Fathabad tile fragments',
       'short':'Fathabad mixed stars','subtitle':'Fathabad, Bukhara; Hamburg museum fragments',
       'fold':4,'star':12,'style':'Central Asian','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets one side of a regular hexagon in the finished design.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s MIR24 drawing. The drawing gives no steps. '
                  'A regular-hexagon side is the unit. Compass transfers set the three-square star and the repeat; '
                  'corner-star and parallel families complete the mesh.',
           'changes':'The 6pt bands are represented by their centre lines. The steps, order and named points are ours. '
                     'The palette is illustrative. No fragment photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data216/MIR24: Fathabad tile fragments','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data216/MIR24.html',
           'note':'The page cites Hamburg museum accession1908.472, tile fragments from Fathabad, Bukhara, through personal communication. No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the square tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s,t6=math.sqrt(2),math.sqrt(3),math.sqrt(6)
    inventory=[('twelve_star',24,45+9*s-12*t6,1,'a'),('kite',4,-1.5-3*r+3*s+t6,12,'b'),
        ('hexagon',6,9/4+9*r/2-9*s/4,12,'b'),('ten',10,-1.5*r+4*s,12,'b'),
        ('regular_hexagon',6,3*s/2,12,'d'),('four_star',8,18-6*s,2,'a'),
        ('eight',8,-12+19*s/2,4,'b'),('six_star',12,3*s,4,'a'),
        ('small_eight',8,9/4+3*r/2-5*s/4,4,'b'),
        ('small_kite',4,(81-45*s)/4,4,'b'),('eight_star',16,12-6*r,1,'a')]
    t['expect']={'pieceTypes':11,'cellArea':round(144+72*s,5),
        'note':'The68 counted source-polygon shoelaces sum exactly to144+72√3=4[3(1+√3)]². '
               'The six-star radius is√3 and the eight-star radius√6/2.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

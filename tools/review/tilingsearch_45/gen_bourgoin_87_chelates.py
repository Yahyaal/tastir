#!/usr/bin/env python3
"""B87: plain chelates, OA=15(1+√3)pt, teaching frame15°.

O=(297.5,372.78)pt. D=(1+√2+√6)/2, L=2D, X=L/16.
Carrier distancesD (rot12), X,5X,11X,12X,15X,5X+1/4 (rot6).
Three diagonal halvings construct X from D.
"""
import math
import sys
import common as cm
from common import g,step
from gen_bourgoin_141_mixed_stars import build as opening
from gen_agra_twelve_six_stars import frame
from hexagonal import network

UNIT=15*(1+math.sqrt(3))
D=(1+math.sqrt(2)+math.sqrt(6))/2
L=2*D
X=L/16


def build():
    opening(d_only=True)
    step('Draw a circle with centre N5 through O. It crosses the horizontal line again at N6, right of N5.', 'compass')
    g.circle_through('doubleD','N5','O');g.meet('N6','doubleD','h',(L,0))
    cell=frame('N6',L)
    step('Draw a vertical line through N5. Turn it round O by 30°, eleven times.')
    g.line_par('dv','N5','v');g.repeat('ds',['dv'],'rot12')
    for k,(before,after,p,value) in enumerate([('N5','N7','P3',D/2),('N7','N8','P4',D/4),('N8','N9','P5',D/8)]):
        step(f'Draw a line through {before} parallel to the line at 135° from OA. '
             f'It crosses the line at 45° from OA at {p}. '
             f'Draw a vertical line through {p}. It crosses the horizontal line at {after}.')
        g.line_par(f'half{k}',before,'r135');g.meet(p,f'half{k}','r45',(value,value))
        g.line_par(f'project{k}',p,'v');g.meet(after,f'project{k}','h',(value,0))
    step('Draw a circle with centre N7 and opening from O to N9. '
         'It crosses the horizontal line at N10, right of N7. '
         'Draw a circle with centre N6 and opening from O to N10. '
         'It crosses that line at N11, towards O.', 'compass')
    g.circle_from('fiveX','N7','O','N9');g.meet('N10','fiveX','h',(5*X,0))
    g.circle_from('elevenX','N6','O','N10');g.meet('N11','elevenX','h',(11*X,0))
    step('Draw a circle with centre N6 and opening from O to N7. '
         'It crosses the horizontal line at N12, towards O. '
         'Draw a circle with centre N6 and opening from O to N9. '
         'It crosses that line at N13, towards O.', 'compass')
    g.circle_from('twelveX','N6','O','N7');g.meet('N12','twelveX','h',(12*X,0))
    g.circle_from('fifteenX','N6','O','N9');g.meet('N13','fifteenX','h',(15*X,0))
    step('Draw a line through N1 parallel to the line at 135° from OA. '
         'It crosses the line at 45° from OA at P6. '
         'Draw a vertical line through P6. It crosses the horizontal line at N14. '
         'Draw a circle with centre N10 and opening from O to N14. '
         'It crosses that line at N15, right of N10.', 'compass')
    g.line_par('quarter','N1','r135');g.meet('P6','quarter','r45',(.25,.25))
    g.line_par('quarterProjection','P6','v');g.meet('N14','quarterProjection','h',(.25,0))
    g.circle_from('extra','N10','O','N14');g.meet('N15','extra','h',(5*X+.25,0))
    for pair in [('N9','N13'),('N10','N11'),('N12','N15')]:
        step(f'Draw vertical lines through {pair[0]} and {pair[1]}. Turn them round O by 60°, five times.')
        for n in pair:g.line_par(n+'v',n,'v');g.repeat(n+'copies',[n+'v'],'rot6')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    cm.steps[6]['textWithoutHelpers']=(
        'The first circle crosses the line at 45° from OA at P1, above O. '
        'Draw a circle with centre O and opening AE. It crosses that line at P2, above O. '
        'N2 is where the vertical through P1 crosses the horizontal line. '
        'Draw vertical lines through C and P2. They cross the horizontal line at N1 and N3.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,372.78),2*UNIT,0)
    c,s=math.cos(math.pi/12),math.sin(math.pi/12)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();paths=cm.along_ink(network(drawing(pieces),cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'bourgoin-87-chelates','title':'Star chelates of Bourgoin’s Plate 87',
       'short':'Bourgoin 87 chelates','subtitle':'Bourgoin, Plate87',
       'fold':6,'star':12,'style':'Islamic','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s B87 drawing. The drawing gives no steps. '
                  'The first eight steps are shared with P141. Three diagonal halvings and compass complements '
                  'construct all further parallel families.',
           'changes':'Plain polygon boundaries are retained. The teaching frame turns15°. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No historical photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data188/B87: Bourgoin Plate87','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data188/B87.html',
           'note':'The page cites Jules Bourgoin, Plate87(1879), with no known source, and links Wade BOU087. No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s,t6=math.sqrt(2),math.sqrt(3),math.sqrt(6)
    inventory=[('star',24,3*s-3,1,'ground'),('kite',4,(3-s)/4,12,'c'),
        ('hexagon',6,(1-r+t6)/2,12,'b'),
        ('small_hexagon',6,-1.5+1.5*r+s-5*t6/6,12,'d'),
        ('green_chelate',16,257/64-207*r/128-257*s/256+529*t6/384,6,'b'),
        ('small_kite',4,-57/64+87*r/128+153*s/256-137*t6/384,6,'d'),
        ('brown_chelate',18,57/32+57*r/64+171*s/128+19*t6/64,2,'a'),
        ('white_hexagon',6,3/8+3*r/16+9*s/32+t6/16,12,'ground'),
        ('eight',8,17/32+17*r/64+51*s/128+17*t6/192,6,'d')]
    t['expect']={'pieceTypes':9,'cellArea':round(24+12*r+18*s+4*t6,5),
        'note':'Two green twelve-corner outer contours enclose blue kites. '
               'Subtracting those kites gives the same sixteen-corner chelate as the four other placements. '
               'The69 counted areas sum exactly to2√3(1+√2+√6)².',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

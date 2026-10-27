#!/usr/bin/env python3
"""CR1: Gunbad-i Surkh, band-centre mesh, 7pt ribbons.

O=(297.5,374.5687916667)pt. OA=22pt, a full regular-hexagon side.
The frame turns−15°. Star radius2+√3; outer interceptX=(9√2+5√6)/2;
apothemX/2+√3/2; inner height2√3/5. All are compass constructions.
"""
import math
import sys
import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening
from gen_agra_twelve_six_stars import frame,REF
from hexagonal import network,clip_poly

UNIT=22
L=(9*math.sqrt(2)+2*math.sqrt(3)+5*math.sqrt(6))/4
R=2+math.sqrt(3)
X=(9*math.sqrt(2)+5*math.sqrt(6))/2


def build():
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    step('Draw a circle with centre O and opening AE. It crosses the horizontal line at N1, right of A. '
         'Draw a circle with centre A through O. It crosses that line at N2, right of A.', 'compass')
    g.circle_from('root3','O','A','E');g.meet('N1','root3','h',(math.sqrt(3),0))
    g.circle_through('two','A','O');g.meet('N2','two','h',(2,0))
    step('Draw a circle with centre N2 and opening from O to N1. '
         'It crosses the horizontal line at N3, right of N2. '
         'Draw a circle with centre O through N3.', 'compass')
    g.circle_from('sum','N2','O','N1');g.meet('N3','sum','h',(R,0));g.circle_through('starCircle','O','N3')
    step('The larger circle crosses the lines at 15°, 45° and 75° from OA, and their right-angle lines. '
         'These twelve points are S1 to S12, counted round O.')
    for i in range(12):
        a=15+30*i;g.meet(f'S{i+1}','starCircle',REF[a%180],(R*math.cos(math.radians(a)),R*math.sin(math.radians(a))))
    step('Draw two hexagons through the twelve points.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(2):
        names=[f'S{k+1+2*i}' for i in range(6)]
        part={'text':' '.join(f'Draw a straight line through {names[i]} and {names[(i+1)%6]}.' for i in range(6)),
              'create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in range(6):g.line_through(f'st{k+2*i}',names[i],names[(i+1)%6])
    step('The line through S2 and S4 crosses the horizontal line at Q1, right of O. '
         'Draw a line through Q1 parallel to the line at 135° from OA. '
         'It crosses the line at 45° from OA at P1. '
         'Draw a vertical line through P1. It crosses the horizontal line at N4.')
    g.meet('Q1','h','st1',(X,0));g.line_par('halfDiagonal','Q1','r135')
    g.meet('P1','halfDiagonal','r45',(X/2,X/2));g.line_par('halfProjection','P1','v');g.meet('N4','halfProjection','h',(X/2,0))
    step('Draw a vertical line through B. It crosses the horizontal line at N5. '
         'Draw a circle with centre N4 and opening from O to N5. '
         'It crosses that line at N6, right of N4.', 'compass')
    g.line_par('bv','B','v');g.meet('N5','bv','h',(math.sqrt(3)/2,0))
    g.circle_from('apothem','N4','O','N5');g.meet('N6','apothem','h',(L,0))
    cell=frame('N6',L)
    step('Draw a line through Q1 parallel to line OB. Turn it round O by 60°, five times.')
    g.line_par('outerNet','Q1','r30');g.repeat('outerCopies',['outerNet'],'rot6')
    step('Draw a circle with centre N1 through O. It crosses the horizontal line again at N7, right of N1. '
         'Draw a circle with centre O through N7. It crosses the vertical line at P2, above O.', 'compass')
    g.circle_through('twiceRoot3','N1','O');g.meet('N7','twiceRoot3','h',(2*math.sqrt(3),0))
    g.circle_through('heightCircle','O','N7');g.meet('P2','heightCircle','v',(0,2*math.sqrt(3)))
    step('Draw a circle with centre N2 through O. It crosses the horizontal line again at N8, right of N2. '
         'Draw a circle with centre N8 and opening OA. It crosses that line at N9, right of N8.', 'compass')
    g.circle_through('four','N2','O');g.meet('N8','four','h',(4,0))
    g.circle_from('five','N8','O','A');g.meet('N9','five','h',(5,0))
    step('Draw a straight line through N9 and P2. Draw a line through A parallel to it. '
         'It crosses the vertical line through O at P3.')
    g.line_through('intercept','N9','P2');g.line_par('fifth','A','intercept')
    g.meet('P3','fifth','v',(0,2*math.sqrt(3)/5))
    step('Draw a horizontal line through P3. Turn it round O by 60°, five times.')
    g.line_par('innerNet','P3','h');g.repeat('innerCopies',['innerNet'],'rot6')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    cm.steps[15]['textWithoutHelpers']=(
        'Draw a line through A parallel to the line from N9 to P2. '
        'It crosses the vertical line through O at P3.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,374.5687916667),2*UNIT,7,keep=lambda p:p['fill'][0]>.7)
    c,s=math.cos(-math.pi/12),math.sin(-math.pi/12)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();edges=[]
    # Dense helper crossings can be closer to rounded source corners than
    # the real face junction. Register only against final boundary carriers.
    for name in list(cm.lines()):
        if name not in ['h','v','r30','r60','r120','r150'] and not name.startswith(('st','frame','outerNet','innerNet')):
            del cm.el[name]
    for q in drawing(pieces):
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            # Source rounding makes exterior edges barely graze a cell corner.
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'maragha-twelve-star-bands','title':'Twelve-star bands of Gunbad-i Surkh, Maragha',
       'short':'Maragha twelve-star bands','subtitle':'Gunbad-i Surkh, Maragha',
       'fold':6,'star':12,'style':'Seljuk','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets one side of a regular hexagon in the finished design.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s CR1 drawing. The drawing gives no steps. '
                  'Two turned hexagons, a diagonal intercept and a fifth-part construction fix the band centres.',
           'changes':'The 7pt ribbons are represented by their centre lines. The teaching frame turns−15°. '
                     'The steps, order and named points are ours. The palette and single band colour are illustrative. '
                     'The source’s two-colour weave phase is not claimed as a photograph match. '
                     'No monument photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data210/CR1: Gunbad-i Surkh, Maragha','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data210/CR1.html',
           'note':'The page cites Peter Cromwell, figure2(b), Islamic geometric ornament in Azerbaijan, listed as forthcoming2018; Gunbad-i Surkh, Maragha, Azerbaijan, Central Asia(1148AD,542AH). No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','look':'strapwork','palette':'Mamluk wood','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s,t6=math.sqrt(2),math.sqrt(3),math.sqrt(6)
    inventory=[('star',24,18+12*s,1,'a'),('large_kite',4,(9+5*s)/4,6,'a'),
        ('hexagon',6,249/100-3*r/10+11*s/8-3*t6/10,12,'a'),
        ('six',6,1.5+1.5*r-s+t6/2,6,'a'),('regular_hexagon',6,3*s/2,2,'a'),
        ('rhombus',4,12/5,3,'a'),('pentagon',5,-12/25+3*(r+t6)/5,6,'a'),
        ('small_pentagon',5,-27/10+3*(r+s+t6)/4,6,'a'),('kite',4,(3+s)/4,12,'a')]
    t['expect']={'pieceTypes':9,'cellArea':round((135+27*r+81*s+15*t6)/2,5),
        'note':'The54 counted source-polygon shoelaces sum exactly to2√3L², '
               'where L=(9√2+2√3+5√6)/4. The regular hexagon has unit side.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

#!/usr/bin/env python3
"""SEV2: Alcazar mixed-star mesh,8pt bands expanded4pt.

O=(297.5,373.3770833333)pt; OA=20(1+√3)pt; frame turns30°.
L=(15−√3)/4. The eight-stars have radius√2/2; their oblique
carriers are L/√2±1/2, constructed by projecting a compass circle.
"""
import math
import sys
import common as cm
from common import g,step
from gen_chester_beatty_twelve_stars import build as star
from gen_agra_twelve_six_stars import frame
from hexagonal import network,clip_poly

UNIT=20*(1+math.sqrt(3))
L=(15-math.sqrt(3))/4


def build():
    star(opening_only=True)
    step('Draw a circle with centre A through O. It crosses the horizontal line at N1, right of A. '
         'Draw a circle with centre N1 and opening OA. It crosses that line at N2, right of N1. '
         'Draw a circle with centre O and opening AE. It crosses that line at N3, right of A.', 'compass')
    g.circle_through('two','A','O');g.meet('N1','two','h',(2,0))
    g.circle_from('three','N1','O','A');g.meet('N2','three','h',(3,0))
    g.circle_from('root3','O','A','E');g.meet('N3','root3','h',(math.sqrt(3),0))
    step('Draw a circle with centre N2 and opening from O to N3. '
         'It crosses the horizontal line at N4, towards O. '
         'Draw a line through N4 parallel to the line at 135° from OA. '
         'It crosses the line at 45° from OA at P1. '
         'Draw a vertical line through P1. It crosses the horizontal line at N5.', 'compass')
    d=3-math.sqrt(3)
    g.circle_from('difference','N2','O','N3');g.meet('N4','difference','h',(d,0))
    g.line_par('halfDiagonal','N4','r135');g.meet('P1','halfDiagonal','r45',(d/2,d/2))
    g.line_par('halfProjection','P1','v');g.meet('N5','halfProjection','h',(d/2,0))
    step('Draw a line through N5 parallel to the line at 135° from OA. '
         'It crosses the line at 45° from OA at P2. '
         'Draw a vertical line through P2. It crosses the horizontal line at N6.')
    g.line_par('quarterDiagonal','N5','r135');g.meet('P2','quarterDiagonal','r45',(d/4,d/4))
    g.line_par('quarterProjection','P2','v');g.meet('N6','quarterProjection','h',(d/4,0))
    step('Draw a circle with centre N2 and opening from O to N6. '
         'It crosses the horizontal line at N7, right of N2.', 'compass')
    g.circle_from('apothem','N2','O','N6');g.meet('N7','apothem','h',(L,0))
    cell=frame('N7',L)
    step('Draw a vertical line through C. It crosses the horizontal line at N8. '
         'Draw a circle with centre N7 and opening from O to N8. '
         'It crosses that line at N9, towards O. '
         'Draw a vertical line through N9. Turn it round O by 60°, five times.', 'compass')
    g.line_par('cv','C','v');g.meet('N8','cv','h',(.5,0))
    g.circle_from('axial','N7','O','N8');g.meet('N9','axial','h',(L-.5,0))
    g.line_par('xv','N9','v');g.repeat('xs',['xv'],'rot6')
    step('Draw a circle with centre O through N7. It crosses the line at 45° from OA at P3, above O. '
         'Draw a vertical line through P3. It crosses the horizontal line at N10. '
         'Draw a circle with centre N10 and opening from O to N8. '
         'It crosses that line at N11, towards O.', 'compass')
    g.circle_through('frameCircle','O','N7');g.meet('P3','frameCircle','r45',(L/math.sqrt(2),L/math.sqrt(2)))
    g.line_par('diagonalProjection','P3','v');g.meet('N10','diagonalProjection','h',(L/math.sqrt(2),0))
    g.circle_from('oblique','N10','O','N8')
    g.meet('N11','oblique','h',(L/math.sqrt(2)-.5,0))
    for k in range(1):
        n,p=f'N{11+k}',f'P{4+k}'
        step(f'Draw a circle with centre O through {n}. '
             f'It crosses the line at 135° from OA at {p}, above O. '
             f'Draw a line through {p} parallel to the line at 45° from OA. '
             'Turn it round O by 30°, eleven times.', 'compass')
        value=L/math.sqrt(2)+(-.5 if k==0 else .5)
        g.circle_through(f'oblique{k}','O',n);g.meet(p,f'oblique{k}','r135',(-value/math.sqrt(2),value/math.sqrt(2)))
        g.line_par(f'diagonal{k}',p,'r45');g.repeat(f'diagonals{k}',[f'diagonal{k}'],'rot12')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    cm.steps[4]['textWithoutHelpers']=(
        'Draw the line through O that halves angle BOC. Draw a line through O at 90° to it.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,373.3770833333),2*UNIT,8)
    c,s=math.cos(math.pi/6),math.sin(math.pi/6)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();edges=[]
    for q in drawing(pieces):
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'seville-six-eight-twelve-stars','title':'Six-, eight- and twelve-pointed stars of Seville',
       'short':'Seville mixed stars','subtitle':'Reales Alcázares, Seville',
       'fold':6,'star':12,'style':'Andalusian','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its full point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s SEV2 drawing. The drawing gives no steps. '
                  'The four-triangle opening is shared with F294. A quarter-part construction fixes the repeat, '
                  'and circle projections fix the eight-star carriers.',
           'changes':'The 8pt bands are represented by their centre lines. The teaching frame turns30°. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No monument photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data18/SEV2: Reales Alcázares, Seville','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data18/SEV2.html',
           'note':'The page cites Michael Stephens’s Flickr photograph of the synagogue in Cordova; Abas and Salman, page182; Wade MOR3630x, Bou Inania Madrasah, Meknes; Wade SPA2200 and SPA2504, Alcazar, Seville; Wade SPA3014, Alcazabar, Malaga; and a postcard through Wichmann. No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s=math.sqrt(2),math.sqrt(3)
    inventory=[('twelve_star',24,3*s-3,1,'a'),('six_star',12,s,2,'a'),
        ('eight_star',16,4-2*r,3,'b'),('kite',4,(3-s)/4,12,'ground'),
        ('hexagon',6,-1.5+11*s/6,6,'d'),('eight',8,1.5+r/2-s/2,6,'d'),
        ('triangle',3,-27/16+9*s/8,12,'ground'),('red_eight',8,-1.5+r/2+5*s/6,6,'c')]
    t['expect']={'pieceTypes':8,'cellArea':round(-45/4+57*s/2,5),
        'note':'The48 counted source-polygon shoelaces sum exactly to2√3[(15−√3)/4]². '
               'The six-star radius is1 and the eight-star radius√2/2.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

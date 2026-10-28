#!/usr/bin/env python3
"""AJL8: al-Otrush chelates, with5pt bevel bands expanded to their centres.

O=(297.5,373.1829166667)pt, OA=15(3+√3)/√2pt, frame unturned.
L=7/3+√3 and X=L/16. All carriers follow from thirds and halvings.
"""
import math
import sys
import common as cm
from common import g,step
from gen_qawsun_quran_stars import build as star_opening
from gen_agra_twelve_six_stars import frame,REF
from hexagonal import network,clip_poly

UNIT=15*(3+math.sqrt(3))/math.sqrt(2)
L=7/3+math.sqrt(3)
X=L/16


def build():
    star_opening(opening_only=True)
    step('Draw a circle with centre A through O. It crosses the horizontal line at N1, right of A. '
         'Draw a circle with centre N1 and opening OA. It crosses that line at N2, right of N1.', 'compass')
    g.circle_through('two','A','O');g.meet('N1','two','h',(2,0))
    g.circle_from('three','N1','O','A');g.meet('N2','three','h',(3,0))
    step('Draw a straight line through N2 and D. Draw a line through A parallel to it. '
         'It crosses the vertical line at P1. Draw a circle with centre O through P1. '
         'It crosses the horizontal line at N3, right of O.', 'compass')
    g.line_through('intercept','N2','D');g.line_par('third','A','intercept');g.meet('P1','third','v',(0,1/3))
    g.circle_through('thirdCircle','O','P1');g.meet('N3','thirdCircle','h',(1/3,0))
    step('Draw a circle with centre O and opening AE. It crosses the horizontal line at N4, right of A. '
         'Draw a circle with centre N1 and opening from O to N3. '
         'It crosses that line at N5, right of N1. Draw a circle with centre N5 and opening from O to N4. '
         'It crosses that line at N6, right of N5.', 'compass')
    g.circle_from('root3','O','A','E');g.meet('N4','root3','h',(math.sqrt(3),0))
    g.circle_from('sevenThirds','N1','O','N3');g.meet('N5','sevenThirds','h',(7/3,0))
    g.circle_from('apothem','N5','O','N4');g.meet('N6','apothem','h',(L,0))
    cell=frame('N6',L)
    for k in range(4):
        before=f'N{6+k}';after=f'N{7+k}';p=f'P{k+2}';value=L/(2**(k+1))
        step(f'Draw a line through {before} parallel to the line at 135° from OA. '
             f'It crosses the line at 45° from OA at {p}. Draw a vertical line through {p}. '
             f'It crosses the horizontal line at {after}.')
        g.line_par(f'half{k}',before,'r135');g.meet(p,f'half{k}','r45',(value,value))
        g.line_par(f'halfProjection{k}',p,'v');g.meet(after,f'halfProjection{k}','h',(value,0))
    step('Draw a circle with centre N9 and opening from O to N10. '
         'It crosses the horizontal line at N11, right of N9. '
         'Draw a circle with centre N7 and opening from O to N9. '
         'It crosses that line at N12, right of N7.', 'compass')
    g.circle_from('threeX','N9','O','N10');g.meet('N11','threeX','h',(3*X,0))
    g.circle_from('tenX','N7','O','N9');g.meet('N12','tenX','h',(10*X,0))
    step('Draw a circle with centre N6 and opening from O to N11. '
         'It crosses the horizontal line at N13, towards O. '
         'Draw a circle with centre N6 and opening from O to N10. '
         'It crosses that line at N14, towards O.', 'compass')
    g.circle_from('thirteenX','N6','O','N11');g.meet('N13','thirteenX','h',(13*X,0))
    g.circle_from('fifteenX','N6','O','N10');g.meet('N14','fifteenX','h',(15*X,0))
    for names in [('N10','N11'),('N12','N13'),('N14',)]:
        subject=f'{names[0]} and {names[1]}' if len(names)>1 else names[0]
        step(f'Draw vertical lines through {subject}. Turn them round O by 60°, five times.' if len(names)>1 else
             f'Draw a vertical line through {subject}. Turn it round O by 60°, five times.')
        for n in names:g.line_par(n+'v',n,'v');g.repeat(n+'copies',[n+'v'],'rot6')
    plan=[('N6',None,None,30,'Draw a line through N6 parallel to line BH.'),
        ('Q1','r135','gl0',60,'The line at 135° from OA crosses the last line at Q1, below O. Draw a line through Q1 parallel to line CJ.'),
        ('Q2','r165','gl1',30,'The line at 165° from OA crosses the last line at Q2, below O. Draw a line through Q2 parallel to line BH.')]
    for i,(p,a,b,angle,text) in enumerate(plan):
        step(text+' Turn it round O by 60°, five times.')
        if a:g.meet(p,a,b,g.crossings(a,b)[0])
        g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot6')
    cm.steps[3]['textWithoutHelpers'] = (
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    cm.steps[4]['textWithoutHelpers'] = (
        'Draw the line through O that halves angle BOC. Draw a line through O at 90° to it.')
    cm.steps[7]['textWithoutHelpers'] = (
        'Draw a line through A parallel to the line from D to N2. It crosses the vertical line at P1. '
        'Draw a circle with centre O through P1. It crosses the horizontal line at N3, right of O.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(297.5,373.1829166667),2*UNIT,5,
        keep=lambda p:max(p['fill'])-min(p['fill'])>.05)


def main():
    pieces,out=sys.argv[1:3];cell=build();polys=drawing(pieces)
    polys=[[(x+2*L*i+L*j,y+math.sqrt(3)*L*j) for x,y in q] for q in polys
           for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in polys:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'otrush-star-chelates','title':'Star chelates of al-Otrush mosque, Aleppo',
        'short':'Al-Otrush star chelates','subtitle':'Al-Otrush mosque, Aleppo, Syria',
        'fold':6,'star':12,'style':'Syrian','level':'advanced',
        'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s AJL8 drawing. The drawing gives no steps. '
                   'The first six steps share the Qawsun three-square opening. A third, compass sum and four diagonal halvings set the repeat and carrier distances.',
            'changes':'Grey bevel facets are removed and the5pt bands represented by their centre lines. '
                      'The steps, order and named points are ours. The palette is illustrative. '
                      'No monument photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data198/AJL8: al-Otrush mosque','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data198/AJL8.html',
            'note':'The page cites Dick Osseman’s photograph of al-Otrush mosque, Aleppo, Syria(1370–1400AD,771–802AH), supplied through personal communication. No photograph was independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Mamluk wood','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    s=math.sqrt(3)
    inventory=[('star',24,6-2*s,1),('kite',4,-1+2*s/3,12),
        ('eight',8,-5/6+47*s/54,12),('large_kite',4,16/9-8*s/9,12),
        ('fifteen',15,2467/1152+757*s/1728,6),('small_kite',4,-5/18+7*s/27,6),
        ('ten',10,91/96+247*s/432,6),('fourteen',14,119/64+323*s/288,3),
        ('hexagon',6,7/64+19*s/288,2)]
    t['expect']={'pieceTypes':9,'cellArea':round(28+152*s/9,5),
        'note':'The60 counted source-polygon shoelaces sum exactly to28+152√3/9=2√3(7/3+√3)².',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c in inventory]}
    t['pattern']['colors']={n:'a' for n,_,_,_ in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

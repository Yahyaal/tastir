#!/usr/bin/env python3
"""MOR1118: square mixed-star rosette,6pt bands expanded3pt.

O=(297.5,373.01875)pt, OA=17(1+√3)pt; no teaching-frame turn.
The square half-side is(3+5√2+√6)/2. Two free lengths in the
source edge system are fixed by this repeat and the half inner-star edge.
"""
import math
import sys
import common as cm
from common import g,step
from gen_chester_beatty_twelve_stars import build as opening
from gen_salim_chishti_dodecagons import LETTERS
from gen_agra_twelve_six_stars import REF
from hexagonal import network,clip_poly

UNIT=17*(1+math.sqrt(3))
L=(3+5*math.sqrt(2)+math.sqrt(6))/2
PLAN=[{'a': 'v', 'angle': 0, 'b': 'st5', 'branch': 'near'},
 {'a': 'st6', 'angle': 30, 'b': 'rimLine', 'branch': 'near'},
 {'a': 'st0', 'angle': 30, 'b': 'sixAxis', 'branch': 'near'},
 {'a': 'st0', 'angle': 90, 'b': 'sixAxis', 'branch': 'near'},
 {'a': 'st6', 'angle': 30, 'b': 'frame', 'branch': 'near'},
 {'a': 'frame', 'angle': 45, 'b': 'halfInner', 'branch': 'near'},
 {'a': 'N1v', 'angle': 45, 'b': 'gl2@11', 'branch': 'near'},
 {'a': 'N15project', 'angle': 135, 'b': 'gl6', 'branch': 'near'},
 {'a': 'frame@3', 'angle': 45, 'b': 'projectHalf', 'branch': 'near'},
 {'a': 'frame', 'angle': 135, 'b': 'gl8', 'branch': 'near'},
 {'a': 'frame@2', 'angle': 135, 'b': 'gl6', 'branch': 'near'}]


def halve(before,after,point,value):
    step(f'Draw a line through {before} parallel to the line at 135° from OA. '
         f'It crosses the line at 45° from OA at {point}. Draw a vertical line through {point}. '
         f'It crosses the horizontal line at {after}.')
    g.line_par(after+'half',before,'r135');g.meet(point,after+'half','r45',(value,value))
    g.line_par(after+'project',point,'v');g.meet(after,after+'project','h',(value,0))


def transfers(plan):
    for start in range(0,len(plan),2):
        group=plan[start:start+2];texts=[]
        for after,centre,a,b,value,direction in group:
            texts.append(f'Draw a circle with centre {centre} and opening from {a} to {b}. '
                         f'It crosses the horizontal line at {after}, {direction}.')
        step(' '.join(texts),'compass')
        for after,centre,a,b,value,_ in group:
            g.circle_from(after+'circle',centre,a,b);g.meet(after,after+'circle','h',(value,0))


def description(name):
    base,_,copy=name.partition('@')
    if base in ['h','v']:text=('horizontal' if base=='h' else 'vertical')+' line through O'
    elif base.startswith('r') and base[1:].isdigit():text=f'{base[1:]}° line through O'
    elif base.startswith('st'):
        i=int(base[2:]);text=f'line {LETTERS[i]}{LETTERS[(i+4)%12]}'
    elif base=='frame':text='right tile side'
    elif base=='halfInner':text='135° line through N1'
    elif base=='sixAxis':text='horizontal line through P3'
    elif base.startswith('N'):
        n=base.removesuffix('project').removesuffix('v');text=f'vertical line through {n}'
    elif base.startswith('gl'):
        i=int(base[2:]);angle=PLAN[i]['angle']
        text=(('horizontal' if angle==0 else 'vertical') if angle in [0,90] else f'{angle}°')+f' line through Q{i+1}'
    else:
        text={'projectHalf':'vertical line through N10','ring':'vertical line through N24','petalLine':'vertical line through N27',
              'rimLine':'vertical line through N30','quarterDiag':'45° line through N10',
              'diagonalRing':'135° line through P10','cornerOuter':'135° line through P11',
              'cornerInner':'135° line through P12'}[base]
    if copy:text+=f' turned {int(copy)*(90 if base=="frame" else 30)}°'
    return text


def build():
    opening(opening_only=True)
    step('The first circle crosses the line at 45° from OA at P1, above O. '
         'Draw a circle with centre O and opening AE. It crosses that line at P2, above O. '
         'Draw vertical lines through P1, P2 and C. They cross the horizontal line at N1, N2 and N3.', 'compass')
    g.meet('P1','c','r45',(math.sqrt(2)/2,math.sqrt(2)/2))
    g.circle_from('root3','O','A','E');g.meet('P2','root3','r45',(math.sqrt(6)/2,math.sqrt(6)/2))
    for p,n,x in [('P1','N1',math.sqrt(2)/2),('P2','N2',math.sqrt(6)/2),('C','N3',.5)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    step('Draw a circle with centre A and opening from O to N3. '
         'It crosses the horizontal line at N4, right of A. '
         'Draw a circle with centre N1 through O. It crosses that line again at N5, right of N1.', 'compass')
    g.circle_from('threeHalves','A','O','N3');g.meet('N4','threeHalves','h',(1.5,0))
    g.circle_through('root2','N1','O');g.meet('N5','root2','h',(math.sqrt(2),0))
    step('Draw a circle with centre N5 through O. It crosses the horizontal line again at N6, right of N5. '
         'Draw a circle with centre N6 and opening from O to N1. It crosses that line at N7, right of N6.', 'compass')
    g.circle_through('twoRoot2','N5','O');g.meet('N6','twoRoot2','h',(2*math.sqrt(2),0))
    g.circle_from('fiveHalvesRoot2','N6','O','N1');g.meet('N7','fiveHalvesRoot2','h',(5*math.sqrt(2)/2,0))
    step('Draw a circle with centre N7 and opening from O to N2. It crosses the horizontal line at N8, right of N7. '
         'Draw a circle with centre N8 and opening from O to N4. It crosses that line at N9, right of N8.', 'compass')
    g.circle_from('firstSum','N7','O','N2');g.meet('N8','firstSum','h',((5*math.sqrt(2)+math.sqrt(6))/2,0))
    g.circle_from('halfSide','N8','O','N4');g.meet('N9','halfSide','h',(L,0))
    step('Draw a vertical line through N9. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners T1 to T4.')
    g.line_par('frame','N9','v');g.repeat('frames',['frame'],'rot4')
    cell=[(L,L),(-L,L),(-L,-L),(L,-L)]
    for i,p in enumerate(cell):g.meet(f'T{i+1}','frame' if i==0 else f'frame@{i}',f'frame@{i+1}' if i<3 else 'frame',p)
    step('The line at 30° from OA crosses the right tile side at P3. '
         'Draw a horizontal line through P3. Turn it round O by 30°, eleven times.')
    g.meet('P3','r30','frame',(L,L/math.sqrt(3)))
    g.line_par('sixAxis','P3','h');g.repeat('sixAxes',['sixAxis'],'rot12')
    step('Draw a line through N1 parallel to the line at 135° from OA. '
         'It crosses the line at 45° from OA at P4. Draw a vertical line through P4. '
         'It crosses the horizontal line at N10. Draw a line through N10 at 45° from OA. '
         'Turn it round O by 30°, eleven times.')
    g.line_par('halfInner','N1','r135');g.meet('P4','halfInner','r45',(math.sqrt(2)/4,math.sqrt(2)/4))
    g.line_par('projectHalf','P4','v');g.meet('N10','projectHalf','h',(math.sqrt(2)/4,0))
    g.line_par('quarterDiag','N10','r45');g.repeat('quarterDiags',['quarterDiag'],'rot12')
    step('The circle with centre O and opening AE crosses the horizontal line at N11, right of O.','fade')
    g.meet('N11','root3','h',(math.sqrt(3),0))
    for before,after,p,value in [('N11','N12','P5',math.sqrt(3)/2),
        ('N12','N13','P6',math.sqrt(3)/4),('N13','N14','P7',math.sqrt(3)/8),
        ('N3','N15','P8',.25),('N15','N16','P9',.125)]:halve(before,after,p,value)
    r,s,t=math.sqrt(2),math.sqrt(3),math.sqrt(6)
    transfers([
        ('N17','N3','O','N16',3/8,'towards O'),
        ('N18','N13','O','N14',3*s/8,'right of N13'),
        ('N19','N3','O','N16',5/8,'right of N3'),
        ('N20','N2','O','N2',t,'right of N2'),
        ('N21','N20','O','N11',t+s,'right of N20'),
        ('N22','N21','O','N13',t+5*s/4,'right of N21'),
        ('N23','N22','O','N1',t+5*s/4-r/2,'towards O'),
        ('N24','N23','O','N3',t+5*s/4-r/2-.5,'towards O'),
        ('N25','N20','O','N1',t+r/2,'right of N20'),
        ('N26','N25','O','N10',t+3*r/4,'right of N25'),
        ('N27','N26','N14','N17',t+3*r/4+s/8-3/8,'towards O'),
        ('N28','N8','O','N1',3*r+t/2,'right of N8'),
        ('N29','N28','O','N18',3*r+t/2-3*s/8,'towards O'),
        ('N30','N29','O','N19',3*r+t/2-3*s/8-5/8,'towards O'),
        ('N31','A','O','A',2,'right of A'),
        ('N32','N31','O','N15',2.25,'right of N31'),
        ('N33','N32','O','N12',2.25+s/2,'right of N32'),
        ('N34','N33','O','N33',4.5+s,'right of N33'),
        ('N35','N5','O','N10',5*r/4,'right of N5'),
        ('N36','N34','O','N35',4.5+s+5*r/4,'right of N34'),
        ('N37','N34','O','N15',4.75+s,'right of N34'),
        ('N38','N1','O','N10',3*r/4,'right of N1'),
        ('N39','N37','O','N38',4.75+s+3*r/4,'right of N37')])
    for n,name in [('N24','ring'),('N27','petalLine'),('N30','rimLine')]:
        step(f'Draw a vertical line through {n}. Turn it round O by 30°, eleven times.')
        g.line_par(name,n,'v');g.repeat(name+'copies',[name],'rot12')
    for n,p,name in [('N33','P10','diagonalRing'),('N36','P11','cornerOuter'),('N39','P12','cornerInner')]:
        step(f'Draw a circle with centre O through {n}. '
             f'It crosses the line at 45° from OA at {p}, above O. '
             f'Draw a line through {p} at 90° to the line from O to {p}. '
             'Turn it round O by 30°, eleven times.','compass')
        g.circle_through(name+'circle','O',n);roots=g.crossings(name+'circle','r45')
        g.meet(p,name+'circle','r45',max(roots,key=lambda xy:xy[1]))
        g.line_perp(name,p,'r45');g.repeat(name+'copies',[name],'rot12')
    for i,event in enumerate(PLAN):
        a,b,angle=event['a'],event['b'],event['angle'];p=f'Q{i+1}'
        draw=(f'Draw a horizontal line through {p}.' if angle==0 else
              f'Draw a vertical line through {p}.' if angle==90 else
              f'Draw a line through {p} at {angle}° from OA.')
        step(f'The {description(a)} crosses the {description(b)} at {p}. '+draw+
             ' Turn it round O by 30°, eleven times.')
        g.meet(p,a,b,g.crossings(a,b)[0]);g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot12')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H.')
    cm.steps[4]['textWithoutHelpers']=(
        'Draw the line through O that halves angle BOC. Draw a line through O at 90° to it.')
    cm.steps[11]['textWithoutHelpers']=cm.steps[11]['text'].replace(' Turn it round O by 30°, eleven times.','')
    omitted={13:[1,2,4,5,7,8,10,11],35:[1,2,4,5,7,8,10,11],
        36:[1,2,4,5,7,8,10,11],37:[1,2,4,5,7,8,10,11],42:[2,5,8,11],
        **{number:[1,2,4,5,7,8,10,11] for number in range(43,49)}}
    for number,hidden in omitted.items():
        turns=[f'{30*k}°' for k in range(1,12) if k not in hidden]
        words=', '.join(turns[:-1])+' and '+turns[-1]
        cm.steps[number-1]['textWithoutHelpers']=cm.steps[number-1]['text'].replace(
            'Turn it round O by 30°, eleven times.',f'Turn it round O by {words}.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(297.5,373.01875),2*UNIT,6)


INVENTORY=[('twelve_star', 24, ['-3', '0', '3', '0'], 1, 'a'),
 ('six_star', 12, ['0', '0', '1', '0'], 4, 'c'),
 ('petal', 6, ['1/2', '2', '-2/3', '-1/3'], 12, '#87b2a8'),
 ('ochre_eight', 8, ['-6', '-6', '5/2', '14/3'], 4, 'd'),
 ('blue_hex', 6, ['-13/4', '-1', '1/12', '7/3'], 8, 'b'),
 ('eight_star', 16, ['4', '-2', '0', '0'], 3, 'a'),
 ('black_eight', 8, ['-11/8', '3/4', '-29/48', '1'], 16, 'a'),
 ('hexagon', 6, ['1', '0', '0', '0'], 12, 'b'),
 ('black_other_eight', 8, ['-1/4', '5/2', '-11/12', '-1/3'], 4, 'a'),
 ('blue_notch', 6, ['-3/4', '0', '-1/4', '5/6'], 4, 'b'),
 ('blue_angle', 6, ['-7/4', '0', '1/4', '5/6'], 4, 'b'),
 ('black_middle_eight', 8, ['-27/32', '1', '-9/32', '1/4'], 8, 'a'),
 ('green_hex', 6, ['3/4', '0', '5/12', '-1/3'], 8, 'ground'),
 ('black_hex', 6, ['0', '0', '1/3', '0'], 16, 'a'),
 ('blue_small_hex', 6, ['-3/2', '-3', '1/3', '7/3'], 4, 'b'),
 ('black_seven', 7, ['29/8', '0', '-5/8', '-5/6'], 8, 'a'),
 ('rhombus', 4, ['1/2', '0', '0', '0'], 12, 'a'),
 ('ten', 10, ['1/2', '0', '0', '0'], 12, 'b'),
 ('pink_four', 4, ['-45/32', '13/16', '-9/16', '11/16'], 8, 'c'),
 ('pink_hex', 6, ['-365/32', '-1/8', '361/96', '9/4'], 4, 'c'),
 ('blue_eight', 8, ['-69/16', '3/8', '2/3', '5/4'], 8, 'b'),
 ('blue_small_eight', 8, ['-3/32', '3/8', '-1/96', '0'], 8, 'b'),
 ('black_four', 4, ['3/4', '0', '-1/4', '0'], 12, 'a'),
 ('pink_seven', 7, ['1/16', '9/8', '-13/24', '-1/6'], 8, 'c'),
 ('small_rhombus', 4, ['0', '0', '1/6', '0'], 12, 'a'),
 ('ochre_kite', 4, ['157/32', '-39/8', '189/32', '-13/4'], 4, 'd'),
 ('black_ten', 10, ['5/8', '-1/4', '0', '0'], 12, 'a'),
 ('black_five', 5, ['3/8', '-1/4', '17/48', '-1/6'], 16, 'a'),
 ('triangle', 3, ['173/32', '-65/16', '181/48', '-39/16'], 8, 'a'),
 ('narrow_four', 4, ['-1/2', '1/2', '0', '0'], 16, 'a'),
 ('dart', 4, ['101/4', '14', '-49/4', '-29/3'], 4, 'a')]
PLACEMENTS=[{'piece':'petal','color':'#87b2a8'},{'color': 'd', 'nth': 2, 'piece': 'small_rhombus'},
 {'color': 'd', 'nth': 3, 'piece': 'small_rhombus'},
 {'color': 'd', 'nth': 4, 'piece': 'small_rhombus'},
 {'color': 'd', 'nth': 5, 'piece': 'small_rhombus'},
 {'color': 'd', 'nth': 8, 'piece': 'small_rhombus'},
 {'color': 'd', 'nth': 9, 'piece': 'small_rhombus'},
 {'color': 'd', 'nth': 10, 'piece': 'small_rhombus'},
 {'color': 'd', 'nth': 11, 'piece': 'small_rhombus'},
 {'color': 'd', 'nth': 1, 'piece': 'ten'},
 {'color': 'd', 'nth': 2, 'piece': 'ten'},
 {'color': 'd', 'nth': 5, 'piece': 'ten'},
 {'color': 'd', 'nth': 6, 'piece': 'ten'},
 {'color': 'd', 'nth': 7, 'piece': 'ten'},
 {'color': 'd', 'nth': 8, 'piece': 'ten'},
 {'color': 'd', 'nth': 9, 'piece': 'ten'},
 {'color': 'd', 'nth': 11, 'piece': 'ten'}]


def main():
    from fractions import Fraction
    pieces,out=sys.argv[1:3];cell=build();polys=drawing(pieces)
    polys=[[(x+2*L*i,y+2*L*j) for x,y in q] for q in polys for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in polys:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'rabat-mixed-star-rosette','title':'Mixed-star rosette from Rabat',
        'short':'Rabat mixed-star rosette','subtitle':'Mosque, Rabat, Morocco',
        'fold':4,'star':12,'style':'Maghrebi','level':'advanced',
        'given':{'O':'The centre of the large twelve-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s MOR1118 drawing. The drawing gives no steps. '
                   'The first six steps share the Chester Beatty four-triangle opening. Compass sums and diagonal halvings locate the rosette and mixed-star mesh.',
            'changes':'The6pt bands are represented by their centre lines. The square half-side is(3+5√2+√6)/2 of the twelve-star radius. '
                      'The half inner-star edge sets the smaller stars. Extra guide turns do not assert extra symmetry of the finished ink. '
                      'The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
            'reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data190/MOR1118: mosque in Rabat','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data190/MOR1118.html',
            'note':'The page cites David Wade’s photograph MOR1118, mosque, Rabat, Morocco, Pattern in Islamic Art website(2015). Its photograph link is PIA1500. No building photograph was independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the square tile side by side.'},
        'expect':{}}
    basis=[1,math.sqrt(2),math.sqrt(3),math.sqrt(6)]
    area=lambda coeff:round(sum(float(Fraction(x))*b for x,b in zip(coeff,basis)),5)
    t['expect']={'pieceTypes':len(INVENTORY),'cellArea':round(65+30*math.sqrt(2)+20*math.sqrt(3)+6*math.sqrt(6),5),
        'note':'Independent exact source shoelaces account for260 faces. Their counted areas sum to65+30√2+20√3+6√6, exactly the square area.',
        'pieces':[{'name':n,'vertices':v,'area':area(a),'perCell':c,**({'small':True} if n in ['pink_seven','small_rhombus','ochre_kite','black_ten','black_five','triangle','narrow_four','dart'] else {})} for n,v,a,c,_ in INVENTORY]}
    t['pattern']['colors']={n:color if not color.startswith('#') else 'c' for n,_,_,_,color in INVENTORY}
    if PLACEMENTS:t['pattern']['placements']={'repeat':[1,1],'rules':PLACEMENTS}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

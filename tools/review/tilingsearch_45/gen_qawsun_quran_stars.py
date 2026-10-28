#!/usr/bin/env python3
"""DA1: plain manuscript lattice. O=(299.56,373.06)pt.

OA=20(3+√3)/√2pt, twelve-star radius. The frame turns45° onto
the true square slides(±183.923,±183.923)pt. Half-sideL=(3+5√3)/6.
The corner eight-star radius is√2(L−5/3), located by earlier crossings.
"""
import math
import sys
import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening,LETTERS
from gen_agra_twelve_six_stars import REF
from hexagonal import network,clip_poly

UNIT=20*(3+math.sqrt(3))/math.sqrt(2)
L=(3+5*math.sqrt(3))/6
D=L-5/3


def build(opening_only=False):
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    step('Draw the three squares that make the twelve-pointed star.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(3):
        pts=[LETTERS[k+3*i] for i in range(4)]
        part={'text':f'Draw a straight line through {pts[0]} and {pts[1]}, {pts[1]} and {pts[2]}, '
              f'{pts[2]} and {pts[3]}, and {pts[3]} and {pts[0]}.','create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in range(4):g.line_through(f'st{k+3*i}',pts[i],pts[(i+1)%4])
    if opening_only:return None
    step('Draw vertical lines through B and C. They cross the horizontal line at N1 and N2. '
         'Draw a circle with centre A through O. It crosses that line at N3, right of A. '
         'Draw a circle with centre N3 and opening OA. It crosses that line at N4, right of N3.', 'compass')
    for p,n,x in [('B','N1',math.sqrt(3)/2),('C','N2',.5)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    g.circle_through('two','A','O');g.meet('N3','two','h',(2,0))
    g.circle_from('three','N3','O','A');g.meet('N4','three','h',(3,0))
    step('Draw a circle with centre O through N1. It crosses the vertical line at P1, above O. '
         'Draw a straight line through N4 and P1. Draw a line through A parallel to it. '
         'It crosses the vertical line at P2. Draw a circle with centre O through P2. '
         'It crosses the horizontal line at N5, right of O.', 'compass')
    g.circle_through('halfRoot3','O','N1');g.meet('P1','halfRoot3','v',(0,math.sqrt(3)/2))
    g.line_through('intercept','N4','P1');g.line_par('third','A','intercept');g.meet('P2','third','v',(0,math.sqrt(3)/6))
    g.circle_through('sixthRoot3','O','P2');g.meet('N5','sixthRoot3','h',(math.sqrt(3)/6,0))
    step('Draw a circle with centre N1 through O. It crosses the horizontal line again at N6, right of N1. '
         'Draw a circle with centre N6 and opening from O to N5. '
         'It crosses that line at N7, towards O. '
         'Draw a circle with centre N7 and opening from O to N2. '
         'It crosses that line at N8, right of N7.', 'compass')
    g.circle_through('root3','N1','O');g.meet('N6','root3','h',(math.sqrt(3),0))
    g.circle_from('fiveSixths','N6','O','N5');g.meet('N7','fiveSixths','h',(5*math.sqrt(3)/6,0))
    g.circle_from('apothem','N7','O','N2');g.meet('N8','apothem','h',(L,0))
    step('Draw a vertical line through N8. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners T1 to T4.')
    g.line_par('frame','N8','v');g.repeat('frames',['frame'],'rot4')
    cell=[(L,L),(-L,L),(-L,-L),(L,-L)]
    for i,p in enumerate(cell):g.meet(f'T{i+1}','frame' if i==0 else f'frame@{i}',f'frame@{i+1}' if i<3 else 'frame',p)
    plan=[('Q1','st0','frame',45,(L,1-L),
           'The line through A and D crosses the right tile side at Q1. '
           'Draw a line through Q1 parallel to the line at 45° from OA.'),
          ('Q2','r120','gl0',15,None,
           'Line OE crosses the new line at Q2, below O. '
           'Draw a line through Q2 parallel to the line at 15° from OA.'),
          ('Q3','r150','gl0',75,None,
           'Line FM crosses the line through Q1 at Q3, below O. '
           'Draw a line through Q3 parallel to the line at 75° from OA.'),
          ('Q4','cS','r120',15,(math.sqrt(3)/2,-1.5),
           'The circle with centre K crosses line OE again at Q4, below O. '
           'Draw a line through Q4 parallel to the line at 15° from OA.'),
          ('Q4',None,None,45,None,
           'Draw a line through Q4 parallel to the line at 45° from OA.'),
          ('Q5','r150','gl4',75,(1.5,-math.sqrt(3)/2),
           'Line FM crosses the new line at Q5, below O. '
           'Draw a line through Q5 parallel to the line at 75° from OA.')]
    for i,(p,a,b,angle,xy,text) in enumerate(plan):
        step(text+' Turn it round O by 90°, three times.')
        if a:g.meet(p,a,b,xy or g.crossings(a,b)[0])
        g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot4')
    step('The line at 135° from OA crosses the line through Q2 at Q6, below O. '
         'Draw a horizontal line through Q6. Turn it round O by 90°, three times.')
    g.meet('Q6','r135','gl1',(5/3,-5/3));g.line_par('axisNet','Q6','h');g.repeat('axisCopies',['axisNet'],'rot4')
    step('The last line turned by 90° crosses the horizontal line at N9, right of O. '
         'Draw a circle with centre N8 and opening from O to N9. '
         'It crosses that line at N10, towards O.', 'compass')
    g.meet('N9','axisNet@1','h',(5/3,0));g.circle_from('cornerRadius','N8','O','N9');g.meet('N10','cornerRadius','h',(D,0))
    step('Draw a circle with centre O through N8. It crosses the line at 45° from OA at P3, above O. '
         'Draw a vertical line through P3. It crosses the horizontal line at N11. '
         'Draw a circle with centre N11 through O. It crosses that line again at N12, right of N11.', 'compass')
    g.circle_through('frameCircle','O','N8');g.meet('P3','frameCircle','r45',(L/math.sqrt(2),L/math.sqrt(2)))
    g.line_par('diagonalProjection','P3','v');g.meet('N11','diagonalProjection','h',(L/math.sqrt(2),0))
    g.circle_through('diagonalDouble','N11','O');g.meet('N12','diagonalDouble','h',(math.sqrt(2)*L,0))
    step('Draw a circle with centre N12 and opening from O to N10. '
         'It crosses the horizontal line at N13, towards O. '
         'Draw a circle with centre O through N13. It crosses the line at 135° from OA at P4, above O. '
         'Draw a line through P4 parallel to the line at 45° from OA. Turn it round O by 90°, three times.', 'compass')
    value=math.sqrt(2)*L-D
    g.circle_from('cornerDiagonal','N12','O','N10');g.meet('N13','cornerDiagonal','h',(value,0))
    g.circle_through('cornerCircle','O','N13');g.meet('P4','cornerCircle','r135',(-value/math.sqrt(2),value/math.sqrt(2)))
    g.line_par('cornerNet','P4','r45');g.repeat('cornerCopies',['cornerNet'],'rot4')
    cm.steps[3]['textWithoutHelpers'] = (
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through E and L, and F and M.')
    cm.steps[4]['textWithoutHelpers'] = (
        'Draw the line through O that halves angle BOC. '
        'Draw a line through O at 90° to it.')
    cm.steps[7]['textWithoutHelpers'] = (
        'Draw a circle with centre O through N1. It crosses the vertical line at P1, above O. '
        'Draw a line through A parallel to the line from N4 to P1. '
        'It crosses the vertical line at P2. Draw a circle with centre O through P2. '
        'It crosses the horizontal line at N5, right of O.')
    cm.steps[10]['textWithoutHelpers'] = cm.steps[10]['text'].replace(
        ' Turn it round O by 90°, three times.', '')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(299.56,373.06),2*UNIT,0)
    c,s=math.cos(math.pi/4),math.sin(math.pi/4)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();ps=drawing(pieces)
    ps=[[(x+2*L*i,y+2*L*j) for x,y in q] for q in ps for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in ps:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'qawsun-quran-stars','title':'Stars of a Qur’an page from Qawsun mosque',
       'short':'Qawsun Qur’an stars','subtitle':'Qawsun mosque Qur’an, after Prisse d’Avennes',
       'fold':4,'star':12,'style':'Egyptian','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s DA1 drawing. The drawing gives no steps. '
                  'Three squares, a third-part construction and parallels through crossings fix the square mesh.',
           'changes':'Plain polygon boundaries are retained. The teaching frame turns45° onto the actual square slides. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No manuscript photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data187/DA1: Qawsun mosque Qur’an','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data187/DA1.html',
           'note':'The page cites Prisse d’Avennes, Arabic Art in Color, page45(1877): a decorative Qur’an page from the mosque of Qeycoun, fourteenth century, identified there as Qawsun mosque, Cairo, Egypt. No manuscript photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','palette':'Kashan','colors':{},'text':'Put copies of the square tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s,t6=math.sqrt(2),math.sqrt(3),math.sqrt(6)
    inventory=[('twelve_star',24,6-2*s,1,'b'),('kite',4,-1+2*s/3,12,'c'),
        ('hexagon',6,1.5-2*s/3,16,'d'),('triangle',3,-.25+s/6,12,'c'),
        ('four_star',8,(s-1)/3,2,'c'),
        ('fourteen',14,-275/18+62*r/9+163*s/18-35*t6/9,4,'c'),
        ('pentagon',5,.25+s/18,4,'b'),
        ('eight_star',16,(496-248*r-280*s+140*t6)/9,1,'d')]
    t['expect']={'pieceTypes':8,'cellArea':round(28/3+10*s/3,5),
        'note':'The52 counted source-polygon shoelaces sum exactly to28/3+10√3/3=4[(3+5√3)/6]².',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    t['pattern']['placements']={'repeat':[1,1],
        'rules':[{'piece':'hexagon','nth':i,'color':'b'} for i in [0,1,7,10]]}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

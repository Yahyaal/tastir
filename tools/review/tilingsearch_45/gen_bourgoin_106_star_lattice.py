#!/usr/bin/env python3
"""P106: seven plain source faces on a square cell.

O=(298.48,373.37)pt. OA is the neighbouring six-star radius,
147.37/L≈56.88269678pt, with L=(1+√3+√6)/2. No frame turn.
The eight-star's point at22.5° lies at height sin15°; its edges
at60° and165° construct the75° tips without a decimal angle.
"""
import math
import sys
import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening
from gen_agra_twelve_six_stars import REF
from hexagonal import network,clip_poly

L=(1+math.sqrt(3)+math.sqrt(6))/2
UNIT=147.37/L


def build():
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line. '
         'The circle crosses the lines at 15° and 45° from OA at S1 and S2, above O.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    for n,a in [('S1',15),('S2',45)]:g.meet(n,'c',REF[a],g.dirdeg(a))
    step('Draw the line through O that halves the angle at O between A and S2. Draw a horizontal line through S1. '
         'The two lines cross at P1, above OA.')
    g.line_bisect('r22','A','O','S2');g.line_par('sh','S1','h')
    g.meet('P1','sh','r22',(math.sin(math.pi/12)*(1+math.sqrt(2)),math.sin(math.pi/12)))
    step('Draw lines through P1 parallel to line OC and the line at 165° from OA. '
         'Turn them round O by 45°, seven times. These lines make the eight-pointed star.')
    for i,a in enumerate([60,165]):
        g.line_par(f'st{i}','P1',REF[a]);g.repeat(f'starCopies{i}',[f'st{i}'],'rot8')
    step('Draw a circle with centre O and opening AE. '
         'It crosses the line at 45° from OA at P2, above O. '
         'Draw a vertical line through P2. It crosses the horizontal line at N1.', 'compass')
    g.circle_from('root3','O','A','E');g.meet('P2','root3','r45',(math.sqrt(6)/2,math.sqrt(6)/2))
    g.line_par('p2v','P2','v');g.meet('N1','p2v','h',(math.sqrt(6)/2,0))
    step('Draw vertical lines through C and B. They cross the horizontal line at N2 and N3. '
         'Draw a circle with centre N1 and opening from O to N2. '
         'It crosses that line at N4, right of N1.', 'compass')
    for p,n,x in [('C','N2',.5),('B','N3',math.sqrt(3)/2)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    g.circle_from('sum1','N1','O','N2');g.meet('N4','sum1','h',((1+math.sqrt(6))/2,0))
    step('Draw a circle with centre N4 and opening from O to N3. '
         'It crosses the horizontal line at N5, right of N4.', 'compass')
    g.circle_from('sum2','N4','O','N3');g.meet('N5','sum2','h',(L,0))
    step('Draw a vertical line through N5. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners T1 to T4.')
    g.line_par('frame','N5','v');g.repeat('frames',['frame'],'rot4')
    cell=[(L,L),(-L,L),(-L,-L),(L,-L)]
    for i,p in enumerate(cell):g.meet(f'T{i+1}','frame' if i==0 else f'frame@{i}',f'frame@{i+1}' if i<3 else 'frame',p)
    step('The left tile side crosses the horizontal line at W. '
         'Draw a circle with centre W and the same opening as the first circle. '
         'Draw lines through W parallel to lines OC and OE. '
         'They cross the new circle at V1 and V2, right of W, above and below it.', 'compass')
    g.meet('W','frame@2','h',(-L,0));cm.circle_radius_of('neighbour','W','c')
    for a in [60,120]:g.line_par(f'neighbourRay{a}','W',REF[a])
    g.meet('V1','neighbour','neighbourRay60',(-L+.5,math.sqrt(3)/2))
    g.meet('V2','neighbour','neighbourRay120',(-L+.5,-math.sqrt(3)/2))
    step('Draw lines through V1 parallel to the lines at 45° and 75° from OA. '
         'Draw lines through V2 parallel to the lines at 105° and 135° from OA. '
         'Turn these four lines round O by 90°, three times.')
    for p,angles in [('V1',[45,75]),('V2',[105,135])]:
        for a in angles:
            n=f'neighbour{p}{a}';g.line_par(n,p,REF[a]);g.repeat(n+'copies',[n],'rot4')
    step('The larger circle crosses the horizontal and vertical lines at N6 and N7, right of O and above O. '
         'Draw a horizontal line through N7. It crosses the right tile side at Q1. '
         'Draw a line through Q1 parallel to the line at 15° from OA. Turn it round O by 90°, three times.')
    g.meet('N6','root3','h',(math.sqrt(3),0));g.meet('N7','root3','v',(0,math.sqrt(3)))
    g.line_par('root3h','N7','h');g.meet('Q1','frame','root3h',(L,math.sqrt(3)))
    g.line_par('gl0','Q1','r15');g.repeat('copies0',['gl0'],'rot4')
    step('The new line crosses the vertical line through O at Q2. '
         'Draw a line through Q2 parallel to the line at 165° from OA. Turn it round O by 90°, three times.')
    g.meet('Q2','v','gl0',(0,math.sqrt(3)-L*(2-math.sqrt(3))))
    g.line_par('gl1','Q2','r165');g.repeat('copies1',['gl1'],'rot4')
    step('Draw a vertical line through N6. It crosses the top tile side at Q3. '
         'Draw a line through Q3 parallel to the line at 105° from OA. Turn it round O by 90°, three times.')
    g.line_par('root3v','N6','v');g.meet('Q3','frame@1','root3v',(math.sqrt(3),L))
    g.line_par('gl2','Q3','r105');g.repeat('copies2',['gl2'],'rot4')
    step('The new line crosses the horizontal line at Q4. '
         'Draw a line through Q4 parallel to the line at 75° from OA. Turn it round O by 90°, three times.')
    g.meet('Q4','h','gl2',(math.sqrt(3)+L*(2-math.sqrt(3)),0))
    g.line_par('gl3','Q4','r75');g.repeat('copies3',['gl3'],'rot4')
    cm.steps[3]['textWithoutHelpers']='The four circles cross the first circle at B, C, E, F, H, J, L and M.'
    cm.steps[4]['textWithoutHelpers']=(
        'Draw the lines through O that halve angles AOB and BOC. '
        'The circle crosses them at S1 and S2, above O.')
    cm.steps[11]['textWithoutHelpers']=(
        'The left tile side crosses the horizontal line at W. '
        'Draw a circle with centre W and the same opening as the first circle. '
        'Draw a line through W parallel to line OC. It crosses the new circle at V1, right of W. '
        'V2 is the matching point below the horizontal line.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(298.48,373.37),2*UNIT,0)


def main():
    pieces,out=sys.argv[1:3];cell=build();ps=drawing(pieces)
    ps=[[(x+2*L*i,y+2*L*j) for x,y in q] for q in ps for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in ps:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.001:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'bourgoin-106-star-lattice','title':'Star lattice of Bourgoin’s Plate 106',
       'short':'Bourgoin 106 star lattice','subtitle':'Bourgoin, Plate 106; examples in Cairo',
       'fold':4,'star':8,'style':'Egyptian','level':'advanced',
       'given':{'O':'The centre of an eight-pointed star.','A':'Sets the point radius of a neighbouring six-pointed star.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s P106 drawing. The drawing gives no steps. '
                  'An angle bisector and a projected circle point fix the eight-pointed star. '
                  'Compass transfers and four parallel families complete its square repeat.',
           'changes':'Plain polygon boundaries are retained. The steps, order and named points are ours. '
                     'The palette is illustrative. No monument photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data168/P106: Bourgoin Plate106','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data168/P106.html',
           'note':'The page cites Bourgoin, Plate106(1879); Creswell, volume1, Plate102, the bronze-plated door of al-Salih Tala’i Mosque, Cairo(1160AD,554AH); and Wade EGY1514 at al-Mu’ayyad, Cairo(1420AD,823AH). No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','palette':'Kashan','colors':{},'text':'Put copies of the square tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s,t6=math.sqrt(2),math.sqrt(3),math.sqrt(6)
    inventory=[('four_star',8,4-2*r+2*s/3,1,'ground'),
        ('six_star',12,3*(s-1)/2,2,'c'),('eight_star',16,6+4*r-10*s/3-2*t6,1,'ground'),
        ('six',6,(r+s+t6)/4,8,'ground'),('hexagon',6,(3+s)/4,4,'ground'),
        ('ten',10,(r+t6)/2-2*s/3,4,'c'),('kite',4,s/6,8,'c')]
    t['expect']={'pieceTypes':7,'cellArea':round(10+6*r+2*s+2*t6,5),
        'note':'The28 counted source-polygon shoelaces sum exactly to(1+√3+√6)², the square cell area.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c,**({'small':True} if n in ['six_star','ten'] else {})} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

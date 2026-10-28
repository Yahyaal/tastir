#!/usr/bin/env python3
"""F294: Chester Beatty Qur’an lattice,8pt bands expanded4pt.

O=(297.5,373.3770833333)pt; OA=20(1+√3)pt; no frame turn.
Square half-side(3+√3)/2; four triangles fix the60° twelve-star tips.
"""
import math
import sys

import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening,LETTERS
from gen_agra_twelve_six_stars import frame,REF
from hexagonal import network,clip_poly

UNIT=20*(1+math.sqrt(3))
L=(3+math.sqrt(3))/2


def build(opening_only=False):
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    step('Draw the four triangles that make the twelve-pointed star.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(4):
        names=[LETTERS[k+4*i] for i in range(3)]
        part={'text':f'Draw a straight line through {names[0]} and {names[1]}, {names[1]} and {names[2]}, '
              f'and {names[2]} and {names[0]}.','create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in range(3):g.line_through(f'st{k+4*i}',names[i],names[(i+1)%3])
    if opening_only:return None
    step('Draw vertical lines through B and C. They cross the horizontal line at N1 and N2. '
         'Draw a circle with centre A and opening from O to N1. '
         'It crosses that line at N3, right of A.', 'compass')
    for p,n,x in [('B','N1',math.sqrt(3)/2),('C','N2',.5)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    g.circle_from('sum','A','O','N1');g.meet('N3','sum','h',(1+math.sqrt(3)/2,0))
    step('Draw a circle with centre N3 and opening from O to N2. '
         'It crosses the horizontal line at N4, right of N3.', 'compass')
    g.circle_from('cellRadius','N3','O','N2');g.meet('N4','cellRadius','h',(L,0))
    step('Draw a vertical line through N4. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners T1 to T4.')
    g.line_par('frame','N4','v');g.repeat('frames',['frame'],'rot4')
    cell=[(L,L),(-L,L),(-L,-L),(L,-L)]
    for i,p in enumerate(cell):g.meet(f'T{i+1}','frame' if i==0 else f'frame@{i}',f'frame@{i+1}' if i<3 else 'frame',p)
    plan=[('N4',None,None,75,None,
           'Draw a line through N4 parallel to the line at 75° from OA.'),
          ('Q1','st0','gl0',135,((7+math.sqrt(3))/4,-(1+math.sqrt(3))/4),
           'The line through A and E crosses the new line at Q1. '
           'Draw a line through Q1 parallel to the line at 135° from OA.'),
          ('Q2','r30','gl1',105,((9-3*math.sqrt(3))/4,(3*math.sqrt(3)-3)/4),
           'Line OB crosses the new line at Q2, above O. '
           'Draw a line through Q2 parallel to the line at 105° from OA.'),
          ('Q3','h','gl2',75,((3*math.sqrt(3)-3)/2,0),
           'The new line crosses the horizontal line at Q3. '
           'Draw a line through Q3 parallel to the line at 75° from OA.'),
          ('Q4','r150','gl0',45,((3+3*math.sqrt(3))/4,-(3+math.sqrt(3))/4),
           'Line FM crosses the line through N4 at Q4, below O. '
           'Draw a line through Q4 parallel to the line at 45° from OA.'),
          ('Q5','r120','gl4',15,((3+math.sqrt(3))/4,-(3+3*math.sqrt(3))/4),
           'Line OE crosses the new line at Q5, below O. '
           'Draw a line through Q5 parallel to the line at 15° from OA.')]
    for i,(p,a,b,angle,xy,text) in enumerate(plan):
        step(text+' Turn it round O by 90°, three times.')
        if a:g.meet(p,a,b,xy)
        g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot4')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H, E and L, and F and M.')
    cm.steps[4]['textWithoutHelpers']=(
        'Draw the line through O that halves angle BOC. Draw a line through O at 90° to it.')
    cm.steps[8]['textWithoutHelpers']=(
        'Draw a vertical line through N4. Turn it round O by 90° and 180°. '
        'The tile’s corners are T1 to T4.')
    cm.steps[10]['textWithoutHelpers']=(
        'The line through A and E crosses the new line at Q1. '
        'Draw a line through Q1 parallel to the line at 135° from OA.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(297.5,373.3770833333),2*UNIT,8)


def main():
    pieces,out=sys.argv[1:3];cell=build();ps=drawing(pieces)
    ps=[[(x+2*L*i,y+2*L*j) for x,y in q] for q in ps
        for i in [-1,0,1] for j in [-1,0,1]]
    # Ignore rounded edges which only graze a cell corner for less than.001OA.
    # Registering them needs unused exterior lines; the resulting ink is identical.
    edges=[]
    for q in ps:
        for i,p in enumerate(q):
            z=q[i-1];clipped=clip_poly([(p,z)],cell)
            if clipped and math.dist(*clipped[0])>.001:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'chester-beatty-twelve-stars','title':'Twelve-star lattice of a Chester Beatty Qur’an',
       'short':'Chester Beatty twelve-stars','subtitle':'Chester Beatty Library Qur’an',
       'fold':4,'star':12,'style':'Egyptian','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s F294 drawing. The drawing gives no steps. '
                  'Four triangles and six parallel families construct the stars and their connectors.',
           'changes':'The 8pt bands are represented by their centre lines. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No historical photograph was checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data164/F294: Chester Beatty Library Qur’an','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data164/F294.html',
           'note':'The page cites Bonner, page408, figure335b, Great Mosque minaret, Siirt, Turkey(1129AD,522AH); a fourteenth-century Egyptian Qur’an at the Chester Beatty Library, Dublin, through personal communication; V&A panel899:1-1884 from a Cairo wall cupboard; Wichmann and Wade, figures7.1a and11.3a; d’Avennes, internet photo282, with its uncertain al-naski qaisun minbar attribution; and Thesaurus Islamicus, al-Azhar mosque kursi, Cairo. No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the square tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    s=math.sqrt(3)
    inventory=[('twelve_star',24,3*s-3,1,'b'),('kite',4,(3-s)/4,12,'a'),
        ('hexagon',6,s/2,12,'c'),('ten',10,(1+s)/8,4,'b'),
        ('narrow_ten',10,(s-1)/2,4,'b'),('three_star',6,(9-3*s)/8,4,'c'),
        ('four_star',8,3-s,1,'c')]
    t['expect']={'pieceTypes':7,'cellArea':round(12+6*s,5),
        'note':'The38 counted source-polygon shoelaces sum exactly to12+6√3=4[(3+√3)/2]².',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c,**({'small':True} if n in ['ten','narrow_ten'] else {})} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

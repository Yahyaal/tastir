#!/usr/bin/env python3
"""OR1: the SHAF18 mesh turned90°, with Chehel Sotoun diagram fills.

O=(277.98,390.52)pt, OA=35(1+√3)/2pt. The teaching frame turns90°.
The7pt bands are expanded3.5pt after removing the brown bevel facets.
"""
import math
import sys
import common as cm
from common import g,step
from gen_ismail_shrine_divided_stars import build,L
from hexagonal import network,clip_poly

UNIT=35*(1+math.sqrt(3))/2
PLACEMENTS=[{'cell': [0, 0], 'color': '#757f40', 'nth': 8, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 10, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 11, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 12, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 13, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 14, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 21, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 22, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 23, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 24, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 25, 'piece': 'six_kite'},
 {'cell': [0, 0], 'color': '#757f40', 'nth': 27, 'piece': 'six_kite'}]


def drawing(pieces):
    polys=cm.frame_pieces(pieces,(277.98,390.52),2*UNIT,7,
        keep=lambda p:p['fill'][1]>.45)
    return [[(y,-x) for x,y in q] for q in polys]


def main():
    pieces,out=sys.argv[1:3];cell=build();polys=drawing(pieces)
    cm.steps[9].pop('textWithoutHelpers',None)
    polys=[[(x+L*(i+j),y+L*(i-j)) for x,y in q] for q in polys for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in polys:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'chehel-sotoun-divided-stars','title':'Divided stars of Chehel Sotoun, Isfahan',
        'short':'Chehel Sotoun divided stars','subtitle':'Chehel Sotoun Palace, Isfahan, Iran',
        'fold':2,'star':6,'style':'Persian','level':'advanced',
        'given':{'O':'The centre of a four-pointed star, at the crossing of the mirrors.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s OR1 drawing. The drawing gives no steps. '
                   'The complete construction is shared with the Ismail shrine tutorial. Turning the source frame by90° gives the same mesh and kite proportions.',
            'changes':'Brown bevel facets are removed. The7pt bands are represented by their centre lines. '
                      'The steps, order and named points are ours. The colours retain the diagram’s classes and are illustrative. The olive six-stars use a two-by-two colour repeat, larger than the geometric repeat. The olive six-stars use a two-by-two colour repeat, larger than the geometric repeat. The olive six-stars use a two-by-two colour repeat, larger than the geometric repeat. '
                      'No monument photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data213/OR1: Chehel Sotoun Palace','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data213/OR1.html',
            'note':'The page cites Roberto Orazi, Grate lignee nell’architettura safavide, Roma: IsMEO(1976), figure9, page245: Chehel Sotoun Palace, Isfahan. It calls the group cmm. No monument photograph was independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the diamond tile side by side.'},
        'expect':{}}
    r,s=math.sqrt(2),math.sqrt(3)
    inventory=[('six_kite',s-r,36,'d'),('connector_kite',(1+r-s)/2,72,'ground'),
        ('four_kite',(s-1)/2,40,'c'),('three_kite',1-s/3,12,'b')]
    t['expect']={'pieceTypes':4,'cellArea':round(28+16*s,5),
        'note':'The160 counted source-kite shoelaces sum exactly to28+16√3=2(2√2+√6)². The geometry is the Ismail shrine mesh; its diagram filling differs.',
        'pieces':[{'name':n,'vertices':4,'area':round(a,5),'perCell':c} for n,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,color in inventory}
    if PLACEMENTS:t['pattern']['placements']={'repeat':[2,2],'rules':PLACEMENTS}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()

"""Joins each tile of a bevelled Tiling Search drawing (R9) to its border
pieces, giving the edge-to-edge tiling the drawing shows: <name>-tiles.json,
in the pieces format, ready for snap_grid.py. Border pieces are told by their
fill (black and the two browns in R9); each goes to the coloured piece it
shares the longest edge with.
Usage: uv run --with shapely python bevel_tiles.py <research dir>/R9
"""
import json, math, os, sys
from shapely.geometry import Polygon
from shapely.ops import unary_union
d=sys.argv[1].rstrip('/')+'/'; name=os.path.basename(d.rstrip('/'))
ps=json.load(open(d+name+'-pieces.json'))
band=lambda p: tuple(round(c,2) for c in p['fill']) in [(0.0,0.0,0.0),(0.3,0.16,0.04),(0.43,0.29,0.11)]
col=[p for p in ps if not band(p)]; bd=[p for p in ps if band(p)]
CP=[Polygon(p['poly']).buffer(0) for p in col]
groups=[[g] for g in CP]
un=0
for p in bd:
    P=Polygon(p['poly']).buffer(0)
    best=max(range(len(CP)), key=lambda i: P.buffer(0.3).intersection(CP[i].boundary).length)
    if P.buffer(0.3).intersection(CP[best].boundary).length<1: un+=1; continue
    groups[best].append(P)
print('unassigned band pieces', un)
out=[]
for p,g in zip(col,groups):
    U=unary_union([x.buffer(0.05,join_style=2) for x in g]).buffer(-0.05,join_style=2).simplify(0.2)
    if U.geom_type!='Polygon': continue
    out.append({'fill':p['fill'],'poly':list(U.exterior.coords)[:-1],'area':U.area,'c':[U.centroid.x,U.centroid.y]})
json.dump(out,open(d+name+'-tiles.json','w'))
from collections import Counter
print(Counter((len(o['poly']),round(o['area'])) for o in out).most_common(12))
for o in out:
    if math.dist(o['c'],(530,620))<60: print(len(o['poly']),round(o['area']),[tuple(round(v,1) for v in q) for q in o['poly']])

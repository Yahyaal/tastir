"""Symmetrise kurt-runs.json under the 16 symmetries, merge per line, and
report which construction lines carry ink."""
import json, math
from kurt_geom import *
runs=json.load(open('kurt-runs.json'))
def canon(a,b,c):
    if a<-1e-9 or (abs(a)<1e-9 and b<0): a,b,c=-a,-b,-c
    return (round(a,4),round(b,4),round(c,4))
def tf(p,j,m):
    t=math.radians(45*j); c,s=math.cos(t),math.sin(t); x,y=p[0],p[1]*m
    return (c*x-s*y, s*x+c*y)
by={}
for p,q,_ in runs:
    for m in (1,-1):
        for j in range(8):
            P,Q=tf(p,j,m),tf(q,j,m)
            dx,dy=Q[0]-P[0],Q[1]-P[1]; L=math.hypot(dx,dy); n=(-dy/L,dx/L)
            key=canon(n[0],n[1],n[0]*P[0]+n[1]*P[1])
            t=(-key[1],key[0]); pr=lambda u:u[0]*t[0]+u[1]*t[1]
            a,b=sorted((pr(P),pr(Q)))
            by.setdefault(key,[]).append((a,b))
merged={}
for key,iv in by.items():
    iv.sort(); out=[]
    for a,b in iv:
        if out and a<=out[-1][1]+2e-3: out[-1][1]=max(out[-1][1],b)
        else: out.append([a,b])
    merged[key]=out
json.dump([[list(k),v] for k,v in merged.items()],open('kurt-sym.json','w'))
# classify each line by distance and direction
fam={}
for (a,b,c),iv in merged.items():
    ang=round(math.degrees(math.atan2(b,a))%180,1); fam.setdefault(round(abs(c),4),set()).add(ang)
for d in sorted(fam): print(d, sorted(fam[d]), sum(len(merged[k]) for k in merged if round(abs(k[2]),4)==d))
print(len(merged),'lines,',sum(len(v) for v in merged.values()),'runs')

import math, json, sys
from collections import defaultdict
from PIL import Image, ImageDraw
from kurt_geom import *
im=Image.open('kurt-img/i-041.png').convert('RGB'); W,H=im.size; px=im.load()
def dark(x,y): return 0<=x<W and 0<=y<H and max(px[x,y])<110
def norm(th,d): t=math.radians(th); return (math.cos(t),math.sin(t),d)
C=[]
def add(tag,L): C.append((tag,L))
for v in (rho,-rho): add('6',(1,0,v)); add('6',(0,1,v))
for v in (s_small,-s_small): add('7',norm(-45,v/R2)); add('7',norm(45,v/R2))
for i in range(8): add('13',line_through(K[i],K[(i+2)%8]))
for v in (0.218,0.3678,0.6322,0.782):
    pass
X14=sorted({abs(round(p[0],6)) for c in K for l in [line_through(K[i],K[(i+2)%8]) for i in range(8)] for p in circle_line(c,r9,l)})
for v in X14:
    for s in (1,-1):
        for th in (0,45,90,135): add('14',norm(th,s*v))
for centres,r,tag in ((K,rho,'oK'),(S,r_small,'oS'),([(0,0)],rho,'oO'),([(0,0)],r9,'o9')):
    for c in centres:
        for off in (0,22.5):
            for j in range(8):
                th=off+45*j; a,b,_=norm(th,0); add(tag+str(off),(a,b,a*c[0]+b*c[1]+r*math.cos(math.radians(22.5))))
for k in range(1,4):
    d=r9*math.cos(math.radians(22.5*k))
    for th in range(0,360,45): add('19',norm(th,d))
    for th in range(0,360,45): add('19b',norm(th+22.5,d))
# Merge lines that coincide (same normal up to sign, same distance).
def canon(L):
    a,b,c=L
    if a<-1e-9 or (abs(a)<1e-9 and b<0): a,b,c=-a,-b,-c
    return (round(a,5),round(b,5),round(c,5))
seen={}
for tag,L in C:
    a,b,c=L
    for m in (1,-1):
        for j in range(8):
            t=math.radians(45*j); c_,s_=math.cos(t),math.sin(t)
            na,nb=a,b*m          # mirror in the horizontal, then turn
            seen.setdefault(canon((c_*na-s_*nb, s_*na+c_*nb, c)),(tag,(c_*na-s_*nb, s_*na+c_*nb, c)))
C=list(seen.values())
def inter(L,M):
    a1,b1,c1=L; a2,b2,c2=M; d=a1*b2-a2*b1
    if abs(d)<1e-9: return None
    return ((c1*b2-c2*b1)/d,(a1*c2-a2*c1)/d)
def fit(cx,cy,s):
    hits=0;tot=0
    for y in range(0,H,3):
        for x in range(0,W,3):
            if dark(x,y):
                tot+=1; p=((x-cx)/s,(cy-y)/s)
                if any(abs(L[0]*p[0]+L[1]*p[1]-L[2])*s<2.5 for _,L in C): hits+=1
    return hits/max(tot,1)
if sys.argv[1:2]==['fit']:
    best=max(((fit(cx,cy,s),cx,cy,s) for cx in (263,264,265) for cy in (263,264,265) for s in range(240,256,2)))
    print(best); sys.exit()
cx,cy,s=map(float,sys.argv[1:4])
segs=[]
for tag,L in C:
    pts=[p for _,M in C for p in [inter(L,M)] if p and math.hypot(*p)<1.12]
    t=(-L[1],L[0]); pts=sorted({(round(p[0],6),round(p[1],6)) for p in pts},key=lambda p:p[0]*t[0]+p[1]*t[1])
    for p,q in zip(pts,pts[1:]):
        if math.dist(p,q)<1e-6: continue
        sm=[(p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f) for f in [0.2+0.6*i/8 for i in range(9)]]
        if all(any(dark(int(round(cx+u[0]*s))+dx,int(round(cy-u[1]*s))+dy) for dx in (-1,0,1) for dy in (-1,0,1)) for u in sm):
            segs.append((p,q,tag,L))
# keep one copy of each segment
uniq={}
for p,q,tag,L in segs: uniq.setdefault(frozenset({p,q}),(tag,L))
# 8-fold vote: keep a segment when most of its 16 images (8 turns, mirrored)
# are inked too.
keys=[tuple(sorted(k)) for k in uniq if len(k)==2]
grid=defaultdict(list) if False else {}
def cell(p): return (round(p[0]*50),round(p[1]*50))
mid=lambda k:((k[0][0]+k[1][0])/2,(k[0][1]+k[1][1])/2)
for k in keys: grid.setdefault(cell(mid(k)),[]).append(k)
def present(k):
    m=mid(k); cx_,cy_=cell(m)
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            for q in grid.get((cx_+dx,cy_+dy),[]):
                if (math.dist(q[0],k[0])<2e-3 and math.dist(q[1],k[1])<2e-3) or (math.dist(q[0],k[1])<2e-3 and math.dist(q[1],k[0])<2e-3): return True
    return False
def images(k):
    out=[]
    for m in (1,-1):
        for jj in range(8):
            t=math.radians(45*jj); c_,s_=math.cos(t),math.sin(t)
            out.append(tuple((c_*p[0]-s_*p[1]*m, s_*p[0]+c_*p[1]*m) for p in k))
    return out
import os
NEED=int(os.environ.get('NEED','9'))
voted={k for k in keys if sum(present(i) for i in images(k))>=NEED}
from collections import defaultdict
# Snap endpoints that are the same crossing computed two ways.
reps={}
def snap(p):
    c=(round(p[0]*2000),round(p[1]*2000))
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            q=reps.get((c[0]+dx,c[1]+dy))
            if q and math.dist(q,p)<1e-3: return q
    reps[c]=p; return p
voted={tuple(sorted(snap(p) for p in k)) for k in voted}
voted={k for k in voted if k[0]!=k[1]}
changed=True
while changed:
    deg=defaultdict(int)
    for k in voted:
        for p in k: deg[p]+=1
    drop={k for k in voted if any(deg[p]==1 for p in k)}
    changed=bool(drop); voted-=drop
print(len(keys),'raw,',len(voted),'after vote and pruning')
uniq={k:None for k in voted}
print(len(uniq),'segments; by tag:','')
json.dump([sorted(list(k)) for k in uniq],open('kurt-ink.json','w'))
o=im.copy(); d=ImageDraw.Draw(o)
for k in uniq:
    if len(k)<2: continue
    p,q=list(k); d.line([(cx+p[0]*s,cy-p[1]*s),(cx+q[0]*s,cy-q[1]*s)],fill=(255,0,0),width=2)
o.save('kurt-ink-overlay.png')

# Merge into maximal runs along each candidate line, drop short fuzz.
def line_of(k):
    a,b=k
    for _,L in C:
        if abs(L[0]*a[0]+L[1]*a[1]-L[2])<1e-4 and abs(L[0]*b[0]+L[1]*b[1]-L[2])<1e-4: return L
runs=[]
by={}
for k in uniq:
    L=line_of(k)
    if L is None: continue
    by.setdefault(canon(L),(L,[]))[1].append(k)
for key,(L,ks) in by.items():
    t=(-L[1],L[0]); pr=lambda p:p[0]*t[0]+p[1]*t[1]
    iv=sorted(tuple(sorted(k,key=pr)) for k in ks)
    cur=None
    for a,b in sorted(iv,key=lambda s:pr(s[0])):
        if cur and abs(pr(a)-pr(cur[1]))<1e-3: cur[1]=b if pr(b)>pr(cur[1]) else cur[1]
        else:
            if cur: runs.append((tuple(cur[0]),tuple(cur[1]),key))
            cur=[a,b]
    if cur: runs.append((tuple(cur[0]),tuple(cur[1]),key))
MIN=float(os.environ.get('MIN','0.05'))
runs=[r for r in runs if math.dist(r[0],r[1])>=MIN]
print(len(runs),'runs')
json.dump([[list(r[0]),list(r[1]),list(r[2])] for r in runs],open('kurt-runs.json','w'))
o=im.copy(); d=ImageDraw.Draw(o)
for p,q,_ in runs: d.line([(cx+p[0]*s,cy-p[1]*s),(cx+q[0]*s,cy-q[1]*s)],fill=(255,0,0),width=2)
o.save('kurt-runs-overlay.png')

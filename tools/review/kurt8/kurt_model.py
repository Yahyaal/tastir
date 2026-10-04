"""The ink of Kurt's final drawing on its true elements only: runs from
kurt-sym.json on lines 6, 7, 14 (0.218, 0.3678, 0.6322, 0.782), the step-17
octagon sides (corners pointing outward) and the step-19 rosette lines."""
import json, math
from kurt_geom import *
from PIL import Image, ImageDraw
def norm(th,d): t=math.radians(th); return (math.cos(t),math.sin(t),d)
def canon(a,b,c):
    if a<-1e-9 or (abs(a)<1e-9 and b<0): a,b,c=-a,-b,-c
    return (a,b,c)
true=[]
for v in (rho,-rho): true+=[('6',(1,0,v)),('6',(0,1,v))]
for v in (s_small,-s_small): true+=[('7',norm(-45,v/R2)),('7',norm(45,v/R2))]
for v in (0.2180,0.3678,0.6322,0.7820):
    for s in (1,-1):
        for th in (0,45,90,135): true.append(('14',norm(th,s*v)))
for centres,r,tag in ((K,rho,'octK'),(S,r_small,'octS')):
    for ci,c in enumerate(centres):
        for j in range(8):
            th=22.5+45*j; a,b,_=norm(th,0); true.append((f'{tag}{ci}',(a,b,a*c[0]+b*c[1]+r*math.cos(math.radians(22.5)))))
d19=r9*math.cos(math.radians(67.5))
for th in range(0,360,45): true.append(('19',norm(th,d19)))
m=json.load(open('kurt-sym.json'))
keep=[]
for k,iv in m:
    a,b,c=k
    tags=[t for t,L in true for A,B,C in [canon(*L)] if abs(A-a)<1e-3 and abs(B-b)<1e-3 and abs(C-c)<1e-3]
    if tags: keep.append((k,iv,tags))
runs=[]
for (a,b,c),iv,tags in keep:
    t=(-b,a)
    for lo,hi in iv:
        P=(a*c+t[0]*lo,b*c+t[1]*lo); Q=(a*c+t[0]*hi,b*c+t[1]*hi); runs.append((P,Q,tags))
# Drop tracing artifacts: the centre star's lines stop about 0.27 from the
# centre in Kurt's drawing (further out the tracer mistook octagon corners
# for them), and stubs shorter than 0.04 sit on corners.
def keep_run(P,Q,tags):
    if math.dist(P,Q)<0.04: return False
    if all(t=='19' for t in tags) and max(math.hypot(*P),math.hypot(*Q))>0.3: return False
    return True
runs=[r for r in runs if keep_run(*r)]
json.dump([[list(P),list(Q),tags] for P,Q,tags in runs],open('kurt-model.json','w'))
print(len(runs),'runs on',len(keep),'lines')
im=Image.open('kurt-img/i-041.png').convert('RGB'); d=ImageDraw.Draw(im); cx,cy,s=264,264,248
for P,Q,_ in runs: d.line([(cx+P[0]*s,cy-P[1]*s),(cx+Q[0]*s,cy-Q[1]*s)],fill=(255,0,0),width=2)
im.save('kurt-model-overlay.png')

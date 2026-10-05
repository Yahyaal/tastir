import numpy as np, math, json
from PIL import Image
fit = json.load(open('fit12.json'))
def samp(A, x, y):
    N = A.shape[0]; x = np.clip(x, 0, N-2); y = np.clip(y, 0, N-2); x0 = x.astype(int); y0 = y.astype(int); fx = (x-x0)[..., None]; fy = (y-y0)[..., None]
    return A[y0,x0]*(1-fx)*(1-fy)+A[y0,x0+1]*fx*(1-fy)+A[y0+1,x0]*(1-fx)*fy+A[y0+1,x0+1]*fx*fy
M = 1000; R = 0.6
g = np.linspace(-R, R, M); GX, GY = np.meshgrid(g, -g)
acc = np.zeros((M, M, 3)); n = 0
for name, (cx, cy, ro) in fit.items():
    img = np.asarray(Image.open(name + '.png').convert('RGB')).astype(float); N = img.shape[0]; S = N/1.5
    for k in range(4):
        for m in (1, -1):
            a = k*math.pi/2
            X0 = GX*math.cos(a) - m*GY*math.sin(a); Y0 = GX*math.sin(a) + m*GY*math.cos(a)
            X = X0*math.cos(ro) - Y0*math.sin(ro); Y = X0*math.sin(ro) + Y0*math.cos(ro)
            acc += samp(img, N/2 + (cx + X)*S, N/2 - (cy + Y)*S); n += 1
Image.fromarray((acc/n).astype(np.uint8)).save('avg4.png')

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import skeletonize, remove_small_objects, remove_small_holes
im = np.asarray(Image.open('tile-composite.png')).astype(float); N = im.shape[0]; S = N/2.4
g = ndi.gaussian_filter(im, 1.0); loc = g - ndi.gaussian_filter(im, 15)
rim = remove_small_objects(loc > np.percentile(loc, 88), max_size=30)
inlaid = ndi.binary_opening(ndi.binary_fill_holes(ndi.binary_closing(rim, iterations=2)), iterations=2)
hp = im - ndi.gaussian_filter(im, 2)
sd = np.sqrt(ndi.gaussian_filter(hp**2, 4))
plain = sd < np.percentile(sd, 12)
plain = remove_small_objects(ndi.binary_opening(plain, iterations=3), max_size=1500)
plain = ndi.binary_fill_holes(ndi.binary_closing(plain, iterations=4))
pieces = inlaid | plain
band = ~pieces
band = remove_small_holes(band, max_size=50)
sk = skeletonize(band)
for _ in range(int(0.03*S)):
    nb = ndi.convolve(sk.astype(int), np.ones((3,3), int), mode='constant') - 1
    ends = sk & (nb <= 1)
    if not ends.any(): break
    sk &= ~ends
sk = skeletonize(sk)
np.save('band2.npy', band); np.save('skel2.npy', sk)
vis = np.stack([inlaid*200, plain*200, sk*255], 2).astype(np.uint8)
vis[sk] = (255, 255, 255)
Image.fromarray(vis).save('mask2.png')

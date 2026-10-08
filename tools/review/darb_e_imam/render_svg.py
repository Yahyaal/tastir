import json
import math

data = json.load(open('/tmp/dump_darb.json'))
cell = data['cell']
pieces = data['pieces']
types = data['types']

# Palette: Isfahan colors (Cobalt & Honey Gold vibe: lapis, turquoise, gold, ivory, black)
palette = [
    '#d4af37', # gold
    '#1e3f66', # cobalt
    '#2e8b57', # sea green / turquoise
    '#4a7c59', # sage
    '#0e2439', # deep navy
    '#8b5a2b', # amber
    '#f4ede2', # ivory
]

svg = []
svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2.5 4 5" width="800" height="1000" style="background:#070f1e">')

# Draw 3x3 repeat:
u = cell['u']
v = cell['v']

for i in [-1, 0, 1]:
    for j in [-1, 0, 1]:
        dx = i * u[0] + j * v[0]
        dy = i * u[1] + j * v[1]
        for p in pieces:
            t = p['type']
            col = palette[t % len(palette)]
            pts = ' '.join(f"{pt[0]+dx:.4f},{pt[1]+dy:.4f}" for pt in p['polygon'])
            svg.append(f'<polygon points="{pts}" fill="{col}" stroke="#070f1e" stroke-width="0.015" opacity="0.95" />')

# Draw cell boundary
pts_cell = ' '.join(f"{c[0]:.4f},{c[1]:.4f}" for c in cell['corners'])
svg.append(f'<polygon points="{pts_cell}" fill="none" stroke="#d4af37" stroke-width="0.03" stroke-dasharray="0.08,0.05" />')

svg.append('</svg>')

with open('/home/yahya/.gemini/antigravity/brain/b14e53f5-c02f-43d8-b327-784131c9d73c/scratch/darb_preview.svg', 'w') as f:
    f.write('\n'.join(svg))

print("Rendered darb_preview.svg")

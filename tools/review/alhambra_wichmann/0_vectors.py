"""Writes <name>-vec.json from a Tiling Search PDF <name>.pdf: every drawn
path with its fill, stroke and straight segments (PyMuPDF).
Usage: uv run --with pymupdf python 0_vectors.py <name>"""
import json, sys
import pymupdf
name = sys.argv[1]
pg = pymupdf.open(f'{name}.pdf')[0]
segs = [{'fill': d.get('fill'), 'color': d.get('color'), 'width': d.get('width'),
         'lines': [[[it[1].x, it[1].y], [it[2].x, it[2].y]] for it in d['items'] if it[0] == 'l']}
        for d in pg.get_drawings()]
json.dump(segs, open(f'{name}-vec.json', 'w'))
print(len(segs), 'paths')

import sys, os
sys.path.insert(0, '/home/yahya/Documents/projects/Tastir/.claude/worktrees/agent-a0638ace160955a10/tools/review/tilingsearch_45')
import common as cm
import gen_rabat_throne_octagons as rb
rb.build()
L = rb.L
polys = cm.frame_pieces(sys.argv[1], (297.5, 372.934), 2 * 238.794 / L, 0)
try:
    segs = cm.network(polys, hcell=L, reach=3 * L)
    print('network ok', len(segs))
    paths = cm.along_ink(segs)
    used = {p['along'] for p in paths}
    print('unused lines:', [n for n in cm.lines() if n not in used])
except AssertionError as e:
    print('fail', e)

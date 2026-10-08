import json
import math
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g
from gen_design_e import (
    P, circle_through, circle_from, dirdeg, el, ensure_point, line_bisect,
    line_perp, line_through, meet, named_at, put, step, steps
)

g.el.clear()
g.steps.clear()
g.given()

D = math.pi / 180.0

# 1. Circle & horizontal
step('Rule a horizontal line through O and A and draw a circle about O through A: the circle of the central decagram.', 'compass')
put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
line_through('h', 'O', 'A')
meet('P0', 'c', 'h', (1.0, 0.0))
meet('P180', 'c', 'h', (-1.0, 0.0))

# 2. Vertical
step('Rule the vertical line through O at right angles to the horizontal.', 'ruler', highlight=['c', 'h'])
line_perp('v', 'O', 'h')
meet('N', 'c', 'v', (0.0, 1.0))
meet('S', 'c', 'v', (0.0, -1.0))

# 3. Midpoint M of radius OP180
step('Draw a circle about the left point through the centre; rule the line through where the two circles cross to find the midpoint of the radius.', 'compass', ['P180'])
circle_through('cW', 'P180', 'O')
meet('Y1', 'c', 'cW', (-0.5, math.sqrt(3)/2))
meet('Y2', 'c', 'cW', (-0.5, -math.sqrt(3)/2))
line_through('m', 'Y1', 'Y2')
meet('M', 'm', 'h', (-0.5, 0.0))

# 4. Golden section point F
step('Put the compass point on the midpoint and open it to the top of the circle. Draw an arc to cut the horizontal line: the distance from the centre is the chord of 36°.', 'compass', ['M'])
circle_through('cM', 'M', 'N')
r_cM = math.hypot(0.5, 1.0)
meet('F', 'cM', 'h', (-0.5 + r_cM, 0.0))

# 5. The ten division points
step('Step the compass open to OF around the circle to divide it into ten equal parts.', 'compass', ['F'])
circle_from('cF0', 'P0', 'O', 'F')
meet('P36', 'c', 'cF0', (math.cos(36*D), math.sin(36*D)))
meet('P324', 'c', 'cF0', (math.cos(36*D), -math.sin(36*D)))

circle_from('cF1', 'P36', 'O', 'F')
meet('P72', 'c', 'cF1', (math.cos(72*D), math.sin(72*D)))

circle_from('cF2', 'P72', 'O', 'F')
meet('P108', 'c', 'cF2', (math.cos(108*D), math.sin(108*D)))

circle_from('cF3', 'P108', 'O', 'F')
meet('P144', 'c', 'cF3', (math.cos(144*D), math.sin(144*D)))

circle_from('cF9', 'P324', 'O', 'F')
meet('P288', 'c', 'cF9', (math.cos(72*D), -math.sin(72*D)))

circle_from('cF8', 'P288', 'O', 'F')
meet('P252', 'c', 'cF8', (math.cos(108*D), -math.sin(108*D)))

circle_from('cF7', 'P252', 'O', 'F')
meet('P216', 'c', 'cF7', (math.cos(144*D), -math.sin(144*D)))

# 6. Radial rays
step('Rule the lines through opposite division points and halve the angles between them: a ray every 18°.', 'ruler')
line_through('r36', 'P36', 'P216')
line_through('r72', 'P72', 'P252')
line_through('r108', 'P108', 'P288')
line_through('r144', 'P144', 'P324')

line_bisect('r18', 'P0', 'O', 'P36')
line_bisect('r54', 'P36', 'O', 'P72')
line_bisect('r126', 'P108', 'O', 'P144')
line_bisect('r162', 'P144', 'O', 'P180')

# 7. Star lines
step('Join each of the ten points to the one three places round: ten lines, the ten-pointed star.', 'ruler')
line_through('s0', 'P0', 'P108')
line_through('s1', 'P36', 'P144')
line_through('s2', 'P72', 'P180')
line_through('s3', 'P108', 'P216')
line_through('s4', 'P144', 'P252')
line_through('s5', 'P180', 'P288')
line_through('s6', 'P216', 'P324')
line_through('s7', 'P252', 'P0')
line_through('s8', 'P288', 'P36')
line_through('s9', 'P324', 'P72')

# 8. Regular decagon
step('Join the ten points on the circle in order: the regular decagon.', 'ruler')
put('decagon', 'polygon', None, {'polygon': ['P0', 'P36', 'P72', 'P108', 'P144', 'P180', 'P216', 'P252', 'P288', 'P324']})

# 9. Rectangular tile
# The cell is [-w/2, w/2] x [-h/2, h/2]
# where w/2 = sqrt(5 + 2*sqrt(5))/2 and h/2 = sqrt(5)/2
# Recall that (w/2, h/2) is the intersection of s0 and s4!
step('Draw the rectangle whose corners are where the star lines cross: it is the tile that repeats.', 'ruler')
r_tip = 1.90211303259
meet('K1', 's1', 's7', (r_tip * math.cos(18*D), r_tip * math.sin(18*D)))
meet('K2', 's0', 's4', (r_tip * math.cos(126*D), r_tip * math.sin(126*D)))
meet('K3', 's2', 's6', (r_tip * math.cos(198*D), r_tip * math.sin(198*D)))
meet('K4', 's0', 's6', (r_tip * math.cos(342*D), r_tip * math.sin(342*D)))

# Tile boundary lines through the 4 corners:
# Top edge: horizontal line through K2 (at y = h/2)
# Bottom edge: horizontal line through K3 (at y = -h/2)
# Right edge: vertical line through K1 / K4 (at x = w/2)
# Left edge: vertical line through K2 / K3 (at x = -w/2)
# Wait, let's verify coordinates:
# K1 is at 18°: (1.8090, 0.5878)
# K2 is at 126°: (-1.1180, 1.5388)
# Let's check which crossings are at (w/2, h/2)!
print("K1:", g.el['K1'][1])
print("K2:", g.el['K2'][1])

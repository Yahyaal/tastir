import math
import os
import sys

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

# Step 1: Circle and horizontal
step('Rule a horizontal line through O and A and draw a circle about O through A: the circle of the central decagram.', 'compass')
put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
line_through('h', 'O', 'A')
meet('P0', 'c', 'h', (1.0, 0.0))
meet('P180', 'c', 'h', (-1.0, 0.0))

# Step 2: Vertical
step('Rule the vertical line through O at right angles to the horizontal.', 'ruler', highlight=['c', 'h'])
line_perp('v', 'O', 'h')
meet('N', 'c', 'v', (0.0, 1.0))
meet('S', 'c', 'v', (0.0, -1.0))

# Step 3: Midpoint M of radius OP180
step('Draw a circle about the left point through the centre; rule the line through where the two circles cross to find the midpoint of the radius.', 'compass', ['P180'])
circle_through('cW', 'P180', 'O')
meet('Y1', 'c', 'cW', (-0.5, math.sqrt(3)/2))
meet('Y2', 'c', 'cW', (-0.5, -math.sqrt(3)/2))
line_through('m', 'Y1', 'Y2')
meet('M', 'm', 'h', (-0.5, 0.0))

# Step 4: Golden section point F
step('Put the compass point on the midpoint and open it to the top of the circle. Draw an arc to cut the horizontal line: the distance from the centre is the chord of 36°.', 'compass', ['M'])
circle_through('cM', 'M', 'N')
r_cM = math.hypot(0.5, 1.0)
meet('F', 'cM', 'h', (-0.5 + r_cM, 0.0))

# Step 5: The ten division points
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

print("Step 1-5 built successfully! Elements count:", len(g.el))


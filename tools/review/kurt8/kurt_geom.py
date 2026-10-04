"""Sandy Kurt's 8-fold zellige construction, computed exactly (main circle
radius 1, centre O). Each element is tagged with the step that makes it."""
import math

R2 = math.sqrt(2)
def pol(r, a): return (r * math.cos(math.radians(a)), r * math.sin(math.radians(a)))

r8 = math.sqrt(2 - R2)                    # crossings of the two squares
rho = 1 - 1 / R2                          # ring circles (step 4-5)
K = [pol(r8, 22.5 + 45 * i) for i in range(8)]
s_small = R2 - 1                          # step 11-12 centres, on the axes and diagonals
r_small = s_small - rho                   # 0.12132
S = [pol(s_small, 45 * i) for i in range(8)]
c8 = (rho * math.tan(math.radians(22.5)), rho)   # step 8 centre: y = rho on the 67.5° ray
r8c = c8[0]                                      # tangent to the vertical: 0.12132
r9 = math.hypot(*c8) - r8c                       # 0.19570: touches the step-8 circle on its near side

def line_through(p, q):
    """(a, b, c) with a x + b y = c, normal of unit length."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    n = (-dy, dx); L = math.hypot(*n); n = (n[0] / L, n[1] / L)
    return (n[0], n[1], n[0] * p[0] + n[1] * p[1])

lines = {}
for v in (rho, -rho):
    lines[f'6v{v:+.3f}'] = (1, 0, v); lines[f'6h{v:+.3f}'] = (0, 1, v)
for v in (s_small, -s_small):
    lines[f'7a{v:+.3f}'] = (1 / R2, -1 / R2, v / R2 * 1)   # x - y = v  ->  normalised
    lines[f'7b{v:+.3f}'] = (1 / R2, 1 / R2, v / R2)
for i in range(8):
    lines[f'13_{i}'] = line_through(K[i], K[(i + 2) % 8])

def circle_line(c, r, L):
    a, b, d = L
    off = d - (a * c[0] + b * c[1]); h2 = r * r - off * off
    if h2 < 0: return []
    f = (c[0] + a * off, c[1] + b * off); t = (-b, a); h = math.sqrt(h2)
    return [(f[0] + t[0] * h, f[1] + t[1] * h), (f[0] - t[0] * h, f[1] - t[1] * h)]

cand14 = []
for k in K:
    for i in range(8):
        cand14 += circle_line(k, r9, lines[f'13_{i}'])
xs = sorted({round(p[0], 4) for p in cand14 if abs(p[0]) < 1.2})
if __name__ == '__main__':
    print('rho', rho, 'r_small', r_small, 'r9', r9)
    print('candidate x for step 14 verticals:', xs)

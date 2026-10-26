import json, math, sys
r = 6.8284271; L = math.sqrt(34 + 46 * math.sqrt(.5))
def at(a): return [round(r * math.cos(math.radians(a)), 4), round(r * math.sin(math.radians(a)), 4)]
picks = [[[558, 583], [0, 0]], [[440, 295], at(112.5)], [[668, 292], at(67.5)], [[248, 465], at(157.5)], [[860, 470], at(22.5)],
         [[245, 700], at(202.5)], [[860, 700], at(-22.5)], [[430, 870], at(247.5)], [[680, 870], at(-67.5)], [[548, 1360], [0, round(-2 * L, 4)]]]
json.dump({'photo': '/home/yahya/Documents/projects/Tastir/docs/research/alhambra-wichmann/wade-spa_1803.jpg', 'fold': 8, 'width': 1102,
           'crop': [40, 60, 1062, 1660], 'credit': 'Sala de las Dos Hermanas, north arch jamb (photo: David Wade, SPA 1803)', 'picks': picks},
          open(sys.argv[1], 'w'))

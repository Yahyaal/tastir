"""Independent exact values, plus a real CLI round trip."""
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from fractions import Fraction

from snap_grid3 import snap1


class SnapGrid3Test(unittest.TestCase):
    def test_hexagon_and_triangle_coordinates(self):
        for a, b in [(0, 1), (1, -2), (-3, 4), (2, 0)]:
            error, aa, bb = snap1(a + b * math.sqrt(3) / 2 + 0.00002)
            self.assertAlmostEqual(error, 0.00002)
            self.assertEqual((aa, bb), (a, b))
        self.assertEqual(snap1(0.5, denominator=2)[1:], (Fraction(1, 2), 0))

    def test_cli_frame_and_radius(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'pieces.json'
            source.write_text(json.dumps([
                {'c': [10, 20], 'poly': [[10, 20], [12, 20], [11, 20-math.sqrt(3)]], 'area': math.sqrt(3)},
                {'c': [100, 100], 'poly': [], 'area': 0},
            ]))
            result = subprocess.check_output([
                sys.executable, str(Path(__file__).with_name('snap_grid3.py')),
                str(source), '2', '10', '20', '5', '--denominator', '2',
            ], text=True)
            parsed = json.loads(result)
            self.assertLess(parsed['worst'], 1e-12)
            self.assertEqual(len(parsed['tiles']), 1)
            self.assertEqual(parsed['tiles'][0]['corners'][2], [['1/2', 0], ['0', 1]])
            self.assertAlmostEqual(parsed['tiles'][0]['area'], math.sqrt(3)/4)

    def test_invalid_options(self):
        with self.assertRaises(ValueError):
            snap1(1, denominator=0)


if __name__ == '__main__':
    unittest.main()

"""A rounded source seam must retain its whole exact segment."""
import unittest
import common as cm
from common import g, step
from hexagonal import network


class HexagonalNetworkTest(unittest.TestCase):
    def setUp(self):
        cm.el.clear()
        cm.steps.clear()
        g.given()
        step('Fixture')
        # Independently specified research construction for a unit square.
        for n,p,d in [('right',(1,0),(0,1)),('left',(-1,0),(0,1)),
                      ('top',(0,1),(1,0)),('bottom',(0,-1),(1,0))]:
            cm.el[n]=('line',(p,d))
        self.cell=[(-1,-1),(1,-1),(1,1),(-1,1)]

    def test_noisy_coincident_side_does_not_get_cut_in_half(self):
        polygon=[(-1,-1),(1-.00001,-1),(1+.00001,1),(-1,1)]
        got=network([polygon],self.cell)
        self.assertEqual(len(got),4)
        self.assertIn(((1.0,-1.0),(1.0,1.0)),got)

    def test_outside_source_polygons_do_not_add_ink(self):
        self.assertEqual(network([[(2,2),(3,2),(3,3)]],self.cell),[])

    def test_an_unconstructed_source_edge_is_rejected(self):
        with self.assertRaisesRegex(AssertionError,'no constructed line'):
            network([[(-.5,0),(.5,0),(0,.5)]],self.cell)


if __name__=='__main__':unittest.main()

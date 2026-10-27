#!/usr/bin/env python3
"""IND0405: same complete construction as IND0403, radial kite ink added.

O=(225.63,371)pt; the frame turns−15°. OA and the10pt bands are unchanged. Every kite edge
already lies on a radial line of the base construction. Twelve kites of
area (3−√3)/6 replace the star of area6−2√3 without changing its outline.
"""
import gen_agra_twelve_six_stars as base

L=base.L
build=base.build


def drawing(pieces):
    return base.drawing(pieces,origin=(225.63,371),angle=-15)


if __name__=='__main__':base.main(filled=True)

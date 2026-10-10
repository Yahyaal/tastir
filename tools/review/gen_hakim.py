#!/usr/bin/env python3
"""Generates tutorials/eight-fold-khatam.json from Sandy Kurt's tutorial
and validates it against the Minbar of Hakim Mosque panel.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

steps = [
    {
        "id": 1,
        "text": "Put the compass point on the centre and draw a circle.",
        "create": {
            "c": {"circle": {"centre": "O", "through": "A"}}
        },
        "animate": "compass"
    },
    {
        "id": 2,
        "text": "Draw a horizontal line through the centre, then a vertical line at right angles to it. They cut the circle at four points.",
        "create": {
            "h": {"line": {"through": ["O", "A"]}},
            "v": {"line": {"through": "O", "perpendicularTo": "h"}},
            "E": {"point": {"meet": ["c", "h"], "pick": {"angle": 0}}},
            "N": {"point": {"meet": ["c", "v"], "pick": {"angle": 90}}},
            "W": {"point": {"meet": ["c", "h"], "pick": {"angle": 180}}},
            "S": {"point": {"meet": ["c", "v"], "pick": {"angle": 270}}}
        },
        "animate": "ruler"
    },
    {
        "id": 3,
        "text": "Halve each right angle to get the two diagonals. The circle is now divided into eight equal parts.",
        "create": {
            "d1": {"line": {"through": "O", "bisects": ["E", "O", "N"]}},
            "d2": {"line": {"through": "O", "bisects": ["N", "O", "W"]}},
            "NE": {"point": {"meet": ["c", "d1"], "pick": {"angle": 45}}},
            "NW": {"point": {"meet": ["c", "d2"], "pick": {"angle": 135}}},
            "SW": {"point": {"meet": ["c", "d1"], "pick": {"angle": 225}}},
            "SE": {"point": {"meet": ["c", "d2"], "pick": {"angle": 315}}}
        },
        "highlight": ["h", "v"],
        "animate": "ruler"
    },
    {
        "id": 4,
        "text": "Join the four points on the axes to form a standing dynamic square. Mark where its edges cross the diagonals.",
        "create": {
            "dynamic": {"polygon": ["E", "N", "W", "S"]},
            "mNE": {"point": {"meet": ["dynamic", "d1"], "pick": {"angle": 45}}},
            "mNW": {"point": {"meet": ["dynamic", "d2"], "pick": {"angle": 135}}},
            "mSW": {"point": {"meet": ["dynamic", "d1"], "pick": {"angle": 225}}},
            "mSE": {"point": {"meet": ["dynamic", "d2"], "pick": {"angle": 315}}}
        },
        "highlight": ["E", "N", "W", "S"],
        "animate": "ruler"
    },
    {
        "id": 5,
        "text": "Draw the static square framing the circle, and connect the diagonal points to mark the half-radius point on each axis.",
        "textWithoutHelpers": "Draw the framing square and mark the half-radius point on each axis.",
        "create": {
            "hTop": {"line": {"through": "N", "parallelTo": "h"}},
            "hBot": {"line": {"through": "S", "parallelTo": "h"}},
            "vRight": {"line": {"through": "E", "parallelTo": "v"}},
            "vLeft": {"line": {"through": "W", "parallelTo": "v"}},
            "tNE": {"point": {"meet": ["hTop", "vRight"]}},
            "tNW": {"point": {"meet": ["hTop", "vLeft"]}},
            "tSW": {"point": {"meet": ["hBot", "vLeft"]}},
            "tSE": {"point": {"meet": ["hBot", "vRight"]}},
            "static": {"polygon": ["tNE", "tNW", "tSW", "tSE"]},
            "hN": {"line": {"through": ["mNW", "mNE"]}},
            "hS": {"line": {"through": ["mSW", "mSE"]}},
            "vE": {"line": {"through": ["mSE", "mNE"]}},
            "vW": {"line": {"through": ["mSW", "mNW"]}},
            "jE": {"point": {"meet": ["vE", "h"]}},
            "jN": {"point": {"meet": ["hN", "v"]}},
            "jW": {"point": {"meet": ["vW", "h"]}},
            "jS": {"point": {"meet": ["hS", "v"]}}
        },
        "highlight": ["mNE", "mNW", "mSW", "mSE"],
        "animate": "ruler"
    },
    {
        "id": 6,
        "text": "Draw a circle of half radius centered at O, and four more with the same radius centered on the diagonal points.",
        "textWithoutHelpers": "Draw the central small circle and the four circles on the diagonals.",
        "create": {
            "cO": {"circle": {"centre": "O", "through": "jN"}},
            "cNE": {"circle": {"centre": "mNE", "through": "jN"}},
            "cNW": {"circle": {"centre": "mNW", "through": "jN"}},
            "cSW": {"circle": {"centre": "mSW", "through": "jS"}},
            "cSE": {"circle": {"centre": "mSE", "through": "jS"}}
        },
        "highlight": ["O", "mNE", "mNW", "mSW", "mSE", "jN", "jS"],
        "animate": "compass"
    },
    {
        "id": 7,
        "text": "Connect the poles of the small circles with diagonal lines to draw their dynamic square sides.",
        "textWithoutHelpers": "Draw the diagonal lines across the poles of the small circles.",
        "create": {
            "cNW_top": {"point": {"meet": ["cNW", "vW"], "pick": {"angle": 90}}},
            "cNW_left": {"point": {"meet": ["cNW", "hN"], "pick": {"angle": 180}}},
            "cNE_top": {"point": {"meet": ["cNE", "vE"], "pick": {"angle": 90}}},
            "cNE_right": {"point": {"meet": ["cNE", "hN"], "pick": {"angle": 0}}},
            "cSW_bot": {"point": {"meet": ["cSW", "vW"], "pick": {"angle": 270}}},
            "cSW_left": {"point": {"meet": ["cSW", "hS"], "pick": {"angle": 180}}},
            "cSE_bot": {"point": {"meet": ["cSE", "vE"], "pick": {"angle": 270}}},
            "cSE_right": {"point": {"meet": ["cSE", "hS"], "pick": {"angle": 0}}},
            "diag_m1": {"line": {"through": ["cNW_top", "jN"]}},
            "diag_p1": {"line": {"through": ["cNE_top", "jN"]}},
            "diag_m2": {"line": {"through": ["jS", "cSE_bot"]}},
            "diag_p2": {"line": {"through": ["jS", "cSW_bot"]}},
            "diag_corn_NW": {"line": {"through": ["cNW_left", "cNW_top"]}},
            "diag_corn_NE": {"line": {"through": ["cNE_top", "cNE_right"]}},
            "diag_corn_SW": {"line": {"through": ["cSW_left", "cSW_bot"]}},
            "diag_corn_SE": {"line": {"through": ["cSE_bot", "cSE_right"]}}
        },
        "animate": "ruler"
    },
    {
        "id": 8,
        "text": "Mark where the diagonals cross each small circle to draw the horizontal and vertical sides of their static squares.",
        "textWithoutHelpers": "Draw the horizontal and vertical sides of the static squares in each circle.",
        "create": {
            "kNE": {"point": {"meet": ["cO", "d1"], "pick": {"angle": 45}}},
            "kNW": {"point": {"meet": ["cO", "d2"], "pick": {"angle": 135}}},
            "kSW": {"point": {"meet": ["cO", "d1"], "pick": {"angle": 225}}},
            "kSE": {"point": {"meet": ["cO", "d2"], "pick": {"angle": 315}}},
            "hO_N": {"line": {"through": ["kNW", "kNE"]}},
            "hO_S": {"line": {"through": ["kSW", "kSE"]}},
            "vO_E": {"line": {"through": ["kSE", "kNE"]}},
            "vO_W": {"line": {"through": ["kSW", "kNW"]}},
            "kNE_out": {"point": {"meet": ["cNE", "d1"], "pick": {"farthest": "O"}}},
            "kNE_in": {"point": {"meet": ["cNE", "d1"], "pick": {"nearest": "O"}}},
            "kSW_out": {"point": {"meet": ["cSW", "d1"], "pick": {"farthest": "O"}}},
            "kSW_in": {"point": {"meet": ["cSW", "d1"], "pick": {"nearest": "O"}}},
            "h_top_inner": {"line": {"through": "kNE_out", "parallelTo": "h"}},
            "h_mid_top": {"line": {"through": "kNE_in", "parallelTo": "h"}},
            "v_right_inner": {"line": {"through": "kNE_out", "parallelTo": "v"}},
            "v_mid_right": {"line": {"through": "kNE_in", "parallelTo": "v"}},
            "h_bot_inner": {"line": {"through": "kSW_out", "parallelTo": "h"}},
            "h_mid_bot": {"line": {"through": "kSW_in", "parallelTo": "h"}},
            "v_left_inner": {"line": {"through": "kSW_out", "parallelTo": "v"}},
            "v_mid_left": {"line": {"through": "kSW_in", "parallelTo": "v"}}
        },
        "animate": "ruler"
    },
    {
        "id": 9,
        "text": "Connect the crossings of the static and dynamic squares with diagonal lines to shape the facets of the star and corner motifs.",
        "textWithoutHelpers": "Connect the crossings to shape the facets of the star and corner motifs.",
        "create": {
            # Outer facet lines (offsets +/- c_out = +/-(0.5 + sqrt(2)/2))
            "pA_NE": {"point": {"meet": ["h_top_inner", "diag_p1"]}},
            "pB_NE": {"point": {"meet": ["v_right_inner", "diag_p2"]}},
            "diag_facet_out_NE": {"line": {"through": ["pA_NE", "pB_NE"]}},

            "pA_NW": {"point": {"meet": ["h_top_inner", "diag_m1"]}},
            "pB_NW": {"point": {"meet": ["v_left_inner", "diag_m2"]}},
            "diag_facet_out_NW": {"line": {"through": ["pA_NW", "pB_NW"]}},

            "pA_SE": {"point": {"meet": ["h_bot_inner", "diag_m2"]}},
            "pB_SE": {"point": {"meet": ["v_right_inner", "diag_m1"]}},
            "diag_facet_out_SE": {"line": {"through": ["pA_SE", "pB_SE"]}},

            "pA_SW": {"point": {"meet": ["h_bot_inner", "diag_p2"]}},
            "pB_SW": {"point": {"meet": ["v_left_inner", "diag_p1"]}},
            "diag_facet_out_SW": {"line": {"through": ["pA_SW", "pB_SW"]}},

            # Inner facet lines (offsets +/- c_in = +/-(1.5 - sqrt(2)/2))
            "pC_NE": {"point": {"meet": ["h_mid_top", "diag_p2"]}},
            "pD_NE": {"point": {"meet": ["v_mid_right", "diag_p1"]}},
            "diag_facet_in_NE": {"line": {"through": ["pC_NE", "pD_NE"]}},

            "pC_NW": {"point": {"meet": ["h_mid_top", "diag_m2"]}},
            "pD_NW": {"point": {"meet": ["v_mid_left", "diag_m1"]}},
            "diag_facet_in_NW": {"line": {"through": ["pC_NW", "pD_NW"]}},

            "pC_SE": {"point": {"meet": ["h_mid_bot", "diag_m1"]}},
            "pD_SE": {"point": {"meet": ["v_mid_right", "diag_m2"]}},
            "diag_facet_in_SE": {"line": {"through": ["pC_SE", "pD_SE"]}},

            "pC_SW": {"point": {"meet": ["h_mid_bot", "diag_p1"]}},
            "pD_SW": {"point": {"meet": ["v_mid_left", "diag_p2"]}},
            "diag_facet_in_SW": {"line": {"through": ["pC_SW", "pD_SW"]}},

            # Intermediate facet lines (offsets +/- delta = +/-(sqrt(2)/2 - 0.5))
            "pE_NE": {"point": {"meet": ["h_top_inner", "diag_corn_NE"]}},
            "pF_NE": {"point": {"meet": ["hO_N", "v_mid_right"]}},
            "diag_mid_p_NE": {"line": {"through": ["pE_NE", "pF_NE"]}},

            "pE_SE": {"point": {"meet": ["v_right_inner", "diag_corn_NE"]}},
            "pF_SE": {"point": {"meet": ["vO_E", "h_mid_top"]}},
            "diag_mid_p_SE": {"line": {"through": ["pE_SE", "pF_SE"]}},

            "pE_NW": {"point": {"meet": ["h_top_inner", "diag_corn_NW"]}},
            "pF_NW": {"point": {"meet": ["hO_N", "v_mid_left"]}},
            "diag_mid_m_NW": {"line": {"through": ["pE_NW", "pF_NW"]}},

            "pE_SW": {"point": {"meet": ["v_left_inner", "diag_corn_NW"]}},
            "pF_SW": {"point": {"meet": ["vO_W", "h_mid_top"]}},
            "diag_mid_m_SW": {"line": {"through": ["pE_SW", "pF_SW"]}}
        },
        "animate": "ruler"
    }
]

ink_paths = [
    {
        "along": "diag_facet_out_NE",
        "from": "diag_p1",
        "to": "vE"
    },
    {
        "along": "diag_facet_out_NE",
        "from": "vE",
        "to": "d1"
    },
    {
        "along": "diag_facet_out_NE",
        "from": "d1",
        "to": "hN"
    },
    {
        "along": "diag_facet_out_NE",
        "from": "hN",
        "to": "diag_p2"
    },
    {
        "along": "diag_facet_out_NW",
        "from": "diag_m1",
        "to": "vW"
    },
    {
        "along": "diag_facet_out_NW",
        "from": "vW",
        "to": "d2"
    },
    {
        "along": "diag_facet_out_NW",
        "from": "d2",
        "to": "hN"
    },
    {
        "along": "diag_facet_out_NW",
        "from": "hN",
        "to": "diag_m2"
    },
    {
        "along": "diag_facet_out_SE",
        "from": "diag_m2",
        "to": "vE"
    },
    {
        "along": "diag_facet_out_SE",
        "from": "vE",
        "to": "d2"
    },
    {
        "along": "diag_facet_out_SE",
        "from": "d2",
        "to": "hS"
    },
    {
        "along": "diag_facet_out_SE",
        "from": "hS",
        "to": "diag_m1"
    },
    {
        "along": "diag_facet_out_SW",
        "from": "diag_p2",
        "to": "vW"
    },
    {
        "along": "diag_facet_out_SW",
        "from": "vW",
        "to": "d1"
    },
    {
        "along": "diag_facet_out_SW",
        "from": "d1",
        "to": "hS"
    },
    {
        "along": "diag_facet_out_SW",
        "from": "hS",
        "to": "diag_p1"
    },
    {
        "along": "diag_m1",
        "from": "v_mid_left",
        "to": "v"
    },
    {
        "along": "diag_m1",
        "from": "v",
        "to": "hO_N"
    },
    {
        "along": "diag_m1",
        "from": "vO_E",
        "to": "h"
    },
    {
        "along": "diag_m1",
        "from": "h",
        "to": "h_mid_bot"
    },
    {
        "along": "diag_m2",
        "from": "h_mid_top",
        "to": "h"
    },
    {
        "along": "diag_m2",
        "from": "h",
        "to": "vO_W"
    },
    {
        "along": "diag_m2",
        "from": "hO_S",
        "to": "v"
    },
    {
        "along": "diag_m2",
        "from": "v",
        "to": "v_mid_right"
    },
    {
        "along": "diag_mid_m_NW",
        "from": "diag_corn_NW",
        "to": "vW"
    },
    {
        "along": "diag_mid_m_NW",
        "from": "vW",
        "to": "vO_W"
    },
    {
        "along": "diag_mid_m_NW",
        "from": "hO_S",
        "to": "hS"
    },
    {
        "along": "diag_mid_m_NW",
        "from": "hS",
        "to": "diag_corn_SE"
    },
    {
        "along": "diag_mid_m_SW",
        "from": "diag_corn_NW",
        "to": "hN"
    },
    {
        "along": "diag_mid_m_SW",
        "from": "hN",
        "to": "hO_N"
    },
    {
        "along": "diag_mid_m_SW",
        "from": "vO_E",
        "to": "vE"
    },
    {
        "along": "diag_mid_m_SW",
        "from": "vE",
        "to": "diag_corn_SE"
    },
    {
        "along": "diag_mid_p_NE",
        "from": "diag_corn_NE",
        "to": "vE"
    },
    {
        "along": "diag_mid_p_NE",
        "from": "vE",
        "to": "vO_E"
    },
    {
        "along": "diag_mid_p_NE",
        "from": "hO_S",
        "to": "hS"
    },
    {
        "along": "diag_mid_p_NE",
        "from": "hS",
        "to": "diag_corn_SW"
    },
    {
        "along": "diag_mid_p_SE",
        "from": "diag_corn_NE",
        "to": "hN"
    },
    {
        "along": "diag_mid_p_SE",
        "from": "hN",
        "to": "hO_N"
    },
    {
        "along": "diag_mid_p_SE",
        "from": "vO_W",
        "to": "vW"
    },
    {
        "along": "diag_mid_p_SE",
        "from": "vW",
        "to": "diag_corn_SW"
    },
    {
        "along": "diag_p1",
        "from": "v_mid_right",
        "to": "v"
    },
    {
        "along": "diag_p1",
        "from": "v",
        "to": "hO_N"
    },
    {
        "along": "diag_p1",
        "from": "vO_W",
        "to": "h"
    },
    {
        "along": "diag_p1",
        "from": "h",
        "to": "h_mid_bot"
    },
    {
        "along": "diag_p2",
        "from": "h_mid_top",
        "to": "h"
    },
    {
        "along": "diag_p2",
        "from": "h",
        "to": "vO_E"
    },
    {
        "along": "diag_p2",
        "from": "hO_S",
        "to": "v"
    },
    {
        "along": "diag_p2",
        "from": "v",
        "to": "v_mid_left"
    },
    {
        "along": "hO_N",
        "from": "diag_mid_m_SW",
        "to": "vW"
    },
    {
        "along": "hO_N",
        "from": "vW",
        "to": "diag_facet_in_NW"
    },
    {
        "along": "hO_N",
        "from": "diag_facet_in_NW",
        "to": "d2"
    },
    {
        "along": "hO_N",
        "from": "d2",
        "to": "diag_p1"
    },
    {
        "along": "hO_N",
        "from": "diag_m1",
        "to": "d1"
    },
    {
        "along": "hO_N",
        "from": "d1",
        "to": "diag_facet_in_NE"
    },
    {
        "along": "hO_N",
        "from": "diag_facet_in_NE",
        "to": "vE"
    },
    {
        "along": "hO_N",
        "from": "vE",
        "to": "diag_mid_p_SE"
    },
    {
        "along": "hO_S",
        "from": "diag_mid_p_NE",
        "to": "vW"
    },
    {
        "along": "hO_S",
        "from": "vW",
        "to": "diag_facet_in_SW"
    },
    {
        "along": "hO_S",
        "from": "diag_facet_in_SW",
        "to": "d1"
    },
    {
        "along": "hO_S",
        "from": "d1",
        "to": "diag_m2"
    },
    {
        "along": "hO_S",
        "from": "diag_p2",
        "to": "d2"
    },
    {
        "along": "hO_S",
        "from": "d2",
        "to": "diag_facet_in_SE"
    },
    {
        "along": "hO_S",
        "from": "diag_facet_in_SE",
        "to": "vE"
    },
    {
        "along": "hO_S",
        "from": "vE",
        "to": "diag_mid_m_NW"
    },
    {
        "along": "h_bot_inner",
        "from": "vLeft",
        "to": "d1"
    },
    {
        "along": "h_bot_inner",
        "from": "d1",
        "to": "diag_corn_SW"
    },
    {
        "along": "h_bot_inner",
        "from": "diag_p2",
        "to": "v_mid_left"
    },
    {
        "along": "h_bot_inner",
        "from": "v_mid_left",
        "to": "diag_facet_in_SE"
    },
    {
        "along": "h_bot_inner",
        "from": "diag_facet_in_SE",
        "to": "v"
    },
    {
        "along": "h_bot_inner",
        "from": "v",
        "to": "diag_facet_in_SW"
    },
    {
        "along": "h_bot_inner",
        "from": "diag_facet_in_SW",
        "to": "v_mid_right"
    },
    {
        "along": "h_bot_inner",
        "from": "v_mid_right",
        "to": "diag_m2"
    },
    {
        "along": "h_bot_inner",
        "from": "diag_corn_SE",
        "to": "d2"
    },
    {
        "along": "h_bot_inner",
        "from": "d2",
        "to": "vRight"
    },
    {
        "along": "h_mid_bot",
        "from": "vLeft",
        "to": "diag_facet_in_NW"
    },
    {
        "along": "h_mid_bot",
        "from": "diag_facet_in_NW",
        "to": "v_left_inner"
    },
    {
        "along": "h_mid_bot",
        "from": "v_left_inner",
        "to": "diag_p1"
    },
    {
        "along": "h_mid_bot",
        "from": "diag_m1",
        "to": "v_right_inner"
    },
    {
        "along": "h_mid_bot",
        "from": "v_right_inner",
        "to": "diag_facet_in_NE"
    },
    {
        "along": "h_mid_bot",
        "from": "diag_facet_in_NE",
        "to": "vRight"
    },
    {
        "along": "h_mid_top",
        "from": "vLeft",
        "to": "diag_facet_in_SW"
    },
    {
        "along": "h_mid_top",
        "from": "diag_facet_in_SW",
        "to": "v_left_inner"
    },
    {
        "along": "h_mid_top",
        "from": "v_left_inner",
        "to": "diag_m2"
    },
    {
        "along": "h_mid_top",
        "from": "diag_p2",
        "to": "v_right_inner"
    },
    {
        "along": "h_mid_top",
        "from": "v_right_inner",
        "to": "diag_facet_in_SE"
    },
    {
        "along": "h_mid_top",
        "from": "diag_facet_in_SE",
        "to": "vRight"
    },
    {
        "along": "h_top_inner",
        "from": "vLeft",
        "to": "d2"
    },
    {
        "along": "h_top_inner",
        "from": "d2",
        "to": "diag_corn_NW"
    },
    {
        "along": "h_top_inner",
        "from": "diag_m1",
        "to": "v_mid_left"
    },
    {
        "along": "h_top_inner",
        "from": "v_mid_left",
        "to": "diag_facet_in_NE"
    },
    {
        "along": "h_top_inner",
        "from": "diag_facet_in_NE",
        "to": "v"
    },
    {
        "along": "h_top_inner",
        "from": "v",
        "to": "diag_facet_in_NW"
    },
    {
        "along": "h_top_inner",
        "from": "diag_facet_in_NW",
        "to": "v_mid_right"
    },
    {
        "along": "h_top_inner",
        "from": "v_mid_right",
        "to": "diag_p1"
    },
    {
        "along": "h_top_inner",
        "from": "diag_corn_NE",
        "to": "d1"
    },
    {
        "along": "h_top_inner",
        "from": "d1",
        "to": "vRight"
    },
    {
        "along": "vO_E",
        "from": "diag_mid_m_SW",
        "to": "hS"
    },
    {
        "along": "vO_E",
        "from": "hS",
        "to": "diag_facet_in_SE"
    },
    {
        "along": "vO_E",
        "from": "diag_facet_in_SE",
        "to": "d2"
    },
    {
        "along": "vO_E",
        "from": "d2",
        "to": "diag_p2"
    },
    {
        "along": "vO_E",
        "from": "diag_m1",
        "to": "d1"
    },
    {
        "along": "vO_E",
        "from": "d1",
        "to": "diag_facet_in_NE"
    },
    {
        "along": "vO_E",
        "from": "diag_facet_in_NE",
        "to": "hN"
    },
    {
        "along": "vO_E",
        "from": "hN",
        "to": "diag_mid_p_NE"
    },
    {
        "along": "vO_W",
        "from": "diag_mid_p_SE",
        "to": "hS"
    },
    {
        "along": "vO_W",
        "from": "hS",
        "to": "diag_facet_in_SW"
    },
    {
        "along": "vO_W",
        "from": "diag_facet_in_SW",
        "to": "d1"
    },
    {
        "along": "vO_W",
        "from": "d1",
        "to": "diag_m2"
    },
    {
        "along": "vO_W",
        "from": "diag_p1",
        "to": "d2"
    },
    {
        "along": "vO_W",
        "from": "d2",
        "to": "diag_facet_in_NW"
    },
    {
        "along": "vO_W",
        "from": "diag_facet_in_NW",
        "to": "hN"
    },
    {
        "along": "vO_W",
        "from": "hN",
        "to": "diag_mid_m_NW"
    },
    {
        "along": "v_left_inner",
        "from": "hBot",
        "to": "d1"
    },
    {
        "along": "v_left_inner",
        "from": "d1",
        "to": "diag_corn_SW"
    },
    {
        "along": "v_left_inner",
        "from": "diag_p1",
        "to": "h_mid_bot"
    },
    {
        "along": "v_left_inner",
        "from": "h_mid_bot",
        "to": "diag_facet_in_NW"
    },
    {
        "along": "v_left_inner",
        "from": "diag_facet_in_NW",
        "to": "h"
    },
    {
        "along": "v_left_inner",
        "from": "h",
        "to": "diag_facet_in_SW"
    },
    {
        "along": "v_left_inner",
        "from": "diag_facet_in_SW",
        "to": "h_mid_top"
    },
    {
        "along": "v_left_inner",
        "from": "h_mid_top",
        "to": "diag_m2"
    },
    {
        "along": "v_left_inner",
        "from": "diag_corn_NW",
        "to": "d2"
    },
    {
        "along": "v_left_inner",
        "from": "d2",
        "to": "hTop"
    },
    {
        "along": "v_mid_left",
        "from": "hBot",
        "to": "diag_facet_in_SE"
    },
    {
        "along": "v_mid_left",
        "from": "diag_facet_in_SE",
        "to": "h_bot_inner"
    },
    {
        "along": "v_mid_left",
        "from": "h_bot_inner",
        "to": "diag_p2"
    },
    {
        "along": "v_mid_left",
        "from": "diag_m1",
        "to": "h_top_inner"
    },
    {
        "along": "v_mid_left",
        "from": "h_top_inner",
        "to": "diag_facet_in_NE"
    },
    {
        "along": "v_mid_left",
        "from": "diag_facet_in_NE",
        "to": "hTop"
    },
    {
        "along": "v_mid_right",
        "from": "hBot",
        "to": "diag_facet_in_SW"
    },
    {
        "along": "v_mid_right",
        "from": "diag_facet_in_SW",
        "to": "h_bot_inner"
    },
    {
        "along": "v_mid_right",
        "from": "h_bot_inner",
        "to": "diag_m2"
    },
    {
        "along": "v_mid_right",
        "from": "diag_p1",
        "to": "h_top_inner"
    },
    {
        "along": "v_mid_right",
        "from": "h_top_inner",
        "to": "diag_facet_in_NW"
    },
    {
        "along": "v_mid_right",
        "from": "diag_facet_in_NW",
        "to": "hTop"
    },
    {
        "along": "v_right_inner",
        "from": "hBot",
        "to": "d2"
    },
    {
        "along": "v_right_inner",
        "from": "d2",
        "to": "diag_corn_SE"
    },
    {
        "along": "v_right_inner",
        "from": "diag_m1",
        "to": "h_mid_bot"
    },
    {
        "along": "v_right_inner",
        "from": "h_mid_bot",
        "to": "diag_facet_in_NE"
    },
    {
        "along": "v_right_inner",
        "from": "diag_facet_in_NE",
        "to": "h"
    },
    {
        "along": "v_right_inner",
        "from": "h",
        "to": "diag_facet_in_SE"
    },
    {
        "along": "v_right_inner",
        "from": "diag_facet_in_SE",
        "to": "h_mid_top"
    },
    {
        "along": "v_right_inner",
        "from": "h_mid_top",
        "to": "diag_p2"
    },
    {
        "along": "v_right_inner",
        "from": "diag_corn_NE",
        "to": "d1"
    },
    {
        "along": "v_right_inner",
        "from": "d1",
        "to": "hTop"
    }
]

tutorial = {
    "format": 0,
    "id": "eight-fold-khatam",
    "title": "Eight-fold khatam",
    "fold": 4,
    "style": "Safavid",
    "level": "intermediate",
    "credits": [
        {
            "source": "4fold Pattern from Al-Hakim Mosque, Isfahan",
            "creator": "Sandy Kurt (sandykurt.com)",
            "url": "https://sandykurt.com/free-tutorials",
            "note": "Static and dynamic squares, radius-1/2 circles at the center and diagonal midpoints, establishing the khatam star, corner squares, and flanking motifs.",
            "steps": [4, 5, 6, 7, 8, 9]
        }
    ],
    "given": {
        "O": "The centre of the drawing.",
        "A": "Any point to the right of O. The distance OA is the radius, and the unit for every length."
    },
    "steps": steps,
    "ink": {
        "text": "Go over the outline of the central eight-pointed khatam star, the surrounding kites, hexagons, and corner squares.",
        "paths": ink_paths
    },
    "pattern": {
        "cell": "static",
        "text": "Repeat the static tile to fill the wall.",
        "palette": "Isfahan",
        "colors": {
            "khatam_star": "c",
            "cross_arm": "a",
            "petal": "b",
            "square": "d",
            "shield": "ground"
        }
    },
    "expect": {
        "pieceTypes": 5,
        "pieces": [
            {"name": "khatam_star", "vertices": 16, "area": 0.58579, "perCell": 1},
            {"name": "cross_arm", "vertices": 10, "area": 0.25, "perCell": 4},
            {"name": "petal", "vertices": 8, "area": 0.14645, "perCell": 8},
            {"name": "square", "vertices": 4, "area": 0.08579, "perCell": 3},
            {"name": "shield", "vertices": 5, "area": 0.08211, "perCell": 12}
        ],
        "cellArea": 4.0
    }
}

target = os.path.join(ROOT, "tutorials", "eight-fold-khatam.json")
with open(target, "w") as f:
    json.dump(tutorial, f, indent=2)

print("Saved tutorial to", target)

# Format with tastir formatter
fmt_tool = os.path.join(ROOT, "tools", "review", "format_tutorial.py")
if os.path.exists(fmt_tool):
    os.system(f"python3 {fmt_tool} {target}")

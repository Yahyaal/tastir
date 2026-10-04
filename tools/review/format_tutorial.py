#!/usr/bin/env python3
"""Rewrites tutorial JSON files in the house style: two-space indent, with
any object or array that fits on one line of 100 characters kept on one
line, so each element of a step reads as one line.

Usage: format_tutorial.py tutorials/<id>.json [...]
"""
import json
import sys

WIDTH = 100


def dump(value, indent=0):
    flat = json.dumps(value, ensure_ascii=False, separators=(", ", ": "))
    if len(flat) + indent <= WIDTH or not isinstance(value, (dict, list)) or not value:
        return flat
    pad = " " * (indent + 2)
    if isinstance(value, dict):
        items = [f"{pad}{json.dumps(k, ensure_ascii=False)}: {dump(v, indent + 2)}"
                 for k, v in value.items()]
        return "{\n" + ",\n".join(items) + "\n" + " " * indent + "}"
    items = [pad + dump(v, indent + 2) for v in value]
    return "[\n" + ",\n".join(items) + "\n" + " " * indent + "]"


for path in sys.argv[1:]:
    with open(path) as f:
        data = json.load(f)
    with open(path, "w") as f:
        f.write(dump(data) + "\n")

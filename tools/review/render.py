#!/usr/bin/env python3
"""Renders a tutorial dump (from dump.ts) to PNGs for review by eye.

  step-NN.png   everything built so far in grey, this step's elements in red,
                new points labelled with their names
  ink.png       the ink in black over the faint construction, cell in blue
  tile.png      the pieces of one cell, filled by type, with a legend
  wall.png      a 4 x 4 block of cells, filled by type, with the ink on top

Usage: render.py <dump.json> <out-dir>
"""
import json
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

SIZE = 900          # output pixels (square)
SS = 3              # supersampling factor for anti-aliasing
GREY = (175, 175, 175)
NEW = (215, 40, 40)
INK = (20, 20, 20)
CELL = (40, 90, 220)
TYPE_COLOURS = [
    (231, 186, 82), (52, 101, 164), (78, 154, 106), (196, 78, 82),
    (240, 240, 232), (129, 96, 168), (79, 172, 190), (222, 132, 70),
    (150, 150, 150), (110, 70, 40), (230, 140, 180), (60, 60, 60),
]


def font(px):
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                 "/usr/share/fonts/TTF/DejaVuSans.ttf"):
        if os.path.exists(path):
            return ImageFont.truetype(path, px)
    return ImageFont.load_default()


class Canvas:
    def __init__(self, view):
        x0, y0, x1, y1 = view
        self.view = view
        self.scale = SIZE * SS / max(x1 - x0, y1 - y0)
        self.img = Image.new("RGB", (SIZE * SS, SIZE * SS), "white")
        self.draw = ImageDraw.Draw(self.img)
        self.font = font(13 * SS)

    def px(self, x, y):
        x0, y0, x1, y1 = self.view
        return ((x - x0) * self.scale, (y1 - y) * self.scale)

    def line(self, el, colour, width):
        # Clip the infinite line to the view by walking far along it.
        x, y, dx, dy = el["x"], el["y"], el["dx"], el["dy"]
        far = 4 * max(self.view[2] - self.view[0], self.view[3] - self.view[1])
        far += math.hypot(x - (self.view[0] + self.view[2]) / 2,
                          y - (self.view[1] + self.view[3]) / 2)
        self.draw.line([self.px(x - dx * far, y - dy * far),
                        self.px(x + dx * far, y + dy * far)],
                       fill=colour, width=width * SS)

    def circle(self, el, colour, width):
        cx, cy = self.px(el["x"], el["y"])
        r = el["r"] * self.scale
        self.draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                          outline=colour, width=width * SS)

    def polyline(self, pts, colour, width, closed=True):
        p = [self.px(x, y) for x, y in pts]
        if closed:
            p.append(p[0])
        self.draw.line(p, fill=colour, width=width * SS, joint="curve")

    def fill(self, pts, colour, outline=None):
        self.draw.polygon([self.px(x, y) for x, y in pts], fill=colour,
                          outline=outline)

    def point(self, x, y, colour, label=None):
        cx, cy = self.px(x, y)
        r = 3.5 * SS
        self.draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=colour)
        if label:
            self.draw.text((cx + 5 * SS, cy - 17 * SS), label, fill=colour,
                           font=self.font)

    def element(self, el, colour, width, label_points=False):
        k = el["kind"]
        if k == "line":
            self.line(el, colour, width)
        elif k == "circle":
            self.circle(el, colour, width)
        elif k == "polygon":
            self.polyline(el["vertices"], colour, width)
        elif k == "point":
            self.point(el["x"], el["y"], colour,
                       el["name"] if label_points else None)

    def caption(self, text, colour=(0, 0, 0)):
        f = font(15 * SS)
        words, lines, cur = text.split(), [], ""
        for w in words:
            if len(cur) + len(w) > 95:
                lines.append(cur)
                cur = w
            else:
                cur = f"{cur} {w}".strip()
        lines.append(cur)
        y = 6 * SS
        for ln in lines:
            self.draw.rectangle([0, y, SIZE * SS, y + 19 * SS], fill="white")
            self.draw.text((8 * SS, y), ln, fill=colour, font=f)
            y += 19 * SS

    def save(self, path):
        self.img.resize((SIZE, SIZE), Image.LANCZOS).save(path)


def view_of(dump):
    """One view for every image, so the steps line up with each other."""
    if "cell" in dump:
        pts = dump["cell"]["corners"]
    else:
        last = next((s for s in reversed(dump["steps"]) if "elements" in s), None)
        pts = []
        for el in (last or {}).get("elements", []):
            if el["kind"] == "point" and math.hypot(el["x"], el["y"]) < 6:
                pts.append((el["x"], el["y"]))
            if el["kind"] == "circle" and math.hypot(el["x"], el["y"]) < 6:
                pts += [(el["x"] - el["r"], el["y"] - el["r"]),
                        (el["x"] + el["r"], el["y"] + el["r"])]
        pts = pts or [(-1.5, -1.5), (1.5, 1.5)]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    half = max(max(xs) - min(xs), max(ys) - min(ys)) / 2 * 1.15 + 0.05
    return (cx - half, cy - half, cx + half, cy + half)


def render(dump, out):
    os.makedirs(out, exist_ok=True)
    for old in os.listdir(out):
        if old.startswith("step-") and old.endswith(".png"):
            os.remove(os.path.join(out, old))
    view = view_of(dump)
    for n, step in enumerate(dump["steps"], start=1):
        c = Canvas(view)
        if "error" in step:
            prev = dump["steps"][n - 2] if n > 1 else {"elements": []}
            for el in prev.get("elements", []):
                c.element(el, GREY, 1)
            c.caption(f"Step {step['id']} FAILED: {step['error']}", NEW)
            c.save(os.path.join(out, f"step-{n:02d}.png"))
            print(f"step {step['id']}: ERROR {step['error']}")
            break
        sid = step["id"]
        old = [e for e in step["elements"] if e["step"] != sid]
        new = [e for e in step["elements"] if e["step"] == sid]
        for el in old:
            if el["kind"] != "point":
                c.element(el, GREY, 1)
        for el in old:
            if el["kind"] == "point":
                c.point(el["x"], el["y"], GREY)
        for el in new:
            if el["kind"] != "point":
                c.element(el, NEW, 2)
        for el in new:
            if el["kind"] == "point":
                c.element(el, NEW, 2, label_points=True)
        c.caption(f"Step {sid}: {step['text']}")
        c.save(os.path.join(out, f"step-{n:02d}.png"))

    if "patternError" in dump:
        print("pattern: ERROR", dump["patternError"])
        return
    last = dump["steps"][-1].get("elements", [])

    c = Canvas(view)
    for el in last:
        if el["kind"] in ("line", "circle", "polygon"):
            c.element(el, (215, 215, 215), 1)
    c.polyline(dump["cell"]["corners"], CELL, 1)
    for a, b in dump["ink"]:
        c.polyline([a, b], INK, 3, closed=False)
    c.caption("Ink" + (f" — OFF CROSSINGS: {dump['offCrossings']}"
                       if dump["offCrossings"] else ""))
    c.save(os.path.join(out, "ink.png"))

    types = dump["types"]
    c = Canvas(view)
    for p in dump["pieces"]:
        c.fill(p["polygon"], TYPE_COLOURS[p["type"] % len(TYPE_COLOURS)],
               outline=INK)
    c.polyline(dump["cell"]["corners"], CELL, 1)
    legend = "; ".join(
        f"{i}:{t['name'] or '?'} {t['vertices']}v a={t['area']} x{t['perCell']}"
        + (" SLIVER" if t["sliver"] else "") for i, t in enumerate(types))
    c.caption(f"Tile pieces — {legend}")
    c.save(os.path.join(out, "tile.png"))

    u, v = dump["cell"]["u"], dump["cell"]["v"]
    shifts = [(i * u[0] + j * v[0], i * u[1] + j * v[1])
              for i in range(-3, 4) for j in range(-3, 4)]
    # Show the 3 x 3 block of cells around the central one; the outer ring
    # of copies only fills the edges of the picture.
    block = [(x + i * u[0] + j * v[0], y + i * u[1] + j * v[1])
             for x, y in dump["cell"]["corners"]
             for i in (-1, 1) for j in (-1, 1)]
    bx = [p[0] for p in block]
    by = [p[1] for p in block]
    cx, cy = (min(bx) + max(bx)) / 2, (min(by) + max(by)) / 2
    half = max(max(bx) - min(bx), max(by) - min(by)) / 2
    wall = Canvas((cx - half, cy - half, cx + half, cy + half))
    for sx, sy in shifts:
        for p in dump["pieces"]:
            pts = [(x + sx, y + sy) for x, y in p["polygon"]]
            wall.fill(pts, TYPE_COLOURS[p["type"] % len(TYPE_COLOURS)])
    for sx, sy in shifts:
        for a, b in dump["ink"]:
            wall.polyline([(a[0] + sx, a[1] + sy), (b[0] + sx, b[1] + sy)],
                          INK, 2, closed=False)
    wall.caption(f"{dump['title']} — wall")
    wall.save(os.path.join(out, "wall.png"))
    print("types:", json.dumps(types))


if __name__ == "__main__":
    with open(sys.argv[1]) as f:
        render(json.load(f), sys.argv[2])

#!/usr/bin/env python3
"""Puts a source picture next to our render of the same step.

  pnpm compare <id> <step> <source-image> [--crop x,y,w,h]

<step> is a step number, or `ink`, `tile` or `wall`. The result is saved as
docs/review/<id>/compare-step-N.png (or compare-wall.png and so on). Run
`pnpm review <id>` first so the render exists. --crop takes a box in the
source picture's pixels, for a source page that holds several drawings.
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from render import font  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
H = 800


def fit(img):
    w, h = img.size
    return img.resize((max(1, round(w * H / h)), H), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    ap.add_argument("step")
    ap.add_argument("source")
    ap.add_argument("--crop", help="x,y,w,h in source pixels")
    a = ap.parse_args()

    out_dir = os.path.join(ROOT, "docs", "review", a.id)
    if a.step.isdigit():
        ours = os.path.join(out_dir, f"step-{int(a.step):02d}.png")
        name = f"compare-step-{int(a.step)}.png"
    else:
        ours = os.path.join(out_dir, f"{a.step}.png")
        name = f"compare-{a.step}.png"
    if not os.path.exists(ours):
        sys.exit(f"no render at {ours}; run `pnpm review {a.id}` first")

    src = Image.open(a.source).convert("RGB")
    if a.crop:
        x, y, w, h = (int(v) for v in a.crop.split(","))
        src = src.crop((x, y, x + w, y + h))
    left, right = fit(src), fit(Image.open(ours).convert("RGB"))
    gap, top = 16, 34
    sheet = Image.new("RGB", (left.width + right.width + gap, H + top), "white")
    sheet.paste(left, (0, top))
    sheet.paste(right, (left.width + gap, top))
    d = ImageDraw.Draw(sheet)
    f = font(18)
    d.text((8, 8), f"source: {os.path.basename(a.source)}", fill="black", font=f)
    d.text((left.width + gap + 8, 8), f"ours: {a.id} {a.step}", fill="black",
           font=f)
    path = os.path.join(out_dir, name)
    sheet.save(path)
    print(path)


if __name__ == "__main__":
    main()

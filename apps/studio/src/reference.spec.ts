import { Resvg } from '@resvg/resvg-js';
import { construct, ink } from './ops.js';
import { RENDER_FONT } from './picture.js';
import { emptyDraft } from './player.js';
import { imageSize, overlaySvg, toPhoto, type Reference } from './reference.js';

const photo = new Resvg(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect width="200" height="160" fill="#ffffff"/></svg>',
  { font: RENDER_FONT },
)
  .render()
  .asPng();

describe('reference photos', () => {
  it('reads the size of a PNG and refuses other files', () => {
    expect(imageSize(photo)).toEqual({
      type: 'image/png',
      width: 200,
      height: 160,
    });
    expect(() => imageSize(Buffer.from('not a picture'))).toThrow(
      /PNG or JPEG/,
    );
  });

  it('maps the drawing onto the photo from O and A', () => {
    const map = toPhoto({ o: { x: 100, y: 80 }, a: { x: 150, y: 80 } });
    expect(map({ x: 1, y: 0 })).toEqual({ x: 150, y: 80 });
    expect(map({ x: 0, y: 1 })).toEqual({ x: 100, y: 30 });
    // A photo turned a quarter: A straight below O.
    const turned = toPhoto({ o: { x: 0, y: 0 }, a: { x: 0, y: 10 } });
    expect(turned({ x: 0, y: 1 })).toEqual({ x: 10, y: 0 });
  });

  it('draws the ink over the photo once it is lined up', () => {
    const ref: Reference = {
      file: 'reference.png',
      type: 'image/png',
      width: 200,
      height: 160,
    };
    const draft = ink(
      construct(emptyDraft('x', 'x'), [
        { kind: 'circle', name: 'C0', centre: 'O', through: 'A' },
      ]),
      [{ from: 'O', to: 'A' }],
    );
    const magenta = (svgText: string) => {
      const pixels = new Resvg(svgText, { font: RENDER_FONT }).render().pixels;
      let n = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (pixels[i]! > 200 && pixels[i + 1]! < 80 && pixels[i + 2]! > 150)
          n++;
      return n;
    };
    expect(magenta(overlaySvg(ref, photo, draft))).toBe(0);
    const aligned = {
      ...ref,
      align: { o: { x: 60, y: 80 }, a: { x: 140, y: 80 } },
    };
    expect(magenta(overlaySvg(aligned, photo, draft))).toBeGreaterThan(50);
    expect(
      overlaySvg(aligned, photo, draft, { x: 0, y: -0.5, width: 1, height: 1 }),
    ).toContain('viewBox="60 40 80 80"');
  });
});

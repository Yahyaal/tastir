import { inkStrokes, type Vec } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { StudioError } from './ops.js';
import { check, type Draft } from './player.js';

/**
 * A reference photo for recreating a pattern, and the drawing laid over it.
 * The owner lines the photo up once by placing O and A on it; the
 * alignment lives in the project, never in the pattern, which keeps its
 * ruler-and-compass steps with no coordinates.
 */
export interface Reference {
  /** The photo's file name in the project folder. */
  readonly file: string;
  readonly type: 'image/png' | 'image/jpeg';
  readonly width: number;
  readonly height: number;
  /** Where it came from, as the owner gave it. */
  readonly source?: string;
  /** Pixel positions of O and A on the photo (x right, y down). */
  readonly align?: { readonly o: Vec; readonly a: Vec };
}

/** The type and size of a PNG or JPEG, read from its header. */
export function imageSize(
  bytes: Buffer,
): Pick<Reference, 'type' | 'width' | 'height'> {
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47)
    return {
      type: 'image/png',
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) break;
      const marker = bytes[i + 1]!;
      const length = bytes.readUInt16BE(i + 2);
      // Start-of-frame markers hold the size; C4, C8 and CC are not frames.
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      )
        return {
          type: 'image/jpeg',
          height: bytes.readUInt16BE(i + 5),
          width: bytes.readUInt16BE(i + 7),
        };
      i += 2 + length;
    }
  }
  throw new StudioError('Use a PNG or JPEG photo.');
}

/** Drawing units to photo pixels, from where O and A sit on the photo. */
export function toPhoto(align: NonNullable<Reference['align']>) {
  const d = { x: align.a.x - align.o.x, y: align.a.y - align.o.y };
  if (Math.hypot(d.x, d.y) < 2)
    throw new StudioError('Place O and A further apart on the photo.');
  // y is up in the drawing and down on the photo, so up is d turned back.
  return (p: Vec): Vec => ({
    x: align.o.x + p.x * d.x + p.y * d.y,
    y: align.o.y + p.x * d.y - p.y * d.x,
  });
}

const num = (n: number) => Number(n.toFixed(2));

/**
 * The photo as SVG, with the ink drawn over it when it is aligned. An area
 * in drawing units crops to that part of the photo.
 */
export function overlaySvg(
  ref: Reference,
  photo: Buffer,
  draft?: Draft,
  area?: { x: number; y: number; width: number; height: number },
): string {
  let box = { x: 0, y: 0, w: ref.width, h: ref.height };
  const map = ref.align ? toPhoto(ref.align) : undefined;
  if (area) {
    if (!map)
      throw new StudioError(
        'Line the photo up first (place O and A on it) to look at an area.',
      );
    const corners = [
      { x: area.x, y: area.y },
      { x: area.x + area.width, y: area.y },
      { x: area.x, y: area.y + area.height },
      { x: area.x + area.width, y: area.y + area.height },
    ].map(map);
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    box = {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  }
  const parts = [
    `<image href="data:${ref.type};base64,${photo.toString('base64')}" x="0" y="0" width="${ref.width}" height="${ref.height}"/>`,
  ];
  if (draft && map) {
    const { scene } = check(draft);
    const s = Math.max(box.w, box.h) / 500;
    if (draft.ink?.paths.length) {
      try {
        for (const { segment } of inkStrokes(scene, draft as Tutorial)) {
          const a = map(segment.a);
          const b = map(segment.b);
          parts.push(
            `<line x1="${num(a.x)}" y1="${num(a.y)}" x2="${num(b.x)}" y2="${num(b.y)}" stroke="#ff00c8" stroke-width="${num(Math.max(2, s * 2.5))}" stroke-linecap="round"/>`,
          );
        }
      } catch {
        // Ink that no longer follows the construction is left out.
      }
    }
    const o = map({ x: 0, y: 0 });
    const a = map({ x: 1, y: 0 });
    parts.push(
      `<circle cx="${num(o.x)}" cy="${num(o.y)}" r="${num(s * 4)}" fill="#00e5ff"/>`,
      `<circle cx="${num(a.x)}" cy="${num(a.y)}" r="${num(s * 4)}" fill="#00e5ff"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${num(box.x)} ${num(box.y)} ${num(box.w)} ${num(box.h)}">${parts.join('')}</svg>`;
}

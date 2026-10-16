import { SquareBandsShape, type SquareBands } from '@tastir/schema';
import type { Model } from './model';

/** This first spatial motif needs one square per orthogonal square cell. */
export function squareGridTypes(model: Model): string[] {
  const { cell, pieces, types } = model.pattern;
  const a = Math.hypot(cell.u.x, cell.u.y);
  const b = Math.hypot(cell.v.x, cell.v.y);
  if (
    Math.abs(a - b) > a * 1e-5 ||
    Math.abs(cell.u.x * cell.v.x + cell.u.y * cell.v.y) > a * b * 1e-5
  )
    return [];
  return types.flatMap((type, index) => {
    const own = pieces.filter((p) => p.type === index);
    const p = own[0]?.polygon;
    if (!type.name || own.length !== 1 || !p || p.length !== 4) return [];
    const sides = p.map((q, k) => ({
      x: p[(k + 1) % 4]!.x - q.x,
      y: p[(k + 1) % 4]!.y - q.y,
    }));
    const length = Math.hypot(sides[0]!.x, sides[0]!.y);
    if (
      sides.some(
        (v, k) =>
          Math.abs(Math.hypot(v.x, v.y) - length) > length * 1e-5 ||
          Math.abs(v.x * sides[(k + 1) % 4]!.x + v.y * sides[(k + 1) % 4]!.y) >
            length * length * 1e-5,
      )
    )
      return [];
    return [type.name];
  });
}

/** Validate before saving or painting; no approximate grid guessing. */
export function checkedSquareBands(
  model: Model,
  value: SquareBands,
): SquareBands {
  const bands = SquareBandsShape.parse(value);
  if (!squareGridTypes(model).includes(bands.typeId))
    throw new Error(
      'This pattern does not have one square per square-grid cell.',
    );
  return bands;
}

/** One centre square, then one-cell borders: 1×1, 3×3, 5×5… */
export function squareBandColor(
  bands: SquareBands,
  i: number,
  j: number,
): string {
  const size = squareBandPeriod(bands);
  const distance = (n: number, centre: number) => {
    const at = (((n - centre) % size) + size) % size;
    return Math.min(at, size - at);
  };
  return bands.colors[
    Math.max(distance(i, bands.centre[0]), distance(j, bands.centre[1]))
  ]!;
}

export const commonPeriod = (a: number, b: number): number => {
  const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
  return (a * b) / gcd(a, b);
};

export const squareBandPeriod = (bands: SquareBands) =>
  bands.colors.length * 2 - (bands.sharedBorder ? 2 : 1);

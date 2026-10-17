import type { Geometry, Vec } from '@tastir/engine';
import type { Rect } from '../app/camera';

/** Include the SVG's letterboxed area, where the drawing is also visible. */
export function visibleBox(view: Rect, width: number, height: number): Rect {
  const scale = Math.min(
    width / (view.maxX - view.minX),
    height / (view.maxY - view.minY),
  );
  const extraX = (width / scale - (view.maxX - view.minX)) / 2;
  const extraY = (height / scale - (view.maxY - view.minY)) / 2;
  return {
    minX: view.minX - extraX,
    maxX: view.maxX + extraX,
    minY: view.minY - extraY,
    maxY: view.maxY + extraY,
  };
}

export function geometryVisible(geometry: Geometry, box: Rect): boolean {
  const corners = [
    { x: box.minX, y: box.minY },
    { x: box.maxX, y: box.minY },
    { x: box.maxX, y: box.maxY },
    { x: box.minX, y: box.maxY },
  ];
  const inside = (p: Vec) =>
    p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
  const crosses = (a: Vec, direction: Vec, segment: boolean) => {
    let low = segment ? 0 : -Infinity;
    let high = segment ? 1 : Infinity;
    for (const [position, delta, min, max] of [
      [a.x, direction.x, box.minX, box.maxX],
      [a.y, direction.y, box.minY, box.maxY],
    ] as const) {
      if (Math.abs(delta) < 1e-12) {
        if (position < min || position > max) return false;
        continue;
      }
      const left = (min - position) / delta;
      const right = (max - position) / delta;
      low = Math.max(low, Math.min(left, right));
      high = Math.min(high, Math.max(left, right));
      if (low > high) return false;
    }
    return true;
  };
  if (geometry.kind === 'point') return inside(geometry.at);
  if (geometry.kind === 'line')
    return crosses(geometry.line.point, geometry.line.dir, false);
  if (geometry.kind === 'polygon')
    return geometry.vertices.some((a, i) => {
      const b = geometry.vertices[(i + 1) % geometry.vertices.length];
      return b ? crosses(a, { x: b.x - a.x, y: b.y - a.y }, true) : false;
    });
  if (geometry.kind === 'circle') {
    const { centre, radius } = geometry.circle;
    const nearest = Math.hypot(
      centre.x - Math.max(box.minX, Math.min(box.maxX, centre.x)),
      centre.y - Math.max(box.minY, Math.min(box.maxY, centre.y)),
    );
    const farthest = Math.max(
      ...corners.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y)),
    );
    return nearest <= radius && farthest >= radius;
  }
  return false;
}

import {
  cross,
  segment,
  pointInPolygon,
  sub,
  type Geometry,
} from '@tastir/engine';
import type { Model } from '../app/model';
import type { Rect } from '../app/camera';
import { geometryVisible } from './visibility';

export const repeatTargetId = (piece: number, i: number, j: number) =>
  `piece${piece}@${i},${j}`;

/** Enumerate the actual visible placements, with bounded work even at extreme zoom. */
export function repeatTargets(model: Model, box: Rect) {
  const { cell, pieces } = model.pattern;
  const det = cross(cell.u, cell.v);
  const coords = [
    { x: box.minX, y: box.minY },
    { x: box.maxX, y: box.minY },
    { x: box.maxX, y: box.maxY },
    { x: box.minX, y: box.maxY },
  ].map((p) => {
    const d = sub(p, cell.origin);
    return { i: cross(d, cell.v) / det, j: cross(cell.u, d) / det };
  });
  const lowI = Math.floor(Math.min(...coords.map((p) => p.i))) - 2;
  const highI = Math.ceil(Math.max(...coords.map((p) => p.i))) + 2;
  const lowJ = Math.floor(Math.min(...coords.map((p) => p.j))) - 2;
  const highJ = Math.ceil(Math.max(...coords.map((p) => p.j))) + 2;
  if ((highI - lowI + 1) * (highJ - lowJ + 1) * pieces.length > 25_000)
    throw new Error('Zoom in before sending this repeated wall.');
  const targets: {
    id: string;
    kind: 'polygon';
    geometry: Geometry & { typeId: string };
  }[] = [];
  for (let i = lowI; i <= highI; i++)
    for (let j = lowJ; j <= highJ; j++) {
      for (const [index, piece] of pieces.entries()) {
        const vertices = piece.polygon.map((p) => ({
          x: p.x + cell.u.x * i + cell.v.x * j,
          y: p.y + cell.u.y * i + cell.v.y * j,
        }));
        if (
          Math.max(...vertices.map((p) => p.x)) < box.minX ||
          Math.min(...vertices.map((p) => p.x)) > box.maxX ||
          Math.max(...vertices.map((p) => p.y)) < box.minY ||
          Math.min(...vertices.map((p) => p.y)) > box.maxY
        )
          continue;
        const geometry: Geometry & { typeId: string } = {
          kind: 'polygon',
          vertices,
          sides: vertices.map((p, k) =>
            segment(p, vertices[(k + 1) % vertices.length]!),
          ),
          typeId: model.pattern.types[piece.type]!.name!,
        };
        if (
          !geometryVisible(geometry, box) &&
          !pointInPolygon({ x: box.minX, y: box.minY }, vertices)
        )
          continue;
        targets.push({
          id: repeatTargetId(index, i, j),
          kind: 'polygon',
          geometry,
        });
      }
    }
  if (targets.length > 5000)
    throw new Error('Zoom in before sending this repeated wall.');
  return targets;
}

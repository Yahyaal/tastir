import { arrangement, signedArea } from './arrangement.js';
import { segment } from './shapes.js';
import { tolerance } from './tolerance.js';
import { vec, type Vec } from './vec.js';

const tol = tolerance(1);

/** The closed outline through the corners, as segments. */
const outline = (...pts: Vec[]) =>
  pts.map((p, i) => segment(p, pts[(i + 1) % pts.length] as Vec));
const areas = (faces: Vec[][]) =>
  faces
    .map(signedArea)
    .map((a) => Number(a.toFixed(6)))
    .sort();

describe('arrangement', () => {
  it('finds the one face of a square, counter-clockwise', () => {
    const faces = arrangement(
      outline(vec(0, 0), vec(1, 0), vec(1, 1), vec(0, 1)),
      tol,
    );
    expect(areas(faces)).toEqual([1]);
  });

  it('splits two crossing squares into their nine pieces', () => {
    // Overlapping squares [0,2]² and [1,3]²: three regions, and the
    // crossings split the edges.
    const faces = arrangement(
      [
        ...outline(vec(0, 0), vec(2, 0), vec(2, 2), vec(0, 2)),
        ...outline(vec(1, 1), vec(3, 1), vec(3, 3), vec(1, 3)),
      ],
      tol,
    );
    expect(areas(faces)).toEqual([1, 3, 3]);
  });

  it('drops dangling ends, so no stub is left inside a piece', () => {
    const faces = arrangement(
      [
        ...outline(vec(0, 0), vec(2, 0), vec(2, 2), vec(0, 2)),
        segment(vec(1, 0), vec(1, 1)),
        segment(vec(2, 1), vec(3, 1)),
      ],
      tol,
    );
    expect(faces).toHaveLength(1);
    // Both stubs are gone; their feet stay as straight-through corners.
    const corners = (faces[0] ?? []).map((p) => `${p.x},${p.y}`).sort();
    expect(corners).toEqual(['0,0', '0,2', '1,0', '2,0', '2,1', '2,2']);
  });

  it('splits edges that lie along each other (tiles touching along an edge)', () => {
    const faces = arrangement(
      [
        ...outline(vec(0, 0), vec(1, 0), vec(1, 1), vec(0, 1)),
        ...outline(vec(1, 0.5), vec(2, 0.5), vec(2, 1.5), vec(1, 1.5)),
      ],
      tol,
    );
    expect(areas(faces)).toEqual([1, 1]);
  });

  it('counts duplicate segments once', () => {
    const square = outline(vec(0, 0), vec(1, 0), vec(1, 1), vec(0, 1));
    expect(areas(arrangement([...square, ...square], tol))).toEqual([1]);
  });
});

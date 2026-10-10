import { BoxIndex, type Box } from './boxIndex.js';

it('returns exactly the padded box overlaps, including zero-width and long boxes', () => {
  const boxes: Box[] = Array.from({ length: 400 }, (_, i) => {
    const x = ((i * 71) % 97) / 7 - 6;
    const y = ((i * 43) % 89) / 11 - 4;
    return {
      minX: x,
      maxX: x + (i % 8 ? 0 : 100),
      minY: y,
      maxY: y + (i % 5 ? 0.3 : 0),
    };
  });
  boxes.push(
    ...Array.from({ length: 40 }, () => ({
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    })),
  );
  const index = new BoxIndex(boxes);
  for (const pad of [0, 1e-9, 0.25]) {
    for (let i = 0; i < boxes.length; i++) {
      const a = boxes[i] as Box;
      const expected = boxes.flatMap((b, j) =>
        j > i &&
        b.minX <= a.maxX + pad &&
        b.maxX >= a.minX - pad &&
        b.minY <= a.maxY + pad &&
        b.maxY >= a.minY - pad
          ? [j]
          : [],
      );
      expect(index.query(a, pad, i).sort((a, b) => a - b)).toEqual(expected);
    }
  }
  expect(new BoxIndex([]).query(boxes[0] as Box, 0)).toEqual([]);
});

import { geometryVisible, visibleBox } from './visibility';

const box = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
describe('the visible observation', () => {
  it('includes geometry in the letterboxed part of the board', () => {
    expect(visibleBox(box, 800, 400)).toEqual({
      minX: -2,
      maxX: 2,
      minY: -1,
      maxY: 1,
    });
  });
  it('omits points and circles outside the visible board', () => {
    expect(geometryVisible({ kind: 'point', at: { x: 0, y: 0 } }, box)).toBe(
      true,
    );
    expect(geometryVisible({ kind: 'point', at: { x: 2, y: 0 } }, box)).toBe(
      false,
    );
    expect(
      geometryVisible(
        {
          kind: 'circle',
          circle: { kind: 'circle', centre: { x: 0, y: 0 }, radius: 10 },
        },
        box,
      ),
    ).toBe(false);
    expect(
      geometryVisible(
        {
          kind: 'circle',
          circle: { kind: 'circle', centre: { x: 0, y: 0 }, radius: 1 },
        },
        box,
      ),
    ).toBe(true);
  });
  it('checks lines and polygon edges instead of assuming every named object is visible', () => {
    expect(
      geometryVisible(
        {
          kind: 'line',
          line: { kind: 'line', point: { x: 0, y: 2 }, dir: { x: 1, y: 0 } },
        },
        box,
      ),
    ).toBe(false);
    expect(
      geometryVisible(
        {
          kind: 'line',
          line: { kind: 'line', point: { x: 0, y: 0 }, dir: { x: 1, y: 0 } },
        },
        box,
      ),
    ).toBe(true);
    expect(
      geometryVisible(
        {
          kind: 'polygon',
          vertices: [
            { x: -10, y: -10 },
            { x: 10, y: -10 },
            { x: 10, y: 10 },
            { x: -10, y: 10 },
          ],
          sides: [],
        },
        box,
      ),
    ).toBe(false);
  });
});

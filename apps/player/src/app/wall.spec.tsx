import { fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import zellige from '@tutorials/eight-fold-zellige.json';
import filled from '@tutorials/kurt-eight-fold-zellige-filled.json';
import { colorRepeat, placeFills } from './placement';
import { tutorialColoring } from './coloring';
import { Play } from './app';
import { pieceColors } from './coloring';
import { loadModel } from './model';
import { Wall } from './Wall';
import { DEFAULT_PEN, PAPER } from './pen';

type P = { x: number; y: number };
const parse = (s: string | null): P[] =>
  (s ?? '')
    .trim()
    .split(/\s+/)
    .map((xy) => {
      const [x, y] = xy.split(',').map(Number);
      return { x: x as number, y: y as number };
    });
const area = (ps: P[]) =>
  Math.abs(
    ps.reduce((s, p, i) => {
      const q = ps[(i + 1) % ps.length] as P;
      return s + p.x * q.y - q.x * p.y;
    }, 0),
  ) / 2;
/** The part of the polygon on the side of the box edge where `side` ≥ 0. */
function clipSide(ps: P[], side: (p: P) => number): P[] {
  const out: P[] = [];
  ps.forEach((p, i) => {
    const q = ps[(i + 1) % ps.length] as P;
    const a = side(p);
    const b = side(q);
    if (a >= 0) out.push(p);
    if (a >= 0 !== b >= 0) {
      const t = a / (a - b);
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  });
  return out;
}

/** The polygon clipped to the box [0, w] × [0, h] (Sutherland–Hodgman). */
const clip = (ps: P[], w: number, h: number): P[] =>
  [(p: P) => p.x, (p: P) => w - p.x, (p: P) => p.y, (p: P) => h - p.y].reduce(
    clipSide,
    ps,
  );

describe.each([
  ['the star and cross', example],
  ['the eight-fold rosette', zellige],
  ['the filled zellige wheel', filled],
])('the wall tile for %s', (_, json) => {
  const model = loadModel(json);

  it('holds every piece that reaches into the tile, covering it exactly once', () => {
    const { container } = render(
      <Wall
        model={model}
        colors={pieceColors(model)}
        repeat={colorRepeat(model)}
        fill={placeFills(model, tutorialColoring(model))}
      />,
    );
    const pattern = container.querySelector('pattern') as SVGPatternElement;
    const w = Number(pattern.getAttribute('width'));
    const h = Number(pattern.getAttribute('height'));
    const covered = [...pattern.querySelectorAll('polygon.wall-piece')]
      .map((p) => area(clip(parse(p.getAttribute('points')), w, h)))
      .reduce((s, a) => s + a, 0);
    expect(covered).toBeCloseTo(w * h, 9);
    // Off-tile copies used to multiply the cost of every hover and pan.
    const polygons = [...pattern.querySelectorAll('polygon.wall-piece')];
    if (json === filled) expect(polygons.length).toBeLessThan(600);
    for (const polygon of polygons) {
      const corners = parse(polygon.getAttribute('points'));
      const margin = Number(polygon.getAttribute('stroke-width'));
      expect(corners.some((p) => p.x >= -margin)).toBe(true);
      expect(corners.some((p) => p.x <= w + margin)).toBe(true);
      expect(corners.some((p) => p.y >= -margin)).toBe(true);
      expect(corners.some((p) => p.y <= h + margin)).toBe(true);
    }
  });
});

describe('the wall', () => {
  const model = loadModel(example);
  const colors = pieceColors(model);

  it('fills one rectangle with the tile, so it never ends', () => {
    const { container } = render(<Wall model={model} colors={colors} />);
    const rect = container.querySelector('svg.wall > rect');
    expect(rect?.getAttribute('fill')).toMatch(/^url\(#wall-/);
  });

  it('draws tiles with grout, strapwork with bands, and lines on paper', () => {
    const tiles = render(
      <Wall model={model} colors={colors} look="tiles" grout={2} />,
    );
    const piece = tiles.container.querySelector(
      'polygon.wall-piece[data-type="0"]',
    );
    expect(piece?.getAttribute('fill')).toBe(colors[0]);
    expect(Number(piece?.getAttribute('stroke-width'))).toBeCloseTo(0.024, 9);
    tiles.unmount();

    const straps = render(
      <Wall model={model} colors={colors} look="strapwork" />,
    );
    // Every band line (16 per tile, with the neighbours' copies) in one path.
    expect(
      straps.container
        .querySelector('.band-out path')
        ?.getAttribute('d')
        ?.split('M').length,
    ).toBe(9 * 16 + 1);
    expect(
      straps.container
        .querySelector('polygon.wall-piece')
        ?.getAttribute('stroke'),
    ).toBe('none');
    straps.unmount();

    // Lines wash the pieces with their colours on paper by default, in a
    // tile of their own laid through a paint texture over the whole wall.
    const lines = render(<Wall model={model} colors={colors} look="lines" />);
    expect(
      lines.container.querySelector('svg.wall > rect')?.getAttribute('fill'),
    ).toBe(PAPER);
    const washed = lines.container.querySelector(
      'pattern[id^="wash-"] polygon.wall-piece[data-type="0"]',
    );
    expect(washed?.getAttribute('fill')).toBe(colors[0]);
    expect(washed?.getAttribute('fill-opacity')).toBe('0.82');
    expect(
      lines.container.querySelector('g.wash')?.getAttribute('filter'),
    ).toMatch(/^url\(#.*-wash\)$/);
    lines.unmount();

    const bare = render(
      <Wall
        model={model}
        colors={colors}
        look="lines"
        pen={{ ...DEFAULT_PEN, wash: false }}
      />,
    );
    expect(
      bare.container.querySelector('polygon.wall-piece')?.getAttribute('fill'),
    ).toBe('none');
    bare.unmount();
  });

  it('draws a double line as ink with paper between, woven over and under', () => {
    const { container } = render(
      <Wall
        model={model}
        colors={colors}
        look="lines"
        pen={{ pen: 'double', wash: true, ink: '#6b4226' }}
      />,
    );
    const [outer, inner] = [...container.querySelectorAll('path.pen-double')];
    expect(outer?.getAttribute('stroke')).toBe('#6b4226');
    expect(inner?.getAttribute('stroke')).toBe(PAPER);
    expect(Number(outer?.getAttribute('stroke-width'))).toBeGreaterThan(
      Number(inner?.getAttribute('stroke-width')),
    );
    // At each crossing the top band is drawn again over a shadow.
    expect(container.querySelector('path.over-shadow')).not.toBeNull();
    expect(
      container.querySelector('path.over-out')?.getAttribute('stroke'),
    ).toBe('#6b4226');
    expect(
      container.querySelector('path.over-in')?.getAttribute('stroke'),
    ).toBe(PAPER);
  });

  it('weaves the bands for interlace: the top band drawn again at each crossing', () => {
    const { container } = render(
      <Wall model={model} colors={colors} look="interlace" />,
    );
    // The bands as strapwork draws them…
    expect(
      container.querySelector('.band-out path')?.getAttribute('d')?.split('M')
        .length,
    ).toBe(9 * 16 + 1);
    // …and a piece of top band at each of the tile's two crossings, in
    // the tile and its neighbours, edges and middle, with square ends.
    for (const layer of ['out', 'in']) {
      const over = container.querySelector(`path.over-${layer}`);
      expect(over?.getAttribute('d')?.split('M').length).toBe(9 * 2 + 1);
      expect(over?.getAttribute('stroke-linecap')).toBe('butt');
    }
    // Each piece lies on the bands it is redrawing, in the copy of the
    // tile it belongs to (not slid a second time).
    const pairs = (d: string) =>
      d
        .split('M')
        .filter(Boolean)
        .map((run) =>
          run.split('L').map((q) => {
            const [x, y] = q.trim().split(/\s+/).map(Number);
            return { x: x as number, y: y as number };
          }),
        );
    const bands = pairs(
      container.querySelector('.band-out path')?.getAttribute('d') ?? '',
    );
    const onBand = (q: { x: number; y: number }) =>
      bands.some(([a, b]) => {
        if (!a || !b) return false;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const t = ((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy);
        const gap = Math.abs((q.x - a.x) * dy - (q.y - a.y) * dx);
        return t > -1e-6 && t < 1 + 1e-6 && gap / Math.hypot(dx, dy) < 1e-6;
      });
    const patches = pairs(
      container.querySelector('path.over-out')?.getAttribute('d') ?? '',
    );
    expect(patches.length).toBe(9 * 2);
    for (const run of patches)
      // Its inner points (the crossing among them); its ends may reach
      // a little into a copy of the tile the test does not draw.
      for (const q of run.slice(1, -1)) expect(onBand(q)).toBe(true);
    expect(
      container
        .querySelector('svg.wall')
        ?.classList.contains('style-interlace'),
    ).toBe(true);
  });

  it('pans when dragged and zooms with the wheel', () => {
    const { container } = render(<Wall model={model} colors={colors} />);
    const svg = container.querySelector('svg.wall') as SVGSVGElement;
    const box = () =>
      (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
    const [x0, , w0] = box();
    fireEvent.pointerDown(svg, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(svg, { clientX: 400, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(svg, { pointerId: 1 });
    expect(box()[0]).toBeLessThan(x0 as number);
    fireEvent.wheel(svg, { deltaY: -300 });
    expect(box()[2]).toBeLessThan(w0 as number);
  });
});

describe('the wall controls', () => {
  it('switch the style and grout in the player', () => {
    render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    for (let i = 0; i < 8; i++)
      fireEvent.click(
        screen.getByRole('button', { name: /^(Next|Repeat it)$/ }),
      );
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Style' })).getByRole('button', {
        name: 'Lines',
      }),
    );
    expect(
      document.querySelector('svg.wall')?.classList.contains('style-lines'),
    ).toBe(true);
    const width = () =>
      Number(
        document
          .querySelector('polygon.wall-piece')
          ?.getAttribute('stroke-width'),
      );
    const before = width();
    fireEvent.change(screen.getByLabelText('Line width'), {
      target: { value: '0.5' },
    });
    expect(width()).toBeCloseTo(before / 2, 9);
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Style' })).getByRole('button', {
        name: 'Jali',
      }),
    );
    expect(
      document.querySelector('svg.wall')?.classList.contains('style-jali'),
    ).toBe(true);
    expect((screen.getByLabelText('Lattice') as HTMLInputElement).value).toBe(
      '0.5',
    );
    expect(screen.queryByRole('heading', { name: 'Colors' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Lattice'), {
      target: { value: '2' },
    });
    expect(
      Number(
        document
          .querySelector('[data-layer="stone"]')
          ?.getAttribute('stroke-width'),
      ),
    ).toBeCloseTo(0.024 * 5.4, 9);
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Style' })).getByRole('button', {
        name: 'Tiles',
      }),
    );
    expect(screen.getByRole('heading', { name: 'Colors' })).toBeTruthy();
  });
});

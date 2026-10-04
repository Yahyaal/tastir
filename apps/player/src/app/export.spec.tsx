import { fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import zellige from '@tutorials/eight-fold-zellige.json';
import { Play } from './app';
import { pieceColors } from './coloring';
import { wallSvg } from './exporting';
import { loadModel } from './model';

const parse = (svg: string) =>
  new DOMParser().parseFromString(svg, 'image/svg+xml');

describe.each([
  ['the star and cross', example],
  ['the eight-fold rosette', zellige],
])('the SVG of %s', (_, json) => {
  const model = loadModel(json);
  const colors = pieceColors(model);
  const doc = parse(wallSvg(model, colors, { across: 4, down: 4 }));
  const svg = doc.documentElement;

  it('is a standalone SVG document', () => {
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(svg.getAttribute('width')).toBe('800');
    // No class names or patterns: nothing depends on the app's styles.
    expect(svg.querySelectorAll('[class]')).toHaveLength(0);
    expect(svg.querySelectorAll('pattern')).toHaveLength(0);
    expect(svg.querySelector('title')?.textContent).toBe(model.tutorial.title);
  });

  it('shows the same pieces, in the same colors, as the screen', () => {
    const polygons = [...svg.querySelectorAll('polygon')];
    model.pattern.types.forEach((t, i) => {
      const ofType = polygons.filter(
        (p) => p.getAttribute('data-type') === String(i),
      );
      // At least every copy in the 16 tiles shown.
      expect(ofType.length).toBeGreaterThanOrEqual(16 * t.perCell);
      expect(new Set(ofType.map((p) => p.getAttribute('fill')))).toEqual(
        new Set([colors[i]]),
      );
    });
  });
});

describe('export in the player', () => {
  function atColor() {
    render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    for (let i = 0; i < 8; i++)
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  }

  it('downloads the colored wall as SVG, named after the tutorial', async () => {
    const blobs: Blob[] = [];
    const names: string[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => {
      blobs.push(b);
      return 'blob:x';
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        names.push(this.download);
      });
    atColor();
    fireEvent.click(screen.getByRole('button', { name: 'Recolor every star' }));
    fireEvent.click(screen.getByRole('button', { name: /third color/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Download SVG' }));
    expect(names).toEqual(['eight-fold-star-and-cross.svg']);
    expect(blobs[0]?.type).toBe('image/svg+xml');
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blobs[0] as Blob);
    });
    expect(text).toContain('fill="#c9a227"');
    click.mockRestore();
  });

  it('prints a line sheet with the title and the chosen paper', () => {
    const print = vi.fn();
    window.print = print;
    vi.useFakeTimers();
    atColor();
    fireEvent.change(screen.getByLabelText('Paper'), {
      target: { value: 'Letter' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Print line sheet' }));
    const sheet = document.querySelector('.print-sheet');
    expect(sheet?.classList.contains('paper-Letter')).toBe(true);
    expect(sheet?.querySelector('h1')?.textContent).toBe(
      'Eight-fold star and cross',
    );
    expect(sheet?.querySelector('style')?.textContent).toContain(
      'size: letter',
    );
    expect(sheet?.querySelector('svg polygon')?.getAttribute('fill')).toBe(
      'none',
    );
    vi.runAllTimers();
    expect(print).toHaveBeenCalled();
    window.dispatchEvent(new Event('afterprint'));
    vi.useRealTimers();
  });
});

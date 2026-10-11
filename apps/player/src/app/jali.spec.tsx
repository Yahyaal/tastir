import { render } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import zellige from '@tutorials/eight-fold-zellige.json';
import { pieceColors } from './coloring';
import { Thumbnail } from './drawing';
import { wallSvg } from './exporting';
import { loadModel } from './model';
import { Wall } from './Wall';
import { DEFAULT_JALI, JALI_MATERIALS } from './jali';

describe.each([example, zellige])('Jali: $id', (json) => {
  const model = loadModel(json);
  const colors = pieceColors(model);

  it.each([0, 0.5, 1, 3])(
    'keeps clear apertures and matching wall, preview and export at width %s',
    (grout) => {
      const { container } = render(
        <>
          <Wall
            model={model}
            colors={colors}
            look="jali"
            grout={grout}
            enter
            hovered={0}
          />
          <Thumbnail model={model} look="jali" grout={grout} />
        </>,
      );
      const exported = new DOMParser().parseFromString(
        wallSvg(model, colors, { look: 'jali', grout }),
        'image/svg+xml',
      );
      expect(exported.querySelector('parsererror')).toBeNull();
      const wall = container.querySelector('svg.wall')!;
      const preview = container.querySelector('svg.thumbnail')!;
      expect(wall.querySelectorAll('polygon')).toHaveLength(0);
      // Neither preview nor export can cover an aperture with a palette fill.
      expect(preview.querySelectorAll('.piece')).toHaveLength(0);
      expect(exported.querySelectorAll('polygon')).toHaveLength(0);
      expect(wall.querySelector('.color-veil')).toBeNull();
      const layers = [...wall.querySelectorAll('.jali-framework path')];
      expect(layers).toHaveLength(4);
      expect(new Set(layers.map((p) => p.getAttribute('d'))).size).toBe(1);
      expect(layers[0]?.getAttribute('d')).toContain('M');
      for (const target of [preview, exported.documentElement]) {
        for (const layer of layers) {
          const other = target.querySelector(
            `[data-layer="${layer.getAttribute('data-layer')}"]`,
          )!;
          expect(other).not.toBeNull();
          expect(other.getAttribute('stroke')).toBe(
            layer.getAttribute('stroke'),
          );
          expect(Number(other.getAttribute('stroke-width'))).toBeCloseTo(
            Number(layer.getAttribute('stroke-width')),
            5,
          );
          expect(Number(other.getAttribute('stroke-width'))).toBeGreaterThan(0);
        }
        expect(
          [...target.querySelectorAll('stop')].map((s) =>
            s.getAttribute('stop-color'),
          ),
        ).toEqual(
          [...wall.querySelectorAll('stop')].map((s) =>
            s.getAttribute('stop-color'),
          ),
        );
        expect(target.querySelector('filter')).toBeNull();
      }
      // The ground is painted once behind the repeating screen, not in each tile.
      expect(wall.querySelector('pattern .jali-ground')).toBeNull();
      expect(wall.querySelectorAll('.jali-ground')).toHaveLength(1);
    },
  );

  it.each(JALI_MATERIALS)(
    'matches custom $material finishes in wall, preview and SVG',
    ({ material }) => {
      const jali = {
        ...DEFAULT_JALI,
        material,
        framework: '#864b31',
        background: '#234a79',
      };
      const { container } = render(
        <>
          <Wall model={model} colors={colors} look="jali" jali={jali} />
          <Thumbnail model={model} look="jali" jali={jali} />
        </>,
      );
      const exported = new DOMParser().parseFromString(
        wallSvg(model, colors, { look: 'jali', jali }),
        'image/svg+xml',
      );
      expect(exported.querySelector('parsererror')).toBeNull();
      const wall = container.querySelector('svg.wall')!;
      for (const target of [
        container.querySelector('svg.thumbnail')!,
        exported.documentElement,
      ]) {
        expect(
          target
            .querySelector('.jali-framework')
            ?.getAttribute('data-material'),
        ).toBe(material);
        expect(target.querySelectorAll('polygon, filter')).toHaveLength(0);
        for (const layer of wall.querySelectorAll('.jali-framework path')) {
          const other = target.querySelector(
            `[data-layer="${layer.getAttribute('data-layer')}"]`,
          )!;
          expect(other).not.toBeNull();
          for (const attribute of ['stroke'])
            expect(other.getAttribute(attribute)).toBe(
              layer.getAttribute(attribute),
            );
          const dash = layer.getAttribute('stroke-dasharray');
          if (dash) {
            const exportedDash = other
              .getAttribute('stroke-dasharray')!
              .split(' ')
              .map(Number);
            dash
              .split(' ')
              .map(Number)
              .forEach((n, i) => expect(exportedDash[i]).toBeCloseTo(n, 5));
          } else expect(other.getAttribute('stroke-dasharray')).toBeNull();
          expect(Number(other.getAttribute('stroke-width'))).toBeCloseTo(
            Number(layer.getAttribute('stroke-width')),
            5,
          );
        }
        expect(
          [...target.querySelectorAll('stop')].map((s) =>
            s.getAttribute('stop-color'),
          ),
        ).toEqual(
          [...wall.querySelectorAll('stop')].map((s) =>
            s.getAttribute('stop-color'),
          ),
        );
        expect(
          target
            .querySelector('stop[offset="48%"]')
            ?.getAttribute('stop-color'),
        ).toBe('#234a79');
      }
      expect(
        wall
          .querySelector(`[data-layer="${material}"]`)
          ?.getAttribute('stroke'),
      ).toBe('#864b31');
      expect(wall.querySelectorAll('[stroke-dasharray]')).toHaveLength(
        material === 'wood' ? 2 : 0,
      );
      expect(wall.querySelector('[data-layer="gleam"]') !== null).toBe(
        material === 'gold' || material === 'silver',
      );
    },
  );

  it('gives separate walls and previews independent lighting references', () => {
    const { container } = render(
      <>
        <Wall model={model} colors={colors} look="jali" />
        <Wall model={model} colors={colors} look="jali" />
        <Thumbnail model={model} look="jali" />
        <Thumbnail model={model} look="jali" />
      </>,
    );
    const ids = [...container.querySelectorAll('linearGradient')].map(
      (g) => g.id,
    );
    expect(new Set(ids).size).toBe(4);
    for (const id of ids)
      expect(container.querySelector(`[fill="url(#${id})"]`)).not.toBeNull();
  });
});

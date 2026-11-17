import { describe, expect, it } from 'vitest';
import museum from '@tutorials/museum-divided-stars.json';
import example from '@tutorials/eight-fold-star-and-cross.json';
import shafai from '@tutorials/shafai-248-rosettes.json';
import { alternationOf } from '@tastir/project-core/alternate';
import { loadModel } from './model';
import {
  finishOf,
  lightness,
  paletteNames,
  tutorialColoring,
} from './coloring';
import { byPlace, placeFills, secondShade } from './placement';

describe('copies of one shape take turns in two shades (STYLE.2)', () => {
  it('shades a dark colour lighter and a light colour darker', () => {
    expect(lightness(secondShade('#1d5c7c'))).toBeGreaterThan(
      lightness('#1d5c7c'),
    );
    expect(lightness(secondShade('#f7f2e6'))).toBeLessThan(
      lightness('#f7f2e6'),
    );
  });

  it('gives touching copies of a shape different shades', () => {
    const model = loadModel(museum);
    const turns = alternationOf(model.pattern);
    expect(turns).toBeDefined();
    expect(byPlace(model)).toBe(true);
    const fill = placeFills(model, tutorialColoring(model));
    const seen = new Set<string>();
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++)
        model.pattern.pieces.forEach((_, k) => seen.add(fill(k, i, j)));
    // More fills than shapes: some copies took the second shade.
    expect(seen.size).toBeGreaterThan(model.pattern.types.length);
  });

  it('leaves a pattern whose copies never touch as it was', () => {
    expect(alternationOf(loadModel(example).pattern)).toBeUndefined();
  });
});

describe('a palette of the design’s own (PAL.1)', () => {
  const model = loadModel(shafai);
  it('is offered first and opens by default', () => {
    expect(paletteNames(model)[0]).toBe('Violet and green');
    expect(tutorialColoring(model).palette).toBe('Violet and green');
    expect(paletteNames(model)).toContain('Marinid zellige');
  });

  it('gives its own second shades to copies that take turns', () => {
    const fill = placeFills(model, tutorialColoring(model));
    const seen = new Set<string>();
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++)
        model.pattern.pieces.forEach((_, k) => seen.add(fill(k, i, j)));
    expect(seen.has('#22ccff')).toBe(true);
    expect(finishOf(model, tutorialColoring(model)).lines).toBe('#111111');
  });
});

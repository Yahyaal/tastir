import { readFileSync } from 'node:fs';
import { safeParseTutorial } from './parse.js';

const squares = JSON.parse(
  readFileSync(
    new URL(
      '../../../../tutorials/alhambra-arrayanes-squares.json',
      import.meta.url,
    ),
    'utf8',
  ),
);

describe('ink parts', () => {
  it('cover the ink paths in order, each part the next few', () => {
    expect(safeParseTutorial(squares).success).toBe(true);
  });

  it('must cover every path exactly once', () => {
    const parts = squares.ink.parts as { text: string; paths: number }[];
    for (const wrong of [
      parts.slice(1),
      [...parts, { text: 'Ink one more line.', paths: 1 }],
      [{ text: 'Ink it all.', paths: squares.ink.paths.length }],
    ]) {
      const tutorial = { ...squares, ink: { ...squares.ink, parts: wrong } };
      expect(safeParseTutorial(tutorial).success).toBe(false);
    }
  });
});

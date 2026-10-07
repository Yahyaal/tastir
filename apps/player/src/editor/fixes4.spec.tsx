import { act, render, screen } from '@testing-library/react';
import bouInania from '@tutorials/bou-inania-rosette.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { copyUpTo } from './document';
import { addPattern } from './patterns';

afterEach(() => {
  window.location.hash = '';
});

describe('the fixes from the phase 4 report', () => {
  it('tells the panel and the tile apart in plain words', () => {
    const t = parseTutorial(bouInania);
    const p = addPattern(copyUpTo(t, t.steps.length));
    act(() => {
      window.location.hash = `#/edit/${p?.id}`;
    });
    render(<App entries={[]} />);
    const labels = screen
      .getAllByRole('button', { name: /as the tile/ })
      .map((b) => b.textContent);
    expect(labels.sort()).toEqual([
      'Use the larger square as the tile',
      'Use the smaller square as the tile',
    ]);
  });
});

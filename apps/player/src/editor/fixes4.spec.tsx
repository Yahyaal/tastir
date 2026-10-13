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
    // A second, smaller square beside the tile: the tile as it was once,
    // with the band on two sides only.
    const parsed = parseTutorial(bouInania);
    const t = {
      ...parsed,
      steps: parsed.steps.map((s) =>
        s.id === 14
          ? {
              ...s,
              create: {
                K21: { point: { meet: ['r45', 'E'] } },
                M1460: { point: { meet: ['r45', 'F@2'] } },
                old: { polygon: ['K21', 'K16', 'M1460', 'K19'] },
                ...s.create,
              },
            }
          : s,
      ),
    } as typeof parsed;
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

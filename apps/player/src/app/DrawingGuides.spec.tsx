import { render, screen } from '@testing-library/react';
import { parseTutorial } from '@tastir/schema';
import bou from '@tutorials/bou-inania-rosette.json';
import hex from '@tutorials/mian-stellated-hex.json';
import drawing from '@tutorials/alhambra-arrayanes-squares.json';
import { DrawingGuides, stepRanges } from './DrawingGuides';

it('offers the actual source and its limited step coverage without mixing in photographs', () => {
  render(<DrawingGuides tutorial={parseTutorial(bou)} />);
  expect(
    screen.getByRole('heading', { name: 'Compare with the source tutorial' }),
  ).toBeTruthy();
  const link = screen.getByRole('link', { name: /activity 2/ });
  expect(link.getAttribute('href')).toBe(
    'https://www.youtube.com/watch?v=YcqakkAKvFI',
  );
  expect(link.getAttribute('target')).toBe('_blank');
  expect(screen.getByText('Video tutorial')).toBeTruthy();
  expect(screen.getByText('Used for app steps 5–6.')).toBeTruthy();
  expect(screen.getAllByRole('link')).toHaveLength(1);
});

it('identifies a challenge with hints without presenting it as a complete numbered tutorial', () => {
  render(<DrawingGuides tutorial={parseTutorial(hex)} />);
  expect(
    screen.getByRole('heading', { name: 'Drawing challenge and hints' }),
  ).toBeTruthy();
  expect(screen.getByText('Challenge with hints')).toBeTruthy();
  expect(
    screen.getByText(/rather than a complete numbered tutorial/),
  ).toBeTruthy();
});

it('does not invent teaching instructions for a reconstructed drawing', () => {
  const { container } = render(
    <DrawingGuides tutorial={parseTutorial(drawing)} />,
  );
  expect(container.textContent).toBe('');
});

it('formats actual app-step coverage without equating it to source step numbers', () => {
  expect(stepRanges([8, 4, 5, 6, 6, 10, 11])).toBe('4–6, 8, 10–11');
});

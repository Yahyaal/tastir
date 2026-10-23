import { fireEvent, render, screen } from '@testing-library/react';
import { parseTutorial } from '@tastir/schema';
import rosette from '@tutorials/bou-inania-rosette.json';
import { ConstructionSource } from './ConstructionSource';
import { copyUpTo } from '../editor/document';

it('shows the mixed origin, departures and actual source links without claiming historical verification', () => {
  const tutorial = parseTutorial(rosette);
  render(<ConstructionSource tutorial={tutorial} />);
  expect(screen.getByText('How this construction was made')).toBeTruthy();
  fireEvent.click(screen.getByText('How this construction was made'));
  expect(
    screen.getByText('Published instructions with our own additions'),
  ).toBeTruthy();
  expect(screen.getByText(/shield band is omitted/)).toBeTruthy();
  expect(
    screen
      .getByRole('link', { name: /Drawing of the Bou Inania pattern/ })
      .getAttribute('href'),
  ).toBe('https://www.instagram.com/aslam.geometricpatterns/');
  expect(screen.queryByText('Historical match verified')).toBeNull();
});

it('does not assign an audit verdict to an older or user-created tutorial', () => {
  const tutorial = parseTutorial(rosette);
  delete tutorial.construction;
  const { container } = render(<ConstructionSource tutorial={tutorial} />);
  expect(container.textContent).toBe('');
});

it('keeps source credits when copying a lesson without certifying the learner’s editable sequence', () => {
  const tutorial = parseTutorial(rosette);
  const copy = copyUpTo(tutorial, 6);
  expect(copy.construction).toBeUndefined();
  expect(copy.credits).toEqual(expect.arrayContaining(tutorial.credits));
});

it('supports closing with Escape and returns focus to the source button', () => {
  render(<ConstructionSource tutorial={parseTutorial(rosette)} />);
  const launch = screen.getByRole('button', {
    name: 'How this construction was made',
  });
  launch.focus();
  fireEvent.click(launch);
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Close' }),
  );
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(launch);
});

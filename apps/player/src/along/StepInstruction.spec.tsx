import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StepInstruction } from './StepInstruction';

afterEach(cleanup);

it('shows a keyboard-accessible scroll hint after the instruction overflows and on resize', () => {
  render(<StepInstruction head="Ink" text="A long instruction" />);
  const paragraph = screen.getByText('A long instruction');
  Object.defineProperties(paragraph, {
    clientHeight: { configurable: true, value: 60 },
    scrollHeight: { configurable: true, value: 120 },
  });
  fireEvent(window, new Event('resize'));
  expect(screen.getByText('Scroll for more ↓')).toBeTruthy();
  expect(paragraph.tabIndex).toBe(0);
  paragraph.scrollTop = 60;
  fireEvent.scroll(paragraph);
  expect(screen.getByText('Scroll up ↑')).toBeTruthy();
  Object.defineProperty(paragraph, 'clientHeight', { value: 120 });
  fireEvent(window, new Event('resize'));
  expect(screen.queryByText('Scroll up ↑')).toBeNull();
  expect(paragraph.hasAttribute('tabindex')).toBe(false);
});

it('starts a changed instruction at its first line', () => {
  const view = render(
    <StepInstruction head="Step 1" text="First instruction" />,
  );
  const paragraph = screen.getByText('First instruction');
  paragraph.scrollTop = 60;
  view.rerender(<StepInstruction head="Step 2" text="Next instruction" />);
  expect(screen.getByText('Next instruction').scrollTop).toBe(0);
});

import { fireEvent, render, screen } from '@testing-library/react';
import { FeedbackButton } from './FeedbackButton';
import { basicFeedbackContext } from './client';

it('keeps the form available for development review without a configured backend', () => {
  const fetcher = vi
    .fn()
    .mockRejectedValue(new Error('No development backend'));
  vi.stubGlobal('fetch', fetcher);
  const opened = vi.fn();
  window.addEventListener('tastir-feedback', opened);
  try {
    render(
      <FeedbackButton
        context={basicFeedbackContext('test', 'Test pattern', 'draw')}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Report an issue or leave feedback' }),
    );
    expect(opened).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener('tastir-feedback', opened);
    vi.unstubAllGlobals();
  }
});

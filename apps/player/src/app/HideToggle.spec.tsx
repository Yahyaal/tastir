import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HideToggle } from './HideToggle';

afterEach(() => vi.unstubAllGlobals());
it('shows an icon, prevents duplicate saves, and retains the current visibility on a failed save', async () => {
  let finish: (value: Response) => void = () => undefined;
  const fetch = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal('fetch', fetch);
  render(<HideToggle id="eight-fold-star-and-cross" />);
  const button = screen.getByRole('button', { name: 'Hide from the library' });
  expect(button.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  fireEvent.click(button);
  fireEvent.click(button);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(button).toHaveProperty('disabled', true);
  finish({ ok: true } as Response);
  await screen.findByRole('button', { name: 'Show in the library' });
  fireEvent.click(screen.getByRole('button', { name: 'Show in the library' }));
  finish({ ok: false, text: async () => 'failed' } as Response);
  await screen.findByRole('alert');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Show in the library' }),
    ).toHaveProperty('disabled', false),
  );
});

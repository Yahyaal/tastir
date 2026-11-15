import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react';
import { InkOverlay } from './InkOverlay';
import { LIBRARY } from '../app/library';
import type { OverlayReply } from './inkComparison.worker';

class ComparisonWorker {
  static jobs: ComparisonWorker[] = [];
  onmessage?: (event: MessageEvent<OverlayReply>) => void;
  onerror?: () => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    ComparisonWorker.jobs.push(this);
  }
}
beforeEach(() => {
  ComparisonWorker.jobs = [];
  vi.stubGlobal('Worker', ComparisonWorker);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('runs selected tutorials off-thread and cancels a pending comparison when the selection changes', async () => {
  render(<InkOverlay />);
  fireEvent.click(screen.getByRole('button', { name: 'Compare ink' }));
  await waitFor(() => expect(ComparisonWorker.jobs).toHaveLength(1));
  const job = ComparisonWorker.jobs[0];
  if (!job) throw new Error('Missing comparison worker');
  expect(job.postMessage).toHaveBeenCalledWith({
    a: expect.any(Object),
    b: expect.any(Object),
  });
  const next = LIBRARY.find(
    (e) =>
      !e.of &&
      e.id !== (screen.getByLabelText('Pattern A') as HTMLSelectElement).value,
  );
  if (!next) throw new Error('Missing alternate tutorial');
  fireEvent.change(screen.getByLabelText('Pattern A'), {
    target: { value: next.id },
  });
  expect(job.terminate).toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  act(() =>
    job.onmessage?.(
      new MessageEvent<OverlayReply>('message', {
        data: { error: 'Stale comparison' },
      }),
    ),
  );
  expect(screen.queryByText('Stale comparison')).toBeNull();
});
it('reports inconclusive alignment without displaying invented coverage percentages', async () => {
  render(<InkOverlay />);
  fireEvent.click(screen.getByRole('button', { name: 'Compare ink' }));
  await waitFor(() => expect(ComparisonWorker.jobs).toHaveLength(1));
  const job = ComparisonWorker.jobs[0];
  if (!job) throw new Error('Missing comparison worker');
  act(() =>
    job.onmessage?.(
      new MessageEvent<OverlayReply>('message', {
        data: {
          result: {
            status: 'inconclusive',
            reason: 'No common repeat.',
            coverageA: 0,
            coverageB: 0,
            tolerance: 1e-6,
            shared: [],
            onlyA: [],
            onlyB: [],
            boundary: [],
          },
        },
      }),
    ),
  );
  expect(
    screen.getByRole('heading', { name: 'Alignment inconclusive' }),
  ).toBeTruthy();
  expect(screen.queryByText(/A covered by B/)).toBeNull();
});

import { act, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { Play } from './app';
import { loadModel } from './model';
import type { Reply, Request } from './workerClient';

/**
 * A stand-in Worker that runs the same steps as engine.worker.ts, but
 * reports one stage at a time when the test says so.
 */
class FakeWorker {
  static last: FakeWorker | undefined;
  onmessage: ((e: MessageEvent<Reply>) => void) | null = null;
  private queue: Reply[] = [];
  constructor() {
    FakeWorker.last = this;
  }
  postMessage({ id, json }: Request) {
    const model = loadModel(json);
    this.queue.push(
      { id, kind: 'progress', stage: 'checking' },
      { id, kind: 'progress', stage: 'drawing' },
      { id, kind: 'progress', stage: 'pieces' },
      { id, kind: 'done', model: structuredClone(model) },
    );
  }
  /** Delivers the next reply. */
  step() {
    const reply = this.queue.shift();
    if (reply)
      act(() => this.onmessage?.({ data: reply } as MessageEvent<Reply>));
  }
}

describe('loading in a worker', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', FakeWorker);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows each stage while the worker loads the tutorial, then plays it', async () => {
    render(<Play json={example} />);
    expect(screen.getByRole('status').textContent).toBe(
      'Checking the tutorial…',
    );
    const worker = FakeWorker.last as FakeWorker;
    // Let the worker's first message arrive.
    await act(() => Promise.resolve());
    worker.step();
    worker.step();
    expect(screen.getByRole('status').textContent).toBe(
      'Drawing the construction…',
    );
    worker.step();
    expect(screen.getByRole('status').textContent).toBe('Finding the pieces…');
    worker.step();
    // The finished model arrives through a promise.
    await act(() => Promise.resolve());
    expect(document.querySelector('.label')?.textContent).toBe('Step 1 of 6');
  });
});

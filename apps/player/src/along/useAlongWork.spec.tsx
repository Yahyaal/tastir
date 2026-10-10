import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useAlongWork } from './useAlongWork';

class FakeWorker {
  static all: FakeWorker[] = [];
  onmessage?: (event: { data: unknown }) => void;
  onerror?: () => void;
  onmessageerror?: () => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    FakeWorker.all.push(this);
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  FakeWorker.all = [];
});

it('keeps only the newest queued board and ignores obsolete replies', () => {
  vi.stubGlobal('Worker', FakeWorker);
  const first = { segments: [], types: [] };
  const second = { segments: [], types: [] };
  const newest = { segments: [], types: [] };
  const { result, rerender, unmount } = renderHook(
    ({ input }) => useAlongWork('wall', input),
    { initialProps: { input: first } },
  );
  expect(result.current.pending).toBe(true);
  const worker = FakeWorker.all[0]!;
  rerender({ input: second });
  rerender({ input: newest });
  expect(worker.postMessage).toHaveBeenCalledTimes(1);
  act(() =>
    worker.onmessage?.({ data: { id: 0, value: [{ polygon: [], type: 99 }] } }),
  );
  expect(result.current.value).toBeUndefined();
  expect(worker.postMessage).toHaveBeenCalledTimes(2);
  expect(worker.postMessage.mock.calls[1]?.[0].input).toBe(newest);
  act(() =>
    worker.onmessage?.({ data: { id: 1, value: [{ polygon: [], type: 1 }] } }),
  );
  expect(result.current.value).toEqual([{ polygon: [], type: 1 }]);
  expect(result.current.pending).toBe(false);
  act(() => worker.onmessage?.({ data: { id: 0, value: [] } }));
  expect(result.current.value).toEqual([{ polygon: [], type: 1 }]);
  unmount();
  expect(worker.terminate).toHaveBeenCalled();
});

it('reports a crashed worker and can compute a subsequent board', () => {
  vi.stubGlobal('Worker', FakeWorker);
  const { result, rerender } = renderHook(
    ({ input }) => useAlongWork('wall', input),
    { initialProps: { input: { segments: [], types: [] } } },
  );
  act(() => FakeWorker.all[0]!.onerror?.());
  expect(result.current.error).toContain('engine stopped');
  expect(result.current.pending).toBe(false);
  rerender({ input: { segments: [], types: [] } });
  act(() => FakeWorker.all[1]!.onmessage?.({ data: { id: 1, value: [] } }));
  expect(result.current.error).toBeUndefined();
  expect(result.current.value).toEqual([]);
});

it('reports a worker that cannot start without throwing out of React', () => {
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        throw new Error('Worker unavailable');
      }
    },
  );
  const input = { segments: [], types: [] };
  const { result } = renderHook(() => useAlongWork('wall', input));
  expect(result.current.error).toBe('Worker unavailable');
  expect(result.current.pending).toBe(false);
});

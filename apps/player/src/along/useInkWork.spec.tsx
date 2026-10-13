import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { loadModel } from '../app/model';
import { emptyDraft } from '../editor/document';
import { useInkBoard } from './useInkBoard';

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
const model = loadModel(example);
const draft = emptyDraft('test', 'Test');
const chosen = new Set<string>();
const setChosen = vi.fn();

it('warms as soon as the construction is known and reuses its worker after completion', () => {
  vi.stubGlobal('Worker', FakeWorker);
  const { rerender, unmount } = renderHook(
    ({ active }) => useInkBoard(model, draft, active, chosen, setChosen),
    { initialProps: { active: false } },
  );
  const worker = FakeWorker.all[0]!;
  expect(worker.postMessage.mock.calls[0]?.[0].input).toEqual({ model });
  act(() => worker.onmessage?.({ data: { id: 0, part: 'board' } }));
  rerender({ active: true });
  expect(FakeWorker.all).toHaveLength(1);
  expect(worker.postMessage.mock.calls[1]?.[0].input.draft).toBe(draft);
  unmount();
  expect(worker.terminate).toHaveBeenCalledOnce();
});

it('a newer board cancels unfinished preparation and ignores its late reply', () => {
  vi.stubGlobal('Worker', FakeWorker);
  const { result, rerender } = renderHook(
    ({ active, board }) => useInkBoard(model, board, active, chosen, setChosen),
    { initialProps: { active: false, board: draft } },
  );
  const warm = FakeWorker.all[0]!;
  rerender({ active: true, board: draft });
  expect(warm.terminate).toHaveBeenCalledOnce();
  const older = FakeWorker.all[1]!;
  const latest = { ...draft, title: 'Newer board' };
  rerender({ active: true, board: latest });
  expect(older.terminate).toHaveBeenCalledOnce();
  const worker = FakeWorker.all[2]!;
  act(() =>
    older.onmessage?.({
      data: { id: 1, part: 'board', value: { reason: 'obsolete' } },
    }),
  );
  expect(result.current.ready).toBeUndefined();
  expect(result.current.pending).toBe(true);
  act(() =>
    worker.onmessage?.({
      data: { id: 2, part: 'board', value: { reason: 'newest board' } },
    }),
  );
  expect(result.current.ready).toEqual({ reason: 'newest board' });
});

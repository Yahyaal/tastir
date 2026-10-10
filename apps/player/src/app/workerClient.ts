import { useEffect, useMemo, useState } from 'react';
import { loadModel, withInking, type Model } from './model';

/** The stage a tutorial is at while it loads. */
export type Progress = 'checking' | 'drawing' | 'pieces';

export interface Request {
  readonly id: number;
  readonly json: unknown;
  /** A saved design's inked pieces, to make its pattern in place of the
   * tutorial's own. */
  readonly inked?: readonly string[];
}

export type Reply =
  | { readonly id: number; readonly kind: 'progress'; readonly stage: Progress }
  | { readonly id: number; readonly kind: 'done'; readonly model: Model }
  | { readonly id: number; readonly kind: 'error'; readonly message: string };

export const PROGRESS_TEXT: Record<Progress, string> = {
  checking: 'Checking the tutorial…',
  drawing: 'Drawing the construction…',
  pieces: 'Finding the pieces…',
};

let worker: Worker | undefined;
let nextId = 0;
const waiting = new Map<number, (reply: Reply) => void>();

function engineWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onerror = () =>
      failWorker('The drawing engine stopped. Reload the page to try again.');
    worker.onmessageerror = () =>
      failWorker(
        'The drawing engine returned unreadable data. Reload the page to try again.',
      );
    worker.onmessage = ({ data }: MessageEvent<Reply>) =>
      waiting.get(data.id)?.(data);
  }
  return worker;
}

function failWorker(message: string) {
  worker?.terminate();
  worker = undefined;
  for (const [id, reply] of [...waiting]) reply({ id, kind: 'error', message });
}

/** Loads a tutorial in the worker, reporting each stage. */
export function loadInWorker(
  json: unknown,
  onProgress: (stage: Progress) => void,
  inked?: readonly string[],
): Promise<Model> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () =>
        failWorker(
          'The pattern took too long to draw. Reload the page to try again.',
        ),
      60_000,
    );
    waiting.set(id, (reply) => {
      if (reply.kind === 'progress') return onProgress(reply.stage);
      clearTimeout(timeout);
      waiting.delete(id);
      if (reply.kind === 'done') resolve(reply.model);
      else reject(new Error(reply.message));
    });
    try {
      engineWorker().postMessage({ id, json, inked } satisfies Request);
    } catch (e) {
      clearTimeout(timeout);
      waiting.delete(id);
      reject(e);
    }
  });
}

export interface Loading {
  readonly model?: Model;
  readonly error?: string;
  readonly progress?: Progress;
}

const canUseWorker = () => typeof Worker !== 'undefined';

function loadNow(json: unknown, inked?: readonly string[]): Loading {
  try {
    return { model: withInking(loadModel(json), inked).model };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * A tutorial's model, loaded in the Web Worker; where there is no worker
 * (tests, old browsers) it loads at once on the main thread. With a saved
 * design's inked pieces, the model has the pattern they make (or the
 * tutorial's own, when they no longer fit).
 */
export function useModel(json: unknown, inked?: readonly string[]): Loading {
  // The inking by value, so a new array with the same pieces is no change.
  const ink = inked && JSON.stringify(inked);
  const pieces = useMemo(
    () => (ink === undefined ? undefined : (JSON.parse(ink) as string[])),
    [ink],
  );
  const direct = useMemo(
    () =>
      canUseWorker() || typeof json === 'function'
        ? undefined
        : loadNow(json, pieces),
    [json, pieces],
  );
  const [loaded, setLoaded] = useState<{
    json: unknown;
    ink?: string;
    state: Loading;
  }>();
  useEffect(() => {
    if (direct) return;
    let live = true;
    const set = (state: Loading) => live && setLoaded({ json, ink, state });
    set({ progress: 'checking' });
    const load = async () => {
      const data = typeof json === 'function' ? await json() : json;
      if (!live) return undefined;
      if (!canUseWorker()) return withInking(loadModel(data), pieces).model;
      return loadInWorker(data, (stage) => set({ progress: stage }), pieces);
    };
    load().then(
      (model) => model && set({ model }),
      (e: Error) => set({ error: e.message }),
    );
    return () => {
      live = false;
    };
  }, [json, ink, pieces, direct]);
  if (direct) return direct;
  return loaded && loaded.json === json && loaded.ink === ink
    ? loaded.state
    : { progress: 'checking' };
}

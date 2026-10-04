import { useEffect, useMemo, useState } from 'react';
import { loadModel, type Model } from './model';

/** The stage a tutorial is at while it loads. */
export type Progress = 'checking' | 'drawing' | 'pieces';

export interface Request {
  readonly id: number;
  readonly json: unknown;
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
    worker.onmessage = ({ data }: MessageEvent<Reply>) =>
      waiting.get(data.id)?.(data);
  }
  return worker;
}

/** Loads a tutorial in the worker, reporting each stage. */
export function loadInWorker(
  json: unknown,
  onProgress: (stage: Progress) => void,
): Promise<Model> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    waiting.set(id, (reply) => {
      if (reply.kind === 'progress') return onProgress(reply.stage);
      waiting.delete(id);
      if (reply.kind === 'done') resolve(reply.model);
      else reject(new Error(reply.message));
    });
    engineWorker().postMessage({ id, json } satisfies Request);
  });
}

export interface Loading {
  readonly model?: Model;
  readonly error?: string;
  readonly progress?: Progress;
}

const canUseWorker = () => typeof Worker !== 'undefined';

function loadNow(json: unknown): Loading {
  try {
    return { model: loadModel(json) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * A tutorial's model, loaded in the Web Worker; where there is no worker
 * (tests, old browsers) it loads at once on the main thread.
 */
export function useModel(json: unknown): Loading {
  const direct = useMemo(
    () => (canUseWorker() ? undefined : loadNow(json)),
    [json],
  );
  const [loaded, setLoaded] = useState<{ json: unknown; state: Loading }>();
  useEffect(() => {
    if (direct) return;
    let live = true;
    const set = (state: Loading) => live && setLoaded({ json, state });
    set({ progress: 'checking' });
    loadInWorker(json, (stage) => set({ progress: stage })).then(
      (model) => set({ model }),
      (e: Error) => set({ error: e.message }),
    );
    return () => {
      live = false;
    };
  }, [json, direct]);
  if (direct) return direct;
  return loaded && loaded.json === json
    ? loaded.state
    : { progress: 'checking' };
}

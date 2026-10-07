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
    worker.onmessage = ({ data }: MessageEvent<Reply>) =>
      waiting.get(data.id)?.(data);
  }
  return worker;
}

/** Loads a tutorial in the worker, reporting each stage. */
export function loadInWorker(
  json: unknown,
  onProgress: (stage: Progress) => void,
  inked?: readonly string[],
): Promise<Model> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    waiting.set(id, (reply) => {
      if (reply.kind === 'progress') return onProgress(reply.stage);
      waiting.delete(id);
      if (reply.kind === 'done') resolve(reply.model);
      else reject(new Error(reply.message));
    });
    engineWorker().postMessage({ id, json, inked } satisfies Request);
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
    () => (canUseWorker() ? undefined : loadNow(json, pieces)),
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
    loadInWorker(json, (stage) => set({ progress: stage }), pieces).then(
      (model) => set({ model }),
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

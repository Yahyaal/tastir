import { useEffect, useRef, useState } from 'react';
import type { PatternShape } from '@tastir/relief';
import { carve, type CarveRequest, type Carving3D } from './carve';

export type CarveReply =
  | ({ readonly id: number; readonly kind: 'done' } & Carving3D)
  | { readonly id: number; readonly kind: 'error'; readonly message: string };

export interface Carved extends Partial<Carving3D> {
  readonly error?: string;
  /** A newer carving is being made. */
  readonly busy: boolean;
}

let worker: Worker | undefined;
function reliefWorker(): Worker | undefined {
  if (typeof Worker === 'undefined') return undefined;
  worker ??= new Worker(new URL('./relief.worker.ts', import.meta.url), {
    type: 'module',
  });
  return worker;
}

/** Only what the carving needs from a pattern, to send to the worker:
 * the repeat, the pieces, and the crossings of its weave if it has one. */
export function shapeOf(pattern: PatternShape, weave?: PatternShape['weave']): PatternShape {
  return {
    cell: { u: pattern.cell.u, v: pattern.cell.v },
    pieces: pattern.pieces.map((p) => ({ polygon: p.polygon, type: p.type })),
    ...(weave && weave.crossings.length
      ? {
          weave: {
            repeat: weave.repeat,
            crossings: weave.crossings.map(({ at, i, j, over, under }) => ({ at, i, j, over, under })),
          },
        }
      : {}),
  };
}

/** Carves in the page itself, where there are no workers (tests). */
function carveHere(r: CarveRequest): Carved {
  try {
    return { ...carve(r), busy: false };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e), busy: false };
  }
}

/**
 * The meshes for a request, made in the worker. While a newer request is
 * carved, the last meshes stay shown; only the newest answer is used.
 */
export function useCarved(
  pattern: PatternShape | undefined,
  rest: Omit<CarveRequest, 'pattern'>,
): Carved {
  const [carved, setCarved] = useState<Carved>({ busy: true });
  const latest = useRef(0);
  // The pattern stays the same object while the page is open; the rest is
  // small, so its text is the effect's key.
  const key = JSON.stringify(rest);
  useEffect(() => {
    if (!pattern) return;
    const request: CarveRequest = { ...rest, pattern };
    const id = ++latest.current;
    const w = reliefWorker();
    if (!w) {
      setCarved(carveHere(request));
      return;
    }
    setCarved((c) => ({ ...c, busy: true }));
    const onMessage = ({ data }: MessageEvent<CarveReply>) => {
      if (data.id !== id || id !== latest.current) return;
      if (data.kind === 'error') setCarved({ error: data.message, busy: false });
      else {
        const { id: _, kind: __, ...done } = data;
        setCarved({ ...done, busy: false });
      }
    };
    w.addEventListener('message', onMessage);
    // Sliders send many values: wait a moment for the last one.
    const timer = setTimeout(() => w.postMessage({ ...request, id }), 60);
    return () => {
      clearTimeout(timer);
      w.removeEventListener('message', onMessage);
    };
    // The key holds the rest of the request's content.
  }, [pattern, key]);
  return carved;
}

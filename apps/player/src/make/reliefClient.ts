import { useEffect, useRef, useState } from 'react';
import {
  openEdges,
  relief,
  volumeOf,
  type Carving,
  type Mesh,
  type P2,
  type PatternShape,
} from '@tastir/relief';

export interface CarveRequest {
  readonly id: number;
  readonly pattern: PatternShape;
  readonly outline: readonly P2[];
  readonly scale: number;
  readonly thickness: number;
  readonly band: number;
  readonly frame: number;
  /** The carving of each piece type; -1 for any type not listed. */
  readonly carvings: Readonly<Record<number, Carving>>;
}

export type CarveReply =
  | {
      readonly id: number;
      readonly kind: 'done';
      readonly positions: Float64Array;
      readonly triangles: Uint32Array;
      readonly volume: number;
    }
  | { readonly id: number; readonly kind: 'error'; readonly message: string };

export interface Carved {
  readonly mesh?: Mesh;
  readonly volume?: number;
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

/** Only what the carving needs from a pattern, to send to the worker. */
export function shapeOf(pattern: PatternShape): PatternShape {
  return {
    cell: { u: pattern.cell.u, v: pattern.cell.v },
    pieces: pattern.pieces.map((p) => ({ polygon: p.polygon, type: p.type })),
  };
}

/** Carves in the page itself, where there are no workers (tests). */
function carveHere(r: Omit<CarveRequest, 'id'>): Carved {
  try {
    const mesh = relief(r.pattern, {
      width: 0,
      height: 0,
      outline: r.outline,
      scale: r.scale,
      thickness: r.thickness,
      band: r.band,
      frame: r.frame,
      carving: (type) => r.carvings[type] ?? r.carvings[-1]!,
    });
    if (openEdges(mesh)) throw new Error('The carved mesh is not closed.');
    return { mesh, volume: volumeOf(mesh), busy: false };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e), busy: false };
  }
}

/**
 * The mesh for a request, made in the worker. While a newer request is
 * carved, the last mesh stays shown; only the newest answer is used.
 */
export function useCarved(
  pattern: PatternShape | undefined,
  rest: Omit<CarveRequest, 'id' | 'pattern'>,
): Carved {
  const [carved, setCarved] = useState<Carved>({ busy: true });
  const latest = useRef(0);
  // The pattern stays the same object while the page is open; the rest is
  // small, so its text is the effect's key.
  const key = JSON.stringify(rest);
  useEffect(() => {
    if (!pattern) return;
    const request = { ...rest, pattern };
    const id = ++latest.current;
    const w = reliefWorker();
    if (!w) {
      setCarved(carveHere(request));
      return;
    }
    setCarved((c) => ({ ...c, busy: true }));
    const onMessage = ({ data }: MessageEvent<CarveReply>) => {
      if (data.id !== id || id !== latest.current) return;
      setCarved(
        data.kind === 'done'
          ? {
              mesh: { positions: data.positions, triangles: data.triangles },
              volume: data.volume,
              busy: false,
            }
          : { error: data.message, busy: false },
      );
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

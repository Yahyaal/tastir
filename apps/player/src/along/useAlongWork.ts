import { useEffect, useMemo, useRef, useState } from 'react';
import { calculate, type Input, type Job, type Output } from './alongWork';
import { measure, type Timings } from './timing';

/** One worker per job. While it is busy retain only the newest request,
 * so rapid edits cannot queue minutes of obsolete work. Geometry caches
 * survive between requests; replies for earlier boards never show. */
export function useAlongWork<K extends Job>(
  job: K,
  input: Input<K> | undefined,
  active = true,
) {
  const threaded = typeof Worker !== 'undefined';
  const direct = useMemo(() => {
    if (threaded || !active || !input) return undefined;
    try {
      return { value: calculate(job, input) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [threaded, active, job, input]);
  const [reply, setReply] = useState<{
    input: Input<K>;
    value?: Output<K>;
    error?: string;
  }>();
  const enqueue = useRef<((input: Input<K>) => void) | undefined>(undefined);
  useEffect(() => {
    if (!threaded || !active) return;
    let worker: Worker | undefined;
    let running: { id: number; input: Input<K>; sent: number } | undefined;
    let pending: Input<K> | undefined;
    let next = 0;
    let live = true;
    let timeout: ReturnType<typeof setTimeout>;
    const fail = (error: string) => {
      clearTimeout(timeout);
      const target = pending ?? running?.input;
      if (live && target) setReply({ input: target, error });
      pending = undefined;
      running = undefined;
      worker?.terminate();
      worker = undefined;
    };
    const send = (value: Input<K>) => {
      running = { id: next++, input: value, sent: performance.now() };
      try {
        if (!worker) {
          worker = new Worker(new URL('./along.worker.ts', import.meta.url), {
            type: 'module',
          });
          worker.onmessage = ({
            data,
          }: MessageEvent<{
            id: number;
            value?: Output<K>;
            error?: string;
            timings?: Timings;
            posted?: number;
          }>) => {
            if (!live || data.id !== running?.id) return;
            clearTimeout(timeout);
            const now = performance.now();
            if (data.timings)
              measure(job, {
                ...data.timings,
                ...(data.posted !== undefined
                  ? { back: performance.timeOrigin + now - data.posted }
                  : {}),
                round: now - running.sent,
              });
            setReply({
              input: running.input,
              value: data.value,
              error: data.error,
            });
            running = undefined;
            const latest = pending;
            pending = undefined;
            if (latest) send(latest);
          };
          worker.onerror = () =>
            fail('The drawing engine stopped. Go back a step and try again.');
          worker.onmessageerror = () =>
            fail(
              'The drawing could not be read. Go back a step and try again.',
            );
        }
        timeout = setTimeout(
          () =>
            fail('The drawing took too long. Go back a step and try again.'),
          60_000,
        );
        const posting = performance.now();
        worker.postMessage({ id: running.id, job, input: value });
        measure(job, { post: performance.now() - posting });
      } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
      }
    };
    enqueue.current = (value) => {
      if (running) pending = value;
      else send(value);
    };
    return () => {
      live = false;
      enqueue.current = undefined;
      clearTimeout(timeout);
      worker?.terminate();
    };
  }, [threaded, active, job]);
  useEffect(() => {
    if (threaded && active && input) enqueue.current?.(input);
  }, [threaded, active, job, input]);
  const result = direct ?? (reply?.input === input ? reply : undefined);
  return {
    value: active ? result?.value : undefined,
    error: active ? result?.error : undefined,
    pending: Boolean(active && input && !result),
  };
}

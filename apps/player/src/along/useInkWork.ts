import type { Tutorial } from '@tastir/schema';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Model } from '../app/model';
import type { Draft } from '../editor/document';
import {
  InkSession,
  readyOf,
  type InkCheck,
  type Ready,
  type Sent,
  type SentPattern,
} from './inkWork';
import { measure, type Timings } from './timing';

/** A board to prepare for inking. */
export interface PrepareInput {
  readonly model: Model;
  readonly draft: Draft;
}

/** The learner's ink, to check against a prepared board. */
export interface CheckInput {
  readonly board: number;
  readonly chosen: ReadonlySet<string>;
  readonly tutorial: Tutorial;
}

/** A message to the ink worker. */
export type InkRequest =
  | { id: number; job: 'prepare'; input: PrepareInput }
  | { id: number; job: 'check'; input: CheckInput };

/**
 * A message from the ink worker. A prepare has two answers: the board,
 * which the pen needs, then the pattern on it.
 */
export interface InkReply {
  id: number;
  part: 'board' | 'pattern' | 'check';
  value?: Sent | SentPattern | InkCheck | { reason: string };
  error?: string;
  timings?: Timings;
  posted?: number;
}

type Prepared = Ready | { reason: string };
interface Reply<I, V> {
  input: I;
  value?: V;
  error?: string;
}

/** A board on the page with its pattern, or why the pattern failed. */
function withPattern(
  ready: Ready,
  sent: SentPattern | { reason: string },
): Prepared {
  if ('reason' in sent) return sent;
  return { ...ready, pattern: sent.pattern, mirror: sent.mirror };
}

/**
 * The ink stage's work, in one worker for the visit. The worker prepares
 * each board and keeps it, sending back only what the page draws (typed
 * arrays, transferred) and then the pattern on it, and checks the
 * learner's ink against the board it kept. A newer board stops a prepare
 * that is still running, so the learner waits for one prepare at most;
 * while a check runs, only the newest ink waits for it.
 */
export function useInkWork(
  prepare: PrepareInput | undefined,
  check: Omit<CheckInput, 'board'> | undefined,
) {
  const threaded = typeof Worker !== 'undefined';
  // Without workers (tests, old browsers) the same work runs on the page.
  const session = useMemo(
    () => (threaded ? undefined : new InkSession()),
    [threaded],
  );
  const directReady = useMemo((): Reply<PrepareInput, Prepared> | undefined => {
    if (!session || !prepare) return undefined;
    try {
      const sent = session.prepare(prepare.model, prepare.draft);
      return {
        input: prepare,
        value:
          'reason' in sent
            ? sent
            : withPattern(readyOf(sent), session.finish(sent.board)),
      };
    } catch (e) {
      return {
        input: prepare,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [session, prepare]);
  const [prepared, setPrepared] = useState<Reply<PrepareInput, Prepared>>();
  const readyReply =
    directReady ?? (prepared?.input === prepare ? prepared : undefined);
  const ready =
    readyReply?.value && !('reason' in readyReply.value)
      ? readyReply.value
      : undefined;

  // The pattern's coming keeps the board's graph: a new check only when
  // the ink or the board changes.
  const graph = ready?.graph;
  const board = ready?.board;
  const checkInput = useMemo(
    (): CheckInput | undefined =>
      graph && board !== undefined && check ? { ...check, board } : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph, board, check?.chosen, check?.tutorial],
  );
  const directCheck = useMemo(():
    Reply<CheckInput, InkCheck | undefined> | undefined => {
    if (!session || !checkInput) return undefined;
    try {
      return {
        input: checkInput,
        value: session.check(
          checkInput.board,
          checkInput.chosen,
          checkInput.tutorial,
        ),
      };
    } catch (e) {
      return {
        input: checkInput,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [session, checkInput]);
  const [checked, setChecked] =
    useState<Reply<CheckInput, InkCheck | undefined>>();
  const checkReply =
    directCheck ?? (checked?.input === checkInput ? checked : undefined);

  const queue = useRef<
    | {
        prepare: (input: PrepareInput) => void;
        check: (input: CheckInput) => void;
      }
    | undefined
  >(undefined);
  useEffect(() => {
    if (!threaded) return;
    let worker: Worker | undefined;
    // A prepare runs until its pattern comes.
    let running:
      | { id: number; job: 'prepare'; input: PrepareInput; sent: number }
      | { id: number; job: 'check'; input: CheckInput; sent: number }
      | undefined;
    let pending: CheckInput | undefined;
    // The board last prepared, which a learner coming back to it reuses.
    let last: PrepareInput | undefined;
    let next = 0;
    let live = true;
    let timeout: ReturnType<typeof setTimeout>;
    const stop = () => {
      clearTimeout(timeout);
      running = undefined;
      last = undefined;
      worker?.terminate();
      worker = undefined;
    };
    const fail = (error: string) => {
      const was = running;
      const waiting = pending;
      pending = undefined;
      stop();
      if (!live) return;
      if (was?.job === 'prepare') setPrepared({ input: was.input, error });
      const target = waiting ?? (was?.job === 'check' ? was.input : undefined);
      if (target) setChecked({ input: target, error });
    };
    const onReply = (data: InkReply) => {
      const was = running;
      if (!live || !was || data.id !== was.id) return;
      const now = performance.now();
      const job = was.job === 'prepare' ? 'prepare' : 'ink';
      if (data.timings)
        measure(data.part === 'pattern' ? 'pattern' : job, {
          ...data.timings,
          ...(data.posted !== undefined
            ? { back: performance.timeOrigin + now - data.posted }
            : {}),
          round: now - was.sent,
        });
      if (was.job === 'prepare' && data.part === 'board') {
        // The pen can work now; the pattern follows.
        const value = data.value as Sent | { reason: string } | undefined;
        const reading = performance.now();
        setPrepared({
          input: was.input,
          value: value && !('reason' in value) ? readyOf(value) : value,
          error: data.error,
        });
        measure(job, { read: performance.now() - reading });
        if (!value || 'reason' in value || data.error) settle();
        return;
      }
      if (was.job === 'prepare') {
        const value = data.value as SentPattern | { reason: string };
        setPrepared((p) =>
          p?.input === was.input && p.value && !('reason' in p.value)
            ? {
                input: p.input,
                value: data.error
                  ? { reason: data.error }
                  : withPattern(p.value, value),
              }
            : p,
        );
        last = was.input;
      } else
        setChecked({
          input: was.input,
          value: data.value as InkCheck | undefined,
          error: data.error,
        });
      settle();
    };
    /** The job is done: the newest ink waiting is checked. */
    const settle = () => {
      clearTimeout(timeout);
      running = undefined;
      const latest = pending;
      pending = undefined;
      if (latest) start({ id: next++, job: 'check', input: latest });
    };
    const start = (request: InkRequest) => {
      running = { ...request, sent: performance.now() } as typeof running;
      try {
        if (!worker) {
          worker = new Worker(new URL('./ink.worker.ts', import.meta.url), {
            type: 'module',
          });
          worker.onmessage = ({ data }: MessageEvent<InkReply>) =>
            onReply(data);
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
        worker.postMessage(request);
        measure(request.job === 'prepare' ? 'prepare' : 'ink', {
          post: performance.now() - posting,
        });
      } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
      }
    };
    queue.current = {
      prepare: (input) => {
        if (running?.job === 'prepare' && running.input === input) return;
        if (!running && last === input) return;
        // Whatever runs is for an older board: stop it rather than wait.
        if (running) stop();
        pending = undefined;
        start({ id: next++, job: 'prepare', input });
      },
      check: (input) => {
        if (running) pending = input;
        else start({ id: next++, job: 'check', input });
      },
    };
    return () => {
      live = false;
      queue.current = undefined;
      stop();
    };
  }, [threaded]);
  useEffect(() => {
    if (threaded && prepare) queue.current?.prepare(prepare);
  }, [threaded, prepare]);
  useEffect(() => {
    if (threaded && checkInput) queue.current?.check(checkInput);
  }, [threaded, checkInput]);

  return {
    ready: readyReply?.value,
    preparing: Boolean(prepare && !readyReply),
    prepareError: readyReply?.error,
    result: checkReply?.value,
    checking: Boolean(checkInput && !checkReply),
    checkError: checkReply?.error,
  };
}

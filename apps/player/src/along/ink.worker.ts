import { InkSession, transfers, warmInk } from './inkWork';
import { takeTimings } from './timing';
import type { InkReply, InkRequest } from './useInkWork';

// The ink of one draw-along visit: boards are prepared and kept here, and
// the learner's ink is checked here against them.
const session = new InkSession();

/** Answers with the parts of the work timed since `start`. */
function reply(
  start: number,
  answer: Omit<InkReply, 'timings' | 'posted'>,
  transfer: Transferable[] = [],
) {
  const timings = { ...takeTimings(), work: performance.now() - start };
  // When it was posted, so the main thread can time the way back.
  const posted = performance.timeOrigin + performance.now();
  postMessage({ ...answer, timings, posted }, { transfer });
}

onmessage = ({ data }: MessageEvent<InkRequest>) => {
  const { id } = data;
  let start = performance.now();
  let part: InkReply['part'] = data.job === 'prepare' ? 'board' : 'check';
  try {
    if (data.job === 'check') {
      const { board, chosen, tutorial } = data.input;
      return reply(start, {
        id,
        part,
        value: session.check(board, chosen, tutorial),
      });
    }
    if (!data.input.draft) {
      const ready = warmInk(data.input.model);
      // A warm-up has no board for the page. Keep the transferable arrays
      // here for the actual board's geometry-cache lookup.
      return reply(start, {
        id,
        part,
        ...('reason' in ready ? { value: ready } : {}),
      });
    }
    const sent = session.prepare(data.input.model, data.input.draft);
    if ('reason' in sent) return reply(start, { id, part, value: sent });
    // The board first, so the pen works; then the pattern on it.
    reply(start, { id, part, value: sent }, transfers(sent));
    start = performance.now();
    part = 'pattern';
    reply(start, { id, part, value: session.finish(sent.board) });
  } catch (e) {
    postMessage({
      id,
      part,
      error: e instanceof Error ? e.message : String(e),
    });
  }
};

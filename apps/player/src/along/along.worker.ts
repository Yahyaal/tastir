import { calculate, type Input, type Job } from './alongWork';
import { takeTimings } from './timing';

onmessage = ({
  data,
}: MessageEvent<{ id: number; job: Job; input: Input<Job> }>) => {
  const start = performance.now();
  try {
    const value = calculate(data.job, data.input);
    const timings = { ...takeTimings(), work: performance.now() - start };
    // When it was posted, so the main thread can time the way back.
    const posted = performance.timeOrigin + performance.now();
    postMessage({ id: data.id, value, timings, posted });
  } catch (e) {
    postMessage({
      id: data.id,
      error: e instanceof Error ? e.message : String(e),
    });
  }
};

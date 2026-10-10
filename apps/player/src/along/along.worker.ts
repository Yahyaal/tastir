import { calculate, type Input, type Job } from './alongWork';
onmessage = ({
  data,
}: MessageEvent<{ id: number; job: Job; input: Input<Job> }>) => {
  try {
    postMessage({ id: data.id, value: calculate(data.job, data.input) });
  } catch (e) {
    postMessage({
      id: data.id,
      error: e instanceof Error ? e.message : String(e),
    });
  }
};

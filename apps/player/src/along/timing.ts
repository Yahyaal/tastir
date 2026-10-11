/**
 * Where the time of a piece of work goes, part by part, in milliseconds.
 * The worker sends the parts of its last job back with the result, and
 * the main thread records them as performance measures
 * (`along:<job>:<part>`) that the browser's profiler and the speed tests
 * read.
 */
export type Timings = Record<string, number>;

let laps: Timings = {};
let last = 0;

/** Starts timing a new job, forgetting the last one's parts. */
export function startTiming(): void {
  laps = {};
  last = performance.now();
}

/** Ends the part since the last lap (or the start) under a name. */
export function lap(part: string): void {
  const now = performance.now();
  laps[part] = (laps[part] ?? 0) + now - last;
  last = now;
}

/** The parts timed since the start, which ends the job. */
export function takeTimings(): Timings {
  const out = laps;
  laps = {};
  return out;
}

/** Records parts as performance measures ending now. */
export function measure(job: string, timings: Timings): void {
  if (
    typeof performance === 'undefined' ||
    typeof performance.measure !== 'function'
  )
    return;
  const end = performance.now();
  for (const [part, ms] of Object.entries(timings))
    try {
      performance.measure(`along:${job}:${part}`, {
        start: Math.max(0, end - ms),
        duration: ms,
      });
    } catch {
      // A browser without measure options: the timings are only a help.
    }
}

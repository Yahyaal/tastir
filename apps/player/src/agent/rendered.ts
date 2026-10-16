/** React may defer a commit beyond two frames; observe the actual renderer. */
export async function waitForRendered(
  ready: () => boolean,
  signal?: AbortSignal,
  timeout = 5000,
) {
  const until = performance.now() + timeout;
  for (;;) {
    signal?.throwIfAborted();
    if (ready()) return;
    if (performance.now() >= until)
      throw new Error(
        'The updated drawing has not rendered yet. Send the current view again.',
      );
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        cancelAnimationFrame(frame);
        resolve();
      }, 50);
      const frame = requestAnimationFrame(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}

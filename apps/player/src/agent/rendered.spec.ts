import { waitForRendered } from './rendered';
afterEach(() => vi.unstubAllGlobals());
it('waits for an actual renderer acknowledgement even beyond two frames', async () => {
  let frames = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    queueMicrotask(() => {
      frames++;
      callback(0);
    });
    return frames;
  });
  await waitForRendered(() => frames >= 4);
  expect(frames).toBe(4);
});
it('rejects an unrendered update and a stopped observation', async () => {
  await expect(waitForRendered(() => false, undefined, 0)).rejects.toThrow(
    /not rendered/,
  );
  const controller = new AbortController();
  controller.abort();
  await expect(
    waitForRendered(() => true, controller.signal),
  ).rejects.toThrow();
});

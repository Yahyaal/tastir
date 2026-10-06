import { beforeEach } from 'vitest';

// Settings the player remembers live in localStorage; start each test fresh.
beforeEach(() => {
  window.localStorage.clear();
});

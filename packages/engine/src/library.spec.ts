// The library is browsed by region and tradition, so every tutorial in
// tutorials/ names a region and a tradition from the fixed lists. The
// learner's own designs may say anything; this checks the library only.
import { REGIONS, TRADITIONS } from '@tastir/schema';
import { loadTutorial, tutorialFiles } from './test/tutorials.js';

describe.each(tutorialFiles())('%s', (file) => {
  it('names its region and a tradition from the lists', () => {
    const t = loadTutorial(file);
    expect(REGIONS).toContain(t.region);
    expect(TRADITIONS).toContain(t.style);
  });
});

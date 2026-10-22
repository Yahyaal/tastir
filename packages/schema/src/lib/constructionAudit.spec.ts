import { readFileSync, readdirSync } from 'node:fs';
import { parseTutorial, safeParseTutorial } from './parse.js';

const folder = new URL('../../../../tutorials/', import.meta.url);
const tutorials = readdirSync(folder)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(new URL(file, folder), 'utf8')));

it('retains a source assessment on every library pattern, with separate historical metadata', () => {
  expect(tutorials.length).toBeGreaterThan(0);
  for (const input of tutorials) {
    const tutorial = parseTutorial(input);
    expect(tutorial.construction, tutorial.id).toEqual(input.construction);
    expect(tutorial.construction, tutorial.id).toBeDefined();
    expect(tutorial.verification).toEqual(input.verification);
    if (['instructions', 'mixed'].includes(tutorial.construction!.basis)) {
      expect(
        tutorial.credits.some((credit) => credit.url),
        tutorial.id,
      ).toBe(true);
      expect(tutorial.construction!.fidelity).not.toBe('not-applicable');
    }
  }
});

it('accepts unaudited files but rejects malformed source assessments', () => {
  const input = structuredClone(tutorials[0]);
  delete input.construction;
  expect(safeParseTutorial(input).success).toBe(true);
  const valid = tutorials[0].construction;
  for (const invalid of [
    { ...valid, basis: 'verified' },
    { ...valid, fidelity: '100%' },
    { ...valid, note: '' },
    { ...valid, reviewed: '2026-02-30' },
  ]) {
    expect(safeParseTutorial({ ...input, construction: invalid }).success).toBe(
      false,
    );
  }
});

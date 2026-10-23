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

it('identifies the instructional sources for every sourced library lesson and keeps pictures separate', () => {
  for (const input of tutorials) {
    const tutorial = parseTutorial(input);
    const guides = tutorial.credits.filter(
      (credit) =>
        credit.url && ['tutorial', 'challenge'].includes(credit.kind ?? ''),
    );
    const basis = tutorial.construction?.basis;
    expect(guides.length > 0, tutorial.id).toBe(
      basis === 'instructions' || basis === 'mixed',
    );
    for (const guide of guides) {
      expect(guide.steps?.length, tutorial.id).toBeGreaterThan(0);
      for (const step of guide.steps ?? [])
        expect(
          tutorial.steps.some((entry) => entry.id === step),
          tutorial.id,
        ).toBe(true);
    }
  }
});

it('keeps legacy credits valid and rejects unsupported source kinds', () => {
  const input = structuredClone(tutorials[0]);
  for (const credit of input.credits) delete credit.kind;
  expect(safeParseTutorial(input).success).toBe(true);
  input.credits[0].kind = 'verified';
  expect(safeParseTutorial(input).success).toBe(false);
});

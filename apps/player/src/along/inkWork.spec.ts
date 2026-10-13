import { describe, expect, it } from 'vitest';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { loadModel, withHelpers } from '../app/model';
import { InkSession, prepareInk, readyOf, transfers, warmInk } from './inkWork';

const model = withHelpers(loadModel(example), false);

describe('early ink preparation', () => {
  it('reuses geometry and keeps its cache valid after transferring a board', () => {
    const warm = warmInk(model);
    if ('reason' in warm) throw new Error(warm.reason);
    const actual = prepareInk(model, warm.draft);
    if ('reason' in actual) throw new Error(actual.reason);
    expect(actual.parts).toBe(warm.parts);
    const session = new InkSession();
    const first = session.prepare(model, warm.draft);
    if ('reason' in first) throw new Error(first.reason);
    const received = structuredClone(first, { transfer: transfers(first) });
    expect(first.parts.bitEnds.byteLength).toBe(0);
    expect(warm.parts.bitEnds.byteLength).toBeGreaterThan(0);
    const next = session.prepare(model, warm.draft);
    if ('reason' in next) throw new Error(next.reason);
    expect(next.parts).toEqual(received.parts);
    expect(readyOf(next).graph.dotCount).toBeGreaterThan(0);
    expect(
      session.check(next.board, new Set(next.classic), model.tutorial)?.matches,
    ).toBe(true);
  });

  it('prepares the actual learner geometry when it differs from the warm board', () => {
    const warm = warmInk(model);
    if ('reason' in warm) throw new Error(warm.reason);
    const extra = prepareInk(model, {
      ...warm.draft,
      steps: [
        ...warm.draft.steps,
        {
          id: warm.draft.steps.length + 1,
          text: 'An extra compass circle.',
          create: { extraCircle: { circle: { centre: 'A', through: 'O' } } },
        },
      ],
    });
    if ('reason' in extra) throw new Error(extra.reason);
    expect(extra.parts).not.toBe(warm.parts);
    expect(extra.scene.elements.has('extraCircle')).toBe(true);
    expect(extra.parts.bitEnds).not.toEqual(warm.parts.bitEnds);
  });
});

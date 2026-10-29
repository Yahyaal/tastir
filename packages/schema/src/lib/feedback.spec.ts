import {
  FeedbackSnapshotShape,
  FeedbackSubmissionShape,
  boundedFeedbackJson,
  feedbackCanonicalJson,
  utf8Size,
} from './feedback.js';
const draft = {
  format: 0,
  id: 'test',
  title: 'Test',
  fold: 8,
  style: 'My own',
  level: 'beginner',
  credits: [],
  given: { O: 'Centre', A: 'Right of O' },
  steps: [],
};
it('bounds untrusted structure before parsing a drawing, including deep objects and dangerous keys', () => {
  let nested: unknown = 'value';
  for (let i = 0; i < 30; i++) nested = { nested };
  expect(boundedFeedbackJson(nested)).toBe(false);
  expect(
    boundedFeedbackJson(JSON.parse('{"__proto__":{"polluted":true}}')),
  ).toBe(false);
  expect(boundedFeedbackJson({ value: Infinity })).toBe(false);
  expect(
    boundedFeedbackJson({ many: Array.from({ length: 5001 }, () => 1) }),
  ).toBe(false);
  expect(FeedbackSnapshotShape.safeParse({ draft }).success).toBe(true);
  expect(
    FeedbackSnapshotShape.safeParse({ draft: { ...draft, fold: 1_000_000 } })
      .success,
  ).toBe(false);
  expect(
    FeedbackSnapshotShape.safeParse({
      draft: {
        ...draft,
        steps: [{ id: 1, text: 'a'.repeat(70000), create: {} }],
      },
    }).success,
  ).toBe(false);
});
it('counts multibyte text for storage limits and hashes tutorial content independently of object key order', () => {
  expect(utf8Size('Aé水🙂')).toBe(10);
  expect(feedbackCanonicalJson({ z: 2, a: { b: 1, a: 2 } })).toBe(
    feedbackCanonicalJson({ a: { a: 2, b: 1 }, z: 2 }),
  );
  expect(
    FeedbackSubmissionShape.safeParse({ status: 'resolved' }).success,
  ).toBe(false);
});

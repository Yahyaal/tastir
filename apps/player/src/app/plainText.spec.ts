import { evaluate } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { LIBRARY } from './library';
import { sentencesOf } from './StepText';

// Every tutorial is written in simple, controlled English
// (docs/tutorial-writing.md), except those still waiting to be rewritten.
const NOT_YET: readonly string[] = [
  'bou-inania-rosette',
  'bou-inania-twelve-fold-wall',
  'kurt-eight-fold-zellige-filled',
  'kurt-eight-fold-zellige-shifted',
];

// Words the rules replace: "Rule" by "Draw a straight line", "about X" by
// "with centre X", "meets" and "intersects" by "crosses", "bisect" and
// "cut … in half" by "halves".
const BANNED =
  /\b(rule|ruled|rules|about [A-Z]\b|meets?|intersects?|bisects?|cuts? the angle)\b/i;

describe.each(
  LIBRARY.filter((e) => !NOT_YET.includes(e.id)).map(
    (e) => [e.id, e.json] as const,
  ),
)('%s is written in plain steps', (_, json) => {
  const tutorial = parseTutorial(json);
  const scene = evaluate(tutorial);
  const texts = [
    ...tutorial.steps.flatMap((s) => [
      s.text,
      s.textWithoutHelpers,
      ...(s.parts ?? []).flatMap((p) => [p.text, p.textWithoutHelpers]),
    ]),
    tutorial.ink.text,
    ...(tutorial.ink.parts ?? []).map((p) => p.text),
    tutorial.pattern.text,
  ].filter((t): t is string => Boolean(t));
  const sentences = texts.flatMap(sentencesOf);

  it('uses none of the words the rules replace', () => {
    expect(sentences.filter((s) => BANNED.test(s))).toEqual([]);
  });

  it('keeps every step to twelve sentences, so the board keeps its size', () => {
    const long = texts.filter((t) => sentencesOf(t).length > 12);
    expect(long).toEqual([]);
  });

  it('keeps every sentence to twenty words', () => {
    expect(sentences.filter((s) => s.split(/\s+/).length > 20)).toEqual([]);
  });

  it('names points by letters the tutorial makes, never by engine names', () => {
    const isPoint = (n: string) =>
      scene.elements.get(n)?.geometry.kind === 'point';
    const wrong = sentences.flatMap((s) =>
      [...s.matchAll(/\b(?=\w*[A-Za-z])(?=\w*\d)\w+\b|\b[A-Z]{1,4}\b/g)]
        .filter((m) => {
          const word = m[0];
          // "A" opening a sentence before a small word is the article.
          if (word === 'A' && m.index === 0 && /^A [a-z]/.test(s)) return false;
          // A family of points is a letter and a number: S1 … S8.
          if (/^[A-Z]\d+$/.test(word)) return !isPoint(word);
          if (/\d/.test(word)) return true;
          return ![...word].every(isPoint);
        })
        .map((m) => `${m[0]} in “${s}”`),
    );
    expect(wrong).toEqual([]);
  });
});

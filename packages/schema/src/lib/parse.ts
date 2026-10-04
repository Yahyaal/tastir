import type { core } from 'zod';
import { checkReferences, type Issue } from './references.js';
import { TutorialShape, type Tutorial } from './tutorial.js';

/** A tutorial that does not follow the format, with every problem found. */
export class TutorialFormatError extends Error {
  override name = 'TutorialFormatError';

  constructor(readonly issues: readonly Issue[]) {
    super(
      `Invalid tutorial:\n${issues.map((i) => `  - ${i.path || '(root)'}: ${i.message}`).join('\n')}`,
    );
  }
}

const formatPath = (path: readonly PropertyKey[]) =>
  path.reduce<string>(
    (out, key) =>
      typeof key === 'number'
        ? `${out}[${key}]`
        : out
          ? `${out}.${String(key)}`
          : String(key),
    '',
  );

function toIssues(issues: readonly core.$ZodIssue[]): Issue[] {
  return issues.map((i) => ({ path: formatPath(i.path), message: i.message }));
}

export type ParseResult =
  { success: true; tutorial: Tutorial } | { success: false; issues: Issue[] };

/** Checks the shape of a tutorial, then that every reference looks backwards. */
export function safeParseTutorial(input: unknown): ParseResult {
  const shape = TutorialShape.safeParse(input);
  if (!shape.success)
    return { success: false, issues: toIssues(shape.error.issues) };
  const issues = checkReferences(shape.data);
  return issues.length
    ? { success: false, issues }
    : { success: true, tutorial: shape.data };
}

/** The tutorial, or a `TutorialFormatError` listing every problem. */
export function parseTutorial(input: unknown): Tutorial {
  const result = safeParseTutorial(input);
  if (!result.success) throw new TutorialFormatError(result.issues);
  return result.tutorial;
}

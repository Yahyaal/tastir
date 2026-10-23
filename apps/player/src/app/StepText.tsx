/**
 * The sentences of a step's text: a step that asks for several things, one
 * sentence each, reads as a list, so each action stands on its own line.
 * A sentence ends at . ! or ? followed by a space and a capital; a colon or
 * a decimal point (67.5°) does not end one.
 */
export function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z“‘"(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// The verbs a step's actions open with; a sentence that opens otherwise
// ("It crosses line FE at T.") only says what is on the board.
const ACTION =
  /^(draw|join|mark|ink|put|copy|repeat|turn|halve|rule|extend|divide|place|open|set|find|take|keep|click|choose|use|lay|colou?r)\b/i;

/** Whether a sentence asks the learner to do something. */
export const isAction = (sentence: string) => ACTION.test(sentence);

/**
 * A step's text, as a numbered list when it has more than one sentence:
 * the actions are numbered, and a sentence that only says what is on the
 * board sits under them as a note, so it is never taken for work to do.
 * A long list is marked, so a wide screen can set it in two columns.
 */
export function StepText({ text }: { text: string }) {
  const sentences = sentencesOf(text);
  if (sentences.length < 2) return text;
  let n = 0;
  return (
    <ol className={sentences.length > 3 ? 'step-list long' : 'step-list'}>
      {sentences.map((s, i) =>
        isAction(s) ? (
          <li key={i} value={++n}>
            {s}
          </li>
        ) : (
          <li key={i} className="note">
            {s}
          </li>
        ),
      )}
    </ol>
  );
}

/**
 * One icon (and one colour, in styles.css) for each thing the learner can
 * do with a pattern, the same everywhere: see the result (an eye, saffron),
 * watch it drawn (play, blue), draw it along (a pencil, green), make one's
 * own (a plus, terracotta). They are decorative: the words beside them say
 * what the link does.
 */
export type Action = 'result' | 'watch' | 'draw' | 'make';

const PATHS: Record<Action, React.ReactNode> = {
  result: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  watch: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  draw: (
    <>
      <path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5z" />
      <path d="M14 6.5l3 3" />
    </>
  ),
  make: <path d="M12 5v14M5 12h14" />,
};

export function ActionIcon({ action }: { action: Action }) {
  return (
    <svg
      className={`action-icon act-${action}`}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[action]}
    </svg>
  );
}

// The khatam star the lesson and draw along mark each step and phase in.

/** A small sign for each phase after the construction, inside its star. */
export const PHASE_MARKS: Record<'ink' | 'repeat' | 'color', React.ReactNode> =
  {
    ink: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3 13 L13 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    repeat: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    color: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 1 L10 6 L15 8 L10 10 L8 15 L6 10 L1 8 L6 6 Z"
          fill="currentColor"
        />
      </svg>
    ),
  };

/** The phases' names, as the timelines show them. */
export const PHASE_NAMES = {
  ink: 'Ink',
  repeat: 'Repeat',
  color: 'Color',
} as const;

/** The eight-pointed khatam star each step and phase sits in. */
export function Khatam() {
  return (
    <svg className="khatam" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="23,12 19.8,15.2 19.8,19.8 15.2,19.8 12,23 8.8,19.8 4.2,19.8 4.2,15.2 1,12 4.2,8.8 4.2,4.2 8.8,4.2 12,1 15.2,4.2 19.8,4.2 19.8,8.8" />
    </svg>
  );
}

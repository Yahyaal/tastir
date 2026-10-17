/** A smiling eight-point zellige tile in Tastir's theme-aware glaze colors. */
export function AssistantIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path
        d="m20 2 5 6 8-1-1 8 6 5-6 5 1 8-8-1-5 6-5-6-8 1 1-8-6-5 6-5-1-8 8 1Z"
        fill="var(--act-watch)"
        stroke="var(--act-watch)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m20 2 5 6-5 12-5-12Zm0 36-5-6 5-12 5 12Z"
        fill="var(--act-result)"
      />
      <path
        d="m2 20 6-5 12 5-12 5Zm36 0-6 5-12-5 12-5Z"
        fill="var(--theme-accent-cobalt)"
      />
      <path
        d="m7 7 8 1 5 12-12-5Zm26 26-8-1-5-12 12 5Z"
        fill="var(--act-draw)"
      />
      <circle cx="20" cy="20" r="9.3" fill="var(--theme-bg-card)" />
      <path
        d="M15.5 18.5v1m9-1v1"
        stroke="var(--theme-text-primary)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M17 23q3 3 6 0"
        stroke="var(--theme-text-primary)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <ellipse
        cx="13.8"
        cy="22"
        rx="1.6"
        ry="1"
        fill="var(--act-make)"
        opacity=".6"
      />
      <ellipse
        cx="26.2"
        cy="22"
        rx="1.6"
        ry="1"
        fill="var(--act-make)"
        opacity=".6"
      />
    </svg>
  );
}

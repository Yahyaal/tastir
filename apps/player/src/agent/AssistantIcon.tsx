/** A small compass companion, drawn in the app's own ink and glaze colors. */
export function AssistantIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M10 8 7 4M22 8l3-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="8"
        width="22"
        height="19"
        rx="8"
        fill="var(--theme-accent-muted)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="16" r="1.8" fill="currentColor" />
      <circle cx="20" cy="16" r="1.8" fill="currentColor" />
      <path
        d="M12 21q4 4 8 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

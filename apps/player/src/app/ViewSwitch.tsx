/** The three ways to see a pattern, as on the library's cards. */
export type View = 'watch' | 'result' | 'draw';

/** The address of a pattern in a view. */
export function viewAddress(id: string, view: View): string {
  return `#/${id}${view === 'result' ? '/result' : view === 'draw' ? '/draw' : ''}`;
}

const NAMES: Record<View, string> = {
  watch: 'Watch it drawn',
  result: 'Result',
  draw: 'Draw along',
};

/**
 * Switches between watching the pattern drawn, its result and drawing
 * along. Each is a link to its address; a page that already holds a view
 * (the player holds both watch and result) passes `onShow` to show it in
 * place instead of loading the pattern again.
 */
export function ViewSwitch({
  id,
  view,
  onShow,
}: {
  id: string;
  view: View;
  onShow?: (view: View) => boolean;
}) {
  return (
    <nav className="view-switch" aria-label="How to see this pattern">
      {(['watch', 'result', 'draw'] as const).map((v) => (
        <a
          key={v}
          href={viewAddress(id, v)}
          aria-current={v === view ? 'page' : undefined}
          onClick={(e) => {
            if (onShow?.(v)) e.preventDefault();
          }}
        >
          {NAMES[v]}
        </a>
      ))}
    </nav>
  );
}

import { useState } from 'react';
import { SYMMETRIES, TOOLS, type Symmetry, type ToolId } from './tools';

/**
 * The drawing tools, the symmetry switch, Undo and Redo, each with a
 * tooltip that says what it does in plain words. The editor and the
 * draw-along board share it; `hinted` rings the tool a hint points at.
 * Given `only`, it shows just those tools (and the one chosen or hinted),
 * with the rest a click away under More tools.
 */
export function ToolBar({
  tool,
  onTool,
  symmetry,
  onSymmetry,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hinted,
  only,
  children,
}: {
  /** The chosen tool, if any. */
  tool?: ToolId;
  onTool: (id: ToolId) => void;
  symmetry: Symmetry;
  onSymmetry: (n: Symmetry) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** The tool a hint rings. */
  hinted?: ToolId;
  /** The tools this step needs, shown first; the others wait under More. */
  only?: readonly ToolId[];
  /** Anything else, just before Undo. */
  children?: React.ReactNode;
}) {
  const [more, setMore] = useState(false);
  const main = (t: (typeof TOOLS)[number]) =>
    !only || only.includes(t.id) || t.id === tool || t.id === hinted;
  const button = (t: (typeof TOOLS)[number], close = false) => (
    <button
      key={t.id}
      type="button"
      className={[
        'tool',
        t.id === tool ? 'on' : '',
        t.id === hinted ? 'hinted' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={t.id === tool}
      title={t.does}
      aria-description={t.does}
      onClick={() => {
        onTool(t.id);
        if (close) setMore(false);
      }}
    >
      <b aria-hidden="true">{t.icon}</b>
      {t.label}
    </button>
  );
  const others = TOOLS.filter((t) => !main(t));
  return (
    <div className="editor-tools" role="toolbar" aria-label="Tools">
      {TOOLS.filter(main).map((t) => button(t))}
      {/* The other tools open below the bar, over the board, so the board
          never moves when they show. */}
      {only && others.length ? (
        <span className="more-tools-wrap">
          <button
            type="button"
            className="tool more-tools"
            aria-expanded={more}
            onClick={() => setMore(!more)}
          >
            {more ? 'Fewer tools' : 'More tools'}
          </button>
          {more ? (
            <span className="more-tools-menu">
              {others.map((t) => button(t, true))}
            </span>
          ) : null}
        </span>
      ) : null}
      <label className="tool symmetry" title={SYMMETRY_DOES}>
        Symmetry
        <select
          value={symmetry}
          aria-description={SYMMETRY_DOES}
          onChange={(e) => onSymmetry(Number(e.target.value) as Symmetry)}
        >
          {SYMMETRIES.map((n) => (
            <option key={n} value={n}>
              {n ? `×${n}` : 'Off'}
            </option>
          ))}
        </select>
      </label>
      <span className="tool-gap" />
      {children}
      <button
        type="button"
        className="tool"
        title={UNDO_DOES}
        aria-description={UNDO_DOES}
        onClick={onUndo}
        disabled={!canUndo}
      >
        Undo
      </button>
      <button
        type="button"
        className="tool"
        title={REDO_DOES}
        aria-description={REDO_DOES}
        onClick={onRedo}
        disabled={!canRedo}
      >
        Redo
      </button>
    </div>
  );
}

const SYMMETRY_DOES =
  'Repeat everything you draw round the centre, this many times, as if you drew each copy by hand.';
const UNDO_DOES = 'Take back the last thing you did.';
const REDO_DOES = 'Put back what Undo took away.';

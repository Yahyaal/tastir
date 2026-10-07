import { useState } from 'react';
import {
  addDesign,
  NAME_LIMIT,
  updateDesign,
  type Design,
  type DesignFields,
} from './designs';

const REFUSED =
  'Not saved: this browser would not keep the design, because its storage is blocked (a private window) or full. Your inking and colors are still on this page.';

/**
 * Keeps the learner's inking and colors as a design in this browser: “Save
 * as my design” asks for a name in the page; a design already saved (or
 * opened from the shelf) has “Save” to update it and “Save as new”.
 */
export function SaveDesign({
  title,
  fields,
  design,
  onSaved,
  lost = false,
  changed = false,
}: {
  /** The tutorial's title, the name a new design starts with. */
  title: string;
  /** The design as the player has it now, read when saving. */
  fields: () => Omit<DesignFields, 'name'>;
  /** The design being worked on, if it was saved or opened. */
  design?: Design;
  onSaved: (design: Design) => void;
  /** The saved inking no longer fitted, so the tutorial's own is shown. */
  lost?: boolean;
  /** Whether the design has changes that are not saved yet. */
  changed?: boolean;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [said, setSaid] = useState<{ text: string; refused?: boolean }>();

  const keep = (saved: Design | undefined) => {
    if (!saved) return setSaid({ text: REFUSED, refused: true });
    onSaved(saved);
    setNaming(false);
    setSaid({
      text: `Saved as “${saved.name}”. It is on the home page, under My designs.`,
    });
  };
  const ask = () => {
    setName(design ? `${design.name} (2)` : title);
    setSaid(undefined);
    setNaming(true);
  };

  return (
    <div className="design-tools">
      {lost ? (
        <p className="hint lost">
          The tutorial has changed since this design was saved, so it shows the
          tutorial’s own lines. Your colors are kept.
        </p>
      ) : null}
      {naming ? (
        <form
          className="design-name"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim())
              keep(addDesign({ ...fields(), name: name.trim() }));
          }}
        >
          <label>
            Name
            <input
              type="text"
              value={name}
              maxLength={NAME_LIMIT}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setNaming(false);
              }}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button type="submit" disabled={!name.trim()}>
            Save
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => setNaming(false)}
          >
            Cancel
          </button>
        </form>
      ) : design ? (
        <div className="design-buttons">
          <span>
            Your design <b>{design.name}</b>
          </span>
          <button
            type="button"
            className={changed ? 'unsaved' : 'secondary'}
            disabled={!changed}
            onClick={() =>
              // Deleted meanwhile (in another tab): kept again as new.
              keep(
                updateDesign(design.id, fields()) ??
                  addDesign({ ...fields(), name: design.name }),
              )
            }
          >
            {changed ? 'Save' : 'Saved'}
          </button>
          <button type="button" className="secondary" onClick={ask}>
            Save as new
          </button>
        </div>
      ) : (
        <div className="design-buttons">
          <button type="button" className="secondary" onClick={ask}>
            Save as my design
          </button>
          <span>Keeps your inking and colors in this browser.</span>
        </div>
      )}
      {design && changed && !naming ? (
        <p className="hint unsaved-note">● Unsaved changes</p>
      ) : null}
      {said?.refused ? (
        <p className="hint refused" role="alert">
          {said.text}
        </p>
      ) : said && !naming && !changed ? (
        <p className="hint" role="status">
          {said.text}
        </p>
      ) : null}
    </div>
  );
}

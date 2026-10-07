import { useEffect, useState } from 'react';
import { tutorialOf } from '../editor/finish';
import { decodeShared, encodeShared, type Shared } from '../editor/files';
import { addPattern, freeTitle, getPattern } from '../editor/patterns';
import { addDesign, type Design, type DesignFields } from './designs';
import type { Entry } from './library';

/**
 * “Copy a share link”: the pattern, its inking and its colours in one
 * address, which opens the same wall in another browser. A library
 * tutorial is named by its id; a learner's own pattern travels whole.
 */
export function ShareLink({
  address,
  fields,
  name,
}: {
  /** Where the tutorial lives: a library id, or mine/<id>. */
  address: string;
  /** The design as the player has it now. */
  fields: () => Omit<DesignFields, 'name' | 'tutorial'>;
  name: string;
}) {
  const [link, setLink] = useState<string>();
  const [said, setSaid] = useState<string>();
  const make = async () => {
    const own = /^mine\/(.+)$/.exec(address)?.[1];
    const pattern = own ? getPattern(own) : undefined;
    if (own && !pattern)
      return setSaid('This pattern is no longer in this browser.');
    const { inked, ...rest } = fields();
    const shared: Shared = {
      ...(pattern
        ? {
            tutorial: pattern.tutorial,
            ...(pattern.basedOn ? { basedOn: pattern.basedOn } : {}),
          }
        : { library: address }),
      design: { name, ...(inked ? { inked } : {}), ...rest },
    };
    const code = await encodeShared(shared);
    const url = `${window.location.origin}${window.location.pathname}#/shared/${code}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setSaid('Copied. Anyone who opens it sees this wall, in any browser.');
    } catch {
      setSaid('Copy the link below; anyone who opens it sees this wall.');
    }
  };
  return (
    <div className="share-link">
      <button type="button" className="quiet" onClick={() => void make()}>
        Copy a share link
      </button>
      {said ? (
        <p className="hint" role="status">
          {said}
        </p>
      ) : null}
      {link ? (
        <input
          type="text"
          readOnly
          aria-label="Share link"
          value={link}
          onFocus={(e) => e.target.select()}
        />
      ) : null}
    </div>
  );
}

/** What a share link opens: the tutorial to play and the design to show. */
export type Opened =
  | {
      readonly json: unknown;
      readonly design: Design;
      readonly keep: () => string | undefined;
    }
  | { readonly reason: string };

/** Reads a share link's payload into something the player can show. */
export function openShared(shared: Shared, library: readonly Entry[]): Opened {
  const d = shared.design;
  let json: unknown;
  if (shared.library !== undefined) {
    json = library.find((e) => e.id === shared.library)?.json;
    if (json === undefined)
      return { reason: 'The pattern this link names is not in the library.' };
  } else if (shared.tutorial) {
    const made = tutorialOf(shared.tutorial);
    if (!('tutorial' in made))
      return { reason: `The shared pattern cannot be played: ${made.reason}` };
    json = made.tutorial;
  }
  const at = new Date().toISOString();
  const fields = {
    name: d?.name ?? 'Shared design',
    ...(d?.inked ? { inked: d.inked } : {}),
    coloring: d?.coloring ?? { palette: 'Fès tile', chosen: {} },
    look: d?.look ?? 'tiles',
    grout: d?.grout ?? 1,
  };
  return {
    json,
    design: {
      ...fields,
      id: 'shared',
      tutorial: 'shared',
      created: at,
      updated: at,
    },
    // Keeps the pattern (when it travelled whole) and the design here;
    // the design's address, or undefined when the browser refused.
    keep: () => {
      let address = shared.library;
      if (shared.tutorial) {
        const p = addPattern(
          { ...shared.tutorial, title: freeTitle(shared.tutorial.title) },
          shared.basedOn,
        );
        if (!p) return undefined;
        address = `mine/${p.id}`;
      }
      if (!address) return undefined;
      const kept = addDesign({ ...fields, tutorial: address });
      return kept ? `#/${address}/design/${kept.id}` : undefined;
    },
  };
}

/** Decodes a share link's code (async: it may be compressed). */
export function useShared(code: string): Shared | undefined | null {
  // undefined while reading; null when the link cannot be read.
  const [shared, setShared] = useState<Shared | null>();
  useEffect(() => {
    let live = true;
    void decodeShared(code).then((s) => live && setShared(s ?? null));
    return () => {
      live = false;
    };
  }, [code]);
  return shared;
}

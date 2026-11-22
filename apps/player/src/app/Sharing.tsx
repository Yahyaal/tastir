import type { SharedPresentation } from '@tastir/schema';
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
  compact = false,
  short = false,
  presentation,
}: {
  /** In Make it yours: one word, “Share”, said in full on hover; a phone
   * offers its own share sheet. Implies compact. */
  short?: boolean;
  /** In the step bar: the explanation is a tooltip, and “Copied” shows
   * for a few seconds (the link itself only when it could not be copied). */
  compact?: boolean;
  presentation?: () => SharedPresentation;
  /** Where the tutorial lives: a library id, or mine/<id>. */
  address: string;
  /** The design as the player has it now. */
  fields: () => Omit<DesignFields, 'name' | 'tutorial'>;
  name: string;
}) {
  const [link, setLink] = useState<string>();
  const [said, setSaid] = useState<string>();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!(compact || short) || !copied) return;
    const t = setTimeout(() => {
      setSaid(undefined);
      setCopied(false);
    }, 5000);
    return () => clearTimeout(t);
  }, [compact, short, copied]);
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
      ...(presentation ? { presentation: presentation() } : {}),
    };
    setLink(undefined);
    setCopied(false);
    let code: string;
    try {
      code = await encodeShared(shared);
    } catch (e) {
      setSaid(
        e instanceof Error
          ? e.message
          : 'The share link could not be made. Try downloading a pattern file instead.',
      );
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#/shared/${code}`;
    setLink(url);
    // A phone's own share sheet, when it has one.
    if (
      short &&
      typeof navigator.share === 'function' &&
      window.matchMedia?.('(pointer: coarse)').matches
    ) {
      try {
        await navigator.share({ title: name, url });
        setCopied(true);
        return;
      } catch {
        // Closed or refused: copy it instead.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setSaid('Copied. Anyone who opens it sees this wall, in any browser.');
      setCopied(true);
    } catch {
      setSaid('Copy the link below; anyone who opens it sees this wall.');
    }
  };
  return (
    <div className="share-link">
      <button
        type="button"
        className={compact || short ? 'secondary' : 'quiet'}
        title={
          short
            ? 'Copy a link to this design: anyone who opens it sees this wall'
            : compact
              ? 'Anyone with the link sees this design'
              : undefined
        }
        onClick={() => void make()}
      >
        {compact && !short ? (
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m10 9 3-3a4.2 4.2 0 0 1 6 6l-3 3M14 15l-3 3a4.2 4.2 0 0 1-6-6l3-3M8 16l8-8" />
          </svg>
        ) : null}
        {short ? 'Share' : 'Copy a share link'}
      </button>
      {said ? (
        <p className="hint" role="status">
          {said}
        </p>
      ) : null}
      {link && !((compact || short) && copied) ? (
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
      readonly presentation?: SharedPresentation;
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
    ...(d?.colorings ? { colorings: d.colorings } : {}),
    look: d?.look ?? 'tiles',
    grout: d?.grout ?? 1,
    ...(d?.jali ? { jali: d.jali } : {}),
    ...(d?.pen ? { pen: d.pen } : {}),
  };
  return {
    json,
    ...(shared.presentation ? { presentation: shared.presentation } : {}),
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

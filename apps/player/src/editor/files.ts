import { safeParseTutorial } from '@tastir/schema';
import { check, type Draft } from './document';
import type { UserPattern } from './patterns';

/**
 * A pattern as a file the learner keeps or sends: the whole draft (steps,
 * tile, ink and all) and where it was copied from. A finished pattern can
 * also be saved as a plain tutorial file; both open again.
 */
export interface PatternFile {
  readonly tastir: 'pattern';
  readonly version: 1;
  readonly tutorial: Draft;
  readonly basedOn?: UserPattern['basedOn'];
}

export const patternFile = (p: UserPattern): PatternFile => ({
  tastir: 'pattern',
  version: 1,
  tutorial: p.tutorial,
  ...(p.basedOn ? { basedOn: p.basedOn } : {}),
});

const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * A pattern read back from a file's text: a pattern file, or a tutorial
 * file (from the library or the editor). Anything else, or a file whose
 * steps the engine cannot even read, gives the reason in plain words.
 */
export function readPattern(text: string):
  | {
      readonly tutorial: Draft;
      readonly basedOn?: UserPattern['basedOn'];
      /** Whether it was a pattern file, not a plain tutorial file. */
      readonly pattern: boolean;
    }
  | { readonly reason: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { reason: 'This is not a pattern file: it is not JSON.' };
  }
  if (!isObject(data))
    return { reason: 'This is not a pattern file: it holds no pattern.' };
  const wrapped = data['tastir'] === 'pattern';
  const tutorial = wrapped ? data['tutorial'] : data;
  if (
    !isObject(tutorial) ||
    typeof tutorial['title'] !== 'string' ||
    !Array.isArray(tutorial['steps'])
  )
    return {
      reason: 'This is not a pattern file: it has no title and steps.',
    };
  // A finished tutorial is checked in full; a draft only needs steps the
  // engine can read (broken ones open marked in red).
  const full = safeParseTutorial(tutorial);
  try {
    check(tutorial as unknown as Draft);
  } catch {
    if (!full.success)
      return {
        reason:
          'This pattern file is damaged: its steps cannot be read. ' +
          (full.issues[0]?.message ?? ''),
      };
  }
  const basedOn =
    wrapped && isObject(data['basedOn']) ? data['basedOn'] : undefined;
  return {
    pattern: wrapped,
    tutorial: (full.success ? full.tutorial : tutorial) as Draft,
    ...(basedOn ? { basedOn: basedOn as UserPattern['basedOn'] } : {}),
  };
}

/**
 * A share link's payload: a pattern, and how it was inked and coloured, so
 * the link opens the same wall in another browser.
 */
export interface Shared {
  /** A library tutorial by id, or a learner's whole pattern. */
  readonly library?: string;
  readonly tutorial?: Draft;
  readonly basedOn?: UserPattern['basedOn'];
  readonly design?: {
    readonly name: string;
    readonly inked?: readonly string[];
    readonly coloring: { palette: string; chosen: Record<string, string> };
    readonly look: 'tiles' | 'strapwork' | 'lines';
    readonly grout: number;
  };
}

const toBase64Url = (bytes: Uint8Array) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (text: string) => {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/**
 * The payload as text for an address: compressed where the browser can
 * (z…), else plain (j…), both in URL-safe base64.
 */
export async function encodeShared(shared: Shared): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(shared));
  if (typeof CompressionStream === 'function') {
    try {
      return `z${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
    } catch {
      // Fall back to the plain form.
    }
  }
  return `j${toBase64Url(bytes)}`;
}

/** The payload back from an address; undefined when it cannot be read. */
export async function decodeShared(text: string): Promise<Shared | undefined> {
  try {
    const raw = fromBase64Url(text.slice(1));
    const bytes =
      text[0] === 'z'
        ? await pipe(raw, new DecompressionStream('deflate-raw'))
        : raw;
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!isObject(data)) return undefined;
    if (typeof data['library'] !== 'string' && !isObject(data['tutorial']))
      return undefined;
    return data as Shared;
  } catch {
    return undefined;
  }
}

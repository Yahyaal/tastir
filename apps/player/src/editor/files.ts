import type { Coloring } from '../app/coloring';
import type { WallStyle } from '../app/Wall';
import {
  type JaliAppearance,
  type SharedPresentation,
  SharedPresentationShape,
  SharedDesignShape,
  type PenLook,
  BasedOnShape,
  DraftShape,
  SharedShape,
  safeParseTutorial,
} from '@tastir/schema';
import type { Draft } from './document';
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

/** Version 2 keeps a viewer's editable construction and its current design.
 * Version 1 remains the editor's format for unfinished drawings. */
export interface ViewPatternFile extends Omit<PatternFile, 'version'> {
  readonly version: 2;
  readonly design: NonNullable<Shared['design']>;
}
export function viewPatternFile(
  tutorial: Draft,
  design: NonNullable<Shared['design']>,
  basedOn?: UserPattern['basedOn'],
): ViewPatternFile {
  const full = safeParseTutorial(tutorial);
  const appearance = SharedDesignShape.safeParse(design);
  if (
    !full.success ||
    !appearance.success ||
    (basedOn && !BasedOnShape.safeParse(basedOn).success)
  )
    throw new Error(
      'This pattern could not be downloaded because its construction or design is incomplete.',
    );
  return {
    tastir: 'pattern',
    version: 2,
    tutorial: full.tutorial,
    design: appearance.data,
    ...(basedOn ? { basedOn } : {}),
  };
}

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_LINK_CHARS = 2 * 1024 * 1024;

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
      readonly design?: NonNullable<Shared['design']>;
      /** Whether it was a pattern file, not a plain tutorial file. */
      readonly pattern: boolean;
    }
  | { readonly reason: string } {
  if (text.length > MAX_FILE_BYTES)
    return { reason: 'This pattern file is too large to open (8 MB maximum).' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { reason: 'This is not a pattern file: it is not JSON.' };
  }
  if (!isObject(data))
    return { reason: 'This is not a pattern file: it holds no pattern.' };
  const wrapped = data['tastir'] === 'pattern';
  if (wrapped && data['version'] !== 1 && data['version'] !== 2)
    return {
      reason:
        'This pattern file uses an unsupported version. Keep the original file and open it in the version of Tastir that created it.',
    };
  const tutorial = wrapped ? data['tutorial'] : data;
  if (
    !isObject(tutorial) ||
    typeof tutorial['title'] !== 'string' ||
    !Array.isArray(tutorial['steps'])
  )
    return { reason: 'This is not a pattern file: it has no title and steps.' };
  const draft = DraftShape.safeParse(tutorial);
  if (!draft.success)
    return {
      reason:
        'This pattern file is damaged: ' +
        (draft.error.issues[0]?.message ?? 'its steps cannot be read.'),
    };
  const basedOn =
    wrapped && data['basedOn'] !== undefined
      ? BasedOnShape.safeParse(data['basedOn'])
      : undefined;
  if (basedOn && !basedOn.success)
    return { reason: 'This pattern file has damaged source information.' };
  const full = safeParseTutorial(draft.data);
  const design =
    wrapped && data['design'] !== undefined
      ? SharedDesignShape.safeParse(data['design'])
      : undefined;
  if (
    (design && !design.success) ||
    (wrapped && data['version'] === 2 && (!design || !full.success))
  )
    return {
      reason:
        'This pattern file has a damaged or incomplete drawing or design.',
    };
  return {
    pattern: wrapped,
    tutorial: full.success ? full.tutorial : draft.data,
    ...(basedOn?.success ? { basedOn: basedOn.data } : {}),
    ...(design?.success ? { design: design.data } : {}),
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
  readonly presentation?: SharedPresentation;
  readonly design?: {
    readonly name: string;
    readonly inked?: readonly string[];
    readonly coloring: Coloring;
    readonly colorings?: Partial<Record<WallStyle, Coloring>>;
    readonly look: WallStyle;
    readonly grout: number;
    readonly jali?: JaliAppearance;
    readonly pen?: PenLook;
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
  const reader = out.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FILE_BYTES) {
        await reader.cancel();
        throw new Error('This shared pattern is too large to open.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytesOut = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytesOut.set(chunk, offset);
    offset += chunk.length;
  }
  return bytesOut;
}

/**
 * The payload as text for an address: compressed where the browser can
 * (z…), else plain (j…), both in URL-safe base64.
 */
export async function encodeShared(shared: Shared): Promise<string> {
  if (
    shared.presentation &&
    !SharedPresentationShape.safeParse(shared.presentation).success
  )
    throw new Error(
      'This view cannot be shared because its settings are invalid.',
    );
  const bytes = new TextEncoder().encode(JSON.stringify(shared));
  const tooLarge = () =>
    new Error(
      'This pattern is too large for a share link. Download a pattern file instead.',
    );
  if (bytes.byteLength > MAX_FILE_BYTES) throw tooLarge();
  let code: string | undefined;
  if (typeof CompressionStream === 'function') {
    try {
      code = `z${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
    } catch {
      // Fall back to the plain form.
    }
  }
  code ??= `j${toBase64Url(bytes)}`;
  if (code.length > MAX_LINK_CHARS) throw tooLarge();
  return code;
}

/** The payload back from an address; undefined when it cannot be read. */
export async function decodeShared(text: string): Promise<Shared | undefined> {
  try {
    if (text.length > MAX_LINK_CHARS || !/^[jz][A-Za-z0-9_-]+$/.test(text))
      return undefined;
    const raw = fromBase64Url(text.slice(1));
    const bytes =
      text[0] === 'z'
        ? await pipe(raw, new DecompressionStream('deflate-raw'))
        : raw;
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const parsed = SharedShape.safeParse(data);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

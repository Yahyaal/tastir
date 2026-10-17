import { z } from 'zod';
import { StudioError } from './ops.js';
import { blind, judge, listContests } from './contest.js';
import {
  AlignRequest,
  EditRequest,
  ImportRequest,
  LONGEST_WAIT,
  MarkRequest,
  NewShape,
  NoteRequest,
  QuestionRequest,
  ReferenceRequest,
  Studio,
  TravelRequest,
} from './studio.js';

/**
 * The studio's requests, apart from how they arrive: the local service
 * calls this for each request that passed its secret check, and the hosted
 * server's tools call it directly, so both answer exactly the same.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Answer =
  | { readonly kind: 'json'; readonly value: unknown }
  | {
      readonly kind: 'png';
      readonly png: Buffer;
      readonly revision: number;
      readonly size: number;
    }
  | {
      readonly kind: 'file';
      readonly name: string;
      readonly type: string;
      readonly bytes: Buffer;
    };

const json = (value: unknown): Answer => ({ kind: 'json', value });

export async function route(
  studio: Studio,
  method: string,
  url: URL,
  body: () => Promise<unknown>,
): Promise<Answer> {
  const parts = url.pathname.split('/').filter(Boolean);
  if (method === 'GET' && url.pathname === '/projects')
    return json(await studio.list());
  if (method === 'GET' && url.pathname === '/library')
    return json(await studio.library());
  if (method === 'POST' && url.pathname === '/projects/import')
    return json(await studio.importZip(ImportRequest.parse(await body())));
  if (method === 'POST' && url.pathname === '/projects')
    return json(await studio.create(NewShape.parse(await body())));
  if (parts[0] === 'contests') {
    const root = studio.root;
    const all = await listContests(root);
    if (method === 'GET' && !parts[1]) return json(all.map(blind));
    const contest = all.find((c) => c.id === parts[1]);
    if (!contest) throw new HttpError(404, 'There is no such contest.');
    if (method === 'GET' && !parts[2]) return json(blind(contest));
    if (method === 'POST' && parts[2] === 'judge') {
      const verdict = z
        .strictObject({
          pick: z.string().optional(),
          rejected: z.array(z.string()).max(50).optional(),
        })
        .parse(await body());
      try {
        return json(blind(await judge(root, contest.id, verdict)));
      } catch (e) {
        throw new HttpError(400, e instanceof Error ? e.message : String(e));
      }
    }
  }
  if (parts[0] === 'projects' && parts[1]) {
    const id = parts[1];
    const what = parts[2] ?? '';
    if (method === 'GET' && what === '') return json(await studio.view(id));
    if (method === 'GET' && what === 'pulse')
      return json(await studio.pulse(id));
    if (method === 'GET' && what === 'export') {
      const zip = await studio.exportZip(id);
      return { kind: 'file', type: 'application/zip', ...zip };
    }
    if (method === 'GET' && what === 'draft')
      return json(await studio.draft(id));
    if (method === 'GET' && what === 'picture') {
      const q = url.searchParams;
      const asked = q.get('what');
      const kind =
        asked === 'wall' || asked === 'reference' || asked === 'overlay'
          ? asked
          : 'construction';
      const box = ['x', 'y', 'width', 'height'].map((k) => Number(q.get(k)));
      const area = q.has('width')
        ? {
            x: box[0] ?? 0,
            y: box[1] ?? 0,
            width: box[2] ?? 0,
            height: box[3] ?? 0,
          }
        : undefined;
      if (area && Object.values(area).some((v) => !Number.isFinite(v)))
        throw new HttpError(
          400,
          'Give the area as numbers x, y, width and height.',
        );
      const picture = await studio.picture(
        id,
        kind,
        Number(q.get('size') ?? 768) || 768,
        area,
      );
      return { kind: 'png', ...picture };
    }
    if (method === 'POST' && what === 'reference' && !parts[3])
      return json(
        await studio.setReference(id, ReferenceRequest.parse(await body())),
      );
    if (method === 'POST' && what === 'reference' && parts[3] === 'align')
      return json(await studio.align(id, AlignRequest.parse(await body())));
    if (method === 'GET' && what === 'marks')
      return json(await studio.marks(id));
    if (method === 'POST' && what === 'marks' && !parts[3])
      return json(await studio.point(id, MarkRequest.parse(await body())));
    if (method === 'POST' && what === 'marks' && parts[3] === 'clear') {
      const { author } = z
        .strictObject({ author: z.string().optional() })
        .parse(await body());
      return json(await studio.clearMarks(id, author));
    }
    if (method === 'POST' && what === 'questions' && !parts[3])
      return json(await studio.ask(id, QuestionRequest.parse(await body())));
    if (method === 'GET' && what === 'questions' && parts[3]) {
      const wait = Math.max(
        0,
        Math.min(LONGEST_WAIT, Number(url.searchParams.get('wait') ?? 0) || 0),
      );
      return json(await studio.answer(id, Number(parts[3]), wait));
    }
    if (method === 'GET' && what === 'check')
      return json(await studio.check(id));
    if (method === 'GET' && what === 'notes')
      return json(
        await studio.notes(id, Number(url.searchParams.get('after') ?? 0) || 0),
      );
    if (method === 'POST' && what === 'edit')
      return json(await studio.edit(id, EditRequest.parse(await body())));
    if (method === 'POST' && what === 'travel')
      return json(await studio.travel(id, TravelRequest.parse(await body())));
    if (method === 'POST' && what === 'notes')
      return json(await studio.note(id, NoteRequest.parse(await body())));
  }
  throw new HttpError(404, 'There is no such studio address.');
}

/** The status and message for a request that failed. */
export function failure(error: unknown): { status: number; error: string } {
  if (error instanceof HttpError)
    return { status: error.status, error: error.message };
  if (error instanceof StudioError)
    return { status: 400, error: error.message };
  if (error instanceof z.ZodError)
    return {
      status: 400,
      error: `The request did not match: ${error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.') || 'request'}: ${i.message}`)
        .join('; ')}`,
    };
  console.error(error);
  return { status: 500, error: 'The studio could not finish this request.' };
}

/**
 * The studio called in this process, as the hosted server's tools call it:
 * the same requests and answers as over the local service, without HTTP.
 */
export class DirectClient {
  constructor(private readonly studio: Studio) {}

  private async answer(method: string, path: string, data?: unknown) {
    try {
      return await route(
        this.studio,
        method,
        new URL(path, 'http://studio'),
        async () => data ?? {},
      );
    } catch (error) {
      throw new Error(failure(error).error);
    }
  }

  async call(method: 'GET' | 'POST', path: string, data?: unknown) {
    const answer = await this.answer(method, path, data);
    if (answer.kind !== 'json') throw new Error('That is a picture.');
    return answer.value;
  }

  async picture(path: string) {
    const answer = await this.answer('GET', path);
    if (answer.kind !== 'png') throw new Error('That is not a picture.');
    return {
      data: answer.png.toString('base64'),
      revision: answer.revision,
      size: answer.size,
    };
  }
}

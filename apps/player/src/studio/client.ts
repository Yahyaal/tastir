/**
 * Calls to the studio through the dev server, which adds the studio's
 * secret (pnpm studio sets this up; vite.config.mts holds the proxy).
 */
export interface ProjectLine {
  readonly id: string;
  readonly title: string;
  readonly updated: string;
  readonly revision: number;
}

export interface HistoryLine {
  readonly author: string;
  readonly label: string;
  readonly at: string;
}

export async function studioCall<T>(
  method: 'GET' | 'POST',
  path: string,
  data?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/__studio${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
  } catch {
    throw new Error('The studio is not answering. Start it with pnpm studio.');
  }
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error(
      'The studio is not running here. Start it with pnpm studio and open the address it prints.',
    );
  const value = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(value.error ?? 'The studio could not do that.');
  return value;
}

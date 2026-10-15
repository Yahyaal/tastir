export class AgentError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/** Upstream bodies and exceptions can contain credentials; never reflect them. */
export function publicError(error: unknown) {
  return error instanceof AgentError
    ? { code: error.code, message: error.message, status: error.status }
    : {
        code: 'local_error',
        message:
          'The local assistant could not finish this request. Try again.',
        status: 500,
      };
}

export async function jsonRequest(
  fetcher: typeof fetch,
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetcher(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw new AgentError(
      'connection_failed',
      `OpenAI returned HTTP ${response.status}. Reconnect your account or try again.`,
      502,
    );
  return response.json();
}

export class AgentError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/** Only exact documented codes identify a plan restriction; never reflect upstream text. */
export function planError(code: unknown): AgentError | undefined {
  if (code === 'subscription_sharing_usage_limit_exceeded')
    return new AgentError(
      'usage_limit',
      'ChatGPT reported a usage limit for this app or your plan. Check Manage usage before trying again.',
      429,
    );
  if (code === 'subscription_sharing_usage_unavailable')
    return new AgentError(
      'usage_unavailable',
      'OpenAI could not check ChatGPT usage right now. Wait a moment before trying again. This does not confirm that your allowance is used up.',
      503,
    );
  if (code === 'subscription_sharing_user_not_eligible')
    return new AgentError(
      'plan_unavailable',
      'ChatGPT plan usage is unavailable for this account or workspace. Check its plan access and policies.',
      403,
    );
  return undefined;
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

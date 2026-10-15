import {
  ModelsShape,
  ReplyShape,
  StatusShape,
  type Snapshot,
  type ToolResult,
} from '@tastir/agent-protocol';

export class AgentClient {
  private tab = crypto.randomUUID();
  private runId: string | null = null;
  async request(
    path: string,
    data?: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const response = await fetch(`/__agent${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      credentials: 'omit',
      signal,
      headers: { 'Content-Type': 'application/json', 'X-Tastir-Tab': this.tab },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw new Error(
        'Start the local companion with pnpm dev:agent, then open its assistant address.',
      );
    const value: unknown = await response.json();
    if (!response.ok) {
      const error = value as { error?: { message?: string } };
      throw new Error(
        error.error?.message ??
          'The local assistant could not complete the request.',
      );
    }
    return value;
  }
  async status() {
    return StatusShape.parse(await this.request('/status'));
  }
  async models(signal?: AbortSignal) {
    return ModelsShape.parse(await this.request('/models', undefined, signal));
  }
  async start(
    model: string,
    prompt: string,
    snapshot: Snapshot,
    signal: AbortSignal,
  ) {
    const requestId = crypto.randomUUID();
    this.runId = requestId;
    return ReplyShape.parse(
      await this.request(
        '/turn/start',
        { requestId, model, prompt, snapshot },
        signal,
      ),
    );
  }
  async resume(
    runId: string,
    results: ToolResult[],
    signal: AbortSignal,
    snapshot?: Snapshot,
  ) {
    return ReplyShape.parse(
      await this.request(
        '/turn/continue',
        { runId, results, ...(snapshot ? { snapshot } : {}) },
        signal,
      ),
    );
  }
  async stop() {
    const runId = this.runId;
    this.runId = null;
    if (runId) await this.request('/turn/cancel', { runId });
  }
}

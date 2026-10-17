import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** A real Streamable HTTP MCP client; model replies are simulated separately. */
export async function externalAgent() {
  const { mcp: url } = JSON.parse(
    await readFile(
      join(process.env['TASTIR_STUDIO_DIR']!, '.service.json'),
      'utf8',
    ),
  ) as { mcp: string };
  let session: string | undefined;
  let id = 0;
  async function request(
    method: string,
    params: unknown,
    notification = false,
  ) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-03-26',
        ...(session ? { 'Mcp-Session-Id': session } : {}),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        ...(notification ? {} : { id: ++id }),
        method,
        params,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok)
      throw new Error(`MCP request failed (${response.status}).`);
    session = response.headers.get('mcp-session-id') ?? session;
    if (notification) return undefined;
    const text = await response.text();
    const messages = response.headers
      .get('content-type')
      ?.includes('text/event-stream')
      ? text
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => JSON.parse(line.slice(5)))
      : [JSON.parse(text)];
    const reply = messages.find(
      (message: { id?: number }) => message.id === id,
    ) as
      | {
          result?: unknown;
          error?: { message: string };
        }
      | undefined;
    if (!reply || reply.error)
      throw new Error(reply?.error?.message ?? 'MCP reply missing.');
    return reply.result;
  }
  await request('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'm2-external-agent', version: '1.0' },
  });
  await request('notifications/initialized', {}, true);
  return {
    async call(name: string, args: Record<string, unknown>) {
      const result = (await request('tools/call', {
        name,
        arguments: args,
      })) as {
        isError?: boolean;
        content: { type: string; text?: string; data?: string }[];
      };
      const text = result.content
        .filter((item) => item.type === 'text')
        .map((item) => item.text ?? '')
        .join('\n');
      return {
        error: result.isError === true,
        content: result.content,
        text,
        json: () => JSON.parse(text) as Record<string, unknown>,
      };
    },
    async close() {
      if (session)
        await fetch(url, {
          method: 'DELETE',
          headers: {
            'Mcp-Session-Id': session,
            'MCP-Protocol-Version': '2025-03-26',
          },
          signal: AbortSignal.timeout(5000),
        });
    },
  };
}

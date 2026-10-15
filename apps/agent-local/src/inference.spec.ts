import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SnapshotShape } from '@tastir/agent-protocol';
import { StateStore } from './store.js';
import { ChatGPTAuth } from './auth.js';
import { AgentRuntime, completedResponse } from './inference.js';

const snapshot = SnapshotShape.parse({
  id: 'view',
  documentId: 'pattern',
  documentRevision: '1',
  viewRevision: 'camera-1',
  title: 'Test',
  selected: 'O',
  targets: [{ id: 'O', kind: 'point', geometry: {} }],
  image: 'data:image/png;base64,AAAA',
});
const tool = {
  type: 'function_call',
  namespace: 'tastir',
  name: 'highlight_target',
  call_id: 'call-1',
  arguments: JSON.stringify({
    snapshotId: 'view',
    targetId: 'O',
    label: 'Center',
  }),
};
const frame = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;
const stream = (output: unknown[]) =>
  new Response(
    frame({
      type: 'response.completed',
      response: { status: 'completed', output },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
let directory: string;
let store: StateStore;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tastir-inference-'));
  store = await StateStore.open(directory);
  await store.update((s) => ({
    ...s,
    activeId: 'profile',
    profiles: [
      {
        id: 'profile',
        clientId: 'client',
        subject: 'owner',
        tokens: {
          accessToken: 'secret',
          scopes: ['chatgpt.tokens.use.direct'],
          expiresAt: Date.now() + 3600_000,
        },
      },
    ],
  }));
});
afterEach(async () => {
  await store.close();
  await rm(directory, { recursive: true, force: true });
});

describe('completed streaming responses', () => {
  it('does not accept tool arguments from an interrupted stream', async () => {
    const response = new Response(
      frame({ type: 'response.output_item.done', item: tool }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
    await expect(completedResponse(response)).rejects.toMatchObject({
      code: 'stream_interrupted',
    });
  });
  it('recognizes late usage-limit and incomplete errors', async () => {
    const response = new Response(
      frame({ type: 'response.output_item.done', item: tool }) +
        frame({
          type: 'response.failed',
          response: {
            error: { code: 'subscription_sharing_usage_limit_exceeded' },
          },
        }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
    await expect(completedResponse(response)).rejects.toMatchObject({
      code: 'usage_limit',
    });
    await expect(
      completedResponse(
        new Response(frame({ type: 'response.incomplete' }), {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      ),
    ).rejects.toMatchObject({ code: 'inference_failed' });
  });
  it('handles split UTF-8 and CRLF frames', async () => {
    const bytes = new TextEncoder().encode(
      frame({
        type: 'response.completed',
        response: {
          status: 'completed',
          output: [
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'مركز' }],
            },
          ],
        },
      }).replace(/\n/g, '\r\n'),
    );
    const response = new Response(
      new ReadableStream({
        start(controller) {
          for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
          controller.close();
        },
      }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
    expect(await completedResponse(response)).toHaveLength(1);
  });
});

describe('image and tool execution loop', () => {
  it('an old cancellation cannot stop the next request in the same tab', async () => {
    const send = vi.fn<typeof fetch>().mockImplementation(async (url) =>
      String(url).endsWith('/models')
        ? Response.json({
            models: [
              { slug: 'model', display_name: 'Model', visibility: 'list' },
            ],
          })
        : stream([tool]),
    );
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    try {
      const previous = await runtime.start(
        'tab',
        'model',
        'Point',
        snapshot,
        new AbortController().signal,
      );
      const next = await runtime.start(
        'tab',
        'model',
        'Point again',
        snapshot,
        new AbortController().signal,
      );
      runtime.cancel(previous.runId, 'tab');
      expect(
        (
          await runtime.resume(
            'tab',
            next.runId,
            [{ callId: 'call-1', ok: true, message: 'Displayed' }],
            new AbortController().signal,
          )
        ).runId,
      ).toBe(next.runId);
    } finally {
      runtime.cancelAll();
    }
  });
  it('waits for browser acknowledgement and sends the result in explicit history', async () => {
    const bodies: Record<string, unknown>[] = [];
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/models'))
        return Response.json({
          models: [
            {
              slug: 'available',
              display_name: 'Available',
              visibility: 'list',
            },
          ],
        });
      const data = JSON.parse(String(init!.body));
      bodies.push(data);
      return bodies.length === 1
        ? stream([tool])
        : stream([
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'Here is the center.' }],
            },
          ]);
    });
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    try {
      const first = await runtime.start(
        'tab',
        'available',
        'Point at O',
        snapshot,
        new AbortController().signal,
      );
      expect(bodies).toHaveLength(1);
      expect(first.calls[0]!.arguments.targetId).toBe('O');
      expect(bodies[0]).toMatchObject({ store: false, stream: true });
      expect(JSON.stringify(bodies[0])).toContain(snapshot.image);
      expect(bodies[0]).not.toHaveProperty('previous_response_id');
      await expect(
        runtime.resume(
          'different-tab',
          first.runId,
          [{ callId: 'call-1', ok: true, message: 'Displayed' }],
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({ code: 'run_missing' });
      await expect(
        runtime.resume(
          'tab',
          first.runId,
          [{ callId: 'wrong', ok: true, message: 'Displayed' }],
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({ code: 'invalid_tool_results' });
      const final = await runtime.resume(
        'tab',
        first.runId,
        [{ callId: 'call-1', ok: true, message: 'Displayed' }],
        new AbortController().signal,
      );
      expect(final).toMatchObject({ text: 'Here is the center.', calls: [] });
      expect(bodies[1]!['input']).toContainEqual({
        type: 'function_call_output',
        call_id: 'call-1',
        output: JSON.stringify({
          callId: 'call-1',
          ok: true,
          message: 'Displayed',
        }),
      });
      await expect(
        runtime.resume('tab', first.runId, [], new AbortController().signal),
      ).rejects.toMatchObject({ code: 'run_missing' });
    } finally {
      runtime.cancelAll();
    }
  });
  it('rejects unavailable models before sending inference', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ models: [] }));
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    await expect(
      runtime.start(
        'tab',
        'missing',
        'Question',
        snapshot,
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'model_unavailable' });
    expect(send).toHaveBeenCalledTimes(1);
    runtime.cancelAll();
  });
  it('cannot continue a stopped request', async () => {
    const send = vi.fn<typeof fetch>().mockImplementation(async (url) =>
      String(url).endsWith('/models')
        ? Response.json({
            models: [
              { slug: 'model', display_name: 'Model', visibility: 'list' },
            ],
          })
        : stream([tool]),
    );
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    const reply = await runtime.start(
      'tab',
      'model',
      'Point',
      snapshot,
      new AbortController().signal,
    );
    runtime.cancelTab('tab');
    await expect(
      runtime.resume(
        'tab',
        reply.runId,
        [{ callId: 'call-1', ok: true, message: 'Displayed' }],
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'run_missing' });
  });
});

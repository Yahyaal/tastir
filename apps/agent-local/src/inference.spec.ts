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
// Matches the live route: no Content-Type, finalized items, empty terminal output.
const sparseStream = (output: unknown[]) =>
  new Response(
    new TextEncoder().encode(
      output
        .map((item, output_index) =>
          frame({ type: 'response.output_item.done', output_index, item }),
        )
        .join('') +
        frame({
          type: 'response.completed',
          response: { status: 'completed', output: [] },
        }),
    ),
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
  it('retains finalized items when the completed event has an empty output array', async () => {
    const reasoning = {
      type: 'reasoning',
      encrypted_content: 'opaque-continuation',
    };
    const response = new Response(
      frame({
        type: 'response.output_item.done',
        output_index: 1,
        item: tool,
      }) +
        frame({
          type: 'response.output_item.done',
          output_index: 0,
          item: reasoning,
        }) +
        frame({
          type: 'response.completed',
          response: { status: 'completed', output: [] },
        }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
    expect(await completedResponse(response)).toEqual([reasoning, tool]);
  });
  it('uses the completed output without duplicating finalized item events', async () => {
    const response = new Response(
      frame({
        type: 'response.output_item.done',
        output_index: 0,
        item: tool,
      }) +
        frame({
          type: 'response.completed',
          response: { status: 'completed', output: [tool] },
        }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
    expect(await completedResponse(response)).toEqual([tool]);
  });
  it('rejects a gap in finalized output before releasing any calls', async () => {
    const response = new Response(
      frame({
        type: 'response.output_item.done',
        output_index: 1,
        item: tool,
      }) +
        frame({
          type: 'response.completed',
          response: { status: 'completed', output: [] },
        }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
    await expect(completedResponse(response)).rejects.toMatchObject({
      code: 'invalid_stream',
    });
  });
  it('accepts a completed event stream when the response omits Content-Type', async () => {
    // The live ChatGPT plan route returned HTTP 200 and SSE frames without this header.
    const response = stream([tool]);
    response.headers.delete('Content-Type');
    expect(await completedResponse(response)).toEqual([tool]);
  });
  it('still requires completion for an event stream without Content-Type', async () => {
    const response = new Response(
      frame({ type: 'response.output_item.done', output_index: 0, item: tool }),
    );
    response.headers.delete('Content-Type');
    await expect(completedResponse(response)).rejects.toMatchObject({
      code: 'stream_interrupted',
    });
  });
  it('rejects an explicitly incompatible response type', async () => {
    await expect(
      completedResponse(
        new Response(
          frame({
            type: 'response.completed',
            response: { status: 'completed', output: [tool] },
          }),
          { headers: { 'Content-Type': 'text/html' } },
        ),
      ),
    ).rejects.toMatchObject({ code: 'invalid_stream' });
  });
  it('does not accept tool arguments from an interrupted stream', async () => {
    const response = new Response(
      frame({ type: 'response.output_item.done', output_index: 0, item: tool }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
    await expect(completedResponse(response)).rejects.toMatchObject({
      code: 'stream_interrupted',
    });
  });
  it('recognizes late usage-limit and incomplete errors', async () => {
    const response = new Response(
      frame({
        type: 'response.output_item.done',
        output_index: 0,
        item: tool,
      }) +
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
  it('continues a fitted view only with a fresh construction image of the unchanged document', async () => {
    const fit = {
      ...tool,
      name: 'fit_view',
      arguments: JSON.stringify({
        snapshotId: snapshot.id,
        documentRevision: snapshot.documentRevision,
        label: 'Fit drawing',
      }),
    };
    const send = vi.fn<typeof fetch>().mockImplementation(async (url) =>
      String(url).endsWith('/models')
        ? Response.json({
            models: [
              { slug: 'model', display_name: 'Model', visibility: 'list' },
            ],
          })
        : sparseStream([fit]),
    );
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    const signal = new AbortController().signal;
    try {
      const first = await runtime.start(
        'tab',
        'model',
        'Fit the drawing',
        snapshot,
        signal,
      );
      const results = [{ callId: 'call-1', ok: true, message: 'Fitted' }];
      const fresh = {
        ...snapshot,
        id: 'fitted',
        viewRevision: 'fitted-camera',
      };
      for (const bad of [
        undefined,
        snapshot,
        { ...fresh, documentRevision: '2' },
        { ...fresh, documentId: 'other' },
        { ...fresh, mode: 'repeat' as const },
      ])
        await expect(
          runtime.resume('tab', first.runId, results, signal, bad),
        ).rejects.toMatchObject({ code: 'observation_missing' });
      expect(
        (await runtime.resume('tab', first.runId, results, signal, fresh))
          .calls[0]!.name,
      ).toBe('fit_view');
    } finally {
      runtime.cancelAll();
    }
  });
  it.each([
    'edit_segments',
    'construct',
    'set_tile',
    'paint_pattern',
    'travel_history',
  ] as const)(
    'continues %s only with a fresh same-document observation after acknowledgement',
    async (name) => {
      const edit = {
        ...tool,
        name,
        arguments: JSON.stringify({
          snapshotId: snapshot.id,
          documentRevision: snapshot.documentRevision,
          label: 'Draw one side',
          ...(name === 'travel_history'
            ? { direction: 'undo', steps: 1 }
            : name === 'set_tile'
              ? { vertices: ['N', 'E', 'S', 'W'] }
              : name === 'paint_pattern'
                ? {
                    palette: null,
                    colors: [{ typeId: 'square', color: '#2453a6' }],
                  }
                : {
                    add:
                      name === 'construct'
                        ? [
                            {
                              kind: 'circle',
                              name: 'NewCircle',
                              centre: 'O',
                              through: 'A',
                            },
                          ]
                        : [{ from: 'O', to: 'A' }],
                    remove: [],
                  }),
        }),
      };
      const bodies: Record<string, unknown>[] = [];
      const send = vi
        .fn<typeof fetch>()
        .mockImplementation(async (url, init) => {
          if (String(url).endsWith('/models'))
            return Response.json({
              models: [
                { slug: 'model', display_name: 'Model', visibility: 'list' },
              ],
            });
          bodies.push(JSON.parse(String(init!.body)));
          return bodies.length === 1
            ? sparseStream([edit])
            : sparseStream([
                {
                  type: 'message',
                  content: [
                    { type: 'output_text', text: 'The side is drawn.' },
                  ],
                },
              ]);
        });
      const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
      try {
        const first = await runtime.start(
          'tab',
          'model',
          'Draw a side',
          snapshot,
          new AbortController().signal,
        );
        expect(first.calls[0]?.name).toBe(name);
        const results = [
          { callId: 'call-1', ok: true, message: 'Added one side' },
        ];
        await expect(
          runtime.resume(
            'tab',
            first.runId,
            results,
            new AbortController().signal,
          ),
        ).rejects.toMatchObject({ code: 'observation_missing' });
        const fresh = SnapshotShape.parse({
          ...snapshot,
          id: 'view-2',
          documentRevision: '2',
          viewRevision: 'camera-2',
          segments:
            name === 'construct'
              ? []
              : [{ id: 'agentSegment1', from: 'O', to: 'A' }],
          constructions:
            name === 'construct'
              ? [
                  {
                    kind: 'circle',
                    name: 'NewCircle',
                    centre: 'O',
                    through: 'A',
                  },
                ]
              : [],
        });
        await expect(
          runtime.resume(
            'tab',
            first.runId,
            results,
            new AbortController().signal,
            { ...fresh, documentId: 'other' },
          ),
        ).rejects.toMatchObject({ code: 'observation_missing' });
        const final = await runtime.resume(
          'tab',
          first.runId,
          results,
          new AbortController().signal,
          fresh,
        );
        expect(final.text).toBe('The side is drawn.');
        const input = bodies[1]!['input'] as {
          role?: string;
          content?: unknown;
        }[];
        expect(JSON.stringify(input.at(-1))).toContain(
          name === 'construct' ? 'NewCircle' : 'agentSegment1',
        );
        expect(JSON.stringify(input.at(-1))).toContain(fresh.image);
        expect(input.at(-1)?.role).toBe('user');
        expect(input).toContainEqual(
          expect.objectContaining({
            type: 'function_call_output',
            call_id: 'call-1',
          }),
        );
      } finally {
        runtime.cancelAll();
      }
    },
  );
  it('requires the actual navigation destination and supports text-only page continuations', async () => {
    const initial = SnapshotShape.parse({
      ...snapshot,
      screen: {
        route: 'agent',
        title: 'Drawing',
        description: '',
        destinations: [
          { id: 'work', title: 'Your work', route: 'work', kind: 'work' },
        ],
      },
    });
    const navigation = {
      ...tool,
      name: 'navigate',
      arguments: JSON.stringify({
        snapshotId: initial.id,
        documentRevision: initial.documentRevision,
        destinationId: 'work',
        label: 'Open work',
      }),
    };
    const bodies: Record<string, unknown>[] = [];
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/models'))
        return Response.json({
          models: [
            { slug: 'model', display_name: 'Model', visibility: 'list' },
          ],
        });
      bodies.push(JSON.parse(String(init!.body)));
      return bodies.length === 1
        ? sparseStream([navigation])
        : sparseStream([
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'Your work is open.' }],
            },
          ]);
    });
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    const signal = new AbortController().signal;
    try {
      const first = await runtime.start(
        'tab',
        'model',
        'Open Your work',
        initial,
        signal,
      );
      const results = [
        { callId: 'call-1', ok: true, message: 'Displayed Your work' },
      ];
      await expect(
        runtime.resume('tab', first.runId, results, signal),
      ).rejects.toMatchObject({ code: 'observation_missing' });
      const fresh = SnapshotShape.parse({
        ...initial,
        id: 'fresh',
        documentId: 'screen:work',
        documentRevision: 'page:work',
        viewRevision: 'page:work',
        mode: 'screen',
        image: null,
        targets: [],
        screen: { ...initial.screen!, route: 'work' },
      });
      await expect(
        runtime.resume('tab', first.runId, results, signal, {
          ...fresh,
          screen: { ...fresh.screen!, route: 'unknown' },
        }),
      ).rejects.toMatchObject({ code: 'observation_missing' });
      expect(
        (await runtime.resume('tab', first.runId, results, signal, fresh)).text,
      ).toBe('Your work is open.');
      const input = bodies[1]!['input'] as { content?: { type: string }[] }[];
      expect(input.at(-1)?.content?.map((p) => p.type)).toEqual(['input_text']);
      const groups = bodies[1]!['tools'] as { tools: { name: string }[] }[];
      expect(groups[0]!.tools.map((t) => t.name)).toEqual([
        'create_pattern',
        'navigate',
        'highlight_target',
      ]);
    } finally {
      runtime.cancelAll();
    }
  });
  it('allows twelve bounded responses and cancels before a thirteenth inference', async () => {
    let inferences = 0;
    const send = vi.fn<typeof fetch>().mockImplementation(async (url) => {
      if (String(url).endsWith('/models'))
        return Response.json({
          models: [
            { slug: 'model', display_name: 'Model', visibility: 'list' },
          ],
        });
      inferences++;
      return sparseStream([tool]);
    });
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    try {
      const first = await runtime.start(
        'tab',
        'model',
        'Point at O',
        snapshot,
        new AbortController().signal,
      );
      for (let i = 1; i < 12; i++)
        await runtime.resume(
          'tab',
          first.runId,
          [{ callId: 'call-1', ok: true, message: 'Displayed' }],
          new AbortController().signal,
        );
      expect(inferences).toBe(12);
      await expect(
        runtime.resume(
          'tab',
          first.runId,
          [{ callId: 'call-1', ok: true, message: 'Displayed' }],
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({ code: 'run_limit' });
      expect(inferences).toBe(12);
    } finally {
      runtime.cancelAll();
    }
  });
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
      expect(new Headers(init!.headers).get('Accept')).toBe(
        'text/event-stream',
      );
      bodies.push(data);
      return bodies.length === 1
        ? sparseStream([tool])
        : sparseStream([
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
      expect(first.calls[0]).toMatchObject({
        name: 'highlight_target',
        arguments: { targetId: 'O' },
      });
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

describe('review fixes: bounded context and model recovery', () => {
  it('returns invalid calls to the model and releases only the corrected response', async () => {
    const bodies: Record<string, unknown>[] = [];
    let inference = 0;
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/models'))
        return Response.json({
          models: [
            { slug: 'model', display_name: 'Model', visibility: 'list' },
          ],
        });
      bodies.push(JSON.parse(String(init?.body)));
      return stream([
        ++inference === 1 ? { ...tool, arguments: '{invalid' } : tool,
      ]);
    });
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    try {
      const result = await runtime.start(
        'tab',
        'model',
        'Point at O',
        snapshot,
        new AbortController().signal,
      );
      expect(result.calls).toHaveLength(1);
      expect(inference).toBe(2);
      expect(bodies[1]?.input).toContainEqual(
        expect.objectContaining({
          type: 'function_call_output',
          call_id: 'call-1',
          output: expect.stringContaining('invalid tool arguments'),
        }),
      );
    } finally {
      runtime.cancelAll();
    }
  });
  it('stops repeated malformed model calls with an assistant error, without executing any', async () => {
    const send = vi.fn<typeof fetch>().mockImplementation(async (url) =>
      String(url).endsWith('/models')
        ? Response.json({
            models: [
              { slug: 'model', display_name: 'Model', visibility: 'list' },
            ],
          })
        : stream([{ ...tool, arguments: '{}' }]),
    );
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    await expect(
      runtime.start(
        'tab',
        'model',
        'Point',
        snapshot,
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'invalid_model_tool' });
    runtime.cancelAll();
  });
  it('keeps text context per tab, caches the catalog and retains only the newest observation image', async () => {
    const bodies: Record<string, unknown>[] = [];
    let inference = 0;
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/models'))
        return Response.json({
          models: [
            { slug: 'model', display_name: 'Model', visibility: 'list' },
          ],
        });
      bodies.push(JSON.parse(String(init?.body)));
      return stream(
        ++inference === 1
          ? [tool]
          : [
              {
                type: 'message',
                role: 'assistant',
                content: [{ type: 'output_text', text: 'The centre is O.' }],
              },
            ],
      );
    });
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    const signal = new AbortController().signal;
    try {
      const first = await runtime.start(
        'tab',
        'model',
        'Find the centre',
        snapshot,
        signal,
      );
      await runtime.resume(
        'tab',
        first.runId,
        [{ callId: 'call-1', ok: true, message: 'Highlighted' }],
        signal,
        { ...snapshot, id: 'fresh', image: 'data:image/png;base64,BBBB' },
      );
      expect(JSON.stringify(bodies[1])).not.toContain(
        'data:image/png;base64,AAAA',
      );
      expect(JSON.stringify(bodies[1])).toContain('data:image/png;base64,BBBB');
      await runtime.start(
        'tab',
        'model',
        'Point at it again',
        snapshot,
        signal,
      );
      expect(JSON.stringify(bodies[2])).toContain('Find the centre');
      expect(JSON.stringify(bodies[2])).toContain('The centre is O.');
      expect(JSON.stringify(bodies[2])).not.toContain(
        'data:image/png;base64,BBBB',
      );
      await runtime.start(
        'other-tab',
        'model',
        'New context',
        snapshot,
        signal,
      );
      expect(JSON.stringify(bodies[3])).not.toContain('Find the centre');
      expect(
        send.mock.calls.filter(([url]) => String(url).endsWith('/models')),
      ).toHaveLength(1);
    } finally {
      runtime.cancelAll();
    }
  });
  it('clears one conversation without removing another tab’s text', async () => {
    const bodies: Record<string, unknown>[] = [];
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/models'))
        return Response.json({
          models: [
            { slug: 'model', display_name: 'Model', visibility: 'list' },
          ],
        });
      bodies.push(JSON.parse(String(init?.body)));
      return stream([
        {
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: 'A remembered reply.' }],
        },
      ]);
    });
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    const signal = new AbortController().signal;
    try {
      await runtime.start(
        'tab',
        'model',
        'First private request',
        snapshot,
        signal,
      );
      await runtime.start(
        'other',
        'model',
        'Other tab request',
        snapshot,
        signal,
      );
      runtime.resetConversation('tab');
      await runtime.start('tab', 'model', 'New conversation', snapshot, signal);
      expect(JSON.stringify(bodies.at(-1))).not.toContain(
        'First private request',
      );
      await runtime.start(
        'other',
        'model',
        'Continue other tab',
        snapshot,
        signal,
      );
      expect(JSON.stringify(bodies.at(-1))).toContain('Other tab request');
    } finally {
      runtime.cancelAll();
    }
  });
  it('requires a fresh normal editor after creation and allows saving without a fake document edit', async () => {
    const bodies: Record<string, unknown>[] = [];
    let turns = 0;
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/models'))
        return Response.json({
          models: [
            { slug: 'model', display_name: 'Model', visibility: 'list' },
          ],
        });
      bodies.push(JSON.parse(String(init?.body)));
      turns++;
      if (turns === 1 || turns === 2)
        return stream([
          {
            type: 'function_call',
            namespace: 'tastir',
            call_id: 'edit',
            name: turns === 1 ? 'create_pattern' : 'save_work',
            arguments: JSON.stringify({
              snapshotId: turns === 1 ? snapshot.id : 'editor',
              documentRevision:
                turns === 1 ? snapshot.documentRevision : 'editor-r',
              label: 'Named copy',
              name: 'A new pattern',
            }),
          },
        ]);
      return stream([
        {
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: 'Saved.' }],
        },
      ]);
    });
    const runtime = new AgentRuntime(new ChatGPTAuth(store, send), send);
    const signal = new AbortController().signal;
    const editor = SnapshotShape.parse({
      ...snapshot,
      id: 'editor',
      documentId: 'screen:edit/p',
      documentRevision: 'editor-r',
      mode: 'screen',
      editor: { steps: [], autoSaved: true },
      canSave: true,
      screen: {
        route: 'edit/p',
        title: 'A new pattern',
        description: '',
        destinations: [
          {
            id: 'editor:p',
            title: 'A new pattern',
            kind: 'editor',
            route: 'edit/p',
          },
        ],
      },
    });
    try {
      const first = await runtime.start(
        'tab',
        'model',
        'Create and save a new pattern',
        snapshot,
        signal,
      );
      await expect(
        runtime.resume(
          'tab',
          first.runId,
          [{ callId: 'edit', ok: true, message: 'Created' }],
          signal,
        ),
      ).rejects.toMatchObject({ code: 'observation_missing' });
      const second = await runtime.resume(
        'tab',
        first.runId,
        [{ callId: 'edit', ok: true, message: 'Created' }],
        signal,
        editor,
      );
      expect(second.calls[0]?.name).toBe('save_work');
      const tools = bodies[1]!['tools'] as { tools: { name: string }[] }[];
      expect(tools[0]!.tools.map((t) => t.name)).toEqual(
        expect.arrayContaining([
          'apply_steps',
          'edit_segments',
          'travel_history',
          'save_work',
        ]),
      );
      expect(tools[0]!.tools.map((t) => t.name)).not.toContain('paint_targets');
      const last = await runtime.resume(
        'tab',
        first.runId,
        [{ callId: 'edit', ok: true, message: 'Saved a new copy' }],
        signal,
        { ...editor, id: 'saved' },
      );
      expect(last.text).toBe('Saved.');
    } finally {
      runtime.cancelAll();
    }
  });
});

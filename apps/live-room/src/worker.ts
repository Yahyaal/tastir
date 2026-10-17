import { DurableObject } from 'cloudflare:workers';
import { ROOM_PROTOCOL, MAX_TOKEN_LENGTH, validProject } from './protocol.js';
import {
  verifyClaims,
  validSecret,
  type Claims,
  type SubscribeClaims,
} from './signing.js';

export interface RoomEnv {
  ROOMS: DurableObjectNamespace<ProjectRoom>;
  LIVE_ROOM_SECRET: string;
  /** Comma-separated exact Studio origins; never a wildcard. */
  STUDIO_ORIGINS: string;
}
function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
function failure(status: number): Response {
  return json(
    { error: status === 503 ? 'Room unavailable' : 'Request refused' },
    status,
  );
}
function route(request: Request): { project: string; action: string } | null {
  const url = new URL(request.url);
  const match = /^\/projects\/([^/]+)\/(connect|revisions)$/.exec(url.pathname);
  return !url.search && match && validProject(match[1])
    ? { project: match[1], action: match[2]! }
    : null;
}
async function authorize(
  request: Request,
  env: RoomEnv,
): Promise<Claims | Response> {
  if (!validSecret(env.LIVE_ROOM_SECRET)) return failure(503);
  const target = route(request);
  if (!target) return failure(404);
  let token: string;
  if (target.action === 'connect') {
    if (request.method !== 'GET') return failure(405);
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket')
      return failure(426);
    const origin = request.headers.get('Origin');
    if (
      !origin ||
      !env.STUDIO_ORIGINS?.split(',')
        .map((s) => s.trim())
        .includes(origin)
    )
      return failure(403);
    const protocols = request.headers.get('Sec-WebSocket-Protocol');
    if (!protocols || protocols.length > MAX_TOKEN_LENGTH + 64)
      return failure(403);
    const values = protocols.split(',').map((p) => p.trim());
    if (values.length !== 2 || !values.includes(ROOM_PROTOCOL))
      return failure(403);
    token = values.find((p) => p.startsWith('ticket.'))?.slice(7) ?? '';
  } else {
    if (request.method !== 'POST') return failure(405);
    if (request.headers.has('Origin')) return failure(403);
    token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
  }
  const claims = await verifyClaims(env.LIVE_ROOM_SECRET, token);
  if (
    !claims ||
    claims.project !== target.project ||
    claims.purpose !==
      (target.action === 'connect' ? 'subscribe' : 'revision') ||
    (claims.purpose === 'subscribe' &&
      claims.origin !== request.headers.get('Origin'))
  )
    return failure(403);
  return claims;
}

export default {
  async fetch(request: Request, env: RoomEnv): Promise<Response> {
    if (
      new URL(request.url).pathname === '/health' &&
      request.method === 'GET'
    ) {
      return validSecret(env.LIVE_ROOM_SECRET)
        ? json({ ok: true, service: 'tastir-live-room' })
        : failure(503);
    }
    // Authenticate before even creating/looking up the project room.
    const claims = await authorize(request, env);
    if (claims instanceof Response) return claims;
    return env.ROOMS.get(env.ROOMS.idFromName(claims.project)).fetch(request);
  },
} satisfies ExportedHandler<RoomEnv>;

export class ProjectRoom extends DurableObject<RoomEnv> {
  constructor(ctx: DurableObjectState, env: RoomEnv) {
    super(ctx, env);
    // Runtime answers these without waking the object. No instance timers or socket maps.
    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('ping', 'pong'),
    );
  }
  private activeSockets(): WebSocket[] {
    return this.ctx.getWebSockets().filter((socket) => {
      if (socket.readyState !== WebSocket.OPEN) return false;
      const claims = socket.deserializeAttachment() as SubscribeClaims | null;
      if (!claims || claims.expiresAt <= Math.floor(Date.now() / 1000)) {
        socket.close(4001, 'Ticket expired');
        return false;
      }
      return true;
    });
  }
  override async fetch(request: Request): Promise<Response> {
    // The object repeats validation, so there is no unsigned internal publish path.
    return this.ctx.blockConcurrencyWhile(async () => {
      const claims = await authorize(request, this.env);
      if (claims instanceof Response) return claims;
      const last = (await this.ctx.storage.get<number>('revision')) ?? 0;
      const sockets = this.activeSockets();
      if (claims.purpose === 'subscribe') {
        if (sockets.length >= 32) return failure(429);
        const pair = new WebSocketPair();
        this.ctx.acceptWebSocket(pair[1]);
        pair[1].serializeAttachment(claims);
        pair[1].send(
          JSON.stringify({
            type: 'ready',
            project: claims.project,
            revision: last,
          }),
        );
        return new Response(null, {
          status: 101,
          webSocket: pair[0],
          headers: { 'Sec-WebSocket-Protocol': ROOM_PROTOCOL },
        });
      }
      if (claims.revision <= last)
        return json({ accepted: false, revision: last });
      await this.ctx.storage.put('revision', claims.revision);
      const message = JSON.stringify({
        type: 'revision',
        project: claims.project,
        revision: claims.revision,
      });
      // Recheck leases after the storage await, immediately before delivery.
      for (const socket of this.activeSockets()) {
        try {
          socket.send(message);
        } catch {
          try {
            socket.close(1011, 'Reconnect');
          } catch {
            /* Already gone. */
          }
        }
      }
      return json({ accepted: true, revision: claims.revision }, 202);
    });
  }
  override webSocketMessage(socket: WebSocket): void {
    // Pages only subscribe; all revision hints must come from a signed server request.
    socket.close(1008, 'Subscribers cannot publish');
  }
  override webSocketClose(socket: WebSocket, code: number): void {
    socket.close([1005, 1006, 1015].includes(code) ? 1000 : code);
  }
  override webSocketError(socket: WebSocket): void {
    socket.close(1011, 'Reconnect');
  }
}

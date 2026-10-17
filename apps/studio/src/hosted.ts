import express, { type Request, type Response } from 'express';
import {
  createOAuthMetadata,
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthRouter,
} from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { StudioAuth } from './auth.js';
import { mcpSessions } from './http.js';
import { createMcpServer } from './mcp.js';
import { Owner, type OwnerOptions } from './owner.js';
import type { Db } from './pg.js';
import { DirectClient } from './routes.js';
import type { Studio } from './studio.js';

/**
 * The hosted studio as one Express app, which Vercel runs as a function:
 * agents connect at /mcp after signing in with OAuth, the owner signs in
 * with Google and approves each app once, and /connections lists them.
 */
export interface HostedOptions extends Omit<OwnerOptions, 'baseUrl'> {
  readonly studio: Studio;
  readonly db: Db;
  readonly baseUrl: URL;
  /** More redirect addresses to allow, for tests. */
  readonly redirects?: readonly string[];
}

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

function page(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Tastir studio</title><style>
:root{--paper:#fbf8f3;--ink:#1c2733;--muted:#5c6773;--line:#d9d1c4;--accent:#17676b;--danger:#a3341f}
@media (prefers-color-scheme:dark){:root{--paper:#141b22;--ink:#ece6da;--muted:#a8b0b8;--line:#33404c;--accent:#5fb3b0;--danger:#e38b73}}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
main{max-width:34rem;margin:0 auto;padding:2rem 16px}h1{font-size:1.4rem}
button,input{font:inherit}button{padding:.5rem 1rem;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:var(--paper);cursor:pointer}
button.quiet{background:none;color:var(--accent)}button.danger{border-color:var(--danger);background:none;color:var(--danger)}
ul{list-style:none;padding:0}li{border-top:1px solid var(--line);padding:.8rem 0;display:grid;gap:.4rem}
form.row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}input{padding:.4rem;border:1px solid var(--line);border-radius:6px;background:none;color:inherit;min-width:0;flex:1 1 10rem}
.muted{color:var(--muted);font-size:.9em}
</style></head><body><main>${body}</main></body></html>`;
}

export function hostedApp(options: HostedOptions) {
  const { studio, baseUrl } = options;
  const auth = new StudioAuth({ db: options.db, redirects: options.redirects });
  const owner = new Owner(options);
  const mcpUrl = new URL('/mcp', baseUrl);
  const client = new DirectClient(studio);
  // Each connection's name is read on every request, so a rename shows on
  // its next edit; its id never changes.
  const identities = new Map<string, { name: string; actor: string }>();
  const sessions = mcpSessions((request) => {
    const info = (request as Request).auth;
    const actor = String(info?.extra?.['connection'] ?? '');
    const name = String(info?.extra?.['name'] ?? 'agent');
    const identity = identities.get(actor) ?? { name, actor };
    identity.name = name;
    identities.set(actor, identity);
    return { server: () => createMcpServer(client, identity), owner: actor };
  });

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // The SDK's metadata, plus support for client id metadata documents.
  const metadata = {
    ...createOAuthMetadata({
      provider: auth,
      issuerUrl: baseUrl,
      scopesSupported: ['studio'],
    }),
    client_id_metadata_document_supported: true,
  };
  app.get('/.well-known/oauth-authorization-server', (_request, response) => {
    response.json(metadata);
  });
  app.use(
    mcpAuthRouter({
      provider: auth,
      issuerUrl: baseUrl,
      scopesSupported: ['studio'],
      resourceName: 'Tastir studio',
      resourceServerUrl: mcpUrl,
    }),
  );

  app.all(
    '/mcp',
    requireBearerAuth({
      verifier: auth,
      resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpUrl),
    }),
    (request, response) => void sessions.handle(request, response),
  );

  const signedIn = async (request: Request, response: Response) => {
    const who = await owner.who(request);
    if (!who)
      response.redirect(
        `/login?next=${encodeURIComponent(request.originalUrl)}`,
      );
    return who;
  };
  const form = express.urlencoded({ extended: false, limit: '8kb' });
  const checked = (request: Request, response: Response) => {
    if (request.body?.csrf !== owner.csrf(request)) {
      response.status(403).type('text/plain').send('This form has expired.');
      return false;
    }
    return true;
  };

  app.get('/login', (request, response) => void owner.login(request, response));
  app.get(
    '/auth/google',
    (request, response) => void owner.callback(request, response),
  );
  app.post('/logout', form, async (request, response) => {
    if (checked(request, response)) owner.logout(response);
  });

  app.get('/consent', async (request, response) => {
    if (!(await signedIn(request, response))) return;
    const id = String(request.query['request'] ?? '');
    const found = await auth.pending(id);
    if (!found) {
      response
        .status(404)
        .send(
          page(
            'Sign-in expired',
            '<h1>This sign-in has expired</h1><p>Start again from the app.</p>',
          ),
        );
      return;
    }
    const name = escape(found.client.client_name ?? 'An app');
    const back = escape(new URL(found.request.redirect).host);
    response.send(
      page(
        'Allow access',
        `<h1>Allow ${name} to work on your studio projects?</h1>
<p>It will be able to read and change every project, and leave notes and questions. You can remove it at any time on the Connections page.</p>
<p class="muted">It returns to ${back}.</p>
<form method="post" action="/consent" class="row">
<input type="hidden" name="request" value="${escape(id)}"><input type="hidden" name="csrf" value="${owner.csrf(request)}">
<button name="decision" value="allow">Allow</button><button name="decision" value="deny" class="quiet">Deny</button>
</form>`,
      ),
    );
  });
  app.post('/consent', form, async (request, response) => {
    if (!(await signedIn(request, response)) || !checked(request, response))
      return;
    const back = await auth.decide(
      String(request.body.request ?? ''),
      request.body.decision === 'allow',
    );
    if (!back) {
      response
        .status(404)
        .send(
          page(
            'Sign-in expired',
            '<h1>This sign-in has expired</h1><p>Start again from the app.</p>',
          ),
        );
      return;
    }
    response.redirect(back);
  });

  app.get('/connections', async (request, response) => {
    if (!(await signedIn(request, response))) return;
    const csrf = owner.csrf(request);
    const list = await auth.connections();
    const items = list
      .map(
        (c) => `<li><strong>${escape(c.name)}</strong>
<span class="muted">Connected ${c.created.toISOString().slice(0, 10)}, ${c.used ? `last used ${c.used.toISOString().slice(0, 16).replace('T', ' ')} UTC` : 'not used yet'}</span>
<form method="post" action="/connections/${escape(c.id)}" class="row">
<input type="hidden" name="csrf" value="${csrf}"><input name="name" value="${escape(c.name)}" aria-label="Name for ${escape(c.name)}" maxlength="60">
<button name="action" value="rename" class="quiet">Rename</button><button name="action" value="revoke" class="danger">Remove</button>
</form></li>`,
      )
      .join('');
    response.send(
      page(
        'Connections',
        `<h1>Connections</h1><p>The apps you allowed to work on your studio projects. Removing one stops it at once.</p>
<ul>${items || '<li class="muted">No apps are connected yet.</li>'}</ul>
<form method="post" action="/logout"><input type="hidden" name="csrf" value="${csrf}"><button class="quiet">Sign out</button></form>`,
      ),
    );
  });
  app.post('/connections/:id', form, async (request, response) => {
    if (!(await signedIn(request, response)) || !checked(request, response))
      return;
    const id = String(request.params['id']);
    if (request.body.action === 'revoke') await auth.revoke(id);
    else await auth.rename(id, String(request.body.name ?? ''));
    response.redirect(303, '/connections');
  });

  return { app, auth, close: () => sessions.close() };
}

# Set up the hosted Studio (H5)

Use the checkout with **H4, H7 and this preparation branch merged**. An agent must finish the [Vercel packaging checks](STUDIO-VERCEL-AUDIT.md) before the first real deployment. H5 stays unchecked until the deployed save/redeploy/export checks pass.

1. **Create Neon.** Choose the **Free** plan and **AWS US East (Ohio), `aws-us-east-2`** when creating the project. Keep the default database/role. In **Connect**, choose the pooled **postgres.js** connection string. Save it privately as `TASTIR_STUDIO_DATABASE_URL`. Set its `sslmode` to `verify-full`; remove `channel_binding` if supplied (that libpq option is not implemented by our postgres.js driver). Keep the password URL-encoded. [Neon regions](https://neon.com/docs/introduction/regions).

2. **Create Vercel.** On the Hobby plan, import **`Yahyaal/tastir`** from GitHub. Use the repository root (`.`), **Other** framework, **Node.js 22.x**, and production branch **`main`**. The merged `vercel.json` owns the build/install commands and output directory (`dist/studio-hosted`); functions belong in Cleveland (`cle1`). An agent must verify the pinned pnpm install and function packaging described in the audit. Record the stable production address, `https://<site>`; initial setup is not ready for use until step 9. [Project settings](https://vercel.com/docs/project-configuration/project-settings).

3. **Create private photo storage.** In that Vercel project's **Storage → Create Database → Blob**, choose **Private**, then connect it to the project for **Production**. Save its `BLOB_READ_WRITE_TOKEN` directly in the Vercel environment settings and your private local settings file. The token is required for this H5 setup. [Private Blob setup](https://vercel.com/docs/vercel-blob/private-storage).

4. **Create Google sign-in.** In a Google Cloud project, open **Google Auth Platform**. Set the app name/support email, choose **External / Testing** and add your own Google email as a test user. Create a **Web application** OAuth client. Its **Authorized redirect URI** must be exactly `https://<site>/auth/google`. Save the client ID and client secret privately. The app requests `openid email`; no Drive access is needed. [Google web OAuth setup](https://developers.google.com/identity/protocols/oauth2/web-server).

5. **Generate two signing secrets locally.** From the repo root, this writes two independent keys to an ignored, private file without displaying them. It refuses to overwrite an existing file:

   ```sh
   node -e 'const fs=require("node:fs"),c=require("node:crypto"); fs.writeFileSync(".env.studio-secrets.local",["TASTIR_STUDIO_SESSION_SECRET","LIVE_ROOM_SECRET"].map(k=>k+"="+c.randomBytes(32).toString("hex")).join("\n")+"\n",{mode:0o600,flag:"wx"})'
   ```

   Open the file in your private editor and copy each value directly to the fields below. **Never paste credentials, connection strings or signing keys into a chat, issue or screenshot.**

6. **Fill Vercel's Production environment variables.** Also keep these nine values in an ignored local file, `.env.studio-preflight.local`, using `NAME=value` lines; set its permissions with `chmod 600 .env.studio-preflight.local`. All are server settings; none gets a `VITE_` prefix. Use origins without a trailing slash.

   | Name | Value to paste |
   | --- | --- |
   | `TASTIR_STUDIO_DATABASE_URL` | Neon pooled postgres.js connection string from step 1, with `sslmode=verify-full` |
   | `TASTIR_STUDIO_URL` | Stable `https://<site>` from Vercel |
   | `TASTIR_STUDIO_OWNERS` | Your Google email; comma-separated addresses if more than one |
   | `TASTIR_STUDIO_SESSION_SECRET` | Session key from step 5 |
   | `GOOGLE_CLIENT_ID` | Google's web client ID, ending `.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | The same client's secret |
   | `BLOB_READ_WRITE_TOKEN` | The private store's token from step 3 |
   | `LIVE_ROOM_ORIGIN` | Worker's HTTPS origin, obtained in step 8 |
   | `LIVE_ROOM_SECRET` | Room key from step 5; identical to Cloudflare's secret |

7. **Migrate and run preflight.** Use Node 22 and pnpm 10.30.3. From the merged repo root:

   ```sh
   pnpm install --frozen-lockfile
   node --env-file=.env.studio-preflight.local --conditions=@tastir/source --import tsx tools/studio-db.mts
   pnpm studio:preflight --settings .env.studio-preflight.local
   ```

   Migrate only the new Neon database you selected. Preflight itself is read-only: it checks required settings, HTTPS origins, verified database TLS, migration hashes/timestamps and required tables/columns. It prints names and fixed diagnostics, never values. It exits with code 1 until all checks pass; fill the Worker origin after step 8 and rerun. Existing terminal environment variables take precedence over the file, so clear old local overrides. A green check does not authenticate Google/Blob or compare Cloudflare's stored key; step 9 does that.

8. **Set up the live room.** Create a Cloudflare account on **Workers Free**. After H7 is merged, sign in and deploy from the repo root, replacing only the nonsecret site origin:

   ```sh
   pnpm --filter @tastir/live-room exec wrangler login
   pnpm --filter @tastir/live-room exec wrangler deploy --var 'STUDIO_ORIGINS:https://<site>'
   pnpm --filter @tastir/live-room exec wrangler secret put LIVE_ROOM_SECRET
   ```

   Paste the room key directly into Wrangler's hidden prompt, matching Vercel's `LIVE_ROOM_SECRET`. Copy the deployed Worker's HTTPS origin into `LIVE_ROOM_ORIGIN` in Vercel and the private local file. The initial Worker fails closed until the key is set. Keep the SQLite-backed migration and repeat the `STUDIO_ORIGINS` override on future deployments; H7's checked-in defaults are local-only. Cloudflare's account ID is selected by login; it is not a Studio environment variable. [Durable Objects setup](https://developers.cloudflare.com/durable-objects/get-started/), [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

9. **Validate and deploy Studio.** Rerun preflight. An agent links the existing Vercel project, pulls its settings and runs `vercel build --prod` and the artifact checks in the audit, then deploys the reviewed build. Redeploy after changing environment settings. Open `https://<site>/login`, finish Google sign-in and confirm your drawing list opens. Confirm anonymous project requests return 401, while OAuth discovery is reachable by agents; Vercel's deployment protection must allow the production MCP/OAuth routes through to the app's own authentication. Upload/read a private photo and request an actual server PNG to verify Blob and the native renderer.

10. **Check persistence and recovery.** Save and color a project, reload it, redeploy Studio and reopen it. Export it and open the export in the local Studio with the same colors. Have an agent edit while the page is open, then test with the room unavailable. Record the deployed timing and free usage in H6; H7's week-long acceptance remains there. Secrets stay in provider settings and private local files, never in the test report.

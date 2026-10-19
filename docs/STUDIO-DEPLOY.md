# Put the studio online

This walks you through putting the studio on the internet, so you can use it from your phone or any computer and connect chat apps like claude.ai to it. You create four free accounts and copy a few values into one private file. Then you tell Claude "the setup is done", and Claude deploys and checks everything.

- **How long:** about 40 minutes, in one go or in parts.
- **What it costs:** nothing. All four services are free plans, and none asks for a card.
- **What you need:** a browser, a text editor, and a terminal open in your `Tastir` folder.

**Three rules for the whole guide:**

1. Every secret goes into one private file on this computer, `.env.studio-preflight.local`, and into the services' own settings pages. Never paste a secret into a chat (with Claude, Codex or anyone), an issue or a screenshot. When you are done, just say "done".
2. Where this guide says `<your site>`, or shows `tastir-studio.vercel.app` as an example, use your own site's address from Part 2.
3. If a screen looks different from what is described, look for the button with the same name nearby; these sites move things around now and then. If you are stuck, tell Claude which step and what you see (but no secrets).

## Part 0: Get ready (2 minutes)

1. Open a terminal in your `Tastir` folder and bring it up to date:

   ```sh
   git switch main
   git pull
   pnpm install
   ```

2. Make the private settings file:

   ```sh
   pnpm studio:settings
   ```

   This makes `.env.studio-preflight.local` in the `Tastir` folder, with every setting named and two secrets already filled in. Git ignores it, so it is never uploaded. Open it in your text editor and keep it open: you fill in the empty lines as you go through the guide.

## Part 1: The database, on Neon (5 minutes)

Neon keeps your studio projects.

1. Open https://console.neon.tech/signup and sign up. "Continue with Google" or "Continue with GitHub" is quickest.
2. Neon asks you to create your first project. Fill in:
   - **Project name:** `tastir-studio`
   - **Postgres version:** leave as it is.
   - **Cloud provider:** AWS.
   - **Region:** **AWS US East 2 (Ohio)**. This is the nearest to Oklahoma, and the website goes in the same place, so they talk quickly.

   Then click **Create project**.
3. On the project's dashboard, click **Connect** (top right). A box called "Connect to your branch" opens. Leave the choices as they are: branch `production`, database `neondb`, role `neondb_owner`, and **Connection pooling** switched on.
4. The box shows a connection string that starts with `postgresql://`. Click **Show password**, then the copy button next to the string.
5. In your settings file, paste it after `TASTIR_STUDIO_DATABASE_URL=`.
6. Change the end of that line. The string ends with something like:

   ```
   ?sslmode=require&channel_binding=require
   ```

   Replace all of that with:

   ```
   ?sslmode=verify-full
   ```

   That makes the studio check it is really talking to Neon. The other two settings make it skip that check.

   The line now looks like this, with your own values: `TASTIR_STUDIO_DATABASE_URL=postgresql://neondb_owner:abc123@ep-something-pooler.us-east-2.aws.neon.tech/neondb?sslmode=verify-full`

## Part 2: The website, on Vercel (10 minutes)

Vercel runs the website and the server behind it.

1. Open https://vercel.com/signup.
   - Choose **Hobby** (the free plan for personal projects).
   - Type your name.
   - Click **Continue with GitHub**, and allow Vercel to see your GitHub account when GitHub asks.
2. Open https://vercel.com/new. Under **Import Git Repository**, find **tastir** and click **Import**.

   If `tastir` is not in the list, click **Adjust GitHub App Permissions**, give Vercel access to the `tastir` repository, and come back.
3. On the "New Project" page:
   - **Project Name:** `tastir` (or any name you like). This decides your site's address, so if the name is taken Vercel adds a few letters to it.
   - **Root Directory:** leave it as `./`.
   - **Application Preset:** Vercel sees several apps in the repository and may choose **Services**, which lists them and hides the **Deploy** button. Open that dropdown and choose **Other**: the site is one project from the top folder, and the repository's `vercel.json` says how to build it. If **Other** is not offered, click **Import single project** on the row called **app** (marked Vite, with `/`) instead.
   - **Environment Variables:** leave them for now. They come in Part 6.

   Click **Deploy** at the bottom.
4. Vercel builds the site, which takes a few minutes. The studio will not work yet because it has no settings; that is expected. When it finishes, click **Continue to Dashboard**.
5. Find your site's address under **Domains** on the project page, for example `tastir-studio.vercel.app`. In your settings file, put it after `TASTIR_STUDIO_URL=` with `https://` in front and no `/` at the end:

   ```
   TASTIR_STUDIO_URL=https://tastir-studio.vercel.app
   ```

6. Make the private photo storage:
   - On the project page, open the **Storage** tab.
   - Click **Create Database** (it may say **Create Storage**), choose **Blob**, and click **Continue**.
   - Name it `tastir-photos` and set the access to **Private**.
   - Click **Create**. If it asks which environments to connect, leave them all ticked and click **Connect**.

   There is nothing to copy: Vercel connects the store to the site by itself.

## Part 3: Signing in with Google (10 minutes)

This lets you, and only you, sign in to the studio with your Google account.

1. Open https://console.cloud.google.com and sign in with the Google account you want to use for the studio. If it asks you to agree to the terms, agree.
2. Make a project for it:
   - Open https://console.cloud.google.com/projectcreate.
   - **Project name:** `tastir-studio`. Leave the rest.
   - Click **Create**.
   - Wait a few seconds until the notification says it is created, then click **Select Project** in that notification.
   - Check the project name in the bar at the top of the page now says your new project. **Every link below opens whichever project is chosen there**, so if you have other Google Cloud projects, check it again before each step; if it shows another project, click its name and choose the new one.
3. Set up the sign-in screen:
   - Open https://console.cloud.google.com/auth/overview and click **Get started**. If there is no **Get started** button but an overview of an existing app, you are in another project: switch to the new one (step 2) and open the link again.
   - **App name:** `Tastir studio`.
   - **User support email:** choose your own address.
   - Click **Next**.
   - **Audience:** choose **External**. Click **Next**.
   - **Contact information:** type your own address. Click **Next**.
   - Tick that you agree to the policy, click **Continue**, then **Create**.
4. Allow your own account in:
   - Open https://console.cloud.google.com/auth/audience.
   - Under **Test users**, click **Add users**, type your Google address and click **Save**.

   The sign-in stays in "Testing", which means only the people on this list can sign in. That is what you want.
5. Make the sign-in key:
   - Open https://console.cloud.google.com/auth/clients and click **Create client**.
   - **Application type:** **Web application**.
   - **Name:** `Tastir studio`.
   - Under **Authorized redirect URIs**, click **Add URI** and type your site's address followed by `/auth/google`, for example `https://tastir-studio.vercel.app/auth/google`. It must match exactly: `https`, and no `/` at the end.
   - Leave **Authorized JavaScript origins** empty.
   - Click **Create**.
6. A box shows a **Client ID** and a **Client secret**. Copy each into your settings file, after `GOOGLE_CLIENT_ID=` and `GOOGLE_CLIENT_SECRET=`.

   Google shows the secret only once. If you lose it, open the client again from https://console.cloud.google.com/auth/clients and add a new secret.
7. In your settings file, put your Google address after `TASTIR_STUDIO_OWNERS=`. Only addresses listed here can use the studio.

## Part 4: The live room, on Cloudflare (5 minutes)

The live room makes an agent's changes appear on your screen at once.

1. Open https://dash.cloudflare.com/sign-up, sign up with your email and a password, and confirm your email with the link Cloudflare sends. When it offers plans, stay on **Free**.
2. In the terminal, in your `Tastir` folder, let this computer use your Cloudflare account:

   ```sh
   pnpm --filter @tastir/live-room exec wrangler login
   ```

   A browser page opens; click **Allow**. The terminal says you are logged in.
3. Put the live room online. Use your own site's address in place of `https://tastir-studio.vercel.app`:

   ```sh
   pnpm --filter @tastir/live-room exec wrangler deploy --var 'STUDIO_ORIGINS:https://tastir-studio.vercel.app'
   ```

   - **First time only:** Cloudflare asks you to choose a `workers.dev` subdomain, a short name of your own. Type one and press Enter.
   - **When it finishes,** the terminal shows an address like `https://tastir-live-room.yourname.workers.dev`. Copy it into your settings file after `LIVE_ROOM_ORIGIN=`.
4. Give the live room its secret:

   ```sh
   pnpm --filter @tastir/live-room exec wrangler secret put LIVE_ROOM_SECRET
   ```

   When it asks, paste the value after `LIVE_ROOM_SECRET=` in your settings file (the long code that was made for you in Part 0) and press Enter. Nothing shows while you paste; that is normal.

## Part 5: Set up the database and check everything (3 minutes)

1. Create the studio's tables in your new Neon database:

   ```sh
   pnpm studio:setup:db
   ```

   It says "Migrating …" and then "Done."
2. Check every setting:

   ```sh
   pnpm studio:check
   ```

   Each line starts with `OK` or names a problem, and no values are ever shown. Fix any problem it names and run it again, until every line says `OK`.

## Part 6: Copy the settings into Vercel (5 minutes)

1. Open your project on https://vercel.com/dashboard. In the project's left menu (the one with Overview, Deployments and Logs), click **Environment Variables**. It is not under **Settings**; and **Team Settings**, which says "All Projects" at the top, is the wrong place.
2. Copy everything in your settings file. Click into the first **Key** box and paste: Vercel splits it into one row per setting.

   If it does not split, add them one by one. The **Key** is the part before `=`, and the **Value** is the part after.
3. Under **Environments**, choose **Production** only. Click **Save**.
4. Make the site use them: open the **Deployments** tab, click the **⋯** menu on the newest deployment, choose **Redeploy**, and confirm.

## Part 7: Try it

1. Open your site's address. You see Tastir as usual. Everything except the studio works without signing in.
2. Add `/#/studio` to the address (for example `https://tastir-studio.vercel.app/#/studio`). It says "Sign in to use the studio". Click **Sign in with Google** and choose your account.
3. Google may warn "Google hasn't verified this app". That is because the sign-in is yours and in Testing. Click **Continue**.
4. You see the studio's project list.
5. Tell Claude "the studio setup is done". Claude then checks the live site (pictures, photos, agents, the live room) and fixes anything that needs it.

## If something goes wrong

| What you see | What it means and what to do |
| --- | --- |
| Google says **Error 400: redirect_uri_mismatch** | The address in Part 3, step 5 is not exactly `<your site>/auth/google`. Fix it in https://console.cloud.google.com/auth/clients and wait a minute. |
| Google says **Access blocked** or **app is in testing** | Your address is not a test user yet. Add it in Part 3, step 4. |
| The studio says **… may not use this studio** | The Google address you chose is not in `TASTIR_STUDIO_OWNERS`. Fix it in Vercel (Part 6), then redeploy. |
| `pnpm studio:check` names the database | Check the line from Part 1: it must end with `?sslmode=verify-full`, and the address must contain `-pooler`. |
| The Vercel build fails | Open the failed deployment, click **Build Logs**, and tell Claude what the last red lines say. Build logs hold no secrets. |
| You changed a setting in Vercel and nothing changed | Settings only apply after a redeploy (Part 6, step 4). |

The technical checks behind this guide, for agents, are in [the Vercel audit](STUDIO-VERCEL-AUDIT.md).
